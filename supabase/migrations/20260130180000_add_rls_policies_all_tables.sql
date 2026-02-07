-- ============================================================================
-- Migration: Ajout des politiques RLS pour toutes les tables métier
-- Date: 2026-01-30
-- Description: Sécurise l'accès aux données par établissement
-- ============================================================================

-- ============================================================================
-- FONCTION HELPER: Vérifie si l'utilisateur est admin
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN get_user_role() IN ('SUPER_ADMIN', 'ADMIN');
END;
$$;

-- ============================================================================
-- FONCTION HELPER: Vérifie si l'utilisateur est au moins manager
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_manager_or_above()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN get_user_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER');
END;
$$;

-- ============================================================================
-- TABLE: utilisateurs
-- Règles:
--   - Voir les utilisateurs de son établissement
--   - Seuls les admins peuvent créer/modifier/supprimer
-- ============================================================================
DROP POLICY IF EXISTS "utilisateurs_select_own_etablissement" ON public.utilisateurs;
DROP POLICY IF EXISTS "utilisateurs_insert_admin" ON public.utilisateurs;
DROP POLICY IF EXISTS "utilisateurs_update_admin" ON public.utilisateurs;
DROP POLICY IF EXISTS "utilisateurs_delete_admin" ON public.utilisateurs;

CREATE POLICY "utilisateurs_select_own_etablissement" ON public.utilisateurs
  FOR SELECT
  USING (etablissement_id = get_user_etablissement_id());

CREATE POLICY "utilisateurs_insert_admin" ON public.utilisateurs
  FOR INSERT
  WITH CHECK (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  );

CREATE POLICY "utilisateurs_update_admin" ON public.utilisateurs
  FOR UPDATE
  USING (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  );

CREATE POLICY "utilisateurs_delete_admin" ON public.utilisateurs
  FOR DELETE
  USING (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  );

-- ============================================================================
-- TABLE: categories
-- Règles:
--   - Tout le monde peut voir les catégories de son établissement
--   - Admins et managers peuvent créer/modifier/supprimer
-- ============================================================================
DROP POLICY IF EXISTS "categories_select_own_etablissement" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_manager" ON public.categories;
DROP POLICY IF EXISTS "categories_update_manager" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_manager" ON public.categories;

CREATE POLICY "categories_select_own_etablissement" ON public.categories
  FOR SELECT
  USING (etablissement_id = get_user_etablissement_id());

CREATE POLICY "categories_insert_manager" ON public.categories
  FOR INSERT
  WITH CHECK (
    is_manager_or_above()
    AND etablissement_id = get_user_etablissement_id()
  );

CREATE POLICY "categories_update_manager" ON public.categories
  FOR UPDATE
  USING (
    is_manager_or_above()
    AND etablissement_id = get_user_etablissement_id()
  );

CREATE POLICY "categories_delete_manager" ON public.categories
  FOR DELETE
  USING (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  );

-- ============================================================================
-- TABLE: produits
-- Règles:
--   - Tout le monde peut voir les produits de son établissement
--   - Admins et managers peuvent créer/modifier/supprimer
-- ============================================================================
DROP POLICY IF EXISTS "produits_select_own_etablissement" ON public.produits;
DROP POLICY IF EXISTS "produits_insert_manager" ON public.produits;
DROP POLICY IF EXISTS "produits_update_manager" ON public.produits;
DROP POLICY IF EXISTS "produits_delete_manager" ON public.produits;

CREATE POLICY "produits_select_own_etablissement" ON public.produits
  FOR SELECT
  USING (etablissement_id = get_user_etablissement_id());

CREATE POLICY "produits_insert_manager" ON public.produits
  FOR INSERT
  WITH CHECK (
    is_manager_or_above()
    AND etablissement_id = get_user_etablissement_id()
  );

CREATE POLICY "produits_update_manager" ON public.produits
  FOR UPDATE
  USING (
    is_manager_or_above()
    AND etablissement_id = get_user_etablissement_id()
  );

