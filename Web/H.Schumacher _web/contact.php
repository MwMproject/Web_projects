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

// ================= DONNÉES FORMULAIRE =================
$nom       = trim($_POST['nom'] ?? '');
$email     = trim($_POST['email'] ?? '');
$societe   = trim($_POST['societe'] ?? '');
$message   = trim($_POST['message'] ?? '');
$technique = $_POST['technique'] ?? [];

if (
  empty($nom) ||
  empty($email) ||
  empty($message) ||
  !filter_var($email, FILTER_VALIDATE_EMAIL)
) {
  header('Location: /error.html');
  exit;
}

$techniquesStr = !empty($technique) ? implode(', ', array_map('htmlspecialchars', $technique)) : 'Non précisé';

// ================= PHPMailer =================
$mail = new PHPMailer(true);

try {
  $mail->isSMTP();
  $mail->Host     = 'localhost';
  $mail->Port     = 25;
  $mail->SMTPAuth = false;
  $mail->CharSet  = 'UTF-8';

  $mail->setFrom('h2o@hschumacher.ch', 'H. Schumacher — Site web');
  $mail->addAddress('h2o@hschumacher.ch');
  $mail->addReplyTo($email, $nom);

  $mail->Subject = 'Nouveau message — hschumacher.ch';

  $mail->Body =
    "Nom : {$nom}\n" .
    "Email : {$email}\n" .
    "Société : {$societe}\n" .
    "Domaine(s) : {$techniquesStr}\n\n" .
    "Message :\n{$message}";

  $mail->send();

  header('Location: /thanks.html');
  exit;

} catch (Exception $e) {
  error_log('Erreur mail H.Schumacher : ' . $mail->ErrorInfo);
  header('Location: /error.html');
  exit;
}
