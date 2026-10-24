-- =====================================================================
-- RELAIS — la secrétaire IA des petites entreprises
-- Schéma PostgreSQL / Supabase (région Zurich)
--
-- Principes de sécurité :
--   * Chaque ligne porte entreprise_id ; RLS sur toutes les tables.
--   * Les mots de passe et jetons des boîtes mail sont CHIFFRÉS par
--     l'application (AES-256-GCM) et stockés dans une table sans aucune
--     politique RLS : seul le serveur (clé service_role) peut la lire.
--   * L'IA ne fait que PROPOSER : aucun e-mail ne part sans validation
--     humaine (statut du brouillon 'a_valider' → 'envoye' par un membre).
-- =====================================================================

create extension if not exists pgcrypto;

create type role_membre       as enum ('admin', 'membre');
create type fournisseur_mail  as enum ('imap', 'gmail', 'microsoft');
create type statut_compte     as enum ('actif', 'erreur', 'pause', 'a_reconnecter');
create type statut_message    as enum ('nouveau', 'a_traiter', 'repondu', 'ignore', 'archive', 'erreur_analyse');
create type categorie_message as enum ('demande_devis', 'rendez_vous', 'question_client', 'reclamation',
                                       'facture_fournisseur', 'administratif', 'publicite', 'autre');
create type urgence_message   as enum ('haute', 'normale', 'basse');
create type statut_brouillon  as enum ('a_valider', 'envoye', 'abandonne', 'erreur_envoi');

-- ---------------------------------------------------------------------
-- Entreprises clientes et leur "fiche" pour l'assistant
-- ---------------------------------------------------------------------
create table entreprises (
  id                    uuid primary key default gen_random_uuid(),
  nom                   text not null,
  -- Ce que l'IA doit savoir pour bien répondre
  activite              text,            -- "Entreprise de peinture et plâtrerie, 6 personnes"
  services              text,            -- "Peinture intérieure/extérieure, crépis, plâtre, papier peint"
  zone                  text,            -- "Chablais, Riviera, Lausanne"
  delai_habituel        text,            -- "Visite sous 5 jours ouvrables, devis sous 10 jours"
  ton                   text not null default 'Vouvoiement, chaleureux et professionnel, phrases courtes',
  signature             text,
  consignes             text,            -- règles libres : "Ne jamais donner de prix par e-mail", etc.
  langue                text not null default 'fr',
  -- Récapitulatif du soir
  recap_actif           boolean not null default true,
  recap_heure           smallint not null default 18 check (recap_heure between 0 and 23),
  recap_email           text,
  -- Garde-fou de coût IA (en centimes de CHF par mois)
  plafond_ia_centimes   int not null default 1500,
  plan                  text not null default 'essai' check (plan in ('essai', 'solo', 'equipe', 'pilote')),
  essai_fin_le          date default (current_date + 30),
  created_at            timestamptz not null default now()
);

create table membres (
  id                    uuid primary key default gen_random_uuid(),
  entreprise_id         uuid not null references entreprises(id) on delete cascade,
  user_id               uuid not null references auth.users(id) on delete cascade,
  role                  role_membre not null default 'membre',
  prenom                text,
  nom                   text,
  email                 text,
  created_at            timestamptz not null default now(),
  unique (entreprise_id, user_id)
);
create index on membres (user_id);

-- ---------------------------------------------------------------------
-- Aides RLS
-- ---------------------------------------------------------------------
create or replace function est_membre(p_entreprise uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from membres where entreprise_id = p_entreprise and user_id = auth.uid())
$$;

create or replace function est_admin(p_entreprise uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from membres where entreprise_id = p_entreprise and user_id = auth.uid() and role = 'admin')
$$;

