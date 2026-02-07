/**
 * Composant Badge basé sur Radix UI Themes
 * Utilisé pour les tags, labels, statuts
 */

import { Badge as RadixBadge } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef } from "react";

export const Badge = RadixBadge;
export type BadgeProps = ComponentPropsWithoutRef<typeof RadixBadge>;

/**
 * Example usage:
 *
 * <Badge variant="solid">Nouveau</Badge>
 * <Badge color="green" variant="soft">Actif</Badge>
 * <Badge color="red" variant="outline">En rupture</Badge>
 */
