-- Tests de sécurité du schéma Relais (base de TEST uniquement).
\set ON_ERROR_STOP on
\pset footer off

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'patron@peinture-a.ch'),
  ('00000000-0000-0000-0000-0000000000a2', 'secretaire@peinture-a.ch'),
  ('00000000-0000-0000-0000-0000000000b1', 'patron@concurrent-b.ch');

-- Patron A crée son entreprise
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select creer_entreprise('Peinture A Sàrl', 'Paul', 'Martin') as ent_a \gset
insert into membres (entreprise_id, user_id, role, prenom) values (:'ent_a', '00000000-0000-0000-0000-0000000000a2', 'membre', 'Sonia');

-- Le SERVEUR (service_role : pas d'utilisateur) ajoute une boîte, son secret, un message, l'analyse et le brouillon
reset role;
reset request.jwt.claim.sub;
insert into comptes_mail (entreprise_id, fournisseur, libelle, email, imap_hote, imap_port, smtp_hote, smtp_port, smtp_securise)
values (:'ent_a', 'imap', 'Contact', 'info@peinture-a.ch', 'mail.infomaniak.com', 993, 'mail.infomaniak.com', 465, true)
returning id as compte \gset
insert into comptes_mail_secrets (compte_id, entreprise_id, chiffre, iv, tag) values (:'compte', :'ent_a', 'xxx', 'yyy', 'zzz');
insert into messages (entreprise_id, compte_id, id_fournisseur, expediteur_email, sujet, corps_texte, recu_le, statut)
values (:'ent_a', :'compte', '1:42', 'client@exemple.ch', 'Devis peinture salon', 'Bonjour, combien pour repeindre mon salon de 25 m2 ?', now(), 'a_traiter')
returning id as msg \gset
insert into analyses (message_id, entreprise_id, categorie, urgence, resume, infos_manquantes)
values (:'msg', :'ent_a', 'demande_devis', 'normale', 'Demande de devis pour un salon de 25 m².', '["adresse", "date souhaitée"]');
insert into brouillons (message_id, entreprise_id, sujet, corps) values (:'msg', :'ent_a', 'Re: Devis peinture salon', 'Bonjour, merci pour votre demande…')
returning id as brouillon \gset
select ajouter_usage_ia(:'ent_a', 1200, 300, 2700);

-- ---------- Secrétaire A (membre) ----------
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a2';
\echo '--- Membre A voit (attendu : 1 compte, 0 secret, 1 message, 1 analyse, 1 brouillon) ---'
select (select count(*) from comptes_mail) comptes, (select count(*) from comptes_mail_secrets) secrets,
       (select count(*) from messages) messages, (select count(*) from analyses) analyses, (select count(*) from brouillons) brouillons;

update brouillons set corps = 'Bonjour Madame, merci pour votre demande. Pourriez-vous nous indiquer l''adresse ?' where id = :'brouillon';
\echo '--- Brouillon retouché (attendu : modifie = t, statut a_valider) ---'
select statut, modifie from brouillons;

\echo '--- Tentatives interdites (attendu : 5 x BLOQUÉ) ---'
do $$ begin update brouillons set statut = 'envoye'; raise notice 'ÉCHEC : brouillon marqué envoyé par un utilisateur';
exception when others then raise notice 'BLOQUÉ : %', sqlerrm; end $$;
do $$ begin update messages set corps_texte = 'falsifié'; raise notice 'ÉCHEC : message falsifié';
exception when others then raise notice 'BLOQUÉ : %', sqlerrm; end $$;
do $$ begin update comptes_mail set imap_hote = 'serveur-pirate.example'; raise notice 'ÉCHEC : hôte IMAP détourné';
exception when others then raise notice 'BLOQUÉ : %', sqlerrm; end $$;
do $$ begin perform ajouter_usage_ia((select id from entreprises limit 1), 0, 0, -999999999); raise notice 'ÉCHEC : compteur IA manipulé';
exception when others then raise notice 'BLOQUÉ : %', sqlerrm; end $$;
do $$ begin insert into comptes_mail_secrets (compte_id, entreprise_id, chiffre, iv, tag) select id, entreprise_id, 'a','b','c' from comptes_mail; raise notice 'ÉCHEC : secret écrit par un utilisateur';
exception when others then raise notice 'BLOQUÉ : %', sqlerrm; end $$;

update messages set statut = 'ignore' where id = :'msg';
\echo '--- Statut du message changé par le membre (attendu : ignore) ---'
select statut from messages;
\echo '--- Journal réservé aux admins (attendu : 0 pour un membre) ---'
select count(*) as journal_visible from journal;

-- ---------- Patron B ----------
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
select creer_entreprise('Concurrent B SA', 'Bea', 'Roux') as ent_b \gset
\echo '--- Entreprise B ne voit rien de A (attendu : 1 entreprise, 0 partout ailleurs) ---'
select (select count(*) from entreprises) entreprises, (select count(*) from comptes_mail) comptes,
       (select count(*) from messages) messages, (select count(*) from brouillons) brouillons, (select count(*) from usage_ia) usage;
do $$ begin perform creer_entreprise('Deuxième', 'B', 'B'); raise notice 'ÉCHEC : deux entreprises pour un compte';
exception when others then raise notice 'BLOQUÉ : %', sqlerrm; end $$;

-- ---------- Serveur : plafond IA ----------
reset role; reset request.jwt.claim.sub;
\echo '--- Plafond IA (attendu : f puis t après 15 CHF consommés) ---'
select plafond_ia_atteint(:'ent_a') as avant;
select ajouter_usage_ia(:'ent_a', 0, 0, 15000000);
select plafond_ia_atteint(:'ent_a') as apres;
update brouillons set statut = 'envoye', envoye_le = now() where id = :'brouillon';
\echo '--- Le serveur peut marquer envoyé (attendu : envoye) ---'
select statut from brouillons;
