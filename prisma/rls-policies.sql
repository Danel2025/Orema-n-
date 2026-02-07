-- ============================================================================
-- Row Level Security (RLS) Policies pour Oréma N+ POS
-- ============================================================================
--
-- Ce fichier contient les politiques RLS pour sécuriser les données
-- par établissement. Chaque utilisateur ne peut voir/modifier que
-- les données de son propre établissement.
--
-- PRÉREQUIS:
-- 1. Supabase Auth doit être configuré
-- 2. Les utilisateurs doivent avoir leur email dans auth.users
-- 3. La colonne email doit correspondre entre auth.users et utilisateurs
--
-- EXÉCUTION:
-- Exécutez ce script dans l'éditeur SQL de Supabase Dashboard
-- ou via: psql -h YOUR_HOST -U postgres -d postgres -f rls-policies.sql
--
-- VERSION: 2.0 - Utilise l'email pour lier auth.users et utilisateurs
-- ============================================================================

-- ============================================================================
-- 1. NETTOYER LES ANCIENNES POLICIES (si elles existent)
-- ============================================================================

-- Supprimer les anciennes fonctions
DROP FUNCTION IF EXISTS get_user_etablissement_id() CASCADE;
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_etablissement_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_or_manager() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;

-- ============================================================================
-- 2. FONCTIONS UTILITAIRES
-- ============================================================================

-- Récupère l'établissement de l'utilisateur connecté via son email
CREATE OR REPLACE FUNCTION public.get_user_etablissement_id()
RETURNS UUID AS $$
DECLARE
    v_etablissement_id UUID;
BEGIN
    -- Récupérer l'établissement via l'email de l'utilisateur Supabase Auth
    SELECT "etablissementId" INTO v_etablissement_id
    FROM utilisateurs
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND actif = true
    LIMIT 1;

    RETURN v_etablissement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Récupère l'ID de l'utilisateur dans la table utilisateurs
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id
    FROM utilisateurs
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND actif = true
    LIMIT 1;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Récupère le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role::TEXT INTO v_role
    FROM utilisateurs
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND actif = true
    LIMIT 1;

    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur est admin ou manager
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur est super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() = 'SUPER_ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() IN ('SUPER_ADMIN', 'ADMIN');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 3. ACTIVER RLS SUR TOUTES LES TABLES
-- ============================================================================

ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE etablissements ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplements_produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_vente ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_vente_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions_caisse ENABLE ROW LEVEL SECURITY;
ALTER TABLE imprimantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mouvements_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. SUPPRIMER LES ANCIENNES POLICIES (si elles existent)
-- ============================================================================

-- Etablissements
DROP POLICY IF EXISTS "Users can view their own establishment" ON etablissements;
DROP POLICY IF EXISTS "Admins can update establishment" ON etablissements;
DROP POLICY IF EXISTS "Super admins can update establishments" ON etablissements;
DROP POLICY IF EXISTS "Super admins can create establishments" ON etablissements;
DROP POLICY IF EXISTS "Super admins can delete establishments" ON etablissements;

-- Utilisateurs
DROP POLICY IF EXISTS "Users can view users in same establishment" ON utilisateurs;
DROP POLICY IF EXISTS "Users can view users from their establishment" ON utilisateurs;
DROP POLICY IF EXISTS "Admins can insert users" ON utilisateurs;
DROP POLICY IF EXISTS "Admins can create users in their establishment" ON utilisateurs;
DROP POLICY IF EXISTS "Users can update own profile or admins can update all" ON utilisateurs;
DROP POLICY IF EXISTS "Admins can update users in their establishment" ON utilisateurs;
DROP POLICY IF EXISTS "Admins can delete users" ON utilisateurs;
DROP POLICY IF EXISTS "Super admins can delete users" ON utilisateurs;

-- Sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON sessions;

-- Categories
DROP POLICY IF EXISTS "Users can view categories" ON categories;
DROP POLICY IF EXISTS "Users can view categories from their establishment" ON categories;
DROP POLICY IF EXISTS "Managers can manage categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

-- Produits
DROP POLICY IF EXISTS "Users can view products" ON produits;
DROP POLICY IF EXISTS "Users can view products from their establishment" ON produits;
DROP POLICY IF EXISTS "Managers can manage products" ON produits;
DROP POLICY IF EXISTS "Admins can manage products" ON produits;

