/**
 * Utilitaires pour la monnaie FCFA (XAF)
 * Format: Pas de décimales, séparateur d'espaces pour les milliers
 */

/**
 * Formate un montant en FCFA
 * @param amount - Montant en FCFA (nombre entier)
 * @param showSymbol - Afficher le symbole FCFA (défaut: true)
 * @returns Montant formaté (ex: "15 000 FCFA")
 *
 * @example
 * formatCurrency(15000) // "15 000 FCFA"
 * formatCurrency(1500000, false) // "1 500 000"
 */
export function formatCurrency(amount: number, showSymbol: boolean = true): string {
  const formatted = new Intl.NumberFormat("fr-GA", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\s/g, " "); // Espace insécable

  return showSymbol ? `${formatted} FCFA` : formatted;
}

/**
 * Parse une chaîne FCFA en nombre
 * @param value - Chaîne à parser (ex: "15 000 FCFA" ou "15000")
 * @returns Montant en nombre entier
 *
 * @example
 * parseCurrency("15 000 FCFA") // 15000
 * parseCurrency("1500") // 1500
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d]/g, "");
  return parseInt(cleaned, 10) || 0;
}

/**
 * Formate un montant court (pour les graphiques)
 * @param amount - Montant en FCFA
 * @returns Montant formaté court (ex: "15K", "1.5M")
 *
 * @example
 * formatCurrencyShort(15000) // "15K"
 * formatCurrencyShort(1500000) // "1.5M"
 */
export function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}Md`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }
  return amount.toString();
}

/**
 * Calcule la TVA sur un montant HT
 * @param amountHT - Montant hors taxes
 * @param taxRate - Taux de TVA (0.18 par défaut pour le Gabon)
 * @returns { ht, tva, ttc }
 */
export function calculateTax(
  amountHT: number,
  taxRate: number = 0.18
): { ht: number; tva: number; ttc: number } {
  const tva = Math.round(amountHT * taxRate);
  const ttc = amountHT + tva;

  return { ht: amountHT, tva, ttc };
}