CREATE POLICY "produits_delete_manager" ON public.produits
  FOR DELETE
  USING (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  );

-- ============================================================================
-- TABLE: supplements_produits
-- Règles: Mêmes règles que produits
-- ============================================================================
DROP POLICY IF EXISTS "supplements_produits_select" ON public.supplements_produits;
DROP POLICY IF EXISTS "supplements_produits_insert" ON public.supplements_produits;
DROP POLICY IF EXISTS "supplements_produits_update" ON public.supplements_produits;
DROP POLICY IF EXISTS "supplements_produits_delete" ON public.supplements_produits;

CREATE POLICY "supplements_produits_select" ON public.supplements_produits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.produits p
      WHERE p.id = supplements_produits.produit_id
      AND p.etablissement_id = get_user_etablissement_id()
    )
  );

CREATE POLICY "supplements_produits_insert" ON public.supplements_produits
  FOR INSERT
  WITH CHECK (
    is_manager_or_above()
    AND EXISTS (
      SELECT 1 FROM public.produits p
      WHERE p.id = supplements_produits.produit_id
      AND p.etablissement_id = get_user_etablissement_id()
    )
  );

CREATE POLICY "supplements_produits_update" ON public.supplements_produits
  FOR UPDATE
  USING (
    is_manager_or_above()
    AND EXISTS (
      SELECT 1 FROM public.produits p
      WHERE p.id = supplements_produits.produit_id
      AND p.etablissement_id = get_user_etablissement_id()
    )
  );

CREATE POLICY "supplements_produits_delete" ON public.supplements_produits
  FOR DELETE
  USING (
    is_admin()
    AND EXISTS (
      SELECT 1 FROM public.produits p
      WHERE p.id = supplements_produits.produit_id
      AND p.etablissement_id = get_user_etablissement_id()
    )
  );

-- ============================================================================
-- TABLE: clients
-- Règles:
--   - Tout le monde peut voir les clients de son établissement
--   - Tout le monde peut créer des clients
--   - Admins et managers peuvent modifier/supprimer
-- ============================================================================
DROP POLICY IF EXISTS "clients_select_own_etablissement" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_all" ON public.clients;
DROP POLICY IF EXISTS "clients_update_manager" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_admin" ON public.clients;

CREATE POLICY "clients_select_own_etablissement" ON public.clients
  FOR SELECT
  USING (etablissement_id = get_user_etablissement_id());

CREATE POLICY "clients_insert_all" ON public.clients
  FOR INSERT
  WITH CHECK (etablissement_id = get_user_etablissement_id());

CREATE POLICY "clients_update_manager" ON public.clients
  FOR UPDATE
  USING (
    is_manager_or_above()
    AND etablissement_id = get_user_etablissement_id()
  );

CREATE POLICY "clients_delete_admin" ON public.clients
  FOR DELETE
  USING (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  );

-- ============================================================================
-- TABLE: zones
-- Règles:
--   - Tout le monde peut voir les zones de son établissement
--   - Admins et managers peuvent créer/modifier/supprimer
-- ============================================================================
DROP POLICY IF EXISTS "zones_select_own_etablissement" ON public.zones;
DROP POLICY IF EXISTS "zones_insert_manager" ON public.zones;
DROP POLICY IF EXISTS "zones_update_manager" ON public.zones;
DROP POLICY IF EXISTS "zones_delete_admin" ON public.zones;

CREATE POLICY "zones_select_own_etablissement" ON public.zones
  FOR SELECT
  USING (etablissement_id = get_user_etablissement_id());

CREATE POLICY "zones_insert_manager" ON public.zones
  FOR INSERT
  WITH CHECK (
    is_manager_or_above()
    AND etablissement_id = get_user_etablissement_id()
  );

CREATE POLICY "zones_update_manager" ON public.zones
  FOR UPDATE
  USING (
    is_manager_or_above()
    AND etablissement_id = get_user_etablissement_id()
  );

