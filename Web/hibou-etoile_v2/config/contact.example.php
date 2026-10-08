<?php
declare(strict_types=1);

/*
 * Copier ce fichier sous le nom config/contact.php, puis renseigner le mot de
 * passe d'application de la boite info@hibou-etoile.com. contact.php est
 * ignore par Git et son acces public est bloque par le .htaccess racine.
 */
return [
    'host' => 'mail.infomaniak.com',
    'port' => 465,
    'encryption' => 'smtps',
    'username' => 'info@hibou-etoile.com',
    'password' => 'REMPLACER_PAR_LE_MOT_DE_PASSE_D_APPLICATION',
    'from_email' => 'info@hibou-etoile.com',
    'from_name' => "L'Hibou Etoile",
    'to_email' => 'info@hibou-etoile.com',
];

