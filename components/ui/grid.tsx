/**
 * Composant Grid basé sur Radix UI Themes
 * Layout CSS Grid avec props utiles
 */

import { Grid as RadixGrid } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef } from "react";

export const Grid = RadixGrid;
export type GridProps = ComponentPropsWithoutRef<typeof RadixGrid>;

/**
 * Example usage:
 *
 * <Grid columns="3" gap="4">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </Grid>
 *
 * <Grid columns={{ initial: "1", md: "2", lg: "4" }} gap="4">
 *   Responsive grid
 * </Grid>
 */
