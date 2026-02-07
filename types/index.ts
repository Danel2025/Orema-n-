// Types généraux pour l'application Oréma N+

import {
  type Utilisateur,
  type Etablissement,
  type Produit,
  type Categorie,
  type Vente,
  type LigneVente,
  type Client,
  type Table,
  type SessionCaisse,
  type Paiement,
  type Role,
  type TypeVente,
  type StatutVente,
  type ModePaiement,
  type StatutPreparation,
  type FormeTable,
} from "@/lib/db/types";

// ============================================================================
// Types Prisma avec relations
// ============================================================================

export type ProduitWithCategorie = Produit & {
  categorie: Categorie;
};

export type VenteWithDetails = Vente & {
  lignes: (LigneVente & {
    produit: Produit;
  })[];
  paiements: Paiement[];
  utilisateur: Utilisateur;
  client?: Client | null;
  table?: Table | null;
};

export type SessionWithVentes = SessionCaisse & {
  ventes: Vente[];
  utilisateur: Utilisateur;
};

// ============================================================================
// Types pour le panier (cart)
// ============================================================================

// Donnees minimales du produit necessaires dans le panier
export interface CartProduit {
  nom: string;
  tauxTva: string; // "STANDARD" | "REDUIT" | "EXONERE"
}

// Remise applicable a une ligne du panier
export interface CartItemRemise {
  type: "POURCENTAGE" | "MONTANT_FIXE";
  valeur: number;
}

export interface CartItem {
  lineId: string; // Identifiant unique de la ligne (pour gerer le meme produit avec supplements differents)
  produitId: string;
  produit: CartProduit; // Donnees minimales, pas le type Prisma complet
  categorieNom?: string; // Nom de la categorie (pour routage impression cuisine/bar)
  quantite: number;
  prixUnitaire: number; // Prix de base du produit (sans supplements)
  sousTotal: number;
  montantTva: number;
  total: number;
  notes?: string;
  supplements?: {
    nom: string;
    prix: number;
  }[];
  totalSupplements?: number; // Somme des prix des supplements
  // Remise par ligne
  remiseLigne?: CartItemRemise;
  montantRemiseLigne?: number;
}

export interface CartClient {
  id: string;
  nom: string;
  prenom?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  // Infos crédit
  creditAutorise?: boolean;
  limitCredit?: number | null;
  soldeCredit?: number;
}

export interface CartTable {
  id: string;
  numero: string;
  capacite: number;
  zone?: { id: string; nom: string } | null;
  couverts?: number; // Nombre de couverts (personnes à table)
}

export interface CartState {
  items: CartItem[];
  sousTotal: number;
  totalTva: number;
  totalRemise: number;
  totalFinal: number;
  remise?: {
    type: "POURCENTAGE" | "MONTANT_FIXE";
    valeur: number;
  };
  typeVente: TypeVente;
  tableId?: string;
  table?: CartTable;
  clientId?: string;
  client?: CartClient;
  // Livraison
  adresseLivraison?: string;
  telephoneLivraison?: string;
  notesLivraison?: string;
}

// ============================================================================
// Types pour les formulaires
// ============================================================================

export interface LoginFormData {
  email: string;
  password?: string;
  pinCode?: string;
}

export interface ProduitFormData {
  nom: string;
  description?: string;
  prixVente: number;
  tauxTva: number;
  prixAchat?: number;
  categorieId: string;
  gererStock: boolean;
  stockActuel?: number;
  stockMin?: number;
  stockMax?: number;
  unite?: string;
  disponibleDirect: boolean;
  disponibleTable: boolean;
  disponibleLivraison: boolean;
  disponibleEmporter: boolean;
  actif: boolean;
}

export interface VenteFormData {
  type: TypeVente;
  tableId?: string;
  clientId?: string;
  lignes: {
    produitId: string;
    quantite: number;
    notes?: string;
  }[];
  remise?: {
    type: "POURCENTAGE" | "MONTANT_FIXE";
    valeur: number;
  };
}

// ============================================================================
// Types pour les paiements
// ============================================================================

export interface PaiementData {
  modePaiement: ModePaiement;
  montant: number;
  reference?: string;
  montantRecu?: number;
  monnaieRendue?: number;
}

// ============================================================================
// Types pour les statistiques
// ============================================================================

export interface StatsVentesPeriode {
  periode: string;
  totalVentes: number;
  nombreVentes: number;
  panierMoyen: number;
}

export interface StatsProduit {
  produitId: string;
  nomProduit: string;
  quantiteVendue: number;
  chiffreAffaires: number;
}

export interface StatsJournalieres {
  date: Date;
  totalVentes: number;
  nombreTransactions: number;
  especes: number;
  cartes: number;
  mobileMoney: number;
  autres: number;
}

// ============================================================================
// Types pour l'impression
// ============================================================================

export interface TicketData {
  numeroTicket: string;
  etablissement: Etablissement;
  date: Date;
  lignes: {
    nom: string;
    quantite: number;
    prixUnitaire: number;
    total: number;
  }[];
  sousTotal: number;
  totalTva: number;
  totalFinal: number;
  paiements: {
    mode: string;
    montant: number;
  }[];
  serveur: string;
}

// ============================================================================
// Re-export des types Prisma utiles
// ============================================================================

export type {
  Utilisateur,
  Etablissement,
  Produit,
  Categorie,
  Vente,
  LigneVente,
  Client,
  Table,
  SessionCaisse,
  Paiement,
  Role,
  TypeVente,
  StatutVente,
  ModePaiement,
  StatutPreparation,
  FormeTable,
};
