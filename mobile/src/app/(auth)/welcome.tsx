import { router } from "expo-router";
import React from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { SaharaColors, SaharaRadii, SaharaSpacing } from "../../theme/tokens";

/**
 * Screen 01 Scaffold — Welcome & Mobile Auth Entrypoint
 * Phase 3 expands this into full +27 OTP, FICA 13-digit SA ID, and Virtual Card/ShapID setup.
 */
export default function WelcomeScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>SAHARA MZANSI · ANDROID SUPER APP</Text>
          <Text style={styles.headline}>
            Agentic Banking & Wealth Built to Protect Your Rands.
          </Text>
          <Text style={styles.subhead}>
            8.25% APY Notice Stashes, R 0.00 PayShap instant settlement, grounded SA financial
            literacy, and hardware biometric Human-in-the-Loop protection.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => router.replace("/(tabs)/dashboard")}
          >
            <Text style={styles.primaryBtnText}>Explore Demo Wealth Portfolio</Text>
          </Pressable>
          <Text style={styles.disclaimer}>
            Sandbox reference environment — simulated ZAR accounts & educational FAIS literacy.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SaharaColors.background,
  },
  container: {
    flex: 1,
    padding: SaharaSpacing.lg,
    justifyContent: "space-between",
  },
  heroCard: {
    marginTop: SaharaSpacing.xl,
    padding: SaharaSpacing.lg,
    borderRadius: SaharaRadii.xl,
    backgroundColor: SaharaColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: SaharaColors.outlineVariant,
    gap: SaharaSpacing.md,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: SaharaColors.primary,
  },
  headline: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "700",
    color: SaharaColors.onSurface,
  },
  subhead: {
    fontSize: 15,
    lineHeight: 22,
    color: SaharaColors.onSurfaceVariant,
  },
  actions: {
    gap: SaharaSpacing.sm,
  },
  primaryBtn: {
    backgroundColor: SaharaColors.primary,
    paddingVertical: 16,
    borderRadius: SaharaRadii.lg,
    alignItems: "center",
  },
  primaryBtnText: {
    color: SaharaColors.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  disclaimer: {
    textAlign: "center",
    fontSize: 12,
    color: SaharaColors.outline,
  },
});
