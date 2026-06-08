# Sound Generator

Web app for AI music generation, cover creation, and text-to-speech using the [MiniMax](https://www.minimax.io/) API. Generate songs from lyrics and style prompts, create covers from reference audio, or clone a voice for TTS — with local history, pinning, and bilingual UI (English / Russian).

## Features

- **New Song** — Generate music from a style prompt and lyrics (or instrumental-only). Optional lyrics optimizer.
- **New Cover** — Upload or link reference audio, preprocess to extract structure/lyrics, then generate a cover version.
- **Text to Speech** — Clone a voice from a sample and synthesize speech from text.
- **History** — Persistent generation history with rename, pin, duplicate, and delete.
- **Themes** — Light and dark mode.
- **i18n** — English and Russian via `react-i18next`.

## Prerequisites

- [pnpm](https://pnpm.io/) 10+
- [Deno](https://deno.com/) (backend runtime)
- MiniMax API key (Token Plan subscription key from Billing → Token Plan)

## Setup

```bash
pnpm install
cp .env.example .env
# Edit .env and set MINIMAX_API_KEY
```

## Development

Start frontend and backend together:

```bash
pnpm dev
```

Or run them separately:

```bash
pnpm dev:frontend   # Vite on http://localhost:5173
pnpm dev:backend    # Deno API on http://localhost:8000
```

The Vite dev server proxies `/api` requests to the backend.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run frontend + backend in parallel |
| `pnpm dev:frontend` | Frontend only |
| `pnpm dev:backend` | Backend only |
| `pnpm build` | Production frontend build |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Lint frontend (oxlint) |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm format` | Format frontend (oxfmt) |
| `pnpm format:check` | Check formatting |

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MINIMAX_API_KEY` | Yes | — | MiniMax subscription API key |
| `PORT` | No | `8000` | Backend listen port |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin |

## Project structure

```
sound-generator/
├── frontend/          # React + Vite + TanStack Router
├── backend/           # Deno HTTP API + MiniMax integration
├── .env.example       # Environment template
├── AGENTS.md          # Guidance for AI coding agents
└── CONTEXT.md         # Architecture and API reference
```

## Models

| Workflow | Models |
|----------|--------|
| Song | `music-2.6`, `music-2.6-free` |
| Cover | `music-cover`, `music-cover-free` |
| TTS | `speech-2.8-hd`, `speech-2.8-turbo` |

Each workflow has a dedicated API endpoint; sending a cover or TTS model to the song endpoint returns a validation error.

## License

Private project.