CREATE POLICY "zones_delete_admin" ON public.zones
  FOR DELETE
  USING (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  );

-- ============================================================================
-- TABLE: tables
-- Règles:
--   - Tout le monde peut voir les tables de son établissement
--   - Tout le monde peut modifier le statut (pour le service)
--   - Admins et managers peuvent créer/supprimer
-- ============================================================================
DROP POLICY IF EXISTS "tables_select_own_etablissement" ON public.tables;
DROP POLICY IF EXISTS "tables_insert_manager" ON public.tables;
DROP POLICY IF EXISTS "tables_update_all" ON public.tables;
DROP POLICY IF EXISTS "tables_delete_admin" ON public.tables;

CREATE POLICY "tables_select_own_etablissement" ON public.tables
  FOR SELECT
  USING (etablissement_id = get_user_etablissement_id());

CREATE POLICY "tables_insert_manager" ON public.tables
  FOR INSERT
  WITH CHECK (
    is_manager_or_above()
    AND etablissement_id = get_user_etablissement_id()
  );

-- Tous peuvent modifier (pour changer le statut pendant le service)
CREATE POLICY "tables_update_all" ON public.tables
  FOR UPDATE
  USING (etablissement_id = get_user_etablissement_id());

CREATE POLICY "tables_delete_admin" ON public.tables
  FOR DELETE
  USING (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  );

-- ============================================================================
-- TABLE: imprimantes
-- Règles:
--   - Tout le monde peut voir les imprimantes de son établissement
--   - Seuls les admins peuvent créer/modifier/supprimer
-- ============================================================================
DROP POLICY IF EXISTS "imprimantes_select_own_etablissement" ON public.imprimantes;
DROP POLICY IF EXISTS "imprimantes_insert_admin" ON public.imprimantes;
DROP POLICY IF EXISTS "imprimantes_update_admin" ON public.imprimantes;
DROP POLICY IF EXISTS "imprimantes_delete_admin" ON public.imprimantes;

CREATE POLICY "imprimantes_select_own_etablissement" ON public.imprimantes
  FOR SELECT
  USING (etablissement_id = get_user_etablissement_id());

CREATE POLICY "imprimantes_insert_admin" ON public.imprimantes
  FOR INSERT
  WITH CHECK (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  );

CREATE POLICY "imprimantes_update_admin" ON public.imprimantes
  FOR UPDATE
  USING (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  );

CREATE POLICY "imprimantes_delete_admin" ON public.imprimantes
  FOR DELETE
  USING (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  );

-- ============================================================================
-- TABLE: ventes
-- Règles:
--   - Tout le monde peut voir les ventes de son établissement
--   - Tout le monde peut créer des ventes (pour la caisse)
--   - Seul le créateur ou les admins peuvent modifier/annuler
-- ============================================================================
DROP POLICY IF EXISTS "ventes_select_own_etablissement" ON public.ventes;
DROP POLICY IF EXISTS "ventes_insert_all" ON public.ventes;
DROP POLICY IF EXISTS "ventes_update_owner_or_admin" ON public.ventes;
DROP POLICY IF EXISTS "ventes_delete_admin" ON public.ventes;

CREATE POLICY "ventes_select_own_etablissement" ON public.ventes
  FOR SELECT
  USING (etablissement_id = get_user_etablissement_id());

CREATE POLICY "ventes_insert_all" ON public.ventes
  FOR INSERT
  WITH CHECK (etablissement_id = get_user_etablissement_id());

-- Seul le créateur ou un admin/manager peut modifier
CREATE POLICY "ventes_update_owner_or_admin" ON public.ventes
  FOR UPDATE
  USING (
    etablissement_id = get_user_etablissement_id()
    AND (
      utilisateur_id = get_user_id()
      OR is_manager_or_above()
    )
  );

-- Seuls les admins peuvent supprimer (soft delete normalement)
CREATE POLICY "ventes_delete_admin" ON public.ventes
  FOR DELETE
  USING (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  );

