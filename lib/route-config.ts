/**
 * Configuration des routes protegees et permissions requises
 *
 * Definit les permissions necessaires pour acceder a chaque route du dashboard.
 * Utilise par le RouteGuard et la Sidebar pour controler l'acces.
 */

import type { Permission } from './permissions'
import type { Role } from '@/lib/db/types'
import type { Route } from 'next'

/**
 * Configuration d'une route protegee
 */
export interface RouteConfig {
  /** Chemin de la route */
  path: string
  /** Label affiche dans la sidebar */
  label: string
  /** Permission(s) requise(s) - au moins une doit etre satisfaite */
  requiredPermissions?: Permission[]
  /** Toutes ces permissions sont requises (AND) */
  requiredAllPermissions?: Permission[]
  /** Roles minimum requis - l'utilisateur doit avoir au moins ce role */
  minRole?: Role
  /** Roles autorises specifiquement */
  allowedRoles?: Role[]
  /** Route accessible par tous les utilisateurs connectes */
  publicForAuthenticated?: boolean
  /** Description courte pour le tooltip */
  description?: string
}

/**
 * Configuration des routes du dashboard
 *
 * L'ordre determine l'affichage dans la sidebar.
 * Une route sans permission est accessible a tous les utilisateurs connectes.
 */
export const DASHBOARD_ROUTES: RouteConfig[] = [
  {
    path: '/dashboard',
    label: 'Tableau de bord',
    requiredPermissions: ['rapport:ventes', 'rapport:caisse'],
    description: 'Vue globale de l\'activite',
  },
  {
    path: '/caisse',
    label: 'Caisse',
    requiredPermissions: ['vente:creer', 'caisse:ouvrir'],
    description: 'Point de vente et encaissement',
  },
  {
    path: '/salle',
    label: 'Plan de salle',
    requiredPermissions: ['table:lire'],
    description: 'Gestion des tables et service en salle',
  },
  {
    path: '/produits',
    label: 'Produits',
    requiredPermissions: ['produit:lire'],
    description: 'Catalogue des produits',
  },
  {
    path: '/stocks',
    label: 'Stocks',
    requiredPermissions: ['stock:lire'],
    description: 'Gestion des stocks et inventaire',
  },
  {
    path: '/clients',
    label: 'Clients',
    requiredPermissions: ['client:lire'],
    description: 'Fichier clients et fidelite',
  },
  {
    path: '/employes',
    label: 'Employes',
    requiredPermissions: ['employe:lire'],
    description: 'Gestion du personnel',
  },
  {
    path: '/rapports',
    label: 'Rapports',
    requiredPermissions: ['rapport:ventes', 'rapport:z', 'rapport:caisse'],
    description: 'Statistiques et analyses',
  },
  {
    path: '/parametres',
    label: 'Parametres',
    requiredPermissions: ['etablissement:lire', 'imprimante:lire'],
    description: 'Configuration du systeme',
  },
  {
    path: '/admin',
    label: 'Administration',
    allowedRoles: ['SUPER_ADMIN'],
    description: 'Administration globale du systeme',
  },
]

/**
 * Sous-routes avec permissions specifiques
 */
export const SUB_ROUTES: RouteConfig[] = [
  // Sous-routes Parametres
  {
    path: '/parametres/profil',
    label: 'Mon profil',
    publicForAuthenticated: true,
    description: 'Modifier son profil',
  },
  {
    path: '/parametres/etablissement',
    label: 'Etablissement',
    requiredPermissions: ['etablissement:modifier'],
    description: 'Configurer l\'etablissement',
  },
  {
    path: '/parametres/imprimantes',
    label: 'Imprimantes',
    requiredPermissions: ['imprimante:modifier'],
    description: 'Gerer les imprimantes',
  },
  // Sous-routes Produits
  {
    path: '/produits/categories',
    label: 'Categories',
    requiredPermissions: ['categorie:lire'],
    description: 'Gerer les categories',
  },
  {
    path: '/produits/import',
    label: 'Import',
    requiredPermissions: ['produit:import'],
    description: 'Importer des produits',
  },
]

/**
 * Toutes les routes (principales + sous-routes)
 */
export const ALL_ROUTES: RouteConfig[] = [...DASHBOARD_ROUTES, ...SUB_ROUTES]

/**
 * Trouve la configuration d'une route par son chemin
 */
export function getRouteConfig(path: string): RouteConfig | undefined {
  // Recherche exacte d'abord
  const exactMatch = ALL_ROUTES.find((route) => route.path === path)
  if (exactMatch) return exactMatch

  // Recherche avec segments dynamiques (ex: /produits/123)
  // On verifie si le chemin commence par une route connue
  const parentMatch = ALL_ROUTES.find((route) => {
    if (route.path === '/') return false
    return path.startsWith(route.path + '/') || path === route.path
  })

  return parentMatch
}

/**
 * Obtient la route parente pour une sous-route
 */
export function getParentRoute(path: string): RouteConfig | undefined {
  const segments = path.split('/').filter(Boolean)
  if (segments.length <= 1) return undefined

  const parentPath = '/' + segments.slice(0, -1).join('/')
  return DASHBOARD_ROUTES.find((route) => route.path === parentPath)
}

/**
 * Type pour les chemins des routes principales
 */
export type DashboardPath = (typeof DASHBOARD_ROUTES)[number]['path']
