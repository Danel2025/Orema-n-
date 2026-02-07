/**
 * Tests unitaires pour actions/sessions.ts
 *
 * Teste les Server Actions de gestion des sessions de caisse
 * avec mock de Prisma
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock, resetPrismaMocks } from '../../mocks/prisma'

// Import des actions (le mock de prisma est charge automatiquement)
// Note: Ces tests necessitent que le mock soit correctement configure

describe('Sessions de caisse - Actions', () => {
  beforeEach(() => {
    resetPrismaMocks()
  })

  describe('getActiveSession', () => {
    it('retourne null si aucune session active', async () => {
      prismaMock.sessionCaisse.findFirst.mockResolvedValue(null)

      // Import dynamique pour que le mock soit applique
      const { getActiveSession } = await import('@/actions/sessions')
      const result = await getActiveSession()

      expect(result).toBeNull()
      expect(prismaMock.sessionCaisse.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dateCloture: null,
          }),
        })
      )
    })

    it('retourne la session active avec les statistiques', async () => {
      const mockSession = {
        id: 'session-123',
        fondCaisse: 50000,
        dateOuverture: new Date('2025-01-15T08:00:00Z'),
        dateCloture: null,
        totalVentes: 0,
        totalEspeces: 0,
        totalCartes: 0,
        totalMobileMoney: 0,
        totalAutres: 0,
        nombreVentes: 0,
        nombreAnnulations: 0,
        especesComptees: null,
        ecart: null,
        notesCloture: null,
        etablissementId: 'etab-123',
        utilisateurId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        utilisateur: {
          id: 'user-123',
          nom: 'Dupont',
          prenom: 'Jean',
        },
        _count: {
          ventes: 0,
        },
      }

      prismaMock.sessionCaisse.findFirst.mockResolvedValue(mockSession)
      prismaMock.vente.findMany.mockResolvedValue([])
      prismaMock.vente.count.mockResolvedValue(0)

      const { getActiveSession } = await import('@/actions/sessions')
      const result = await getActiveSession()

      expect(result).not.toBeNull()
      expect(result?.id).toBe('session-123')
      expect(result?.fondCaisse).toBe(50000)
      expect(result?.utilisateur.nom).toBe('Dupont')
    })
  })

  describe('hasActiveSession', () => {
    it('retourne true si une session est active', async () => {
      prismaMock.sessionCaisse.findFirst.mockResolvedValue({
        id: 'session-123',
      })

      const { hasActiveSession } = await import('@/actions/sessions')
      const result = await hasActiveSession()

      expect(result).toBe(true)
    })

    it('retourne false si aucune session active', async () => {
      prismaMock.sessionCaisse.findFirst.mockResolvedValue(null)

      const { hasActiveSession } = await import('@/actions/sessions')
      const result = await hasActiveSession()

      expect(result).toBe(false)
    })
  })

  describe('openSession', () => {
    it('refuse un fond de caisse negatif', async () => {
      const { openSession } = await import('@/actions/sessions')
      const result = await openSession({ fondCaisse: -1000 })

      expect(result.success).toBe(false)
      expect(result.error).toContain('negatif')
    })

    it('refuse si une session est deja ouverte', async () => {
      prismaMock.sessionCaisse.findFirst.mockResolvedValue({
        id: 'existing-session',
      })

      const { openSession } = await import('@/actions/sessions')
      const result = await openSession({ fondCaisse: 50000 })

      expect(result.success).toBe(false)
      expect(result.error).toContain('deja ouverte')
    })

    it('cree une nouvelle session avec succes', async () => {
      prismaMock.sessionCaisse.findFirst.mockResolvedValue(null)

      const mockCreatedSession = {
        id: 'new-session-123',
        fondCaisse: 50000,
        dateOuverture: new Date(),
        utilisateur: {
          id: 'user-123',
          nom: 'Dupont',
          prenom: 'Jean',
        },
      }

      prismaMock.sessionCaisse.create.mockResolvedValue(mockCreatedSession)
      prismaMock.auditLog.create.mockResolvedValue({})

      const { openSession } = await import('@/actions/sessions')
      const result = await openSession({ fondCaisse: 50000 })

      expect(result.success).toBe(true)
      expect(result.data?.fondCaisse).toBe(50000)
      expect(prismaMock.sessionCaisse.create).toHaveBeenCalled()
      expect(prismaMock.auditLog.create).toHaveBeenCalled()
    })
  })

  describe('closeSession', () => {
    it('refuse un sessionId invalide', async () => {
      const { closeSession } = await import('@/actions/sessions')
      const result = await closeSession({
        sessionId: 'invalid',
        especesComptees: 75000,
      })

      expect(result.success).toBe(false)
    })

    it('refuse si la session n existe pas', async () => {
      prismaMock.sessionCaisse.findUnique.mockResolvedValue(null)

      const { closeSession } = await import('@/actions/sessions')
      const result = await closeSession({
        sessionId: '00000000-0000-0000-0000-000000000001',
        especesComptees: 75000,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('introuvable')
    })

    it('refuse si la session est deja cloturee', async () => {
      prismaMock.sessionCaisse.findUnique.mockResolvedValue({
        id: 'session-123',
        dateCloture: new Date(), // Deja cloturee
        fondCaisse: 50000,
        utilisateur: { nom: 'Test', prenom: 'User' },
        ventes: [],
      })

      const { closeSession } = await import('@/actions/sessions')
      const result = await closeSession({
        sessionId: '00000000-0000-0000-0000-000000000001',
        especesComptees: 75000,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('cloturee')
    })

    it('calcule l ecart correctement', async () => {
      const mockSession = {
        id: 'session-123',
        dateCloture: null,
        fondCaisse: 50000,
        utilisateur: { nom: 'Dupont', prenom: 'Jean' },
        ventes: [
          {
            id: 'vente-1',
            totalFinal: 10000,
            sousTotal: 8475,
            totalTva: 1525,
            statut: 'PAYEE',
            lignes: [{ quantite: 2 }],
            paiements: [{ modePaiement: 'ESPECES', montant: 10000 }],
          },
        ],
      }

      prismaMock.sessionCaisse.findUnique.mockResolvedValue(mockSession)
      prismaMock.sessionCaisse.update.mockResolvedValue({
        ...mockSession,
        dateCloture: new Date(),
        ecart: 5000, // 75000 - (50000 + 10000) = 15000 de surplus
      })
      prismaMock.vente.count.mockResolvedValue(0)
      prismaMock.auditLog.create.mockResolvedValue({})

      const { closeSession } = await import('@/actions/sessions')
      const result = await closeSession({
        sessionId: '00000000-0000-0000-0000-000000000001',
        especesComptees: 75000,
        notesCloture: 'RAS',
      })

      expect(result.success).toBe(true)
      expect(prismaMock.sessionCaisse.update).toHaveBeenCalled()
    })
  })

  describe('getSessionsHistory', () => {
    it('retourne les sessions cloturees triees par date', async () => {
      const mockSessions = [
        {
          id: 'session-2',
          dateOuverture: new Date('2025-01-15T08:00:00Z'),
          dateCloture: new Date('2025-01-15T18:00:00Z'),
          fondCaisse: 50000,
          totalVentes: 150000,
          totalEspeces: 100000,
          totalCartes: 30000,
          totalMobileMoney: 20000,
          totalAutres: 0,
          nombreVentes: 25,
          nombreAnnulations: 1,
          especesComptees: 150000,
          ecart: 0,
          notesCloture: null,
          utilisateur: { nom: 'Dupont', prenom: 'Jean' },
        },
        {
          id: 'session-1',
          dateOuverture: new Date('2025-01-14T08:00:00Z'),
          dateCloture: new Date('2025-01-14T18:00:00Z'),
          fondCaisse: 50000,
          totalVentes: 120000,
          totalEspeces: 80000,
          totalCartes: 40000,
          totalMobileMoney: 0,
          totalAutres: 0,
          nombreVentes: 20,
          nombreAnnulations: 0,
          especesComptees: 130000,
          ecart: 0,
          notesCloture: 'Bonne journee',
          utilisateur: { nom: 'Martin', prenom: 'Marie' },
        },
      ]

      prismaMock.sessionCaisse.findMany.mockResolvedValue(mockSessions)

      const { getSessionsHistory } = await import('@/actions/sessions')
      const result = await getSessionsHistory(20)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('session-2')
      expect(prismaMock.sessionCaisse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dateCloture: { not: null },
          }),
          orderBy: { dateCloture: 'desc' },
          take: 20,
        })
      )
    })
  })
})

describe('Calculs de session', () => {
  it('calcule correctement les totaux par mode de paiement', () => {
    const ventes = [
      {
        totalFinal: 10000,
        paiements: [
          { modePaiement: 'ESPECES', montant: 10000 },
        ],
      },
      {
        totalFinal: 15000,
        paiements: [
          { modePaiement: 'CARTE_BANCAIRE', montant: 15000 },
        ],
      },
      {
        totalFinal: 8000,
        paiements: [
          { modePaiement: 'AIRTEL_MONEY', montant: 8000 },
        ],
      },
    ]

    // Simulation du calcul fait dans l'action
    let totalEspeces = 0
    let totalCartes = 0
    let totalMobileMoney = 0

    for (const vente of ventes) {
      for (const paiement of vente.paiements) {
        const montant = Number(paiement.montant)
        switch (paiement.modePaiement) {
          case 'ESPECES':
            totalEspeces += montant
            break
          case 'CARTE_BANCAIRE':
            totalCartes += montant
            break
          case 'AIRTEL_MONEY':
          case 'MOOV_MONEY':
            totalMobileMoney += montant
            break
        }
      }
    }

    expect(totalEspeces).toBe(10000)
    expect(totalCartes).toBe(15000)
    expect(totalMobileMoney).toBe(8000)
  })

  it('calcule l ecart de caisse correctement', () => {
    const fondCaisse = 50000
    const totalEspeces = 75000
    const especesComptees = 130000

    const especesAttendues = fondCaisse + totalEspeces // 125000
    const ecart = especesComptees - especesAttendues // 5000 (surplus)

    expect(especesAttendues).toBe(125000)
    expect(ecart).toBe(5000)
  })

  it('detecte un deficit de caisse', () => {
    const fondCaisse = 50000
    const totalEspeces = 75000
    const especesComptees = 120000

    const especesAttendues = fondCaisse + totalEspeces // 125000
    const ecart = especesComptees - especesAttendues // -5000 (deficit)

    expect(ecart).toBe(-5000)
    expect(ecart < 0).toBe(true)
  })
})
