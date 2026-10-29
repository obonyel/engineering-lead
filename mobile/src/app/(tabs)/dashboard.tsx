import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fetchPortfolio, type PortfolioSummary } from "../../lib/api";
import { formatZarCents } from "../../lib/money";
import { SaharaColors, SaharaRadii, SaharaSpacing } from "../../theme/tokens";

/**
 * Screen 04 Foundation — Super App Wealth Dashboard
 * Connects to `/v1/portfolio` (`10.0.2.2:8000`) and renders integer-cent net worth,
 * Smart Wealth Vaults, and Mzansi Agent Fleet proactive alerts.
 */
export default function DashboardScreen(): React.JSX.Element {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortfolio()
      .then(setPortfolio)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Backend unreachable"),
      );
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.kicker}>SAHARA MZANSI · WEALTH DASHBOARD</Text>
        <Text style={styles.greeting}>
          Dumela, {portfolio?.full_name ?? "Elena Rostova"}
        </Text>

        <View style={styles.netWorthCard}>
          <Text style={styles.netWorthLabel}>TOTAL CONSOLIDATED NET WORTH</Text>
          <Text style={styles.netWorthValue}>
            {formatZarCents(portfolio?.total_net_worth_cents ?? 24_850_000, true)}
          </Text>
          <Text style={styles.yieldBadge}>
            +{formatZarCents(portfolio?.passive_yield_harvested_cents ?? 1_441_320)} passive yield
            harvested
          </Text>
        </View>

        {!portfolio && !error ? <ActivityIndicator color={SaharaColors.primary} /> : null}
        {error ? (
          <Text style={styles.offlineHint}>
            Local API hint ({error}): start FastAPI on :8000 to sync live Demo Mode state.
          </Text>
        ) : null}

        <Text style={styles.sectionTitle}>Mzansi Agent Fleet</Text>
        {(portfolio?.agent_alerts ?? []).map((alert) => (
          <Pressable
            key={alert.agent_name}
            style={styles.alertCard}
            onPress={() => router.push("/(tabs)/copilot")}
          >
            <Text style={styles.agentBadge}>AGENT {alert.agent_name.toUpperCase()}</Text>
            <Text style={styles.alertHeadline}>{alert.headline}</Text>
            <Text style={styles.alertDetail}>{alert.detail}</Text>
          </Pressable>
        ))}

        <Text style={styles.sectionTitle}>Smart Wealth Vaults</Text>
        {(portfolio?.vaults ?? []).map((vault) => (
          <View key={vault.id} style={styles.vaultRow}>
            <View>
              <Text style={styles.vaultName}>{vault.name}</Text>
              <Text style={styles.vaultMeta}>{(vault.apy_bps / 100).toFixed(2)}% APY</Text>
            </View>
            <Text style={styles.vaultAmount}>{formatZarCents(vault.current_cents)}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SaharaColors.background,
  },
  scroll: {
    padding: SaharaSpacing.gutterMobile,
    gap: SaharaSpacing.md,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: SaharaColors.primary,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: SaharaColors.onSurface,
  },
  netWorthCard: {
    backgroundColor: SaharaColors.primary,
    borderRadius: SaharaRadii.xl,
    padding: SaharaSpacing.lg,
    gap: SaharaSpacing.xs,
  },
  netWorthLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: SaharaColors.primaryFixed,
  },
  netWorthValue: {
    fontSize: 30,
    fontWeight: "700",
    color: SaharaColors.onPrimary,
  },
  yieldBadge: {
    fontSize: 13,
    color: SaharaColors.secondaryFixed,
    fontWeight: "600",
  },
  offlineHint: {
    fontSize: 12,
    color: SaharaColors.warning,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: SaharaColors.onSurface,
    marginTop: SaharaSpacing.xs,
  },
  alertCard: {
    backgroundColor: SaharaColors.surfaceContainerLowest,
    borderRadius: SaharaRadii.lg,
    padding: SaharaSpacing.md,
    borderWidth: 1,
    borderColor: SaharaColors.outlineVariant,
    gap: 4,
  },
  agentBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: SaharaColors.primary,
  },
  alertHeadline: {
    fontSize: 15,
    fontWeight: "700",
    color: SaharaColors.onSurface,
  },
  alertDetail: {
    fontSize: 13,
    lineHeight: 19,
    color: SaharaColors.onSurfaceVariant,
  },
  vaultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: SaharaColors.surfaceContainerLow,
    padding: SaharaSpacing.md,
    borderRadius: SaharaRadii.md,
  },
  vaultName: {
    fontSize: 15,
    fontWeight: "600",
    color: SaharaColors.onSurface,
  },
  vaultMeta: {
    fontSize: 12,
    color: SaharaColors.primary,
    fontWeight: "600",
  },
  vaultAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: SaharaColors.onSurface,
  },
});
