'use server'

/**
 * Server Action pour déverrouiller la session avec un PIN
 * Migré vers Supabase
 */

import { createServiceClient } from '@/lib/db'
import { verifyPin } from '@/lib/auth/password'
import { getCurrentUserSupabase } from './auth-supabase'

type ActionResult = { success: boolean; error?: string }

/**
 * Vérifie le PIN de l'utilisateur connecté pour déverrouiller la session
 */
export async function verifyPinForUnlock(pin: string): Promise<ActionResult> {
  try {
    if (!/^\d{4,6}$/.test(pin)) {
      return { success: false, error: 'PIN invalide (4-6 chiffres requis)' }
    }

    const currentUser = await getCurrentUserSupabase()
    if (!currentUser) {
      return { success: false, error: 'Session expirée, veuillez vous reconnecter' }
    }

    const supabase = createServiceClient()
    const { data: utilisateur } = await supabase
      .from('utilisateurs')
      .select('id, pin_code, nom, prenom, etablissement_id')
      .eq('id', currentUser.id)
      .single()

    if (!utilisateur) return { success: false, error: 'Utilisateur non trouvé' }
    if (!utilisateur.pin_code) return { success: false, error: 'Aucun PIN configuré. Contactez un administrateur.' }

    const isPinValid = await verifyPin(pin, utilisateur.pin_code)

    if (!isPinValid) {
      try {
        await supabase.from('audit_logs').insert({
          action: 'LOGIN',
          entite: 'Utilisateur',
          entite_id: utilisateur.id,
          description: `[PIN ECHEC] Tentative de déverrouillage échouée pour ${utilisateur.prenom} ${utilisateur.nom}`,
          utilisateur_id: utilisateur.id,
          etablissement_id: utilisateur.etablissement_id,
        })
      } catch { /* ignorer erreurs audit */ }
      return { success: false, error: 'PIN incorrect' }
    }

    try {
      await supabase.from('audit_logs').insert({
        action: 'LOGIN',
        entite: 'Utilisateur',
        entite_id: utilisateur.id,
        description: `[PIN OK] Session déverrouillée par ${utilisateur.prenom} ${utilisateur.nom}`,
        utilisateur_id: utilisateur.id,
        etablissement_id: utilisateur.etablissement_id,
      })
    } catch { /* ignorer erreurs audit */ }

    return { success: true }
  } catch (error) {
    console.error('[PIN Unlock] Exception:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}
