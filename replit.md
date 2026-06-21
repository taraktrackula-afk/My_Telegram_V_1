# NEXUS — Personal AI Telegram Assistant

A command center for managing your personal AI assistant across 3 Telegram accounts. Acts as your Digital Chief of Staff — managing tasks, memory, team records, and AI providers from a single dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/assistant run dev` — run the web dashboard (port 19656)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (artifact: api-server)
- Frontend: React + Vite + shadcn/ui + Tailwind (artifact: assistant)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Storage: In-memory mock data (foundation build — no DB required)

## Where things live

- `lib/api-spec/openapi.yaml` — Single source of truth for all API contracts
- `lib/api-client-react/src/generated/` — Generated React Query hooks
- `lib/api-zod/src/generated/` — Generated Zod validators (used by server)
- `artifacts/api-server/src/mock/data.ts` — All mock data (replaces Firebase in production)
- `artifacts/api-server/src/routes/` — Route handlers (accounts, chats, memory, tasks, reminders, team, ai, documents, dashboard, settings)
- `artifacts/assistant/src/pages/` — Frontend pages

## Architecture decisions

- **Foundation build with mock data**: All data lives in `src/mock/data.ts` in-memory. When ready to go production, replace each data array with Firebase Firestore calls — the route handler interfaces stay identical.
- **AI provider abstraction**: The `/ai/providers` and `/ai/chat` endpoints are designed for easy provider swapping. The `MockProvider` returns realistic responses now; swap `getMockAiResponse()` with real Gemini/GPT API calls when keys are available.
- **No database required**: This reduces Firebase usage and keeps the free tier intact. Firebase Firestore is intended only for metadata/caching, with Google Drive/Sheets as primary storage.
- **OpenAPI-first contract**: All API types flow from `openapi.yaml` → codegen → Zod validators (server) + React Query hooks (frontend). Never write types by hand.
- **3-account whitelist**: Telegram account IDs are stored in Settings.whitelistedAccounts. Whitelist validation is architecture-ready in the accounts module.

## Product

- **Dashboard** — Mission control with live stats, recent activity feed, AI provider badge, and quick-command input
- **Chats** — Browse all Telegram chats across 3 accounts (Main/Secondary/Backup) with inline message thread view
- **Memory** — Long-term and short-term memory browser with search, add, and delete
- **Tasks** — Task manager with Kanban-style status columns and priority badges
- **Reminders** — Recurring and one-time reminders with scheduling
- **Team** — Employee directory with appraisal and recognition records (Google Sheets ready)
- **Documents** — RAG document library with Google Drive/Sheets/Telegram source badges
- **AI Providers** — Switch between Mock, Gemini 1/2/3, and GPT-4o with one click
- **Settings** — Toggles for RAG, auto-sync to Drive/Sheets, notifications, and account whitelist

## Future migration path

```
GitHub → Vercel (frontend) + Firebase Functions (backend)
       → Firebase Firestore (metadata/cache)
       → Google Drive (document storage)
       → Google Sheets (structured data / team records)
       → Gemini API (replace MockProvider)
       → Telegram Bot API (real webhooks for 3 accounts)
```

## User preferences

- Keep Firebase usage minimal to avoid exceeding free tier limits
- Google Drive = primary document storage; Google Sheets = structured/human-readable data
- Support 3 Telegram accounts: Main, Secondary, Backup
- AI switching: Gemini (primary), GPT-4 (coding), others as needed
- Foundation build = no real API keys required; mock everything now, swap later

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after every OpenAPI spec change — don't hand-write types
- Do NOT name OpenAPI body schemas `<OperationIdPascal>Body` — it causes Orval TS2308 collisions
- Do NOT name response schemas the same as what Orval auto-derives from the operation ID (e.g. `AiChatResponse` for `aiChat`) — rename to `AiResponsePayload` or similar
- Mock data lives in memory — server restarts reset it. This is by design for the foundation build.
- The api-server does NOT use `@workspace/db` — no DATABASE_URL required in development mode

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- Mock data source of truth: `artifacts/api-server/src/mock/data.ts`
