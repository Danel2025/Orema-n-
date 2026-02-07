/**
 * Composant Button basé sur Radix UI Themes
 * Re-export avec types pour faciliter l'utilisation
 */

import { Button as RadixButton } from "@radix-ui/themes";

export const Button = RadixButton;
export type ButtonProps = React.ComponentProps<typeof RadixButton>;
