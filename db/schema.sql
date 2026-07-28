-- Cloudflare D1 — Lectures de recherche acquéreur (LEVOIS)
--
-- Créer la base (une seule fois) :
--   wrangler d1 create levois-recherche
--
-- Appliquer le schéma :
--   wrangler d1 execute levois-recherche --file=db/schema.sql
--
-- Variables Netlify à configurer après création :
--   CLOUDFLARE_ACCOUNT_ID      (cf. wrangler whoami)
--   CLOUDFLARE_D1_DATABASE_ID  (uuid retourné par wrangler d1 create)
--   CLOUDFLARE_API_TOKEN       (https://dash.cloudflare.com/profile/api-tokens → D1:edit)

CREATE TABLE IF NOT EXISTS lectures_recherche (
  id                TEXT    PRIMARY KEY,
  created_at        TEXT    NOT NULL,
  src               TEXT,
  prenom            TEXT    NOT NULL,
  contact           TEXT    NOT NULL,
  commentaire       TEXT,
  situation         TEXT,
  type_bien         TEXT,
  secteur           TEXT,
  secteur_contraint INTEGER,
  budget            INTEGER,
  surface           INTEGER,
  preserves         TEXT,
  preserves_labels  TEXT,
  flexibles         TEXT,
  flexibles_labels  TEXT,
  decision_tension  TEXT,
  lecture_json      TEXT,
  consent           INTEGER NOT NULL DEFAULT 1,
  email_envoye      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_created_at ON lectures_recherche (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_src        ON lectures_recherche (src);
