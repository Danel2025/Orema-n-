-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CAISSIER', 'SERVEUR');

-- CreateEnum
CREATE TYPE "TypeVente" AS ENUM ('DIRECT', 'TABLE', 'LIVRAISON', 'EMPORTER');

-- CreateEnum
CREATE TYPE "StatutVente" AS ENUM ('EN_COURS', 'PAYEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "StatutTable" AS ENUM ('LIBRE', 'OCCUPEE', 'EN_PREPARATION', 'ADDITION', 'A_NETTOYER');

-- CreateEnum
CREATE TYPE "FormeTable" AS ENUM ('RONDE', 'CARREE', 'RECTANGULAIRE');

-- CreateEnum
CREATE TYPE "TauxTva" AS ENUM ('STANDARD', 'REDUIT', 'EXONERE');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('ESPECES', 'CARTE_BANCAIRE', 'AIRTEL_MONEY', 'MOOV_MONEY', 'CHEQUE', 'VIREMENT', 'COMPTE_CLIENT', 'MIXTE');

-- CreateEnum
CREATE TYPE "TypeRemise" AS ENUM ('POURCENTAGE', 'MONTANT_FIXE');

-- CreateEnum
CREATE TYPE "StatutPreparation" AS ENUM ('EN_ATTENTE', 'EN_PREPARATION', 'PRETE', 'SERVIE');

-- CreateEnum
CREATE TYPE "TypeImprimante" AS ENUM ('TICKET', 'CUISINE', 'BAR');

-- CreateEnum
CREATE TYPE "TypeConnexion" AS ENUM ('USB', 'RESEAU', 'SERIE', 'BLUETOOTH');

-- CreateEnum
CREATE TYPE "TypeMouvement" AS ENUM ('ENTREE', 'SORTIE', 'AJUSTEMENT', 'PERTE', 'INVENTAIRE');

-- CreateEnum
CREATE TYPE "ActionAudit" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'CAISSE_OUVERTURE', 'CAISSE_CLOTURE', 'ANNULATION_VENTE', 'REMISE_APPLIQUEE');

-- CreateEnum
CREATE TYPE "MethodeValuation" AS ENUM ('FIFO', 'LIFO');

-- CreateEnum
CREATE TYPE "AffichageTable" AS ENUM ('NOM', 'NUMERO', 'CAPACITE', 'NOM_NUMERO', 'NUMERO_CAPACITE');

-- CreateEnum
CREATE TYPE "StatutPaiementMobile" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'ECHOUE', 'EXPIRE');

