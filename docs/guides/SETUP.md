# 🚀 Guide de Configuration Rapide - Oréma N+ POS

Ce guide vous aidera à configurer et démarrer le projet Oréma N+ en quelques minutes.

## ✅ Corrections Appliquées

Les corrections suivantes ont été appliquées pour résoudre les problèmes d'intégration :

### 1. Architecture de Routing
- ✅ Suppression du dossier `app/dashboard/` dupliqué
- ✅ Conservation de la structure avec route groups `app/(dashboard)/`
- ✅ Middleware de protection des routes créé
- ✅ Routes TypeScript typées activées

### 2. TanStack Query (React Query)
- ✅ Migration vers le pattern SSR recommandé avec `isServer`
- ✅ Remplacement de `useState` par `getQueryClient()`
- ✅ Support du streaming et des pending queries
- ✅ Fichier utilitaire `lib/query-client.ts` créé

### 3. Schéma Prisma
- ✅ Ajout de `url = env("DATABASE_URL")` dans datasource
- ✅ Migration vers UUID natif PostgreSQL
- ✅ Nouveaux enums : `TauxTva`, `StatutTable`, `ActionAudit`
- ✅ Modèle `AuditLog` pour la traçabilité
- ✅ Tous les montants en `Decimal(10, 0)` (XAF sans décimales)
- ✅ Relations `onDelete` configurées correctement

## 📋 Prérequis

- **Node.js** 18+ (recommandé: 20 LTS)
- **pnpm** 8+ (ou npm, yarn)
- **PostgreSQL** 14+ (local avec pgAdmin4 ou distant avec Supabase)
- **Git** pour le contrôle de version

## 🔧 Installation

### 1. Cloner et installer les dépendances

```bash
# Installer les dépendances
pnpm install

# Ou avec npm
npm install
```

### 2. Configurer la base de données

#### Option A : PostgreSQL Local (pgAdmin4)

1. Ouvrir pgAdmin4
2. Créer une nouvelle base de données : `orema_nplus_dev`
3. Copier `.env.example` vers `.env`
4. Modifier le mot de passe dans `DATABASE_URL`

```bash
# Copier le fichier d'environnement
cp .env.example .env
```

Éditer `.env` :
```env
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/orema_nplus_dev?schema=public"
```

#### Option B : Supabase (Production)

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Copier la `DATABASE_URL` depuis Settings → Database
3. La coller dans votre `.env`

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
```

### 3. Initialiser Prisma

```bash
# Générer le client Prisma
pnpm prisma generate

# Créer et appliquer les migrations
pnpm prisma migrate dev --name init

