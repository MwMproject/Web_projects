<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

const CONTACT_RECIPIENT = 'h2o@hschumacher.ch';
const CONTACT_FROM = 'h2o@hschumacher.ch';
const TOKEN_MIN_AGE = 3;
const TOKEN_MAX_AGE = 7200;
const RATE_LIMIT_WINDOW = 3600;
const RATE_LIMIT_MAX = 5;

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
  || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

session_name('hs_contact');
session_set_cookie_params([
  'lifetime' => 0,
  'path' => '/',
  'secure' => $isHttps,
  'httponly' => true,
  'samesite' => 'Lax',
]);
session_start();

function redirectTo(string $path): never
{
  header('Location: ' . $path, true, 303);
  exit;
}

function postString(string $key): ?string
{
  $value = $_POST[$key] ?? null;
  return is_string($value) ? trim($value) : null;
}

function textLength(string $value): int
{
  return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function hasValidOrigin(): bool
{
  $source = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
  if ($source === '') return true;

  $sourceHost = strtolower((string) parse_url($source, PHP_URL_HOST));
  $requestHost = strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
  return $sourceHost !== '' && hash_equals($requestHost, $sourceHost);
}

function rateLimitExceeded(string $address): bool
{
  $directory = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'hschumacher-contact-rate';
  if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
    error_log('Formulaire H. Schumacher : impossible de créer le dossier de limitation.');
    return true;
  }

  $filePath = $directory . DIRECTORY_SEPARATOR . hash('sha256', $address) . '.json';
  $handle = fopen($filePath, 'c+');
  if ($handle === false || !flock($handle, LOCK_EX)) {
    if (is_resource($handle)) fclose($handle);
    error_log('Formulaire H. Schumacher : impossible de verrouiller la limitation.');
    return true;
  }

  $contents = stream_get_contents($handle);
  $timestamps = json_decode($contents ?: '[]', true);
  if (!is_array($timestamps)) $timestamps = [];

  $cutoff = time() - RATE_LIMIT_WINDOW;
  $timestamps = array_values(array_filter($timestamps, static fn ($timestamp): bool => is_int($timestamp) && $timestamp >= $cutoff));
  $exceeded = count($timestamps) >= RATE_LIMIT_MAX;

  if (!$exceeded) {
    $timestamps[] = time();
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($timestamps));
    fflush($handle);
  }

  flock($handle, LOCK_UN);
  fclose($handle);
  return $exceeded;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($_GET['action'] ?? '') === 'token') {
  $token = bin2hex(random_bytes(32));
  $_SESSION['contact_form'] = ['token' => $token, 'issued_at' => time()];
  header('Content-Type: application/json; charset=UTF-8');
  echo json_encode(['token' => $token], JSON_UNESCAPED_SLASHES);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  header('Allow: GET, POST');
  exit('Méthode non autorisée');
}

if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 20000) redirectTo('/error.html');

// Un robot qui remplit ce champ reçoit une fausse confirmation, sans aucun e-mail.
if (postString('website') !== '') redirectTo('/thanks.html');

$submittedToken = postString('csrf_token') ?? '';
$tokenData = $_SESSION['contact_form'] ?? [];
$storedToken = is_array($tokenData) && is_string($tokenData['token'] ?? null) ? $tokenData['token'] : '';
$issuedAt = is_array($tokenData) && is_int($tokenData['issued_at'] ?? null) ? $tokenData['issued_at'] : 0;
$tokenAge = time() - $issuedAt;
unset($_SESSION['contact_form']);

if (
  $submittedToken === '' || $storedToken === ''
  || !hash_equals($storedToken, $submittedToken)
  || $tokenAge < TOKEN_MIN_AGE || $tokenAge > TOKEN_MAX_AGE
  || !hasValidOrigin()
) {
  redirectTo('/error.html');
}

$remoteAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$name = postString('nom') ?? '';
$email = postString('email') ?? '';
$company = postString('societe') ?? '';
$message = postString('message') ?? '';
$techniques = $_POST['technique'] ?? [];

// Les demandes légitimes contiennent rarement une grande quantité de liens.
preg_match_all('~(?:https?://|www\.)~i', $message, $links);
if (count($links[0]) > 3) {
  error_log('Formulaire H. Schumacher : trop de liens depuis ' . $remoteAddress);
  redirectTo('/thanks.html');
}

if (rateLimitExceeded($remoteAddress)) redirectTo('/error.html');

$name = preg_replace('/[\r\n]+/', ' ', $name) ?? '';
$company = preg_replace('/[\r\n]+/', ' ', $company) ?? '';

if (
  $name === '' || textLength($name) > 120
  || $email === '' || strlen($email) > 254 || preg_match('/[\r\n]/', $email)
  || !filter_var($email, FILTER_VALIDATE_EMAIL)
  || textLength($company) > 160
  || textLength($message) < 10 || textLength($message) > 5000
) {
  redirectTo('/error.html');
}

$allowedTechniques = [
  'sanitaire' => 'Technique sanitaire',
  'gaz' => 'Gaz médicaux',
  'piscine' => 'Technique piscine',
];
$selectedTechniques = [];
if (is_array($techniques)) {
  foreach ($techniques as $technique) {
    if (is_string($technique) && isset($allowedTechniques[$technique])) {
      $selectedTechniques[] = $allowedTechniques[$technique];
    }
  }
}
$techniquesText = $selectedTechniques ? implode(', ', array_unique($selectedTechniques)) : 'Non précisé';

$body =
  "Nom : {$name}\n" .
  "Email : {$email}\n" .
  "Société : " . ($company !== '' ? $company : 'Non précisée') . "\n" .
  "Domaine(s) : {$techniquesText}\n\n" .
  "Message :\n{$message}\n";

$testMode = getenv('CONTACT_FORM_TEST_MODE') === '1';
$mail = null;

try {
  if (!$testMode) {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = 'localhost';
    $mail->Port = 25;
    $mail->SMTPAuth = false;
    $mail->CharSet = PHPMailer::CHARSET_UTF8;

    $mail->setFrom(CONTACT_FROM, 'H. Schumacher - Site web');
    $mail->addAddress(CONTACT_RECIPIENT);
    $mail->addReplyTo($email, $name);
    $mail->Subject = 'Nouveau message — hschumacher.ch';
    $mail->Body = $body;
    $mail->send();
  }
} catch (Exception $exception) {
  $mailError = $mail instanceof PHPMailer ? $mail->ErrorInfo : $exception->getMessage();
  error_log('Erreur mail H. Schumacher : ' . $mailError);
  redirectTo('/error.html');
}

redirectTo('/thanks.html');
