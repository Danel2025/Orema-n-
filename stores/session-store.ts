import { create } from "zustand";
import type { Utilisateur, SessionCaisse } from "@/types";

interface SessionStore {
  // État
  user: Utilisateur | null;
  sessionCaisse: SessionCaisse | null;
  fondCaisse: number;

  // Actions
  setUser: (user: Utilisateur | null) => void;
  setSessionCaisse: (session: SessionCaisse | null) => void;
  setFondCaisse: (montant: number) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionStore>()((set) => ({
  // État initial
  user: null,
  sessionCaisse: null,
  fondCaisse: 0,

  // Actions
  setUser: (user) => set({ user }),
  setSessionCaisse: (session) => set({ sessionCaisse: session }),
  setFondCaisse: (montant) => set({ fondCaisse: montant }),
  clearSession: () =>
    set({
      user: null,
      sessionCaisse: null,
      fondCaisse: 0,
    }),
}));