# Seed la base de données avec des données de test
pnpm db:seed
```

### 4. Démarrer le serveur de développement

```bash
# Démarrer Next.js en mode développement
pnpm dev
```

Le serveur démarre sur **http://localhost:3000**

## 📁 Structure du Projet

```
gabon-pos/
├── app/
│   ├── (auth)/              # Routes publiques (login)
│   │   ├── layout.tsx       # Layout minimaliste auth
│   │   └── login/page.tsx   # → /login
│   │
│   ├── (dashboard)/         # Routes protégées
│   │   ├── layout.tsx       # Layout avec Sidebar + Header
│   │   ├── page.tsx         # → / (tableau de bord)
│   │   ├── caisse/          # → /caisse (POS)
│   │   ├── salle/           # → /salle (plan de salle)
│   │   ├── produits/        # → /produits
│   │   ├── stocks/          # → /stocks
│   │   ├── clients/         # → /clients
│   │   ├── employes/        # → /employes
│   │   ├── rapports/        # → /rapports
│   │   └── parametres/      # → /parametres
│   │
│   ├── api/
│   │   └── health/route.ts  # → /api/health
│   │
│   ├── layout.tsx           # Root Layout
│   ├── providers.tsx        # Providers (Theme, Query)
│   └── globals.css          # Styles globaux
│
├── actions/                 # Server Actions
├── components/
│   ├── ui/                  # Composants Radix UI
│   ├── layout/              # Header, Sidebar, etc.
│   └── shared/              # Composants partagés
│
├── lib/
│   ├── prisma.ts            # Client Prisma
│   ├── query-client.ts      # TanStack Query client
│   └── utils.ts             # Utilitaires (currency, TVA, etc.)
│
├── prisma/
│   ├── schema.prisma        # Schéma de la base de données
│   └── seed.ts              # Données de test
│
├── stores/                  # Zustand stores (cart, session, UI)
├── schemas/                 # Zod schemas (validation)
└── types/                   # TypeScript types
```

## 🎨 Stack Technique

### Frontend
- **Next.js 16.1.5** (App Router) - Framework React fullstack
- **React 19.2.3** - Bibliothèque UI
- **TypeScript 5.x** - Typage statique
- **Radix UI Themes 3.2.1** - Système de composants
- **Tailwind CSS 4.x** - Framework CSS utility-first

### État & Données
- **TanStack Query 5.x** - Gestion du state serveur (avec pattern SSR)
- **Zustand 5.x** - State management global (cart, UI, session)
- **React Hook Form 7.x** - Gestion des formulaires
- **Zod 4.x** - Validation de schémas

### Backend
- **PostgreSQL** - Base de données
- **Prisma 7.3.0** - ORM avec UUID natifs
- **Next.js Server Actions** - Mutations serveur
- **Next.js API Routes** - Endpoints REST

### Autres
- **Sonner** - Notifications toast
- **Lucide React** - Icônes
- **date-fns** - Manipulation de dates
- **idb** - IndexedDB pour le mode hors ligne

## 🔑 Commandes Principales

```bash
# Développement
pnpm dev              # Démarrer le serveur de dev (Turbopack)
pnpm build            # Build pour la production
pnpm start            # Démarrer le serveur de production
pnpm lint             # Linter le code
pnpm format           # Formater le code avec Prettier

# Base de données
pnpm db:generate      # Générer le client Prisma
pnpm db:migrate       # Créer et appliquer une migration
pnpm db:seed          # Seed la base de données
pnpm db:studio        # Ouvrir Prisma Studio (GUI)
pnpm db:reset         # Reset complet de la DB
pnpm db:push          # Push le schéma (sans migration)
```

## 🌍 Internationalisation

- **Langue** : Français (fr-FR)
- **Timezone** : Africa/Libreville (Gabon - UTC+1)
- **Devise** : XAF (Franc CFA) - **sans décimales**
- **Format des montants** : `1 234 FCFA`
- **TVA Gabon** :
  - Standard : 18%
  - Réduit : 10%
  - Exonéré : 0%

## 🔐 Sécurité

### En Développement
- Le middleware bypass l'authentification en dev
- Accès libre à toutes les routes

### En Production (À implémenter)
- Authentification Supabase Auth
- Row Level Security (RLS) pour isoler les établissements
- PIN codes hashés pour accès rapide caisse
- Audit logging avec `AuditLog`

## 📊 Base de Données

### Modèles Principaux

- **Utilisateur** : Comptes utilisateurs avec rôles (SUPER_ADMIN, ADMIN, MANAGER, CAISSIER, SERVEUR)
- **Etablissement** : Informations commerciales (NIF, RCCM)
- **Categorie** : Catégories de produits avec routage imprimante
- **Produit** : Articles avec prix, stock, TVA
- **Table** : Tables avec plan de salle (position, forme, capacité)
- **Client** : Clients avec fidélité, crédit, prépayé
- **Vente** : Transactions avec numéro ticket unique (YYYYMMDD00001)
- **LigneVente** : Détails des articles vendus
- **Paiement** : Paiements multiples (espèces, carte, Mobile Money)
- **SessionCaisse** : Sessions de caisse avec rapports Z
- **Imprimante** : Configuration des imprimantes (ticket, cuisine, bar)
- **MouvementStock** : Historique des mouvements de stock
- **AuditLog** : Traçabilité des actions sensibles

### Enums Importants

```prisma
enum TauxTva {
  STANDARD  // 18%
  REDUIT    // 10%
  EXONERE   // 0%
}

