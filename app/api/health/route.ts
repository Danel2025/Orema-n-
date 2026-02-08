import { createClient } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * API Health Check - Migré vers Supabase
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Test de connexion à la base de données
    const { error } = await supabase.from("etablissements").select("id").limit(1);

    if (error) throw error;

    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check failed:", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      {
        status: "unhealthy",
      },
      { status: 503 }
    );
  }
}
