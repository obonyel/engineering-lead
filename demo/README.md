# Sahara Market — agentic UI + generative UI demo

A self-contained, fully mocked ecommerce app that showcases **agentic UI** (an in-app copilot that reads and acts on the app) and **generative UI** (React components rendered inside the chat) with the **CopilotKit** SDK. Styled with the *Atomic UI* design system (https://thatguycodes.github.io/thatguycodes/). Demo only — mock data, no real auth, no real payments.

## Quick start

```bash
cd demo
npm install
npm run dev        # http://localhost:3000
```

Sign in with the prefilled demo user (`demo@superapp.test` / `demo1234`).

Other scripts: `npm run build`, `npm run lint`, `npm run typecheck`.

## Environment variables

Copy `.env.example` to `.env.local` (never commit real keys).

| Var | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | no | Enables a real LLM for the copilot (server-side only, in the API route). |
| `OPENAI_MODEL` | no | Model override, default `gpt-4o-mini`. |
| `COPILOTKIT_TELEMETRY_DISABLED` | no | Set `true` to opt out of CopilotKit runtime telemetry. |

**No key? Still works.** Without `OPENAI_API_KEY` the runtime uses an offline *demo agent* (`src/lib/demo-adapter.ts`): a rule-based stand-in that emits the same AG-UI tool-call events a model would. Try “show me headphones under 2500”, “add the Solstice Smartwatch to my cart”, “show my cart”, “remove the earbuds”, “start checkout with express delivery”, “place my order”. A header badge shows **Demo mode** or **LLM live**.

## The journey (all mocked)

1. `/login` – fake auth, prefilled demo user; everything else is gated by a client-side guard in `(app)/layout.tsx`.
2. `/products` – 12-item mock catalogue; search, category, max price and sort.
3. `/cart` – quantities, remove, totals.
4. `/checkout` – address → delivery → mock payment (validates card format; `4242 4242 4242 4242` prefilled) → success/confirmation with order summary.

State (user, cart, checkout progress, last order) lives in a React reducer persisted to `localStorage` (`src/lib/store.tsx`). Theme toggle (dark = default, light) is persisted too.

## Structure

```
src/
  app/
    api/copilotkit/route.ts   CopilotRuntime endpoint (server-side, reads env)
    api/mode/route.ts         tells the UI whether it is in demo or LLM mode
    login/                    demo login
    (app)/layout.tsx          auth guard, header, <CopilotKit> + <CopilotSidebar>
    (app)/{products,cart,checkout}/page.tsx
  components/
    ui/index.tsx              design-system primitives: Button, Card, Badge, Input, Select
    copilot/CopilotActions.tsx  useCopilotReadable + useCopilotAction definitions
    copilot/GenUI.tsx         generative-UI components rendered in the chat
  lib/
    products.ts               mock catalogue, filtering, ZAR formatting
    store.tsx                 cart/auth/checkout state (reducer + localStorage)
    demo-adapter.ts           offline DemoAgent (AG-UI) used when no API key is set
```

## How the agentic / generative UI works

- **Runtime** – `app/api/copilotkit/route.ts` creates a `CopilotRuntime`. With a key it uses `OpenAIAdapter`; without one it registers `DemoAgent` as the default agent. The browser only talks to `/api/copilotkit`.
- **Provider + chat** – `(app)/layout.tsx` wraps the app in `<CopilotKit runtimeUrl="/api/copilotkit">` with a `<CopilotSidebar>` (themed through `--copilot-kit-*` variables mapped to design tokens in `globals.css`).
- **Context (`useCopilotReadable`)** – catalogue, filters, cart, checkout step/address, last order, and user are exposed so the model answers from real state.
- **Actions (`useCopilotAction`)** – frontend tools that mutate the real app state: `searchProducts` (also drives the products page filters and navigates), `addToCart`, `removeFromCart`, `showCart`, `startCheckout` (navigates and picks delivery), `placeOrder`, `showOrderConfirmation`.
- **Generative UI (`render`)** – each action’s `render` returns a React component in the chat: product cards with “Add” buttons, a live cart summary with +/−/remove, order summary, and a payment-confirmation card. A “thinking” placeholder shows while the action is running. These components read the live store, so they stay in sync with the page.
- **Human-in-the-loop** – `placeOrder` uses `renderAndWaitForResponse`: the chat shows an approval card (total, delivery, saved card) and the agent run pauses until the user clicks **Approve & pay** or **Cancel**; the answer is returned to the agent as the tool result. The order is only placed on approval.

## Design system (Atomic UI) — what was matched

Fetched from the published site’s CSS bundle (the page is a client-rendered SPA).

Matched exactly:
- **Colour tokens** for both themes, copied verbatim (dark “Sahara” default: canvas `#161311`, card `#231f1d`, amber primary `#ffba56`; light: canvas `#fff8f5`, terracotta primary `#c86d3b`), plus text, border, accent, success/warning/danger tokens and bevel/glow/HUD shadows (`src/app/globals.css`).
- **Typography**: Geist + Geist Mono (via the `geist` package), mono uppercase tracking-wider labels, the site’s heading/body sizes.
- **Radii** (4/8/12/16px), 4px-base spacing, dark/light theming via `data-theme`.
- **Components**: primary button (accent fill, bevel shadow, hover colour), card (`bg-card border rounded-lg`), badges (4px radius, mono uppercase), inputs (token border, focus ring).

Approximated:
- The design system isn’t published as a package, so Button/Card/Badge/Input/Select are re-implemented from the class strings in its bundle rather than imported; secondary/ghost/danger button variants and the checkout stepper are my own extensions in the same token language.
- The CopilotKit chat is re-skinned through CopilotKit’s CSS variables and a few overrides, so its internal layout is CopilotKit’s, not Atomic UI’s.
- Product imagery uses emoji placeholders.

## Notes

- CopilotKit 1.80 marks the `useCopilotAction`/`CopilotRuntime` v1 APIs as deprecated in favour of v2; they still work and are used here as requested.
- `npm audit` reports high-severity advisories that are all transitive through CopilotKit 1.80 (`@ag-ui/*`, `@copilotkit/*`, `zod`, `@ai-sdk/*`) with no fix available upstream. Acceptable for a local demo; revisit before any production use.
