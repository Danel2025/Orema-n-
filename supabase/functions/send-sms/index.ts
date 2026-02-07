/**
 * Edge Function: Envoi de SMS
 *
 * Envoie des SMS aux clients pour diverses notifications:
 * - Commande prête
 * - Livraison en cours
 * - Confirmation de réservation
 * - Messages promotionnels
 *
 * @endpoint POST /functions/v1/send-sms
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types
interface SMSRequest {
  telephone: string;
  message: string;
  type: "commande_prete" | "livraison" | "reservation" | "promo" | "custom";
  etablissementId: string;
  metadata?: Record<string, unknown>;
}

interface SMSProviderResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Client Supabase avec Service Role
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Providers SMS disponibles
const SMS_PROVIDERS = {
  // Orange Gabon SMS API (exemple)
  orange: async (
    telephone: string,
    message: string
  ): Promise<SMSProviderResponse> => {
    const apiKey = Deno.env.get("ORANGE_SMS_API_KEY");
    if (!apiKey) throw new Error("ORANGE_SMS_API_KEY non configuré");

    const response = await fetch(
      "https://api.orange.com/smsmessaging/v1/outbound/tel%3A%2B241/requests",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          outboundSMSMessageRequest: {
            address: `tel:${formatPhoneNumber(telephone)}`,
            senderAddress: "tel:+241OREMA",
            outboundSMSTextMessage: { message },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.outboundSMSMessageRequest?.resourceReference?.resourceURL,
    };
  },

  // Twilio (backup)
  twilio: async (
    telephone: string,
    message: string
  ): Promise<SMSProviderResponse> => {
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error("Configuration Twilio incomplète");
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: formatPhoneNumber(telephone),
          From: fromNumber,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message };
    }

    const data = await response.json();
    return { success: true, messageId: data.sid };
  },
};

serve(async (req: Request) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Vérifier l'authentification
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Valider le token JWT
  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body: SMSRequest = await req.json();

    // Validation
    if (!body.telephone || !body.message || !body.etablissementId) {
      return new Response(
        JSON.stringify({
          error: "telephone, message et etablissementId sont requis",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que l'utilisateur a accès à cet établissement
    const { data: utilisateur } = await supabase
      .from("utilisateurs")
      .select("etablissementId, role")
      .eq("authUserId", user.id)
      .single();

    if (
      utilisateur?.etablissementId !== body.etablissementId &&
      utilisateur?.role !== "SUPER_ADMIN"
    ) {
      return new Response(JSON.stringify({ error: "Accès non autorisé" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Formater le message selon le type
    const formattedMessage = formatMessage(body.message, body.type);

    // Envoyer le SMS
    const provider = Deno.env.get("SMS_PROVIDER") || "orange";
    const sendFunction =
      SMS_PROVIDERS[provider as keyof typeof SMS_PROVIDERS];

    if (!sendFunction) {
      return new Response(
        JSON.stringify({ error: `Provider SMS inconnu: ${provider}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await sendFunction(body.telephone, formattedMessage);

    // Logger l'envoi
    await supabase.from("logs_sms").insert({
      etablissementId: body.etablissementId,
      telephone: body.telephone,
      message: formattedMessage,
      type: body.type,
      provider,
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      metadata: body.metadata,
    });

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.messageId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[SMS] Erreur:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erreur inconnue",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

/**
 * Formate un numéro de téléphone au format international
 */
function formatPhoneNumber(telephone: string): string {
  // Nettoyer le numéro
  let cleaned = telephone.replace(/\D/g, "");

  // Ajouter l'indicatif Gabon si nécessaire
  if (cleaned.startsWith("0")) {
    cleaned = "241" + cleaned.substring(1);
  } else if (!cleaned.startsWith("241") && cleaned.length <= 9) {
    cleaned = "241" + cleaned;
  }

  return "+" + cleaned;
}

/**
 * Formate le message selon le type
 */
function formatMessage(message: string, type: SMSRequest["type"]): string {
  const prefix = "OREMA: ";

  switch (type) {
    case "commande_prete":
      return `${prefix}Votre commande est prete! ${message}`;
    case "livraison":
      return `${prefix}Votre livraison est en cours. ${message}`;
    case "reservation":
      return `${prefix}Confirmation de reservation. ${message}`;
    case "promo":
      return `${prefix}${message}`;
    default:
      return `${prefix}${message}`;
  }
}
