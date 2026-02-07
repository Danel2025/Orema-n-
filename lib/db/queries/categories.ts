/**
 * Requêtes Supabase pour les catégories
 */

import type { DbClient } from '../client'
import type {
  Categorie,
  CategorieInsert,
  CategorieUpdate,
  CategorieWithRelations,
  PaginationOptions,
  PaginatedResult,
} from '../types'
import {
  getPaginationParams,
  createPaginatedResult,
  getErrorMessage,
} from '../utils'

/**
 * Récupère toutes les catégories d'un établissement
 */
export async function getCategories(
  client: DbClient,
  etablissementId: string,
  options?: {
    actif?: boolean
    withProduits?: boolean
    withImprimante?: boolean
  }
): Promise<Categorie[]> {
  let query = client
    .from('categories')
    .select('*')
    .eq('etablissement_id', etablissementId)
    .order('ordre', { ascending: true })

  if (options?.actif !== undefined) {
    query = query.eq('actif', options.actif)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  return (data ?? []) as Categorie[]
}

/**
 * Récupère les catégories paginées
 */
export async function getCategoriesPaginated(
  client: DbClient,
  etablissementId: string,
  options?: PaginationOptions & { actif?: boolean }
): Promise<PaginatedResult<Categorie>> {
  const { offset, limit, page, pageSize } = getPaginationParams(options)

  let query = client
    .from('categories')
    .select('*', { count: 'exact' })
    .eq('etablissement_id', etablissementId)
    .order('ordre', { ascending: true })
    .range(offset, offset + limit - 1)

  if (options?.actif !== undefined) {
    query = query.eq('actif', options.actif)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  return createPaginatedResult(data ?? [], count ?? 0, { page, pageSize })
}

/**
 * Récupère une catégorie par son ID
 */
export async function getCategorieById(
  client: DbClient,
  id: string,
  options?: { withProduits?: boolean; withImprimante?: boolean }
): Promise<CategorieWithRelations | null> {
  const { data, error } = await client
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw new Error(getErrorMessage(error))
  }

  return data as CategorieWithRelations
}

/**
 * Crée une nouvelle catégorie
 */
export async function createCategorie(
  client: DbClient,
  data: CategorieInsert
): Promise<Categorie> {
  const { data: categorie, error } = await client
    .from('categories')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  return categorie
}

/**
 * Met à jour une catégorie
 */
export async function updateCategorie(
  client: DbClient,
  id: string,
  data: CategorieUpdate
): Promise<Categorie> {
  const { data: categorie, error } = await client
    .from('categories')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  return categorie
}

/**
 * Supprime une catégorie
 */
export async function deleteCategorie(
  client: DbClient,
  id: string
): Promise<void> {
  const { error } = await client
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(getErrorMessage(error))
  }
}

/**
 * Met à jour l'ordre des catégories
 */
export async function updateCategoriesOrder(
  client: DbClient,
  categories: { id: string; ordre: number }[]
): Promise<void> {
  for (const { id, ordre } of categories) {
    const { error } = await client
      .from('categories')
      .update({ ordre, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new Error(getErrorMessage(error))
    }
  }
}

/**
 * Compte le nombre de catégories
 */
export async function countCategories(
  client: DbClient,
  etablissementId: string,
  options?: { actif?: boolean }
): Promise<number> {
  let query = client
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('etablissement_id', etablissementId)

  if (options?.actif !== undefined) {
    query = query.eq('actif', options.actif)
  }

  const { count, error } = await query

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  return count ?? 0
}
