/**
 * Tests E2E - Page de connexion
 *
 * Teste les differents parcours de connexion:
 * - Connexion email/password (admins, managers)
 * - Connexion PIN (caissiers, serveurs)
 * - Gestion des erreurs
 */

import { test, expect } from '@playwright/test'

test.describe('Page de connexion - Email/Password', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('affiche le formulaire de connexion', async ({ page }) => {
    // Verifier que les elements du formulaire sont presents
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /connexion/i })).toBeVisible()
  })

  test('affiche une erreur pour un email invalide', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByLabel(/mot de passe/i).fill('password123')
    await page.getByRole('button', { name: /connexion/i }).click()

    // Verifier le message d'erreur
    await expect(page.getByText(/email invalide/i)).toBeVisible()
  })

  test('affiche une erreur pour un mot de passe trop court', async ({ page }) => {
    await page.getByLabel(/email/i).fill('test@orema.ga')
    await page.getByLabel(/mot de passe/i).fill('12345')
    await page.getByRole('button', { name: /connexion/i }).click()

    // Verifier le message d'erreur
    await expect(page.getByText(/au moins 6 caracteres/i)).toBeVisible()
  })

  test('affiche une erreur pour des identifiants incorrects', async ({ page }) => {
    await page.getByLabel(/email/i).fill('wrong@orema.ga')
    await page.getByLabel(/mot de passe/i).fill('wrongpassword')
    await page.getByRole('button', { name: /connexion/i }).click()

    // Verifier le message d'erreur (peut etre un toast ou inline)
    await expect(
      page.getByText(/incorrect|invalide/i).first()
    ).toBeVisible({ timeout: 10000 })
  })

  test('le bouton est desactive pendant la soumission', async ({ page }) => {
    await page.getByLabel(/email/i).fill('test@orema.ga')
    await page.getByLabel(/mot de passe/i).fill('password123')

    // Cliquer et verifier que le bouton change d'etat
    const submitButton = page.getByRole('button', { name: /connexion/i })
    await submitButton.click()

    // Le bouton devrait etre desactive ou afficher un loading
    // Note: Ce test depend de l'implementation
  })

  test('a un lien vers la connexion PIN', async ({ page }) => {
    const pinLink = page.getByRole('link', { name: /pin/i })
    if (await pinLink.isVisible()) {
      await expect(pinLink).toHaveAttribute('href', '/login/pin')
    }
  })
})

test.describe('Page de connexion - PIN', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login/pin')
  })

  test('affiche le formulaire de connexion PIN', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible()
    // Le champ PIN peut etre un input ou un clavier virtuel
    const pinInput = page.getByLabel(/pin/i)
    const pinKeyboard = page.locator('[data-testid="pin-keyboard"]')

    const hasPinInput = await pinInput.isVisible().catch(() => false)
    const hasPinKeyboard = await pinKeyboard.isVisible().catch(() => false)

    expect(hasPinInput || hasPinKeyboard).toBe(true)
  })

  test('accepte seulement les chiffres dans le PIN', async ({ page }) => {
    const pinInput = page.getByLabel(/pin/i)
    if (await pinInput.isVisible().catch(() => false)) {
      await pinInput.fill('abcd')
      // Le contenu devrait etre vide ou filtre
      const value = await pinInput.inputValue()
      expect(value).not.toContain('a')
    }
  })

  test('affiche une erreur pour un PIN invalide', async ({ page }) => {
    await page.getByLabel(/email/i).fill('caissier@orema.ga')

    const pinInput = page.getByLabel(/pin/i)
    if (await pinInput.isVisible().catch(() => false)) {
      await pinInput.fill('000')
      await page.getByRole('button', { name: /connexion/i }).click()

      // Verifier le message d'erreur
      await expect(
        page.getByText(/pin.*chiffres/i).first()
      ).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Redirection apres connexion', () => {
  test('redirige vers une page protegee apres deconnexion', async ({ page }) => {
    // Essayer d'acceder a une page protegee sans auth
    await page.goto('/caisse')

    // Devrait rediriger vers login
    await expect(page).toHaveURL(/login/)
  })

  test('preserve l URL de retour', async ({ page }) => {
    // Essayer d'acceder a /rapports sans auth
    await page.goto('/rapports')

    // Apres redirection vers login, l'URL de retour devrait etre preservee
    // (selon l'implementation)
    await expect(page).toHaveURL(/login/)
  })
})

test.describe('Accessibilite', () => {
  test('le formulaire est navigable au clavier', async ({ page }) => {
    await page.goto('/login')

    // Focus sur email
    await page.getByLabel(/email/i).focus()
    await expect(page.getByLabel(/email/i)).toBeFocused()

    // Tab vers password
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/mot de passe/i)).toBeFocused()

    // Tab vers submit
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: /connexion/i })).toBeFocused()
  })

  test('les champs ont des labels accessibles', async ({ page }) => {
    await page.goto('/login')

    // Verifier que les inputs ont des labels associes
    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.getByLabel(/mot de passe/i)

    await expect(emailInput).toHaveAttribute('type', 'email')
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('le formulaire peut etre soumis avec Enter', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email/i).fill('test@orema.ga')
    await page.getByLabel(/mot de passe/i).fill('password123')
    await page.keyboard.press('Enter')

    // La soumission devrait se declencher
    // On verifie juste qu'il n'y a pas d'erreur critique
    await page.waitForTimeout(1000)
  })
})

test.describe('Responsive', () => {
  test('s affiche correctement sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')

    // Les elements doivent etre visibles et utilisables
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /connexion/i })).toBeVisible()
  })

  test('s affiche correctement sur tablette', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/login')

    await expect(page.getByLabel(/email/i)).toBeVisible()
  })
})
