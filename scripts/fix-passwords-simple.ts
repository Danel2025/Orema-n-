/**
 * Script simple pour mettre à jour les hash de mots de passe
 */

import 'dotenv/config'
import { scrypt, randomBytes } from 'crypto'
import { promisify } from 'util'
import pg from 'pg'

const scryptAsync = promisify(scrypt)
const KEYLEN = 64

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scryptAsync(password, salt, KEYLEN)) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

async function main() {
  console.log('🔄 Connexion à la base de données...\n')

  // Créer une connexion PostgreSQL directe
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('✅ Connecté à PostgreSQL\n')

    // Définir les mots de passe à hasher
    const users = [
      { email: 'admin@orema.ga', password: 'Admin2026!', pin: '1234' },
      { email: 'manager@orema.ga', password: 'Manager2026!', pin: '5678' },
      { email: 'caisse@orema.ga', password: null, pin: '0000' },
      { email: 'serveur@orema.ga', password: null, pin: '1111' },
    ]

    for (const user of users) {
      console.log(`\n📝 Traitement de ${user.email}...`)

      // Hasher le mot de passe si présent
      let passwordHash: string | null = null
      if (user.password) {
        passwordHash = await hashPassword(user.password)
        console.log(`  ✅ Mot de passe haché: ${passwordHash.substring(0, 50)}...`)
      }

      // Hasher le PIN si présent
      let pinHash: string | null = null
      if (user.pin) {
        pinHash = await hashPassword(user.pin)
        console.log(`  ✅ PIN haché: ${pinHash.substring(0, 50)}...`)
      }

      // Mettre à jour l'utilisateur
      const updateQuery = `
        UPDATE utilisateurs
        SET
          password = $1,
          "pinCode" = $2,
          "updatedAt" = NOW()
        WHERE email = $3
      `

      const result = await client.query(updateQuery, [passwordHash, pinHash, user.email])

      if (result.rowCount && result.rowCount > 0) {
        console.log(`  ✅ Utilisateur ${user.email} mis à jour`)
      } else {
        console.log(`  ⚠️  Utilisateur ${user.email} non trouvé`)
      }
    }

    console.log('\n✨ Tous les hash ont été régénérés avec succès!')
    console.log('\n📋 Vous pouvez maintenant vous connecter avec:')
    console.log('   Admin: admin@orema.ga / Admin2026!')
    console.log('   Manager: manager@orema.ga / Manager2026!')
    console.log('   Caissier: caisse@orema.ga / PIN 0000')
    console.log('   Serveur: serveur@orema.ga / PIN 1111')
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
