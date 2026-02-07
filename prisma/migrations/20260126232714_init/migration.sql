-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CAISSIER', 'SERVEUR');

-- CreateEnum
CREATE TYPE "TypeVente" AS ENUM ('DIRECT', 'TABLE', 'LIVRAISON', 'EMPORTER');

-- CreateEnum
CREATE TYPE "StatutVente" AS ENUM ('EN_COURS', 'PAYEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "StatutTable" AS ENUM ('LIBRE', 'OCCUPEE', 'EN_PREPARATION', 'ADDITION', 'A_NETTOYER');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('ESPECES', 'CARTE_BANCAIRE', 'AIRTEL_MONEY', 'MOOV_MONEY', 'CHEQUE', 'VIREMENT', 'COMPTE_CLIENT', 'MIXTE');

-- CreateEnum
CREATE TYPE "TypeMouvement" AS ENUM ('ENTREE', 'SORTIE', 'AJUSTEMENT', 'PERTE');

-- CreateEnum
CREATE TYPE "TypeImprimante" AS ENUM ('TICKET', 'CUISINE', 'BAR');

-- CreateEnum
CREATE TYPE "TypeConnexion" AS ENUM ('USB', 'RESEAU', 'SERIE', 'BLUETOOTH');

-- CreateEnum
CREATE TYPE "FormeTable" AS ENUM ('RONDE', 'CARREE', 'RECTANGULAIRE');

-- CreateEnum
CREATE TYPE "StatutPreparation" AS ENUM ('EN_ATTENTE', 'EN_PREPARATION', 'PRETE', 'SERVIE');

-- CreateEnum
CREATE TYPE "TypeRemise" AS ENUM ('POURCENTAGE', 'MONTANT_FIXE');

-- CreateEnum
CREATE TYPE "TauxTva" AS ENUM ('STANDARD', 'REDUIT', 'EXONERE');

-- CreateEnum
CREATE TYPE "ActionAudit" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'CAISSE_OUVERTURE', 'CAISSE_CLOTURE', 'ANNULATION_VENTE', 'REMISE_APPLIQUEE');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CAISSIER',
    "pinCode" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "etablissementId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etablissements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "adresse" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "nif" TEXT,
    "rccm" TEXT,
    "logo" TEXT,
    "devisePar" TEXT NOT NULL DEFAULT 'FCFA',
    "tauxTvaStandard" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "tauxTvaReduit" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "dernierNumeroTicket" INTEGER NOT NULL DEFAULT 0,
    "dateNumeroTicket" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etablissements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "couleur" TEXT NOT NULL DEFAULT '#f97316',
    "icone" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "imprimanteId" UUID,
    "etablissementId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "codeBarre" TEXT,
    "prixVente" DECIMAL(10,0) NOT NULL,
    "tauxTva" "TauxTva" NOT NULL DEFAULT 'STANDARD',
    "prixAchat" DECIMAL(10,0),
    "gererStock" BOOLEAN NOT NULL DEFAULT false,
    "stockActuel" INTEGER DEFAULT 0,
    "stockMin" INTEGER,
    "stockMax" INTEGER,
    "unite" TEXT,
    "disponibleDirect" BOOLEAN NOT NULL DEFAULT true,
    "disponibleTable" BOOLEAN NOT NULL DEFAULT true,
    "disponibleLivraison" BOOLEAN NOT NULL DEFAULT true,
    "disponibleEmporter" BOOLEAN NOT NULL DEFAULT true,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "categorieId" UUID NOT NULL,
    "etablissementId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplements_produits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "prix" DECIMAL(10,0) NOT NULL,
    "produitId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplements_produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero" TEXT NOT NULL,
    "capacite" INTEGER NOT NULL DEFAULT 4,
    "forme" "FormeTable" NOT NULL DEFAULT 'CARREE',
    "statut" "StatutTable" NOT NULL DEFAULT 'LIBRE',
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,
    "largeur" DOUBLE PRECISION,
    "hauteur" DOUBLE PRECISION,
    "zone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "etablissementId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "adresse" TEXT,
    "pointsFidelite" INTEGER NOT NULL DEFAULT 0,
    "soldePrepaye" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "creditAutorise" BOOLEAN NOT NULL DEFAULT false,
    "limitCredit" DECIMAL(10,0),
    "soldeCredit" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "etablissementId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numeroTicket" TEXT NOT NULL,
    "type" "TypeVente" NOT NULL DEFAULT 'DIRECT',
    "statut" "StatutVente" NOT NULL DEFAULT 'EN_COURS',
    "sousTotal" DECIMAL(10,0) NOT NULL,
    "totalTva" DECIMAL(10,0) NOT NULL,
    "totalRemise" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "totalFinal" DECIMAL(10,0) NOT NULL,
    "typeRemise" "TypeRemise",
    "valeurRemise" DECIMAL(10,0),
    "tableId" UUID,
    "clientId" UUID,
    "utilisateurId" UUID NOT NULL,
    "sessionCaisseId" UUID,
    "etablissementId" UUID NOT NULL,
    "adresseLivraison" TEXT,
    "fraisLivraison" DECIMAL(10,0),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_vente" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "prixUnitaire" DECIMAL(10,0) NOT NULL,
    "sousTotal" DECIMAL(10,0) NOT NULL,
    "tauxTva" DECIMAL(5,2) NOT NULL,
    "montantTva" DECIMAL(10,0) NOT NULL,
    "total" DECIMAL(10,0) NOT NULL,
    "statutPreparation" "StatutPreparation" NOT NULL DEFAULT 'EN_ATTENTE',
    "notes" TEXT,
    "venteId" UUID NOT NULL,
    "produitId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lignes_vente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_vente_supplements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "prix" DECIMAL(10,0) NOT NULL,
    "ligneVenteId" UUID NOT NULL,
    "supplementProduitId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lignes_vente_supplements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "montant" DECIMAL(10,0) NOT NULL,
    "modePaiement" "ModePaiement" NOT NULL,
    "reference" TEXT,
    "montantRecu" DECIMAL(10,0),
    "monnaieRendue" DECIMAL(10,0),
    "venteId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions_caisse" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fondCaisse" DECIMAL(10,0) NOT NULL,
    "totalVentes" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "totalEspeces" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "totalCartes" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "totalMobileMoney" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "totalAutres" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "nombreVentes" INTEGER NOT NULL DEFAULT 0,
    "nombreAnnulations" INTEGER NOT NULL DEFAULT 0,
    "especesComptees" DECIMAL(10,0),
    "ecart" DECIMAL(10,0),
    "notesCloture" TEXT,
    "dateOuverture" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateCloture" TIMESTAMP(3),
    "utilisateurId" UUID NOT NULL,
    "etablissementId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_caisse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imprimantes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "type" "TypeImprimante" NOT NULL,
    "typeConnexion" "TypeConnexion" NOT NULL,
    "adresseIP" TEXT,
    "port" INTEGER,
    "pathUSB" TEXT,
    "largeurPapier" INTEGER NOT NULL DEFAULT 80,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "etablissementId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imprimantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mouvements_stock" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "TypeMouvement" NOT NULL,
    "quantite" INTEGER NOT NULL,
    "quantiteAvant" INTEGER NOT NULL,
    "quantiteApres" INTEGER NOT NULL,
    "prixUnitaire" DECIMAL(10,0),
    "motif" TEXT,
    "reference" TEXT,
    "produitId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mouvements_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "action" "ActionAudit" NOT NULL,
    "entite" TEXT NOT NULL,
    "entiteId" TEXT,
    "description" TEXT,
    "ancienneValeur" TEXT,
    "nouvelleValeur" TEXT,
    "adresseIP" TEXT,
    "utilisateurId" UUID,
    "etablissementId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE INDEX "utilisateurs_etablissementId_idx" ON "utilisateurs"("etablissementId");

