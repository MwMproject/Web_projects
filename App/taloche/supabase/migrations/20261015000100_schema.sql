-- =====================================================================
-- TALOCHE — Schéma de base de données (PostgreSQL / Supabase)
-- Gestion bureau + chantier pour les PME du bâtiment (Suisse romande)
--
-- Principes :
--   * Multi-entreprise : chaque ligne porte entreprise_id.
--   * Sécurité : Row Level Security (RLS) sur TOUTES les tables.
--   * Rôles : patron > bureau > ouvrier.
--     - patron / bureau : tout voir et tout gérer dans leur entreprise
--     - ouvrier : uniquement ses chantiers assignés et ses rapports,
--       jamais les prix d'achat, devis, factures ni marges.
--   * Montants en CHF, numeric(12,2). Quantités numeric(12,3).
--   * Le stock = somme des mouvements (jamais un champ "quantité" modifié
--     à la main) → historique complet et traçable.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Types énumérés
-- ---------------------------------------------------------------------
create type role_membre      as enum ('patron', 'bureau', 'ouvrier');
create type type_client      as enum ('particulier', 'entreprise', 'regie_immobiliere', 'architecte', 'collectivite');
create type type_article     as enum ('prestation', 'materiel', 'main_oeuvre');
create type statut_devis     as enum ('brouillon', 'envoye', 'accepte', 'refuse', 'expire');
create type statut_chantier  as enum ('prevu', 'en_cours', 'termine', 'facture', 'archive');
create type statut_rapport   as enum ('brouillon', 'envoye', 'valide');
create type type_heure       as enum ('normal', 'regie', 'deplacement');
create type type_mouvement   as enum ('entree', 'sortie', 'ajustement', 'transfert');
create type type_facture     as enum ('forfait', 'regie', 'acompte', 'situation', 'finale');
create type statut_facture   as enum ('brouillon', 'envoyee', 'payee', 'en_retard', 'annulee');
create type type_document    as enum ('devis', 'facture');

-- ---------------------------------------------------------------------
-- Entreprises (les clients de Taloche = les "tenants")
-- ---------------------------------------------------------------------
create table entreprises (
  id                  uuid primary key default gen_random_uuid(),
  nom                 text not null,
  ide                 text,                       -- CHE-123.456.789
  numero_tva          text,                       -- CHE-123.456.789 TVA
  assujetti_tva       boolean not null default true,
  tva_taux_defaut     numeric(4,2) not null default 8.10,  -- taux normal depuis le 01.01.2024
  adresse             text,
  npa                 text,
  localite            text,
  pays                char(2) not null default 'CH',
  email               text,
  telephone           text,
  iban                text,                       -- IBAN ou QR-IBAN pour la QR-facture
  delai_paiement_jours int not null default 30,
  tarif_horaire_vente numeric(12,2) not null default 85.00,  -- utilisé pour la régie
  tarif_regie_vente   numeric(12,2),              -- si différent du tarif normal
  mentions_facture    text,
  logo_path           text,                       -- chemin dans Supabase Storage
  plan                text not null default 'essai' check (plan in ('essai','artisan','equipe','entreprise','pilote')),
  essai_fin_le        date default (current_date + 30),
  created_at          timestamptz not null default now(),
  constraint ide_format check (ide is null or ide ~ '^CHE-[0-9]{3}\.[0-9]{3}\.[0-9]{3}$')
);

