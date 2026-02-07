'use server'

/**
 * Server Actions pour l'authentification Supabase
 * Utilise uniquement Supabase Auth pour l'authentification
 */

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { verifyPin } from '@/lib/auth/password'
import {
  loginSchema,
  pinLoginSchema,
  type LoginInput,
  type PinLoginInput,
} from '@/schemas/auth'

type ActionResult<T = void> = {
  success: boolean
  error?: string
  data?: T
}

/**
 * Connexion avec email et mot de passe via Supabase Auth
 */
export async function loginWithSupabase(input: LoginInput): Promise<ActionResult> {
  try {
    const validated = loginSchema.parse(input)
    const supabase = createServiceClient()

    // Vérifier que l'utilisateur existe dans notre table
    const { data: utilisateur } = await supabase
      .from('utilisateurs')
      .select('id, nom, prenom, actif, etablissement_id')
      .eq('email', validated.email)
      .single()

    if (!utilisateur || !utilisateur.actif) {
      return { success: false, error: 'Email ou mot de passe incorrect' }
    }

    // Connexion via Supabase Auth
    const authClient = await createClient()
    const { error } = await authClient.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    })

    if (error) {
      console.error('[Auth Supabase] Login error:', error.message)
      return { success: false, error: 'Email ou mot de passe incorrect' }
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      action: 'LOGIN',
      entite: 'Utilisateur',
      entite_id: utilisateur.id,
      description: `Connexion de ${utilisateur.prenom} ${utilisateur.nom}`,
      utilisateur_id: utilisateur.id,
      etablissement_id: utilisateur.etablissement_id,
    })

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('[Auth Supabase] Login exception:', error)
    return { success: false, error: 'Une erreur est survenue lors de la connexion' }
  }
}

/**
 * Connexion avec email et PIN
 * Note: L'auth PIN utilise la vérification locale du PIN hashé
 * puis crée une session Supabase avec un token custom
 */
export async function loginWithPinSupabase(input: PinLoginInput): Promise<ActionResult> {
  try {
    const validated = pinLoginSchema.parse(input)

    // Utiliser le service client pour bypasser RLS (l'utilisateur n'est pas encore authentifié)
    const { createServiceClient } = await import('@/lib/supabase/server')
    const supabase = createServiceClient()

    // Rechercher l'utilisateur
    const { data: utilisateur, error: dbError } = await supabase
      .from('utilisateurs')
      .select('id, nom, prenom, role, actif, pin_code, etablissement_id')
      .eq('email', validated.email)
      .single()

    if (!utilisateur || !utilisateur.actif) {
      return { success: false, error: 'Email ou PIN incorrect' }
    }

    if (!utilisateur.pin_code) {
      return { success: false, error: 'Aucun PIN configuré pour cet utilisateur' }
    }

    // Vérifier le PIN
    const isPinValid = await verifyPin(validated.pin, utilisateur.pin_code)
    if (!isPinValid) {
      return { success: false, error: 'Email ou PIN incorrect' }
    }

    // Pour l'auth PIN, on crée une session legacy (JWT custom)
    // car Supabase Auth ne supporte pas l'auth par PIN
    const { createSession, setSessionCookie } = await import('@/lib/auth/session')
    const sessionPayload = {
      userId: utilisateur.id,
      email: validated.email,
      role: utilisateur.role,
      etablissementId: utilisateur.etablissement_id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      isPinAuth: true,
    }
    const token = await createSession(sessionPayload)
    await setSessionCookie(token, true)

    // Audit log
    await supabase.from('audit_logs').insert({
      action: 'LOGIN',
      entite: 'Utilisateur',
      entite_id: utilisateur.id,
      description: `Connexion PIN de ${utilisateur.prenom} ${utilisateur.nom}`,
      utilisateur_id: utilisateur.id,
      etablissement_id: utilisateur.etablissement_id,
    })

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('[Auth Supabase] PIN login exception:', error)
    return { success: false, error: 'Une erreur est survenue lors de la connexion' }
  }
}

/**
 * Déconnexion de l'utilisateur
 */
export async function logoutSupabase(): Promise<void> {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()

    if (user?.email) {
      const supabase = createServiceClient()
      const { data: utilisateur } = await supabase
        .from('utilisateurs')
        .select('id, etablissement_id, nom, prenom')
        .eq('email', user.email)
        .single()

      if (utilisateur) {
        // Audit log
        await supabase.from('audit_logs').insert({
          action: 'LOGOUT',
          entite: 'Utilisateur',
          entite_id: utilisateur.id,
          description: `Déconnexion de ${utilisateur.prenom} ${utilisateur.nom}`,
          utilisateur_id: utilisateur.id,
          etablissement_id: utilisateur.etablissement_id,
        })
      }
    }

    await authClient.auth.signOut()

    // Supprimer le cookie legacy si présent (pour les sessions PIN)
    const { deleteSessionCookie } = await import('@/lib/auth/session')
    await deleteSessionCookie()
  } catch (error) {
    console.error('[Auth Supabase] Logout exception:', error)
  }

  redirect('/login')
}

/**
 * Récupère l'utilisateur actuellement connecté
 * Supporte à la fois Supabase Auth et les sessions PIN (legacy)
 */
