import { Suspense } from "react";
import { Box, Flex, Heading, Text, Tabs, Skeleton, Grid } from "@radix-ui/themes";
import { BarChart3, TrendingUp, Users, Clock, CreditCard, FileText, Receipt } from "lucide-react";
import { getKPIs } from "@/actions/rapports";
import {
  KPICards,
  CAChart,
  TopProducts,
  PeakHoursChart,
  PaymentModesChart,
  SalesByType,
  SalesByEmployee,
  RapportZDisplay,
  HistoriqueFactures,
} from "@/components/rapports";

// Composants de chargement
function KPICardsLoading() {
  return (
    <Grid columns={{ initial: "1", sm: "2", lg: "3", xl: "6" }} gap="4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} height="140px" style={{ borderRadius: 12 }} />
      ))}
    </Grid>
  );
}

function ChartLoading() {
  return <Skeleton height="400px" style={{ borderRadius: 12 }} />;
}

// Composant KPIs avec fetch serveur
async function KPICardsServer() {
  const kpis = await getKPIs();
  return <KPICards kpis={kpis} />;
}

export default function RapportsPage() {
  return (
    <Box>
      {/* Header */}
      <Flex justify="between" align="center" mb="6">
        <Box>
          <Heading size="7" weight="bold" mb="1">
            Rapports
          </Heading>
          <Text size="3" color="gray">
            Statistiques et analyses de ventes
          </Text>
        </Box>
      </Flex>

      {/* KPIs */}
      <Box mb="6">
        <Suspense fallback={<KPICardsLoading />}>
          <KPICardsServer />
        </Suspense>
      </Box>

      {/* Onglets */}
      <Tabs.Root defaultValue="dashboard">
        <Tabs.List mb="4">
          <Tabs.Trigger value="dashboard">
            <Flex align="center" gap="2">
              <BarChart3 size={16} />
              Dashboard
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="factures">
            <Flex align="center" gap="2">
              <Receipt size={16} />
              Factures
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="ventes">
            <Flex align="center" gap="2">
              <TrendingUp size={16} />
              Ventes
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="produits">
            <Flex align="center" gap="2">
              <BarChart3 size={16} />
              Produits
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="employes">
            <Flex align="center" gap="2">
              <Users size={16} />
              Employes
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="rapports-z">
            <Flex align="center" gap="2">
              <FileText size={16} />
              Rapports Z
            </Flex>
          </Tabs.Trigger>
        </Tabs.List>

        {/* Dashboard */}
        <Tabs.Content value="dashboard">
          <Grid columns={{ initial: "1", lg: "2" }} gap="4">
            {/* CA par periode */}
            <Box style={{ gridColumn: "1 / -1" }}>
              <Suspense fallback={<ChartLoading />}>
                <CAChart />
              </Suspense>
            </Box>

            {/* Heures de pointe */}
            <Suspense fallback={<ChartLoading />}>
              <PeakHoursChart />
            </Suspense>

            {/* Modes de paiement */}
            <Suspense fallback={<ChartLoading />}>
              <PaymentModesChart />
            </Suspense>
          </Grid>
        </Tabs.Content>

        {/* Factures */}
        <Tabs.Content value="factures">
          <HistoriqueFactures />
        </Tabs.Content>

        {/* Ventes */}
        <Tabs.Content value="ventes">
          <Grid columns={{ initial: "1", lg: "2" }} gap="4">
            {/* Ventes par type */}
            <Suspense fallback={<ChartLoading />}>
              <SalesByType />
            </Suspense>

            {/* Modes de paiement */}
            <Suspense fallback={<ChartLoading />}>
              <PaymentModesChart />
            </Suspense>

            {/* CA par periode - pleine largeur */}
            <Box style={{ gridColumn: "1 / -1" }}>
              <Suspense fallback={<ChartLoading />}>
                <CAChart />
              </Suspense>
            </Box>
          </Grid>
        </Tabs.Content>

        {/* Produits */}
        <Tabs.Content value="produits">
          <Grid columns={{ initial: "1", lg: "2" }} gap="4">
            {/* Top produits */}
            <Suspense fallback={<ChartLoading />}>
              <TopProducts />
            </Suspense>

            {/* Heures de pointe */}
            <Suspense fallback={<ChartLoading />}>
              <PeakHoursChart />
            </Suspense>
          </Grid>
        </Tabs.Content>

        {/* Employes */}
        <Tabs.Content value="employes">
          <Grid columns={{ initial: "1" }} gap="4">
            <Suspense fallback={<ChartLoading />}>
              <SalesByEmployee />
            </Suspense>
          </Grid>
        </Tabs.Content>

        {/* Rapports Z */}
        <Tabs.Content value="rapports-z">
          <Grid columns={{ initial: "1" }} gap="4">
            <Suspense fallback={<ChartLoading />}>
              <RapportZDisplay />
            </Suspense>
          </Grid>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