-- Supplements
DROP POLICY IF EXISTS "Users can view supplements" ON supplements_produits;
DROP POLICY IF EXISTS "Users can view supplements from their establishment" ON supplements_produits;
DROP POLICY IF EXISTS "Managers can manage supplements" ON supplements_produits;
DROP POLICY IF EXISTS "Admins can manage supplements" ON supplements_produits;

-- Zones
DROP POLICY IF EXISTS "Users can view zones" ON zones;
DROP POLICY IF EXISTS "Users can view zones from their establishment" ON zones;
DROP POLICY IF EXISTS "Managers can manage zones" ON zones;
DROP POLICY IF EXISTS "Admins can manage zones" ON zones;

-- Tables
DROP POLICY IF EXISTS "Users can view tables" ON tables;
DROP POLICY IF EXISTS "Users can view tables from their establishment" ON tables;
DROP POLICY IF EXISTS "Staff can update table status" ON tables;
DROP POLICY IF EXISTS "Users can update table status" ON tables;
DROP POLICY IF EXISTS "Managers can create tables" ON tables;
DROP POLICY IF EXISTS "Admins can create tables" ON tables;
DROP POLICY IF EXISTS "Managers can delete tables" ON tables;
DROP POLICY IF EXISTS "Admins can delete tables" ON tables;

-- Clients
DROP POLICY IF EXISTS "Users can view clients" ON clients;
DROP POLICY IF EXISTS "Users can view clients from their establishment" ON clients;
DROP POLICY IF EXISTS "Cashiers can manage clients" ON clients;
DROP POLICY IF EXISTS "Users can create clients in their establishment" ON clients;
DROP POLICY IF EXISTS "Users can update clients in their establishment" ON clients;
DROP POLICY IF EXISTS "Admins can delete clients" ON clients;

-- Ventes
DROP POLICY IF EXISTS "Users can view sales" ON ventes;
DROP POLICY IF EXISTS "Users can view sales from their establishment" ON ventes;
DROP POLICY IF EXISTS "Cashiers can create sales" ON ventes;
DROP POLICY IF EXISTS "Users can create sales in their establishment" ON ventes;
DROP POLICY IF EXISTS "Cashiers can update sales" ON ventes;
DROP POLICY IF EXISTS "Users can update their own pending sales" ON ventes;
DROP POLICY IF EXISTS "Admins can delete sales" ON ventes;
DROP POLICY IF EXISTS "Super admins can delete sales" ON ventes;

-- Lignes de vente
DROP POLICY IF EXISTS "Users can view sale lines" ON lignes_vente;
DROP POLICY IF EXISTS "Users can view sale lines from their establishment" ON lignes_vente;
DROP POLICY IF EXISTS "Staff can manage sale lines" ON lignes_vente;
DROP POLICY IF EXISTS "Users can create sale lines" ON lignes_vente;
DROP POLICY IF EXISTS "Users can update sale lines" ON lignes_vente;
DROP POLICY IF EXISTS "Users can delete sale lines" ON lignes_vente;

-- Lignes vente supplements
DROP POLICY IF EXISTS "Users can view sale line supplements" ON lignes_vente_supplements;
DROP POLICY IF EXISTS "Staff can manage sale line supplements" ON lignes_vente_supplements;
DROP POLICY IF EXISTS "Users can manage sale line supplements" ON lignes_vente_supplements;

-- Paiements
DROP POLICY IF EXISTS "Users can view payments" ON paiements;
DROP POLICY IF EXISTS "Users can view payments from their establishment" ON paiements;
DROP POLICY IF EXISTS "Cashiers can manage payments" ON paiements;
DROP POLICY IF EXISTS "Users can create payments" ON paiements;
DROP POLICY IF EXISTS "Admins can update payments" ON paiements;
DROP POLICY IF EXISTS "Admins can delete payments" ON paiements;

-- Sessions caisse
DROP POLICY IF EXISTS "Users can view cash sessions" ON sessions_caisse;
DROP POLICY IF EXISTS "Users can view cash sessions from their establishment" ON sessions_caisse;
DROP POLICY IF EXISTS "Cashiers can manage own cash sessions" ON sessions_caisse;
DROP POLICY IF EXISTS "Users can create cash sessions" ON sessions_caisse;
DROP POLICY IF EXISTS "Users can update their own cash session" ON sessions_caisse;
DROP POLICY IF EXISTS "Super admins can delete cash sessions" ON sessions_caisse;

