import { ApiError, mapMiniMaxErrorCode } from "./errors.ts";
import {
  buildMusicAudioSetting,
  validateAudioOutputSettings,
} from "./generation-settings.ts";
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

function getApiKey(): string {
  const apiKey = Deno.env.get("MINIMAX_API_KEY");
  if (!apiKey) {
    throw new ApiError("API_KEY_NOT_CONFIGURED");
  }
  return apiKey;
}

function validateMusicAudioSettings(req: {
  audioSettings?: GenerateRequest["audioSettings"];
}): ApiError | null {
  return validateAudioOutputSettings(req.audioSettings);
}

export function validateSongRequest(req: GenerateRequest): ApiError | null {
  if (!req.model) return new ApiError("MODEL_REQUIRED");

  if (COVER_MODELS.has(req.model)) {
    return new ApiError("COVER_MODEL_WRONG_ENDPOINT");
  }

  if (!SONG_MODELS.has(req.model)) {
    return new ApiError("UNSUPPORTED_MODEL");
  }

  if (req.isInstrumental) {
    if (!req.prompt?.trim()) {
      return new ApiError("STYLE_PROMPT_REQUIRED_INSTRUMENTAL");
    }
    if (req.prompt.length > 2000) {
      return new ApiError("STYLE_PROMPT_TOO_LONG", { max: 2000 });
    }
  } else {
    if (req.prompt && req.prompt.length > 2000) {
      return new ApiError("STYLE_PROMPT_TOO_LONG", { max: 2000 });
    }
    if (!req.lyricsOptimizer) {
      if (!req.lyrics?.trim()) {
        return new ApiError("LYRICS_REQUIRED");
      }
      if (req.lyrics.length > 3500) {
        return new ApiError("LYRICS_TOO_LONG", { max: 3500 });
      }
    }
  }

  const audioError = validateMusicAudioSettings(req);
  if (audioError) return audioError;

  return null;
}

export function validateCoverPreprocess(req: CoverPreprocessRequest): ApiError | null {
  if (!req.model) return new ApiError("MODEL_REQUIRED");
  if (!COVER_MODELS.has(req.model)) return new ApiError("UNSUPPORTED_COVER_MODEL");

  const hasUrl = Boolean(req.audioUrl?.trim());
  const hasBase64 = Boolean(req.audioBase64?.trim());

  if (!hasUrl && !hasBase64) {
    return new ApiError("REFERENCE_AUDIO_REQUIRED");
  }
  if (hasUrl && hasBase64) {
    return new ApiError("REFERENCE_AUDIO_BOTH");
  }

  return null;
}

export function validateCoverRequest(req: CoverGenerateRequest): ApiError | null {
  if (!req.model) return new ApiError("MODEL_REQUIRED");
  if (!COVER_MODELS.has(req.model)) return new ApiError("UNSUPPORTED_COVER_MODEL");

  if (!req.prompt?.trim() || req.prompt.length < 10 || req.prompt.length > 300) {
    return new ApiError("STYLE_PROMPT_LENGTH");
  }

  const hasFeatureId = Boolean(req.coverFeatureId?.trim());
  const hasUrl = Boolean(req.audioUrl?.trim());
  const hasBase64 = Boolean(req.audioBase64?.trim());

  if (hasFeatureId) {
    if (hasUrl || hasBase64) {
      return new ApiError("COVER_FEATURE_WITH_AUDIO");
    }
    if (!req.lyrics?.trim() || req.lyrics.length < 10 || req.lyrics.length > 1000) {
      return new ApiError("COVER_LYRICS_LENGTH");
    }
    const audioError = validateMusicAudioSettings(req);
    if (audioError) return audioError;
    return null;
  }

  if (!hasUrl && !hasBase64) {
    return new ApiError("REFERENCE_AUDIO_REQUIRED");
  }
  if (hasUrl && hasBase64) {
    return new ApiError("REFERENCE_AUDIO_BOTH");
  }

  const audioError = validateMusicAudioSettings(req);
  if (audioError) return audioError;

  return null;
}

export async function generateMusic(
  req: GenerateRequest,
): Promise<{ audioUrl?: string; traceId?: string; durationMs?: number }> {
  const validationError = validateSongRequest(req);
  if (validationError) {
    throw validationError;
  }

  const payload: Record<string, unknown> = {
    model: req.model,
    output_format: "url",
    audio_setting: buildMusicAudioSetting(req.audioSettings),
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
    throw validationError;
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
    const err = mapMiniMaxErrorCode(
      statusCode,
      result.base_resp?.status_msg ?? "Request failed",
    );
    err.traceId = result.trace_id;
    throw err;
  }

  if (!result.cover_feature_id || !result.formatted_lyrics) {
    throw new ApiError("NO_COVER_FEATURE_DATA");
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
    throw validationError;
  }

  const payload: Record<string, unknown> = {
    model: req.model,
    output_format: "url",
    audio_setting: buildMusicAudioSetting(req.audioSettings),
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
    const err = mapMiniMaxErrorCode(
      statusCode,
      result.base_resp?.status_msg ?? "Request failed",
    );
    err.traceId = result.trace_id;
    throw err;
  }

  const audioUrl = result.data?.audio;
  if (!audioUrl) {
    throw new ApiError("NO_AUDIO_URL");
  }

  return {
    audioUrl,
    traceId: result.trace_id,
    durationMs: result.extra_info?.music_duration,
  };
}

// Re-export for minimax-tts compatibility
export { mapMiniMaxErrorCode as mapMiniMaxError };
