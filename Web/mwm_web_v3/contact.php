<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 190;
const MAX_MESSAGE_LENGTH = 5000;
const MIN_FORM_TIME = 3;
const MAX_FORM_TIME = 7200;
const RATE_LIMIT_WINDOW = 3600;
const RATE_LIMIT_MAX = 3;

function redirectTo(string $page): never
{
    header('Location: /' . $page, true, 303);
    exit;
}

function clientIp(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function textLength(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
}

function rateLimitExceeded(string $ip): bool
{
    $directory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'mwm-contact-limit';
    if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) {
        error_log('MwM contact: impossible de créer le dossier de limitation.');
        return false;
    }

    $file = $directory . DIRECTORY_SEPARATOR . hash('sha256', $ip) . '.json';
    $now = time();
    $attempts = [];

    $handle = @fopen($file, 'c+');
    if ($handle === false) {
        return false;
    }

    try {
        if (!flock($handle, LOCK_EX)) {
            return false;
        }

        $contents = stream_get_contents($handle);
        $stored = $contents ? json_decode($contents, true) : [];
        if (is_array($stored)) {
            $attempts = array_values(array_filter(
                $stored,
                static fn ($timestamp): bool => is_int($timestamp) && $timestamp > $now - RATE_LIMIT_WINDOW
            ));
        }

        if (count($attempts) >= RATE_LIMIT_MAX) {
            return true;
        }

        $attempts[] = $now;
        rewind($handle);
        ftruncate($handle, 0);
        fwrite($handle, json_encode($attempts, JSON_THROW_ON_ERROR));
        fflush($handle);
        return false;
    } catch (Throwable $exception) {
        error_log('MwM contact rate limit: ' . $exception->getMessage());
        return false;
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('Méthode non autorisée');
}

// Les robots remplissent souvent ce champ invisible.
if (!empty($_POST['website'])) {
    redirectTo('thanks.html');
}

// Un vrai visiteur ne peut pas raisonnablement envoyer le formulaire en moins de 3 secondes.
$startedAt = filter_input(INPUT_POST, 'form_started', FILTER_VALIDATE_INT);
$elapsed = is_int($startedAt) ? time() - $startedAt : 0;
if ($elapsed < MIN_FORM_TIME || $elapsed > MAX_FORM_TIME) {
    error_log('MwM contact: délai invalide depuis ' . clientIp());
    redirectTo('thanks.html');
}

if (rateLimitExceeded(clientIp())) {
    error_log('MwM contact: limite atteinte pour ' . clientIp());
    redirectTo('thanks.html');
}

$name = trim((string) ($_POST['name'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$offer = trim((string) ($_POST['offer'] ?? 'À déterminer'));
$activity = trim((string) ($_POST['activity'] ?? 'Non précisée'));
$message = trim((string) ($_POST['message'] ?? ''));

$allowedOffers = ['À déterminer', 'One Page', 'Site Vitrine', 'Site Avancé', 'Boutique en ligne', 'Application web'];
if (!in_array($offer, $allowedOffers, true)) {
    $offer = 'À déterminer';
}

if (
    $name === '' || $email === '' || $message === '' ||
    textLength($name) > MAX_NAME_LENGTH ||
    textLength($email) > MAX_EMAIL_LENGTH ||
    textLength($activity) > 150 ||
    textLength($message) > MAX_MESSAGE_LENGTH ||
    !filter_var($email, FILTER_VALIDATE_EMAIL)
) {
    redirectTo('error.html');
}

// Les demandes normales contiennent rarement une grande quantité de liens.
preg_match_all('~(?:https?://|www\.)~i', $message, $links);
if (count($links[0]) > 3) {
    error_log('MwM contact: trop de liens depuis ' . clientIp());
    redirectTo('thanks.html');
}

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = 'localhost';
    $mail->Port = 25;
    $mail->SMTPAuth = false;
    $mail->CharSet = 'UTF-8';

    $mail->setFrom('info@mwm-project.ch', 'MwM Project');
    $mail->addAddress('info@mwm-project.ch');
    $mail->addReplyTo($email, $name);
    $mail->Subject = 'Nouvelle demande — ' . $offer;
    $mail->Body =
        "Nom : {$name}\n" .
        "Email : {$email}\n" .
        "Activité : {$activity}\n" .
        "Offre / besoin : {$offer}\n\n" .
        "Message :\n{$message}";

    $mail->send();
    redirectTo('thanks.html');
} catch (Exception $exception) {
    error_log('Erreur mail MwM : ' . $mail->ErrorInfo);
    redirectTo('error.html');
}
