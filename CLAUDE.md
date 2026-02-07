# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
pnpm dev                  # Start dev server with Turbopack
pnpm dev:clean           # Clean .next cache and start dev server
pnpm build               # Production build
pnpm start               # Start production server

# Code Quality
pnpm lint                # Run ESLint
pnpm lint:fix            # Auto-fix lint errors
pnpm format              # Format with Prettier
pnpm format:check        # Check formatting without changes

# Unit Tests (Vitest)
pnpm test                # Run tests in watch mode
pnpm test:run            # Run tests once
pnpm test:ui             # Open Vitest UI
pnpm test:coverage       # Run with coverage report

# E2E Tests (Playwright)
pnpm test:e2e            # Run E2E tests
pnpm test:e2e:ui         # Open Playwright UI
pnpm test:e2e:headed     # Run with visible browser
pnpm test:e2e:debug      # Debug mode

# Database (Supabase)
pnpm db:types            # Generate TypeScript types from Supabase schema

# Validation
pnpm check               # Run setup validation script
pnpm validate:md         # Validate markdown structure
```

## High-Level Architecture

### Application Structure (Next.js 16 App Router)

```
app/
├── (auth)/             # Auth routes (login, register, logout)
├── (dashboard)/        # Protected routes requiring authentication
│   ├── caisse/        # POS interface - main sales module
│   ├── salle/         # Floor plan - table management with drag & drop
│   ├── produits/      # Product catalog management
│   ├── stocks/        # Inventory and stock movements
│   ├── clients/       # Customer management with loyalty
│   ├── employes/      # Employee management with RBAC
│   ├── rapports/      # Reports (Rapport Z, statistics)
│   ├── parametres/    # Settings (printers, taxes, etc.)
│   └── admin/         # Super admin routes
├── (public)/          # Public pages (docs, blog, legal)
└── api/               # API routes
```

### Data Layer

- **`lib/db/`** - Supabase database layer replacing Prisma
  - `client.ts` - Supabase client creation (browser and server)
  - `queries/` - All database queries organized by domain (produits, ventes, tables, etc.)
  - The `db` object in `index.ts` exposes all queries
- **`lib/supabase/`** - Supabase configuration and helpers
- **`types/supabase.ts`** - Auto-generated types from Supabase schema

### State Management

- **`stores/cart-store.ts`** - Shopping cart state (items, discounts, sale type, customer)
- **`stores/session-store.ts`** - Cash register session state
- **`stores/ui-store.ts`** - UI state (sidebar, modals)
- **`stores/pin-lock-store.ts`** - PIN lock security state
- **`stores/split-bill-store.ts`** - Bill splitting state

### Server Actions (`actions/`)

Server Actions handle all mutations. Key modules:
- `ventes.ts` - Sales creation, payment processing
- `caisse.ts` - Cash register session open/close
- `produits.ts`, `categories.ts` - Product management
- `tables.ts` - Table status updates
- `auth.ts`, `auth-supabase.ts` - Authentication

### UI Components

- **`components/ui/`** - Base components wrapping Radix UI Themes (Box, Flex, Grid, Button, Card, etc.)
- **`components/composed/`** - Higher-level composed components (StatCard, StatusBadge, EmptyState)
- **`components/caisse/`** - POS-specific components
- **`components/salle/`** - Floor plan components (TableItem, ZoneManager, FloorPlanToolbar)
- **Imports**: Use `@/components/ui` for base components, `@/components/composed` for composed ones

### Design System (`lib/design-system/`)

- Currency formatting: `formatCurrency(15000)` → "15 000 FCFA"
- Tax calculation: `calculateTax(amount, rate)`
- Color utilities for Radix themes

### Printing System (`lib/print/`)

ESC/POS thermal printer support:
- Receipt generation (`ticket.ts`)
- Kitchen orders (`bon-cuisine.ts`)
- Z Report (`rapport-z.ts`)
- Multi-printer routing based on product categories

## Business Rules

- **Currency**: XAF (FCFA) with no decimals
- **Tax**: 18% standard VAT, 10% reduced, 0% exempt
- **Ticket numbering**: Format `YYYYMMDD00001`, sequential per day
- **User roles**: SUPER_ADMIN, ADMIN, MANAGER, CAISSIER, SERVEUR
- **Table statuses**: LIBRE, OCCUPEE, ATTENTE_COMMANDE, ATTENTE_ADDITION, A_NETTOYER

## Organisation de la documentation

### Convention des fichiers Markdown

**Règle stricte :** Tous les fichiers `.md` doivent être organisés dans le dossier `/docs`, **sauf** :
- `README.md` (à la racine - standard pour tout projet)
- `CLAUDE.md` (à la racine - instructions pour l'IA)
- `README.md` dans les sous-dossiers (ex: `components/README.md`)

### Structure du dossier `/docs`

```
/docs
  ├── /specs          # Spécifications et cahiers des charges
  ├── /design         # Design system et guides de design
  ├── /guides         # Guides de démarrage et setup
  ├── /changelogs     # Historiques de changements
  └── README.md       # Index de la documentation