-- Imprimantes
DROP POLICY IF EXISTS "Users can view printers" ON imprimantes;
DROP POLICY IF EXISTS "Users can view printers from their establishment" ON imprimantes;
DROP POLICY IF EXISTS "Admins can manage printers" ON imprimantes;

-- Mouvements stock
DROP POLICY IF EXISTS "Users can view stock movements" ON mouvements_stock;
DROP POLICY IF EXISTS "Users can view stock movements from their establishment" ON mouvements_stock;
DROP POLICY IF EXISTS "Managers can manage stock movements" ON mouvements_stock;
DROP POLICY IF EXISTS "Users can create stock movements" ON mouvements_stock;
DROP POLICY IF EXISTS "Admins can manage stock movements" ON mouvements_stock;
DROP POLICY IF EXISTS "Admins can delete stock movements" ON mouvements_stock;

-- Audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can view audit logs from their establishment" ON audit_logs;
DROP POLICY IF EXISTS "Users can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can create audit logs" ON audit_logs;

-- ============================================================================
-- 5. POLICIES POUR ETABLISSEMENTS
-- ============================================================================

-- Les utilisateurs peuvent voir leur propre établissement
CREATE POLICY "etablissements_select"
ON etablissements FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND id = public.get_user_etablissement_id()
);

-- Seuls les super admins peuvent modifier les établissements
CREATE POLICY "etablissements_update"
ON etablissements FOR UPDATE
USING (public.is_super_admin() AND id = public.get_user_etablissement_id())
WITH CHECK (public.is_super_admin() AND id = public.get_user_etablissement_id());

-- ============================================================================
-- 6. POLICIES POUR UTILISATEURS
-- ============================================================================

-- Les utilisateurs peuvent voir les autres utilisateurs de leur établissement
CREATE POLICY "utilisateurs_select"
ON utilisateurs FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND "etablissementId" = public.get_user_etablissement_id()
);

-- Les admins peuvent créer des utilisateurs dans leur établissement
CREATE POLICY "utilisateurs_insert"
ON utilisateurs FOR INSERT
WITH CHECK (
    public.is_admin()
    AND "etablissementId" = public.get_user_etablissement_id()
);

-- Les utilisateurs peuvent modifier leur propre profil
-- Les admins peuvent modifier tous les profils de leur établissement
CREATE POLICY "utilisateurs_update"
ON utilisateurs FOR UPDATE
USING (
    "etablissementId" = public.get_user_etablissement_id()
    AND (id = public.get_user_id() OR public.is_admin())
)
WITH CHECK (
    "etablissementId" = public.get_user_etablissement_id()
    AND (id = public.get_user_id() OR public.is_admin())
);

-- Seuls les admins peuvent désactiver des utilisateurs
CREATE POLICY "utilisateurs_delete"
ON utilisateurs FOR DELETE
USING (
    public.is_admin()
    AND "etablissementId" = public.get_user_etablissement_id()
);

-- ============================================================================
-- 7. POLICIES POUR SESSIONS (JWT legacy)
-- ============================================================================

-- Les utilisateurs peuvent voir leurs propres sessions
CREATE POLICY "sessions_select"
ON sessions FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND "utilisateurId" = public.get_user_id()
);

-- Les utilisateurs peuvent créer des sessions
CREATE POLICY "sessions_insert"
ON sessions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Les utilisateurs peuvent supprimer leurs propres sessions
CREATE POLICY "sessions_delete"
ON sessions FOR DELETE
USING ("utilisateurId" = public.get_user_id());

-- ============================================================================
-- 8. POLICIES POUR CATEGORIES
-- ============================================================================

CREATE POLICY "categories_select"
ON categories FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND "etablissementId" = public.get_user_etablissement_id()
);

CREATE POLICY "categories_insert"
ON categories FOR INSERT
WITH CHECK (
    public.is_admin_or_manager()
    AND "etablissementId" = public.get_user_etablissement_id()
);

CREATE POLICY "categories_update"
ON categories FOR UPDATE
USING (
    public.is_admin_or_manager()
    AND "etablissementId" = public.get_user_etablissement_id()
)
WITH CHECK (
    public.is_admin_or_manager()
    AND "etablissementId" = public.get_user_etablissement_id()
);

