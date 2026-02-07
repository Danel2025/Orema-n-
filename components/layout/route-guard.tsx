'use client'

/**
 * Route Guard
 *
 * Verifie que l'utilisateur a acces a la route actuelle.
 * Redirige vers la premiere page autorisee si non autorise.
 */

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { Flex, Text } from '@radix-ui/themes'
import { Loader2, ShieldAlert } from 'lucide-react'

interface RouteGuardProps {
  children: React.ReactNode
}

export function RouteGuard({ children }: RouteGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAdmin, canAccessRoute, accessibleRoutes } = useAuth()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (!user) {
      setIsChecking(false)
      return
    }

    // Les admins ont acces a tout
    if (isAdmin) {
      setIsAuthorized(true)
      setIsChecking(false)
      return
    }

    // Verifier l'acces a la route actuelle
    const result = canAccessRoute(pathname)

    if (result.allowed) {
      setIsAuthorized(true)
      setIsChecking(false)
      return
    }

    // Non autorise - trouver la premiere page accessible
    console.log('[RouteGuard] Access denied to:', pathname, 'Reason:', result.reason)

    // Trouver la premiere route accessible
    if (accessibleRoutes.length > 0) {
      const firstAccessible = accessibleRoutes[0].path
      console.log('[RouteGuard] Redirecting to first accessible route:', firstAccessible)
      router.replace(firstAccessible)
    } else {
      // Aucune route accessible - afficher un message
      console.log('[RouteGuard] No accessible routes found')
      setIsAuthorized(false)
      setIsChecking(false)
    }
  }, [pathname, user, isAdmin, canAccessRoute, accessibleRoutes, router])

  // Chargement
  if (isChecking) {
    return (
      <Flex
        align="center"
        justify="center"
        style={{ minHeight: '50vh' }}
      >
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-9)' }} />
      </Flex>
    )
  }

  // Non autorise et aucune route accessible
  if (!isAuthorized && !isAdmin) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="4"
        style={{ minHeight: '50vh' }}
      >
        <ShieldAlert size={64} style={{ color: 'var(--red-9)' }} />
        <Text size="5" weight="bold">
          Acces non autorise
        </Text>
        <Text size="2" color="gray" align="center">
          Vous n'avez pas acces a cette page.
          <br />
          Contactez votre administrateur pour obtenir les autorisations necessaires.
        </Text>
      </Flex>
    )
  }

  return <>{children}</>
}
