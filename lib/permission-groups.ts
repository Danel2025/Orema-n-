/**
 * Groupes de permissions pour l'interface utilisateur
 *
 * Organise les 47 permissions granulaires en categories
 * pour une navigation facile dans l'editeur de permissions.
 */

import type { Permission } from './permissions'
import {
  ShoppingCart,
  Package,
  FolderTree,
  Warehouse,
  Users,
  UtensilsCrossed,
  Calculator,
  UserCircle,
  BarChart3,
  Building2,
  Printer,
  FileSearch,
  type LucideIcon,
} from 'lucide-react'

/**
 * Definition d'un groupe de permissions
 */
export interface PermissionGroup {
  /** Cle unique du groupe */
  key: string
  /** Label affiche */
  label: string
  /** Description courte */
  description: string
  /** Icone Lucide */
  icon: LucideIcon
  /** Liste des permissions du groupe */
  permissions: PermissionDefinition[]
}

/**
 * Definition d'une permission individuelle
 */
export interface PermissionDefinition {
  /** Cle de la permission (ex: 'vente:creer') */
  key: Permission
  /** Label affiche */
  label: string
  /** Description detaillee */
  description: string
}

/**
 * Groupes de permissions organises par categorie
 */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: 'ventes',
    label: 'Ventes',
    description: 'Operations de vente et encaissement',
    icon: ShoppingCart,
    permissions: [
      { key: 'vente:creer', label: 'Creer des ventes', description: 'Creer de nouvelles ventes et commandes' },
      { key: 'vente:lire', label: 'Voir les ventes', description: 'Consulter l\'historique des ventes' },
      { key: 'vente:modifier', label: 'Modifier les ventes', description: 'Modifier les ventes en cours' },
      { key: 'vente:annuler', label: 'Annuler des ventes', description: 'Annuler une vente en cours' },
      { key: 'vente:rembourser', label: 'Rembourser', description: 'Effectuer des remboursements' },
      { key: 'vente:appliquer_remise', label: 'Appliquer des remises', description: 'Appliquer des remises sur les ventes' },
      { key: 'vente:modifier_prix', label: 'Modifier les prix', description: 'Modifier le prix d\'un article pendant la vente' },
    ],
  },
  {
    key: 'produits',
    label: 'Produits',
    description: 'Gestion du catalogue de produits',
    icon: Package,
    permissions: [
      { key: 'produit:creer', label: 'Creer des produits', description: 'Ajouter de nouveaux produits au catalogue' },
      { key: 'produit:lire', label: 'Voir les produits', description: 'Consulter le catalogue de produits' },
      { key: 'produit:modifier', label: 'Modifier les produits', description: 'Modifier les informations des produits' },
      { key: 'produit:supprimer', label: 'Supprimer des produits', description: 'Supprimer des produits du catalogue' },
      { key: 'produit:import', label: 'Importer des produits', description: 'Importer des produits depuis un fichier CSV' },
      { key: 'produit:export', label: 'Exporter des produits', description: 'Exporter le catalogue en CSV' },
    ],
  },
  {
    key: 'categories',
    label: 'Categories',
    description: 'Gestion des categories de produits',
    icon: FolderTree,
    permissions: [
      { key: 'categorie:creer', label: 'Creer des categories', description: 'Creer de nouvelles categories' },
      { key: 'categorie:lire', label: 'Voir les categories', description: 'Consulter les categories' },
      { key: 'categorie:modifier', label: 'Modifier les categories', description: 'Modifier les informations des categories' },
      { key: 'categorie:supprimer', label: 'Supprimer des categories', description: 'Supprimer des categories' },
    ],
  },
  {
    key: 'stocks',
    label: 'Stocks',
    description: 'Gestion des stocks et inventaires',
    icon: Warehouse,
    permissions: [
      { key: 'stock:lire', label: 'Voir les stocks', description: 'Consulter les niveaux de stock' },
      { key: 'stock:modifier', label: 'Modifier les stocks', description: 'Ajuster les quantites en stock' },
      { key: 'stock:inventaire', label: 'Faire l\'inventaire', description: 'Realiser un inventaire complet' },
      { key: 'stock:mouvement', label: 'Mouvements de stock', description: 'Creer des entrees/sorties de stock' },
    ],
  },
  {
    key: 'clients',
    label: 'Clients',
    description: 'Gestion de la clientele et fidelite',
    icon: Users,
    permissions: [
      { key: 'client:creer', label: 'Creer des clients', description: 'Ajouter de nouveaux clients' },
      { key: 'client:lire', label: 'Voir les clients', description: 'Consulter le fichier clients' },
      { key: 'client:modifier', label: 'Modifier les clients', description: 'Modifier les informations des clients' },
      { key: 'client:supprimer', label: 'Supprimer des clients', description: 'Supprimer des clients' },
      { key: 'client:credit_autoriser', label: 'Autoriser le credit', description: 'Activer le credit pour un client' },
      { key: 'client:solde_modifier', label: 'Modifier le solde', description: 'Ajuster le solde prepaye d\'un client' },
    ],
  },
  {
    key: 'tables',
    label: 'Tables / Salle',
    description: 'Gestion du plan de salle',
    icon: UtensilsCrossed,
    permissions: [
      { key: 'table:lire', label: 'Voir les tables', description: 'Voir le plan de salle et l\'etat des tables' },
      { key: 'table:modifier_statut', label: 'Modifier le statut', description: 'Changer le statut d\'une table' },
      { key: 'table:creer', label: 'Creer des tables', description: 'Ajouter de nouvelles tables au plan' },
      { key: 'table:supprimer', label: 'Supprimer des tables', description: 'Retirer des tables du plan' },
      { key: 'table:plan_modifier', label: 'Modifier le plan', description: 'Reorganiser le plan de salle' },
    ],
  },
  {
    key: 'caisse',
    label: 'Caisse',
    description: 'Operations de caisse',
    icon: Calculator,
    permissions: [
      { key: 'caisse:ouvrir', label: 'Ouvrir la caisse', description: 'Ouvrir une session de caisse' },
      { key: 'caisse:cloturer', label: 'Cloturer la caisse', description: 'Cloturer une session de caisse' },
      { key: 'caisse:consulter', label: 'Consulter la caisse', description: 'Voir les totaux de la caisse' },
      { key: 'caisse:annuler_vente', label: 'Annuler en caisse', description: 'Annuler une vente depuis la caisse' },
    ],
  },
  {
    key: 'employes',
    label: 'Employes',
    description: 'Gestion du personnel',
    icon: UserCircle,
    permissions: [
      { key: 'employe:creer', label: 'Creer des employes', description: 'Ajouter de nouveaux employes' },
      { key: 'employe:lire', label: 'Voir les employes', description: 'Consulter la liste des employes' },
      { key: 'employe:modifier', label: 'Modifier les employes', description: 'Modifier les informations des employes' },
      { key: 'employe:supprimer', label: 'Supprimer des employes', description: 'Supprimer des employes' },
      { key: 'employe:modifier_role', label: 'Modifier les roles', description: 'Changer le role d\'un employe' },
      { key: 'employe:reset_pin', label: 'Reinitialiser le PIN', description: 'Reinitialiser le code PIN d\'un employe' },
    ],
  },
  {
    key: 'rapports',
    label: 'Rapports',
    description: 'Statistiques et analyses',
    icon: BarChart3,
    permissions: [
      { key: 'rapport:ventes', label: 'Rapports de ventes', description: 'Voir les rapports de ventes' },
      { key: 'rapport:caisse', label: 'Rapports de caisse', description: 'Voir les rapports de caisse' },
      { key: 'rapport:stocks', label: 'Rapports de stocks', description: 'Voir les rapports de stocks' },
      { key: 'rapport:z', label: 'Rapport Z', description: 'Generer le rapport de cloture journaliere' },
      { key: 'rapport:complet', label: 'Rapports complets', description: 'Acces a tous les rapports detailles' },
      { key: 'rapport:export', label: 'Exporter les rapports', description: 'Exporter les rapports en PDF/Excel' },
    ],
  },
  {
    key: 'etablissement',
    label: 'Etablissement',
    description: 'Configuration de l\'etablissement',
    icon: Building2,
    permissions: [
      { key: 'etablissement:lire', label: 'Voir l\'etablissement', description: 'Voir les informations de l\'etablissement' },
      { key: 'etablissement:modifier', label: 'Modifier l\'etablissement', description: 'Modifier les informations de l\'etablissement' },
      { key: 'etablissement:parametres', label: 'Gerer les parametres', description: 'Configurer les parametres avances' },
    ],
  },
  {
    key: 'imprimantes',
    label: 'Imprimantes',
    description: 'Gestion des imprimantes',
    icon: Printer,
    permissions: [
      { key: 'imprimante:lire', label: 'Voir les imprimantes', description: 'Voir la liste des imprimantes' },
      { key: 'imprimante:creer', label: 'Ajouter une imprimante', description: 'Configurer une nouvelle imprimante' },
      { key: 'imprimante:modifier', label: 'Modifier une imprimante', description: 'Modifier la configuration d\'une imprimante' },
      { key: 'imprimante:supprimer', label: 'Supprimer une imprimante', description: 'Retirer une imprimante' },
      { key: 'imprimante:tester', label: 'Tester une imprimante', description: 'Imprimer une page de test' },
    ],
  },
  {
    key: 'audit',
    label: 'Audit',
    description: 'Journaux d\'activite',
    icon: FileSearch,
    permissions: [
      { key: 'audit:lire', label: 'Voir les journaux', description: 'Consulter les journaux d\'audit' },
      { key: 'audit:exporter', label: 'Exporter les journaux', description: 'Exporter les journaux d\'audit' },
    ],
  },
]

