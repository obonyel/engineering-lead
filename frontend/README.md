# Frontend

Two channels that share one agentic pattern — CopilotKit + AG-UI, generative UI, and
human-in-the-loop approval. See the
[Frontend Architecture pillar](../docs/architecture/frontend-architecture.md) for the full
rationale, and the [demo HLD](../docs/architecture/agentic-demo-hld.md) for where these fit
in the end-to-end architecture.

| Path | Channel | Stack | Status |
|---|---|---|---|
| [`web/`](web/README.md) | Web — **micro-frontends** | Next.js | Working (monolith today; micro-frontends is the target) |
| [`mobile/`](mobile) | Mobile — **current focus** | React Native (Expo) | Scaffold |

## web/

The web channel is a **micro-frontends** application: a shell that composes independently
deliverable feature frontends (catalogue, cart, checkout, …), so squads can own and ship a
slice without coordinating a monolith release — the frontend expression of the bounded-
context model used deeper in the stack.

Today it is a single Next.js app (the working agentic reference); decomposing it into a
micro-frontends shell + remotes is the roadmap. Run it:

```bash
cd web && npm install && npm run dev   # http://localhost:3000
```

## mobile/

The mobile channel and current focus — **React Native via Expo**. Expo is chosen so the app
builds without full local Xcode (EAS Build), distributes for free (Android APK via GitHub
Releases, iOS via Expo Go), and ships OTA updates. Scaffold only for now; the mobile
toolchain and the native component-catalogue contract are being decided in
[docs/architecture/agentic-app-workshop-notes.md](../docs/architecture/agentic-app-workshop-notes.md)
before implementation.
