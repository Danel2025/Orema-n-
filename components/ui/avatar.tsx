/**
 * Composant Avatar basé sur Radix UI Themes
 * Utilisé pour les photos de profil utilisateur
 */

import { Avatar as RadixAvatar } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef } from "react";

export const Avatar = RadixAvatar;
export type AvatarProps = ComponentPropsWithoutRef<typeof RadixAvatar>;

/**
 * Example usage:
 *
 * <Avatar
 *   src="/avatar.jpg"
 *   fallback="JD"
 *   size="3"
 *   radius="full"
 * />
 *
 * <Avatar fallback="AB" />
 */
