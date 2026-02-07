import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartState, CartClient, CartTable, CartItemRemise } from "@/types";
import { calculerTVA, calculerTTC } from "@/lib/utils";

// Type pour les supplements selectionnes
interface CartSupplement {
  id?: string;
  nom: string;
  prix: number;
}

// Type pour une vente en attente sur table
interface VenteEnAttenteInfo {
  id: string;
  numeroTicket: string;
  totalFinal: number;
  lignesCount: number;
}

interface CartStore extends CartState {
  // Actions
  addItem: (item: Omit<CartItem, "sousTotal" | "montantTva" | "total" | "quantite" | "lineId">, quantity?: number) => void;
  addItemWithSupplements: (
    item: Omit<CartItem, "sousTotal" | "montantTva" | "total" | "quantite" | "lineId" | "supplements" | "totalSupplements">,
    supplements: CartSupplement[],
    quantity?: number
  ) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantite: number) => void;
  updateNotes: (lineId: string, notes: string) => void;
  applyItemRemise: (lineId: string, remise: CartItemRemise | undefined) => void;
  applyRemise: (type: "POURCENTAGE" | "MONTANT_FIXE", valeur: number) => void;
  clearRemise: () => void;
  setTypeVente: (type: "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER") => void;
  setTable: (tableId: string | undefined, table?: CartTable, couverts?: number) => void;
  setClient: (clientId: string | undefined, client?: CartClient) => void;
  setDeliveryInfo: (info: { adresseLivraison?: string; telephoneLivraison?: string; notesLivraison?: string }) => void;
  clearDeliveryInfo: () => void;
  clearCart: () => void;
  calculateTotals: () => void;
  // Quantite pre-selectionnee
  pendingQuantity: number | null;
  setPendingQuantity: (qty: number | null) => void;
  // Mise en attente / Mise en compte
  venteEnAttenteTable: VenteEnAttenteInfo | null;
  setVenteEnAttenteTable: (vente: VenteEnAttenteInfo | null) => void;
  canMettreEnAttente: () => boolean;
  canMettreEnCompte: () => boolean;
  getCreditDisponible: () => number | null;
}

