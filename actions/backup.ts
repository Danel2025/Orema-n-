// @ts-nocheck
// TODO: Ajouter la table 'backups' aux types Supabase pour activer la vérification TypeScript
"use server";

/**
 * Server Actions pour le systeme de sauvegarde
 * Note: Les types Supabase peuvent ne pas reconnaitre la table 'backups'
 * si les types n'ont pas ete regeneres. On utilise des casts explicites.
 */

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/db";
import { getEtablissementId, getEtablissement } from "@/lib/etablissement";
import { getCurrentUser } from "@/lib/auth";
import {
  createBackupSchema,
  backupCategories,
  type CreateBackupInput,
  type BackupRecord,
} from "@/schemas/backup.schema";
import type { ZodSchema } from "zod";

// Type pour contourner les types Supabase non mis a jour
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

// ============================================================================
// HELPERS
// ============================================================================

type ActionResult<T = unknown> = { success: boolean; error?: string; data?: T };

function validate<T>(schema: ZodSchema<T>, data: unknown): { valid: true; data: T } | { valid: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) return { valid: false, error: result.error.issues[0]?.message || "Donnees invalides" };
  return { valid: true, data: result.data };
}

// Tables par categorie
const BACKUP_TABLES: Record<string, string[]> = {
  ventes: ["ventes", "lignes_vente", "paiements", "sessions_caisse"],
  clients: ["clients"],
  produits: ["produits", "categories"],
  stocks: ["mouvements_stock"],
  tables: ["tables", "zones"],
  imprimantes: ["imprimantes"],
  utilisateurs: ["utilisateurs"],
};

// ============================================================================
// CREATE BACKUP
// ============================================================================

interface CreateBackupResult {
  backupId: string;
  downloadUrl?: string;
  recordCount: number;
  fileSize: number;
}

/**
 * Cree une nouvelle sauvegarde
 */
export async function createBackup(input: CreateBackupInput): Promise<ActionResult<CreateBackupResult>> {
  try {
    // 1. Verifier l'authentification et les permissions
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Vous devez etre connecte" };
    }
    if (!["SUPER_ADMIN", "ADMIN"].includes(currentUser.role)) {
      return { success: false, error: "Seuls les administrateurs peuvent creer des sauvegardes" };
    }

    // 2. Valider les donnees
    const validation = validate(createBackupSchema, input);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const etablissementId = await getEtablissementId();
    const etablissement = await getEtablissement();
    const supabase = createServiceClient();

    // 3. Creer l'enregistrement de backup avec statut "in_progress"
    const { data: backup, error: createError } = await (supabase as SupabaseAny)
      .from("backups")
      .insert({
        etablissement_id: etablissementId,
        nom: validation.data.nom,
        type: validation.data.type,
        format: validation.data.format,
        categories: validation.data.categories,
        status: "in_progress",
        created_by: currentUser.userId,
      })
      .select()
      .single();

    if (createError) {
      console.error("Erreur creation backup:", createError);
      throw createError;
    }

    // 4. Collecter les donnees selon les categories selectionnees
    const data: Record<string, unknown[]> = {};
    let totalRecords = 0;

    // Si type "full", prendre toutes les categories
    const categoriesToExport = validation.data.type === "full"
      ? backupCategories.map(c => c.key)
      : validation.data.categories;

    for (const category of categoriesToExport) {
      const tables = BACKUP_TABLES[category] || [];

      for (const table of tables) {
        try {
          const { data: tableData, error: tableError } = await supabase
            .from(table)
            .select("*")
            .eq("etablissement_id", etablissementId);

          if (!tableError && tableData) {
            data[table] = tableData;
            totalRecords += tableData.length;
          }
        } catch (e) {
          // Table peut ne pas avoir etablissement_id (ex: lignes_vente)
          // Dans ce cas, on la skip ou on fait une jointure
          console.warn(`Impossible d'exporter la table ${table}:`, e);
        }
      }
    }

    // 5. Generer le contenu du fichier
    const backupContent = {
      version: "1.0.0",
      date: new Date().toISOString(),
      etablissement_id: etablissementId,
      etablissement_nom: etablissement.nom,
      type: validation.data.type,
      format: validation.data.format,
      categories: categoriesToExport,
      data,
      metadata: {
        total_records: totalRecords,
        tables_count: Object.keys(data).length,
        created_by: `${currentUser.prenom || ""} ${currentUser.nom}`.trim(),
      },
    };

    const jsonContent = JSON.stringify(backupContent, null, 2);
    const fileSize = new Blob([jsonContent]).size;
    const fileName = `${etablissementId}/backup_${Date.now()}.json`;

    // 6. Uploader vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("backups")
      .upload(fileName, jsonContent, {
        contentType: "application/json",
        upsert: false,
      });

    if (uploadError) {
      // Mettre a jour le statut en "failed"
      await (supabase as SupabaseAny)
        .from("backups")
        .update({
          status: "failed",
          error_message: uploadError.message,
        })
        .eq("id", backup.id);

      console.error("Erreur upload backup:", uploadError);
      return { success: false, error: "Erreur lors de l'upload du fichier de sauvegarde" };
    }

    // 7. Obtenir une URL signee pour le telechargement
    const { data: urlData } = await supabase.storage
      .from("backups")
      .createSignedUrl(fileName, 3600); // Valide 1 heure

    // 8. Mettre a jour le backup avec les infos finales
    await supabase
      .from("backups")
      .update({
        status: "completed",
        storage_path: uploadData.path,
        file_size: fileSize,
        record_count: totalRecords,
        completed_at: new Date().toISOString(),
      })
      .eq("id", backup.id);

    revalidatePath("/parametres");

    return {
      success: true,
      data: {
        backupId: backup.id,
        downloadUrl: urlData?.signedUrl,
        recordCount: totalRecords,
        fileSize,
      },
    };
  } catch (error) {
    console.error("Erreur creation backup:", error);
    return { success: false, error: "Erreur lors de la creation de la sauvegarde" };
  }
}

