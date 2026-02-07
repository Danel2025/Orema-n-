import { Suspense } from "react";
import { Box, Flex, Heading, Text, Card, Skeleton } from "@radix-ui/themes";
import { Settings } from "lucide-react";

import {
  getEtablissementInfo,
  getFiscalSettings,
  getImprimantesWithCategories,
  getZonesLivraison,
  getCaisseVentesSettings,
  getStockSettings,
  getSecuriteSettings,
  getFideliteSettings,
  getPlanSalleSettings,
  getDataStatistics,
  getParametresFacture,
} from "@/actions/parametres";
import { listBackups, getBackupStats } from "@/actions/backup";

import {
  EtablissementSettings,
  FiscalSettings,
  PrinterSettings,
  AppearanceSettings,
  DeliverySettings,
  CaisseVentesSettings,
  StockSettings,
  SecuriteSettings,
  FideliteSettings,
  PlanSalleSettings,
  DataSettings,
  ParametresTabs,
  TabContent,
} from "@/components/parametres";
import { InvoiceSettings } from "@/components/parametres/invoice-settings";

// Composant de chargement
function SettingsLoading() {
  return (
    <Card size="3">
      <Flex direction="column" gap="4">
        <Skeleton height="24px" width="200px" />
        <Skeleton height="80px" />
        <Skeleton height="80px" />
        <Skeleton height="48px" width="180px" />
      </Flex>
    </Card>
  );
}

// Server Component pour charger les donnees de l'etablissement
async function EtablissementSettingsLoader() {
  const etablissement = await getEtablissementInfo();

  return (
    <EtablissementSettings
      initialData={{
        id: etablissement.id,
        nom: etablissement.nom,
        adresse: etablissement.adresse,
        telephone: etablissement.telephone,
        email: etablissement.email,
        nif: etablissement.nif,
        rccm: etablissement.rccm,
        logo: etablissement.logo,
        messageTicket: etablissement.messageTicket,
      }}
    />
  );
}

// Server Component pour charger les parametres fiscaux
async function FiscalSettingsLoader() {
  const fiscalSettings = await getFiscalSettings();

  return <FiscalSettings initialData={fiscalSettings} />;
}

// Server Component pour charger les imprimantes
async function PrinterSettingsLoader() {
  const imprimantes = await getImprimantesWithCategories();

  return <PrinterSettings initialData={imprimantes} />;
}

// Server Component pour charger les zones de livraison
async function DeliverySettingsLoader() {
  const zones = await getZonesLivraison();

  return (
    <DeliverySettings
      initialData={zones.map((z) => ({
        id: z.id,
        nom: z.nom,
        description: z.description,
        couleur: z.couleur,
        ordre: z.ordre,
        active: z.active,
        frais_livraison: z.frais_livraison,
        delai_estime: z.delai_estime,
      }))}
    />
  );
}

// Server Component pour charger les parametres de caisse
async function CaisseVentesSettingsLoader() {
  const settings = await getCaisseVentesSettings();

  return <CaisseVentesSettings initialData={settings} />;
}

// Server Component pour charger les parametres de stock
async function StockSettingsLoader() {
  const settings = await getStockSettings();

  return <StockSettings initialData={settings} />;
}

// Server Component pour charger les parametres de securite
async function SecuriteSettingsLoader() {
  const settings = await getSecuriteSettings();

  return <SecuriteSettings initialData={settings} />;
}

// Server Component pour charger les parametres de fidelite
async function FideliteSettingsLoader() {
  const settings = await getFideliteSettings();

  return <FideliteSettings initialData={settings} />;
}

// Server Component pour charger les parametres du plan de salle
async function PlanSalleSettingsLoader() {
  const settings = await getPlanSalleSettings();

  return <PlanSalleSettings initialData={settings} />;
}

// Server Component pour charger les parametres de facture
async function InvoiceSettingsLoader() {
  const settings = await getParametresFacture();

  return <InvoiceSettings initialData={settings} />;
}

// Server Component pour charger les statistiques de donnees et backups
async function DataSettingsLoader() {
  const [statsResult, backupsResult, backupStatsResult] = await Promise.all([
    getDataStatistics(),
    listBackups(),
    getBackupStats(),
  ]);

  const stats = statsResult.success ? statsResult.data : {};
  const backups = backupsResult.success ? backupsResult.data : [];
  const backupStats = backupStatsResult.success ? backupStatsResult.data : {};

  return (
    <DataSettings
      initialStats={stats}
      initialBackups={backups}
      initialBackupStats={backupStats}
    />
  );
}

export default function ParametresPage() {
  return (
    <Box>
      {/* En-tete */}
      <Flex justify="between" align="center" mb="6">
        <Box>
          <Flex align="center" gap="2" mb="1">
            <Settings size={28} style={{ color: "var(--accent-9)" }} />
            <Heading size="7" weight="bold">
              Parametres
            </Heading>
          </Flex>
          <Text size="3" color="gray">
            Configuration de l'etablissement et du systeme
          </Text>
        </Box>
      </Flex>

      {/* Onglets de parametres - Composant client pour éviter erreur d'hydratation */}
      <ParametresTabs>
        {/* Contenu: Etablissement */}
        <TabContent value="etablissement">
          <Suspense fallback={<SettingsLoading />}>
            <EtablissementSettingsLoader />
          </Suspense>
        </TabContent>

        {/* Contenu: Fiscalite */}
        <TabContent value="fiscalite">
          <Suspense fallback={<SettingsLoading />}>
            <FiscalSettingsLoader />
          </Suspense>
        </TabContent>

        {/* Contenu: Caisse & Ventes */}
        <TabContent value="caisse">
          <Suspense fallback={<SettingsLoading />}>
            <CaisseVentesSettingsLoader />
          </Suspense>
        </TabContent>

        {/* Contenu: Stocks */}
        <TabContent value="stocks">
          <Suspense fallback={<SettingsLoading />}>
            <StockSettingsLoader />
          </Suspense>
        </TabContent>

        {/* Contenu: Fidelite */}
        <TabContent value="fidelite">
          <Suspense fallback={<SettingsLoading />}>
            <FideliteSettingsLoader />
          </Suspense>
        </TabContent>

        {/* Contenu: Imprimantes */}
        <TabContent value="imprimantes">
          <Suspense fallback={<SettingsLoading />}>
            <PrinterSettingsLoader />
          </Suspense>
        </TabContent>

        {/* Contenu: Factures */}
        <TabContent value="factures">
          <Suspense fallback={<SettingsLoading />}>
            <InvoiceSettingsLoader />
          </Suspense>
        </TabContent>

        {/* Contenu: Zones de livraison */}
        <TabContent value="livraison">
          <Suspense fallback={<SettingsLoading />}>
            <DeliverySettingsLoader />
          </Suspense>
        </TabContent>

        {/* Contenu: Plan de salle */}
        <TabContent value="plan-salle">
          <Suspense fallback={<SettingsLoading />}>
            <PlanSalleSettingsLoader />
          </Suspense>
        </TabContent>

        {/* Contenu: Securite */}
        <TabContent value="securite">
          <Suspense fallback={<SettingsLoading />}>
            <SecuriteSettingsLoader />
          </Suspense>
        </TabContent>

        {/* Contenu: Donnees (import/export, remise a zero) */}
        <TabContent value="donnees">
          <Suspense fallback={<SettingsLoading />}>
            <DataSettingsLoader />
          </Suspense>
        </TabContent>

        {/* Contenu: Apparence */}
        <TabContent value="apparence">
          <AppearanceSettings />
        </TabContent>
      </ParametresTabs>
    </Box>
  );
}
