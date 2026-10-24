<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

// ── Configuration ──
$SITE_NAME   = 'NP Auto-école';
$MAIL_TO     = 'contact@np-autoecole.ch';
$MAIL_FROM   = 'contact@np-autoecole.ch';

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 190;
const MAX_PHONE_LENGTH = 40;
const MAX_MESSAGE_LENGTH = 3000;
const MIN_FORM_TIME = 3;
const MAX_FORM_TIME = 7200;
const RATE_LIMIT_WINDOW = 3600;
const RATE_LIMIT_MAX = 5;

function redirectTo(string $location): void {
    header('Location: ' . $location, true, 303);
    exit;
}

function clientIp(): string {
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function textLength(string $value): int {
    return function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
}

function rateLimitExceeded(string $ip): bool {
    $directory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'np-autoecole-contact-limit';
    if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) {
        error_log('NP Auto-école contact: impossible de créer le dossier de limitation.');
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
        error_log('NP Auto-école contact rate limit: ' . $exception->getMessage());
        return false;
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

// ── Sécurité ──
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('Méthode non autorisée');
}

// Faux succès pour les robots.
if (!empty($_POST['website'])) {
    redirectTo('thanks.html');
}

// Contrôle du délai de soumission.
$startedAt = filter_input(INPUT_POST, 'form_started', FILTER_VALIDATE_INT);
$elapsed = is_int($startedAt) ? time() - $startedAt : 0;
if ($elapsed < MIN_FORM_TIME || $elapsed > MAX_FORM_TIME) {
    error_log('NP Auto-école contact: délai invalide depuis ' . clientIp());
    redirectTo('thanks.html');
}

if (rateLimitExceeded(clientIp())) {
    error_log('NP Auto-école contact: limite atteinte pour ' . clientIp());
    redirectTo('thanks.html');
}

// ── Récupération des champs ──
function postString(string $key): string {
    $value = $_POST[$key] ?? '';
    return is_string($value) ? trim($value) : '';
}

function clean(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

$nom        = clean(postString('nom'));
$prenom     = clean(postString('prenom'));
$email      = filter_var(postString('email'), FILTER_VALIDATE_EMAIL);
$telephone  = clean(postString('telephone'));
$service    = clean(postString('service'));
$dateCours  = clean(postString('date-cours'));
$heureCours = clean(postString('heure-cours'));
$message    = clean(postString('message'));

// ── Validation ──
$allowedServices = [
    'Cours Cat B',
    'Cours Cat BE',
    'Reprise de confiance',
    'Sensibilisation',
    'Aide théorie',
    'Premiers secours',
    'Permis étranger',
    'Autre demande',
    'Pack 5 cours',
    'Pack 10 cours',
];
$allowedTimes = ['07:00', '08:00', '09:00', '10:00', '15:00', '16:00', '17:00', '18:00'];

if (
    $nom === '' || $prenom === '' || !$email || $message === '' ||
    !in_array($service, $allowedServices, true) ||
    textLength($nom) > MAX_NAME_LENGTH ||
    textLength($prenom) > MAX_NAME_LENGTH ||
    textLength((string) $email) > MAX_EMAIL_LENGTH ||
    textLength($telephone) > MAX_PHONE_LENGTH ||
    textLength($message) > MAX_MESSAGE_LENGTH
) {
    redirectTo('index.html?erreur=champs#contact');
}

preg_match_all('~(?:https?://|www\.)~i', $message, $links);
if (count($links[0]) > 3) {
    error_log('NP Auto-école contact: trop de liens depuis ' . clientIp());
    redirectTo('thanks.html');
}

// ── Construction du corps HTML ──
$servicesAvecCreneau = ['Cours Cat B', 'Cours Cat BE', 'Reprise de confiance'];
$needsBooking = in_array($service, $servicesAvecCreneau, true);

if ($needsBooking) {
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $dateCours);
    $dateIsValid = $date && $date->format('Y-m-d') === $dateCours;
    $today = new DateTimeImmutable('today');
    $isWeekday = $dateIsValid && (int) $date->format('N') <= 5;

    if (!$dateIsValid || $date < $today || !$isWeekday || !in_array($heureCours, $allowedTimes, true)) {
        redirectTo('index.html?erreur=champs#contact');
    }
}

$body = "
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
  <div style='background: #b5741c; padding: 24px 28px; border-radius: 12px 12px 0 0;'>
    <h1 style='color: #fff; margin: 0; font-size: 22px;'>Nouvelle demande — {$SITE_NAME}</h1>
  </div>
  <div style='background: #fffaf3; padding: 28px; border: 1px solid #e8ddd0; border-top: none; border-radius: 0 0 12px 12px;'>
    <table style='width: 100%; border-collapse: collapse;'>
      <tr>
        <td style='padding: 10px 0; color: #6e6257; font-weight: bold; width: 160px;'>Nom</td>
        <td style='padding: 10px 0; color: #16110c;'>{$nom}</td>
      </tr>
      <tr>
        <td style='padding: 10px 0; color: #6e6257; font-weight: bold;'>Prénom</td>
        <td style='padding: 10px 0; color: #16110c;'>{$prenom}</td>
      </tr>
      <tr>
        <td style='padding: 10px 0; color: #6e6257; font-weight: bold;'>Email</td>
        <td style='padding: 10px 0;'><a href='mailto:{$email}' style='color: #b5741c;'>{$email}</a></td>
      </tr>
      <tr>
        <td style='padding: 10px 0; color: #6e6257; font-weight: bold;'>Téléphone</td>
        <td style='padding: 10px 0; color: #16110c;'>" . ($telephone ?: 'Non renseigné') . "</td>
      </tr>
      <tr>
        <td style='padding: 10px 0; color: #6e6257; font-weight: bold;'>Service souhaité</td>
        <td style='padding: 10px 0; color: #16110c; font-weight: bold;'>{$service}</td>
      </tr>";

if ($needsBooking) {
    $body .= "
      <tr>
        <td style='padding: 10px 0; color: #6e6257; font-weight: bold;'>Date souhaitée</td>
        <td style='padding: 10px 0; color: #16110c;'>" . ($dateCours ?: 'Non renseignée') . "</td>
      </tr>
      <tr>
        <td style='padding: 10px 0; color: #6e6257; font-weight: bold;'>Heure souhaitée</td>
        <td style='padding: 10px 0; color: #16110c;'>" . ($heureCours ?: 'Non renseignée') . "</td>
      </tr>";
}

$body .= "
    </table>
    <div style='margin-top: 24px; padding: 18px; background: #fff; border-radius: 10px; border: 1px solid #e8ddd0;'>
      <p style='margin: 0 0 8px; color: #6e6257; font-weight: bold;'>Message :</p>
      <p style='margin: 0; color: #16110c; line-height: 1.7;'>" . nl2br($message) . "</p>
    </div>
    <p style='margin-top: 24px; color: #a09487; font-size: 13px; text-align: center;'>
      Envoyé depuis le formulaire de contact — {$SITE_NAME}
    </p>
  </div>
</div>";

// ── Envoi avec PHPMailer ──
$mail = new PHPMailer(true);

try {
    // SMTP local Infomaniak
    $mail->isSMTP();
    $mail->Host       = 'localhost';
    $mail->Port       = 25;
    $mail->SMTPAuth   = false;
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom($MAIL_FROM, $SITE_NAME);
    $mail->addAddress($MAIL_TO, 'Nicolas Peneveyre');
    $mail->addReplyTo($email, "$prenom $nom");

    $mail->isHTML(true);
    $mail->Subject = "Nouvelle demande — {$service} — {$prenom} {$nom}";
    $mail->Body    = $body;
    $mail->AltBody = "Nouvelle demande de {$prenom} {$nom}\nService : {$service}\nEmail : {$email}\nTéléphone : " . ($telephone ?: 'Non renseigné') . "\nMessage : {$message}";

    $mail->send();

    header('Location: thanks.html');
    exit;

} catch (Exception $e) {
    error_log("Erreur PHPMailer NP Auto-école: " . $mail->ErrorInfo);
    redirectTo('index.html?erreur=envoi#contact');
}
