import {
  parseCoverGenerateRequest,
  parseCoverPreprocessRequest,
  referenceAudioLabel,
} from "./cover-parse.ts";
import { parseTtsGenerateRequest, referenceAudioLabel as ttsReferenceAudioLabel } from "./tts-parse.ts";
import { apiErrorResponse, ApiError, isApiError } from "./errors.ts";
import {
  appendHistory,
  deleteHistory,
  getHistory,
  listHistory,
  updateHistory,
} from "./history.ts";
import {
  deriveTitleFallback,
  deriveTtsTitleFallback,
  fallbackStyleTags,
  generateCoverMetadata,
  generateSongMetadata,
  generateTtsMetadata,
} from "./minimax-metadata.ts";
import { generateCover, generateMusic, preprocessCover } from "./minimax.ts";
import { generateTts } from "./minimax-tts.ts";
import { COVER_MODELS, TTS_MODELS } from "./types.ts";
import type {
  CoverGenerateRequest,
  GenerateRequest,
  HistoryEntry,
  TtsGenerateRequest,
  TtsModel,
} from "./types.ts";

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

function errorStatus(err: ApiError): number {
  const clientErrors: Set<string> = new Set([
    "INVALID_JSON",
    "INVALID_REQUEST_BODY",
    "COVER_MODEL_WRONG_ENDPOINT",
    "TTS_MODEL_WRONG_ENDPOINT",
    "MODEL_REQUIRED",
    "UNSUPPORTED_MODEL",
    "UNSUPPORTED_COVER_MODEL",
    "UNSUPPORTED_TTS_MODEL",
    "VALID_COVER_MODEL_REQUIRED",
    "VALID_TTS_MODEL_REQUIRED",
    "STYLE_PROMPT_REQUIRED_INSTRUMENTAL",
    "STYLE_PROMPT_TOO_LONG",
    "LYRICS_REQUIRED",
    "LYRICS_TOO_LONG",
    "REFERENCE_AUDIO_REQUIRED",
    "REFERENCE_AUDIO_BOTH",
    "REFERENCE_AUDIO_TOO_LARGE",
    "STYLE_PROMPT_LENGTH",
    "COVER_FEATURE_WITH_AUDIO",
    "COVER_LYRICS_LENGTH",
    "SPEECH_TEXT_REQUIRED",
    "SPEECH_TEXT_TOO_LONG",
    "VOICE_SOURCE_REQUIRED",
    "VOICE_PROMPT_TOO_LONG",
    "VOICE_SAMPLE_BOTH",
    "VOICE_SAMPLE_TOO_LARGE",
    "UNKNOWN_FIELDS",
    "TITLE_NOT_STRING",
    "TITLE_EMPTY",
    "TITLE_TOO_LONG",
    "PINNED_NOT_BOOLEAN",
    "NO_VALID_FIELDS",
  ]);

  if (clientErrors.has(err.code)) return 400;
  return 422;
}

function applyErrorToEntry(entry: HistoryEntry, err: ApiError): void {
  entry.errorCode = err.code;
  if (err.params) entry.errorParams = err.params;
  entry.traceId = err.traceId;
}

async function handleGenerate(req: Request): Promise<Response> {
  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return jsonResponse({ errorCode: "INVALID_JSON" }, 400);
  }

  if (COVER_MODELS.has(body.model)) {
    return jsonResponse({ errorCode: "COVER_MODEL_WRONG_ENDPOINT" }, 400);
  }

  if (TTS_MODELS.has(body.model as TtsModel)) {
    return jsonResponse({ errorCode: "TTS_MODEL_WRONG_ENDPOINT" }, 400);
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
    if (isApiError(err)) {
      applyErrorToEntry(entry, err);
      await appendHistory(entry);
      return jsonResponse(apiErrorResponse(err, { entry }), 422);
    }
    throw err;
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
    if (isApiError(err)) {
      return jsonResponse(apiErrorResponse(err), errorStatus(err));
    }
    throw err;
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
    if (isApiError(err)) {
      return jsonResponse(apiErrorResponse(err), errorStatus(err));
    }
    return jsonResponse({ errorCode: "INVALID_REQUEST_BODY" }, 400);
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
    if (isApiError(err)) {
      applyErrorToEntry(entry, err);
      await appendHistory(entry);
      return jsonResponse(apiErrorResponse(err, { entry }), 422);
    }
    throw err;
  }

  await appendHistory(entry);
  return jsonResponse({ entry });
}

