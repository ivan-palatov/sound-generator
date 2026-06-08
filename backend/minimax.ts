import type { GenerateRequest, MiniMaxMusicResponse } from "./types.ts";

const MINIMAX_URL = "https://api.minimax.io/v1/music_generation";

const ERROR_MESSAGES: Record<number, string> = {
  1002: "Rate limit triggered — please retry later",
  1004: "Authentication failed — check your API key",
  1008: "Insufficient balance",
  1026: "Content flagged for sensitive material",
  2013: "Invalid parameters — check your input",
  2049: "Invalid API key",
};

const COVER_MODELS = new Set(["music-cover", "music-cover-free"]);
const MUSIC_MODELS = new Set(["music-2.6", "music-2.6-free"]);

export function validateRequest(req: GenerateRequest): string | null {
  if (!req.model) return "Model is required";

  if (COVER_MODELS.has(req.model)) {
    if (!req.audioUrl?.trim()) {
      return "Reference audio URL is required for cover models";
    }
    if (!req.prompt?.trim() || req.prompt.length < 10 || req.prompt.length > 300) {
      return "Style prompt must be 10–300 characters for cover models";
    }
    return null;
  }

  if (!MUSIC_MODELS.has(req.model)) {
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

export function mapMiniMaxError(statusCode: number, statusMsg: string): string {
  return ERROR_MESSAGES[statusCode] ?? statusMsg ?? "Unknown error";
}

export async function generateMusic(
  req: GenerateRequest,
): Promise<{ audioUrl?: string; traceId?: string; durationMs?: number }> {
  const apiKey = Deno.env.get("MINIMAX_API_KEY");
  if (!apiKey) {
    throw new Error("MINIMAX_API_KEY is not configured");
  }

  const validationError = validateRequest(req);
  if (validationError) {
    throw new Error(validationError);
  }

  const payload: Record<string, unknown> = {
    model: req.model,
    output_format: "url",
    audio_setting: {
      sample_rate: 44100,
      bitrate: 256000,
      format: "mp3",
    },
  };

  if (req.prompt?.trim()) payload.prompt = req.prompt.trim();
  if (req.lyrics?.trim()) payload.lyrics = req.lyrics.trim();
  if (MUSIC_MODELS.has(req.model)) {
    payload.is_instrumental = req.isInstrumental;
    payload.lyrics_optimizer = req.lyricsOptimizer;
  }
  if (COVER_MODELS.has(req.model) && req.audioUrl?.trim()) {
    payload.audio_url = req.audioUrl.trim();
  }

  const response = await fetch(MINIMAX_URL, {
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