-- ---------------------------------------------------------------------
-- Membres (utilisateurs d'une entreprise, liés à auth.users de Supabase)
-- ---------------------------------------------------------------------
create table membres (
  id                  uuid primary key default gen_random_uuid(),
  entreprise_id       uuid not null references entreprises(id) on delete cascade,
  user_id             uuid references auth.users(id) on delete set null,  -- null = invité pas encore inscrit
  role                role_membre not null default 'ouvrier',
  prenom              text not null,
  nom                 text not null,
  email               text,
  telephone           text,
  actif               boolean not null default true,
  created_at          timestamptz not null default now(),
  unique (entreprise_id, user_id)
);
create index on membres (user_id);

-- Coût horaire interne (salaire + charges) : table séparée, car la RLS
-- filtre des lignes et non des colonnes. Invisible pour les ouvriers.
create table membre_couts (
  membre_id           uuid primary key references membres(id) on delete cascade,
  entreprise_id       uuid not null references entreprises(id) on delete cascade,
  cout_horaire        numeric(12,2) not null default 0
);

-- ---------------------------------------------------------------------
-- Fonctions d'aide pour la sécurité (RLS)
-- security definer : elles lisent "membres" sans repasser par la RLS,
-- ce qui évite les boucles infinies de politiques.
-- ---------------------------------------------------------------------
create or replace function mon_role(p_entreprise uuid)
returns role_membre
language sql stable security definer set search_path = public
as $$
  select role from membres
  where entreprise_id = p_entreprise and user_id = auth.uid() and actif
  limit 1
$$;

create or replace function est_membre(p_entreprise uuid)
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(mon_role(p_entreprise) is not null, false) $$;

create or replace function est_gestion(p_entreprise uuid)   -- patron ou bureau
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(mon_role(p_entreprise) in ('patron', 'bureau'), false) $$;

create or replace function est_patron(p_entreprise uuid)
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(mon_role(p_entreprise) = 'patron', false) $$;

create or replace function mon_membre_id(p_entreprise uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from membres
  where entreprise_id = p_entreprise and user_id = auth.uid() and actif
  limit 1
$$;

-- ---------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------
create table clients (
  id                  uuid primary key default gen_random_uuid(),
  entreprise_id       uuid not null references entreprises(id) on delete cascade,
  type                type_client not null default 'particulier',
  raison_sociale      text,
  prenom              text,
  nom                 text,
  adresse             text,
  npa                 text,
  localite            text,
  pays                char(2) not null default 'CH',
  email               text,
  telephone           text,
  notes               text,
  created_at          timestamptz not null default now(),
  constraint client_nomme check (coalesce(raison_sociale, nom) is not null)
);
create index on clients (entreprise_id);

-- ---------------------------------------------------------------------
-- Articles : bibliothèque de prestations, matériel et main-d'œuvre
-- (reprend la "bibliothèque de prestations" du prototype FacturePro)
-- ---------------------------------------------------------------------
create table articles (
  id                  uuid primary key default gen_random_uuid(),
  entreprise_id       uuid not null references entreprises(id) on delete cascade,
  type                type_article not null default 'prestation',
  designation         text not null,
  categorie           text,                        -- Maçonnerie, Peinture, Carrelage...
  unite               text not null default 'u',   -- m², ml, m³, h, j, u, forfait, kg, t, pal, sac
  prix_vente          numeric(12,2) not null default 0,
  prix_achat          numeric(12,2) not null default 0,   -- jamais visible par un ouvrier
  fournisseur         text,
  ref_fournisseur     text,
  stockable           boolean not null default false,     -- true = suivi en stock au dépôt
  stock_alerte        numeric(12,3),                      -- seuil d'alerte (optionnel)
  actif               boolean not null default true,
  created_at          timestamptz not null default now()
);
create index on articles (entreprise_id, categorie);

-- ---------------------------------------------------------------------
-- Dépôts et stock
-- ---------------------------------------------------------------------
create table depots (
  id                  uuid primary key default gen_random_uuid(),
  entreprise_id       uuid not null references entreprises(id) on delete cascade,
  nom                 text not null,               -- "Dépôt d'Aigle"
  adresse             text,
  actif               boolean not null default true,
  unique (entreprise_id, nom)
);

-- ---------------------------------------------------------------------
-- Chantiers
-- ---------------------------------------------------------------------
create table chantiers (
  id                  uuid primary key default gen_random_uuid(),
  entreprise_id       uuid not null references entreprises(id) on delete cascade,
  nom                 text not null,               -- "Villa Dupont – rénovation SDB"
  client_id           uuid references clients(id) on delete set null,
  adresse             text,
  npa                 text,
  localite            text,
  statut              statut_chantier not null default 'prevu',
  date_debut          date,
  date_fin            date,
  notes               text,
  created_at          timestamptz not null default now()
);
create index on chantiers (entreprise_id, statut);

-- Qui travaille sur quel chantier (un ouvrier ne voit que ceux-là)
create table chantier_membres (
  chantier_id         uuid not null references chantiers(id) on delete cascade,
  membre_id           uuid not null references membres(id) on delete cascade,
  entreprise_id       uuid not null references entreprises(id) on delete cascade,
  primary key (chantier_id, membre_id)
);
create index on chantier_membres (membre_id);

create or replace function est_assigne(p_chantier uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from chantier_membres cm
    join membres m on m.id = cm.membre_id
    where cm.chantier_id = p_chantier and m.user_id = auth.uid() and m.actif
  )
$$;

-- ---------------------------------------------------------------------
-- Numérotation des documents : DEV-2026-001, FAC-2026-001
-- Un compteur par entreprise, par type et par année (sans trou, sans doublon)
-- ---------------------------------------------------------------------
create table compteurs (
  entreprise_id       uuid not null references entreprises(id) on delete cascade,
  type                type_document not null,
  annee               int not null,
  dernier             int not null default 0,
  primary key (entreprise_id, type, annee)
);

create or replace function prochain_numero(p_entreprise uuid, p_type type_document, p_date date)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_annee int := extract(year from coalesce(p_date, current_date));
  v_num   int;
begin
  if not est_gestion(p_entreprise) then
    raise exception 'Accès refusé';
  end if;
  insert into compteurs (entreprise_id, type, annee, dernier)
  values (p_entreprise, p_type, v_annee, 1)
  on conflict (entreprise_id, type, annee)
  do update set dernier = compteurs.dernier + 1
  returning dernier into v_num;

  return (case p_type when 'devis' then 'DEV' else 'FAC' end)
         || '-' || v_annee || '-' || lpad(v_num::text, 3, '0');
end;
$$;

-- ---------------------------------------------------------------------
-- Devis
-- ---------------------------------------------------------------------
create table devis (
  id                  uuid primary key default gen_random_uuid(),
  entreprise_id       uuid not null references entreprises(id) on delete cascade,
  numero              text,
  client_id           uuid not null references clients(id),
  chantier_id         uuid references chantiers(id) on delete set null,
  objet               text,
  date_devis          date not null default current_date,
  validite_jours      int not null default 30,
  statut              statut_devis not null default 'brouillon',
  tva_taux            numeric(4,2) not null default 8.10,
  notes               text,
  created_at          timestamptz not null default now(),
  unique (entreprise_id, numero)
);
create index on devis (entreprise_id, statut);

create table devis_lignes (
  id                  uuid primary key default gen_random_uuid(),
  devis_id            uuid not null references devis(id) on delete cascade,
  entreprise_id       uuid not null references entreprises(id) on delete cascade,
  position            int not null default 1,
  article_id          uuid references articles(id) on delete set null,
  designation         text not null,
  unite               text not null default 'u',
  quantite            numeric(12,3) not null default 1,
  prix_unitaire       numeric(12,2) not null default 0,
  remise_pct          numeric(5,2) not null default 0 check (remise_pct between 0 and 100),
  total_ht            numeric(12,2) generated always as
                        (round(quantite * prix_unitaire * (1 - remise_pct / 100), 2)) stored
);
create index on devis_lignes (devis_id);

-- ---------------------------------------------------------------------
-- Rapports de chantier (saisis sur le téléphone)
-- ---------------------------------------------------------------------
create table rapports (
  id                  uuid primary key default gen_random_uuid(),
  entreprise_id       uuid not null references entreprises(id) on delete cascade,
  chantier_id         uuid not null references chantiers(id) on delete cascade,
  auteur_id           uuid not null references membres(id),
  date_rapport        date not null default current_date,
  statut              statut_rapport not null default 'brouillon',
  est_regie           boolean not null default false,   -- bon de régie à faire signer
  remarques           text,
  signature_path      text,                              -- image de la signature client (Storage)
  signe_par           text,
  signe_le            timestamptz,
  created_at          timestamptz not null default now()
);
create index on rapports (chantier_id, date_rapport);

create table rapport_heures (
  id                  uuid primary key default gen_random_uuid(),
  rapport_id          uuid not null references rapports(id) on delete cascade,
  entreprise_id       uuid not null references entreprises(id) on delete cascade,
  membre_id           uuid not null references membres(id),   -- l'ouvrier qui a travaillé
  heures              numeric(5,2) not null check (heures > 0 and heures <= 24),
  type                type_heure not null default 'normal',
  description         text,
  facture_id          uuid                                    -- rempli quand facturé (FK plus bas)
);
create index on rapport_heures (rapport_id);

create table rapport_materiel (
  id                  uuid primary key default gen_random_uuid(),
  rapport_id          uuid not null references rapports(id) on delete cascade,
  entreprise_id       uuid not null references entreprises(id) on delete cascade,
  article_id          uuid references articles(id),
  designation         text not null,                 -- copie (ou texte libre si achat direct)
  unite               text not null default 'u',
  quantite            numeric(12,3) not null check (quantite > 0),
  depot_id            uuid references depots(id),     -- null = acheté directement / livré sur chantier
  facture_id          uuid
);
create index on rapport_materiel (rapport_id);

create table photos (
  id                  uuid primary key default gen_random_uuid(),
  entreprise_id       uuid not null references entreprises(id) on delete cascade,
  rapport_id          uuid not null references rapports(id) on delete cascade,
  storage_path        text not null,                 -- bucket "photos/<entreprise_id>/..."
  legende             text,
  created_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Mouvements de stock
-- quantite > 0 = entrée au dépôt, quantite < 0 = sortie
-- Les sorties liées à un rapport sont créées AUTOMATIQUEMENT (trigger).
-- ---------------------------------------------------------------------
create table stock_mouvements (
  id                  uuid primary key default gen_random_uuid(),
  entreprise_id       uuid not null references entreprises(id) on delete cascade,
  article_id          uuid not null references articles(id),
  depot_id            uuid not null references depots(id),
  quantite            numeric(12,3) not null check (quantite <> 0),
  type                type_mouvement not null,
  chantier_id         uuid references chantiers(id) on delete set null,
  rapport_materiel_id uuid unique references rapport_materiel(id) on delete cascade,
  note                text,
  cree_par            uuid references membres(id),
  created_at          timestamptz not null default now()
);
create index on stock_mouvements (entreprise_id, article_id, depot_id);

-- ---------------------------------------------------------------------
-- Factures
-- ---------------------------------------------------------------------
create table factures (
  id                  uuid primary key default gen_random_uuid(),
  entreprise_id       uuid not null references entreprises(id) on delete cascade,
  numero              text,
  type                type_facture not null default 'forfait',
  client_id           uuid not null references clients(id),
  chantier_id         uuid references chantiers(id) on delete set null,
  devis_id            uuid references devis(id) on delete set null,
  objet               text,
  date_facture        date not null default current_date,
  echeance            date,
  statut              statut_facture not null default 'brouillon',
  tva_taux            numeric(4,2) not null default 8.10,
  qr_reference        text,          -- référence QR (27 chiffres) ou SCOR, générée à l'émission
  notes               text,
  payee_le            date,
  created_at          timestamptz not null default now(),
  unique (entreprise_id, numero)
);
create index on factures (entreprise_id, statut);

create table facture_lignes (
  id                  uuid primary key default gen_random_uuid(),
  facture_id          uuid not null references factures(id) on delete cascade,
  entreprise_id       uuid not null references entreprises(id) on delete cascade,
  position            int not null default 1,
  article_id          uuid references articles(id) on delete set null,
  designation         text not null,
  unite               text not null default 'u',
  quantite            numeric(12,3) not null default 1,
  prix_unitaire       numeric(12,2) not null default 0,
  remise_pct          numeric(5,2) not null default 0 check (remise_pct between 0 and 100),
  total_ht            numeric(12,2) generated always as
                        (round(quantite * prix_unitaire * (1 - remise_pct / 100), 2)) stored
);
create index on facture_lignes (facture_id);

alter table rapport_heures   add constraint rapport_heures_facture_fk   foreign key (facture_id) references factures(id) on delete set null;
alter table rapport_materiel add constraint rapport_materiel_facture_fk foreign key (facture_id) references factures(id) on delete set null;

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- 1) Numéro automatique à la création d'un devis / d'une facture
create or replace function trg_numero_devis() returns trigger
language plpgsql as $$
begin
  if new.numero is null then
    new.numero := prochain_numero(new.entreprise_id, 'devis', new.date_devis);
  end if;
  return new;
end $$;
create trigger devis_numero before insert on devis
  for each row execute function trg_numero_devis();

create or replace function trg_numero_facture() returns trigger
language plpgsql as $$
begin
  if new.numero is null then
    new.numero := prochain_numero(new.entreprise_id, 'facture', new.date_facture);
  end if;
  if new.echeance is null then
    new.echeance := new.date_facture
      + (select delai_paiement_jours from entreprises where id = new.entreprise_id);
  end if;
  return new;
end $$;
create trigger factures_numero before insert on factures
  for each row execute function trg_numero_facture();

-- 2) Cohérence multi-entreprise : une ligne enfant hérite toujours de
--    l'entreprise de son parent (impossible de "glisser" une ligne
--    dans une autre entreprise, même avec un appel API trafiqué).
create or replace function trg_entreprise_depuis_rapport() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select entreprise_id into new.entreprise_id from rapports where id = new.rapport_id;
  return new;
