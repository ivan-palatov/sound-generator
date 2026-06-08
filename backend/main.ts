import { appendHistory, deleteHistory, getHistory, listHistory } from "./history.ts";
import {
  deriveTitleFallback,
  fallbackStyleTags,
  generateSongMetadata,
} from "./minimax-metadata.ts";
import { generateMusic } from "./minimax.ts";
import type { GenerateRequest, HistoryEntry } from "./types.ts";

const PORT = Number(Deno.env.get("PORT") ?? 8000);
const CORS_ORIGIN = Deno.env.get("CORS_ORIGIN") ?? "http://localhost:5173";

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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

  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    model: body.model,
    prompt: body.prompt ?? "",
    lyrics: body.lyrics,
    isInstrumental: body.isInstrumental ?? false,
    lyricsOptimizer: body.lyricsOptimizer ?? false,
    referenceAudioUrl: body.audioUrl,
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

async function handleDelete(id: string): Promise<Response> {
  const deleted = await deleteHistory(id);
  if (!deleted) {
    return jsonResponse({ error: "Entry not found" }, 404);
  }
  return jsonResponse({ ok: true });
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
    if (req.method === "DELETE") {
      return handleDelete(id);
    }
  }

  return jsonResponse({ error: "Not found" }, 404);
});

console.log(`Backend listening on http://localhost:${PORT}`);