-- CreateEnum
CREATE TYPE "TypeSMS" AS ENUM ('COMMANDE_PRETE', 'LIVRAISON', 'RESERVATION', 'PROMO', 'CUSTOM');

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
    "devise_par" TEXT NOT NULL DEFAULT 'FCFA',
    "taux_tva_standard" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "taux_tva_reduit" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "afficher_tva_sur_ticket" BOOLEAN NOT NULL DEFAULT true,
    "message_ticket" VARCHAR(500),
    "dernier_numero_ticket" INTEGER NOT NULL DEFAULT 0,
    "date_numero_ticket" DATE NOT NULL DEFAULT CURRENT_DATE,
    "mode_vente_defaut" "TypeVente" NOT NULL DEFAULT 'DIRECT',
    "confirmation_vente" BOOLEAN NOT NULL DEFAULT false,
    "montant_minimum_vente" INTEGER NOT NULL DEFAULT 0,
    "remise_max_autorisee" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "impression_auto_ticket" BOOLEAN NOT NULL DEFAULT true,
    "modesPaiementActifs" "ModePaiement"[] DEFAULT ARRAY['ESPECES', 'CARTE_BANCAIRE', 'AIRTEL_MONEY', 'MOOV_MONEY']::"ModePaiement"[],
    "seuil_alerte_stock_bas" INTEGER NOT NULL DEFAULT 10,
    "seuil_critique_stock" INTEGER NOT NULL DEFAULT 5,
    "alerte_stock_email" BOOLEAN NOT NULL DEFAULT false,
    "email_alerte_stock" TEXT,
    "methode_valuation_stock" "MethodeValuation" NOT NULL DEFAULT 'FIFO',
    "fidelite_actif" BOOLEAN NOT NULL DEFAULT false,
    "taux_points_fidelite" INTEGER NOT NULL DEFAULT 1,
    "valeur_point_fidelite" INTEGER NOT NULL DEFAULT 100,
    "credit_client_actif" BOOLEAN NOT NULL DEFAULT false,
    "limite_credit_defaut" INTEGER NOT NULL DEFAULT 0,
    "duree_validite_solde" INTEGER NOT NULL DEFAULT 365,
    "longueur_pin_minimum" INTEGER NOT NULL DEFAULT 4,
    "tentatives_login_max" INTEGER NOT NULL DEFAULT 5,
    "duree_blocage" INTEGER NOT NULL DEFAULT 15,
    "session_timeout" INTEGER NOT NULL DEFAULT 30,
    "audit_actif" BOOLEAN NOT NULL DEFAULT true,
    "actionsALogger" "ActionAudit"[] DEFAULT ARRAY['LOGIN', 'LOGOUT', 'CAISSE_OUVERTURE', 'CAISSE_CLOTURE', 'ANNULATION_VENTE', 'REMISE_APPLIQUEE']::"ActionAudit"[],
    "couleur_table_libre" TEXT NOT NULL DEFAULT '#22c55e',
    "couleur_table_occupee" TEXT NOT NULL DEFAULT '#eab308',
    "couleur_table_prepa" TEXT NOT NULL DEFAULT '#3b82f6',
    "couleur_table_addition" TEXT NOT NULL DEFAULT '#f97316',
    "couleur_table_nettoyer" TEXT NOT NULL DEFAULT '#ef4444',
    "affichage_table" "AffichageTable" NOT NULL DEFAULT 'NUMERO',
    "grille_activee" BOOLEAN NOT NULL DEFAULT true,
    "taille_grille" INTEGER NOT NULL DEFAULT 20,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "etablissements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password" TEXT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CAISSIER',
    "pin_code" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "etablissement_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token" TEXT NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imprimantes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "type" "TypeImprimante" NOT NULL,
    "type_connexion" "TypeConnexion" NOT NULL,
    "adresse_ip" TEXT,
    "port" INTEGER,
    "path_usb" TEXT,
    "largeur_papier" INTEGER NOT NULL DEFAULT 80,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "etablissement_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imprimantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "couleur" TEXT NOT NULL DEFAULT '#f97316',
    "icone" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "imprimante_id" UUID,
    "etablissement_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "couleur" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "frais_livraison" INTEGER NOT NULL DEFAULT 0,
    "delai_estime" INTEGER,
    "etablissement_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero" TEXT NOT NULL,
    "capacite" INTEGER NOT NULL DEFAULT 4,
    "forme" "FormeTable" NOT NULL DEFAULT 'CARREE',
    "statut" "StatutTable" NOT NULL DEFAULT 'LIBRE',
    "position_x" DOUBLE PRECISION,
    "position_y" DOUBLE PRECISION,
    "largeur" DOUBLE PRECISION,
    "hauteur" DOUBLE PRECISION,
    "zone_id" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "etablissement_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "code_barre" TEXT,
    "prix_vente" DECIMAL(10,0) NOT NULL,
    "taux_tva" "TauxTva" NOT NULL DEFAULT 'STANDARD',
    "prix_achat" DECIMAL(10,0),
    "gerer_stock" BOOLEAN NOT NULL DEFAULT false,
    "stock_actuel" INTEGER DEFAULT 0,
    "stock_min" INTEGER,
    "stock_max" INTEGER,
    "unite" TEXT,
    "disponible_direct" BOOLEAN NOT NULL DEFAULT true,
    "disponible_table" BOOLEAN NOT NULL DEFAULT true,
    "disponible_livraison" BOOLEAN NOT NULL DEFAULT true,
    "disponible_emporter" BOOLEAN NOT NULL DEFAULT true,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "categorie_id" UUID NOT NULL,
    "etablissement_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplements_produits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "prix" DECIMAL(10,0) NOT NULL,
    "produit_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplements_produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "adresse" TEXT,
    "points_fidelite" INTEGER NOT NULL DEFAULT 0,
    "solde_prepaye" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "credit_autorise" BOOLEAN NOT NULL DEFAULT false,
    "limit_credit" DECIMAL(10,0),
    "solde_credit" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "etablissement_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions_caisse" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fond_caisse" DECIMAL(10,0) NOT NULL,
    "total_ventes" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "total_especes" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "total_cartes" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "total_mobile_money" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "total_autres" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "nombre_ventes" INTEGER NOT NULL DEFAULT 0,
    "nombre_annulations" INTEGER NOT NULL DEFAULT 0,
    "especes_comptees" DECIMAL(10,0),
    "ecart" DECIMAL(10,0),
    "notes_cloture" TEXT,
    "date_ouverture" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_cloture" TIMESTAMPTZ(6),
    "utilisateur_id" UUID NOT NULL,
    "etablissement_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_caisse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero_ticket" TEXT NOT NULL,
    "type" "TypeVente" NOT NULL DEFAULT 'DIRECT',
    "statut" "StatutVente" NOT NULL DEFAULT 'EN_COURS',
    "sous_total" DECIMAL(10,0) NOT NULL,
    "total_tva" DECIMAL(10,0) NOT NULL,
    "total_remise" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "total_final" DECIMAL(10,0) NOT NULL,
    "type_remise" "TypeRemise",
    "valeur_remise" DECIMAL(10,0),
    "table_id" UUID,
    "client_id" UUID,
    "utilisateur_id" UUID NOT NULL,
    "session_caisse_id" UUID,
    "etablissement_id" UUID NOT NULL,
    "adresse_livraison" TEXT,
    "frais_livraison" DECIMAL(10,0),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_vente" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "prix_unitaire" DECIMAL(10,0) NOT NULL,
    "sous_total" DECIMAL(10,0) NOT NULL,
    "taux_tva" DECIMAL(5,2) NOT NULL,
    "montant_tva" DECIMAL(10,0) NOT NULL,
    "total" DECIMAL(10,0) NOT NULL,
    "statut_preparation" "StatutPreparation" NOT NULL DEFAULT 'EN_ATTENTE',
    "notes" TEXT,
    "vente_id" UUID NOT NULL,
    "produit_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lignes_vente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_vente_supplements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "prix" DECIMAL(10,0) NOT NULL,
    "ligne_vente_id" UUID NOT NULL,
    "supplement_produit_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lignes_vente_supplements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "montant" DECIMAL(10,0) NOT NULL,
    "mode_paiement" "ModePaiement" NOT NULL,
    "reference" TEXT,
    "montant_recu" DECIMAL(10,0),
    "monnaie_rendue" DECIMAL(10,0),
    "vente_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mouvements_stock" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "TypeMouvement" NOT NULL,
    "quantite" INTEGER NOT NULL,
    "quantite_avant" INTEGER NOT NULL,
    "quantite_apres" INTEGER NOT NULL,
    "prix_unitaire" DECIMAL(10,0),
    "motif" TEXT,
    "reference" TEXT,
    "produit_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mouvements_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "action" "ActionAudit" NOT NULL,
    "entite" TEXT NOT NULL,
    "entite_id" TEXT,
    "description" TEXT,
    "ancienne_valeur" TEXT,
    "nouvelle_valeur" TEXT,
    "adresse_ip" TEXT,
    "utilisateur_id" UUID,
    "etablissement_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role" "Role" NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "etablissement_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_keys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "idempotency_key" TEXT NOT NULL,
    "vente_id" UUID NOT NULL,
    "numero_ticket" TEXT NOT NULL,
    "etablissement_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sync_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapports_z" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" DATE NOT NULL,
    "nombre_ventes" INTEGER NOT NULL DEFAULT 0,
    "nombre_articles" INTEGER NOT NULL DEFAULT 0,
    "total_ht" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "total_tva" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "total_ttc" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "total_especes" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "total_cartes" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "total_airtel_money" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "total_moov_money" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "total_cheques" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "total_virements" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "total_compte_client" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "panier_moyen" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "premier_ticket" TEXT,
    "dernier_ticket" TEXT,
    "data" JSONB,
    "genere_auto" BOOLEAN NOT NULL DEFAULT false,
    "etablissement_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rapports_z_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_sms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "telephone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "TypeSMS" NOT NULL,
    "provider" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "message_id" TEXT,
    "error" TEXT,
    "metadata" JSONB,
    "etablissement_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_sms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements_mobile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference_interne" TEXT NOT NULL,
    "reference_externe" TEXT,
    "montant" DECIMAL(10,0) NOT NULL,
    "telephone" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "statut" "StatutPaiementMobile" NOT NULL DEFAULT 'EN_ATTENTE',
    "confirme_at" TIMESTAMPTZ(6),
    "expire_at" TIMESTAMPTZ(6) NOT NULL,
    "metadonnees" JSONB,
    "paiement_id" UUID,
    "vente_id" UUID NOT NULL,
    "etablissement_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paiements_mobile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_etablissements_nom" ON "etablissements"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE INDEX "idx_utilisateurs_email" ON "utilisateurs"("email");