end $$;
create trigger rh_entreprise before insert or update on rapport_heures
  for each row execute function trg_entreprise_depuis_rapport();
create trigger rm_entreprise before insert or update on rapport_materiel
  for each row execute function trg_entreprise_depuis_rapport();
create trigger photos_entreprise before insert or update on photos
  for each row execute function trg_entreprise_depuis_rapport();

create or replace function trg_entreprise_depuis_chantier() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select entreprise_id into new.entreprise_id from chantiers where id = new.chantier_id;
  return new;
end $$;
create trigger rapports_entreprise before insert or update on rapports
  for each row execute function trg_entreprise_depuis_chantier();
create trigger cm_entreprise before insert or update on chantier_membres
  for each row execute function trg_entreprise_depuis_chantier();

create or replace function trg_entreprise_depuis_devis() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select entreprise_id into new.entreprise_id from devis where id = new.devis_id;
  return new;
end $$;
create trigger dl_entreprise before insert or update on devis_lignes
  for each row execute function trg_entreprise_depuis_devis();

create or replace function trg_entreprise_depuis_facture() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select entreprise_id into new.entreprise_id from factures where id = new.facture_id;
  return new;
end $$;
create trigger fl_entreprise before insert or update on facture_lignes
  for each row execute function trg_entreprise_depuis_facture();

