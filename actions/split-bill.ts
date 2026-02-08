"use server";

/**
 * Server Actions pour la division d'addition
 * Migré de Prisma vers Supabase - Version optimisée
 */

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/db";
import type { ModePaiement, TypeVente, TypeRemise, TypeMouvement } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getEtablissementId } from "@/lib/etablissement";
import {
  splitBillEqualSchema,
  splitBillCustomSchema,
  splitBillByItemsSchema,
  payPartSchema,
  type PayPartData,
} from "@/schemas/split-bill.schema";

// ============================================================================
// TYPES
// ============================================================================

interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface CalculatedPart {
  id: string;
  montant: number;
  items?: { produitId: string; nom: string; quantite: number; total: number }[];
}

interface LigneVenteInput {
  produitId: string;
  quantite: number;
  prixUnitaire: number;
  tauxTva: string;
  notes?: string;
}

interface CreateSplitVenteInput {
  typeVente: TypeVente;
  lignes: LigneVenteInput[];
  parts: {
    id: string;
    montant: number;
    modePaiement: ModePaiement;
    reference?: string;
    montantRecu?: number;
    monnaieRendue?: number;
  }[];
  remise?: { type: TypeRemise; valeur: number };
  tableId?: string;
  clientId?: string;
  sessionCaisseId?: string;
  adresseLivraison?: string;
  notesLivraison?: string;
}

// ============================================================================
// UTILITAIRES
// ============================================================================

function getTauxTvaPercent(taux: string): number {
  if (taux === "EXONERE") return 0;
  if (taux === "REDUIT") return 10;
  return 18;
}

async function generateNumeroTicket(
  supabase: ReturnType<typeof createServiceClient>,
  etablissementId: string
): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

  const { data: etab } = await supabase
    .from("etablissements")
    .select("dernier_numero_ticket, date_numero_ticket")
    .eq("id", etablissementId)
    .single();

  const lastDate = etab?.date_numero_ticket
    ? new Date(etab.date_numero_ticket).toISOString().slice(0, 10).replace(/-/g, "")
    : "";

  const numero = lastDate !== dateStr ? 1 : (etab?.dernier_numero_ticket || 0) + 1;

  await supabase
    .from("etablissements")
    .update({ dernier_numero_ticket: numero, date_numero_ticket: today.toISOString() })
    .eq("id", etablissementId);

  return `${dateStr}${numero.toString().padStart(5, "0")}`;
}

// ============================================================================
// CALCUL DES PARTS
// ============================================================================

/**
 * Divise une addition en parts égales
 */
export async function splitBillEqual(
  venteId: string,
  nombrePersonnes: number
): Promise<ActionResult<CalculatedPart[]>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Vous devez être connecté" };

  const validation = splitBillEqualSchema.safeParse({ venteId, nombrePersonnes });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const supabase = createServiceClient();

  const { data: vente } = await supabase
    .from("ventes")
    .select("total_final, statut")
    .eq("id", venteId)
    .single();

  if (!vente) return { success: false, error: "Vente introuvable" };
  if (vente.statut === "PAYEE") return { success: false, error: "Cette vente est déjà payée" };

  const total = Number(vente.total_final);
  const montantBase = Math.floor(total / nombrePersonnes);
  const reste = total - montantBase * nombrePersonnes;

  const parts: CalculatedPart[] = Array.from({ length: nombrePersonnes }, (_, i) => ({
    id: `part-${i + 1}`,
    montant: i === 0 ? montantBase + reste : montantBase,
  }));

  return { success: true, data: parts };
}

/**
 * Divise une addition en montants personnalisés
 */
export async function splitBillCustom(
  venteId: string,
  montants: number[]
): Promise<ActionResult<CalculatedPart[]>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Vous devez être connecté" };

  const validation = splitBillCustomSchema.safeParse({ venteId, montants });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const supabase = createServiceClient();

  const { data: vente } = await supabase
    .from("ventes")
    .select("total_final, statut")
    .eq("id", venteId)
    .single();

  if (!vente) return { success: false, error: "Vente introuvable" };
  if (vente.statut === "PAYEE") return { success: false, error: "Cette vente est déjà payée" };

  const total = Number(vente.total_final);
  const totalMontants = montants.reduce((acc, m) => acc + m, 0);

  if (totalMontants !== total) {
    return {
      success: false,
      error: `La somme des montants (${totalMontants}) ne correspond pas au total (${total})`,
    };
  }

  const parts: CalculatedPart[] = montants.map((montant, i) => ({
    id: `part-${i + 1}`,
    montant,
  }));

  return { success: true, data: parts };
}

/**
 * Divise une addition par articles
 */
export async function splitBillByItems(
  venteId: string,
  itemsParPersonne: { personneIndex: number; produitIds: string[] }[]
): Promise<ActionResult<CalculatedPart[]>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Vous devez être connecté" };

  const validation = splitBillByItemsSchema.safeParse({ venteId, itemsParPersonne });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const supabase = createServiceClient();

  const { data: vente } = await supabase
    .from("ventes")
    .select("statut")
    .eq("id", venteId)
    .single();

  if (!vente) return { success: false, error: "Vente introuvable" };
  if (vente.statut === "PAYEE") return { success: false, error: "Cette vente est déjà payée" };

  // Récupérer les lignes de vente
  const { data: lignes } = await supabase
    .from("lignes_vente")
    .select("produit_id, quantite, total, produits(nom)")
    .eq("vente_id", venteId);

  const lignesMap = new Map(
    (lignes || []).map((l) => [l.produit_id, { ...l, nom: (l.produits as { nom: string })?.nom || "Inconnu" }])
  );

  const parts: CalculatedPart[] = itemsParPersonne.map((groupe) => {
    const items = groupe.produitIds.map((produitId) => {
      const ligne = lignesMap.get(produitId);
      return ligne
        ? { produitId, nom: ligne.nom, quantite: ligne.quantite, total: Number(ligne.total) }
        : { produitId, nom: "Inconnu", quantite: 0, total: 0 };
    });

    return {
      id: `part-${groupe.personneIndex + 1}`,
      montant: items.reduce((acc, item) => acc + item.total, 0),
      items,
    };
  });

  return { success: true, data: parts };
}

