import React, { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useBiometricHitl } from "../../hooks/useBiometricHitl";
import { confirmBiometricApproval, getAccessToken } from "../../lib/api";
import { MobileConfig } from "../../lib/config";
import { formatZarCents } from "../../lib/money";
import { SaharaColors, SaharaRadii, SaharaSpacing } from "../../theme/tokens";

interface StagedTurn {
  active_agent: "Jabu" | "Kagiso" | "Thabo";
  telemetry_logs: string[];
  assistant_message: string;
  genui_card_type: string | null;
  genui_payload: Record<string, unknown> | null;
}

/**
 * Screens 05–08 Foundation — Sahara Copilot & Biometric HITL Surface
 */
export default function CopilotScreen(): React.JSX.Element {
  const [prompt, setPrompt] = useState("Send R1,500 to my mom for groceries via PayShap");
  const [turn, setTurn] = useState<StagedTurn | null>(null);
  const [receiptMessage, setReceiptMessage] = useState<string | null>(null);
  const { requestBiometricClearance, verifying } = useBiometricHitl();

  async function sendTurn() {
    setReceiptMessage(null);
    const token = await getAccessToken();
    const res = await fetch(`${MobileConfig.apiBaseUrl}/copilotkit/turn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: prompt }),
    });
    if (res.ok) {
      setTurn((await res.json()) as StagedTurn);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.kicker}>SAHARA COPILOT · AG-UI + BIOMETRIC HITL</Text>
        <Text style={styles.title}>Ask Jabu, Kagiso, or Thabo</Text>

        <View style={styles.composer}>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            style={styles.input}
            multiline
            placeholder="Ask about SA inflation, audit debit orders, or stage a PayShap payment..."
          />
          <Pressable style={styles.sendBtn} onPress={() => void sendTurn()}>
            <Text style={styles.sendBtnText}>Send to Copilot</Text>
          </Pressable>
        </View>

        {turn ? (
          <View style={styles.responseCard}>
            <Text style={styles.agentChip}>ACTIVE AGENT: {turn.active_agent}</Text>
            {turn.telemetry_logs.map((log) => (
              <Text key={log} style={styles.telemetry}>
                • {log}
              </Text>
            ))}
            <Text style={styles.message}>{turn.assistant_message}</Text>

            {turn.genui_card_type === "v1.BiometricClearanceGate" && turn.genui_payload ? (
              <View style={styles.hitlBox}>
                <Text style={styles.agentChip}>SCREEN 07 · PENDING BIOMETRIC CLEARANCE</Text>
                <Text style={styles.hitlAmount}>
                  {formatZarCents(Number(turn.genui_payload.amount_cents ?? 0))}
                </Text>
                <Pressable
                  disabled={verifying}
                  style={styles.sendBtn}
                  onPress={async () => {
                    const approvalId = String(turn.genui_payload?.approval_id ?? "");
                    const recipientName = String(
                      turn.genui_payload?.beneficiary_name ?? "Beneficiary",
                    );
                    const amountCents = Number(turn.genui_payload?.amount_cents ?? 0);
                    const bio = await requestBiometricClearance({ amountCents, recipientName });
                    if (!bio.authorized || !bio.attestationId) {
                      setReceiptMessage(bio.reason ?? "Biometric check cancelled.");
                      return;
                    }
                    const settled = await confirmBiometricApproval({
                      approvalId,
                      decision: "APPROVE",
                      biometricAttestationId: bio.attestationId,
                    });
                    setReceiptMessage(settled.whatsapp_receipt_text);
                  }}
                >
                  <Text style={styles.sendBtnText}>
                    {verifying ? "Awaiting BiometricPrompt..." : "Authorize with Biometrics"}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {receiptMessage ? <Text style={styles.receipt}>{receiptMessage}</Text> : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SaharaColors.background,
  },
  container: {
    padding: SaharaSpacing.gutterMobile,
    gap: SaharaSpacing.md,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: SaharaColors.primary,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: SaharaColors.onSurface,
  },
  composer: {
    backgroundColor: SaharaColors.surfaceContainerLowest,
    padding: SaharaSpacing.md,
    borderRadius: SaharaRadii.lg,
    borderWidth: 1,
    borderColor: SaharaColors.outlineVariant,
    gap: SaharaSpacing.sm,
  },
  input: {
    minHeight: 64,
    fontSize: 15,
    color: SaharaColors.onSurface,
  },
  sendBtn: {
    backgroundColor: SaharaColors.primary,
    paddingVertical: 13,
    borderRadius: SaharaRadii.md,
    alignItems: "center",
  },
  sendBtnText: {
    color: SaharaColors.onPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  responseCard: {
    backgroundColor: SaharaColors.surfaceContainerLow,
    padding: SaharaSpacing.md,
    borderRadius: SaharaRadii.lg,
    gap: SaharaSpacing.sm,
  },
  agentChip: {
    fontSize: 11,
    fontWeight: "700",
    color: SaharaColors.primary,
  },
  telemetry: {
    fontSize: 12,
    color: SaharaColors.outline,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: SaharaColors.onSurface,
  },
  hitlBox: {
    backgroundColor: SaharaColors.surfaceContainerLowest,
    padding: SaharaSpacing.md,
    borderRadius: SaharaRadii.md,
    borderWidth: 1,
    borderColor: SaharaColors.primary,
    gap: SaharaSpacing.sm,
  },
  hitlAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: SaharaColors.onSurface,
  },
  receipt: {
    fontSize: 13,
    fontWeight: "600",
    color: SaharaColors.success,
  },
});