-- CreateIndex
CREATE INDEX "idx_utilisateurs_etablissement" ON "utilisateurs"("etablissement_id");

-- CreateIndex
CREATE INDEX "idx_utilisateurs_actif" ON "utilisateurs"("actif");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "idx_sessions_token" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "idx_sessions_utilisateur" ON "sessions"("utilisateur_id");

-- CreateIndex
CREATE INDEX "idx_sessions_expires" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "idx_imprimantes_etablissement" ON "imprimantes"("etablissement_id");

-- CreateIndex
CREATE INDEX "idx_imprimantes_type" ON "imprimantes"("type");

-- CreateIndex
CREATE INDEX "idx_categories_etablissement" ON "categories"("etablissement_id");

-- CreateIndex
CREATE INDEX "idx_categories_ordre" ON "categories"("ordre");

-- CreateIndex
CREATE UNIQUE INDEX "categories_etablissement_id_nom_key" ON "categories"("etablissement_id", "nom");

-- CreateIndex
CREATE INDEX "idx_zones_etablissement" ON "zones"("etablissement_id");

-- CreateIndex
CREATE UNIQUE INDEX "zones_etablissement_id_nom_key" ON "zones"("etablissement_id", "nom");

-- CreateIndex
CREATE INDEX "idx_tables_etablissement" ON "tables"("etablissement_id");

