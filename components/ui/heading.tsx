/**
 * Composant Heading basé sur Radix UI Themes
 * Pour les titres et en-têtes
 */

import { Heading as RadixHeading } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef } from "react";

export const Heading = RadixHeading;
export type HeadingProps = ComponentPropsWithoutRef<typeof RadixHeading>;

/**
 * Example usage:
 *
 * <Heading as="h1" size="8">Tableau de bord</Heading>
 * <Heading as="h2" size="6" weight="medium">Statistiques</Heading>
 * <Heading as="h3" size="4">Ventes du jour</Heading>
 */