/**
 * Enregistre le paiement d'une part (placeholder)
 */
export async function payPart(input: PayPartData): Promise<ActionResult<{ paid: boolean }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Vous devez être connecté" };

  const validation = payPartSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  return { success: true, data: { paid: true } };
}

// ============================================================================
// CRÉATION DE VENTE DIVISÉE
// ============================================================================

/**
 * Crée une vente avec paiements divisés
 */
export async function createSplitVente(
  input: CreateSplitVenteInput
): Promise<ActionResult<{ venteId: string; numeroTicket: string }>> {
  const etablissementId = await getEtablissementId();
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Vous devez être connecté" };

  const supabase = createServiceClient();

  try {
    const numeroTicket = await generateNumeroTicket(supabase, etablissementId);

    // Calculer les totaux
    let sousTotal = 0;
    let totalTva = 0;

    const lignesData = input.lignes.map((ligne) => {
      const prixLigne = ligne.prixUnitaire * ligne.quantite;
      const tauxPercent = getTauxTvaPercent(ligne.tauxTva);
      const montantTva = Math.round((prixLigne * tauxPercent) / 100);

      sousTotal += prixLigne;
      totalTva += montantTva;

      return {
        produit_id: ligne.produitId,
        quantite: ligne.quantite,
        prix_unitaire: ligne.prixUnitaire,
        taux_tva: tauxPercent,
        montant_tva: montantTva,
        sous_total: prixLigne,
        total: prixLigne + montantTva,
        notes: ligne.notes,
      };
    });

    // Calculer la remise
    let totalRemise = 0;
    if (input.remise) {
      totalRemise =
        input.remise.type === "POURCENTAGE"
          ? Math.round((sousTotal * input.remise.valeur) / 100)
          : input.remise.valeur;
    }

    const totalFinal = sousTotal + totalTva - totalRemise;

    // Créer la vente
    const { data: vente, error: venteError } = await supabase
      .from("ventes")
      .insert({
        numero_ticket: numeroTicket,
        type: input.typeVente,
        statut: "PAYEE",
        sous_total: sousTotal,
        total_tva: totalTva,
        total_remise: totalRemise,
        total_final: totalFinal,
        type_remise: input.remise?.type ?? null,
        valeur_remise: input.remise?.valeur ?? null,
        etablissement_id: etablissementId,
        table_id: input.tableId ?? null,
        client_id: input.clientId ?? null,
        utilisateur_id: user.userId,
        session_caisse_id: input.sessionCaisseId ?? null,
        adresse_livraison: input.adresseLivraison ?? null,
        notes: input.notesLivraison ?? null,
      })
      .select()
      .single();

    if (venteError) throw venteError;

    // Créer les lignes de vente
    await supabase.from("lignes_vente").insert(
      lignesData.map((l) => ({ ...l, vente_id: vente.id }))
    );

    // Créer les paiements
    const paiementsData = input.parts.map((part) => ({
      vente_id: vente.id,
      mode_paiement: part.modePaiement,
      montant: part.montant,
      reference: part.reference ?? null,
      montant_recu: part.modePaiement === "ESPECES" ? (part.montantRecu ?? part.montant) : null,
      monnaie_rendue: part.modePaiement === "ESPECES" ? (part.monnaieRendue ?? 0) : null,
    }));

    await supabase.from("paiements").insert(paiementsData);

    // Mettre à jour le stock
    const produitIds = input.lignes.map((l) => l.produitId);
    const { data: produits } = await supabase
      .from("produits")
      .select("id, gerer_stock, stock_actuel")
      .in("id", produitIds);

    const produitsMap = new Map(produits?.map((p) => [p.id, p]) || []);

    for (const ligne of input.lignes) {
      const produit = produitsMap.get(ligne.produitId);
      if (!produit?.gerer_stock || produit.stock_actuel === null) continue;

      const stockAvant = produit.stock_actuel;
      const stockApres = stockAvant - ligne.quantite;

      await supabase.from("produits").update({ stock_actuel: stockApres }).eq("id", ligne.produitId);
      await supabase.from("mouvements_stock").insert({
        type: "SORTIE" as TypeMouvement,
        quantite: ligne.quantite,
        quantite_avant: stockAvant,
        quantite_apres: stockApres,
        motif: `Vente divisée - Ticket ${numeroTicket}`,
        reference: numeroTicket,
        produit_id: ligne.produitId,
      });
    }

    revalidatePath("/caisse");
    revalidatePath("/rapports");
    revalidatePath("/stocks");

    return { success: true, data: { venteId: vente.id, numeroTicket } };
  } catch (error) {
    console.error("Erreur createSplitVente:", error);
    return { success: false, error: "Erreur lors de la création de la vente" };
  }
}
