<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// ================= PHPMailer =================
require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

// ================= SÉCURITÉ =================
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(403);
  exit('Accès interdit');
}

// ================= HONEYPOT ANTI-SPAM =================
if (!empty($_POST['website'])) {
  header('Location: /thanks.html');
  exit;
}

// ================= DÉLAI MINIMUM ANTI-SPAM =================
// Un humain met toujours plus de 3s entre le chargement du formulaire
// et l'envoi ; un bot le remplit quasi instantanément.
$formTs = (int) ($_POST['ts'] ?? 0);
$elapsedMs = $formTs > 0 ? (round(microtime(true) * 1000) - $formTs) : 0;
if ($formTs <= 0 || $elapsedMs < 3000) {
  header('Location: /thanks.html');
  exit;
}

// ================= DONNÉES FORMULAIRE =================
$name    = trim($_POST['name'] ?? '');
$email   = trim($_POST['email'] ?? '');
$phone   = trim($_POST['phone'] ?? '');
$message = trim($_POST['message'] ?? '');

if (
  empty($name) ||
  empty($email) ||
  empty($message) ||
  !filter_var($email, FILTER_VALIDATE_EMAIL)
) {
  header('Location: /error.html');
  exit;
}

// ================= BLOCAGE LIENS (spam) =================
// Les vraies demandes de jardinage ne contiennent jamais de lien ;
// le spam quasi toujours (backlinks, promos, etc.).
if (preg_match('#https?://#i', $name . ' ' . $message)) {
  header('Location: /thanks.html');
  exit;
}

// ================= PHPMailer =================
$mail = new PHPMailer(true);

try {
  // ==================================================
  // SMTP LOCAL INFOMANIAK
  // ==================================================
  $mail->isSMTP();
  $mail->Host       = 'localhost';
  $mail->Port       = 25;
  $mail->SMTPAuth   = false;
  $mail->CharSet    = 'UTF-8';

  // ==================================================
  // EMAIL
  // ==================================================
  $mail->setFrom('contact@besson-paysage.ch', 'Besson Paysage');
  $mail->addAddress('contact@besson-paysage.ch');
  $mail->addReplyTo($email, $name);

  $mail->Subject = 'Nouveau message — Besson Paysage';
  $mail->Body =
    "Nom : {$name}\n" .
    "Email : {$email}\n" .
    (!empty($phone) ? "Téléphone : {$phone}\n" : '') .
    "\nMessage :\n{$message}";

  // ==================================================
  // ENVOI
  // ==================================================
  $mail->send();

  header('Location: /thanks.html');
  exit;

} catch (Exception $e) {
  // Log serveur uniquement (pas visible utilisateur)
  error_log('Erreur mail : ' . $mail->ErrorInfo);

  header('Location: /error.html');
  exit;
}
