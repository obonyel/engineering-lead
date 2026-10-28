# Frontend Architecture

**Pillar page — one of two equal pillars in this standard. See also
[Integration Architecture](integration-architecture.md).**

This page defines how the frontend of an agentic application is architected under this
standard: the composition of an in-app agent, the UI that renders its actions, the
contract between model and app, and the cross-platform strategy. It is grounded in a
working reference — the agentic web app in [`demo/`](../../demo/README.md) — and extended
to the mobile channel in [`frontend/RNModule/`](../../frontend/README.md).

The frontend sits in the **Experience layer**. Under the
[architecture standards](../../.github/instructions/architecture-standards.instructions.md),
that layer performs channel adaptation and presentation only — **it holds no business
rules**. For an agentic frontend this is the central constraint: the model may *propose*
and *present*, but every state change travels through a validated path, never a direct
write from the model or the UI.

---

## Principles

1. **Tools are the only path to data.** The model never reaches state directly. It reads
   through declared *readable context* and writes only through declared *actions* (tools),
   each of which is a typed, validated call. This is the frontend half of the agentic
   authorization chain owned by the [integration pillar](integration-architecture.md).
2. **The agent answers from real app state.** Readable context exposes the live catalogue,
   filters, cart, checkout progress, and last order — so the model reasons over what the
   user actually sees, not a stale copy.
3. **Humans approve consequential actions.** Any action that spends money or is otherwise
   irreversible **pauses the agent run** for explicit user approval. A model can never
   approve on the user's behalf.
4. **Generative UI stays in sync with the app.** Components rendered inside the chat read
   the same store as the page, so chat and screen never diverge.
5. **The design system is architecture, not styling.** Tokens and primitives are a
   contract shared by the app and the agent's generative components.
6. **The server is the source of truth once data is real.** Local state is a demo
   convenience; the production pattern treats the backend as authoritative and the client
   as a cache with loading, retry, and conflict states.

---

## The agentic UI pattern

The reference implementation
([`demo/src/components/copilot/CopilotActions.tsx`](../../demo/src/components/copilot/CopilotActions.tsx))
composes three primitives from the agent runtime (CopilotKit v1 here; the pattern is
runtime-agnostic):

### 1. Readable context — what the model can see
`useCopilotReadable` exposes live, typed slices of state to the model: the signed-in user,
the product catalogue, the current filters, the cart and its totals, checkout progress,
and the most recent order. The model reasons over these directly, so it never guesses at
app state.

### 2. Actions — what the model can do
`useCopilotAction` declares each tool the model may call, with typed parameters and a
handler that performs a *validated* mutation of app state:

| Tool | Effect | Read / Write |
|---|---|---|
| `searchProducts` | Filters the catalogue, drives the products page, navigates | Read |
| `addToCart` / `removeFromCart` | Mutates the cart (with stock clamping) | Write |
| `showCart` | Renders the live cart | Read |
| `startCheckout` | Begins checkout, optionally picks delivery — **does not place the order** | Write |
| `placeOrder` | Places and pays — **gated by human approval** | Write (approval) |
| `showOrderConfirmation` | Renders the confirmation | Read |

The split between `startCheckout` (safe) and `placeOrder` (consequential) is deliberate:
the agent can walk the user right up to the point of spending money, but not across it.

### 3. Generative UI — what the model draws
Each action's `render` returns a React component into the chat: product cards with
"Add" buttons, a live cart summary, an order summary, and a payment confirmation. A
`Thinking` placeholder shows while an action runs. Because these components read the same
store as the page, the chat and the screen are always consistent.

### 4. Human-in-the-loop approval
`placeOrder` uses `renderAndWaitForResponse`: it renders an **approval card** (total,
delivery, saved card) and **the agent run pauses** until the user clicks *Approve & pay*
or *Cancel*. The user's decision is returned to the model as the tool result, so the model
learns the outcome. The order is placed **only on approval**. This is the frontend
realisation of the rule that *LLM reasoning is not an authorization mechanism*.

---

## Design system as architecture

The reference app matches a published design system (*Atomic UI*) at the token level —
colour, typography, radii, spacing, and shadows — in
[`demo/src/app/globals.css`](../../demo/src/app/globals.css), and re-implements the
primitives (Button, Card, Badge, Input, Select) in
[`demo/src/components/ui/`](../../demo/src/components/ui/). Theming is token-driven
(`data-theme`), so dark/light and brand changes are a token swap, not a component rewrite.

Why this matters for an *agentic* frontend: the agent's generative components and the
page components draw from the **same token contract**. Without a shared design system, UI
rendered by the model drifts visually from the app. The design system is therefore a
precondition for trustworthy generative UI, not a cosmetic afterthought.

