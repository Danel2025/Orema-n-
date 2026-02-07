/**
 * Composant Text basé sur Radix UI Themes
 * Pour le texte courant avec variants de taille et poids
 */

import { Text as RadixText } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef } from "react";

export const Text = RadixText;
export type TextProps = ComponentPropsWithoutRef<typeof RadixText>;

/**
 * Example usage:
 *
 * <Text size="2" weight="medium">Prix:</Text>
 * <Text size="5" weight="bold">15 000 FCFA</Text>
 * <Text as="p" size="1" color="gray">Description produit</Text>
 */
