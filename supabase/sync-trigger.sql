-- ============================================================================
-- Trigger de synchronisation Supabase Auth -> Table utilisateurs
--
-- Ce trigger crée automatiquement une entrée dans la table `utilisateurs`
-- quand un nouvel utilisateur est créé dans Supabase Auth.
--
-- IMPORTANT: Exécutez ce SQL dans l'éditeur SQL de Supabase Dashboard
-- ============================================================================

-- Fonction qui sera appelée par le trigger
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  default_etablissement_id UUID;
BEGIN
  -- Récupérer l'établissement par défaut (le premier trouvé)
  -- Vous pouvez modifier cette logique selon vos besoins
  SELECT id INTO default_etablissement_id
  FROM public.etablissements
  LIMIT 1;

  -- Créer l'utilisateur dans la table utilisateurs
  INSERT INTO public.utilisateurs (
    id,
    email,
    nom,
    prenom,
    role,
    actif,
    etablissement_id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,  -- Utiliser le même ID que Supabase Auth
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', 'À définir'),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'CAISSIER'),
    TRUE,
    COALESCE(
      (NEW.raw_user_meta_data->>'etablissement_id')::UUID,
      default_etablissement_id
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO NOTHING;  -- Ignorer si l'email existe déjà

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger sur la table auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- Script de synchronisation des utilisateurs existants
-- Exécutez cette partie UNE SEULE FOIS pour synchroniser les données existantes
-- ============================================================================

-- Synchroniser les utilisateurs de auth.users vers utilisateurs
-- (uniquement ceux qui n'existent pas encore)
INSERT INTO public.utilisateurs (
  id,
  email,
  nom,
  prenom,
  role,
  actif,
  etablissement_id,
  created_at,
  updated_at
)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'nom', 'À définir'),
  COALESCE(au.raw_user_meta_data->>'prenom', ''),
  COALESCE(au.raw_user_meta_data->>'role', 'CAISSIER'),
  TRUE,
  (SELECT id FROM public.etablissements LIMIT 1),
  au.created_at,
  NOW()
FROM auth.users au
WHERE au.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.utilisateurs u
    WHERE LOWER(u.email) = LOWER(au.email)
  );

-- Afficher le résultat
SELECT
  'Synchronisation terminée' as status,
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.utilisateurs) as utilisateurs_count;
