"use client";

/**
 * ParametresTabs - Composant client pour les onglets de paramètres
 * Évite les erreurs d'hydratation causées par Radix UI Tabs
 */

import { Tabs, Flex } from "@radix-ui/themes";
import {
  Building2,
  Calculator,
  Printer,
  Truck,
  Palette,
  ShoppingCart,
  Package,
  Shield,
  Gift,
  LayoutGrid,
  Database,
  Receipt,
} from "lucide-react";
import type { ReactNode } from "react";

interface TabItem {
  value: string;
  label: string;
  icon: ReactNode;
}

const tabItems: TabItem[] = [
  { value: "etablissement", label: "Etablissement", icon: <Building2 size={16} /> },
  { value: "fiscalite", label: "Fiscalité", icon: <Calculator size={16} /> },
  { value: "caisse", label: "Caisse & Ventes", icon: <ShoppingCart size={16} /> },
  { value: "stocks", label: "Stocks", icon: <Package size={16} /> },
  { value: "fidelite", label: "Fidélité", icon: <Gift size={16} /> },
  { value: "imprimantes", label: "Imprimantes", icon: <Printer size={16} /> },
  { value: "factures", label: "Factures", icon: <Receipt size={16} /> },
  { value: "livraison", label: "Livraison", icon: <Truck size={16} /> },
  { value: "plan-salle", label: "Plan de salle", icon: <LayoutGrid size={16} /> },
  { value: "securite", label: "Sécurité", icon: <Shield size={16} /> },
  { value: "donnees", label: "Données", icon: <Database size={16} /> },
  { value: "apparence", label: "Apparence", icon: <Palette size={16} /> },
];

interface ParametresTabsProps {
  children: ReactNode;
  defaultValue?: string;
}

export function ParametresTabs({ children, defaultValue = "etablissement" }: ParametresTabsProps) {
  return (
    <Tabs.Root defaultValue={defaultValue}>
      <Tabs.List mb="4" style={{ flexWrap: "wrap" }}>
        {tabItems.map((tab) => (
          <Tabs.Trigger key={tab.value} value={tab.value}>
            <Flex align="center" gap="2">
              {tab.icon}
              {tab.label}
            </Flex>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {children}
    </Tabs.Root>
  );
}

// Ré-exporter Tabs.Content pour simplifier l'utilisation
export const TabContent = Tabs.Content;