// ============================================================================
// LIST BACKUPS
// ============================================================================

/**
 * Liste les sauvegardes existantes
 */
export async function listBackups(): Promise<ActionResult<BackupRecord[]>> {
  try {
    const etablissementId = await getEtablissementId();
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("backups")
      .select(`
        *,
        created_by_user:utilisateurs!backups_created_by_fkey(nom, prenom)
      `)
      .eq("etablissement_id", etablissementId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur liste backups:", error);
      throw error;
    }

    // Transformer les donnees
    const backups: BackupRecord[] = (data || []).map((b) => ({
      id: b.id,
      etablissement_id: b.etablissement_id,
      nom: b.nom,
      description: b.description,
      type: b.type,
      format: b.format,
      categories: b.categories || [],
      storage_path: b.storage_path,
      file_size: b.file_size,
      record_count: b.record_count,
      checksum: b.checksum,
      status: b.status,
      error_message: b.error_message,
      created_by: b.created_by,
      created_at: b.created_at,
      completed_at: b.completed_at,
      created_by_user: b.created_by_user,
    }));

    return { success: true, data: backups };
  } catch (error) {
    console.error("Erreur liste backups:", error);
    return { success: false, error: "Erreur lors de la recuperation des sauvegardes" };
  }
}

// ============================================================================
// DOWNLOAD BACKUP
// ============================================================================

/**
 * Obtient une URL de telechargement pour une sauvegarde
 */
export async function downloadBackup(backupId: string): Promise<ActionResult<{ downloadUrl: string }>> {
  try {
    const etablissementId = await getEtablissementId();
    const supabase = createServiceClient();

    // Recuperer le backup
    const { data: backup, error } = await supabase
      .from("backups")
      .select("storage_path, status")
      .eq("id", backupId)
      .eq("etablissement_id", etablissementId)
      .single();

    if (error || !backup) {
      return { success: false, error: "Sauvegarde non trouvee" };
    }

    if (backup.status !== "completed") {
      return { success: false, error: "La sauvegarde n'est pas terminee" };
    }

    if (!backup.storage_path) {
      return { success: false, error: "Fichier de sauvegarde introuvable" };
    }

    // Generer une URL signee
    const { data: urlData, error: urlError } = await supabase.storage
      .from("backups")
      .createSignedUrl(backup.storage_path, 3600);

    if (urlError || !urlData?.signedUrl) {
      console.error("Erreur generation URL:", urlError);
      return { success: false, error: "Impossible de generer le lien de telechargement" };
    }

    return { success: true, data: { downloadUrl: urlData.signedUrl } };
  } catch (error) {
    console.error("Erreur telechargement backup:", error);
    return { success: false, error: "Erreur lors du telechargement" };
  }
}

// ============================================================================
// DELETE BACKUP
// ============================================================================

/**
 * Supprime une sauvegarde
 */
export async function deleteBackup(backupId: string): Promise<ActionResult> {
  try {
    // Verifier les permissions
    const currentUser = await getCurrentUser();
    if (!currentUser || !["SUPER_ADMIN", "ADMIN"].includes(currentUser.role)) {
      return { success: false, error: "Permissions insuffisantes" };
    }

    const etablissementId = await getEtablissementId();
    const supabase = createServiceClient();

    // Recuperer le backup
    const { data: backup, error: fetchError } = await supabase
      .from("backups")
      .select("storage_path")
      .eq("id", backupId)
      .eq("etablissement_id", etablissementId)
      .single();

    if (fetchError || !backup) {
      return { success: false, error: "Sauvegarde non trouvee" };
    }

    // Supprimer le fichier du storage
    if (backup.storage_path) {
      const { error: storageError } = await supabase.storage
        .from("backups")
        .remove([backup.storage_path]);

      if (storageError) {
        console.warn("Erreur suppression fichier storage:", storageError);
        // On continue quand meme pour supprimer l'enregistrement
      }
    }

    // Supprimer l'enregistrement
    const { error: deleteError } = await supabase
      .from("backups")
      .delete()
      .eq("id", backupId);

    if (deleteError) {
      console.error("Erreur suppression backup:", deleteError);
      throw deleteError;
    }

    revalidatePath("/parametres");
    return { success: true };
  } catch (error) {
    console.error("Erreur suppression backup:", error);
    return { success: false, error: "Erreur lors de la suppression" };
  }
}

// ============================================================================
// GET BACKUP STATS
// ============================================================================

/**
 * Obtient les statistiques pour l'apercu de sauvegarde
 */
export async function getBackupStats(): Promise<ActionResult<Record<string, number>>> {
  try {
    const etablissementId = await getEtablissementId();
    const supabase = createServiceClient();

    const counts: Record<string, number> = {};

    // Compter pour chaque table
    const tablesToCount = [
      "ventes",
      "lignes_vente",
      "paiements",
      "sessions_caisse",
      "clients",
      "produits",
      "categories",
      "mouvements_stock",
      "tables",
      "zones",
      "imprimantes",
      "utilisateurs",
    ];

    for (const table of tablesToCount) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true })
          .eq("etablissement_id", etablissementId);

        if (!error) {
          counts[table] = count || 0;
        }
      } catch {
        counts[table] = 0;
      }
    }

    return { success: true, data: counts };
  } catch (error) {
    console.error("Erreur stats backup:", error);
    return { success: false, error: "Erreur lors de la recuperation des statistiques" };
  }
}
