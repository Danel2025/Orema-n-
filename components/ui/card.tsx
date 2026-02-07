/**
 * Composant Card basé sur Radix UI Themes
 * Re-export avec types pour faciliter l'utilisation
 */

import { Card as RadixCard } from "@radix-ui/themes";

export const Card = RadixCard;
export type CardProps = React.ComponentProps<typeof RadixCard>;