```

### Lors de la création de documentation

1. **JAMAIS** créer de fichiers `.md` à la racine (sauf exceptions listées)
2. Placer la documentation dans la catégorie appropriée de `/docs`
3. Mettre à jour `/docs/README.md` avec un lien vers le nouveau fichier
4. Utiliser des noms de fichiers explicites en UPPERCASE (ex: `DESIGN_SYSTEM.md`)

### Exemples

✅ **Bon :**
- `/docs/design/DESIGN_SYSTEM.md`
- `/docs/guides/DEPLOYMENT.md`
- `/docs/specs/API_SPECIFICATION.md`
- `/README.md` (racine)

❌ **Mauvais :**
- `/DESIGN_SYSTEM.md` (à la racine)
- `/API_DOCS.md` (à la racine)
- `/CONTRIBUTING.md` (à la racine - devrait être dans `/docs/guides/`)

## Base de données

### Supabase uniquement (PAS Prisma)

**IMPORTANT :** Ce projet utilise **Supabase directement**, pas Prisma.

- **NE JAMAIS** utiliser les commandes Prisma (`prisma migrate`, `prisma generate`, etc.)
- Le fichier `prisma/schema.prisma` existe uniquement comme **référence/documentation** du schéma
- Pour les migrations : créer des fichiers SQL dans `/supabase/migrations/`
- Pour les requêtes : utiliser le client Supabase (`@supabase/supabase-js`)
- Les types sont générés via `supabase gen types typescript`

### Migrations

**RÈGLE OBLIGATOIRE :** Utiliser le MCP Supabase pour appliquer les migrations.

Pour créer et appliquer une migration :
1. Créer le fichier SQL dans `/supabase/migrations/` avec le format `YYYYMMDDHHMMSS_description.sql`
2. **TOUJOURS** appliquer via le MCP Supabase : `mcp__supabase__apply_migration`
3. **NE JAMAIS** utiliser `supabase db push` en CLI - utiliser le MCP

Exemple d'utilisation du MCP :
```
mcp__supabase__apply_migration(
  name: "add_new_column",
  query: "ALTER TABLE table_name ADD COLUMN column_name TYPE;"
)
```

Autres outils MCP Supabase utiles :
- `mcp__supabase__list_migrations` - Lister les migrations appliquées
- `mcp__supabase__execute_sql` - Exécuter du SQL (lecture)
- `mcp__supabase__list_tables` - Lister les tables
- `mcp__supabase__get_advisors` - Vérifier sécurité/performance

## Autres conventions

### Création de fichiers
- **NE JAMAIS** créer de fichiers inutiles
- **TOUJOURS** préférer éditer un fichier existant plutôt que d'en créer un nouveau
- Ne créer de documentation que si **explicitement demandé** par l'utilisateur

### Style de code
- Utiliser TypeScript strict
- Composants React avec Radix UI Themes (pas shadcn/ui)
- Suivre les conventions du projet (voir `/docs` pour les guides)
