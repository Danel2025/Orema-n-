/**
 * Composant Flex basé sur Radix UI Themes
 * Layout flexbox avec props utiles
 */

import { Flex as RadixFlex } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef } from "react";

export const Flex = RadixFlex;
export type FlexProps = ComponentPropsWithoutRef<typeof RadixFlex>;

/**
 * Example usage:
 *
 * <Flex direction="row" gap="3" align="center">
 *   <Text>Label</Text>
 *   <Badge>New</Badge>
 * </Flex>
 */