-- ============================================================================
-- TABLE: lignes_vente
-- Règles: Via la relation avec ventes
-- ============================================================================
DROP POLICY IF EXISTS "lignes_vente_select" ON public.lignes_vente;
DROP POLICY IF EXISTS "lignes_vente_insert" ON public.lignes_vente;
DROP POLICY IF EXISTS "lignes_vente_update" ON public.lignes_vente;
DROP POLICY IF EXISTS "lignes_vente_delete" ON public.lignes_vente;

CREATE POLICY "lignes_vente_select" ON public.lignes_vente
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ventes v
      WHERE v.id = lignes_vente.vente_id
      AND v.etablissement_id = get_user_etablissement_id()
    )
  );

CREATE POLICY "lignes_vente_insert" ON public.lignes_vente
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ventes v
      WHERE v.id = lignes_vente.vente_id
      AND v.etablissement_id = get_user_etablissement_id()
    )
  );

CREATE POLICY "lignes_vente_update" ON public.lignes_vente
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.ventes v
      WHERE v.id = lignes_vente.vente_id
      AND v.etablissement_id = get_user_etablissement_id()
      AND (v.utilisateur_id = get_user_id() OR is_manager_or_above())
    )
  );

CREATE POLICY "lignes_vente_delete" ON public.lignes_vente
  FOR DELETE
  USING (
    is_admin()
    AND EXISTS (
      SELECT 1 FROM public.ventes v
      WHERE v.id = lignes_vente.vente_id
      AND v.etablissement_id = get_user_etablissement_id()
    )
  );

-- ============================================================================
-- TABLE: paiements
-- Règles: Via la relation avec ventes
-- ============================================================================
DROP POLICY IF EXISTS "paiements_select" ON public.paiements;
DROP POLICY IF EXISTS "paiements_insert" ON public.paiements;
DROP POLICY IF EXISTS "paiements_update" ON public.paiements;
DROP POLICY IF EXISTS "paiements_delete" ON public.paiements;

CREATE POLICY "paiements_select" ON public.paiements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ventes v
      WHERE v.id = paiements.vente_id
      AND v.etablissement_id = get_user_etablissement_id()
    )
  );

CREATE POLICY "paiements_insert" ON public.paiements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ventes v
      WHERE v.id = paiements.vente_id
      AND v.etablissement_id = get_user_etablissement_id()
    )
  );

CREATE POLICY "paiements_update" ON public.paiements
  FOR UPDATE
  USING (
    is_manager_or_above()
    AND EXISTS (
      SELECT 1 FROM public.ventes v
      WHERE v.id = paiements.vente_id
      AND v.etablissement_id = get_user_etablissement_id()
    )
  );

CREATE POLICY "paiements_delete" ON public.paiements
  FOR DELETE
  USING (
    is_admin()
    AND EXISTS (
      SELECT 1 FROM public.ventes v
      WHERE v.id = paiements.vente_id
      AND v.etablissement_id = get_user_etablissement_id()
    )
  );

-- ============================================================================
-- TABLE: sessions_caisse
-- Règles:
--   - Tout le monde peut voir les sessions de son établissement
--   - Tout le monde peut créer/modifier sa propre session
--   - Les admins peuvent tout faire
-- ============================================================================
DROP POLICY IF EXISTS "sessions_caisse_select_own_etablissement" ON public.sessions_caisse;
DROP POLICY IF EXISTS "sessions_caisse_insert_all" ON public.sessions_caisse;
DROP POLICY IF EXISTS "sessions_caisse_update_owner_or_admin" ON public.sessions_caisse;
DROP POLICY IF EXISTS "sessions_caisse_delete_admin" ON public.sessions_caisse;

CREATE POLICY "sessions_caisse_select_own_etablissement" ON public.sessions_caisse
  FOR SELECT
  USING (etablissement_id = get_user_etablissement_id());

CREATE POLICY "sessions_caisse_insert_all" ON public.sessions_caisse
  FOR INSERT
  WITH CHECK (etablissement_id = get_user_etablissement_id());

