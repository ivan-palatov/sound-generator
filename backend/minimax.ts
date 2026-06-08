import type {
  CoverGenerateRequest,
  CoverPreprocessRequest,
  CoverPreprocessResponse,
  GenerateRequest,
  MiniMaxCoverPreprocessResponse,
  MiniMaxMusicResponse,
} from "./types.ts";
import { COVER_MODELS, SONG_MODELS } from "./types.ts";

const MINIMAX_MUSIC_URL = "https://api.minimax.io/v1/music_generation";
const MINIMAX_COVER_PREPROCESS_URL = "https://api.minimax.io/v1/music_cover_preprocess";

const ERROR_MESSAGES: Record<number, string> = {
  1002: "Rate limit triggered — please retry later",
  1004: "Authentication failed — check your API key",
  1008: "Insufficient balance",
  1026: "Content flagged for sensitive material",
  2013: "Invalid parameters — check your input",
  2049: "Invalid API key",
};

const AUDIO_SETTING = {
  sample_rate: 44100,
  bitrate: 256000,
  format: "mp3",
};

function getApiKey(): string {
  const apiKey = Deno.env.get("MINIMAX_API_KEY");
  if (!apiKey) {
    throw new Error("MINIMAX_API_KEY is not configured");
  }
  return apiKey;
}

export function mapMiniMaxError(statusCode: number, statusMsg: string): string {
  return ERROR_MESSAGES[statusCode] ?? statusMsg ?? "Unknown error";
}

export function validateSongRequest(req: GenerateRequest): string | null {
  if (!req.model) return "Model is required";

  if (COVER_MODELS.has(req.model)) {
    return "Cover models must use /api/cover/generate";
  }

  if (!SONG_MODELS.has(req.model)) {
    return "Unsupported model";
  }

  if (req.isInstrumental) {
    if (!req.prompt?.trim()) {
      return "Style prompt is required for instrumental music";
    }
    if (req.prompt.length > 2000) {
      return "Style prompt must be at most 2000 characters";
    }
  } else {
    if (req.prompt && req.prompt.length > 2000) {
      return "Style prompt must be at most 2000 characters";
    }
    if (!req.lyricsOptimizer) {
      if (!req.lyrics?.trim()) {
        return "Lyrics are required unless auto-generate is enabled";
      }
      if (req.lyrics.length > 3500) {
        return "Lyrics must be at most 3500 characters";
      }
    }
  }

  return null;
}

export function validateCoverPreprocess(req: CoverPreprocessRequest): string | null {
  if (!req.model) return "Model is required";
  if (!COVER_MODELS.has(req.model)) return "Unsupported cover model";

  const hasUrl = Boolean(req.audioUrl?.trim());
  const hasBase64 = Boolean(req.audioBase64?.trim());

  if (!hasUrl && !hasBase64) {
    return "Reference audio URL or file is required";
  }
  if (hasUrl && hasBase64) {
    return "Provide either reference audio URL or file, not both";
  }

  return null;
}

export function validateCoverRequest(req: CoverGenerateRequest): string | null {
  if (!req.model) return "Model is required";
  if (!COVER_MODELS.has(req.model)) return "Unsupported cover model";

  if (!req.prompt?.trim() || req.prompt.length < 10 || req.prompt.length > 300) {
    return "Style prompt must be 10–300 characters";
  }

  const hasFeatureId = Boolean(req.coverFeatureId?.trim());
  const hasUrl = Boolean(req.audioUrl?.trim());
  const hasBase64 = Boolean(req.audioBase64?.trim());

  if (hasFeatureId) {
    if (hasUrl || hasBase64) {
      return "coverFeatureId cannot be used with reference audio";
    }
    if (!req.lyrics?.trim() || req.lyrics.length < 10 || req.lyrics.length > 1000) {
      return "Lyrics must be 10–1000 characters for advanced cover";
    }
    return null;
  }

  if (!hasUrl && !hasBase64) {
    return "Reference audio URL or file is required";
  }
  if (hasUrl && hasBase64) {
    return "Provide either reference audio URL or file, not both";
  }

  return null;
}

