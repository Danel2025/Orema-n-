/**
 * Tests unitaires pour lib/design-system/currency.ts
 *
 * Teste les fonctions de formatage monetaire specifiques au design system
 */

import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  parseCurrency,
  formatCurrencyShort,
  calculateTax,
} from '@/lib/design-system/currency'

// ============================================================================
// Tests de formatCurrency (design-system version)
// ============================================================================

describe('formatCurrency (design-system)', () => {
  it('formate avec le symbole FCFA par defaut', () => {
    expect(formatCurrency(15000)).toBe('15 000 FCFA')
  })

  it('formate sans symbole si demande', () => {
    expect(formatCurrency(15000, false)).toMatch(/15.000|15 000/)
  })

  it('formate zero correctement', () => {
    expect(formatCurrency(0)).toBe('0 FCFA')
  })

  it('formate les grands montants', () => {
    const result = formatCurrency(1500000)
    expect(result).toContain('FCFA')
    expect(result).toContain('1')
    expect(result).toContain('500')
    expect(result).toContain('000')
  })

  it('formate les montants negatifs', () => {
    const result = formatCurrency(-5000)
    expect(result).toContain('5')
    expect(result).toContain('000')
  })
})

// ============================================================================
// Tests de parseCurrency
// ============================================================================

describe('parseCurrency', () => {
  it('parse une chaine avec symbole FCFA', () => {
    expect(parseCurrency('15 000 FCFA')).toBe(15000)
  })

  it('parse une chaine avec espaces', () => {
    expect(parseCurrency('1 500 000')).toBe(1500000)
  })

  it('parse une chaine sans espaces', () => {
    expect(parseCurrency('15000')).toBe(15000)
  })

  it('retourne 0 pour une chaine vide', () => {
    expect(parseCurrency('')).toBe(0)
  })

  it('retourne 0 pour une chaine non numerique', () => {
    expect(parseCurrency('abc')).toBe(0)
  })

  it('extrait les chiffres dune chaine mixte', () => {
    expect(parseCurrency('Prix: 5000 FCFA')).toBe(5000)
  })
})

// ============================================================================
// Tests de formatCurrencyShort
// ============================================================================

describe('formatCurrencyShort', () => {
  it('formate les petits montants sans suffixe', () => {
    expect(formatCurrencyShort(500)).toBe('500')
  })

  it('formate les milliers avec K', () => {
    expect(formatCurrencyShort(15000)).toBe('15.0K')
  })

  it('formate les millions avec M', () => {
    expect(formatCurrencyShort(1500000)).toBe('1.5M')
  })

  it('formate les milliards avec Md', () => {
    expect(formatCurrencyShort(2500000000)).toBe('2.5Md')
  })

  it('arrondit a une decimale', () => {
    expect(formatCurrencyShort(15750)).toBe('15.8K')
    expect(formatCurrencyShort(15250)).toBe('15.3K')
  })

  it('gere les valeurs limites', () => {
    expect(formatCurrencyShort(999)).toBe('999')
    expect(formatCurrencyShort(1000)).toBe('1.0K')
    expect(formatCurrencyShort(999999)).toBe('1000.0K')
    expect(formatCurrencyShort(1000000)).toBe('1.0M')
  })
})

// ============================================================================
// Tests de calculateTax (TVA Gabon)
// ============================================================================

describe('calculateTax', () => {
  it('calcule avec le taux par defaut (18% Gabon)', () => {
    const result = calculateTax(10000)

    expect(result.ht).toBe(10000)
    expect(result.tva).toBe(1800)
    expect(result.ttc).toBe(11800)
  })

  it('calcule avec un taux personnalise', () => {
    const result = calculateTax(10000, 0.10) // 10%

    expect(result.ht).toBe(10000)
    expect(result.tva).toBe(1000)
    expect(result.ttc).toBe(11000)
  })

  it('gere le taux zero (exonere)', () => {
    const result = calculateTax(10000, 0)

    expect(result.ht).toBe(10000)
    expect(result.tva).toBe(0)
    expect(result.ttc).toBe(10000)
  })

  it('arrondit la TVA au FCFA (entier)', () => {
    const result = calculateTax(123, 0.18)

    // 123 * 0.18 = 22.14 -> arrondi a 22
    expect(result.tva).toBe(22)
    expect(result.ttc).toBe(145)
  })

  it('gere un montant HT de zero', () => {
    const result = calculateTax(0)

    expect(result.ht).toBe(0)
    expect(result.tva).toBe(0)
    expect(result.ttc).toBe(0)
  })

  it('verifie la coherence HT + TVA = TTC', () => {
    const testAmounts = [100, 1234, 5678, 10000, 99999]
    const testRates = [0, 0.10, 0.18]

    for (const amount of testAmounts) {
      for (const rate of testRates) {
        const result = calculateTax(amount, rate)
        expect(result.ht + result.tva).toBe(result.ttc)
      }
    }
  })
})
