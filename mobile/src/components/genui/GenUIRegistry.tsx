import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
// ADR-002: ALWAYS import from @copilotkit/react-native/headless (never the root barrel!)
import {
  ToolCallStatus,
  useFrontendTool,
  useRenderTool,
} from "@copilotkit/react-native/headless";
import { useBiometricHitl } from "../../hooks/useBiometricHitl";
import { confirmBiometricApproval } from "../../lib/api";
import { formatZarCents } from "../../lib/money";
import { SaharaColors, SaharaRadii, SaharaSpacing } from "../../theme/tokens";

export function UnknownComponentFallback({ toolName }: { toolName: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.badge}>GEN-UI COMPATIBILITY MODE</Text>
      <Text style={styles.title}>Unsupported Card ({toolName})</Text>
      <Text style={styles.body}>
        Update Sahara Mzansi Android to view the interactive layout for this step.
      </Text>
    </View>
  );
}

/**
 * Versioned v1 Native Generative UI Component Catalogue (Screens 05–08).
 * Registers native React Native `View`/`Text`/`Pressable` renderers over AG-UI.
 */
export function GenUIRegistry(): React.JSX.Element | null {
  const { requestBiometricClearance, verifying } = useBiometricHitl();

  // Screen 05 — Recipient & Rail Fee Literacy Card
  useRenderTool({
    name: "resolveRecipient",
    render: ({ status, args }: { status: ToolCallStatus; args: Record<string, unknown> }) => {
      if (status !== ToolCallStatus.Complete) {
        return (
          <View style={styles.card}>
            <ActivityIndicator color={SaharaColors.primary} />
            <Text style={styles.body}>Jabu is verifying ShapID & comparing rail fees...</Text>
          </View>
        );
      }
      return (
        <View style={styles.card}>
          <Text style={styles.badge}>SCREEN 05 · PAYSHAP PROXY VERIFIED</Text>
          <Text style={styles.title}>{String(args.displayName ?? "Verified Recipient")}</Text>
          <Text style={styles.body}>
            ShapID: {String(args.shapId ?? "verified@sahara.shap")} · PayShap Fee: R 0.00 (Saves R
            50.00 vs Instant EFT)
          </Text>
        </View>
      );
    },
  });

  // Screen 07 — Hardware Biometric HITL Clearance Gate
  useFrontendTool({
    name: "authorizeStagedTransfer",
    description:
      "Pauses execution until the human authorizes the PENDING_APPROVAL transfer via Android BiometricPrompt.",
    parameters: [
      { name: "approvalId", type: "string", required: true },
      { name: "recipientName", type: "string", required: true },
      { name: "amountCents", type: "number", required: true },
    ],
    render: ({
      status,
      args,
      respond,
    }: {
      status: ToolCallStatus;
      args: Record<string, unknown>;
      respond?: (result: string) => void;
    }) => {
      const approvalId = String(args.approvalId ?? "");
      const recipientName = String(args.recipientName ?? "Beneficiary");
      const amountCents = Number(args.amountCents ?? 0);

      if (status === ToolCallStatus.Complete) {
        return (
          <View style={[styles.card, styles.settledCard]}>
            <Text style={styles.badge}>SCREEN 08 · SETTLEMENT CONFIRMED</Text>
            <Text style={styles.title}>
              {formatZarCents(amountCents)} dispatched to {recipientName}
            </Text>
          </View>
        );
      }

      return (
        <View style={styles.card}>
          <Text style={styles.badge}>SCREEN 07 · BIOMETRIC CLEARANCE REQUIRED</Text>
          <Text style={styles.title}>{formatZarCents(amountCents)}</Text>
          <Text style={styles.body}>
            To: {recipientName} · Rail: PayShap (R 0.00 fee). Money never moves until you verify.
          </Text>
          <View style={styles.buttonRow}>
            <Pressable
              disabled={verifying}
              style={styles.primaryButton}
              onPress={async () => {
                const clearance = await requestBiometricClearance({
                  amountCents,
                  recipientName,
                });
                if (!clearance.authorized || !clearance.attestationId) {
                  respond?.("Rejected");
                  return;
                }
                await confirmBiometricApproval({
                  approvalId,
                  decision: "APPROVE",
                  biometricAttestationId: clearance.attestationId,
                });
                respond?.("Accepted");
              }}
            >
              <Text style={styles.primaryButtonText}>
                {verifying ? "Verifying Biometrics..." : "Authorize & Dispatch"}
              </Text>
            </Pressable>
            <Pressable
              disabled={verifying}
              style={styles.secondaryButton}
              onPress={async () => {
                await confirmBiometricApproval({
                  approvalId,
                  decision: "REJECT",
                });
                respond?.("Rejected");
              }}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      );
    },
  });

  return null;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SaharaColors.surfaceContainerLowest,
    borderRadius: SaharaRadii.lg,
    padding: SaharaSpacing.md,
    borderWidth: 1,
    borderColor: SaharaColors.outlineVariant,
    gap: SaharaSpacing.sm,
    marginVertical: SaharaSpacing.xs,
  },
  settledCard: {
    backgroundColor: SaharaColors.successContainer,
  },
  badge: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: SaharaColors.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: SaharaColors.onSurface,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: SaharaColors.onSurfaceVariant,
  },
  buttonRow: {
    flexDirection: "row",
    gap: SaharaSpacing.sm,
    marginTop: SaharaSpacing.xs,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: SaharaColors.primary,
    paddingVertical: 12,
    borderRadius: SaharaRadii.md,
    alignItems: "center",
  },
  primaryButtonText: {
    color: SaharaColors.onPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: SaharaRadii.md,
    backgroundColor: SaharaColors.surfaceContainerHigh,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: SaharaColors.onSurface,
    fontWeight: "600",
    fontSize: 14,
  },
});
