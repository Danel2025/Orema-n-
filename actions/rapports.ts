"use server";

/**
 * Server Actions pour le module de rapports et statistiques
 * Migré de Prisma vers Supabase - Version optimisée
 */

import { createServiceClient } from "@/lib/db";
import { getEtablissementId } from "@/lib/etablissement";
import type { ModePaiement, TypeVente } from "@/lib/db";

// ============================================================================
// TYPES
// ============================================================================

export type PeriodeType = "jour" | "semaine" | "mois" | "annee" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface KPIs {
  caJour: number;
  caSemaine: number;
  caMois: number;
  nombreVentes: number;
  panierMoyen: number;
  margeBrute: number | null;
  comparaisonJour: number | null;
  comparaisonSemaine: number | null;
  comparaisonMois: number | null;
}

export interface CAByPeriodItem {
  periode: string;
  label: string;
  ca: number;
  nombreVentes: number;
}

export interface TopProduct {
  id: string;
  nom: string;
  quantite: number;
  ca: number;
  categorieNom: string;
}

export interface PeakHourData {
  heure: number;
  label: string;
  nombreVentes: number;
  ca: number;
}

export interface PaymentModeData {
  mode: ModePaiement;
  label: string;
  montant: number;
  count: number;
  pourcentage: number;
}

export interface SalesByTypeData {
  type: TypeVente;
  label: string;
  count: number;
  montant: number;
  pourcentage: number;
}

