"use server";

/**
 * Server Actions pour les paiements Mobile Money
 * Migré vers Supabase
 *
 * NOTE: La table paiements_mobile doit être créée dans Supabase
 * pour que ces fonctions soient opérationnelles.
 */

import { createServiceClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type MobileMoneyProvider = "AIRTEL_MONEY" | "MOOV_MONEY";

interface InitPaymentParams {
  montant: number;
  telephone: string;
  provider: MobileMoneyProvider;
  venteId: string;
}

interface InitPaymentResult {
  success: boolean;
  referenceInterne?: string;
  error?: string;
}

interface PaymentStatusResult {
  success: boolean;
  statut?: "EN_ATTENTE" | "CONFIRME" | "ECHOUE" | "EXPIRE";
  referenceExterne?: string;
  error?: string;
}

function generateReference(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `OREMA-${date}-${random}`;
}

function formatPhoneNumber(telephone: string): string {
  let cleaned = telephone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = "241" + cleaned.substring(1);
  else if (!cleaned.startsWith("241") && cleaned.length <= 9) cleaned = "241" + cleaned;
  return "+" + cleaned;
}

/**
 * Initie un paiement Mobile Money
 */
export async function initMobileMoneyPayment(params: InitPaymentParams): Promise<InitPaymentResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { montant, telephone, provider, venteId } = params;
  if (montant <= 0) return { success: false, error: "Montant invalide" };
  if (!telephone || telephone.length < 8) return { success: false, error: "Numéro de téléphone invalide" };

  try {
    const supabase = createServiceClient();
    const referenceInterne = generateReference();
    const expireAt = new Date();
    expireAt.setMinutes(expireAt.getMinutes() + 15);

    // Type assertion car la table paiements_mobile n'est pas encore dans les types générés
    await (supabase as any).from("paiements_mobile").insert({
      reference_interne: referenceInterne,
      montant,
      telephone: formatPhoneNumber(telephone),
      provider,
      statut: "EN_ATTENTE",
      expire_at: expireAt.toISOString(),
      vente_id: venteId,
      etablissement_id: user.etablissementId,
    });

    console.log(`[MobileMoney] Paiement initié: ${referenceInterne} - ${montant} FCFA - ${provider}`);
    return { success: true, referenceInterne };
  } catch (error) {
    console.error("[MobileMoney] Erreur initiation:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

/**
 * Vérifie le statut d'un paiement Mobile Money
 */
export async function checkMobileMoneyStatus(referenceInterne: string): Promise<PaymentStatusResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifié" };

  try {
    const supabase = createServiceClient();
    const { data: paiement } = await (supabase as any)
      .from("paiements_mobile")
      .select("*")
      .eq("reference_interne", referenceInterne)
      .single();

    if (!paiement) return { success: false, error: "Paiement non trouvé" };
    if (paiement.etablissement_id !== user.etablissementId) return { success: false, error: "Accès non autorisé" };

    if (paiement.statut === "EN_ATTENTE" && new Date() > new Date(paiement.expire_at)) {
      await (supabase as any)
        .from("paiements_mobile")
        .update({ statut: "EXPIRE" })
        .eq("reference_interne", referenceInterne);
      return { success: true, statut: "EXPIRE" };
    }

    return { success: true, statut: paiement.statut, referenceExterne: paiement.reference_externe ?? undefined };
  } catch (error) {
    console.error("[MobileMoney] Erreur vérification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

/**
 * Annule un paiement Mobile Money en attente
 */
export async function cancelMobileMoneyPayment(referenceInterne: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifié" };

  try {
    const supabase = createServiceClient();
    const { data: paiement } = await (supabase as any)
      .from("paiements_mobile")
      .select("etablissement_id, statut")
      .eq("reference_interne", referenceInterne)
      .single();

    if (!paiement) return { success: false, error: "Paiement non trouvé" };
    if (paiement.etablissement_id !== user.etablissementId) return { success: false, error: "Accès non autorisé" };
    if (paiement.statut !== "EN_ATTENTE") return { success: false, error: "Paiement non annulable" };

    await (supabase as any)
      .from("paiements_mobile")
      .update({ statut: "ECHOUE" })
      .eq("reference_interne", referenceInterne);

    return { success: true };
  } catch (error) {
    console.error("[MobileMoney] Erreur annulation:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}
