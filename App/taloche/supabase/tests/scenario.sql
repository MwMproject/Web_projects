-- =====================================================================
-- Test de scénario complet : devis → chantier → rapport mobile → stock
-- → rentabilité → facture régie, + vérification de la sécurité (RLS).
-- À lancer sur une base de TEST uniquement (supabase db reset puis psql).
-- Chaque ligne "OK" attendue est commentée.
-- =====================================================================
\set ON_ERROR_STOP on
\pset footer off

-- Utilisateurs de test
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'patron@maconnerie-test.ch'),
  ('00000000-0000-0000-0000-00000000000b', 'ouvrier@maconnerie-test.ch'),
  ('00000000-0000-0000-0000-00000000000c', 'patron@peinture-concurrente.ch');

-- ---------- PATRON A ----------
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';

select creer_entreprise('Maçonnerie Test SA', 'Marc', 'Rossier') as ent_a \gset
update entreprises set ide = 'CHE-123.456.789', iban = 'CH93 0076 2011 6238 5295 7', tarif_horaire_vente = 85, tarif_regie_vente = 90 where id = :'ent_a';

insert into membres (entreprise_id, user_id, role, prenom, nom)
values (:'ent_a', '00000000-0000-0000-0000-00000000000b', 'ouvrier', 'Luis', 'Pereira')
returning id as ouvrier \gset
select id as patron_m from membres where entreprise_id = :'ent_a' and role = 'patron' \gset
insert into membre_couts (membre_id, entreprise_id, cout_horaire) values (:'ouvrier', :'ent_a', 55), (:'patron_m', :'ent_a', 70);

insert into clients (entreprise_id, type, prenom, nom, adresse, npa, localite)
values (:'ent_a', 'particulier', 'Martin', 'Dupont', 'Ch. des Lilas 12', '1860', 'Aigle')
returning id as client \gset

insert into articles (entreprise_id, type, designation, categorie, unite, prix_vente, prix_achat, stockable)
values (:'ent_a', 'materiel', 'Brique terre cuite 17.5 cm', 'Maçonnerie', 'pal', 420, 310, true)
returning id as brique \gset
insert into articles (entreprise_id, type, designation, categorie, unite, prix_vente, prix_achat)
values (:'ent_a', 'prestation', 'Mur en briques 17.5 cm', 'Maçonnerie', 'm²', 145, 0)
returning id as prest_mur \gset

select id as depot from depots where entreprise_id = :'ent_a' \gset
insert into stock_mouvements (entreprise_id, article_id, depot_id, quantite, type, note)
values (:'ent_a', :'brique', :'depot', 4, 'entree', 'Livraison fournisseur');

-- Devis : numéro automatique
insert into devis (entreprise_id, client_id, objet) values (:'ent_a', :'client', 'Mur de séparation garage')
returning id as devis, numero \gset
insert into devis_lignes (devis_id, position, article_id, designation, unite, quantite, prix_unitaire)
values (:'devis', 1, :'prest_mur', 'Mur en briques 17.5 cm', 'm²', 24, 145);
\echo '--- Devis (attendu : DEV-<année>-001, 3480.00 HT, TVA 8.1 %) ---'
select d.numero, t.total_ht, t.total_tva, t.total_ttc from devis d join devis_totaux t on t.devis_id = d.id;

-- Devis accepté → chantier en un clic, ouvrier assigné
select creer_chantier_depuis_devis(:'devis') as chantier \gset
insert into chantier_membres (chantier_id, membre_id) values (:'chantier', :'ouvrier');

-- ---------- OUVRIER A (sur son téléphone) ----------
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
\echo '--- Ouvrier : ce qu''il voit (attendu : 1 chantier, 0 client, 0 devis, 0 article avec prix, 2 articles terrain) ---'
select (select count(*) from chantiers) as chantiers, (select count(*) from clients) as clients,
       (select count(*) from devis) as devis, (select count(*) from articles) as articles_prix,
       (select count(*) from articles_terrain) as articles_terrain,
       (select count(*) from membre_couts) as couts_visibles;

insert into rapports (chantier_id, auteur_id, remarques, est_regie)
values (:'chantier', :'ouvrier', 'Élévation du mur, 1re assise', true)
returning id as rapport \gset
insert into rapport_heures (rapport_id, membre_id, heures, type) values (:'rapport', :'ouvrier', 8, 'regie');
insert into rapport_materiel (rapport_id, article_id, designation, unite, quantite, depot_id)
values (:'rapport', :'brique', 'Brique terre cuite 17.5 cm', 'pal', 1, :'depot');