export async function getCurrentUserSupabase() {
  try {
    const authClient = await createClient()
    const { data: { user: supabaseUser } } = await authClient.auth.getUser()

    // Si pas de session Supabase, vérifier la session PIN legacy
    if (!supabaseUser?.email) {
      const { getSession } = await import('@/lib/auth/session')
      const legacySession = await getSession()

      if (!legacySession) return null

      const supabase = createServiceClient()
      const { data: utilisateur } = await supabase
        .from('utilisateurs')
        .select(`
          id, nom, prenom, email, role, actif, etablissement_id,
          etablissements(id, nom, logo)
        `)
        .eq('id', legacySession.userId)
        .single()

      if (!utilisateur || !utilisateur.actif) return null

      return {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        role: utilisateur.role,
        actif: utilisateur.actif,
        etablissementId: utilisateur.etablissement_id,
        etablissement: utilisateur.etablissements as { id: string; nom: string; logo: string | null },
        authProvider: 'pin' as const,
      }
    }

    const supabase = createServiceClient()
    const { data: utilisateur } = await supabase
      .from('utilisateurs')
      .select(`
        id, nom, prenom, email, role, actif, etablissement_id,
        etablissements(id, nom, logo)
      `)
      .eq('email', supabaseUser.email)
      .single()

    if (!utilisateur || !utilisateur.actif) return null

    return {
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      role: utilisateur.role,
      actif: utilisateur.actif,
      etablissementId: utilisateur.etablissement_id,
      etablissement: utilisateur.etablissements as { id: string; nom: string; logo: string | null },
      authProvider: 'supabase' as const,
    }
  } catch (error) {
    console.error('[Auth Supabase] Get current user exception:', error)
    return null
  }
}

/**
 * Créer un utilisateur dans Supabase Auth
 */
export async function createSupabaseUser(
  email: string,
  password: string
): Promise<ActionResult<string>> {
  try {
    const { createServiceClient } = await import('@/lib/supabase/server')
    const supabaseAdmin = createServiceClient()

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) {
      console.error('[Auth Supabase] Create user error:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true, data: data.user.id }
  } catch (error) {
    console.error('[Auth Supabase] Create user exception:', error)
    return { success: false, error: 'Erreur lors de la création de l\'utilisateur' }
  }
}

/**
 * Met à jour le mot de passe d'un utilisateur dans Supabase Auth
 */
export async function updateSupabasePassword(newPassword: string): Promise<ActionResult> {
  try {
    const authClient = await createClient()
    const { error } = await authClient.auth.updateUser({ password: newPassword })

    if (error) {
      console.error('[Auth Supabase] Update password error:', error.message)
      return { success: false, error: 'Erreur lors de la mise à jour du mot de passe' }
    }

    return { success: true }
  } catch (error) {
    console.error('[Auth Supabase] Update password exception:', error)
    return { success: false, error: 'Erreur lors de la mise à jour du mot de passe' }
  }
}

/**
 * Détermine la route de redirection après connexion en fonction du rôle et des permissions
 *
 * Logique de redirection :
 * 1. Si l'utilisateur a des routes autorisées personnalisées → première route autorisée
 * 2. Sinon, selon le rôle :
 *    - SUPER_ADMIN, ADMIN, MANAGER → /caisse (tableau de bord POS)
 *    - CAISSIER → /caisse
 *    - SERVEUR → /salle
 */
export async function getDefaultRedirectRoute(): Promise<ActionResult<string>> {
  try {
    const user = await getCurrentUserSupabase()

    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' }
    }

    // Récupérer les routes autorisées de l'utilisateur
    const { createServiceClient } = await import('@/lib/supabase/server')
    const supabase = createServiceClient()

    const { data: utilisateur } = await supabase
      .from('utilisateurs')
      .select('allowed_routes')
      .eq('id', user.id)
      .single()

    // Vérifier si l'utilisateur a des routes personnalisées
    const userAllowedRoutes = utilisateur?.allowed_routes as string[] | null

    if (userAllowedRoutes && userAllowedRoutes.length > 0) {
      // Utiliser la première route autorisée
      return { success: true, data: userAllowedRoutes[0] }
    }

    // Pour les non-admins, vérifier les routes par rôle
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      const { data: roleConfig } = await supabase
        .from('role_permissions')
        .select('allowed_routes')
        .eq('role', user.role)
        .eq('etablissement_id', user.etablissementId)
        .maybeSingle()

      const roleAllowedRoutes = roleConfig?.allowed_routes as string[] | null

      if (roleAllowedRoutes && roleAllowedRoutes.length > 0) {
        // Utiliser la première route autorisée par le rôle
        return { success: true, data: roleAllowedRoutes[0] }
      }
    }

    // Routes par défaut selon le rôle
    const defaultRoutes: Record<string, string> = {
      SUPER_ADMIN: '/dashboard',
      ADMIN: '/dashboard',
      MANAGER: '/dashboard',
      CAISSIER: '/caisse',
      SERVEUR: '/salle',
    }

    const defaultRoute = defaultRoutes[user.role] || '/caisse'
    return { success: true, data: defaultRoute }
  } catch (error) {
    console.error('[Auth Supabase] Get default redirect route exception:', error)
    // En cas d'erreur, rediriger vers la caisse par défaut
    return { success: true, data: '/caisse' }
  }
}