---

## State and source of truth

The reference uses a reducer persisted to `localStorage`
([`demo/src/lib/store.tsx`](../../demo/src/lib/store.tsx)) with one agentic-specific
detail: a synchronous `getSummary()` read path, because action handlers must observe the
*latest* state, not a render-time snapshot. Stock is clamped in the reducer so neither the
user nor the model can over-order.

This is a demo convenience. The standard's production stance is **server-as-source-of-truth**
(see the [workshop notes](agentic-app-workshop-notes.md)): once the cart and orders live in
a backing store, the client becomes a cache and must handle loading, retry, and conflict —
and every write carries an idempotency key so a retried request, or a model that repeats a
tool call, cannot place two orders.

---

## Cross-platform & the mobile channel

The web demo proves the pattern; the mobile channel
([`frontend/RNModule/`](../../frontend/README.md), React Native 0.88) is where the hard
frontend-architecture decisions live. They are being designed before implementation in the
[workshop notes](agentic-app-workshop-notes.md):

- **Generative UI does not port directly.** Rendering React components inside a web chat
  has no React Native equivalent. The pattern is a **versioned catalogue of native
  components** (product card, cart summary, order summary, approval card): the agent
  returns a *component name plus typed data*, and the app renders it. That catalogue is a
  **contract between model and app, and must be versioned** — a frontend-architecture
  concern of the first order.
- **Streaming transport is an explicit choice.** Web used the runtime over HTTP; React
  Native needs a decision between SSE, WebSocket, and a polling fallback, with reconnection
  and partial-render handling. Trade-offs below.
- **Tri-platform is the default.** iOS + Android + Huawei HMS. Google-service gaps on HMS
  are handled by a factory abstraction (see the
  [mobile-architect agent](../../.github/agents/mobile-architect.agent.md)), not by
  branching in feature code.

### Streaming transport trade-offs

| Dimension | SSE | WebSocket | Polling (fallback) |
|---|---|---|---|
| Token/partial streaming | Good (native server-push) | Good (bidirectional) | Poor (interval latency) |
| Client complexity | Low | Higher (lifecycle, reconnect) | Lowest |
| Bidirectional (approval round-trip) | Needs a separate channel | Native | Native (next poll) |
| RN support maturity | Needs a polyfill | Mature libraries | Trivial |
| Background / flaky network | Reconnect + replay needed | Reconnect + replay needed | Degrades gracefully |

The choice is pending (`Q3` in the workshop notes) and will be recorded as an ADR.

---

## Designing for agentic failure

An agentic frontend must treat model and tool failures as first-class UX, not edge cases:

- **Never assume success.** A tool call can be rejected, fail a business rule, or time
  out. The UI surfaces each state explicitly (the reference uses `Thinking` while running
  and distinct terminal states on completion).
- **Errors are explainable.** Backed by RFC 9457 Problem Details from the services, the
  agent can explain *why* something failed rather than guessing.
- **Approval is irrevocable-action gating, not a nicety.** The pause-for-approval pattern
  is the UX contract that keeps a probabilistic model from taking deterministic,
  consequential action.

---

## Reference implementation map

| Concern | File |
|---|---|
| Readable context + actions + approval | [`demo/src/components/copilot/CopilotActions.tsx`](../../demo/src/components/copilot/CopilotActions.tsx) |
| Generative UI components | [`demo/src/components/copilot/GenUI.tsx`](../../demo/src/components/copilot/GenUI.tsx) |
| Design-system primitives | [`demo/src/components/ui/`](../../demo/src/components/ui/) |
| Design tokens / theming | [`demo/src/app/globals.css`](../../demo/src/app/globals.css) |
| State store | [`demo/src/lib/store.tsx`](../../demo/src/lib/store.tsx) |
| Offline agent fallback | [`demo/src/lib/demo-adapter.ts`](../../demo/src/lib/demo-adapter.ts) |
| Mobile channel | [`frontend/RNModule/`](../../frontend/README.md) |
| Mobile design decisions | [`agentic-app-workshop-notes.md`](agentic-app-workshop-notes.md) |

---

## Open decisions (ADRs to write)

- **Streaming transport** for the RN channel (SSE / WebSocket / polling) — `Q3`.
- **Component-catalogue contract** — schema and versioning of the native generative-UI
  components.
- **Which writes require approval** — only `placeOrder`, or also cart changes? (`Q11`).

See the [workshop notes](agentic-app-workshop-notes.md) for the full open-question set and
the [ADR index](../decisions/ADR-000-index.md) for where these decisions land.
