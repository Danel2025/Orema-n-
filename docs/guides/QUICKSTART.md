# ⚡ Quick Start - Oréma N+ POS

Guide ultra-rapide pour démarrer le projet en 5 minutes.

---

## 🚀 Démarrage Rapide (5 étapes)

### 1️⃣ Installer les dépendances
```bash
pnpm install
```

### 2️⃣ Configurer la base de données
```bash
# Copier le template d'environnement
cp .env.example .env

# Éditer .env et remplacer "yourPassword" par votre mot de passe PostgreSQL
# DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/orema_nplus_dev?schema=public"
```

### 3️⃣ Initialiser Prisma
```bash
# Générer le client Prisma
pnpm prisma generate

# Créer la base de données et les tables
pnpm prisma migrate dev --name init

# Ajouter des données de test
pnpm db:seed
```

### 4️⃣ Vérifier l'environnement (optionnel)
```bash
pnpm check
```

### 5️⃣ Démarrer le serveur
```bash
pnpm dev
```

**🎉 C'est parti !** Ouvrez [http://localhost:3000](http://localhost:3000)

---

## 📋 Prérequis

- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **pnpm** 8+ (`npm install -g pnpm`)
- **PostgreSQL** 14+ ([postgresql.org](https://www.postgresql.org/download/) ou [pgAdmin4](https://www.pgadmin.org/))

---

## 🔧 Commandes Utiles

```bash
# Développement
pnpm dev              # Démarrer le serveur de dev (Turbopack)
pnpm build            # Build pour production
pnpm start            # Serveur de production
pnpm lint             # Linter
pnpm format           # Prettier

# Base de données
pnpm db:generate      # Générer le client Prisma
pnpm db:migrate       # Créer une migration
pnpm db:seed          # Seed la base
pnpm db:studio        # Ouvrir Prisma Studio (GUI)
pnpm db:reset         # Reset complet

# Diagnostic
pnpm check            # Vérifier l'environnement
```

---

## 🗂️ Structure Simplifiée

```
app/
├── (auth)/login/         → /login (page de connexion)
└── (dashboard)/
    ├── page.tsx          → / (tableau de bord)
    ├── caisse/           → /caisse (point de vente)
    ├── salle/            → /salle (plan de salle)
    ├── produits/         → /produits (gestion produits)
    └── ...

components/               # Composants React
lib/                      # Utilitaires et clients
prisma/                   # Base de données
stores/                   # Zustand stores (state global)
```

---

## 🎯 Points Clés

- **Devise**: XAF (FCFA) - **sans décimales**
- **TVA Gabon**: 18% standard, 10% réduit, 0% exonéré
- **Timezone**: Africa/Libreville (UTC+1)
- **Format ticket**: YYYYMMDD00001

---

## 🐛 Problème ?

```bash
# Erreur de connexion PostgreSQL ?
# → Vérifier que PostgreSQL est démarré
# → Vérifier DATABASE_URL dans .env

# Port 3000 utilisé ?
# → Changer le port: pnpm dev -- -p 3001

# Erreur Prisma ?
# → Nettoyer: rm -rf node_modules/.prisma
# → Regénérer: pnpm prisma generate
```

---

## 📚 Documentation Complète

- `SETUP.md` - Guide détaillé de configuration
- `CORRECTIONS_APPLIED.md` - Résumé des corrections appliquées
- `README.md` - Documentation du projet

---

**Bon développement ! 🚀**
