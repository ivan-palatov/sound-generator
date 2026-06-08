import {
  parseCoverGenerateRequest,
  parseCoverPreprocessRequest,
  referenceAudioLabel,
} from "./cover-parse.ts";
import {
  appendHistory,
  deleteHistory,
  getHistory,
  listHistory,
  updateHistory,
} from "./history.ts";
import {
  deriveTitleFallback,
  fallbackStyleTags,
  generateCoverMetadata,
  generateSongMetadata,
} from "./minimax-metadata.ts";
import { generateCover, generateMusic, preprocessCover } from "./minimax.ts";
import { COVER_MODELS } from "./types.ts";
import type { CoverGenerateRequest, GenerateRequest, HistoryEntry } from "./types.ts";

const PORT = Number(Deno.env.get("PORT") ?? 8000);
const CORS_ORIGIN = Deno.env.get("CORS_ORIGIN") ?? "http://localhost:5173";

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

async function handleGenerate(req: Request): Promise<Response> {
  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (COVER_MODELS.has(body.model)) {
    return jsonResponse({ error: "Cover models must use /api/cover/generate" }, 400);
  }

  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    model: body.model,
    prompt: body.prompt ?? "",
    lyrics: body.lyrics,
    isInstrumental: body.isInstrumental ?? false,
    lyricsOptimizer: body.lyricsOptimizer ?? false,
    status: "failed",
  };

  try {
    const result = await generateMusic(body);
    entry.status = "completed";
    entry.audioUrl = result.audioUrl;
    entry.traceId = result.traceId;
    entry.durationMs = result.durationMs;

    const metadata = await generateSongMetadata(body);
    if (metadata) {
      entry.title = metadata.title;
      entry.styleTags = metadata.styleTags;
    } else {
      entry.title = deriveTitleFallback(body);
      entry.styleTags = fallbackStyleTags(body.prompt ?? "");
    }
  } catch (err) {
    const error = err as Error & { traceId?: string };
    entry.error = error.message;
    entry.traceId = error.traceId;
    await appendHistory(entry);
    return jsonResponse({ entry, error: error.message }, 422);
  }

  await appendHistory(entry);
  return jsonResponse({ entry });
}

async function handleCoverPreprocess(req: Request): Promise<Response> {
  try {
    const body = await parseCoverPreprocessRequest(req);
    const result = await preprocessCover(body);
    return jsonResponse(result);
  } catch (err) {
    const error = err as Error & { traceId?: string };
    return jsonResponse(
      { error: error.message, traceId: error.traceId },
      error.message.includes("required") || error.message.includes("Provide") ? 400 : 422,
    );
  }
}

function coverEntryFromRequest(body: CoverGenerateRequest): HistoryEntry {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    model: body.model,
    prompt: body.prompt ?? "",
    lyrics: body.lyrics,
    isInstrumental: false,
    lyricsOptimizer: false,
    referenceAudioUrl: referenceAudioLabel(body),
    status: "failed",
  };
}

async function handleCoverGenerate(req: Request): Promise<Response> {
  let body: CoverGenerateRequest;
  try {
    body = await parseCoverGenerateRequest(req);
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Invalid request body" },
      400,
    );
  }

  const entry = coverEntryFromRequest(body);

  try {
    const result = await generateCover(body);
    entry.status = "completed";
    entry.audioUrl = result.audioUrl;
    entry.traceId = result.traceId;
    entry.durationMs = result.durationMs;

    const metadata = await generateCoverMetadata(body);
    if (metadata) {
      entry.title = metadata.title;
      entry.styleTags = metadata.styleTags;
    } else {
      entry.title = deriveTitleFallback({
        model: body.model,
        prompt: body.prompt,
        lyrics: body.lyrics,
        isInstrumental: false,
        lyricsOptimizer: false,
      });
      entry.styleTags = fallbackStyleTags(body.prompt ?? "");
    }
  } catch (err) {
    const error = err as Error & { traceId?: string };
    entry.error = error.message;
    entry.traceId = error.traceId;
    await appendHistory(entry);
    return jsonResponse({ entry, error: error.message }, 422);
  }

  await appendHistory(entry);
  return jsonResponse({ entry });
}

async function handleDelete(id: string): Promise<Response> {
  const deleted = await deleteHistory(id);
  if (!deleted) {
    return jsonResponse({ error: "Entry not found" }, 404);
  }
  return jsonResponse({ ok: true });
}

const MAX_TITLE_LENGTH = 200;

async function handlePatch(id: string, req: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const allowedKeys = new Set(["title", "pinned"]);
  const unknownKeys = Object.keys(body).filter((k) => !allowedKeys.has(k));
  if (unknownKeys.length > 0) {
    return jsonResponse({ error: `Unknown fields: ${unknownKeys.join(", ")}` }, 400);
  }

  const patch: { title?: string; pinned?: boolean } = {};

  if ("title" in body) {
    if (typeof body.title !== "string") {
      return jsonResponse({ error: "title must be a string" }, 400);
    }
    const title = body.title.trim();
    if (!title) {
      return jsonResponse({ error: "title cannot be empty" }, 400);
    }
    if (title.length > MAX_TITLE_LENGTH) {
      return jsonResponse({ error: `title must be at most ${MAX_TITLE_LENGTH} characters` }, 400);
    }
    patch.title = title;
  }

  if ("pinned" in body) {
    if (typeof body.pinned !== "boolean") {
      return jsonResponse({ error: "pinned must be a boolean" }, 400);
    }
    patch.pinned = body.pinned;
  }

  if (Object.keys(patch).length === 0) {
    return jsonResponse({ error: "No valid fields to update" }, 400);
  }

  const entry = await updateHistory(id, patch);
  if (!entry) {
    return jsonResponse({ error: "Entry not found" }, 404);
  }
  return jsonResponse({ entry });
}

Deno.serve({ port: PORT }, async (req) => {
  const url = new URL(req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (url.pathname === "/api/health" && req.method === "GET") {
    return jsonResponse({ ok: true });
  }

  if (url.pathname === "/api/history" && req.method === "GET") {
    const entries = await listHistory();
    return jsonResponse({ entries });
  }

  if (url.pathname === "/api/generate" && req.method === "POST") {
    return handleGenerate(req);
  }

  if (url.pathname === "/api/cover/preprocess" && req.method === "POST") {
    return handleCoverPreprocess(req);
  }

  if (url.pathname === "/api/cover/generate" && req.method === "POST") {
    return handleCoverGenerate(req);
  }

  const historyIdMatch = url.pathname.match(/^\/api\/history\/([^/]+)$/);
  if (historyIdMatch) {
    const id = historyIdMatch[1];
    if (req.method === "GET") {
      const entry = await getHistory(id);
      if (!entry) {
        return jsonResponse({ error: "Entry not found" }, 404);
      }
      return jsonResponse({ entry });
    }
    if (req.method === "PATCH") {
      return handlePatch(id, req);
    }
    if (req.method === "DELETE") {
      return handleDelete(id);
    }
  }

  return jsonResponse({ error: "Not found" }, 404);
});

console.log(`Backend listening on http://localhost:${PORT}`);
