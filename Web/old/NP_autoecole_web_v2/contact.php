<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

// ── Configuration ──
$SITE_NAME   = 'NP Auto-école';
$MAIL_TO     = 'contact@np-autoecole.ch';
$MAIL_FROM   = 'contact@np-autoecole.ch';

// ── Sécurité ──
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(403);
    exit('Accès interdit');
}

// ── Récupération des champs ──
function clean($val) {
    return htmlspecialchars(trim($val ?? ''), ENT_QUOTES, 'UTF-8');
}

$nom       = clean($_POST['nom'] ?? '');
$prenom    = clean($_POST['prenom'] ?? '');
$email     = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$telephone = clean($_POST['telephone'] ?? '');
$service   = clean($_POST['service'] ?? '');
$dateCours = clean($_POST['date-cours'] ?? '');
$heureCours = clean($_POST['heure-cours'] ?? '');
$message   = clean($_POST['message'] ?? '');

// ── Validation ──
if (mb_strlen($message) > 3000 || mb_strlen($nom) > 120 || mb_strlen($prenom) > 120) {
    header('Location: index.html?erreur=champs');
    exit;
}

if (!$nom || !$prenom || !$email || !$service || !$message) {
    header('Location: index.html?erreur=champs');
    exit;
}

// ── Construction du corps HTML ──
$servicesAvecCreneau = ['Cours Cat B', 'Cours Cat BE', 'Reprise de confiance'];
$needsBooking = in_array($service, $servicesAvecCreneau);

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
    header('Location: index.html?erreur=envoi');
    exit;
}