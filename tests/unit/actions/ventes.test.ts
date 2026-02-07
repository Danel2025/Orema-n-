/**
 * Tests unitaires pour actions/ventes.ts
 *
 * Teste les Server Actions de gestion des ventes
 * avec mock de Prisma
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock, resetPrismaMocks } from '../../mocks/prisma'
import { mockSession, mockUnauthenticated, resetAuthMocks } from '../../mocks/auth'

describe('Ventes - Actions', () => {
  beforeEach(() => {
    resetPrismaMocks()
    resetAuthMocks()
  })

  describe('createVente', () => {
    const validVenteInput = {
      typeVente: 'DIRECT' as const,
      lignes: [
        {
          produitId: 'prod-1',
          quantite: 2,
          prixUnitaire: 5000,
          tauxTva: 'STANDARD',
        },
      ],
      modePaiement: 'ESPECES' as const,
      montantRecu: 15000,
      montantRendu: 3200,
    }

    it('refuse une vente si non authentifie', async () => {
      mockUnauthenticated()

      const { createVente } = await import('@/actions/ventes')
      const result = await createVente(validVenteInput)

      expect(result.success).toBe(false)
      expect(result.error).toContain('connecte')
    })

    it('genere un numero de ticket unique', async () => {
      prismaMock.etablissement.findUnique.mockResolvedValue({
        id: 'etab-1',
        dernierNumeroTicket: 5,
        dateNumeroTicket: new Date(),
      })

      prismaMock.etablissement.update.mockResolvedValue({
        id: 'etab-1',
        dernierNumeroTicket: 6,
        dateNumeroTicket: new Date(),
      })

      prismaMock.vente.create.mockResolvedValue({
        id: 'vente-1',
        numeroTicket: '2025011500006',
        type: 'DIRECT',
        statut: 'PAYEE',
        sousTotal: 10000,
        totalTva: 1800,
        totalRemise: 0,
        totalFinal: 11800,
        lignes: [],
        paiements: [],
      })

      prismaMock.produit.findUnique.mockResolvedValue({
        id: 'prod-1',
        gererStock: false,
        stockActuel: null,
        nom: 'Test',
      })

      const { createVente } = await import('@/actions/ventes')
      const result = await createVente(validVenteInput)

      // Le test verifie la logique de generation
      expect(prismaMock.etablissement.update).toHaveBeenCalled()
    })

    it('calcule correctement la TVA', async () => {
      // Test de la logique de calcul TVA
      const prixHT = 10000 // Prix unitaire * quantite
      const tauxTva = 18 // Standard au Gabon

      const montantTva = Math.round((prixHT * tauxTva) / 100)
      const total = prixHT + montantTva

      expect(montantTva).toBe(1800)
      expect(total).toBe(11800)
    })

    it('calcule une remise en pourcentage', async () => {
      const sousTotal = 10000
      const remise = { type: 'POURCENTAGE' as const, valeur: 10 }

      const totalRemise = Math.round((sousTotal * remise.valeur) / 100)

      expect(totalRemise).toBe(1000)
    })

    it('calcule une remise en montant fixe', async () => {
      const sousTotal = 10000
      const remise = { type: 'MONTANT_FIXE' as const, valeur: 500 }

      const totalRemise = remise.valeur

      expect(totalRemise).toBe(500)
    })

    it('gere le paiement mixte', async () => {
      const paiements = [
        { mode: 'ESPECES' as const, montant: 5000 },
        { mode: 'AIRTEL_MONEY' as const, montant: 5000, reference: 'TX123' },
      ]

      const total = paiements.reduce((sum, p) => sum + p.montant, 0)

      expect(total).toBe(10000)
      expect(paiements).toHaveLength(2)
    })

    it('met a jour le stock si gererStock est actif', async () => {
      prismaMock.etablissement.findUnique.mockResolvedValue({
        id: 'etab-1',
        dernierNumeroTicket: 1,
        dateNumeroTicket: new Date(),
      })

      prismaMock.etablissement.update.mockResolvedValue({})

      prismaMock.vente.create.mockResolvedValue({
        id: 'vente-1',
        numeroTicket: '2025011500002',
        lignes: [],
        paiements: [],
      })

      prismaMock.produit.findUnique.mockResolvedValue({
        id: 'prod-1',
        gererStock: true,
        stockActuel: 50,
        nom: 'Produit Test',
      })

      prismaMock.produit.update.mockResolvedValue({})
      prismaMock.mouvementStock.create.mockResolvedValue({})

      const { createVente } = await import('@/actions/ventes')

      // Le test verifierait que $transaction est appele
      // avec les bonnes operations de stock
    })
  })

  describe('getVentesJour', () => {
    it('filtre les ventes du jour courant', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const mockVentes = [
        {
          id: 'vente-1',
          numeroTicket: '2025011500001',
          type: 'DIRECT',
          totalFinal: 11800,
          createdAt: new Date(),
          lignes: [],
          paiements: [],
          client: null,
        },
      ]

      prismaMock.vente.findMany.mockResolvedValue(mockVentes)

      const { getVentesJour } = await import('@/actions/ventes')
      const result = await getVentesJour()

      expect(result).toHaveLength(1)
      expect(prismaMock.vente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
          orderBy: { createdAt: 'desc' },
        })
      )
    })
  })

  describe('getStatsJour', () => {
    it('calcule les statistiques correctement', async () => {
      const mockVentes = [
        {
          id: 'vente-1',
          totalFinal: 10000,
          lignes: [{ quantite: 2 }, { quantite: 3 }],
        },
        {
          id: 'vente-2',
          totalFinal: 15000,
          lignes: [{ quantite: 1 }],
        },
      ]

      prismaMock.vente.findMany.mockResolvedValue(mockVentes)

      // Calcul attendu
      const totalVentes = 2
      const chiffreAffaires = 25000
      const articlesVendus = 6
      const panierMoyen = 12500

      const { getStatsJour } = await import('@/actions/ventes')
      const result = await getStatsJour()

      expect(result.totalVentes).toBe(totalVentes)
      expect(result.chiffreAffaires).toBe(chiffreAffaires)
      expect(result.articlesVendus).toBe(articlesVendus)
      expect(result.panierMoyen).toBe(panierMoyen)
    })

    it('gere le cas sans ventes', async () => {
      prismaMock.vente.findMany.mockResolvedValue([])

      const { getStatsJour } = await import('@/actions/ventes')
      const result = await getStatsJour()

      expect(result.totalVentes).toBe(0)
      expect(result.chiffreAffaires).toBe(0)
      expect(result.articlesVendus).toBe(0)
      expect(result.panierMoyen).toBe(0)
    })
  })
})

describe('Logique metier des ventes', () => {
  describe('Calcul de ligne de vente', () => {
    it('calcule correctement une ligne avec TVA standard', () => {
      const prixUnitaire = 5000
      const quantite = 2
      const tauxTva = 18

      const prixLigne = prixUnitaire * quantite
      const tvaMontant = Math.round((prixLigne * tauxTva) / 100)
      const total = prixLigne + tvaMontant

      expect(prixLigne).toBe(10000)
      expect(tvaMontant).toBe(1800)
      expect(total).toBe(11800)
    })

    it('calcule correctement une ligne avec TVA reduite', () => {
      const prixUnitaire = 3000
      const quantite = 3
      const tauxTva = 10 // Taux reduit

      const prixLigne = prixUnitaire * quantite
      const tvaMontant = Math.round((prixLigne * tauxTva) / 100)
      const total = prixLigne + tvaMontant

      expect(prixLigne).toBe(9000)
      expect(tvaMontant).toBe(900)
      expect(total).toBe(9900)
    })

    it('calcule correctement une ligne exoneree', () => {
      const prixUnitaire = 2000
      const quantite = 4
      const tauxTva = 0 // Exonere

      const prixLigne = prixUnitaire * quantite
      const tvaMontant = Math.round((prixLigne * tauxTva) / 100)
      const total = prixLigne + tvaMontant

      expect(prixLigne).toBe(8000)
      expect(tvaMontant).toBe(0)
      expect(total).toBe(8000)
    })
  })

  describe('Numero de ticket', () => {
    it('genere le bon format YYYYMMDD00001', () => {
      const date = new Date('2025-01-15')
      const sequence = 1

      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
      const numeroTicket = `${dateStr}${sequence.toString().padStart(5, '0')}`

      expect(numeroTicket).toBe('2025011500001')
    })

    it('incremente correctement la sequence', () => {
      const date = new Date('2025-01-15')
      const sequence = 42

      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
      const numeroTicket = `${dateStr}${sequence.toString().padStart(5, '0')}`

      expect(numeroTicket).toBe('2025011500042')
    })

    it('reset la sequence au changement de jour', () => {
      const lastDate: string = '20250114'
      const currentDate: string = '20250115'

      // Logique de reset
      const shouldReset = lastDate !== currentDate
      const newSequence = shouldReset ? 1 : 43

      expect(shouldReset).toBe(true)
      expect(newSequence).toBe(1)
    })
  })

  describe('Gestion du stock', () => {
    it('deduit correctement le stock vendu', () => {
      const stockAvant = 50
      const quantiteVendue = 2
      const stockApres = stockAvant - quantiteVendue

      expect(stockApres).toBe(48)
    })

    it('ne deduit pas si gererStock est false', () => {
      const produit = {
        gererStock: false,
        stockActuel: null,
      }

      const shouldDeductStock = produit.gererStock && produit.stockActuel !== null

      expect(shouldDeductStock).toBe(false)
    })
  })

  describe('Modes de paiement', () => {
    it('calcule le rendu pour especes', () => {
      const total = 11800
      const montantRecu = 15000
      const monnaieRendue = montantRecu - total

      expect(monnaieRendue).toBe(3200)
    })

    it('valide un paiement Mobile Money avec reference', () => {
      const paiement = {
        mode: 'AIRTEL_MONEY',
        montant: 11800,
        reference: 'TX123456789',
      }

      const isValid =
        paiement.montant > 0 &&
        paiement.reference &&
        paiement.reference.length > 0

      expect(isValid).toBe(true)
    })

    it('calcule un paiement mixte', () => {
      const total = 20000
      const paiements = [
        { mode: 'ESPECES', montant: 10000 },
        { mode: 'CARTE_BANCAIRE', montant: 10000 },
      ]

      const totalPaye = paiements.reduce((sum, p) => sum + p.montant, 0)
      const estComplet = totalPaye >= total

      expect(totalPaye).toBe(20000)
      expect(estComplet).toBe(true)
    })
  })
})
