/**
 * Edge Function: Webhook Mobile Money
 *
 * Réception des callbacks de paiement Airtel Money et Moov Money.
 * Cette fonction est appelée par les providers de paiement mobile
 * pour confirmer les transactions.
 *
 * @endpoint POST /functions/v1/webhook-mobile-money
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

// Types
interface AirtelMoneyPayload {
  transaction: {
    id: string;
    message: string;
    status_code: string;
    airtel_money_id: string;
  };
  reference: string; // Notre référence interne
  status: "SUCCESS" | "FAILED" | "PENDING";
}

interface MoovMoneyPayload {
  transactionId: string;
  externalReference: string; // Notre référence interne
  status: "SUCCESSFUL" | "FAILED" | "PENDING";
  amount: number;
  currency: string;
}

// Client Supabase avec Service Role
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request) => {
  // Vérifier la méthode
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.text();
    const contentType = req.headers.get("content-type") || "";

    // Déterminer le provider selon les headers
    const provider = detectProvider(req.headers);

    // Vérifier la signature du webhook
    const isValid = await verifyWebhookSignature(req.headers, body, provider);
    if (!isValid) {
      console.error(`[Webhook] Signature invalide pour ${provider}`);
      return new Response("Unauthorized", { status: 401 });
    }

    const payload = JSON.parse(body);

    // Traiter selon le provider
    let result;
    if (provider === "airtel") {
      result = await handleAirtelCallback(payload as AirtelMoneyPayload);
    } else if (provider === "moov") {
      result = await handleMoovCallback(payload as MoovMoneyPayload);
    } else {
      return new Response("Unknown provider", { status: 400 });
    }

    if (!result.success) {
      console.error(`[Webhook] Erreur traitement:`, result.error);
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Broadcast pour notification temps réel
    if (result.paiementId) {
      await broadcastPaiementConfirme(result.paiementId, result.reference);
    }

    console.log(`[Webhook] Paiement confirmé: ${result.reference}`);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Webhook] Erreur:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Détecte le provider de paiement selon les headers
 */
function detectProvider(headers: Headers): "airtel" | "moov" | "unknown" {
  // Airtel Money utilise un header spécifique
  if (headers.get("X-Airtel-Signature")) {
    return "airtel";
  }
  // Moov Money utilise un autre header
  if (headers.get("X-Moov-Signature")) {
    return "moov";
  }
  // Fallback sur le User-Agent ou autre
  const userAgent = headers.get("user-agent") || "";
  if (userAgent.includes("Airtel")) return "airtel";
  if (userAgent.includes("Moov")) return "moov";

  return "unknown";
}

/**
 * Vérifie la signature du webhook
 */
async function verifyWebhookSignature(
  headers: Headers,
  body: string,
  provider: "airtel" | "moov" | "unknown"
): Promise<boolean> {
  const secret =
    provider === "airtel"
      ? Deno.env.get("AIRTEL_WEBHOOK_SECRET")
      : provider === "moov"
        ? Deno.env.get("MOOV_WEBHOOK_SECRET")
        : null;

  if (!secret) {
    console.warn(`[Webhook] Secret non configuré pour ${provider}`);
    // En dev, on peut accepter sans signature
    return Deno.env.get("DENO_ENV") === "development";
  }

  const signature =
    provider === "airtel"
      ? headers.get("X-Airtel-Signature")
      : headers.get("X-Moov-Signature");

  if (!signature) return false;

  // Calculer le HMAC SHA256
  const expectedSignature = hmac("sha256", secret, body, "utf8", "hex");

  return signature === expectedSignature;
}

/**
 * Traite un callback Airtel Money
 */
async function handleAirtelCallback(payload: AirtelMoneyPayload): Promise<{
  success: boolean;
  paiementId?: string;
  reference?: string;
  error?: string;
}> {
  const { reference, status, transaction } = payload;

  // Mapper le statut
  const nouveauStatut =
    status === "SUCCESS"
      ? "CONFIRME"
      : status === "FAILED"
        ? "ECHOUE"
        : "EN_ATTENTE";

  // Mettre à jour le paiement en base
  const { data, error } = await supabase
    .from("paiements")
    .update({
      statut: nouveauStatut,
      referenceExterne: transaction.airtel_money_id,
      confirmeAt: nouveauStatut === "CONFIRME" ? new Date().toISOString() : null,
      metadonnees: {
        provider: "airtel_money",
        transactionId: transaction.id,
        statusCode: transaction.status_code,
        message: transaction.message,
      },
    })
    .eq("referenceInterne", reference)
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    paiementId: data?.id,
    reference,
  };
}

/**
 * Traite un callback Moov Money
 */
async function handleMoovCallback(payload: MoovMoneyPayload): Promise<{
  success: boolean;
  paiementId?: string;
  reference?: string;
  error?: string;
}> {
  const { externalReference, status, transactionId, amount } = payload;

  // Mapper le statut
  const nouveauStatut =
    status === "SUCCESSFUL"
      ? "CONFIRME"
      : status === "FAILED"
        ? "ECHOUE"
        : "EN_ATTENTE";

  // Mettre à jour le paiement en base
  const { data, error } = await supabase
    .from("paiements")
    .update({
      statut: nouveauStatut,
      referenceExterne: transactionId,
      confirmeAt: nouveauStatut === "CONFIRME" ? new Date().toISOString() : null,
      metadonnees: {
        provider: "moov_money",
        transactionId,
        amount,
        currency: payload.currency,
      },
    })
    .eq("referenceInterne", externalReference)
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    paiementId: data?.id,
    reference: externalReference,
  };
}

/**
 * Broadcast l'événement de confirmation de paiement
 */
async function broadcastPaiementConfirme(
  paiementId: string,
  reference: string
): Promise<void> {
  try {
    // Récupérer les infos du paiement pour le broadcast
    const { data: paiement } = await supabase
      .from("paiements")
      .select("venteId, vente:ventes(etablissementId)")
      .eq("id", paiementId)
      .single();

    if (paiement?.vente?.etablissementId) {
      const channelName = `paiements:${paiement.vente.etablissementId}`;
      await supabase.channel(channelName).send({
        type: "broadcast",
        event: "paiement:confirme",
        payload: {
          paiementId,
          reference,
          venteId: paiement.venteId,
        },
      });
    }
  } catch (error) {
    console.error("[Broadcast] Erreur:", error);
    // Ne pas faire échouer le webhook pour une erreur de broadcast
  }
}