export interface SalesByEmployeeData {
  id: string;
  nom: string;
  prenom: string | null;
  nombreVentes: number;
  ca: number;
  panierMoyen: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PAYMENT_MODE_LABELS: Record<string, string> = {
  ESPECES: "Especes",
  CARTE_BANCAIRE: "Carte bancaire",
  AIRTEL_MONEY: "Airtel Money",
  MOOV_MONEY: "Moov Money",
  CHEQUE: "Cheque",
  VIREMENT: "Virement",
  COMPTE_CLIENT: "Compte client",
  MIXTE: "Mixte",
};

const SALE_TYPE_LABELS: Record<string, string> = {
  DIRECT: "Vente directe",
  TABLE: "Service en salle",
  LIVRAISON: "Livraison",
  EMPORTER: "A emporter",
};

// ============================================================================
// HELPERS
// ============================================================================

function getDateRangeForPeriode(periode: PeriodeType, baseDate?: Date): DateRange {
  const now = baseDate || new Date();
  const from = new Date(now);
  const to = new Date(now);

  switch (periode) {
    case "jour":
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      break;
    case "semaine":
      const dayOfWeek = from.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      from.setDate(from.getDate() - diffToMonday);
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      break;
    case "mois":
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      break;
    case "annee":
      from.setMonth(0, 1);
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      break;
    default:
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
  }

  return { from, to };
}

function getPreviousPeriodRange(periode: PeriodeType, baseDate?: Date): DateRange {
  const now = baseDate || new Date();
  const prev = new Date(now);

  switch (periode) {
    case "jour":
      prev.setDate(prev.getDate() - 1);
      break;
    case "semaine":
      prev.setDate(prev.getDate() - 7);
      break;
    case "mois":
      prev.setMonth(prev.getMonth() - 1);
      break;
    case "annee":
      prev.setFullYear(prev.getFullYear() - 1);
      break;
  }

  return getDateRangeForPeriode(periode, prev);
}

function calculateVariation(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function sumTotalFinal(items: Array<{ total_final: number }>): number {
  return items.reduce((sum, item) => sum + (item.total_final || 0), 0);
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Récupère les KPIs principaux
 */
export async function getKPIs(): Promise<KPIs> {
  const etablissementId = await getEtablissementId();
  const supabase = createServiceClient();
  const now = new Date();

  // Calculer toutes les plages de dates
  const ranges = {
    jour: getDateRangeForPeriode("jour", now),
    semaine: getDateRangeForPeriode("semaine", now),
    mois: getDateRangeForPeriode("mois", now),
    jourPrev: getPreviousPeriodRange("jour", now),
    semainePrev: getPreviousPeriodRange("semaine", now),
    moisPrev: getPreviousPeriodRange("mois", now),
  };

  // Fonction pour récupérer les ventes d'une période (simple)
  const fetchVentesSimple = async (range: DateRange) => {
    const { data } = await supabase
      .from("ventes")
      .select("total_final")
      .eq("etablissement_id", etablissementId)
      .eq("statut", "PAYEE")
      .gte("created_at", range.from.toISOString())
      .lte("created_at", range.to.toISOString());
    return (data || []) as Array<{ total_final: number }>;
  };

  // Fonction pour récupérer les ventes avec lignes (pour marge)
  const fetchVentesWithLignes = async (range: DateRange) => {
    const { data } = await supabase
      .from("ventes")
      .select("total_final, lignes_vente(quantite, prix_unitaire, produits(prix_achat))")
      .eq("etablissement_id", etablissementId)
      .eq("statut", "PAYEE")
      .gte("created_at", range.from.toISOString())
      .lte("created_at", range.to.toISOString());
    return (data || []) as Array<{ total_final: number; lignes_vente: Array<{ quantite: number; prix_unitaire: number; produits: { prix_achat: number | null } }> }>;
  };

  // Exécuter toutes les requêtes en parallèle
  const [ventesJour, ventesSemaine, ventesMois, ventesJourPrev, ventesSemainePrev, ventesMoisPrev] =
    await Promise.all([
      fetchVentesWithLignes(ranges.jour),
      fetchVentesSimple(ranges.semaine),
      fetchVentesSimple(ranges.mois),
      fetchVentesSimple(ranges.jourPrev),
      fetchVentesSimple(ranges.semainePrev),
      fetchVentesSimple(ranges.moisPrev),
    ]);

  // Calculs
  const caJour = sumTotalFinal(ventesJour);
  const caSemaine = sumTotalFinal(ventesSemaine);
  const caMois = sumTotalFinal(ventesMois);
  const caJourPrev = sumTotalFinal(ventesJourPrev);
  const caSemainePrev = sumTotalFinal(ventesSemainePrev);
  const caMoisPrev = sumTotalFinal(ventesMoisPrev);

  const nombreVentes = ventesJour.length;
  const panierMoyen = nombreVentes > 0 ? Math.round(caJour / nombreVentes) : 0;

  // Calcul de la marge brute
  let margeBrute: number | null = null;
  let totalPrixAchat = 0;
  let totalPrixVente = 0;
  let hasPrixAchat = false;

  for (const vente of ventesJour) {
    const lignes = (vente as { lignes_vente?: Array<{ quantite: number; prix_unitaire: string | number; produits: { prix_achat: string | number | null } }> }).lignes_vente || [];
    for (const ligne of lignes) {
      const prixVente = Number(ligne.prix_unitaire) * ligne.quantite;
      totalPrixVente += prixVente;
      if (ligne.produits?.prix_achat) {
        hasPrixAchat = true;
        totalPrixAchat += Number(ligne.produits.prix_achat) * ligne.quantite;
      }
    }
  }

  if (hasPrixAchat && totalPrixVente > 0) {
    margeBrute = Math.round(((totalPrixVente - totalPrixAchat) / totalPrixVente) * 100);
  }

  return {
    caJour,
    caSemaine,
    caMois,
    nombreVentes,
    panierMoyen,
    margeBrute,
    comparaisonJour: calculateVariation(caJour, caJourPrev),
    comparaisonSemaine: calculateVariation(caSemaine, caSemainePrev),
    comparaisonMois: calculateVariation(caMois, caMoisPrev),
  };
}

/**
 * Récupère le CA par période
 */
export async function getCAByPeriod(
  from: Date,
  to: Date,
  groupBy: "jour" | "semaine" | "mois"
): Promise<CAByPeriodItem[]> {
  const etablissementId = await getEtablissementId();
  const supabase = createServiceClient();

  const { data: ventes } = await supabase
    .from("ventes")
    .select("total_final, created_at")
    .eq("etablissement_id", etablissementId)
    .eq("statut", "PAYEE")
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .order("created_at", { ascending: true });

  if (!ventes?.length) return [];

  // Grouper les ventes
  const grouped: Record<string, { ca: number; count: number; date: Date }> = {};

  for (const vente of ventes) {
    const date = new Date(vente.created_at);
    let key: string;

    switch (groupBy) {
      case "jour":
        key = date.toISOString().split("T")[0];
        break;
      case "semaine":
        const firstDay = new Date(date);
        const day = firstDay.getDay();
        const diff = firstDay.getDate() - day + (day === 0 ? -6 : 1);
        firstDay.setDate(diff);
        key = firstDay.toISOString().split("T")[0];
        break;
      case "mois":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
      default:
        key = date.toISOString().split("T")[0];
    }

    if (!grouped[key]) grouped[key] = { ca: 0, count: 0, date };
    grouped[key].ca += Number(vente.total_final);
    grouped[key].count++;
  }

  // Convertir et trier
  return Object.entries(grouped)
    .map(([periode, data]) => ({
      periode,
      label:
        groupBy === "jour"
          ? data.date.toLocaleDateString("fr-GA", { day: "2-digit", month: "short" })
          : groupBy === "semaine"
            ? `Sem. ${data.date.toLocaleDateString("fr-GA", { day: "2-digit", month: "short" })}`
            : data.date.toLocaleDateString("fr-GA", { month: "short", year: "2-digit" }),
      ca: data.ca,
      nombreVentes: data.count,
    }))
    .sort((a, b) => a.periode.localeCompare(b.periode));
}

/**
 * Récupère les top produits
 */
export async function getTopProducts(periode: PeriodeType, limit: number = 10): Promise<TopProduct[]> {
  const etablissementId = await getEtablissementId();
  const supabase = createServiceClient();
  const dateRange = getDateRangeForPeriode(periode);

  const { data: lignes } = await supabase
    .from("lignes_vente")
    .select(`
      quantite, total,
      produits!inner(id, nom, categories(nom)),
      ventes!inner(etablissement_id, statut, created_at)
    `)
    .eq("ventes.etablissement_id", etablissementId)
    .eq("ventes.statut", "PAYEE")
    .gte("ventes.created_at", dateRange.from.toISOString())
    .lte("ventes.created_at", dateRange.to.toISOString());

  if (!lignes?.length) return [];

  // Agréger par produit
  const produits: Record<string, TopProduct> = {};

  for (const ligne of lignes) {
    const produit = ligne.produits as { id: string; nom: string; categories: { nom: string } };
    const id = produit.id;

    if (!produits[id]) {
      produits[id] = {
        id,
        nom: produit.nom,
        quantite: 0,
        ca: 0,
        categorieNom: produit.categories?.nom || "Sans catégorie",
      };
    }
    produits[id].quantite += ligne.quantite;
    produits[id].ca += Number(ligne.total);
  }

  return Object.values(produits)
    .sort((a, b) => b.quantite - a.quantite)
    .slice(0, limit);
}

/**
 * Récupère les heures de pointe
 */
export async function getPeakHours(date?: Date): Promise<PeakHourData[]> {
  const etablissementId = await getEtablissementId();
  const supabase = createServiceClient();
  const dateRange = getDateRangeForPeriode("jour", date || new Date());

  const { data: ventes } = await supabase
    .from("ventes")
    .select("total_final, created_at")
    .eq("etablissement_id", etablissementId)
    .eq("statut", "PAYEE")
    .gte("created_at", dateRange.from.toISOString())
    .lte("created_at", dateRange.to.toISOString());

  // Initialiser toutes les heures
  const heures: PeakHourData[] = Array.from({ length: 24 }, (_, h) => ({
    heure: h,
    label: `${String(h).padStart(2, "0")}h`,
    nombreVentes: 0,
    ca: 0,
  }));

  // Agréger par heure
  for (const vente of ventes || []) {
    const heure = new Date(vente.created_at).getHours();
    heures[heure].nombreVentes++;
    heures[heure].ca += Number(vente.total_final);
  }

  return heures;
}

/**
 * Récupère les ventes par mode de paiement
 */
export async function getSalesByPaymentMode(periode: PeriodeType): Promise<PaymentModeData[]> {
  const etablissementId = await getEtablissementId();
  const supabase = createServiceClient();
  const dateRange = getDateRangeForPeriode(periode);

  const { data: paiements } = await supabase
    .from("paiements")
    .select(`
      mode_paiement, montant,
      ventes!inner(etablissement_id, statut, created_at)
    `)
    .eq("ventes.etablissement_id", etablissementId)
    .eq("ventes.statut", "PAYEE")
    .gte("ventes.created_at", dateRange.from.toISOString())
    .lte("ventes.created_at", dateRange.to.toISOString());

  if (!paiements?.length) return [];

  // Agréger par mode
  const modes: Record<string, { montant: number; count: number }> = {};
  let totalMontant = 0;

  for (const p of paiements) {
    const mode = p.mode_paiement;
    if (!modes[mode]) modes[mode] = { montant: 0, count: 0 };
    modes[mode].montant += Number(p.montant);
    modes[mode].count++;
    totalMontant += Number(p.montant);
  }

  return Object.entries(modes)
    .map(([mode, data]) => ({
      mode: mode as ModePaiement,
      label: PAYMENT_MODE_LABELS[mode] || mode,
      montant: data.montant,
      count: data.count,
      pourcentage: totalMontant > 0 ? Math.round((data.montant / totalMontant) * 100) : 0,
    }))
    .sort((a, b) => b.montant - a.montant);
}

/**
 * Récupère les ventes par type
 */
export async function getSalesByType(periode: PeriodeType): Promise<SalesByTypeData[]> {
  const etablissementId = await getEtablissementId();
  const supabase = createServiceClient();
  const dateRange = getDateRangeForPeriode(periode);

  const { data: ventes } = await supabase
    .from("ventes")
    .select("type, total_final")
    .eq("etablissement_id", etablissementId)
    .eq("statut", "PAYEE")
    .gte("created_at", dateRange.from.toISOString())
    .lte("created_at", dateRange.to.toISOString());

  if (!ventes?.length) return [];

  // Agréger par type
  const types: Record<string, { count: number; montant: number }> = {};
  let totalMontant = 0;

  for (const v of ventes) {
    if (!types[v.type]) types[v.type] = { count: 0, montant: 0 };
    types[v.type].count++;
    types[v.type].montant += Number(v.total_final);
    totalMontant += Number(v.total_final);
  }

  return Object.entries(types)
    .map(([type, data]) => ({
      type: type as TypeVente,
      label: SALE_TYPE_LABELS[type] || type,
      count: data.count,
      montant: data.montant,
      pourcentage: totalMontant > 0 ? Math.round((data.montant / totalMontant) * 100) : 0,
    }))
    .sort((a, b) => b.montant - a.montant);
}

/**
 * Récupère les ventes par employé
 */
export async function getSalesByEmployee(periode: PeriodeType): Promise<SalesByEmployeeData[]> {
  const etablissementId = await getEtablissementId();
  const supabase = createServiceClient();
  const dateRange = getDateRangeForPeriode(periode);

  const { data: ventes } = await supabase
    .from("ventes")
    .select("total_final, utilisateurs(id, nom, prenom)")
    .eq("etablissement_id", etablissementId)
    .eq("statut", "PAYEE")
    .gte("created_at", dateRange.from.toISOString())
    .lte("created_at", dateRange.to.toISOString());

  if (!ventes?.length) return [];

  // Agréger par employé
  const employes: Record<string, { id: string; nom: string; prenom: string | null; count: number; ca: number }> = {};

  for (const v of ventes) {
    const user = v.utilisateurs as { id: string; nom: string; prenom: string | null };
    if (!user) continue;

    if (!employes[user.id]) {
      employes[user.id] = { id: user.id, nom: user.nom, prenom: user.prenom, count: 0, ca: 0 };
    }
    employes[user.id].count++;
    employes[user.id].ca += Number(v.total_final);
  }

  return Object.values(employes)
    .map((e) => ({
      id: e.id,
      nom: e.nom,
      prenom: e.prenom,
      nombreVentes: e.count,
      ca: e.ca,
      panierMoyen: e.count > 0 ? Math.round(e.ca / e.count) : 0,
    }))
    .sort((a, b) => b.ca - a.ca);
}

/**
 * Récupère les sessions clôturées pour le rapport Z
 */
export async function getClosedSessions(limit: number = 10) {
  const etablissementId = await getEtablissementId();
  const supabase = createServiceClient();

  const { data: sessions } = await supabase
    .from("sessions_caisse")
    .select(`
      id, date_ouverture, date_cloture, fond_caisse,
      total_ventes, total_especes, total_cartes, total_mobile_money,
      nombre_ventes, nombre_annulations, especes_comptees, ecart, notes_cloture,
      utilisateurs(nom, prenom)
    `)
    .eq("etablissement_id", etablissementId)
    .not("date_cloture", "is", null)
    .order("date_cloture", { ascending: false })
    .limit(limit);

  return (sessions || []).map((s) => ({
    id: s.id,
    dateOuverture: s.date_ouverture,
    dateCloture: s.date_cloture!,
    fondCaisse: Number(s.fond_caisse),
    totalVentes: Number(s.total_ventes),
    totalEspeces: Number(s.total_especes),
    totalCartes: Number(s.total_cartes),
    totalMobileMoney: Number(s.total_mobile_money),
    nombreVentes: s.nombre_ventes,
    nombreAnnulations: s.nombre_annulations,
    especesComptees: s.especes_comptees ? Number(s.especes_comptees) : null,
    ecart: s.ecart ? Number(s.ecart) : null,
    notesCloture: s.notes_cloture,
    utilisateur: s.utilisateurs as { nom: string; prenom: string | null },
  }));
}

// ============================================================================
// HISTORIQUE DES FACTURES
// ============================================================================

export interface FactureHistorique {
  id: string;
  numeroTicket: string;
  type: TypeVente;
  statut: "EN_COURS" | "PAYEE" | "ANNULEE";
  sousTotal: number;
  totalTva: number;
  totalRemise: number;
  totalFinal: number;
  typeRemise: string | null;
  valeurRemise: number | null;
  createdAt: string;
  client: { id: string; nom: string; prenom: string | null } | null;
  utilisateur: { nom: string; prenom: string | null } | null;
  table: { numero: number; zones: { nom: string } | null } | null;
}

export interface FactureDetail extends FactureHistorique {
  lignes: {
    id: string;
    quantite: number;
    prixUnitaire: number;
    tauxTva: number;
    montantTva: number;
    sousTotal: number;
    total: number;
    notes: string | null;
    produit: { nom: string } | null;
    supplements: { nom: string; prix: number }[];
  }[];
  paiements: {
    id: string;
    modePaiement: ModePaiement;
    montant: number;
    reference: string | null;
    montantRecu: number | null;
    monnaieRendue: number | null;
  }[];
  adresseLivraison: string | null;
  notes: string | null;
}

export interface HistoriqueFacturesFilters {
  dateDebut?: string;
  dateFin?: string;
  type?: TypeVente;
  statut?: "EN_COURS" | "PAYEE" | "ANNULEE";
  numeroTicket?: string;
  clientId?: string;
}

export interface HistoriqueFacturesResult {
  factures: FactureHistorique[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Recupere l'historique des factures avec pagination et filtres
 */
export async function getHistoriqueFactures(
  filters: HistoriqueFacturesFilters = {},
  page: number = 1,
  pageSize: number = 20
): Promise<HistoriqueFacturesResult> {
  const etablissementId = await getEtablissementId();
  const supabase = createServiceClient();

  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("ventes")
    .select(
      `
      id, numero_ticket, type, statut,
      sous_total, total_tva, total_remise, total_final,
      type_remise, valeur_remise, created_at,
      clients(id, nom, prenom),
      utilisateurs(nom, prenom),
      tables(numero, zones(nom))
    `,
      { count: "exact" }
    )
    .eq("etablissement_id", etablissementId)
    .order("created_at", { ascending: false });

  // Appliquer les filtres
  if (filters.dateDebut) {
    query = query.gte("created_at", filters.dateDebut);
  }

  if (filters.dateFin) {
    // Ajouter 1 jour pour inclure toute la journee de fin
    const dateFin = new Date(filters.dateFin);
    dateFin.setDate(dateFin.getDate() + 1);
    query = query.lt("created_at", dateFin.toISOString());
  }

  if (filters.type) {
    query = query.eq("type", filters.type);
  }

  if (filters.statut) {
    query = query.eq("statut", filters.statut);
  }

  if (filters.numeroTicket) {
    query = query.ilike("numero_ticket", `%${filters.numeroTicket}%`);
  }

  if (filters.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  // Pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Erreur getHistoriqueFactures:", error);
    throw new Error("Erreur lors de la recuperation des factures");
  }

  const factures: FactureHistorique[] = (data || []).map((v) => ({
    id: v.id,
    numeroTicket: v.numero_ticket,
    type: v.type as TypeVente,
    statut: v.statut as "EN_COURS" | "PAYEE" | "ANNULEE",
    sousTotal: Number(v.sous_total),
    totalTva: Number(v.total_tva),
    totalRemise: Number(v.total_remise),
    totalFinal: Number(v.total_final),
    typeRemise: v.type_remise,
    valeurRemise: v.valeur_remise ? Number(v.valeur_remise) : null,
    createdAt: v.created_at,
    client: v.clients as { id: string; nom: string; prenom: string | null } | null,
    utilisateur: v.utilisateurs as { nom: string; prenom: string | null } | null,
    table: v.tables as { numero: number; zones: { nom: string } | null } | null,
  }));

  const total = count ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return {
    factures,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Recupere le detail complet d'une facture
 */
export async function getFactureDetail(venteId: string): Promise<FactureDetail | null> {
  const etablissementId = await getEtablissementId();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("ventes")
    .select(
      `
      id, numero_ticket, type, statut,
      sous_total, total_tva, total_remise, total_final,
      type_remise, valeur_remise, created_at,
      adresse_livraison, notes,
      clients(id, nom, prenom),
      utilisateurs(nom, prenom),
      tables(numero, zones(nom)),
      lignes_vente(
        id, quantite, prix_unitaire, taux_tva, montant_tva, sous_total, total, notes,
        produits(nom),
        lignes_vente_supplements(nom, prix)
      ),
      paiements(id, mode_paiement, montant, reference, montant_recu, monnaie_rendue)
    `
    )
    .eq("id", venteId)
    .eq("etablissement_id", etablissementId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Erreur getFactureDetail:", error);
    throw new Error("Erreur lors de la recuperation de la facture");
  }

  if (!data) return null;

  return {
    id: data.id,
    numeroTicket: data.numero_ticket,
    type: data.type as TypeVente,
    statut: data.statut as "EN_COURS" | "PAYEE" | "ANNULEE",
    sousTotal: Number(data.sous_total),
    totalTva: Number(data.total_tva),
    totalRemise: Number(data.total_remise),
    totalFinal: Number(data.total_final),
    typeRemise: data.type_remise,
    valeurRemise: data.valeur_remise ? Number(data.valeur_remise) : null,
    createdAt: data.created_at,
    adresseLivraison: data.adresse_livraison,
    notes: data.notes,
    client: data.clients as { id: string; nom: string; prenom: string | null } | null,
    utilisateur: data.utilisateurs as { nom: string; prenom: string | null } | null,
    table: data.tables as { numero: number; zones: { nom: string } | null } | null,
    lignes: (data.lignes_vente || []).map((l: Record<string, unknown>) => ({
      id: l.id as string,
      quantite: l.quantite as number,
      prixUnitaire: Number(l.prix_unitaire),
      tauxTva: Number(l.taux_tva),
      montantTva: Number(l.montant_tva),
      sousTotal: Number(l.sous_total),
      total: Number(l.total),
      notes: l.notes as string | null,
      produit: l.produits as { nom: string } | null,
      supplements: ((l.lignes_vente_supplements as Array<{ nom: string; prix: number }>) || []).map((s) => ({
        nom: s.nom,
        prix: Number(s.prix),
      })),
    })),
    paiements: (data.paiements || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      modePaiement: p.mode_paiement as ModePaiement,
      montant: Number(p.montant),
      reference: p.reference as string | null,
      montantRecu: p.montant_recu ? Number(p.montant_recu) : null,
      monnaieRendue: p.monnaie_rendue ? Number(p.monnaie_rendue) : null,
    })),
  };
}