const initialState: CartState & { pendingQuantity: number | null; venteEnAttenteTable: VenteEnAttenteInfo | null } = {
  items: [],
  sousTotal: 0,
  totalTva: 0,
  totalRemise: 0,
  totalFinal: 0,
  typeVente: "DIRECT",
  pendingQuantity: null,
  venteEnAttenteTable: null,
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addItem: (item, quantity) => {
        const items = get().items;
        const pendingQty = get().pendingQuantity;
        const qtyToAdd = quantity ?? pendingQty ?? 1;

        // Reset pending quantity after use
        if (pendingQty !== null) {
          set({ pendingQuantity: null });
        }

        // Chercher un item existant SANS supplements
        const existingItemIndex = items.findIndex(
          (i) => i.produitId === item.produitId && (!i.supplements || i.supplements.length === 0)
        );

        if (existingItemIndex >= 0) {
          // Si le produit existe deja sans supplements, on augmente la quantite
          const existingLineId = items[existingItemIndex].lineId;
          if (existingLineId) {
            get().updateQuantity(existingLineId, items[existingItemIndex].quantite + qtyToAdd);
          }
        } else {
          // Sinon, on ajoute le nouveau produit
          const baseTotal = item.prixUnitaire * qtyToAdd;
          const newItem: CartItem = {
            ...item,
            lineId: crypto.randomUUID(),
            quantite: qtyToAdd,
            sousTotal: baseTotal,
            montantTva: calculerTVA(baseTotal, item.produit.tauxTva),
            total: calculerTTC(baseTotal, item.produit.tauxTva),
          };

          set({ items: [...items, newItem] });
          get().calculateTotals();
        }
      },

      addItemWithSupplements: (item, supplements, quantity) => {
        const items = get().items;
        const pendingQty = get().pendingQuantity;
        const qtyToAdd = quantity ?? pendingQty ?? 1;

        // Reset pending quantity after use
        if (pendingQty !== null) {
          set({ pendingQuantity: null });
        }

        // Calculer le total des supplements
        const totalSupplements = supplements.reduce((acc, s) => acc + s.prix, 0);

        // Prix unitaire avec supplements
        const prixAvecSupplements = item.prixUnitaire + totalSupplements;
        const baseTotal = prixAvecSupplements * qtyToAdd;

        const newItem: CartItem = {
          ...item,
          lineId: crypto.randomUUID(),
          quantite: qtyToAdd,
          supplements: supplements.map((s) => ({ nom: s.nom, prix: s.prix })),
          totalSupplements,
          sousTotal: baseTotal,
          montantTva: calculerTVA(baseTotal, item.produit.tauxTva),
          total: calculerTTC(baseTotal, item.produit.tauxTva),
        };

        set({ items: [...items, newItem] });
        get().calculateTotals();
      },

      removeItem: (lineId) => {
        set({ items: get().items.filter((item) => item.lineId !== lineId) });
        get().calculateTotals();
      },

      updateQuantity: (lineId, quantite) => {
        if (quantite <= 0) {
          get().removeItem(lineId);
          return;
        }

        const items = get().items.map((item) => {
          if (item.lineId === lineId) {
            // Calculer le prix unitaire avec supplements
            const prixAvecSupplements = item.prixUnitaire + (item.totalSupplements || 0);
            const sousTotalBrut = prixAvecSupplements * quantite;

            // Calculer la remise par ligne si elle existe
            let remiseLigne = 0;
            if (item.remiseLigne) {
              if (item.remiseLigne.type === "POURCENTAGE") {
                remiseLigne = Math.round((sousTotalBrut * item.remiseLigne.valeur) / 100);
              } else {
                remiseLigne = item.remiseLigne.valeur;
              }
            }

            const sousTotal = sousTotalBrut - remiseLigne;
            const montantTva = calculerTVA(sousTotal, item.produit.tauxTva);
            const total = sousTotal + montantTva;

            return {
              ...item,
              quantite,
              sousTotal,
              montantTva,
              total,
              montantRemiseLigne: remiseLigne,
            };
          }
          return item;
        });

        set({ items });
        get().calculateTotals();
      },

      updateNotes: (lineId, notes) => {
        set({
          items: get().items.map((item) =>
            item.lineId === lineId ? { ...item, notes } : item
          ),
        });
      },

      applyItemRemise: (lineId, remise) => {
        const items = get().items.map((item) => {
          if (item.lineId === lineId) {
            // Calculer le prix unitaire avec supplements
            const prixAvecSupplements = item.prixUnitaire + (item.totalSupplements || 0);
            const sousTotalBrut = prixAvecSupplements * item.quantite;

            // Calculer la remise par ligne
            let remiseLigne = 0;
            if (remise) {
              if (remise.type === "POURCENTAGE") {
                remiseLigne = Math.round((sousTotalBrut * remise.valeur) / 100);
              } else {
                remiseLigne = remise.valeur;
              }
            }

            const sousTotal = sousTotalBrut - remiseLigne;
            const montantTva = calculerTVA(sousTotal, item.produit.tauxTva);
            const total = sousTotal + montantTva;

            return {
              ...item,
              remiseLigne: remise,
              montantRemiseLigne: remiseLigne,
              sousTotal,
              montantTva,
              total,
            };
          }
          return item;
        });

        set({ items });
        get().calculateTotals();
      },

      setPendingQuantity: (qty) => {
        set({ pendingQuantity: qty });
      },

      applyRemise: (type, valeur) => {
        set({ remise: { type, valeur } });
        get().calculateTotals();
      },

      clearRemise: () => {
        set({ remise: undefined, totalRemise: 0 });
        get().calculateTotals();
      },

      setTypeVente: (type) => {
        set({ typeVente: type });
        // Clear mode-specific data when changing type
        if (type !== "TABLE") {
          set({ tableId: undefined, table: undefined });
        }
        if (type !== "LIVRAISON") {
          set({ adresseLivraison: undefined, telephoneLivraison: undefined, notesLivraison: undefined });
        }
      },

      setTable: (tableId, table, couverts) => {
        set({
          tableId,
          table: table ? { ...table, couverts } : undefined
        });
      },

      setClient: (clientId, client) => {
        set({ clientId, client });
      },

      setDeliveryInfo: (info) => {
        set({
          adresseLivraison: info.adresseLivraison,
          telephoneLivraison: info.telephoneLivraison,
          notesLivraison: info.notesLivraison,
        });
      },

      clearDeliveryInfo: () => {
        set({
          adresseLivraison: undefined,
          telephoneLivraison: undefined,
          notesLivraison: undefined,
        });
      },

      clearCart: () => {
        set(initialState);
      },

      calculateTotals: () => {
        const { items, remise } = get();

        // Calcul du sous-total et TVA
        const sousTotal = items.reduce((acc, item) => acc + item.sousTotal, 0);
        const totalTva = items.reduce((acc, item) => acc + item.montantTva, 0);

        // Calcul de la remise
        let totalRemise = 0;
        if (remise) {
          if (remise.type === "POURCENTAGE") {
            totalRemise = Math.round((sousTotal * remise.valeur) / 100);
          } else {
            totalRemise = remise.valeur;
          }
        }

        // Total final
        const totalFinal = sousTotal + totalTva - totalRemise;

        set({
          sousTotal,
          totalTva,
          totalRemise,
          totalFinal: Math.max(0, totalFinal), // Ne peut pas être négatif
        });
      },

      // Mise en attente / Mise en compte
      setVenteEnAttenteTable: (vente) => {
        set({ venteEnAttenteTable: vente });
      },

      canMettreEnAttente: () => {
        const { typeVente, items, tableId } = get();
        // Disponible pour TABLE, LIVRAISON, EMPORTER (pas DIRECT)
        if (typeVente === "DIRECT") return false;
        // Doit avoir des articles
        if (items.length === 0) return false;
        // Pour TABLE, une table doit être sélectionnée
        if (typeVente === "TABLE" && !tableId) return false;
        return true;
      },

      canMettreEnCompte: () => {
        const { client, totalFinal } = get();
        // Doit avoir un client
        if (!client) return false;
        // Le client doit avoir le crédit autorisé
        if (!client.creditAutorise) return false;
        // Vérifier le crédit disponible
        const limiteCredit = client.limitCredit ?? 0;
        const soldeActuel = client.soldeCredit ?? 0;
        const creditDisponible = limiteCredit - soldeActuel;
        return creditDisponible >= totalFinal;
      },

      getCreditDisponible: () => {
        const { client } = get();
        if (!client || !client.creditAutorise) return null;
        const limiteCredit = client.limitCredit ?? 0;
        const soldeActuel = client.soldeCredit ?? 0;
        return limiteCredit - soldeActuel;
      },
    }),
    {
      name: "cart-storage",
      version: 1,
      // Ne persister que certains champs
      partialize: (state) => ({
        items: state.items,
        remise: state.remise,
        typeVente: state.typeVente,
        tableId: state.tableId,
        table: state.table,
        clientId: state.clientId,
        client: state.client,
        adresseLivraison: state.adresseLivraison,
        telephoneLivraison: state.telephoneLivraison,
        notesLivraison: state.notesLivraison,
      }),
      // Migration pour garantir que tous les items ont un lineId
      migrate: (persistedState, version) => {
        const state = persistedState as CartState & { pendingQuantity?: number | null };
        if (version === 0 && state.items) {
          state.items = state.items.map((item) => ({
            ...item,
            lineId: item.lineId || crypto.randomUUID(),
          }));
        }
        // Return a complete CartState
        return {
          items: state.items || [],
          remise: state.remise,
          typeVente: state.typeVente || "DIRECT",
          tableId: state.tableId,
          table: state.table,
          clientId: state.clientId,
          client: state.client,
          adresseLivraison: state.adresseLivraison,
          telephoneLivraison: state.telephoneLivraison,
          notesLivraison: state.notesLivraison,
        };
      },
    }
  )
);
