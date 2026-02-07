/**
 * Composant Box basé sur Radix UI Themes
 * Container de base avec padding, margin, etc.
 */

import { Box as RadixBox } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef } from "react";

export const Box = RadixBox;
export type BoxProps = ComponentPropsWithoutRef<typeof RadixBox>;

/**
 * Example usage:
 *
 * <Box p="4" style={{ backgroundColor: 'var(--gray-2)' }}>
 *   Content
 * </Box>
 */