-- CreateIndex
CREATE INDEX "utilisateurs_email_idx" ON "utilisateurs"("email");

-- CreateIndex
CREATE INDEX "utilisateurs_actif_idx" ON "utilisateurs"("actif");

-- CreateIndex
CREATE INDEX "categories_etablissementId_idx" ON "categories"("etablissementId");

-- CreateIndex
CREATE INDEX "categories_ordre_idx" ON "categories"("ordre");

-- CreateIndex
CREATE UNIQUE INDEX "categories_etablissementId_nom_key" ON "categories"("etablissementId", "nom");

-- CreateIndex
CREATE INDEX "produits_etablissementId_idx" ON "produits"("etablissementId");

-- CreateIndex
CREATE INDEX "produits_categorieId_idx" ON "produits"("categorieId");

-- CreateIndex
CREATE INDEX "produits_actif_idx" ON "produits"("actif");

-- CreateIndex
CREATE INDEX "produits_codeBarre_idx" ON "produits"("codeBarre");

-- CreateIndex
CREATE UNIQUE INDEX "produits_etablissementId_codeBarre_key" ON "produits"("etablissementId", "codeBarre");

-- CreateIndex
CREATE INDEX "supplements_produits_produitId_idx" ON "supplements_produits"("produitId");

-- CreateIndex
CREATE INDEX "tables_etablissementId_idx" ON "tables"("etablissementId");

-- CreateIndex
CREATE INDEX "tables_statut_idx" ON "tables"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "tables_etablissementId_numero_key" ON "tables"("etablissementId", "numero");

-- CreateIndex
CREATE INDEX "clients_etablissementId_idx" ON "clients"("etablissementId");

-- CreateIndex
CREATE INDEX "clients_telephone_idx" ON "clients"("telephone");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "clients"("email");

-- CreateIndex
CREATE INDEX "clients_actif_idx" ON "clients"("actif");