CREATE POLICY "categories_delete"
ON categories FOR DELETE
USING (
    public.is_admin_or_manager()
    AND "etablissementId" = public.get_user_etablissement_id()
);

-- ============================================================================
-- 9. POLICIES POUR PRODUITS
-- ============================================================================

CREATE POLICY "produits_select"
ON produits FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND "etablissementId" = public.get_user_etablissement_id()
);

CREATE POLICY "produits_insert"
ON produits FOR INSERT
WITH CHECK (
    public.is_admin_or_manager()
    AND "etablissementId" = public.get_user_etablissement_id()
);

CREATE POLICY "produits_update"
ON produits FOR UPDATE
USING (
    public.is_admin_or_manager()
    AND "etablissementId" = public.get_user_etablissement_id()
)
WITH CHECK (
    public.is_admin_or_manager()
    AND "etablissementId" = public.get_user_etablissement_id()
);

CREATE POLICY "produits_delete"
ON produits FOR DELETE
USING (
    public.is_admin_or_manager()
    AND "etablissementId" = public.get_user_etablissement_id()
);

-- ============================================================================
-- 10. POLICIES POUR SUPPLEMENTS PRODUITS
-- ============================================================================

CREATE POLICY "supplements_produits_select"
ON supplements_produits FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM produits p
        WHERE p.id = supplements_produits."produitId"
        AND p."etablissementId" = public.get_user_etablissement_id()
    )
);

CREATE POLICY "supplements_produits_all"
ON supplements_produits FOR ALL
USING (
    public.is_admin_or_manager()
    AND EXISTS (
        SELECT 1 FROM produits p
        WHERE p.id = supplements_produits."produitId"
        AND p."etablissementId" = public.get_user_etablissement_id()
    )
);

-- ============================================================================
-- 11. POLICIES POUR ZONES
-- ============================================================================

CREATE POLICY "zones_select"
ON zones FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND "etablissementId" = public.get_user_etablissement_id()
);

CREATE POLICY "zones_all"
ON zones FOR ALL
USING (
    public.is_admin_or_manager()
    AND "etablissementId" = public.get_user_etablissement_id()
)
WITH CHECK (
    public.is_admin_or_manager()
    AND "etablissementId" = public.get_user_etablissement_id()
);

-- ============================================================================
-- 12. POLICIES POUR TABLES
-- ============================================================================

CREATE POLICY "tables_select"
ON tables FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND "etablissementId" = public.get_user_etablissement_id()
);

-- Tous les utilisateurs peuvent mettre à jour le statut des tables
CREATE POLICY "tables_update"
ON tables FOR UPDATE
USING (
    auth.uid() IS NOT NULL
    AND "etablissementId" = public.get_user_etablissement_id()
)
WITH CHECK (
    auth.uid() IS NOT NULL
    AND "etablissementId" = public.get_user_etablissement_id()
);

CREATE POLICY "tables_insert"
ON tables FOR INSERT
WITH CHECK (
    public.is_admin_or_manager()
    AND "etablissementId" = public.get_user_etablissement_id()
);

CREATE POLICY "tables_delete"
ON tables FOR DELETE
USING (
    public.is_admin_or_manager()
    AND "etablissementId" = public.get_user_etablissement_id()
);

-- ============================================================================
-- 13. POLICIES POUR CLIENTS
-- ============================================================================

CREATE POLICY "clients_select"
ON clients FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND "etablissementId" = public.get_user_etablissement_id()
);

-- Les caissiers et serveurs peuvent créer des clients
CREATE POLICY "clients_insert"
ON clients FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND "etablissementId" = public.get_user_etablissement_id()
);

CREATE POLICY "clients_update"
ON clients FOR UPDATE
USING (
    auth.uid() IS NOT NULL
    AND "etablissementId" = public.get_user_etablissement_id()
)
WITH CHECK (
    auth.uid() IS NOT NULL
    AND "etablissementId" = public.get_user_etablissement_id()
);

CREATE POLICY "clients_delete"
ON clients FOR DELETE
USING (
    public.is_admin_or_manager()
    AND "etablissementId" = public.get_user_etablissement_id()
);

-- ============================================================================
-- 14. POLICIES POUR VENTES
-- ============================================================================

CREATE POLICY "ventes_select"
ON ventes FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND "etablissementId" = public.get_user_etablissement_id()
);

