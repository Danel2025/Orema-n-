-- Migration: Ajout du champ allowed_routes pour personnaliser l'accès aux pages par utilisateur
-- Description: Permet aux admins de définir quelles pages chaque utilisateur non-admin peut voir

-- Ajouter la colonne allowed_routes à la table utilisateurs
ALTER TABLE utilisateurs
ADD COLUMN IF NOT EXISTS allowed_routes TEXT[] DEFAULT '{}';

-- Commentaire pour documenter le champ
COMMENT ON COLUMN utilisateurs.allowed_routes IS
'Routes personnalisées autorisées pour cet utilisateur (override les permissions du rôle pour les non-admins). Format: {"/caisse", "/salle", "/clients"}. Si vide, les permissions du rôle s''appliquent.';
