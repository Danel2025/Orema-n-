/**
 * Hook pour détecter si le composant est monté (côté client)
 * Utile pour éviter les erreurs d'hydratation avec les composants
 * qui génèrent des IDs aléatoires (ex: Radix UI Popover, DropdownMenu)
 */

import { useEffect, useState } from "react";

/**
 * Retourne `true` uniquement après l'hydratation côté client.
 * Utile pour les composants qui ne doivent pas être rendus en SSR.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

/**
 * Composant wrapper pour le rendu client-only.
 * Les enfants ne sont rendus qu'après l'hydratation.
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const mounted = useMounted();

  if (!mounted) {
    return fallback;
  }

  return <>{children}</>;
}