-- 3) LE CŒUR DU PRODUIT : matériel saisi sur le chantier → sortie de stock
--    "1 palette de briques, origine dépôt d'Aigle" = -1 palette au dépôt.
create or replace function trg_materiel_vers_stock() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_stockable boolean;
  v_chantier  uuid;
  v_auteur    uuid;
begin
  if tg_op = 'DELETE' then
    return old;  -- le mouvement est supprimé par "on delete cascade"
  end if;

  select a.stockable into v_stockable from articles a where a.id = new.article_id;
  select r.chantier_id, r.auteur_id into v_chantier, v_auteur from rapports r where r.id = new.rapport_id;

  if new.depot_id is not null and coalesce(v_stockable, false) then
    insert into stock_mouvements (entreprise_id, article_id, depot_id, quantite, type,
                                  chantier_id, rapport_materiel_id, cree_par, note)
    values (new.entreprise_id, new.article_id, new.depot_id, -new.quantite, 'sortie',
            v_chantier, new.id, v_auteur, 'Sortie automatique depuis rapport de chantier')
    on conflict (rapport_materiel_id) do update
      set article_id = excluded.article_id,
          depot_id   = excluded.depot_id,
          quantite   = excluded.quantite;
  else
    -- plus de dépôt (ou article non stockable) : on retire le mouvement éventuel
    delete from stock_mouvements where rapport_materiel_id = new.id;
  end if;
  return new;
