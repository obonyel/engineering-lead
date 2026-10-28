import { CopilotRuntime, EmptyAdapter, OpenAIAdapter, copilotRuntimeNextJSAppRouterEndpoint, type CopilotServiceAdapter } from "@copilotkit/runtime";
import OpenAI from "openai";
import type { NextRequest } from "next/server";
import { DemoAgent } from "@/lib/demo-adapter";

// The agent runtime lives server-side; the API key never reaches the browser.
// With OPENAI_API_KEY → a real LLM (OpenAIAdapter). Without → the offline DemoAgent.
const apiKey = process.env.OPENAI_API_KEY;
const serviceAdapter: CopilotServiceAdapter = apiKey
  ? new OpenAIAdapter({ openai: new OpenAI({ apiKey }), model: process.env.OPENAI_MODEL || "gpt-4o-mini" })
  : new EmptyAdapter();

const runtime = apiKey ? new CopilotRuntime() : new CopilotRuntime({ agents: { default: new DemoAgent() } });

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({ runtime, serviceAdapter, endpoint: "/api/copilotkit" });
  return handleRequest(req);
};