-- CreateIndex
CREATE UNIQUE INDEX "ventes_numeroTicket_key" ON "ventes"("numeroTicket");

-- CreateIndex
CREATE INDEX "ventes_etablissementId_idx" ON "ventes"("etablissementId");

-- CreateIndex
CREATE INDEX "ventes_numeroTicket_idx" ON "ventes"("numeroTicket");

-- CreateIndex
CREATE INDEX "ventes_utilisateurId_idx" ON "ventes"("utilisateurId");

-- CreateIndex
CREATE INDEX "ventes_clientId_idx" ON "ventes"("clientId");

-- CreateIndex
CREATE INDEX "ventes_tableId_idx" ON "ventes"("tableId");

-- CreateIndex
CREATE INDEX "ventes_sessionCaisseId_idx" ON "ventes"("sessionCaisseId");

-- CreateIndex
CREATE INDEX "ventes_statut_idx" ON "ventes"("statut");

-- CreateIndex
CREATE INDEX "ventes_type_idx" ON "ventes"("type");

-- CreateIndex
CREATE INDEX "ventes_createdAt_idx" ON "ventes"("createdAt");

-- CreateIndex
CREATE INDEX "lignes_vente_venteId_idx" ON "lignes_vente"("venteId");

-- CreateIndex
CREATE INDEX "lignes_vente_produitId_idx" ON "lignes_vente"("produitId");

-- CreateIndex
CREATE INDEX "lignes_vente_statutPreparation_idx" ON "lignes_vente"("statutPreparation");

-- CreateIndex
CREATE INDEX "lignes_vente_supplements_ligneVenteId_idx" ON "lignes_vente_supplements"("ligneVenteId");

-- CreateIndex
CREATE INDEX "lignes_vente_supplements_supplementProduitId_idx" ON "lignes_vente_supplements"("supplementProduitId");

-- CreateIndex
CREATE INDEX "paiements_venteId_idx" ON "paiements"("venteId");

-- CreateIndex
CREATE INDEX "paiements_modePaiement_idx" ON "paiements"("modePaiement");

-- CreateIndex
CREATE INDEX "sessions_caisse_etablissementId_idx" ON "sessions_caisse"("etablissementId");

-- CreateIndex
CREATE INDEX "sessions_caisse_utilisateurId_idx" ON "sessions_caisse"("utilisateurId");

-- CreateIndex
CREATE INDEX "sessions_caisse_dateOuverture_idx" ON "sessions_caisse"("dateOuverture");

-- CreateIndex
CREATE INDEX "sessions_caisse_dateCloture_idx" ON "sessions_caisse"("dateCloture");

-- CreateIndex
CREATE INDEX "imprimantes_etablissementId_idx" ON "imprimantes"("etablissementId");

-- CreateIndex
CREATE INDEX "imprimantes_type_idx" ON "imprimantes"("type");

-- CreateIndex
CREATE INDEX "mouvements_stock_produitId_idx" ON "mouvements_stock"("produitId");

-- CreateIndex
CREATE INDEX "mouvements_stock_type_idx" ON "mouvements_stock"("type");

-- CreateIndex
CREATE INDEX "mouvements_stock_createdAt_idx" ON "mouvements_stock"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_etablissementId_idx" ON "audit_logs"("etablissementId");

-- CreateIndex
CREATE INDEX "audit_logs_utilisateurId_idx" ON "audit_logs"("utilisateurId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entite_idx" ON "audit_logs"("entite");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "utilisateurs" ADD CONSTRAINT "utilisateurs_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_imprimanteId_fkey" FOREIGN KEY ("imprimanteId") REFERENCES "imprimantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits" ADD CONSTRAINT "produits_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits" ADD CONSTRAINT "produits_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplements_produits" ADD CONSTRAINT "supplements_produits_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_sessionCaisseId_fkey" FOREIGN KEY ("sessionCaisseId") REFERENCES "sessions_caisse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_vente" ADD CONSTRAINT "lignes_vente_venteId_fkey" FOREIGN KEY ("venteId") REFERENCES "ventes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_vente" ADD CONSTRAINT "lignes_vente_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_vente_supplements" ADD CONSTRAINT "lignes_vente_supplements_ligneVenteId_fkey" FOREIGN KEY ("ligneVenteId") REFERENCES "lignes_vente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_vente_supplements" ADD CONSTRAINT "lignes_vente_supplements_supplementProduitId_fkey" FOREIGN KEY ("supplementProduitId") REFERENCES "supplements_produits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_venteId_fkey" FOREIGN KEY ("venteId") REFERENCES "ventes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions_caisse" ADD CONSTRAINT "sessions_caisse_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions_caisse" ADD CONSTRAINT "sessions_caisse_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imprimantes" ADD CONSTRAINT "imprimantes_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvements_stock" ADD CONSTRAINT "mouvements_stock_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
