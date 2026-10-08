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
const RATE_LIMIT_MAX = 5;

header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

function requestedLanguage(): string
{
    return ($_POST['language'] ?? '') === 'en' ? 'en' : 'fr';
}

function redirectToResult(string $result, ?string $language = null): never
{
    $language ??= requestedLanguage();
    $path = $language === 'en' ? '/en/contact' : '/contact';
    header('Location: ' . $path . '?status=' . rawurlencode($result) . '#contact-form', true, 303);
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
    $directory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'hibou-contact-limit';
    if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) {
        error_log('Hibou contact: impossible de creer le dossier de limitation.');
        return false;
    }

    $file = $directory . DIRECTORY_SEPARATOR . hash('sha256', $ip) . '.json';
    $now = time();
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
        $attempts = is_array($stored) ? array_values(array_filter(
            $stored,
            static fn ($timestamp): bool => is_int($timestamp) && $timestamp > $now - RATE_LIMIT_WINDOW
        )) : [];

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
        error_log('Hibou contact rate limit: ' . $exception->getMessage());
        return false;
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('Methode non autorisee');
}

// Les robots remplissent souvent ce champ invisible. On affiche un faux succes.
if (!empty($_POST['website'])) {
    redirectToResult('sent');
}

// Un envoi instantane ou plusieurs heures apres le chargement est suspect.
$startedAt = filter_input(INPUT_POST, 'form_started', FILTER_VALIDATE_INT);
$elapsed = is_int($startedAt) ? time() - $startedAt : 0;
if ($elapsed < MIN_FORM_TIME || $elapsed > MAX_FORM_TIME) {
    error_log('Hibou contact: delai invalide depuis ' . clientIp());
    redirectToResult('sent');
}

if (rateLimitExceeded(clientIp())) {
    error_log('Hibou contact: limite atteinte pour ' . clientIp());
    redirectToResult('sent');
}

$name = trim((string) ($_POST['name'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$chalet = trim((string) ($_POST['chalet'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));

$chaletLabels = [
    'grand' => 'Chalet Grand Luxe',
    'petit' => 'Petit Chalet Familial',
];

if (
    $name === '' || $email === '' || $message === '' || !isset($chaletLabels[$chalet]) ||
    textLength($name) > MAX_NAME_LENGTH ||
    textLength($email) > MAX_EMAIL_LENGTH ||
    textLength($message) > MAX_MESSAGE_LENGTH ||
    !filter_var($email, FILTER_VALIDATE_EMAIL)
) {
    redirectToResult('invalid');
}

preg_match_all('~(?:https?://|www\.)~i', $message, $links);
if (count($links[0]) > 3) {
    error_log('Hibou contact: trop de liens depuis ' . clientIp());
    redirectToResult('sent');
}

$configFile = __DIR__ . '/config/contact.php';
if (!is_file($configFile)) {
    error_log('Hibou contact: configuration SMTP absente.');
    redirectToResult('error');
}

$config = require $configFile;
if (!is_array($config) || empty($config['password']) || str_starts_with((string) $config['password'], 'REMPLACER_')) {
    error_log('Hibou contact: mot de passe SMTP non configure.');
    redirectToResult('error');
}

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = (string) $config['host'];
    $mail->Port = (int) $config['port'];
    $mail->SMTPAuth = true;
    $mail->Username = (string) $config['username'];
    $mail->Password = (string) $config['password'];
    $mail->SMTPSecure = ($config['encryption'] ?? '') === 'starttls'
        ? PHPMailer::ENCRYPTION_STARTTLS
        : PHPMailer::ENCRYPTION_SMTPS;
    $mail->CharSet = 'UTF-8';
    $mail->Timeout = 15;

    $mail->setFrom((string) $config['from_email'], (string) $config['from_name']);
    $mail->addAddress((string) $config['to_email']);
    $mail->addReplyTo($email, preg_replace('/[\r\n]+/', ' ', $name));
    $mail->Subject = 'Nouvelle demande - ' . $chaletLabels[$chalet];
    $mail->Body =
        "Nom : {$name}\n" .
        "E-mail : {$email}\n" .
        "Hebergement : {$chaletLabels[$chalet]}\n" .
        'Langue : ' . (requestedLanguage() === 'en' ? 'anglais' : 'francais') . "\n\n" .
        "Message :\n{$message}";

    $mail->send();
    redirectToResult('sent');
} catch (Exception $exception) {
    error_log('Erreur mail Hibou: ' . $mail->ErrorInfo);
    redirectToResult('error');
}