CREATE POLICY "ventes_insert"
ON ventes FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND "etablissementId" = public.get_user_etablissement_id()
);

-- Les utilisateurs peuvent modifier leurs propres ventes en cours
-- Les admins/managers peuvent modifier toutes les ventes
CREATE POLICY "ventes_update"
ON ventes FOR UPDATE
USING (
    "etablissementId" = public.get_user_etablissement_id()
    AND (
        (statut = 'EN_COURS' AND "utilisateurId" = public.get_user_id())
        OR public.is_admin_or_manager()
    )
)
WITH CHECK (
    "etablissementId" = public.get_user_etablissement_id()
);

-- Seuls les super admins peuvent supprimer des ventes
CREATE POLICY "ventes_delete"
ON ventes FOR DELETE
USING (
    public.is_super_admin()
    AND "etablissementId" = public.get_user_etablissement_id()
);

-- ============================================================================
-- 15. POLICIES POUR LIGNES DE VENTE
-- ============================================================================

CREATE POLICY "lignes_vente_select"
ON lignes_vente FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM ventes v
        WHERE v.id = lignes_vente."venteId"
        AND v."etablissementId" = public.get_user_etablissement_id()
    )
);

CREATE POLICY "lignes_vente_insert"
ON lignes_vente FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM ventes v
        WHERE v.id = lignes_vente."venteId"
        AND v."etablissementId" = public.get_user_etablissement_id()
    )
);

CREATE POLICY "lignes_vente_update"
ON lignes_vente FOR UPDATE
USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM ventes v
        WHERE v.id = lignes_vente."venteId"
        AND v."etablissementId" = public.get_user_etablissement_id()
    )
);

CREATE POLICY "lignes_vente_delete"
ON lignes_vente FOR DELETE
USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM ventes v
        WHERE v.id = lignes_vente."venteId"
        AND v."etablissementId" = public.get_user_etablissement_id()
        AND v.statut = 'EN_COURS'
    )
);

-- ============================================================================
-- 16. POLICIES POUR SUPPLEMENTS DE LIGNE DE VENTE
-- ============================================================================

CREATE POLICY "lignes_vente_supplements_all"
ON lignes_vente_supplements FOR ALL
USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM lignes_vente lv
        JOIN ventes v ON v.id = lv."venteId"
        WHERE lv.id = lignes_vente_supplements."ligneVenteId"
        AND v."etablissementId" = public.get_user_etablissement_id()
    )
);

-- ============================================================================
-- 17. POLICIES POUR PAIEMENTS
-- ============================================================================

CREATE POLICY "paiements_select"
ON paiements FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM ventes v
        WHERE v.id = paiements."venteId"
        AND v."etablissementId" = public.get_user_etablissement_id()
    )
);

CREATE POLICY "paiements_insert"
ON paiements FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM ventes v
        WHERE v.id = paiements."venteId"
        AND v."etablissementId" = public.get_user_etablissement_id()
    )
);

CREATE POLICY "paiements_update"
ON paiements FOR UPDATE
USING (
    public.is_admin_or_manager()
    AND EXISTS (
        SELECT 1 FROM ventes v
        WHERE v.id = paiements."venteId"
        AND v."etablissementId" = public.get_user_etablissement_id()
    )
);

CREATE POLICY "paiements_delete"
ON paiements FOR DELETE
USING (
    public.is_admin_or_manager()
    AND EXISTS (
        SELECT 1 FROM ventes v
        WHERE v.id = paiements."venteId"
        AND v."etablissementId" = public.get_user_etablissement_id()
    )
);

-- ============================================================================
-- 18. POLICIES POUR SESSIONS CAISSE
-- ============================================================================

CREATE POLICY "sessions_caisse_select"
ON sessions_caisse FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND "etablissementId" = public.get_user_etablissement_id()
);

CREATE POLICY "sessions_caisse_insert"
ON sessions_caisse FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND "etablissementId" = public.get_user_etablissement_id()
);

CREATE POLICY "sessions_caisse_update"
ON sessions_caisse FOR UPDATE
USING (
    "etablissementId" = public.get_user_etablissement_id()
    AND ("utilisateurId" = public.get_user_id() OR public.is_admin_or_manager())
)
WITH CHECK (
    "etablissementId" = public.get_user_etablissement_id()
);

