/**
 * Composant IconButton basé sur Radix UI Themes
 * Boutons avec icônes uniquement, sans texte
 */

import { IconButton as RadixIconButton } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef } from "react";

export const IconButton = RadixIconButton;
export type IconButtonProps = ComponentPropsWithoutRef<typeof RadixIconButton>;

/**
 * Example usage:
 *
 * <IconButton variant="soft">
 *   <MagnifyingGlassIcon />
 * </IconButton>
 *
 * <IconButton variant="ghost">
 *   <TrashIcon />
 * </IconButton>
 */
