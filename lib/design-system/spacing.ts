/**
 * Utilitaires pour l'espacement
 * Basé sur le système d'espacement de Radix UI
 */

/**
 * Échelle d'espacement Radix UI
 * 1 = 4px, 2 = 8px, 3 = 12px, etc.
 */
export const spacing = {
  "1": "var(--space-1)", // 4px
  "2": "var(--space-2)", // 8px
  "3": "var(--space-3)", // 12px
  "4": "var(--space-4)", // 16px
  "5": "var(--space-5)", // 20px
  "6": "var(--space-6)", // 24px
  "7": "var(--space-7)", // 28px
  "8": "var(--space-8)", // 32px
  "9": "var(--space-9)", // 36px
} as const;

/**
 * Tailles de composants
 */
export const sizes = {
  "1": "var(--space-5)", // 20px
  "2": "var(--space-6)", // 24px
  "3": "var(--space-7)", // 28px
  "4": "var(--space-8)", // 32px
} as const;

/**
 * Touch targets (minimum pour tactile)
 */
export const touchTarget = {
  min: 44, // pixels
  recommended: 48, // pixels
} as const;
