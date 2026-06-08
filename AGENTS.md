# Agent instructions

Guidance for AI coding agents working in this repository.

## Project summary

pnpm monorepo with two packages:

- **`frontend/`** — React 19, TypeScript, Vite 8, TanStack Router, i18next. User-facing UI.
- **`backend/`** — Deno HTTP server. Proxies to MiniMax APIs, validates requests, persists history to JSON.

Do not add a third package or change the runtime (no Node backend, no Next.js) unless explicitly requested.

## Commands

```bash
pnpm install          # from repo root
pnpm dev              # frontend + backend
pnpm dev:frontend     # Vite only
pnpm dev:backend      # Deno only (needs .env with MINIMAX_API_KEY)
pnpm build            # frontend production build
pnpm lint             # oxlint on frontend
pnpm format           # oxfmt on frontend
```

Backend has no separate lint/format scripts; follow existing Deno/TS style in `backend/`.

## Conventions

### Scope and style

- Make minimal, focused diffs. Match surrounding code style.
- Do not add comments unless they explain non-obvious logic.
- Do not add tests unless requested or they cover meaningful behavior.
- Do not commit `.env`, `backend/data/history.json`, or `node_modules/`.

### Frontend (`frontend/src/`)

- **Routing** — File-based routes under `routes/`. Route tree is generated (`routeTree.gen.ts`); do not hand-edit it.
- **API calls** — All HTTP logic lives in `api/client.ts`. Components call these functions, not raw `fetch` elsewhere.
- **Errors** — Backend returns `errorCode` + optional `errorParams`. Map codes to user strings in `lib/translateError.ts` and add keys to both `locales/en/translation.json` and `locales/ru/translation.json`.
- **Types** — Shared domain types in `types.ts`. Keep in sync with `backend/types.ts` when changing request/response shapes.
- **i18n** — User-visible strings go through `useTranslation()` / `t()`. Never hardcode UI copy in components.
- **Lint/format** — oxlint + oxfmt. Run `pnpm lint` and `pnpm format` after frontend edits.

### Backend (`backend/`)

- **Entry point** — `main.ts` defines routes and handlers. Business logic is split across `minimax.ts`, `minimax-tts.ts`, `minimax-metadata.ts`, `*-parse.ts`, `history.ts`, `errors.ts`.
- **Validation** — Request parsing/validation in `cover-parse.ts` and `tts-parse.ts` (multipart + JSON). Song validation in `minimax.ts` (`validateSongRequest`).
- **Errors** — Throw `ApiError` with a typed code from `errors.ts`. Handlers return `apiErrorResponse()` with appropriate HTTP status (400 for client errors, 422 for upstream/generation failures).
- **History** — Every generation attempt creates a `HistoryEntry` (including failures). Stored in `backend/data/history.json`.
- **Env** — Loaded via `--env-file=../.env` in `deno.json` tasks. Secrets only in `.env`, never in source.

### API contract

- Frontend talks to `/api/*` (proxied to `localhost:8000` in dev).
- Generation endpoints return `{ entry }` on success or `{ entry, errorCode, errorParams }` with status 422 when generation fails but history was saved.
- Cover/TTS uploads use `multipart/form-data` with field `audio`; JSON body is used when only `audioUrl` is provided.

## Common tasks

| Task | Where to change |
|------|-----------------|
| New UI string | `locales/en/translation.json`, `locales/ru/translation.json` |
| New API error code | `backend/errors.ts`, handler status map in `main.ts`, `frontend/lib/translateError.ts`, locale files |
| New route/page | `frontend/src/routes/`, shared components in `components/` |
| New model | `backend/types.ts`, `frontend/src/types.ts`, model selectors, validation in backend |
| New API endpoint | `backend/main.ts` handler + `frontend/src/api/client.ts` |

## Pitfalls

- **Duplicate types** — `frontend/src/types.ts` and `backend/types.ts` mirror each other. Update both when changing shared shapes.
- **Wrong endpoint for model** — Cover models must use `/api/cover/*`, TTS models `/api/tts/generate`, song models `/api/generate`.
- **Generation vs validation errors** — Validation fails before history is written (400). MiniMax/upstream failures still append a failed entry (422).
- **Do not edit** `frontend/src/routeTree.gen.ts` — it is codegen output from TanStack Router plugin.

## Further reading

See [CONTEXT.md](./CONTEXT.md) for architecture, endpoint reference, and workflow details.
