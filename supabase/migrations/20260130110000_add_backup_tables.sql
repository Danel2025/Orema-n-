-- ============================================================================
-- Migration: Tables pour le systeme de sauvegarde
-- Description: Tables backups et backup_schedules avec RLS
-- Date: 2026-01-30
-- ============================================================================

-- ============================================================================
-- TABLE: backups - Metadonnees des sauvegardes
-- ============================================================================
CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('full', 'partial', 'incremental')),
  format TEXT NOT NULL CHECK (format IN ('json', 'csv', 'sql')) DEFAULT 'json',
  categories JSONB NOT NULL DEFAULT '[]',
  storage_path TEXT,
  file_size BIGINT,
  record_count INTEGER,
  checksum TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  error_message TEXT,
  created_by UUID REFERENCES utilisateurs(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_backups_etablissement ON backups(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);

-- Commentaire
COMMENT ON TABLE backups IS 'Stocke les metadonnees des sauvegardes de donnees';

-- ============================================================================
-- TABLE: backup_schedules - Planification des sauvegardes automatiques
-- ============================================================================
CREATE TABLE IF NOT EXISTS backup_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT true,
  frequence TEXT NOT NULL CHECK (frequence IN ('daily', 'weekly', 'monthly')),
  heure_execution TIME NOT NULL DEFAULT '02:00',
  jour_semaine INTEGER CHECK (jour_semaine >= 0 AND jour_semaine <= 6),
  jour_mois INTEGER CHECK (jour_mois >= 1 AND jour_mois <= 31),
  type TEXT NOT NULL DEFAULT 'full' CHECK (type IN ('full', 'partial')),
  categories JSONB NOT NULL DEFAULT '[]',
  retention_jours INTEGER NOT NULL DEFAULT 30 CHECK (retention_jours >= 1 AND retention_jours <= 365),
  derniere_execution TIMESTAMPTZ,
  prochaine_execution TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_backup_schedules_etablissement ON backup_schedules(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_actif ON backup_schedules(actif) WHERE actif = true;

-- Commentaire
COMMENT ON TABLE backup_schedules IS 'Planification des sauvegardes automatiques';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Activer RLS sur backups
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir les backups de leur etablissement
CREATE POLICY "backups_select_own_etablissement" ON backups
  FOR SELECT USING (
    etablissement_id IN (
      SELECT etablissement_id FROM utilisateurs WHERE id = auth.uid()
    )
  );

-- Policy: Les admins peuvent inserer des backups
CREATE POLICY "backups_insert_admin" ON backups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id = auth.uid()
      AND etablissement_id = backups.etablissement_id
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- Policy: Les admins peuvent mettre a jour leurs backups
CREATE POLICY "backups_update_admin" ON backups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id = auth.uid()
      AND etablissement_id = backups.etablissement_id
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- Policy: Les admins peuvent supprimer leurs backups
CREATE POLICY "backups_delete_admin" ON backups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id = auth.uid()
      AND etablissement_id = backups.etablissement_id
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- Activer RLS sur backup_schedules
ALTER TABLE backup_schedules ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir les schedules de leur etablissement
CREATE POLICY "backup_schedules_select_own" ON backup_schedules
  FOR SELECT USING (
    etablissement_id IN (
      SELECT etablissement_id FROM utilisateurs WHERE id = auth.uid()
    )
  );

-- Policy: Les admins peuvent gerer les schedules
CREATE POLICY "backup_schedules_all_admin" ON backup_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id = auth.uid()
      AND etablissement_id = backup_schedules.etablissement_id
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- ============================================================================
-- STORAGE BUCKET (a creer via dashboard ou API)
-- ============================================================================
-- Note: Le bucket 'backups' doit etre cree manuellement dans Supabase Dashboard
-- ou via l'API car les buckets ne peuvent pas etre crees via migration SQL standard.

-- Pour reference, voici la structure attendue:
-- Bucket: backups
-- Public: false
-- Allowed MIME types: application/json, text/csv, application/zip

-- ============================================================================
-- TRIGGER: Mise a jour automatique de updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_backup_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_backup_schedules_updated_at
  BEFORE UPDATE ON backup_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_backup_schedules_updated_at();