enum StatutTable {
  LIBRE          // Vert - Table disponible
  OCCUPEE        // Jaune - Clients installés
  EN_PREPARATION // Bleu - Commande en cuisine
  ADDITION       // Orange - Addition demandée
  A_NETTOYER     // Rouge - À nettoyer
}

enum ModePaiement {
  ESPECES
  CARTE_BANCAIRE
  AIRTEL_MONEY
  MOOV_MONEY
  CHEQUE
  VIREMENT
  COMPTE_CLIENT
  MIXTE
}
```

## 🎯 Fonctionnalités Clés

### Module Caisse (POS)
- Vente directe, sur table, livraison, emporter
- Paiements multiples (espèces, carte, Mobile Money)
- Gestion des remises
- Impression tickets (client, cuisine, bar)
- Mode hors ligne avec synchronisation

### Gestion Produits
- CRUD complet
- Import/export CSV
- Gestion du stock avec déduction automatique
- Gestion de la TVA (18%, 10%, 0%)
- Code-barres

### Plan de Salle
- Éditeur drag & drop
- Statuts en temps réel
- Division d'addition
- Transfert de table

### Rapports
- Rapport Z (clôture journalière)
- Statistiques de ventes
- Produits les plus vendus
- Analyse des heures de pointe
- Marges bénéficiaires
- Export PDF, Excel, CSV

## 🛠️ Utilitaires

### Fonctions FCFA (lib/utils.ts)

```typescript
// Formater un montant en FCFA
formatCurrency(5000) // → "5 000 FCFA"

// Calculer la TVA
calculerTVA(10000, TauxTva.STANDARD) // → 1800
calculerTTC(10000, TauxTva.STANDARD) // → 11800
calculerHT(11800, TauxTva.STANDARD)  // → 10000

// Calculer une ligne de vente
calculerLigneVente(1000, 3, TauxTva.STANDARD)
// → { sousTotal: 3000, montantTva: 540, total: 3540 }

// Générer un numéro de ticket
formatTicketNumber(new Date(), 1) // → "2026012600001"
```

## 🐛 Dépannage

### Erreur "Can't reach database server"
```bash
# Vérifier que PostgreSQL est démarré
# Windows: Services → PostgreSQL
# Mac: brew services list

# Tester la connexion
psql -U postgres -d orema_nplus_dev
```

### Erreur "prisma generate" échoue
```bash
# Nettoyer et regénérer
rm -rf node_modules/.prisma
pnpm prisma generate
```

### Port 3000 déjà utilisé
```bash
# Changer le port dans package.json
"dev": "next dev --turbopack -p 3001"
```

## 📚 Ressources

- [Next.js Documentation](https://nextjs.org/docs)
- [Radix UI Themes](https://www.radix-ui.com/themes/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 📝 Notes Importantes

1. **FCFA sans décimales** : Tous les montants sont en entiers (pas de centimes)
2. **TypedRoutes** : Les routes sont typées avec TypeScript
3. **SSR avec TanStack Query** : Pattern recommandé implémenté
4. **UUID natifs** : Utilisation de `gen_random_uuid()` PostgreSQL
5. **Audit logging** : Traçabilité automatique via `AuditLog`

## 🚀 Prochaines Étapes

1. [ ] Implémenter l'authentification Supabase
2. [ ] Configurer Row Level Security (RLS)
3. [ ] Ajouter les tests unitaires
4. [ ] Implémenter le mode hors ligne avec IndexedDB
5. [ ] Configurer les imprimantes thermiques
6. [ ] Déployer sur Vercel avec Supabase

---

**Bon développement ! 🎉**

Si vous rencontrez des problèmes, consultez les issues GitHub ou contactez l'équipe de développement.
