'use server'

/**
 * Server Actions pour la gestion des établissements (SUPER_ADMIN uniquement)
 *
 * Permet de :
 * - Lister tous les établissements
 * - Supprimer un établissement et toutes ses données liées
 */

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAnyRole } from '@/lib/auth'

type ActionResult<T = void> = {
  success: boolean
  error?: string
  data?: T
}

export interface EtablissementWithStats {
  id: string
  nom: string
  email: string | null
  telephone: string | null
  adresse: string | null
  createdAt: Date
  nbUtilisateurs: number
  nbProduits: number
  nbVentes: number
  nbClients: number
}

/**
 * Récupérer tous les établissements avec leurs statistiques
 * Réservé au SUPER_ADMIN
 */
export async function getAllEtablissements(): Promise<ActionResult<EtablissementWithStats[]>> {
  try {
    await requireAnyRole(['SUPER_ADMIN'])
    const supabase = createServiceClient()

    // Récupérer les établissements
    const { data: etablissements, error } = await supabase
      .from('etablissements')
      .select('id, nom, email, telephone, adresse, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur récupération établissements:', error)
      return { success: false, error: 'Erreur lors de la récupération des établissements' }
    }

    // Récupérer les stats pour chaque établissement
    const etablissementsWithStats: EtablissementWithStats[] = await Promise.all(
      (etablissements || []).map(async (etab) => {
        const [utilisateurs, produits, ventes, clients] = await Promise.all([
          supabase.from('utilisateurs').select('id', { count: 'exact', head: true }).eq('etablissement_id', etab.id),
          supabase.from('produits').select('id', { count: 'exact', head: true }).eq('etablissement_id', etab.id),
          supabase.from('ventes').select('id', { count: 'exact', head: true }).eq('etablissement_id', etab.id),
          supabase.from('clients').select('id', { count: 'exact', head: true }).eq('etablissement_id', etab.id),
        ])

        return {
          id: etab.id,
          nom: etab.nom,
          email: etab.email,
          telephone: etab.telephone,
          adresse: etab.adresse,
          createdAt: new Date(etab.created_at),
          nbUtilisateurs: utilisateurs.count || 0,
          nbProduits: produits.count || 0,
          nbVentes: ventes.count || 0,
          nbClients: clients.count || 0,
        }
      })
    )

    return { success: true, data: etablissementsWithStats }
  } catch (error) {
    console.error('Erreur getAllEtablissements:', error)
    return { success: false, error: 'Erreur lors de la récupération des établissements' }
  }
}

/**
 * Supprimer un établissement et TOUTES ses données liées
 * Cette action est IRRÉVERSIBLE
 *
 * Ordre de suppression (pour respecter les contraintes FK) :
 * 1. Utilisateurs Supabase Auth
 * 2. Toutes les tables liées à l'établissement
 * 3. L'établissement lui-même
 */
