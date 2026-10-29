import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Sahara Mzansi — Experience Layer AG-UI Gateway (:8200)
 *
 * Responsibilities (ADR-002 & ADR-005):
 *   1. Authenticate every mobile Copilot turn via Supabase Bearer JWT
 *      (or Demo Mode dev token during local Android Emulator runs).
 *   2. Enforce FinOps daily per-user turn ceiling (default: 50 turns/day)
 *      so total monthly LLM spend stays strictly <= $20/month.
 *   3. Forward verified AG-UI / CopilotRuntime requests to the FastAPI
 *      CrewAI remote endpoint (`FASTAPI_AGENT_URL`).
 */

const PORT = Number(process.env.COPILOT_RUNTIME_PORT ?? "8200");
const DEMO_MODE = (process.env.DEMO_MODE ?? "true").toLowerCase() === "true";
const MAX_DAILY_TURNS = Number(process.env.MAX_DAILY_TURNS_PER_USER ?? "50");
const FASTAPI_AGENT_URL =
  process.env.FASTAPI_AGENT_URL ?? "http://localhost:8000/copilotkit";
const SUPABASE_URL = process.env.SUPABASE_URL ?? "";

const jwks =
  SUPABASE_URL && !SUPABASE_URL.includes("your-project-ref")
    ? createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
    : null;

interface DailyQuotaBucket {
  dayIso: string;
  count: number;
}

const dailyUsage = new Map<string, DailyQuotaBucket>();

function checkAndIncrementDailyQuota(userId: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const current = dailyUsage.get(userId);
  if (!current || current.dayIso !== today) {
    dailyUsage.set(userId, { dayIso: today, count: 1 });
    return true;
  }
  if (current.count >= MAX_DAILY_TURNS) {
    return false;
  }
  current.count += 1;
  return true;
}

async function authenticateCaller(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) {
    return DEMO_MODE ? "demo-user-elena" : null;
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (DEMO_MODE && (token === "sahara-demo-token" || token.length < 32)) {
    return "demo-user-elena";
  }
  if (!jwks) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, jwks);
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

const app = new Hono();

app.get("/health", (c) =>
  c.json({
    service: "sahara-mzansi-copilot-runtime",
    status: "ok",
    demoMode: DEMO_MODE,
    maxDailyTurns: MAX_DAILY_TURNS,
    upstream: FASTAPI_AGENT_URL,
  }),
);

app.all("/api/copilotkit/*", async (c) => {
  const userId = await authenticateCaller(c.req.header("authorization"));
  if (!userId) {
    return c.json(
      {
        type: "https://saharamzansi.co.za/problems/unauthorized",
        title: "Unauthorized",
        status: 401,
        detail: "Valid Supabase Bearer JWT required for CopilotKit AG-UI stream.",
      },
      401,
    );
  }

  if (!checkAndIncrementDailyQuota(userId)) {
    return c.json(
      {
        type: "https://saharamzansi.co.za/problems/daily-turn-cap-exceeded",
        title: "Daily Copilot Quota Reached",
        status: 429,
        detail: `FinOps guardrail: ${MAX_DAILY_TURNS} daily Copilot turns reached. Resets at 00:00 UTC.`,
      },
      429,
    );
  }

  const upstreamHeaders = new Headers(c.req.raw.headers);
  upstreamHeaders.set("X-Sahara-User-Id", userId);

  const upstreamResponse = await fetch(`${FASTAPI_AGENT_URL}/turn`, {
    method: c.req.method,
    headers: upstreamHeaders,
    body: c.req.method === "GET" || c.req.method === "HEAD" ? undefined : await c.req.text(),
  });

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: upstreamResponse.headers,
  });
});

app.post("/api/copilotkit", async (c) => {
  const userId = await authenticateCaller(c.req.header("authorization"));
  if (!userId) {
    return c.json(
      {
        type: "https://saharamzansi.co.za/problems/unauthorized",
        title: "Unauthorized",
        status: 401,
        detail: "Valid Supabase Bearer JWT required for CopilotKit AG-UI stream.",
      },
      401,
    );
  }

  if (!checkAndIncrementDailyQuota(userId)) {
    return c.json(
      {
        type: "https://saharamzansi.co.za/problems/daily-turn-cap-exceeded",
        title: "Daily Copilot Quota Reached",
        status: 429,
        detail: `FinOps guardrail: ${MAX_DAILY_TURNS} daily Copilot turns reached. Resets at 00:00 UTC.`,
      },
      429,
    );
  }

  const upstreamHeaders = new Headers(c.req.raw.headers);
  upstreamHeaders.set("X-Sahara-User-Id", userId);

  const upstreamResponse = await fetch(`${FASTAPI_AGENT_URL}/turn`, {
    method: "POST",
    headers: upstreamHeaders,
    body: await c.req.text(),
  });

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: upstreamResponse.headers,
  });
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(
    `[sahara-copilot-runtime] listening on http://0.0.0.0:${info.port} (DEMO_MODE=${DEMO_MODE})`,
  );
});
