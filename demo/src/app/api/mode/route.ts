// Tells the client which copilot mode is active (never exposes the key).
export const dynamic = "force-dynamic";
export const GET = async () => Response.json({ mode: process.env.OPENAI_API_KEY ? "openai" : "demo" });
