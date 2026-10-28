// Offline "demo mode" agent. Used by the runtime when OPENAI_API_KEY is not set.
// It is a tiny rule-based stand-in for an LLM: it reads the last user message, picks a
// registered action (tool) and streams a tool call exactly like a real model would, so the
// full agentic flow (tool call → client handler → generative UI → follow-up text) runs unchanged.
import { randomUUID } from "node:crypto";
import { AbstractAgent, EventType, type BaseEvent, type RunAgentInput } from "@ag-ui/client";
import { Observable } from "rxjs";
import { CATEGORIES, PRODUCTS } from "./products";

interface Call { name: string; args: Record<string, unknown> }

function plan(text: string): { reply?: string; call?: Call } {
  const t = text.toLowerCase();
  const num = (re: RegExp) => { const m = t.match(re); return m ? Number(m[1].replace(/[ ,]/g, "")) : undefined; };
  const product = PRODUCTS.find((p) => t.includes(p.name.toLowerCase()) || p.tags.some((g) => t.includes(g) && g.length > 4) || t.includes(p.name.split(" ")[0].toLowerCase() + " " + p.name.split(" ")[1]?.toLowerCase()));

  if (/(place|confirm|complete|finish).*(order)|pay now|buy (it|now)|\bpay\b/.test(t)) return { call: { name: "placeOrder", args: {} } };
  if (/checkout|check out/.test(t)) return { call: { name: "startCheckout", args: /express|next day/.test(t) ? { deliveryMethod: "express" } : /collect/.test(t) ? { deliveryMethod: "collect" } : {} } };
  if (/(remove|delete|take out)/.test(t) && product) return { call: { name: "removeFromCart", args: { product: product.id } } };
  if (/(add|buy|put|get me)/.test(t) && product) {
    const q = num(/(\d+)\s*(x|×|of)?\s/);
    return { call: { name: "addToCart", args: { product: product.id, quantity: q && q < 10 ? q : 1 } } };
  }
  if (/\b(cart|basket)\b/.test(t)) return { call: { name: "showCart", args: {} } };
  if (/(order|confirmation|receipt)/.test(t) && /(show|status|my)/.test(t)) return { call: { name: "showOrderConfirmation", args: {} } };
  if (/(show|find|search|looking|browse|list|under|cheap|best|recommend|what|any|need|want)/.test(t) || CATEGORIES.some((c) => t.includes(c.toLowerCase()))) {
    const category = CATEGORIES.find((c) => t.includes(c.toLowerCase()));
    const maxPrice = num(/(?:under|below|less than|max|<)\s*r?\s*([\d ,]+)/);
    const sort = /cheap|lowest/.test(t) ? "price-asc" : /best|top rated|rating/.test(t) ? "rating" : undefined;
    const stop = new Set(["show","me","find","search","for","some","any","the","a","an","under","below","i","need","want","looking","to","what","do","you","have","best","cheapest","cheap","products","product","items","please","can","in","of","and","r","rands","than","less","your","with","are","is","there","recommend","browse","list","all"]);
    const words = t.replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w && !stop.has(w) && !/^\d+$/.test(w) && !(category && w === category.toLowerCase()));
    const q = words.length <= 3 ? words.join(" ") : "";
    return { call: { name: "searchProducts", args: { ...(q && { query: q }), ...(category && { category }), ...(maxPrice && { maxPrice }), ...(sort && { sort }) } } };
  }
  return { reply: "I'm the offline demo copilot (no API key set), so I understand a few commands: “show me headphones under 2000”, “add the smartwatch to my cart”, “show my cart”, “remove the speaker”, “checkout”, “place my order”. Set OPENAI_API_KEY for the full LLM experience." };
}

function summarise(raw: string): string {
  let decoded: unknown = raw;
  try { decoded = JSON.parse(raw); } catch { /* plain text */ }
  if (typeof decoded === "string") return decoded.startsWith("APPROVED") ? `${decoded.replace("APPROVED. ", "")} Thanks for shopping!` : decoded;
  const o = decoded as { count?: number; items?: unknown[] };
  if (o && typeof o.count === "number") return o.count ? `I found ${o.count} matching product${o.count === 1 ? "" : "s"} — the products page is filtered to match.` : "I couldn't find anything matching that. Try a broader search?";
  if (o && Array.isArray(o.items)) return o.items.length ? `You have ${o.items.length} line(s) in your cart.` : "Your cart is empty.";
  return "Done.";
}

/** A minimal AG-UI agent that behaves like an LLM with tool calling, minus the LLM. */
export class DemoAgent extends AbstractAgent {
  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable<BaseEvent>((sub) => {
      const { threadId, runId } = input;
      const available = new Set(input.tools.map((t) => t.name));
      const last = input.messages[input.messages.length - 1];
      const emit = (e: object) => sub.next(e as BaseEvent);
      const say = (text: string) => {
        const messageId = randomUUID();
        emit({ type: EventType.TEXT_MESSAGE_START, messageId, role: "assistant" });
        emit({ type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: text });
        emit({ type: EventType.TEXT_MESSAGE_END, messageId });
      };
      emit({ type: EventType.RUN_STARTED, threadId, runId });
      if (last?.role === "tool") {
        say(summarise(typeof last.content === "string" ? last.content : ""));
      } else {
        const text = last?.role === "user" && typeof last.content === "string" ? last.content : "";
        const { call, reply } = plan(text);
        if (call && available.has(call.name)) {
          const toolCallId = randomUUID();
          emit({ type: EventType.TOOL_CALL_START, toolCallId, toolCallName: call.name });
          emit({ type: EventType.TOOL_CALL_ARGS, toolCallId, delta: JSON.stringify(call.args) });
          emit({ type: EventType.TOOL_CALL_END, toolCallId });
        } else say(reply ?? "That action isn't available right now.");
      }
      emit({ type: EventType.RUN_FINISHED, threadId, runId });
      sub.complete();
    });
  }
}
