-- Migration: Ajout du champ allowed_routes pour configurer les pages par rôle
-- Description: Permet aux admins de définir quelles pages chaque rôle peut voir

-- Ajouter la colonne allowed_routes à la table role_permissions
ALTER TABLE role_permissions
ADD COLUMN IF NOT EXISTS allowed_routes TEXT[] DEFAULT NULL;

-- Commentaire pour documenter le champ
COMMENT ON COLUMN role_permissions.allowed_routes IS
'Routes autorisées pour ce rôle dans cet établissement. Format: {"/caisse", "/salle", "/clients"}. Si NULL, toutes les pages accessibles selon les permissions s''appliquent.';
