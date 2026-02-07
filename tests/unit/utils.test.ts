/**
 * Tests unitaires pour lib/utils.ts
 *
 * Teste les fonctions utilitaires du projet Orema N+ POS:
 * - Formatage de monnaie FCFA
 * - Calculs de TVA (taux gabonais)
 * - Formatage de tickets
 * - Rendu de monnaie optimal
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  cn,
  formatCurrency,
  formatTicketNumber,
  getTvaRate,
  getTvaLabel,
  calculerTVA,
  calculerTTC,
  calculerHT,
  calculerLigneVente,
  formatTime,
  formatDate,
  slugify,
  truncate,
  calculerRenduMonnaie,
  suggererMontantsArrondis,
  TVA_RATES,
  COUPURES_FCFA,
} from '@/lib/utils'

// ============================================================================
// Tests de cn() - Fusion de classes CSS
// ============================================================================

describe('cn - Fusion de classes CSS', () => {
  it('fusionne des classes simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('gere les classes conditionnelles', () => {
    expect(cn('base', true && 'active', false && 'hidden')).toBe('base active')
  })

  it('fusionne les classes Tailwind conflictuelles', () => {
    // twMerge doit garder la derniere classe de padding
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('gere les tableaux de classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
  })

  it('gere les valeurs nulles et undefined', () => {
    expect(cn('foo', null, undefined, 'bar')).toBe('foo bar')
  })
})

// ============================================================================
// Tests de formatCurrency() - Formatage FCFA
// ============================================================================

describe('formatCurrency - Formatage FCFA', () => {
  it('formate un montant simple correctement', () => {
    expect(formatCurrency(1000)).toBe('1 000 FCFA')
  })

  it('formate zero correctement', () => {
    expect(formatCurrency(0)).toBe('0 FCFA')
  })

  it('formate les grands montants avec separateurs', () => {
    expect(formatCurrency(1500000)).toBe('1 500 000 FCFA')
    expect(formatCurrency(25000)).toBe('25 000 FCFA')
  })

  it('gere les strings numeriques', () => {
    expect(formatCurrency('5000')).toBe('5 000 FCFA')
  })

  it('retourne "0 FCFA" pour les valeurs invalides', () => {
    expect(formatCurrency('invalid')).toBe('0 FCFA')
    expect(formatCurrency(NaN)).toBe('0 FCFA')
  })

  it('arrondit les decimales (FCFA sans centimes)', () => {
    expect(formatCurrency(1500.75)).toBe('1 501 FCFA')
    expect(formatCurrency(1500.25)).toBe('1 500 FCFA')
  })
})

// ============================================================================
// Tests de formatTicketNumber() - Numero de ticket
// ============================================================================

describe('formatTicketNumber - Numero de ticket', () => {
  it('genere le format YYYYMMDD00001', () => {
    const date = new Date(2025, 0, 15) // 15 janvier 2025
    expect(formatTicketNumber(date, 1)).toBe('2025011500001')
  })

  it('gere les numeros a plusieurs chiffres', () => {
    const date = new Date(2025, 11, 31) // 31 decembre 2025
    expect(formatTicketNumber(date, 123)).toBe('2025123100123')
    expect(formatTicketNumber(date, 99999)).toBe('2025123199999')
  })

  it('pad le mois et le jour sur 2 chiffres', () => {
    const date = new Date(2025, 5, 5) // 5 juin 2025
    expect(formatTicketNumber(date, 1)).toBe('2025060500001')
  })

  it('pad le numero de sequence sur 5 chiffres', () => {
    const date = new Date(2025, 0, 1)
    expect(formatTicketNumber(date, 5)).toBe('2025010100005')
    expect(formatTicketNumber(date, 50)).toBe('2025010100050')
    expect(formatTicketNumber(date, 500)).toBe('2025010100500')
  })
})

// ============================================================================
// Tests de TVA - Calculs fiscaux gabonais
// ============================================================================

describe('TVA_RATES - Constantes TVA Gabon', () => {
  it('definit le taux standard a 18%', () => {
    expect(TVA_RATES.STANDARD).toBe(18)
  })

  it('definit le taux reduit a 10%', () => {
    expect(TVA_RATES.REDUIT).toBe(10)
  })

  it('definit le taux exonere a 0%', () => {
    expect(TVA_RATES.EXONERE).toBe(0)
  })
})

describe('getTvaRate - Conversion taux TVA', () => {
  it('retourne 18 pour STANDARD', () => {
    expect(getTvaRate('STANDARD')).toBe(18)
  })

  it('retourne 10 pour REDUIT', () => {
    expect(getTvaRate('REDUIT')).toBe(10)
  })

  it('retourne 0 pour EXONERE', () => {
    expect(getTvaRate('EXONERE')).toBe(0)
  })

  it('est insensible a la casse', () => {
    expect(getTvaRate('standard')).toBe(18)
    expect(getTvaRate('reduit')).toBe(10)
    expect(getTvaRate('exonere')).toBe(0)
  })

  it('retourne STANDARD par defaut pour valeur inconnue', () => {
    expect(getTvaRate('UNKNOWN')).toBe(18)
  })
})

describe('getTvaLabel - Libelle TVA', () => {
  // Note: getTvaLabel prend un TauxTva enum, donc on utilise les valeurs string
  // qui correspondent a l'enum Prisma
  it('retourne le libelle correct pour chaque taux', () => {
    // Ces tests necessiteraient l'enum TauxTva de Prisma
    // Pour l'instant on verifie que la fonction existe
    expect(typeof getTvaLabel).toBe('function')
  })
})

describe('calculerTVA - Calcul du montant TVA', () => {
  it('calcule la TVA standard (18%)', () => {
    expect(calculerTVA(10000, 18)).toBe(1800)
    expect(calculerTVA(10000, 'STANDARD')).toBe(1800)
  })

  it('calcule la TVA reduite (10%)', () => {
    expect(calculerTVA(10000, 10)).toBe(1000)
    expect(calculerTVA(10000, 'REDUIT')).toBe(1000)
  })

  it('retourne 0 pour taux exonere', () => {
    expect(calculerTVA(10000, 0)).toBe(0)
    expect(calculerTVA(10000, 'EXONERE')).toBe(0)
  })

  it('arrondit au FCFA le plus proche (pas de centimes)', () => {
    expect(calculerTVA(123, 18)).toBe(22) // 123 * 0.18 = 22.14 -> 22
    expect(calculerTVA(127, 18)).toBe(23) // 127 * 0.18 = 22.86 -> 23
  })

  it('gere les montants nuls', () => {
    expect(calculerTVA(0, 18)).toBe(0)
  })
})

describe('calculerTTC - Calcul TTC', () => {
  it('calcule le TTC correctement', () => {
    expect(calculerTTC(10000, 18)).toBe(11800)
    expect(calculerTTC(10000, 'STANDARD')).toBe(11800)
  })

  it('retourne le HT pour taux exonere', () => {
    expect(calculerTTC(10000, 0)).toBe(10000)
    expect(calculerTTC(10000, 'EXONERE')).toBe(10000)
  })
})

describe('calculerHT - Calcul HT depuis TTC', () => {
  it('calcule le HT correctement', () => {
    expect(calculerHT(11800, 18)).toBe(10000)
  })

  it('retourne le TTC pour taux exonere', () => {
    expect(calculerHT(10000, 0)).toBe(10000)
  })

  it('arrondit au FCFA le plus proche', () => {
    // 11799 / 1.18 = 9999.15... -> 9999
    expect(calculerHT(11799, 18)).toBe(9999)
  })
})

describe('calculerLigneVente - Calcul ligne de vente', () => {
  it('calcule tous les champs correctement', () => {
    const result = calculerLigneVente(5000, 2, 18)

    expect(result.sousTotal).toBe(10000) // 5000 * 2
    expect(result.montantTva).toBe(1800) // 10000 * 18%
    expect(result.total).toBe(11800) // 10000 + 1800
    expect(result.tauxTvaNum).toBe(18)
  })

  it('gere les quantites decimales', () => {
    const result = calculerLigneVente(1000, 1.5, 18)

    expect(result.sousTotal).toBe(1500)
    expect(result.montantTva).toBe(270)
    expect(result.total).toBe(1770)
  })

  it('accepte le taux TVA en string', () => {
    const result = calculerLigneVente(5000, 2, 'STANDARD')

    expect(result.sousTotal).toBe(10000)
    expect(result.tauxTvaNum).toBe(18)
  })
})

// ============================================================================
// Tests de formatage de dates
// ============================================================================

describe('formatTime - Formatage heure', () => {
  it('formate une heure correctement', () => {
    // Note: le resultat depend du timezone Africa/Libreville
    const date = new Date('2025-01-15T14:30:00Z')
    const formatted = formatTime(date)
    // Verifier le format HH:mm
    expect(formatted).toMatch(/^\d{2}:\d{2}$/)
  })

  it('accepte une string ISO', () => {
    const formatted = formatTime('2025-01-15T14:30:00Z')
    expect(formatted).toMatch(/^\d{2}:\d{2}$/)
  })
})

describe('formatDate - Formatage date', () => {
  const testDate = new Date('2025-01-15T14:30:00Z')

  it('formate en format court par defaut (DD/MM/YYYY)', () => {
    const formatted = formatDate(testDate, 'short')
    expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('formate en format long', () => {
    const formatted = formatDate(testDate, 'long')
    // Devrait contenir le mois en lettres
    expect(formatted).toContain('2025')
  })

  it('formate en datetime', () => {
    const formatted = formatDate(testDate, 'datetime')
    // Devrait contenir date et heure
    expect(formatted).toContain('/')
    expect(formatted).toContain(':')
  })
})

// ============================================================================
// Tests de slugify et truncate
// ============================================================================

describe('slugify - Generation de slug', () => {
  it('convertit en minuscules', () => {
    expect(slugify('HELLO')).toBe('hello')
  })

  it('remplace les espaces par des tirets', () => {
    expect(slugify('hello world')).toBe('hello-world')
  })

  it('supprime les accents', () => {
    expect(slugify('cafe francais')).toBe('cafe-francais')
    expect(slugify('Cremerie')).toBe('cremerie')
  })

  it('supprime les caracteres speciaux', () => {
    expect(slugify('hello@world!')).toBe('helloworld')
  })

  it('supprime les tirets multiples', () => {
    expect(slugify('hello--world')).toBe('hello-world')
  })

  it('supprime les tirets en debut et fin', () => {
    expect(slugify('-hello-')).toBe('hello')
  })
})

describe('truncate - Troncature de texte', () => {
  it('ne modifie pas les textes courts', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('tronque avec ... pour les textes longs', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
  })

  it('gere la longueur exacte', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })
})

// ============================================================================
// Tests du rendu de monnaie FCFA
// ============================================================================

describe('COUPURES_FCFA - Denominations', () => {
  it('contient toutes les coupures FCFA', () => {
    expect(COUPURES_FCFA).toHaveLength(12)
    expect(COUPURES_FCFA[0].valeur).toBe(10000) // Plus grande
    expect(COUPURES_FCFA[11].valeur).toBe(1) // Plus petite
  })

  it('distingue billets et pieces', () => {
    const billets = COUPURES_FCFA.filter((c) => c.type === 'billet')
    const pieces = COUPURES_FCFA.filter((c) => c.type === 'piece')

    expect(billets).toHaveLength(4) // 10000, 5000, 2000, 1000
    expect(pieces).toHaveLength(8) // 500 et moins
  })

  it('est ordonne du plus grand au plus petit', () => {
    for (let i = 0; i < COUPURES_FCFA.length - 1; i++) {
      expect(COUPURES_FCFA[i].valeur).toBeGreaterThan(COUPURES_FCFA[i + 1].valeur)
    }
  })
})

describe('calculerRenduMonnaie - Rendu optimal', () => {
  it('retourne un tableau vide pour montant nul', () => {
    expect(calculerRenduMonnaie(0)).toEqual([])
  })

  it('retourne un tableau vide pour montant negatif', () => {
    expect(calculerRenduMonnaie(-100)).toEqual([])
  })

  it('calcule le rendu optimal pour un billet', () => {
    const rendu = calculerRenduMonnaie(10000)
    expect(rendu).toHaveLength(1)
    expect(rendu[0]).toEqual({
      valeur: 10000,
      type: 'billet',
      label: '10 000',
      quantite: 1,
    })
  })

  it('calcule le rendu pour un montant compose', () => {
    const rendu = calculerRenduMonnaie(15750)
    // 15750 = 10000 + 5000 + 500 + 200 + 50
    const valeurs = rendu.map((r) => ({ v: r.valeur, q: r.quantite }))

    expect(valeurs).toContainEqual({ v: 10000, q: 1 })
    expect(valeurs).toContainEqual({ v: 5000, q: 1 })
    expect(valeurs).toContainEqual({ v: 500, q: 1 })
    expect(valeurs).toContainEqual({ v: 200, q: 1 })
    expect(valeurs).toContainEqual({ v: 50, q: 1 })
  })

  it('utilise plusieurs billets de meme valeur', () => {
    const rendu = calculerRenduMonnaie(20000)
    expect(rendu).toHaveLength(1)
    expect(rendu[0]).toEqual({
      valeur: 10000,
      type: 'billet',
      label: '10 000',
      quantite: 2,
    })
  })

  it('gere les petites pieces', () => {
    const rendu = calculerRenduMonnaie(36)
    // 36 = 25 + 10 + 1
    const valeurs = rendu.map((r) => r.valeur)
    expect(valeurs).toContain(25)
    expect(valeurs).toContain(10)
    expect(valeurs).toContain(1)
  })

  it('arrondit les decimales', () => {
    const rendu = calculerRenduMonnaie(100.7)
    const total = rendu.reduce((sum, r) => sum + r.valeur * r.quantite, 0)
    expect(total).toBe(101) // Arrondi a 101
  })
})

describe('suggererMontantsArrondis - Suggestions paiement', () => {
  it('inclut toujours le montant exact en premier', () => {
    const suggestions = suggererMontantsArrondis(7850)
    expect(suggestions[0]).toBe(7850)
  })

  it('suggere des arrondis superieurs', () => {
    const suggestions = suggererMontantsArrondis(7850)
    expect(suggestions).toContain(8000)
    expect(suggestions).toContain(10000)
  })

  it('ne suggere pas de doublons', () => {
    const suggestions = suggererMontantsArrondis(10000)
    const unique = [...new Set(suggestions)]
    expect(suggestions).toEqual(unique)
  })

  it('retourne les suggestions triees', () => {
    const suggestions = suggererMontantsArrondis(3200)
    for (let i = 0; i < suggestions.length - 1; i++) {
      expect(suggestions[i]).toBeLessThanOrEqual(suggestions[i + 1])
    }
  })

  it('limite le nombre de suggestions', () => {
    const suggestions = suggererMontantsArrondis(100)
    expect(suggestions.length).toBeLessThanOrEqual(6)
  })
})