function ttsEntryFromRequest(body: TtsGenerateRequest): HistoryEntry {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    model: body.model,
    prompt: body.text ?? "",
    isInstrumental: false,
    lyricsOptimizer: false,
    referenceAudioUrl: ttsReferenceAudioLabel(body),
    voicePrompt: body.voicePrompt?.trim() || undefined,
    status: "failed",
  };
}

async function handleTtsGenerate(req: Request): Promise<Response> {
  let body: TtsGenerateRequest;
  try {
    body = await parseTtsGenerateRequest(req);
  } catch (err) {
    if (isApiError(err)) {
      return jsonResponse(apiErrorResponse(err), errorStatus(err));
    }
    return jsonResponse({ errorCode: "INVALID_REQUEST_BODY" }, 400);
  }

  const entry = ttsEntryFromRequest(body);

  try {
    const result = await generateTts(body);
    entry.status = "completed";
    entry.audioUrl = result.audioUrl;
    entry.traceId = result.traceId;
    entry.durationMs = result.durationMs;
    entry.voiceId = result.voiceId;

    const metadata = await generateTtsMetadata(body.text);
    if (metadata) {
      entry.title = metadata.title;
      entry.styleTags = metadata.styleTags;
    } else {
      entry.title = deriveTtsTitleFallback(body.text);
      entry.styleTags = ["Speech", "TTS"];
    }
  } catch (err) {
    if (isApiError(err)) {
      applyErrorToEntry(entry, err);
      await appendHistory(entry);
      return jsonResponse(apiErrorResponse(err, { entry }), 422);
    }
    throw err;
  }

  await appendHistory(entry);
  return jsonResponse({ entry });
}

async function handleDelete(id: string): Promise<Response> {
  const deleted = await deleteHistory(id);
  if (!deleted) {
    return jsonResponse({ errorCode: "ENTRY_NOT_FOUND" }, 404);
  }
  return jsonResponse({ ok: true });
}

const MAX_TITLE_LENGTH = 200;

async function handlePatch(id: string, req: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ errorCode: "INVALID_JSON" }, 400);
  }

  const allowedKeys = new Set(["title", "pinned"]);
  const unknownKeys = Object.keys(body).filter((k) => !allowedKeys.has(k));
  if (unknownKeys.length > 0) {
    return jsonResponse({ errorCode: "UNKNOWN_FIELDS", errorParams: { fields: unknownKeys.join(", ") } }, 400);
  }

  const patch: { title?: string; pinned?: boolean } = {};

  if ("title" in body) {
    if (typeof body.title !== "string") {
      return jsonResponse({ errorCode: "TITLE_NOT_STRING" }, 400);
    }
    const title = body.title.trim();
    if (!title) {
      return jsonResponse({ errorCode: "TITLE_EMPTY" }, 400);
    }
    if (title.length > MAX_TITLE_LENGTH) {
      return jsonResponse({ errorCode: "TITLE_TOO_LONG", errorParams: { max: MAX_TITLE_LENGTH } }, 400);
    }
    patch.title = title;
  }

  if ("pinned" in body) {
    if (typeof body.pinned !== "boolean") {
      return jsonResponse({ errorCode: "PINNED_NOT_BOOLEAN" }, 400);
    }
    patch.pinned = body.pinned;
  }

  if (Object.keys(patch).length === 0) {
    return jsonResponse({ errorCode: "NO_VALID_FIELDS" }, 400);
  }

  const entry = await updateHistory(id, patch);
  if (!entry) {
    return jsonResponse({ errorCode: "ENTRY_NOT_FOUND" }, 404);
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

  if (url.pathname === "/api/tts/generate" && req.method === "POST") {
    return handleTtsGenerate(req);
  }

  const historyIdMatch = url.pathname.match(/^\/api\/history\/([^/]+)$/);
  if (historyIdMatch) {
    const id = historyIdMatch[1];
    if (req.method === "GET") {
      const entry = await getHistory(id);
      if (!entry) {
        return jsonResponse({ errorCode: "ENTRY_NOT_FOUND" }, 404);
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

  return jsonResponse({ errorCode: "NOT_FOUND" }, 404);
});

console.log(`Backend listening on http://localhost:${PORT}`);
