/**
 * Requêtes Supabase pour les produits
 */

import type { DbClient } from '../client'
import type {
  Produit,
  ProduitInsert,
  ProduitUpdate,
  ProduitWithRelations,
  SupplementProduit,
  SupplementProduitInsert,
  PaginationOptions,
  PaginatedResult,
  TypeVente,
} from '../types'
import {
  getPaginationParams,
  createPaginatedResult,
  getErrorMessage,
  serializePrices,
  PRICE_FIELDS,
} from '../utils'

const PRODUIT_PRICE_FIELDS = PRICE_FIELDS.produits
const SUPPLEMENT_PRICE_FIELDS = PRICE_FIELDS.supplements_produits

/**
 * Sérialise un produit avec ses relations
 */
function serializeProduit<T extends Produit>(produit: T): T {
  const serialized = serializePrices(produit, [...PRODUIT_PRICE_FIELDS])

  // Sérialiser les supplements si présents
  if ('supplements_produits' in serialized && Array.isArray(serialized.supplements_produits)) {
    serialized.supplements_produits = serialized.supplements_produits.map((s: SupplementProduit) =>
      serializePrices(s, [...SUPPLEMENT_PRICE_FIELDS])
    )
  }

  return serialized
}

/**
 * Récupère tous les produits d'un établissement
 */
export async function getProduits(
  client: DbClient,
  etablissementId: string,
  options?: {
    actif?: boolean
    categorieId?: string
    typeVente?: TypeVente
    search?: string
  }
): Promise<Produit[]> {
  let query = client
    .from('produits')
    .select('*')
    .eq('etablissement_id', etablissementId)
    .order('nom', { ascending: true })

  if (options?.actif !== undefined) {
    query = query.eq('actif', options.actif)
  }

  if (options?.categorieId) {
    query = query.eq('categorie_id', options.categorieId)
  }

  if (options?.typeVente) {
    const typeField = `disponible_${options.typeVente.toLowerCase()}` as
      | 'disponible_direct'
      | 'disponible_table'
      | 'disponible_livraison'
      | 'disponible_emporter'
    query = query.eq(typeField, true)
  }

  if (options?.search) {
    query = query.or(
      `nom.ilike.%${options.search}%,code_barre.ilike.%${options.search}%,description.ilike.%${options.search}%`
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  return ((data ?? []) as Produit[]).map(serializeProduit)
}

/**
 * Récupère les produits paginés
 */
export async function getProduitsPaginated(
  client: DbClient,
  etablissementId: string,
  options?: PaginationOptions & {
    actif?: boolean
    categorieId?: string
    typeVente?: TypeVente
    search?: string
    sortBy?: 'nom' | 'prix_vente' | 'created_at' | 'stock_actuel'
    sortOrder?: 'asc' | 'desc'
  }
): Promise<PaginatedResult<Produit>> {
  const { offset, limit, page, pageSize } = getPaginationParams(options)
  const sortBy = options?.sortBy ?? 'nom'
  const sortOrder = options?.sortOrder ?? 'asc'

  let query = client
    .from('produits')
    .select('*', { count: 'exact' })
    .eq('etablissement_id', etablissementId)
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1)

  if (options?.actif !== undefined) {
    query = query.eq('actif', options.actif)
  }

  if (options?.categorieId) {
    query = query.eq('categorie_id', options.categorieId)
  }

  if (options?.typeVente) {
    const typeField = `disponible_${options.typeVente.toLowerCase()}` as
      | 'disponible_direct'
      | 'disponible_table'
      | 'disponible_livraison'
      | 'disponible_emporter'
    query = query.eq(typeField, true)
  }

  if (options?.search) {
    query = query.or(
      `nom.ilike.%${options.search}%,code_barre.ilike.%${options.search}%,description.ilike.%${options.search}%`
    )
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  const serialized = ((data ?? []) as Produit[]).map(serializeProduit)
  return createPaginatedResult(serialized, count ?? 0, { page, pageSize })
}

/**
 * Récupère un produit par son ID
 */
export async function getProduitById(
  client: DbClient,
  id: string
): Promise<Produit | null> {
  const { data, error } = await client
    .from('produits')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(getErrorMessage(error))
  }

  return serializeProduit(data as Produit)
}

/**
 * Recherche un produit par code-barres
 */
export async function getProduitByCodeBarre(
  client: DbClient,
  etablissementId: string,
  codeBarre: string
): Promise<Produit | null> {
  const { data, error } = await client
    .from('produits')
    .select('*')
    .eq('etablissement_id', etablissementId)
    .eq('code_barre', codeBarre)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(getErrorMessage(error))
  }

  return serializeProduit(data as Produit)
}

