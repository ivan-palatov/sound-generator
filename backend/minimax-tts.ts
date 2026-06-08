import {
  buildT2aAudioSetting,
  buildT2aVoiceSetting,
  resolveLanguageBoost,
  validateTtsSettings,
} from "./generation-settings.ts";
import { ApiError, mapMiniMaxErrorCode } from "./errors.ts";
import type {
  MiniMaxFileUploadResponse,
  MiniMaxT2aResponse,
  MiniMaxVoiceCloneResponse,
  MiniMaxVoiceDesignResponse,
  TtsGenerateRequest,
  TtsModel,
  TtsSettings,
} from "./types.ts";
import { TTS_MODELS } from "./types.ts";

const MINIMAX_FILE_UPLOAD_URL = "https://api.minimax.io/v1/files/upload";
const MINIMAX_VOICE_CLONE_URL = "https://api.minimax.io/v1/voice_clone";
const MINIMAX_VOICE_DESIGN_URL = "https://api.minimax.io/v1/voice_design";
const MINIMAX_T2A_URL = "https://api.minimax.io/v1/t2a_v2";

const MAX_TEXT_LENGTH = 1000;
const MAX_VOICE_PROMPT_LENGTH = 500;
const MAX_PREVIEW_TEXT_LENGTH = 500;

function getApiKey(): string {
  const apiKey = Deno.env.get("MINIMAX_API_KEY");
  if (!apiKey) {
    throw new ApiError("API_KEY_NOT_CONFIGURED");
  }
  return apiKey;
}

function generateVoiceId(): string {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return `TtsVoice_${suffix}`;
}

function hasVoiceSample(req: TtsGenerateRequest): boolean {
  return Boolean(req.audioUrl?.trim() || req.audioBase64?.trim());
}

export function validateTtsRequest(req: TtsGenerateRequest): ApiError | null {
  if (!req.model) return new ApiError("MODEL_REQUIRED");
  if (!TTS_MODELS.has(req.model)) return new ApiError("UNSUPPORTED_TTS_MODEL");

  const text = req.text?.trim();
  if (!text) return new ApiError("SPEECH_TEXT_REQUIRED");
  if (text.length > MAX_TEXT_LENGTH) {
    return new ApiError("SPEECH_TEXT_TOO_LONG", { max: MAX_TEXT_LENGTH });
  }

  const hasUrl = Boolean(req.audioUrl?.trim());
  const hasBase64 = Boolean(req.audioBase64?.trim());
  const hasPrompt = Boolean(req.voicePrompt?.trim());

  if (hasUrl && hasBase64) {
    return new ApiError("VOICE_SAMPLE_BOTH");
  }

  if (!hasUrl && !hasBase64 && !hasPrompt) {
    return new ApiError("VOICE_SOURCE_REQUIRED");
  }

  if (hasPrompt && req.voicePrompt!.trim().length > MAX_VOICE_PROMPT_LENGTH) {
    return new ApiError("VOICE_PROMPT_TOO_LONG", { max: MAX_VOICE_PROMPT_LENGTH });
  }

  const settingsError = validateTtsSettings(req.ttsSettings);
  if (settingsError) return settingsError;

  return null;
}