/**
 * Obtient toutes les permissions sous forme de liste plate
 */
export function getAllPermissionsList(): Permission[] {
  return PERMISSION_GROUPS.flatMap((group) =>
    group.permissions.map((p) => p.key)
  )
}

/**
 * Obtient la definition d'une permission
 */
export function getPermissionDefinition(permission: Permission): PermissionDefinition | undefined {
  for (const group of PERMISSION_GROUPS) {
    const found = group.permissions.find((p) => p.key === permission)
    if (found) return found
  }
  return undefined
}

/**
 * Obtient le groupe d'une permission
 */
export function getPermissionGroup(permission: Permission): PermissionGroup | undefined {
  return PERMISSION_GROUPS.find((group) =>
    group.permissions.some((p) => p.key === permission)
  )
}

/**
 * Compte les permissions actives par groupe
 */
export function countPermissionsByGroup(
  activePermissions: Permission[]
): Record<string, { active: number; total: number }> {
  const result: Record<string, { active: number; total: number }> = {}

  for (const group of PERMISSION_GROUPS) {
    const activeInGroup = group.permissions.filter((p) =>
      activePermissions.includes(p.key)
    ).length

    result[group.key] = {
      active: activeInGroup,
      total: group.permissions.length,
    }
  }

  return result
}
