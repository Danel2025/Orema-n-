"use client";

/**
 * Page Produits - Gestion des catégories et produits
 */

import { useState } from "react";
import { Package, FolderOpen } from "lucide-react";
import { CategoryList } from "@/components/categories";
import { ProductList } from "@/components/produits";

type Tab = "categories" | "produits";

export default function ProduitsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("produits");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "produits", label: "Produits", icon: <Package size={18} /> },
    { id: "categories", label: "Catégories", icon: <FolderOpen size={18} /> },
  ];

  return (
    <div>
      {/* En-tête */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "var(--gray-12)",
            margin: 0,
          }}
        >
          Produits
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "var(--gray-11)",
            marginTop: 8,
          }}
        >
          Gérez vos produits et catégories
        </p>
      </div>

      {/* Onglets */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 24,
          borderBottom: "1px solid var(--gray-a6)",
          paddingBottom: 0,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: activeTab === tab.id ? 600 : 500,
              color: activeTab === tab.id ? "var(--accent-11)" : "var(--gray-11)",
              backgroundColor: "transparent",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid var(--accent-9)" : "2px solid transparent",
              marginBottom: -1,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {activeTab === "produits" && <ProductList />}
      {activeTab === "categories" && <CategoryList />}
    </div>
  );
}
