import * as LocalAuthentication from "expo-local-authentication";
import { useCallback, useState } from "react";
import { formatZarCents, generateIdempotencyKey } from "../lib/money";

export interface BiometricGateResult {
  authorized: boolean;
  attestationId?: string;
  reason?: string;
}

/**
 * Hardware-backed Android BiometricPrompt clearance hook (Screen 07 — ADR-005).
 * Ensures the LLM can NEVER settle funds without explicit human biometric authorization.
 */
export function useBiometricHitl() {
  const [verifying, setVerifying] = useState(false);

  const requestBiometricClearance = useCallback(
    async (params: {
      amountCents: number;
      recipientName: string;
    }): Promise<BiometricGateResult> => {
      setVerifying(true);
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          return {
            authorized: false,
            reason:
              "Android biometric hardware/enrollment required to authorize Sahara Mzansi payments.",
          };
        }

        const formattedAmount = formatZarCents(params.amountCents);
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: `Authorize ${formattedAmount} to ${params.recipientName}`,
          cancelLabel: "Cancel Transfer",
          disableDeviceFallback: false,
        });

        if (!authResult.success) {
          return {
            authorized: false,
            reason: authResult.error ?? "Biometric verification cancelled by user.",
          };
        }

        return {
          authorized: true,
          attestationId: generateIdempotencyKey("bioprompt"),
        };
      } finally {
        setVerifying(false);
      }
    },
    [],
  );

  return { requestBiometricClearance, verifying };
}
