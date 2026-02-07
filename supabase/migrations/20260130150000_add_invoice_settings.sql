-- Migration: Ajout des paramètres de facturation/ticket
-- Date: 2026-01-30
-- Description: Ajoute les types de facture et options de personnalisation

-- Enum pour les types de facture
DO $$ BEGIN
  CREATE TYPE type_facture AS ENUM (
    'TICKET_SIMPLE',
    'FACTURE_DETAILLEE',
    'PRO_FORMA',
    'NOTE_ADDITION'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum pour le style de séparateur
DO $$ BEGIN
  CREATE TYPE style_separateur AS ENUM (
    'LIGNE_PLEINE',
    'TIRETS',
    'ETOILES',
    'EGAL',
    'AUCUN'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Table des paramètres de facture par établissement
CREATE TABLE IF NOT EXISTS parametres_facture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,

  -- Type de facture par défaut
  type_facture_defaut type_facture NOT NULL DEFAULT 'TICKET_SIMPLE',

  -- Options globales
  afficher_logo BOOLEAN NOT NULL DEFAULT true,
  afficher_infos_etablissement BOOLEAN NOT NULL DEFAULT true,
  afficher_nif_rccm BOOLEAN NOT NULL DEFAULT false,
  afficher_detail_tva BOOLEAN NOT NULL DEFAULT true,
  afficher_qr_code BOOLEAN NOT NULL DEFAULT false,

  -- Style
  style_separateur style_separateur NOT NULL DEFAULT 'TIRETS',

  -- En-têtes et pieds de page par type
  entete_ticket_simple TEXT DEFAULT NULL,
  pied_page_ticket_simple TEXT DEFAULT 'Merci de votre visite !',

  entete_facture_detaillee TEXT DEFAULT 'FACTURE',
  pied_page_facture_detaillee TEXT DEFAULT 'Conditions de paiement : comptant',

  entete_pro_forma TEXT DEFAULT 'PRO-FORMA',
  pied_page_pro_forma TEXT DEFAULT 'Ce document n''est pas une facture',

  entete_note_addition TEXT DEFAULT 'ADDITION',
  pied_page_note_addition TEXT DEFAULT 'Merci de régler à la caisse',

  -- Nombre de copies par type
  copies_ticket_simple INTEGER NOT NULL DEFAULT 1 CHECK (copies_ticket_simple >= 1 AND copies_ticket_simple <= 5),
  copies_facture_detaillee INTEGER NOT NULL DEFAULT 2 CHECK (copies_facture_detaillee >= 1 AND copies_facture_detaillee <= 5),
  copies_pro_forma INTEGER NOT NULL DEFAULT 1 CHECK (copies_pro_forma >= 1 AND copies_pro_forma <= 5),
  copies_note_addition INTEGER NOT NULL DEFAULT 1 CHECK (copies_note_addition >= 1 AND copies_note_addition <= 5),

  -- Options spécifiques par type (JSON pour flexibilité)
  options_ticket_simple JSONB DEFAULT '{"compact": true, "afficher_caissier": true}'::jsonb,
  options_facture_detaillee JSONB DEFAULT '{"afficher_client_obligatoire": true, "inclure_conditions": true}'::jsonb,
  options_pro_forma JSONB DEFAULT '{"validite_jours": 30, "afficher_date_validite": true}'::jsonb,
  options_note_addition JSONB DEFAULT '{"afficher_table": true, "afficher_serveur": true}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Contrainte unique par établissement
  CONSTRAINT unique_parametres_facture_etablissement UNIQUE (etablissement_id)
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_parametres_facture_etablissement ON parametres_facture(etablissement_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_parametres_facture_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_parametres_facture_updated_at ON parametres_facture;
CREATE TRIGGER trigger_parametres_facture_updated_at
  BEFORE UPDATE ON parametres_facture
  FOR EACH ROW
  EXECUTE FUNCTION update_parametres_facture_updated_at();

-- RLS (Row Level Security)
ALTER TABLE parametres_facture ENABLE ROW LEVEL SECURITY;

-- Politique pour lecture (utilisateurs de l'établissement)
DROP POLICY IF EXISTS "Lecture parametres facture pour etablissement" ON parametres_facture;
CREATE POLICY "Lecture parametres facture pour etablissement"
  ON parametres_facture
  FOR SELECT
  USING (true);

-- Politique pour modification (admins et managers)
DROP POLICY IF EXISTS "Modification parametres facture pour admins" ON parametres_facture;
CREATE POLICY "Modification parametres facture pour admins"
  ON parametres_facture
  FOR ALL
  USING (true);

-- Commentaires
COMMENT ON TABLE parametres_facture IS 'Paramètres de personnalisation des factures/tickets par établissement';
COMMENT ON COLUMN parametres_facture.type_facture_defaut IS 'Type de facture utilisé par défaut lors des ventes';
COMMENT ON COLUMN parametres_facture.afficher_qr_code IS 'Affiche un QR code avec le numéro de ticket pour vérification';
COMMENT ON COLUMN parametres_facture.style_separateur IS 'Style des lignes de séparation sur les tickets';
