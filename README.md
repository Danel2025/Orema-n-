# Oréma N+ - Système de Caisse POS

> Système de Point de Vente moderne conçu pour le marché gabonais et africain

## 📋 Description

**Oréma N+** ("le cœur" en langue locale) est un système de caisse (POS) complet et moderne, spécialement conçu pour les restaurants, brasseries, maquis, bars, et commerces du Gabon et d'Afrique.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 20+
- PostgreSQL 14+ (via pgAdmin4)
- pnpm (ou npm/yarn)

### Installation

```bash
# 1. Installer les dépendances
pnpm install

# 2. Configurer la base de données
# Éditer .env avec vos informations PostgreSQL
cp .env.example .env

# 3. Créer la base de données dans pgAdmin4
# Nom: orema_nplus_dev

# 4. Appliquer les migrations
npx pnpm db:generate
npx pnpm db:migrate
npx pnpm db:seed

# 5. Lancer le serveur
npx pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

### Identifiants par défaut

- Email: `admin@orema.ga`
- Mot de passe: `demo`

## 📜 Scripts

```bash
pnpm dev              # Serveur de développement
pnpm build            # Build de production
pnpm lint             # Linter le code
pnpm format           # Formater le code

# Base de données
pnpm db:generate      # Générer le client Prisma
pnpm db:migrate       # Appliquer les migrations
pnpm db:seed          # Peupler avec des données de test
pnpm db:studio        # Ouvrir Prisma Studio
```

## 🛠️ Stack

- **Next.js 16** - Framework React fullstack
- **React 19** - Bibliothèque UI
- **TypeScript 5** - Typage statique
- **Radix UI Themes 3** - Composants UI
- **Tailwind CSS 4** - Framework CSS
- **PostgreSQL + Prisma 7** - Base de données
- **Zustand** - État global
- **TanStack Query** - Cache et sync serveur

## ✨ Fonctionnalités

- 🛒 Module Caisse (vente directe, table, livraison, emporter)
- 🍽️ Gestion des tables avec plan de salle
- 📦 Gestion produits et stocks
- 💰 Paiements multiples (espèces, cartes, Mobile Money)
- 🖨️ Impression tickets (ESC/POS)
- 📊 Rapports et statistiques
- 👥 Multi-utilisateurs avec rôles
- 🌙 Mode clair/sombre
- 📴 Mode hors-ligne
- 🇬🇦 Spécifique Gabon (TVA 18%, FCFA)

## 📂 Structure

```
gabon-pos/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Routes authentification
│   ├── (dashboard)/    # Routes protégées
│   └── api/            # API endpoints
├── components/         # Composants React
├── lib/                # Utilitaires
├── stores/             # Zustand stores
├── schemas/            # Validation Zod
├── types/              # Types TypeScript
└── prisma/             # Base de données
```

## 🔧 Configuration

- **Devise**: FCFA (XAF) - sans décimales
- **TVA**: 18% standard, 10% réduit
- **Timezone**: Africa/Libreville
- **Mobile Money**: Airtel Money, Moov Money

## 📄 Licence

MIT

---

**Oréma N+** - Le cœur de votre commerce 🧡
