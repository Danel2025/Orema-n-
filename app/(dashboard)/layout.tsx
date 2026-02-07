import { redirect } from 'next/navigation'
import { getCurrentUser, type AuthUser } from '@/lib/auth'
import { getPermissionsForRole, getAllowedRoutesForRole } from '@/lib/permissions-db'
import { DashboardProviders } from '@/components/layout/dashboard-providers'

// Forcer le rendu dynamique pour vérifier l'auth à chaque requête
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Récupérer l'utilisateur complet (Supabase + Prisma)
  const user = await getCurrentUser()

  // Si pas d'utilisateur, rediriger vers login
  if (!user) {
    redirect('/login')
  }

  // Charger les permissions depuis la BD (ou defaults)
  const permissions = await getPermissionsForRole(user.role, user.etablissementId)

  // Charger les routes autorisées par rôle (si configuré)
  const roleAllowedRoutes = await getAllowedRoutesForRole(user.role, user.etablissementId)

  console.log('[DashboardLayout] User:', user.email, 'Role:', user.role)
  console.log('[DashboardLayout] User allowedRoutes:', user.allowedRoutes)
  console.log('[DashboardLayout] Role allowedRoutes:', roleAllowedRoutes)

  // Déterminer les routes autorisées:
  // 1. Routes individuelles (si définies ET non vides) ont priorité
  // 2. Sinon, routes par rôle (si définies)
  // 3. Sinon, undefined = pas de restriction
  //
  // Note: un tableau VIDE [] pour les routes individuelles = "pas de config", on passe aux routes par rôle
  // Un tableau VIDE [] pour les routes par rôle = "aucun accès" (restriction totale)
  let finalAllowedRoutes: string[] | undefined

  console.log('[DashboardLayout] user.allowedRoutes type:', typeof user.allowedRoutes, 'isArray:', Array.isArray(user.allowedRoutes), 'value:', JSON.stringify(user.allowedRoutes))
  console.log('[DashboardLayout] roleAllowedRoutes type:', typeof roleAllowedRoutes, 'isArray:', Array.isArray(roleAllowedRoutes), 'value:', JSON.stringify(roleAllowedRoutes))

  // Vérifier routes individuelles (tableau non vide = configuration explicite)
  if (Array.isArray(user.allowedRoutes) && user.allowedRoutes.length > 0) {
    finalAllowedRoutes = user.allowedRoutes
    console.log('[DashboardLayout] ✓ Using user-specific routes:', finalAllowedRoutes)
  }
  // Sinon vérifier routes par rôle (tableau existe = configuration, même vide = aucun accès)
  else if (Array.isArray(roleAllowedRoutes)) {
    finalAllowedRoutes = roleAllowedRoutes
    console.log('[DashboardLayout] ✓ Using role-based routes:', finalAllowedRoutes)
  }
  // Sinon pas de restriction
  else {
    finalAllowedRoutes = undefined
    console.log('[DashboardLayout] ✓ No route restrictions (null/undefined)')
  }

  console.log('[DashboardLayout] Final allowedRoutes:', JSON.stringify(finalAllowedRoutes))

  // Transformer en AuthUser pour le contexte
  const authUser: AuthUser = {
    userId: user.userId,
    authId: user.authId,
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
    role: user.role,
    etablissementId: user.etablissementId,
    etablissementNom: user.etablissementNom,
    allowedRoutes: finalAllowedRoutes,
  }

  return (
    <DashboardProviders user={authUser} permissions={permissions}>
      {children}
    </DashboardProviders>
  )
}
