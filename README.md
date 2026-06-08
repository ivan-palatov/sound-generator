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

## Docker

Requires [Docker](https://www.docker.com/) with Compose v2.

```bash
cp .env.example .env
# Edit .env: set MINIMAX_API_KEY and DOCKERHUB_USERNAME
docker compose up --build
```

- UI: http://localhost:8080 (override with `FRONTEND_PORT` in `.env`)
- API (direct): http://localhost:8000 (override with `BACKEND_PORT` in `.env`)

The frontend container serves the built app and proxies `/api` to the backend. History is persisted in the `backend-data` volume.

[Watchtower](https://hub.docker.com/r/nickfedor/watchtower) polls Docker Hub hourly and restarts `frontend` and `backend` when new `:latest` images are published (after CI pushes to `master`). Only containers with the `com.centurylinklabs.watchtower.enable=true` label are updated — the watchtower container itself is excluded.

### Published images

On every push to `master`, GitHub Actions builds and pushes:

- `<dockerhub-user>/sound-generator-frontend:latest`
- `<dockerhub-user>/sound-generator-backend:latest`

Pull pre-built images (set `DOCKERHUB_USERNAME` in `.env` to match your Docker Hub account):

```bash
docker compose pull
docker compose up -d
```

The root `compose.yml` also includes Watchtower for automatic updates when CI publishes new images.

### CI secrets

Configure these in the GitHub repo (Settings → Secrets and variables → Actions):

| Secret | Purpose |
|--------|---------|
| `DOCKERHUB_USERNAME` | Docker Hub account or organization name |
| `DOCKERHUB_TOKEN` | Docker Hub access token |

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
| `DOCKERHUB_USERNAME` | Yes (Docker) | — | Docker Hub namespace for image tags and Watchtower pulls |
| `BACKEND_PORT` | No | `8000` | Host port mapped to the backend container |
| `FRONTEND_PORT` | No | `8080` | Host port mapped to the frontend container |
| `PORT` | No | `8000` | Backend listen port inside the container |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin |

## Project structure

```
sound-generator/
├── frontend/          # React + Vite + TanStack Router
├── backend/           # Deno HTTP API + MiniMax integration
├── compose.yml        # Full-stack Docker Compose
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
