"use server";

/**
 * Server Actions pour l'envoi de SMS
 *
 * Ces actions appellent l'Edge Function send-sms pour envoyer
 * des SMS aux clients.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export type SMSType = "commande_prete" | "livraison" | "reservation" | "promo" | "custom";

interface SendSMSParams {
  telephone: string;
  message: string;
  type: SMSType;
  metadata?: Record<string, unknown>;
}

interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envoie un SMS à un client
 *
 * @example
 * ```tsx
 * const result = await sendSMS({
 *   telephone: "+24177123456",
 *   message: "Votre commande #123 est prête!",
 *   type: "commande_prete"
 * });
 * ```
 */
export async function sendSMS(params: SendSMSParams): Promise<SendSMSResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  const supabase = createServiceClient();

  // Obtenir le token d'accès pour l'Edge Function
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { success: false, error: "Session invalide" };
  }

  try {
    // Appeler l'Edge Function
    const response = await supabase.functions.invoke("send-sms", {
      body: {
        telephone: params.telephone,
        message: params.message,
        type: params.type,
        etablissementId: user.etablissementId,
        metadata: params.metadata,
      },
    });

    if (response.error) {
      console.error("[sendSMS] Erreur:", response.error);
      return { success: false, error: response.error.message };
    }

    return {
      success: true,
      messageId: response.data?.messageId,
    };
  } catch (error) {
    console.error("[sendSMS] Exception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Envoie un SMS de notification "commande prête"
 */
export async function sendCommandePreteSMS(
  telephone: string,
  numeroCommande: string
): Promise<SendSMSResult> {
  return sendSMS({
    telephone,
    message: `Votre commande ${numeroCommande} est prête! Venez la récupérer.`,
    type: "commande_prete",
    metadata: { numeroCommande },
  });
}

/**
 * Envoie un SMS de notification "livraison en cours"
 */
export async function sendLivraisonSMS(
  telephone: string,
  numeroCommande: string,
  estimatedTime?: string
): Promise<SendSMSResult> {
  const message = estimatedTime
    ? `Votre commande ${numeroCommande} est en cours de livraison. Arrivée estimée: ${estimatedTime}.`
    : `Votre commande ${numeroCommande} est en cours de livraison.`;

  return sendSMS({
    telephone,
    message,
    type: "livraison",
    metadata: { numeroCommande, estimatedTime },
  });
}

/**
 * Envoie un SMS de confirmation de réservation
 */
export async function sendReservationSMS(
  telephone: string,
  details: {
    date: string;
    heure: string;
    nombrePersonnes: number;
    tableNumero?: string;
  }
): Promise<SendSMSResult> {
  const { date, heure, nombrePersonnes, tableNumero } = details;
  const tableInfo = tableNumero ? ` (Table ${tableNumero})` : "";
  const message = `Réservation confirmée pour ${nombrePersonnes} personne(s) le ${date} à ${heure}${tableInfo}.`;

  return sendSMS({
    telephone,
    message,
    type: "reservation",
    metadata: details,
  });
}