export async function generateMusic(
  req: GenerateRequest,
): Promise<{ audioUrl?: string; traceId?: string; durationMs?: number }> {
  const validationError = validateSongRequest(req);
  if (validationError) {
    throw new Error(validationError);
  }

  const payload: Record<string, unknown> = {
    model: req.model,
    output_format: "url",
    audio_setting: AUDIO_SETTING,
    is_instrumental: req.isInstrumental,
    lyrics_optimizer: req.lyricsOptimizer,
  };

  if (req.prompt?.trim()) payload.prompt = req.prompt.trim();
  if (req.lyrics?.trim()) payload.lyrics = req.lyrics.trim();

  return callMusicGeneration(payload);
}

export async function preprocessCover(
  req: CoverPreprocessRequest,
): Promise<CoverPreprocessResponse> {
  const validationError = validateCoverPreprocess(req);
  if (validationError) {
    throw new Error(validationError);
  }

  const payload: Record<string, unknown> = { model: req.model };
  if (req.audioUrl?.trim()) payload.audio_url = req.audioUrl.trim();
  if (req.audioBase64?.trim()) payload.audio_base64 = req.audioBase64.trim();

  const apiKey = getApiKey();
  const response = await fetch(MINIMAX_COVER_PREPROCESS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as MiniMaxCoverPreprocessResponse;
  const statusCode = result.base_resp?.status_code ?? -1;

  if (!response.ok || statusCode !== 0) {
    const message = mapMiniMaxError(
      statusCode,
      result.base_resp?.status_msg ?? "Request failed",
    );
    const error = new Error(message) as Error & { traceId?: string };
    error.traceId = result.trace_id;
    throw error;
  }

  if (!result.cover_feature_id || !result.formatted_lyrics) {
    throw new Error("No cover feature data returned from MiniMax");
  }

  return {
    coverFeatureId: result.cover_feature_id,
    formattedLyrics: result.formatted_lyrics,
    audioDuration: result.audio_duration,
    structureResult: result.structure_result,
    traceId: result.trace_id,
  };
}

export async function generateCover(
  req: CoverGenerateRequest,
): Promise<{ audioUrl?: string; traceId?: string; durationMs?: number }> {
  const validationError = validateCoverRequest(req);
  if (validationError) {
    throw new Error(validationError);
  }

  const payload: Record<string, unknown> = {
    model: req.model,
    output_format: "url",
    audio_setting: AUDIO_SETTING,
    prompt: req.prompt.trim(),
  };

  if (req.coverFeatureId?.trim()) {
    payload.cover_feature_id = req.coverFeatureId.trim();
    payload.lyrics = req.lyrics!.trim();
  } else if (req.audioUrl?.trim()) {
    payload.audio_url = req.audioUrl.trim();
  } else if (req.audioBase64?.trim()) {
    payload.audio_base64 = req.audioBase64.trim();
  }

  return callMusicGeneration(payload);
}

async function callMusicGeneration(
  payload: Record<string, unknown>,
): Promise<{ audioUrl?: string; traceId?: string; durationMs?: number }> {
  const apiKey = getApiKey();

  const response = await fetch(MINIMAX_MUSIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as MiniMaxMusicResponse;
  const statusCode = result.base_resp?.status_code ?? -1;

  if (!response.ok || statusCode !== 0) {
    const message = mapMiniMaxError(
      statusCode,
      result.base_resp?.status_msg ?? "Request failed",
    );
    const error = new Error(message) as Error & { traceId?: string };
    error.traceId = result.trace_id;
    throw error;
  }

  const audioUrl = result.data?.audio;
  if (!audioUrl) {
    throw new Error("No audio URL returned from MiniMax");
  }

  return {
    audioUrl,
    traceId: result.trace_id,
    durationMs: result.extra_info?.music_duration,
  };
}