-- CreateIndex
CREATE INDEX "idx_tables_zone" ON "tables"("zone_id");

-- CreateIndex
CREATE INDEX "idx_tables_statut" ON "tables"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "tables_etablissement_id_numero_key" ON "tables"("etablissement_id", "numero");

-- CreateIndex
CREATE INDEX "idx_produits_etablissement" ON "produits"("etablissement_id");

-- CreateIndex
CREATE INDEX "idx_produits_categorie" ON "produits"("categorie_id");

-- CreateIndex
CREATE INDEX "idx_produits_code_barre" ON "produits"("code_barre");

-- CreateIndex
CREATE INDEX "idx_produits_actif" ON "produits"("actif");

-- CreateIndex
CREATE UNIQUE INDEX "produits_etablissement_id_code_barre_key" ON "produits"("etablissement_id", "code_barre");

-- CreateIndex
CREATE INDEX "idx_supplements_produit" ON "supplements_produits"("produit_id");

-- CreateIndex
CREATE INDEX "idx_clients_etablissement" ON "clients"("etablissement_id");

-- CreateIndex
CREATE INDEX "idx_clients_telephone" ON "clients"("telephone");

-- CreateIndex
CREATE INDEX "idx_clients_email" ON "clients"("email");

-- CreateIndex
CREATE INDEX "idx_clients_actif" ON "clients"("actif");

-- CreateIndex
CREATE INDEX "idx_sessions_caisse_etablissement" ON "sessions_caisse"("etablissement_id");

-- CreateIndex
CREATE INDEX "idx_sessions_caisse_utilisateur" ON "sessions_caisse"("utilisateur_id");

-- CreateIndex
CREATE INDEX "idx_sessions_caisse_date_ouverture" ON "sessions_caisse"("date_ouverture");

-- CreateIndex
CREATE INDEX "idx_sessions_caisse_date_cloture" ON "sessions_caisse"("date_cloture");

-- CreateIndex
CREATE UNIQUE INDEX "ventes_numero_ticket_key" ON "ventes"("numero_ticket");

-- CreateIndex
CREATE INDEX "idx_ventes_etablissement" ON "ventes"("etablissement_id");

-- CreateIndex
CREATE INDEX "idx_ventes_utilisateur" ON "ventes"("utilisateur_id");

-- CreateIndex
CREATE INDEX "idx_ventes_table" ON "ventes"("table_id");

-- CreateIndex
CREATE INDEX "idx_ventes_client" ON "ventes"("client_id");

-- CreateIndex
CREATE INDEX "idx_ventes_session_caisse" ON "ventes"("session_caisse_id");

-- CreateIndex
CREATE INDEX "idx_ventes_numero_ticket" ON "ventes"("numero_ticket");

-- CreateIndex
CREATE INDEX "idx_ventes_type" ON "ventes"("type");

-- CreateIndex
CREATE INDEX "idx_ventes_statut" ON "ventes"("statut");

-- CreateIndex
CREATE INDEX "idx_ventes_created_at" ON "ventes"("created_at");

-- CreateIndex
CREATE INDEX "idx_lignes_vente_vente" ON "lignes_vente"("vente_id");

-- CreateIndex
CREATE INDEX "idx_lignes_vente_produit" ON "lignes_vente"("produit_id");

-- CreateIndex
CREATE INDEX "idx_lignes_vente_statut" ON "lignes_vente"("statut_preparation");