end $$;
create trigger rm_stock after insert or update on rapport_materiel
  for each row execute function trg_materiel_vers_stock();

-- 4) Un rapport validé ou facturé ne se modifie plus côté ouvrier
--    (géré par la RLS : l'ouvrier ne peut modifier que ses brouillons).

-- =====================================================================
-- VUES
-- security_invoker = true : la vue applique la RLS de l'utilisateur.
-- =====================================================================

-- Stock actuel par article et par dépôt
create view stock_niveaux with (security_invoker = true) as
select m.entreprise_id,
       m.article_id,
       a.designation,
       a.unite,
       m.depot_id,
       d.nom as depot,
       sum(m.quantite) as quantite,
       a.stock_alerte,
       (a.stock_alerte is not null and sum(m.quantite) <= a.stock_alerte) as en_alerte
from stock_mouvements m
join articles a on a.id = m.article_id
join depots d   on d.id = m.depot_id
group by m.entreprise_id, m.article_id, a.designation, a.unite, m.depot_id, d.nom, a.stock_alerte;

-- Totaux des devis et factures (HT, TVA, TTC) arrondis au centime
create view devis_totaux with (security_invoker = true) as
select d.id as devis_id, d.entreprise_id,
       coalesce(sum(l.total_ht), 0)                                         as total_ht,
       round(coalesce(sum(l.total_ht), 0) * d.tva_taux / 100, 2)            as total_tva,
       coalesce(sum(l.total_ht), 0) + round(coalesce(sum(l.total_ht), 0) * d.tva_taux / 100, 2) as total_ttc
from devis d left join devis_lignes l on l.devis_id = d.id
group by d.id;

create view facture_totaux with (security_invoker = true) as
select f.id as facture_id, f.entreprise_id,
       coalesce(sum(l.total_ht), 0)                                         as total_ht,
       round(coalesce(sum(l.total_ht), 0) * f.tva_taux / 100, 2)            as total_tva,
       coalesce(sum(l.total_ht), 0) + round(coalesce(sum(l.total_ht), 0) * f.tva_taux / 100, 2) as total_ttc
from factures f left join facture_lignes l on l.facture_id = f.id
group by f.id;

-- Rentabilité par chantier : devis accepté vs coût réel (heures + matériel)
-- Réservé au patron / bureau (les tables sources ont la RLS adéquate).
create view chantier_rentabilite with (security_invoker = true) as
with budget as (
  select d.chantier_id, sum(t.total_ht) as budget_ht
  from devis d join devis_totaux t on t.devis_id = d.id
  where d.statut = 'accepte' and d.chantier_id is not null
  group by d.chantier_id
),
heures as (
  select r.chantier_id,
         sum(h.heures)                  as heures,
         sum(h.heures * coalesce(mc.cout_horaire, 0)) as cout_heures
  from rapport_heures h
  join rapports r on r.id = h.rapport_id
  left join membre_couts mc on mc.membre_id = h.membre_id
  group by r.chantier_id
),
materiel as (
  select r.chantier_id,
         sum(rm.quantite * coalesce(a.prix_achat, 0)) as cout_materiel
  from rapport_materiel rm
  join rapports r on r.id = rm.rapport_id
  left join articles a on a.id = rm.article_id
  group by r.chantier_id
),
facture as (
  select f.chantier_id, sum(t.total_ht) as facture_ht
  from factures f join facture_totaux t on t.facture_id = f.id
  where f.statut <> 'annulee' and f.chantier_id is not null
  group by f.chantier_id
)
select c.id as chantier_id, c.entreprise_id, c.nom, c.statut,
       coalesce(b.budget_ht, 0)                                    as budget_ht,
       coalesce(h.heures, 0)                                       as heures,
       round(coalesce(h.cout_heures, 0), 2)                        as cout_heures,
       round(coalesce(m.cout_materiel, 0), 2)                      as cout_materiel,
       round(coalesce(h.cout_heures, 0) + coalesce(m.cout_materiel, 0), 2) as cout_total,
       round(coalesce(b.budget_ht, 0) - coalesce(h.cout_heures, 0) - coalesce(m.cout_materiel, 0), 2) as marge_prevue,
       case when coalesce(b.budget_ht, 0) > 0
            then round((coalesce(h.cout_heures, 0) + coalesce(m.cout_materiel, 0)) / b.budget_ht * 100, 1)
       end                                                         as budget_consomme_pct,
       coalesce(f.facture_ht, 0)                                   as facture_ht
from chantiers c
left join budget b   on b.chantier_id = c.id
left join heures h   on h.chantier_id = c.id
left join materiel m on m.chantier_id = c.id
left join facture f  on f.chantier_id = c.id
where est_gestion(c.entreprise_id);

-- Catalogue pour le terrain : SANS prix d'achat ni prix de vente.
-- (security definer implicite : la vue filtre elle-même par appartenance)
create view articles_terrain with (security_barrier = true) as
select a.id, a.entreprise_id, a.type, a.designation, a.categorie, a.unite, a.stockable
from articles a
where a.actif and est_membre(a.entreprise_id);

-- =====================================================================
-- FONCTIONS MÉTIER ("en un clic")
-- =====================================================================

-- Inscription : crée l'entreprise et fait de l'utilisateur son patron
create or replace function creer_entreprise(p_nom text, p_prenom text, p_nom_patron text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Non connecté'; end if;
  insert into entreprises (nom) values (p_nom) returning id into v_id;
  insert into membres (entreprise_id, user_id, role, prenom, nom, email)
  values (v_id, auth.uid(), 'patron', p_prenom, p_nom_patron,
          (select email from auth.users where id = auth.uid()));
  insert into depots (entreprise_id, nom) values (v_id, 'Dépôt principal');
  return v_id;
end $$;

-- Devis accepté → chantier créé en un clic
create or replace function creer_chantier_depuis_devis(p_devis uuid)
returns uuid
language plpgsql security invoker set search_path = public as $$
declare d devis; v_id uuid; v_client clients;
begin
  select * into d from devis where id = p_devis;
  if d.id is null or not est_gestion(d.entreprise_id) then raise exception 'Accès refusé'; end if;
  if d.chantier_id is not null then return d.chantier_id; end if;
  select * into v_client from clients where id = d.client_id;
  insert into chantiers (entreprise_id, nom, client_id, adresse, npa, localite, statut)
  values (d.entreprise_id, coalesce(d.objet, 'Chantier ' || d.numero), d.client_id,
          v_client.adresse, v_client.npa, v_client.localite, 'prevu')
  returning id into v_id;
  update devis set chantier_id = v_id, statut = 'accepte' where id = p_devis;
  return v_id;
end $$;

-- Devis → facture (forfait) en un clic
create or replace function facturer_devis(p_devis uuid, p_type type_facture default 'finale')
returns uuid
language plpgsql security invoker set search_path = public as $$
declare d devis; v_id uuid;
begin
  select * into d from devis where id = p_devis;
  if d.id is null or not est_gestion(d.entreprise_id) then raise exception 'Accès refusé'; end if;
  insert into factures (entreprise_id, type, client_id, chantier_id, devis_id, objet, tva_taux)
  values (d.entreprise_id, p_type, d.client_id, d.chantier_id, d.id, d.objet, d.tva_taux)
  returning id into v_id;
  insert into facture_lignes (facture_id, entreprise_id, position, article_id, designation, unite, quantite, prix_unitaire, remise_pct)
  select v_id, d.entreprise_id, position, article_id, designation, unite, quantite, prix_unitaire, remise_pct
  from devis_lignes where devis_id = p_devis order by position;
  return v_id;
end $$;

-- Chantier en régie → facture en un clic avec les heures et le matériel
-- réellement saisis (non encore facturés) sur une période.
create or replace function facturer_regie(p_chantier uuid, p_du date default null, p_au date default null)
returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  c chantiers; e entreprises; v_id uuid; v_pos int := 0; v_tarif numeric;
  r record;
begin
  select * into c from chantiers where id = p_chantier;
  if c.id is null or not est_gestion(c.entreprise_id) then raise exception 'Accès refusé'; end if;
  if c.client_id is null then raise exception 'Le chantier n''a pas de client'; end if;
  select * into e from entreprises where id = c.entreprise_id;
  v_tarif := coalesce(e.tarif_regie_vente, e.tarif_horaire_vente);

  insert into factures (entreprise_id, type, client_id, chantier_id, objet, tva_taux)
  values (c.entreprise_id, 'regie', c.client_id, c.id, 'Travaux en régie – ' || c.nom,
          case when e.assujetti_tva then e.tva_taux_defaut else 0 end)
  returning id into v_id;

  -- Heures regroupées par type
  for r in
    select h.type, sum(h.heures) as heures
    from rapport_heures h join rapports rp on rp.id = h.rapport_id
    where rp.chantier_id = p_chantier and h.facture_id is null and rp.statut <> 'brouillon'
      and (p_du is null or rp.date_rapport >= p_du) and (p_au is null or rp.date_rapport <= p_au)
    group by h.type order by h.type
  loop
    v_pos := v_pos + 1;
    insert into facture_lignes (facture_id, entreprise_id, position, designation, unite, quantite, prix_unitaire)
    values (v_id, c.entreprise_id, v_pos,
            case r.type when 'regie' then 'Main-d''œuvre en régie'
                        when 'deplacement' then 'Déplacements'
                        else 'Main-d''œuvre' end,
            'h', r.heures, v_tarif);
  end loop;

  -- Matériel regroupé par article, au prix de vente
  for r in
    select rm.article_id, rm.designation, rm.unite, sum(rm.quantite) as quantite,
           coalesce(max(a.prix_vente), 0) as prix
    from rapport_materiel rm join rapports rp on rp.id = rm.rapport_id
    left join articles a on a.id = rm.article_id
    where rp.chantier_id = p_chantier and rm.facture_id is null and rp.statut <> 'brouillon'
      and (p_du is null or rp.date_rapport >= p_du) and (p_au is null or rp.date_rapport <= p_au)
    group by rm.article_id, rm.designation, rm.unite order by rm.designation
  loop
    v_pos := v_pos + 1;
    insert into facture_lignes (facture_id, entreprise_id, position, article_id, designation, unite, quantite, prix_unitaire)
    values (v_id, c.entreprise_id, v_pos, r.article_id, r.designation, r.unite, r.quantite, r.prix);
  end loop;

  if v_pos = 0 then raise exception 'Rien à facturer sur cette période'; end if;

  -- Marquer comme facturé (évite la double facturation)
  update rapport_heures h set facture_id = v_id
  from rapports rp
  where rp.id = h.rapport_id and rp.chantier_id = p_chantier and h.facture_id is null and rp.statut <> 'brouillon'
    and (p_du is null or rp.date_rapport >= p_du) and (p_au is null or rp.date_rapport <= p_au);
  update rapport_materiel rm set facture_id = v_id
  from rapports rp
  where rp.id = rm.rapport_id and rp.chantier_id = p_chantier and rm.facture_id is null and rp.statut <> 'brouillon'
    and (p_du is null or rp.date_rapport >= p_du) and (p_au is null or rp.date_rapport <= p_au);

  return v_id;
end $$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table entreprises       enable row level security;
alter table membres           enable row level security;
alter table membre_couts      enable row level security;
alter table clients           enable row level security;
alter table articles          enable row level security;
alter table depots            enable row level security;
alter table chantiers         enable row level security;
alter table chantier_membres  enable row level security;
alter table compteurs         enable row level security;
alter table devis             enable row level security;
alter table devis_lignes      enable row level security;
alter table rapports          enable row level security;
alter table rapport_heures    enable row level security;
alter table rapport_materiel  enable row level security;
alter table photos            enable row level security;
alter table stock_mouvements  enable row level security;
alter table factures          enable row level security;
alter table facture_lignes    enable row level security;

-- Entreprise : visible par ses membres, modifiable par le patron
create policy entreprise_lecture on entreprises for select using (est_membre(id));
create policy entreprise_maj     on entreprises for update using (est_patron(id)) with check (est_patron(id));

-- Membres : chacun voit son équipe ; le patron gère l'équipe
create policy membres_lecture on membres for select using (est_membre(entreprise_id));
create policy membres_gestion on membres for all    using (est_patron(entreprise_id)) with check (est_patron(entreprise_id));

-- Tables "bureau" : patron + bureau uniquement
create policy clients_gestion   on clients        for all using (est_gestion(entreprise_id)) with check (est_gestion(entreprise_id));
create policy articles_gestion  on articles       for all using (est_gestion(entreprise_id)) with check (est_gestion(entreprise_id));
create policy devis_gestion     on devis          for all using (est_gestion(entreprise_id)) with check (est_gestion(entreprise_id));
create policy dl_gestion        on devis_lignes   for all using (est_gestion(entreprise_id)) with check (est_gestion(entreprise_id));
create policy factures_gestion  on factures       for all using (est_gestion(entreprise_id)) with check (est_gestion(entreprise_id));
create policy fl_gestion        on facture_lignes for all using (est_gestion(entreprise_id)) with check (est_gestion(entreprise_id));
create policy compteurs_lecture on compteurs      for select using (est_gestion(entreprise_id));

-- Dépôts : tout le monde les voit (choix "origine dépôt"), le bureau les gère
create policy depots_lecture on depots for select using (est_membre(entreprise_id));
create policy depots_gestion on depots for all    using (est_gestion(entreprise_id)) with check (est_gestion(entreprise_id));

-- Stock : bureau gère ; les sorties terrain passent par le trigger
create policy stock_gestion on stock_mouvements for all using (est_gestion(entreprise_id)) with check (est_gestion(entreprise_id));

-- Chantiers : bureau = tous ; ouvrier = seulement ceux où il est assigné
create policy chantiers_gestion on chantiers for all using (est_gestion(entreprise_id)) with check (est_gestion(entreprise_id));
create policy chantiers_terrain on chantiers for select using (est_assigne(id));

create policy cm_gestion on chantier_membres for all using (est_gestion(entreprise_id)) with check (est_gestion(entreprise_id));
create policy cm_terrain on chantier_membres for select using (est_membre(entreprise_id) and membre_id = mon_membre_id(entreprise_id));

-- Rapports : bureau = tous ; ouvrier = crée et lit ses rapports sur ses
-- chantiers, modifie uniquement tant que c'est un brouillon (ou pour l'envoyer)
create policy rapports_gestion on rapports for all using (est_gestion(entreprise_id)) with check (est_gestion(entreprise_id));
create policy rapports_terrain_lecture on rapports for select
  using (est_assigne(chantier_id) and auteur_id = mon_membre_id(entreprise_id));
create policy rapports_terrain_creation on rapports for insert
  with check (est_assigne(chantier_id) and auteur_id = mon_membre_id(entreprise_id) and statut = 'brouillon');
create policy rapports_terrain_maj on rapports for update
  using (est_assigne(chantier_id) and auteur_id = mon_membre_id(entreprise_id) and statut = 'brouillon')
  with check (auteur_id = mon_membre_id(entreprise_id) and statut in ('brouillon', 'envoye'));

-- Lignes d'un rapport : suivent les droits du rapport parent
create or replace function peut_ecrire_rapport(p_rapport uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from rapports r
    where r.id = p_rapport
      and (est_gestion(r.entreprise_id)
           or (r.statut = 'brouillon' and r.auteur_id = mon_membre_id(r.entreprise_id) and est_assigne(r.chantier_id)))
  )
$$;
create or replace function peut_lire_rapport(p_rapport uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from rapports r
    where r.id = p_rapport
      and (est_gestion(r.entreprise_id) or r.auteur_id = mon_membre_id(r.entreprise_id))
  )
$$;

create policy rh_lecture  on rapport_heures   for select using (peut_lire_rapport(rapport_id));
create policy rh_ecriture on rapport_heures   for all    using (peut_ecrire_rapport(rapport_id)) with check (peut_ecrire_rapport(rapport_id));
create policy rm_lecture  on rapport_materiel for select using (peut_lire_rapport(rapport_id));
create policy rm_ecriture on rapport_materiel for all    using (peut_ecrire_rapport(rapport_id)) with check (peut_ecrire_rapport(rapport_id));
create policy ph_lecture  on photos           for select using (peut_lire_rapport(rapport_id));
create policy ph_ecriture on photos           for all    using (peut_ecrire_rapport(rapport_id)) with check (peut_ecrire_rapport(rapport_id));

-- Un ouvrier ne déclare des heures QUE pour lui-même (le chef d'équipe passera par le rôle bureau)
-- (entreprise_id est déjà rempli par le trigger BEFORE quand la politique est vérifiée)
create policy rh_ouvrier_soi_ins on rapport_heures as restrictive for insert
  with check (est_gestion(entreprise_id) or membre_id = mon_membre_id(entreprise_id));
create policy rh_ouvrier_soi_maj on rapport_heures as restrictive for update
  using (true)
  with check (est_gestion(entreprise_id) or membre_id = mon_membre_id(entreprise_id));

-- Coûts internes : patron + bureau uniquement
create policy couts_gestion on membre_couts for all using (est_gestion(entreprise_id)) with check (est_gestion(entreprise_id));

-- =====================================================================
-- Droits d'accès des rôles Supabase
-- =====================================================================
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
revoke all on all tables in schema public from anon;