CREATE POLICY "sessions_caisse_delete"
ON sessions_caisse FOR DELETE
USING (public.is_super_admin());

-- ============================================================================
-- 19. POLICIES POUR IMPRIMANTES
-- ============================================================================

CREATE POLICY "imprimantes_select"
ON imprimantes FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND "etablissementId" = public.get_user_etablissement_id()
);

CREATE POLICY "imprimantes_all"
ON imprimantes FOR ALL
USING (
    public.is_admin_or_manager()
    AND "etablissementId" = public.get_user_etablissement_id()
)
WITH CHECK (
    public.is_admin_or_manager()
    AND "etablissementId" = public.get_user_etablissement_id()
);

-- ============================================================================
-- 20. POLICIES POUR MOUVEMENTS DE STOCK
-- ============================================================================

CREATE POLICY "mouvements_stock_select"
ON mouvements_stock FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM produits p
        WHERE p.id = mouvements_stock."produitId"
        AND p."etablissementId" = public.get_user_etablissement_id()
    )
);

-- Les mouvements automatiques (ventes) peuvent être créés par tout le monde
CREATE POLICY "mouvements_stock_insert"
ON mouvements_stock FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM produits p
        WHERE p.id = mouvements_stock."produitId"
        AND p."etablissementId" = public.get_user_etablissement_id()
    )
);

CREATE POLICY "mouvements_stock_update"
ON mouvements_stock FOR UPDATE
USING (
    public.is_admin_or_manager()
    AND EXISTS (
        SELECT 1 FROM produits p
        WHERE p.id = mouvements_stock."produitId"
        AND p."etablissementId" = public.get_user_etablissement_id()
    )
);

CREATE POLICY "mouvements_stock_delete"
ON mouvements_stock FOR DELETE
USING (
    public.is_admin_or_manager()
    AND EXISTS (
        SELECT 1 FROM produits p
        WHERE p.id = mouvements_stock."produitId"
        AND p."etablissementId" = public.get_user_etablissement_id()
    )
);

-- ============================================================================
-- 21. POLICIES POUR AUDIT LOGS
-- ============================================================================

-- Seuls les admins peuvent voir les logs d'audit
CREATE POLICY "audit_logs_select"
ON audit_logs FOR SELECT
USING (
    public.is_admin_or_manager()
    AND "etablissementId" = public.get_user_etablissement_id()
);

-- Tous les utilisateurs peuvent créer des logs (système)
CREATE POLICY "audit_logs_insert"
ON audit_logs FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND "etablissementId" = public.get_user_etablissement_id()
);

-- Pas de UPDATE ou DELETE pour les audit logs (immutables)

-- ============================================================================
-- 22. GRANT PERMISSIONS
-- ============================================================================

-- S'assurer que les fonctions peuvent être exécutées par les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.get_user_etablissement_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================================
-- 23. INDEX POUR PERFORMANCE
-- ============================================================================

-- Ces index améliorent les performances des requêtes avec RLS
CREATE INDEX IF NOT EXISTS idx_utilisateurs_etablissement_email
ON utilisateurs("etablissementId", email);

CREATE INDEX IF NOT EXISTS idx_utilisateurs_email_actif
ON utilisateurs(email) WHERE actif = true;

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================
--
-- MIGRATION DES UTILISATEURS VERS SUPABASE AUTH:
-- -----------------------------------------------
-- Pour chaque utilisateur dans la table `utilisateurs`, créer un compte
-- dans Supabase Auth avec le même email:
--
-- Via l'API Supabase Admin (côté serveur):
--   await supabase.auth.admin.createUser({
--     email: 'user@example.com',
--     password: 'temporary-password',
--     email_confirm: true
--   })
--
-- L'utilisateur devra ensuite réinitialiser son mot de passe.
--
-- VÉRIFICATION:
-- -------------
-- Après application des politiques, tester avec:
--   SELECT * FROM produits; -- Doit retourner uniquement les produits de l'établissement
--
-- DÉSACTIVATION TEMPORAIRE (debug):
-- ---------------------------------
--   ALTER TABLE produits DISABLE ROW LEVEL SECURITY;
--
-- BYPASS POUR SERVICE ROLE:
-- -------------------------
-- Le Service Role Key de Supabase bypass automatiquement les RLS.
-- Utiliser uniquement côté serveur pour les opérations admin.
--
-- ============================================================================