-- CreateIndex
CREATE INDEX "idx_lignes_vente_supplements_ligne" ON "lignes_vente_supplements"("ligne_vente_id");

-- CreateIndex
CREATE INDEX "idx_lignes_vente_supplements_supplement" ON "lignes_vente_supplements"("supplement_produit_id");

-- CreateIndex
CREATE INDEX "idx_paiements_vente" ON "paiements"("vente_id");

-- CreateIndex
CREATE INDEX "idx_paiements_mode" ON "paiements"("mode_paiement");

-- CreateIndex
CREATE INDEX "idx_mouvements_stock_produit" ON "mouvements_stock"("produit_id");

-- CreateIndex
CREATE INDEX "idx_mouvements_stock_type" ON "mouvements_stock"("type");

-- CreateIndex
CREATE INDEX "idx_mouvements_stock_created_at" ON "mouvements_stock"("created_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_etablissement" ON "audit_logs"("etablissement_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_utilisateur" ON "audit_logs"("utilisateur_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_action" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "idx_audit_logs_entite" ON "audit_logs"("entite");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_role_permissions_etablissement" ON "role_permissions"("etablissement_id");

-- CreateIndex
CREATE INDEX "idx_role_permissions_role" ON "role_permissions"("role");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_etablissement_id_key" ON "role_permissions"("role", "etablissement_id");

-- CreateIndex
CREATE UNIQUE INDEX "sync_keys_idempotency_key_key" ON "sync_keys"("idempotency_key");

-- CreateIndex
CREATE INDEX "idx_sync_keys_idempotency" ON "sync_keys"("idempotency_key");

-- CreateIndex
CREATE INDEX "idx_sync_keys_etablissement" ON "sync_keys"("etablissement_id");

-- CreateIndex
CREATE INDEX "idx_sync_keys_expires" ON "sync_keys"("expires_at");

-- CreateIndex
CREATE INDEX "idx_rapports_z_etablissement" ON "rapports_z"("etablissement_id");

-- CreateIndex
CREATE INDEX "idx_rapports_z_date" ON "rapports_z"("date");

-- CreateIndex
CREATE UNIQUE INDEX "rapports_z_etablissement_id_date_key" ON "rapports_z"("etablissement_id", "date");

-- CreateIndex
CREATE INDEX "idx_logs_sms_etablissement" ON "logs_sms"("etablissement_id");

-- CreateIndex
CREATE INDEX "idx_logs_sms_telephone" ON "logs_sms"("telephone");

-- CreateIndex
CREATE INDEX "idx_logs_sms_created_at" ON "logs_sms"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_mobile_reference_interne_key" ON "paiements_mobile"("reference_interne");

-- CreateIndex
CREATE INDEX "idx_paiements_mobile_reference" ON "paiements_mobile"("reference_interne");

-- CreateIndex
CREATE INDEX "idx_paiements_mobile_statut" ON "paiements_mobile"("statut");

-- CreateIndex
CREATE INDEX "idx_paiements_mobile_etablissement" ON "paiements_mobile"("etablissement_id");

-- CreateIndex
CREATE INDEX "idx_paiements_mobile_expire" ON "paiements_mobile"("expire_at");

-- AddForeignKey
ALTER TABLE "utilisateurs" ADD CONSTRAINT "utilisateurs_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imprimantes" ADD CONSTRAINT "imprimantes_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_imprimante_id_fkey" FOREIGN KEY ("imprimante_id") REFERENCES "imprimantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits" ADD CONSTRAINT "produits_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits" ADD CONSTRAINT "produits_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplements_produits" ADD CONSTRAINT "supplements_produits_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions_caisse" ADD CONSTRAINT "sessions_caisse_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions_caisse" ADD CONSTRAINT "sessions_caisse_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_session_caisse_id_fkey" FOREIGN KEY ("session_caisse_id") REFERENCES "sessions_caisse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_vente" ADD CONSTRAINT "lignes_vente_vente_id_fkey" FOREIGN KEY ("vente_id") REFERENCES "ventes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_vente" ADD CONSTRAINT "lignes_vente_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_vente_supplements" ADD CONSTRAINT "lignes_vente_supplements_ligne_vente_id_fkey" FOREIGN KEY ("ligne_vente_id") REFERENCES "lignes_vente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_vente_supplements" ADD CONSTRAINT "lignes_vente_supplements_supplement_produit_id_fkey" FOREIGN KEY ("supplement_produit_id") REFERENCES "supplements_produits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_vente_id_fkey" FOREIGN KEY ("vente_id") REFERENCES "ventes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvements_stock" ADD CONSTRAINT "mouvements_stock_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

