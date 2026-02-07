/**
 * Script de nettoyage du cache Next.js
 * Supprime le dossier .next pour résoudre les problèmes de corruption Turbopack
 * Compatible Windows, Mac et Linux (Node.js 14.14+)
 */

import { rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const nextDir = join(__dirname, '..', '.next');

async function cleanNext() {
  if (existsSync(nextDir)) {
    console.log('🧹 Nettoyage du cache Next.js (.next)...');
    try {
      await rm(nextDir, { recursive: true, force: true });
      console.log('✅ Cache nettoyé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error.message);
      process.exit(1);
    }
  } else {
    console.log('ℹ️  Pas de cache à nettoyer');
  }
}

cleanNext();