CREATE POLICY "sessions_caisse_update_owner_or_admin" ON public.sessions_caisse
  FOR UPDATE
  USING (
    etablissement_id = get_user_etablissement_id()
    AND (
      utilisateur_id = get_user_id()
      OR is_admin()
    )
  );

CREATE POLICY "sessions_caisse_delete_admin" ON public.sessions_caisse
  FOR DELETE
  USING (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  );

-- ============================================================================
-- TABLE: mouvements_stock
-- Règles:
--   - Tout le monde peut voir les mouvements de son établissement
--   - Admins et managers peuvent créer/modifier
-- ============================================================================
DROP POLICY IF EXISTS "mouvements_stock_select" ON public.mouvements_stock;
DROP POLICY IF EXISTS "mouvements_stock_insert" ON public.mouvements_stock;
DROP POLICY IF EXISTS "mouvements_stock_update" ON public.mouvements_stock;
DROP POLICY IF EXISTS "mouvements_stock_delete" ON public.mouvements_stock;

CREATE POLICY "mouvements_stock_select" ON public.mouvements_stock
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.produits p
      WHERE p.id = mouvements_stock.produit_id
      AND p.etablissement_id = get_user_etablissement_id()
    )
  );

CREATE POLICY "mouvements_stock_insert" ON public.mouvements_stock
  FOR INSERT
  WITH CHECK (
    is_manager_or_above()
    AND EXISTS (
      SELECT 1 FROM public.produits p
      WHERE p.id = mouvements_stock.produit_id
      AND p.etablissement_id = get_user_etablissement_id()
    )
  );

CREATE POLICY "mouvements_stock_update" ON public.mouvements_stock
  FOR UPDATE
  USING (
    is_admin()
    AND EXISTS (
      SELECT 1 FROM public.produits p
      WHERE p.id = mouvements_stock.produit_id
      AND p.etablissement_id = get_user_etablissement_id()
    )
  );

CREATE POLICY "mouvements_stock_delete" ON public.mouvements_stock
  FOR DELETE
  USING (
    is_admin()
    AND EXISTS (
      SELECT 1 FROM public.produits p
      WHERE p.id = mouvements_stock.produit_id
      AND p.etablissement_id = get_user_etablissement_id()
    )
  );

-- ============================================================================
-- TABLE: audit_logs
-- Règles:
--   - Seuls les admins peuvent voir les logs de leur établissement
--   - Les logs sont créés automatiquement (pas d'insert manuel)
-- ============================================================================
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_system" ON public.audit_logs;

CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT
  USING (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  );

-- Permettre l'insertion pour le système (via service role ou authenticated)
CREATE POLICY "audit_logs_insert_system" ON public.audit_logs
  FOR INSERT
  WITH CHECK (etablissement_id = get_user_etablissement_id());

-- ============================================================================
-- TABLE: etablissements
-- Règles:
--   - Chacun ne peut voir que son établissement
--   - Seuls les SUPER_ADMIN peuvent modifier
-- ============================================================================
DROP POLICY IF EXISTS "etablissements_select_own" ON public.etablissements;
DROP POLICY IF EXISTS "etablissements_update_super_admin" ON public.etablissements;

ALTER TABLE public.etablissements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "etablissements_select_own" ON public.etablissements
  FOR SELECT
  USING (id = get_user_etablissement_id());

CREATE POLICY "etablissements_update_super_admin" ON public.etablissements
  FOR UPDATE
  USING (
    id = get_user_etablissement_id()
    AND get_user_role() = 'SUPER_ADMIN'
  );

-- ============================================================================
-- Commentaire final
-- ============================================================================
COMMENT ON POLICY "utilisateurs_select_own_etablissement" ON public.utilisateurs IS
  'Les utilisateurs ne peuvent voir que les employés de leur établissement';

COMMENT ON POLICY "ventes_update_owner_or_admin" ON public.ventes IS
  'Seul le créateur de la vente ou un admin/manager peut la modifier';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
