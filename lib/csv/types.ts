/**
 * Types pour le module d'import/export CSV
 * Orema N+ - Systeme POS
 */

import type { TauxTva, ModePaiement, TypeVente, StatutVente } from "@/lib/db/types";

// ============================================================================
// Types pour l'import de produits
// ============================================================================

/**
 * Structure d'une ligne de produit dans le fichier CSV
 */
export interface CSVProductRow {
  nom: string;
  description?: string | null;
  codeBarre?: string | null;
  prixVente: number | string;
  prixAchat?: number | string | null;
  tauxTva: number | string;
  categorie: string;
  gererStock: boolean | string;
  stockActuel?: number | string | null;
  stockMin?: number | string | null;
  stockMax?: number | string | null;
  unite?: string | null;
  disponibleDirect?: boolean | string;
  disponibleTable?: boolean | string;
  disponibleLivraison?: boolean | string;
  disponibleEmporter?: boolean | string;
}

/**
 * Produit valide apres parsing et validation
 */
export interface ValidatedProduct {
  nom: string;
  description: string | null;
  codeBarre: string | null;
  prixVente: number;
  prixAchat: number | null;
  tauxTva: TauxTva;
  categorie: string;
  categorieId?: string;
  gererStock: boolean;
  stockActuel: number | null;
  stockMin: number | null;
  stockMax: number | null;
  unite: string | null;
  disponibleDirect: boolean;
  disponibleTable: boolean;
  disponibleLivraison: boolean;
  disponibleEmporter: boolean;
}

/**
 * Erreur de validation pour une ligne specifique
 */
export interface CSVValidationError {
  ligne: number;
  champ: string;
  message: string;
  valeur?: string;
}

/**
 * Avertissement (non bloquant) pour une ligne
 */
export interface CSVValidationWarning {
  ligne: number;
  champ: string;
  message: string;
}

/**
 * Resultat du parsing et de la validation d'un CSV de produits
 */
export interface CSVImportResult {
  success: boolean;
  totalLignes: number;
  lignesValides: number;
  lignesEnErreur: number;
  produits: ValidatedProduct[];
  errors: CSVValidationError[];
  warnings: CSVValidationWarning[];
}

/**
 * Resultat de l'import en base de donnees
 */
export interface CSVImportDatabaseResult {
  success: boolean;
  produitsCreees: number;
  produitsMisAJour: number;
  erreurs: Array<{
    nom: string;
    message: string;
  }>;
}

// ============================================================================
// Types pour l'export
// ============================================================================

/**
 * Options d'export CSV
 */
export interface CSVExportOptions {
  /** Delimiteur (par defaut: point-virgule pour Excel France) */
  delimiter?: ";" | "," | "\t";
  /** Inclure l'en-tete */
  includeHeader?: boolean;
  /** Encodage (BOM UTF-8 pour Excel) */
  includeBOM?: boolean;
  /** Nom du fichier */
  filename?: string;
  /** Date de debut (pour les ventes) */
  dateDebut?: Date;
  /** Date de fin (pour les ventes) */
  dateFin?: Date;
  /** Inclure les produits inactifs */
  includeInactive?: boolean;
}

/**
 * Structure d'une ligne de vente pour l'export CSV
 */
export interface CSVVenteRow {
  numeroTicket: string;
  date: string;
  heure: string;
  type: TypeVente;
  statut: StatutVente;
  client?: string;
  caissier: string;
  sousTotal: number;
  totalTva: number;
  totalRemise: number;
  totalFinal: number;
  modePaiement: string;
  reference?: string;
  nombreArticles: number;
}

/**
 * Structure d'une ligne de client pour l'export CSV
 */
export interface CSVClientRow {
  nom: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  pointsFidelite: number;
  soldePrepaye: number;
  creditAutorise: boolean;
  limitCredit?: number;
  soldeCredit: number;
  actif: boolean;
  dateCreation: string;
  nombreAchats: number;
  totalDepense: number;
}

// ============================================================================
// Types pour le parsing
// ============================================================================

/**
 * Resultat du parsing brut d'un fichier CSV
 */
export interface CSVParseResult<T = Record<string, unknown>> {
  data: T[];
  errors: Array<{
    type: string;
    code: string;
    message: string;
    row?: number;
  }>;
  meta: {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    fields?: string[];
  };
}

/**
 * Configuration pour le parsing
 */
export interface CSVParseConfig {
  /** Utiliser la premiere ligne comme en-tete */
  header?: boolean;
  /** Conversion automatique des types */
  dynamicTyping?: boolean;
  /** Ignorer les lignes vides */
  skipEmptyLines?: boolean | "greedy";
  /** Delimiteur personnalise */
  delimiter?: string;
  /** Caractere de commentaire */
  comments?: string | false;
  /** Encodage */
  encoding?: string;
  /** Transformer les en-tetes */
  transformHeader?: (header: string, index: number) => string;
}

// ============================================================================
// Types pour les templates
// ============================================================================

/**
 * Structure d'un template CSV
 */
export interface CSVTemplate {
  /** Nom du template */
  name: string;
  /** Description du template */
  description: string;
  /** Contenu CSV avec BOM UTF-8 */
  content: string;
  /** Nom du fichier suggere */
  filename: string;
  /** Colonnes avec leurs descriptions */
  columns: Array<{
    name: string;
    description: string;
    required: boolean;
    type: "string" | "number" | "boolean";
    example: string;
    values?: string[];
  }>;
}

// ============================================================================
// Mapping des taux TVA
// ============================================================================

/**
 * Mapping taux TVA (nombre vers enum)
 */
export const TAUX_TVA_MAP: Record<number, TauxTva> = {
  0: "EXONERE",
  10: "REDUIT",
  18: "STANDARD",
};

/**
 * Mapping taux TVA (enum vers nombre)
 */
export const TAUX_TVA_REVERSE_MAP: Record<TauxTva, number> = {
  EXONERE: 0,
  REDUIT: 10,
  STANDARD: 18,
};

// ============================================================================
// Constantes
// ============================================================================

/**
 * En-tetes CSV pour les produits
 */
export const PRODUCT_CSV_HEADERS = [
  "nom",
  "description",
  "codeBarre",
  "prixVente",
  "prixAchat",
  "tauxTva",
  "categorie",
  "gererStock",
  "stockActuel",
  "stockMin",
  "stockMax",
  "unite",
  "disponibleDirect",
  "disponibleTable",
  "disponibleLivraison",
  "disponibleEmporter",
] as const;

/**
 * En-tetes CSV pour les ventes
 */
export const VENTE_CSV_HEADERS = [
  "numeroTicket",
  "date",
  "heure",
  "type",
  "statut",
  "client",
  "caissier",
  "sousTotal",
  "totalTva",
  "totalRemise",
  "totalFinal",
  "modePaiement",
  "reference",
  "nombreArticles",
] as const;

/**
 * En-tetes CSV pour les clients
 */
export const CLIENT_CSV_HEADERS = [
  "nom",
  "prenom",
  "telephone",
  "email",
  "adresse",
  "pointsFidelite",
  "soldePrepaye",
  "creditAutorise",
  "limitCredit",
  "soldeCredit",
  "actif",
  "dateCreation",
  "nombreAchats",
  "totalDepense",
] as const;
