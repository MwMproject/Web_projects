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

// ================= DONNÉES FORMULAIRE =================
$name    = trim($_POST['name'] ?? '');
$email   = trim($_POST['email'] ?? '');
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

// ================= PHPMailer =================
$mail = new PHPMailer(true);

try {
  // ==================================================
  // SMTP LOCAL INFOMANIAK (RECOMMANDÉ)
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
    "Email : {$email}\n\n" .
    "Message :\n{$message}";

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
