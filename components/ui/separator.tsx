/**
 * Composant Separator basé sur Radix UI Themes
 * Pour les séparateurs horizontaux et verticaux
 */

import { Separator as RadixSeparator } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef } from "react";

export const Separator = RadixSeparator;
export type SeparatorProps = ComponentPropsWithoutRef<typeof RadixSeparator>;

/**
 * Example usage:
 *
 * <Separator size="4" />
 * <Separator orientation="vertical" />
 */
