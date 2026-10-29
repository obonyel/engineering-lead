import * as SecureStore from "expo-secure-store";
import { MobileConfig } from "./config";
import { generateIdempotencyKey } from "./money";

const SESSION_TOKEN_KEY = "sahara_mzansi_access_token";

export interface PortfolioSummary {
  user_id: string;
  full_name: string;
  shap_id: string;
  total_net_worth_cents: number;
  passive_yield_harvested_cents: number;
  safe_float_zar_cents: number;
  accounts: Array<{
    id: string;
    account_type: "MAIN_TRANSACT" | "NOTICE_STASH" | "USD_VAULT";
    name: string;
    currency: string;
    balance_cents: number;
    apy_bps: number;
    status: string;
  }>;
  virtual_cards: Array<{
    id: string;
    card_token: string;
    last4: string;
    brand: string;
    frozen: boolean;
    daily_limit_cents: number;
  }>;
  vaults: Array<{
    id: string;
    name: string;
    category: string;
    target_cents: number;
    current_cents: number;
    apy_bps: number;
  }>;
  agent_alerts: Array<{
    agent_name: "Jabu" | "Kagiso" | "Thabo";
    headline: string;
    detail: string;
    suggested_prompt: string;
    potential_savings_cents: number;
  }>;
}

export async function getAccessToken(): Promise<string> {
  try {
    const stored = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
    if (stored) {
      return stored;
    }
  } catch {
    // Fallback during headless unit tests
  }
  return MobileConfig.demoMode ? "sahara-demo-token" : "";
}

export async function saveAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function fetchPortfolio(): Promise<PortfolioSummary> {
  const token = await getAccessToken();
  const res = await fetch(`${MobileConfig.apiBaseUrl}/v1/portfolio`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Portfolio fetch failed (${res.status})`);
  }
  return (await res.json()) as PortfolioSummary;
}

export async function confirmBiometricApproval(params: {
  approvalId: string;
  decision: "APPROVE" | "REJECT";
  biometricAttestationId?: string;
}) {
  const token = await getAccessToken();
  const idempotencyKey = generateIdempotencyKey("hitl");
  const res = await fetch(
    `${MobileConfig.apiBaseUrl}/v1/approvals/${params.approvalId}/confirm`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        decision: params.decision,
        biometric_attestation_id: params.biometricAttestationId ?? null,
      }),
    },
  );
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Approval confirmation failed (${res.status}): ${errBody}`);
  }
  return res.json();
}