export async function deleteEtablissement(
  etablissementId: string,
  confirmationNom: string
): Promise<ActionResult<{ deletedCounts: Record<string, number> }>> {
  try {
    const session = await requireAnyRole(['SUPER_ADMIN'])
    const supabase = createServiceClient()

    // 1. Vérifier que l'établissement existe
    const { data: etablissement, error: fetchError } = await supabase
      .from('etablissements')
      .select('id, nom')
      .eq('id', etablissementId)
      .single()

    if (fetchError || !etablissement) {
      return { success: false, error: 'Établissement non trouvé' }
    }

    // 2. Vérifier la confirmation du nom
    if (etablissement.nom !== confirmationNom) {
      return {
        success: false,
        error: `Le nom de confirmation ne correspond pas. Attendu: "${etablissement.nom}"`
      }
    }

    // 3. Empêcher la suppression de son propre établissement
    if (etablissementId === session.etablissementId) {
      return {
        success: false,
        error: 'Vous ne pouvez pas supprimer votre propre établissement'
      }
    }

    const deletedCounts: Record<string, number> = {}

    // 4. Récupérer tous les utilisateurs de cet établissement pour les supprimer de Supabase Auth
    const { data: utilisateurs } = await supabase
      .from('utilisateurs')
      .select('id, email')
      .eq('etablissement_id', etablissementId)

    // 5. Supprimer les utilisateurs de Supabase Auth
    if (utilisateurs && utilisateurs.length > 0) {
      for (const user of utilisateurs) {
        try {
          await supabase.auth.admin.deleteUser(user.id)
        } catch (e) {
          console.warn(`Impossible de supprimer l'auth user ${user.email}:`, e)
        }
      }
      deletedCounts['utilisateurs_auth'] = utilisateurs.length
    }

    // 6. Supprimer toutes les données liées (ordre important pour les FK)
    // Les tables avec ON DELETE CASCADE seront supprimées automatiquement
    // mais on le fait explicitement pour avoir les compteurs

    // Paiements mobile
    const { count: paiementsMobile } = await supabase
      .from('paiements_mobile')
      .delete()
      .eq('etablissement_id', etablissementId)
      .select('id', { count: 'exact', head: true })
    deletedCounts['paiements_mobile'] = paiementsMobile || 0

    // Logs SMS
    const { count: logsSms } = await supabase
      .from('logs_sms')
      .delete()
      .eq('etablissement_id', etablissementId)
      .select('id', { count: 'exact', head: true })
    deletedCounts['logs_sms'] = logsSms || 0

    // Rapports Z
    const { count: rapportsZ } = await supabase
      .from('rapports_z')
      .delete()
      .eq('etablissement_id', etablissementId)
      .select('id', { count: 'exact', head: true })
    deletedCounts['rapports_z'] = rapportsZ || 0

    // Sync keys
    const { count: syncKeys } = await supabase
      .from('sync_keys')
      .delete()
      .eq('etablissement_id', etablissementId)
      .select('id', { count: 'exact', head: true })
    deletedCounts['sync_keys'] = syncKeys || 0

    // Audit logs
    const { count: auditLogs } = await supabase
      .from('audit_logs')
      .delete()
      .eq('etablissement_id', etablissementId)
      .select('id', { count: 'exact', head: true })
    deletedCounts['audit_logs'] = auditLogs || 0

    // Ventes (supprime aussi lignes_vente, paiements, lignes_vente_supplements via CASCADE)
    const { count: ventes } = await supabase
      .from('ventes')
      .delete()
      .eq('etablissement_id', etablissementId)
      .select('id', { count: 'exact', head: true })
    deletedCounts['ventes'] = ventes || 0

    // Sessions caisse
    const { count: sessionsCaisse } = await supabase
      .from('sessions_caisse')
      .delete()
      .eq('etablissement_id', etablissementId)
      .select('id', { count: 'exact', head: true })
    deletedCounts['sessions_caisse'] = sessionsCaisse || 0

    // Clients
    const { count: clients } = await supabase
      .from('clients')
      .delete()
      .eq('etablissement_id', etablissementId)
      .select('id', { count: 'exact', head: true })
    deletedCounts['clients'] = clients || 0

    // Mouvements stock (via produits)
    // Les mouvements seront supprimés en cascade avec les produits

    // Produits (supprime aussi supplements_produits, mouvements_stock via CASCADE)
    const { count: produits } = await supabase
      .from('produits')
      .delete()
      .eq('etablissement_id', etablissementId)
      .select('id', { count: 'exact', head: true })
    deletedCounts['produits'] = produits || 0

    // Catégories
    const { count: categories } = await supabase
      .from('categories')
      .delete()
      .eq('etablissement_id', etablissementId)
      .select('id', { count: 'exact', head: true })
    deletedCounts['categories'] = categories || 0

    // Tables
    const { count: tables } = await supabase
      .from('tables')
      .delete()
      .eq('etablissement_id', etablissementId)
      .select('id', { count: 'exact', head: true })
    deletedCounts['tables'] = tables || 0

    // Zones
    const { count: zones } = await supabase
      .from('zones')
      .delete()
      .eq('etablissement_id', etablissementId)
      .select('id', { count: 'exact', head: true })
    deletedCounts['zones'] = zones || 0

    // Imprimantes
    const { count: imprimantes } = await supabase
      .from('imprimantes')
      .delete()
      .eq('etablissement_id', etablissementId)
      .select('id', { count: 'exact', head: true })
    deletedCounts['imprimantes'] = imprimantes || 0

    // Role permissions
    const { count: rolePermissions } = await supabase
      .from('role_permissions')
      .delete()
      .eq('etablissement_id', etablissementId)
      .select('id', { count: 'exact', head: true })
    deletedCounts['role_permissions'] = rolePermissions || 0

    // Sessions utilisateurs
    // D'abord récupérer les IDs des utilisateurs
    const userIds = utilisateurs?.map(u => u.id) || []
    if (userIds.length > 0) {
      const { count: sessions } = await supabase
        .from('sessions')
        .delete()
        .in('utilisateur_id', userIds)
        .select('id', { count: 'exact', head: true })
      deletedCounts['sessions'] = sessions || 0
    }

    // Utilisateurs
    const { count: utilisateursCount } = await supabase
      .from('utilisateurs')
      .delete()
      .eq('etablissement_id', etablissementId)
      .select('id', { count: 'exact', head: true })
    deletedCounts['utilisateurs'] = utilisateursCount || 0

    // 7. Enfin, supprimer l'établissement lui-même
    const { error: deleteError } = await supabase
      .from('etablissements')
      .delete()
      .eq('id', etablissementId)

    if (deleteError) {
      console.error('Erreur suppression établissement:', deleteError)
      return {
        success: false,
        error: `Erreur lors de la suppression: ${deleteError.message}`
      }
    }

    deletedCounts['etablissement'] = 1

    // 8. Log dans l'audit de l'établissement du SUPER_ADMIN
    await supabase.from('audit_logs').insert({
      action: 'DELETE',
      entite: 'Etablissement',
      entite_id: etablissementId,
      description: `Suppression complète de l'établissement "${etablissement.nom}" et de toutes ses données`,
      utilisateur_id: session.userId,
      etablissement_id: session.etablissementId,
      nouvelle_valeur: JSON.stringify(deletedCounts),
    })

    revalidatePath('/admin/etablissements')

    return {
      success: true,
      data: { deletedCounts }
    }
  } catch (error) {
    console.error('Erreur deleteEtablissement:', error)
    return { success: false, error: 'Erreur lors de la suppression de l\'établissement' }
  }
}
