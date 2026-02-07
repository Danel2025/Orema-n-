/**
 * Tests unitaires pour schemas/auth.ts
 *
 * Teste les schemas de validation Zod pour l'authentification
 */

import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  pinLoginSchema,
  createUserSchema,
  updatePasswordSchema,
  updatePinSchema,
} from '@/schemas/auth'

// ============================================================================
// Tests du schema loginSchema
// ============================================================================

describe('loginSchema - Connexion email/password', () => {
  it('valide des donnees correctes', () => {
    const result = loginSchema.safeParse({
      email: 'test@orema.ga',
      password: 'password123',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('test@orema.ga')
      expect(result.data.password).toBe('password123')
    }
  })

  it('rejette un email invalide', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email')
      expect(result.error.issues[0].message).toBe('Email invalide')
    }
  })

  it('rejette un mot de passe trop court', () => {
    const result = loginSchema.safeParse({
      email: 'test@orema.ga',
      password: '12345', // < 6 caracteres
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('password')
    }
  })

  it('rejette un email vide', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'password123',
    })

    expect(result.success).toBe(false)
  })

  it('rejette un mot de passe vide', () => {
    const result = loginSchema.safeParse({
      email: 'test@orema.ga',
      password: '',
    })

    expect(result.success).toBe(false)
  })
})

// ============================================================================
// Tests du schema pinLoginSchema
// ============================================================================

describe('pinLoginSchema - Connexion PIN', () => {
  it('valide un PIN a 4 chiffres', () => {
    const result = pinLoginSchema.safeParse({
      email: 'caissier@orema.ga',
      pin: '1234',
    })

    expect(result.success).toBe(true)
  })

  it('valide un PIN a 6 chiffres', () => {
    const result = pinLoginSchema.safeParse({
      email: 'caissier@orema.ga',
      pin: '123456',
    })

    expect(result.success).toBe(true)
  })

  it('rejette un PIN a 3 chiffres', () => {
    const result = pinLoginSchema.safeParse({
      email: 'caissier@orema.ga',
      pin: '123',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('pin')
    }
  })

  it('rejette un PIN a 7 chiffres', () => {
    const result = pinLoginSchema.safeParse({
      email: 'caissier@orema.ga',
      pin: '1234567',
    })

    expect(result.success).toBe(false)
  })

  it('rejette un PIN avec des lettres', () => {
    const result = pinLoginSchema.safeParse({
      email: 'caissier@orema.ga',
      pin: '12ab',
    })

    expect(result.success).toBe(false)
  })

  it('rejette un PIN avec des caracteres speciaux', () => {
    const result = pinLoginSchema.safeParse({
      email: 'caissier@orema.ga',
      pin: '12-34',
    })

    expect(result.success).toBe(false)
  })
})

// ============================================================================
// Tests du schema createUserSchema
// ============================================================================

describe('createUserSchema - Creation utilisateur', () => {
  const validUser = {
    email: 'nouveau@orema.ga',
    password: 'Password1',
    nom: 'Dupont',
    prenom: 'Jean',
    role: 'CAISSIER' as const,
    etablissementId: '00000000-0000-0000-0000-000000000001',
  }

  it('valide un utilisateur complet', () => {
    const result = createUserSchema.safeParse(validUser)
    expect(result.success).toBe(true)
  })

  it('valide tous les roles autorises', () => {
    const roles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CAISSIER', 'SERVEUR'] as const

    for (const role of roles) {
      const result = createUserSchema.safeParse({ ...validUser, role })
      expect(result.success).toBe(true)
    }
  })

  it('rejette un role invalide', () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      role: 'INVALID_ROLE',
    })

    expect(result.success).toBe(false)
  })

  it('valide avec un PIN optionnel', () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      pinCode: '1234',
    })

    expect(result.success).toBe(true)
  })

  it('rejette un mot de passe sans majuscule', () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      password: 'password1', // pas de majuscule
    })

    expect(result.success).toBe(false)
  })

  it('rejette un mot de passe sans minuscule', () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      password: 'PASSWORD1', // pas de minuscule
    })

    expect(result.success).toBe(false)
  })

  it('rejette un mot de passe sans chiffre', () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      password: 'Password', // pas de chiffre
    })

    expect(result.success).toBe(false)
  })

  it('rejette un mot de passe trop court', () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      password: 'Pass1', // < 8 caracteres
    })

    expect(result.success).toBe(false)
  })

  it('rejette un nom trop court', () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      nom: 'D', // < 2 caracteres
    })

    expect(result.success).toBe(false)
  })

  it('rejette un etablissementId invalide (non UUID)', () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      etablissementId: 'not-a-uuid',
    })

    expect(result.success).toBe(false)
  })
})

// ============================================================================
// Tests du schema updatePasswordSchema
// ============================================================================

describe('updatePasswordSchema - Mise a jour mot de passe', () => {
  it('valide une mise a jour correcte', () => {
    const result = updatePasswordSchema.safeParse({
      currentPassword: 'OldPassword1',
      newPassword: 'NewPassword1',
      confirmPassword: 'NewPassword1',
    })

    expect(result.success).toBe(true)
  })

  it('rejette si les mots de passe ne correspondent pas', () => {
    const result = updatePasswordSchema.safeParse({
      currentPassword: 'OldPassword1',
      newPassword: 'NewPassword1',
      confirmPassword: 'DifferentPassword1',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Les mots de passe ne correspondent pas')
      expect(result.error.issues[0].path).toContain('confirmPassword')
    }
  })

  it('rejette un nouveau mot de passe faible', () => {
    const result = updatePasswordSchema.safeParse({
      currentPassword: 'OldPassword1',
      newPassword: 'weak', // trop court, pas de majuscule ni chiffre
      confirmPassword: 'weak',
    })

    expect(result.success).toBe(false)
  })

  it('accepte un mot de passe actuel vide (requis mais pas valide)', () => {
    const result = updatePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'NewPassword1',
      confirmPassword: 'NewPassword1',
    })

    expect(result.success).toBe(false)
  })
})

// ============================================================================
// Tests du schema updatePinSchema
// ============================================================================

describe('updatePinSchema - Mise a jour PIN', () => {
  it('valide une mise a jour correcte', () => {
    const result = updatePinSchema.safeParse({
      currentPin: '1234',
      newPin: '5678',
      confirmPin: '5678',
    })

    expect(result.success).toBe(true)
  })

  it('rejette si les PINs ne correspondent pas', () => {
    const result = updatePinSchema.safeParse({
      currentPin: '1234',
      newPin: '5678',
      confirmPin: '9999',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Les PINs ne correspondent pas')
    }
  })

  it('rejette un PIN invalide', () => {
    const result = updatePinSchema.safeParse({
      currentPin: '1234',
      newPin: '12', // trop court
      confirmPin: '12',
    })

    expect(result.success).toBe(false)
  })

  it('accepte des PINs de longueurs differentes (4-6)', () => {
    const result1 = updatePinSchema.safeParse({
      currentPin: '1234',
      newPin: '123456',
      confirmPin: '123456',
    })

    const result2 = updatePinSchema.safeParse({
      currentPin: '123456',
      newPin: '1234',
      confirmPin: '1234',
    })

    expect(result1.success).toBe(true)
    expect(result2.success).toBe(true)
  })
})