async function uploadVoiceCloneFile(
  audioBytes: Uint8Array,
  filename: string,
): Promise<number> {
  const apiKey = getApiKey();
  const formData = new FormData();
  formData.append("purpose", "voice_clone");
  const fileBytes = new Uint8Array(audioBytes);
  formData.append(
    "file",
    new File([fileBytes], filename, { type: "application/octet-stream" }),
  );

  const response = await fetch(MINIMAX_FILE_UPLOAD_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  const result = (await response.json()) as MiniMaxFileUploadResponse;
  const statusCode = result.base_resp?.status_code ?? -1;

  if (!response.ok || statusCode !== 0) {
    throw mapMiniMaxErrorCode(
      statusCode,
      result.base_resp?.status_msg ?? "File upload failed",
    );
  }

  const fileId = result.file?.file_id;
  if (fileId == null) {
    throw new ApiError("NO_FILE_ID");
  }

  return fileId;
}

async function fetchAudioFromUrl(url: string): Promise<{ bytes: Uint8Array; filename: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError("VOICE_SAMPLE_FETCH_FAILED");
  }
  const buffer = await response.arrayBuffer();
  const pathname = new URL(url).pathname;
  const filename = pathname.split("/").pop() || "voice_sample.mp3";
  return { bytes: new Uint8Array(buffer), filename };
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function registerClonedVoice(
  fileId: number,
  voiceId: string,
  settings?: TtsSettings,
): Promise<void> {
  const apiKey = getApiKey();
  const payload: Record<string, unknown> = {
    file_id: fileId,
    voice_id: voiceId,
    language_boost: resolveLanguageBoost(settings),
    need_noise_reduction: settings?.needNoiseReduction ?? false,
    need_volume_normalization: settings?.needVolumeNormalization ?? false,
  };

  const response = await fetch(MINIMAX_VOICE_CLONE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as MiniMaxVoiceCloneResponse;
  const statusCode = result.base_resp?.status_code ?? -1;

  if (!response.ok || statusCode !== 0) {
    const err = mapMiniMaxErrorCode(
      statusCode,
      result.base_resp?.status_msg ?? "Voice clone failed",
    );
    err.traceId = result.trace_id;
    throw err;
  }
}

async function designVoiceFromPrompt(
  prompt: string,
  previewText: string,
): Promise<string> {
  const apiKey = getApiKey();

  const response = await fetch(MINIMAX_VOICE_DESIGN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
      preview_text: previewText,
    }),
  });

  const result = (await response.json()) as MiniMaxVoiceDesignResponse;
  const statusCode = result.base_resp?.status_code ?? -1;

  if (!response.ok || statusCode !== 0) {
    const err = mapMiniMaxErrorCode(
      statusCode,
      result.base_resp?.status_msg ?? "Voice design failed",
    );
    err.traceId = result.trace_id;
    throw err;
  }

  const voiceId = result.voice_id;
  if (!voiceId) {
    throw new ApiError("EXTERNAL_SERVICE_ERROR", { message: "No voice ID returned from voice design" });
  }

  return voiceId;
}

async function synthesizeT2a(
  model: TtsModel,
  text: string,
  voiceId: string,
  settings?: TtsSettings,
): Promise<{ audioUrl: string; traceId?: string; durationMs?: number }> {
  const apiKey = getApiKey();

  const response = await fetch(MINIMAX_T2A_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      text,
      stream: false,
      output_format: "url",
      language_boost: resolveLanguageBoost(settings),
      voice_setting: buildT2aVoiceSetting(voiceId, settings),
      audio_setting: buildT2aAudioSetting(settings),
    }),
  });

  const result = (await response.json()) as MiniMaxT2aResponse;
  const statusCode = result.base_resp?.status_code ?? -1;

  if (!response.ok || statusCode !== 0) {
    const err = mapMiniMaxErrorCode(
      statusCode,
      result.base_resp?.status_msg ?? "T2A synthesis failed",
    );
    err.traceId = result.trace_id;
    throw err;
  }

  const audioUrl = result.data?.audio;
  if (!audioUrl) {
    throw new ApiError("NO_TTS_AUDIO");
  }

  return {
    audioUrl,
    traceId: result.trace_id,
    durationMs: result.extra_info?.audio_length,
  };
}

async function generateTtsClone(
  req: TtsGenerateRequest,
): Promise<{ audioUrl: string; traceId?: string; durationMs?: number; voiceId: string }> {
  let audioBytes: Uint8Array;
  let filename: string;

  if (req.audioBase64?.trim()) {
    audioBytes = base64ToBytes(req.audioBase64.trim());
    filename = "voice_sample.mp3";
  } else {
    const fetched = await fetchAudioFromUrl(req.audioUrl!.trim());
    audioBytes = fetched.bytes;
    filename = fetched.filename;
  }

  const fileId = await uploadVoiceCloneFile(audioBytes, filename);
  const voiceId = generateVoiceId();
  await registerClonedVoice(fileId, voiceId, req.ttsSettings);
  const result = await synthesizeT2a(req.model, req.text.trim(), voiceId, req.ttsSettings);

  return {
    ...result,
    voiceId,
  };
}

async function generateTtsFromPrompt(
  req: TtsGenerateRequest,
): Promise<{ audioUrl: string; traceId?: string; durationMs?: number; voiceId: string }> {
  const prompt = req.voicePrompt!.trim();
  const previewText = req.text.trim().slice(0, MAX_PREVIEW_TEXT_LENGTH);
  const voiceId = await designVoiceFromPrompt(prompt, previewText);
  const result = await synthesizeT2a(req.model, req.text.trim(), voiceId, req.ttsSettings);

  return {
    ...result,
    voiceId,
  };
}

export async function generateTts(
  req: TtsGenerateRequest,
): Promise<{ audioUrl: string; traceId?: string; durationMs?: number; voiceId: string }> {
  const validationError = validateTtsRequest(req);
  if (validationError) {
    throw validationError;
  }

  if (hasVoiceSample(req)) {
    return generateTtsClone(req);
  }

  return generateTtsFromPrompt(req);
}