\echo '--- Ouvrier : tentatives interdites (attendu : 3 x BLOQUÉ) ---'
do $$ begin
  insert into rapport_heures (rapport_id, membre_id, heures)
  select r.id, m.id, 10 from rapports r, membres m where m.role = 'patron' limit 1;
  raise notice 'ÉCHEC : heures déclarées pour un collègue';
exception when insufficient_privilege then raise notice 'BLOQUÉ : heures pour un collègue';
end $$;
do $$ begin
  insert into stock_mouvements (entreprise_id, article_id, depot_id, quantite, type)
  select a.entreprise_id, a.id, d.id, 100, 'entree' from articles_terrain a, depots d limit 1;
  raise notice 'ÉCHEC : ouvrier a modifié le stock';
exception when insufficient_privilege then raise notice 'BLOQUÉ : stock modifié à la main';
end $$;
do $$ begin
  perform facturer_regie((select id from chantiers limit 1));
  raise notice 'ÉCHEC : ouvrier a facturé';
exception when others then raise notice 'BLOQUÉ : facturation par un ouvrier (%)', sqlerrm;
end $$;

update rapports set statut = 'envoye' where id = :'rapport';
\echo '--- Rapport envoyé : l''ouvrier ne peut plus le modifier (attendu : 0 ligne modifiée) ---'
update rapports set remarques = 'modifié après envoi' where id = :'rapport';

-- ---------- PATRON A : stock, rentabilité, facture ----------
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
\echo '--- Stock (attendu : 3 palettes au dépôt principal, sortie automatique) ---'
select designation, depot, quantite from stock_niveaux;

\echo '--- Rentabilité (attendu : budget 3480, 8 h x 55 = 440, matériel 310, coût 750) ---'
select nom, budget_ht, heures, cout_heures, cout_materiel, cout_total, marge_prevue, budget_consomme_pct
from chantier_rentabilite;

\echo '--- Facture régie en un clic (attendu : FAC-<année>-001, 8 h x 90 + 1 pal x 420 = 1140 HT) ---'
select facturer_regie(:'chantier') as facture \gset
select f.numero, f.type, f.echeance - f.date_facture as jours, t.total_ht, t.total_tva, t.total_ttc
from factures f join facture_totaux t on t.facture_id = f.id;
select position, designation, unite, quantite, prix_unitaire, total_ht from facture_lignes order by position;

\echo '--- Double facturation (attendu : BLOQUÉ, rien à facturer) ---'
do $$ begin
  perform facturer_regie((select id from chantiers limit 1));
  raise notice 'ÉCHEC : double facturation';
exception when others then raise notice 'BLOQUÉ : %', sqlerrm;
end $$;

-- ---------- PATRON B (autre entreprise) ----------
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select creer_entreprise('Peinture Concurrente Sàrl', 'Anne', 'Favre') as ent_b \gset
\echo '--- Entreprise B : ne voit rien de A (attendu : 0 partout, 1 entreprise) ---'
select (select count(*) from entreprises) as entreprises, (select count(*) from clients) as clients,
       (select count(*) from chantiers) as chantiers, (select count(*) from factures) as factures,
       (select count(*) from stock_niveaux) as stock, (select count(*) from articles_terrain) as articles;
do $$ begin
  insert into clients (entreprise_id, nom) select id, 'Intrus' from entreprises e where e.nom like 'Maçonnerie%';
  insert into clients (entreprise_id, nom) values ((select entreprise_id from membres limit 0), 'Intrus');
  raise notice 'Insertion dans A : % (attendu : aucune ligne, A est invisible)', 'ok';
exception when others then raise notice 'BLOQUÉ : %', sqlerrm;
end $$;

-- B ne peut pas consommer la numérotation de A
do $$ begin
  perform prochain_numero((select id from entreprises where nom like 'Maçonnerie%' union all select '00000000-0000-0000-0000-000000000000'::uuid limit 1), 'facture', current_date);
  raise notice 'ÉCHEC : numéro consommé chez un autre';
exception when others then raise notice 'BLOQUÉ : numérotation d''une autre entreprise (%)', sqlerrm;
end $$;
\set ON_ERROR_STOP off
select prochain_numero(:'ent_a', 'facture', current_date) as tentative_directe;
\set ON_ERROR_STOP on

reset role;
\echo '--- Vérification finale (admin) : 1 client dans A, compteur facture = 1, rapport non modifié après envoi ---'
select (select count(*) from clients) as clients_total,
       (select dernier from compteurs where type = 'facture') as dernier_numero_facture,
       (select remarques from rapports) as remarques_rapport;