/**
 * Crée un nouveau produit
 */
export async function createProduit(
  client: DbClient,
  data: ProduitInsert
): Promise<Produit> {
  const { data: produit, error } = await client
    .from('produits')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  return serializeProduit(produit as Produit)
}

/**
 * Met à jour un produit
 */
export async function updateProduit(
  client: DbClient,
  id: string,
  data: ProduitUpdate
): Promise<Produit> {
  const { data: produit, error } = await client
    .from('produits')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  return serializeProduit(produit as Produit)
}

/**
 * Supprime un produit (soft delete)
 */
export async function deleteProduit(
  client: DbClient,
  id: string
): Promise<void> {
  const { error } = await client
    .from('produits')
    .update({ actif: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(getErrorMessage(error))
  }
}

/**
 * Met à jour le stock d'un produit
 */
export async function updateProduitStock(
  client: DbClient,
  id: string,
  quantite: number,
  mode: 'set' | 'add' | 'subtract' = 'set'
): Promise<Produit> {
  let newStock = quantite

  if (mode !== 'set') {
    const produit = await getProduitById(client, id)
    if (!produit) {
      throw new Error('Produit non trouvé')
    }
    const currentStock = produit.stock_actuel ?? 0
    newStock = mode === 'add' ? currentStock + quantite : currentStock - quantite
  }

  return updateProduit(client, id, { stock_actuel: newStock })
}

// ================== SUPPLEMENTS ==================

/**
 * Récupère les suppléments d'un produit
 */
export async function getSupplementsProduit(
  client: DbClient,
  produitId: string
): Promise<SupplementProduit[]> {
  const { data, error } = await client
    .from('supplements_produits')
    .select('*')
    .eq('produit_id', produitId)
    .order('nom', { ascending: true })

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  return (data ?? []).map(s => serializePrices(s, [...SUPPLEMENT_PRICE_FIELDS]))
}

/**
 * Crée un supplément pour un produit
 */
export async function createSupplementProduit(
  client: DbClient,
  data: SupplementProduitInsert
): Promise<SupplementProduit> {
  const { data: supplement, error } = await client
    .from('supplements_produits')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  return serializePrices(supplement, [...SUPPLEMENT_PRICE_FIELDS])
}

/**
 * Supprime un supplément
 */
export async function deleteSupplementProduit(
  client: DbClient,
  id: string
): Promise<void> {
  const { error } = await client
    .from('supplements_produits')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(getErrorMessage(error))
  }
}

/**
 * Compte le nombre de produits
 */
export async function countProduits(
  client: DbClient,
  etablissementId: string,
  options?: { actif?: boolean; categorieId?: string }
): Promise<number> {
  let query = client
    .from('produits')
    .select('*', { count: 'exact', head: true })
    .eq('etablissement_id', etablissementId)

  if (options?.actif !== undefined) {
    query = query.eq('actif', options.actif)
  }

  if (options?.categorieId) {
    query = query.eq('categorie_id', options.categorieId)
  }

  const { count, error } = await query

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  return count ?? 0
}

/**
 * Récupère les produits en rupture de stock
 */
export async function getProduitsRuptureStock(
  client: DbClient,
  etablissementId: string
): Promise<Produit[]> {
  const { data, error } = await client
    .from('produits')
    .select('*')
    .eq('etablissement_id', etablissementId)
    .eq('actif', true)
    .eq('gerer_stock', true)
    .not('stock_min', 'is', null)
    .order('nom', { ascending: true })

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  // Filtrer les produits dont le stock est inférieur au minimum
  const produitsAvecStock = (data ?? []).map(serializeProduit)
  return produitsAvecStock.filter(
    p => p.stock_actuel !== null && p.stock_min !== null && p.stock_actuel <= p.stock_min
  )
}