-- ---------------------------------------------------------------------
-- Boîtes mail connectées
-- ---------------------------------------------------------------------
create table comptes_mail (
  id                    uuid primary key default gen_random_uuid(),
  entreprise_id         uuid not null references entreprises(id) on delete cascade,
  fournisseur           fournisseur_mail not null,
  libelle               text not null,              -- "Contact", "Patron"…
  email                 text not null,
  -- Réglages IMAP/SMTP (fournisseur = 'imap' : Infomaniak, Gmail mot de passe d'application, autres)
  imap_hote             text,
  imap_port             int,
  smtp_hote             text,
  smtp_port             int,
  smtp_securise         boolean,                     -- true = SSL direct (465), false = STARTTLS (587)
  statut                statut_compte not null default 'actif',
  derniere_erreur       text,
  derniere_synchro      timestamptz,
  curseur               jsonb not null default '{}'::jsonb,   -- position de lecture (uid IMAP, date…)
  created_at            timestamptz not null default now(),
  unique (entreprise_id, email)
);

-- Secrets chiffrés : AUCUNE politique RLS → invisible pour les utilisateurs,
-- même connectés. Seul le serveur (service_role) y accède.
create table comptes_mail_secrets (
  compte_id             uuid primary key references comptes_mail(id) on delete cascade,
  entreprise_id         uuid not null references entreprises(id) on delete cascade,
  chiffre               text not null,     -- base64 (AES-256-GCM)
  iv                    text not null,
  tag                   text not null,
  updated_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Messages reçus
-- ---------------------------------------------------------------------
create table messages (
  id                    uuid primary key default gen_random_uuid(),
  entreprise_id         uuid not null references entreprises(id) on delete cascade,
  compte_id             uuid not null references comptes_mail(id) on delete cascade,
  id_fournisseur        text not null,      -- uid IMAP / id Gmail / id Graph
  fil_id                text,               -- threadId Gmail / conversationId Graph
  message_id_entete     text,               -- en-tête Message-ID (pour répondre dans le même fil)
  references_entete     text,
  expediteur_nom        text,
  expediteur_email      text not null,
  destinataire          text,
  sujet                 text not null default '(sans objet)',
  corps_texte           text not null default '',
  extrait               text,
  recu_le               timestamptz not null,
  statut                statut_message not null default 'nouveau',
  created_at            timestamptz not null default now(),
  unique (compte_id, id_fournisseur)
);
create index on messages (entreprise_id, statut, recu_le desc);

-- Analyse de l'IA (une par message)
create table analyses (
  message_id            uuid primary key references messages(id) on delete cascade,
  entreprise_id         uuid not null references entreprises(id) on delete cascade,
  categorie             categorie_message not null,
  urgence               urgence_message not null default 'normale',
  resume                text not null,
  infos                 jsonb not null default '{}'::jsonb,   -- {nom, telephone, adresse, travaux, delai…}
  infos_manquantes      jsonb not null default '[]'::jsonb,   -- ["adresse du chantier", "surface"]
  action_suggeree       text,
  reponse_necessaire    boolean not null default true,
  modele                text,
  tokens_entree         int,
  tokens_sortie         int,
  created_at            timestamptz not null default now()
);

-- Brouillon de réponse préparé par l'IA, à valider par un humain
create table brouillons (
  id                    uuid primary key default gen_random_uuid(),
  message_id            uuid not null unique references messages(id) on delete cascade,
  entreprise_id         uuid not null references entreprises(id) on delete cascade,
  sujet                 text not null,
  corps                 text not null,
  statut                statut_brouillon not null default 'a_valider',
  modifie               boolean not null default false,  -- l'humain a retouché le texte
  erreur                text,
  envoye_le             timestamptz,
  envoye_par            uuid references membres(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Consommation IA par mois (garde-fou de coût)
create table usage_ia (
  entreprise_id         uuid not null references entreprises(id) on delete cascade,
  mois                  date not null,                  -- 1er jour du mois
  appels                int not null default 0,
  tokens_entree         bigint not null default 0,
  tokens_sortie         bigint not null default 0,
  cout_microchf         bigint not null default 0,      -- 1 CHF = 1 000 000
  primary key (entreprise_id, mois)
);

create or replace function ajouter_usage_ia(p_entreprise uuid, p_entree int, p_sortie int, p_cout_microchf bigint)
returns void language sql security definer set search_path = public as $$
  insert into usage_ia (entreprise_id, mois, appels, tokens_entree, tokens_sortie, cout_microchf)
  values (p_entreprise, date_trunc('month', now())::date, 1, p_entree, p_sortie, p_cout_microchf)
  on conflict (entreprise_id, mois) do update
    set appels = usage_ia.appels + 1,
        tokens_entree = usage_ia.tokens_entree + excluded.tokens_entree,
        tokens_sortie = usage_ia.tokens_sortie + excluded.tokens_sortie,
        cout_microchf = usage_ia.cout_microchf + excluded.cout_microchf
$$;
revoke execute on function ajouter_usage_ia(uuid, int, int, bigint) from public;
-- (Supabase accorde par défaut l'exécution à anon et authenticated : on retire explicitement)
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke execute on function ajouter_usage_ia(uuid, int, int, bigint) from anon, authenticated;
  end if;
end $$;

create or replace function plafond_ia_atteint(p_entreprise uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select u.cout_microchf from usage_ia u
                   where u.entreprise_id = p_entreprise and u.mois = date_trunc('month', now())::date), 0)
         >= (select e.plafond_ia_centimes::bigint * 10000 from entreprises e where e.id = p_entreprise)
$$;

-- Récaps déjà envoyés (évite les doublons)
create table recaps (
  entreprise_id         uuid not null references entreprises(id) on delete cascade,
  jour                  date not null,
  envoye_le             timestamptz not null default now(),
  primary key (entreprise_id, jour)
);

-- Journal d'audit
create table journal (
  id                    bigint generated always as identity primary key,
  entreprise_id         uuid not null references entreprises(id) on delete cascade,
  acteur                uuid,                -- auth.users.id, null = système
  action                text not null,       -- "brouillon.envoye", "compte.ajoute"…
  cible                 text,
  details               jsonb,
  created_at            timestamptz not null default now()
);
create index on journal (entreprise_id, created_at desc);

-- ---------------------------------------------------------------------
-- Garde-fous sur les brouillons
-- ---------------------------------------------------------------------
-- 1) Un utilisateur ne peut PAS passer lui-même un brouillon à 'envoye' :
--    seul le serveur le fait, après envoi réel. Il peut modifier le texte
--    ou abandonner le brouillon.
create or replace function trg_brouillon_garde() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null then                       -- appel d'un utilisateur (pas du serveur)
    if new.statut not in ('a_valider', 'abandonne') then
      raise exception 'Statut réservé au serveur';
    end if;
    if old.statut <> 'a_valider' then
      raise exception 'Brouillon déjà traité';
    end if;
    if new.corps is distinct from old.corps or new.sujet is distinct from old.sujet then
      new.modifie := true;
    end if;
    new.envoye_le := old.envoye_le;
    new.envoye_par := old.envoye_par;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger brouillons_garde before update on brouillons
  for each row execute function trg_brouillon_garde();

-- 2) Un utilisateur ne change que le statut d'un message (ignorer, archiver…)
create or replace function trg_message_garde() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null then
    if (new.corps_texte, new.sujet, new.expediteur_email, new.compte_id, new.entreprise_id)
       is distinct from (old.corps_texte, old.sujet, old.expediteur_email, old.compte_id, old.entreprise_id) then
      raise exception 'Seul le statut d''un message peut être modifié';
    end if;
    if new.statut not in ('a_traiter', 'ignore', 'archive') then
      raise exception 'Statut non autorisé';
    end if;
  end if;
  return new;
end $$;
create trigger messages_garde before update on messages
  for each row execute function trg_message_garde();

-- ---------------------------------------------------------------------
-- Inscription : crée l'entreprise et son premier admin
-- ---------------------------------------------------------------------
create or replace function creer_entreprise(p_nom text, p_prenom text, p_nom_personne text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_email text;
begin
  if auth.uid() is null then raise exception 'Non connecté'; end if;
  if exists (select 1 from membres where user_id = auth.uid()) then
    raise exception 'Ce compte appartient déjà à une entreprise';
  end if;
  select email into v_email from auth.users where id = auth.uid();
  insert into entreprises (nom, recap_email) values (p_nom, v_email) returning id into v_id;
  insert into membres (entreprise_id, user_id, role, prenom, nom, email)
  values (v_id, auth.uid(), 'admin', p_prenom, p_nom_personne, v_email);
  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table entreprises          enable row level security;
alter table membres              enable row level security;
alter table comptes_mail         enable row level security;
alter table comptes_mail_secrets enable row level security;   -- volontairement sans politique
alter table messages             enable row level security;
alter table analyses             enable row level security;
alter table brouillons           enable row level security;
alter table usage_ia             enable row level security;
alter table recaps               enable row level security;   -- volontairement sans politique
alter table journal              enable row level security;

create policy entreprise_lecture on entreprises for select using (est_membre(id));
create policy entreprise_maj     on entreprises for update using (est_admin(id)) with check (est_admin(id));

create policy membres_lecture on membres for select using (est_membre(entreprise_id));
create policy membres_admin   on membres for all    using (est_admin(entreprise_id)) with check (est_admin(entreprise_id));

-- Comptes : lecture par les membres ; ajout/suppression par le serveur
-- (il faut chiffrer le secret), pause/reprise par un admin.
create policy comptes_lecture on comptes_mail for select using (est_membre(entreprise_id));
create policy comptes_admin_maj on comptes_mail for update using (est_admin(entreprise_id)) with check (est_admin(entreprise_id));
create policy comptes_admin_suppr on comptes_mail for delete using (est_admin(entreprise_id));

create policy messages_lecture on messages for select using (est_membre(entreprise_id));
create policy messages_maj     on messages for update using (est_membre(entreprise_id)) with check (est_membre(entreprise_id));

create policy analyses_lecture on analyses for select using (est_membre(entreprise_id));

create policy brouillons_lecture on brouillons for select using (est_membre(entreprise_id));
create policy brouillons_maj     on brouillons for update using (est_membre(entreprise_id)) with check (est_membre(entreprise_id));

create policy usage_lecture   on usage_ia for select using (est_membre(entreprise_id));
create policy journal_lecture on journal  for select using (est_admin(entreprise_id));

-- Droits des rôles Supabase
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function creer_entreprise(text, text, text), est_membre(uuid), est_admin(uuid), plafond_ia_atteint(uuid) to authenticated;
revoke all on all tables in schema public from anon;
-- Colonnes que l'utilisateur peut modifier sur un compte : seulement le libellé et la pause
revoke update on comptes_mail from authenticated;
grant update (libelle, statut) on comptes_mail to authenticated;
