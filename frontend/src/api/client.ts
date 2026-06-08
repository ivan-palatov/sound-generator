import type {
  CoverGenerateRequest,
  CoverModel,
  CoverPreprocessResponse,
  GenerateRequest,
  HistoryEntry,
  TtsGenerateRequest,
} from "../types.ts";
import {
  ApiClientError,
  type ApiErrorParams,
} from "../lib/translateError.ts";

interface ApiErrorBody {
  errorCode?: string;
  errorParams?: ApiErrorParams;
  error?: string;
}

function parseApiError(data: ApiErrorBody, fallbackCode: string): ApiClientError {
  const code = data.errorCode ?? fallbackCode;
  return new ApiClientError(code, data.errorParams);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const data = await response.json();

  if (!response.ok) {
    throw parseApiError(data as ApiErrorBody, "REQUEST_FAILED");
  }

  return data as T;
}

function buildCoverFormData(
  fields: Record<string, string | undefined>,
  audioFile?: File | null,
): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== "") {
      formData.append(key, value);
    }
  }
  if (audioFile) {
    formData.append("audio", audioFile);
  }
  return formData;
}

export interface GenerationError {
  code: string;
  params?: ApiErrorParams;
}

function parseGenerationResponse(
  data: ApiErrorBody & { entry?: HistoryEntry },
): { entry: HistoryEntry; error?: GenerationError } {
  if (data.errorCode) {
    return {
      entry: data.entry!,
      error: { code: data.errorCode, params: data.errorParams },
    };
  }
  return { entry: data.entry! };
}

export async function fetchHistory(): Promise<HistoryEntry[]> {
  const data = await request<{ entries: HistoryEntry[] }>("/api/history");
  return data.entries;
}

export async function fetchHistoryEntry(id: string): Promise<HistoryEntry> {
  const data = await request<{ entry: HistoryEntry }>(`/api/history/${id}`);
  return data.entry;
}

export async function generateMusic(
  body: GenerateRequest,
): Promise<{ entry: HistoryEntry; error?: GenerationError }> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (response.status === 422) {
    return parseGenerationResponse(data);
  }

  if (!response.ok) {
    throw parseApiError(data as ApiErrorBody, "GENERATION_FAILED");
  }

  return { entry: data.entry };
}

export async function preprocessCover(input: {
  model: CoverModel;
  audioUrl?: string;
  audioFile?: File | null;
}): Promise<CoverPreprocessResponse> {
  const hasFile = Boolean(input.audioFile);

  const response = await fetch(
    "/api/cover/preprocess",
    hasFile
      ? {
          method: "POST",
          body: buildCoverFormData({ model: input.model, audioUrl: input.audioUrl }, input.audioFile),
        }
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: input.model,
            audioUrl: input.audioUrl,
          }),
        },
  );

  const data = await response.json();

  if (!response.ok) {
    throw parseApiError(data as ApiErrorBody, "PREPROCESS_FAILED");
  }

  return data as CoverPreprocessResponse;
}

export async function generateCover(
  body: CoverGenerateRequest,
): Promise<{ entry: HistoryEntry; error?: GenerationError }> {
  const hasFile = Boolean(body.audioFile);

  const response = await fetch(
    "/api/cover/generate",
    hasFile
      ? {
          method: "POST",
          body: buildCoverFormData(
            {
              model: body.model,
              prompt: body.prompt,
              audioUrl: body.audioUrl,
              coverFeatureId: body.coverFeatureId,
              lyrics: body.lyrics,
            },
            body.audioFile,
          ),
        }
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: body.model,
            prompt: body.prompt,
            audioUrl: body.audioUrl,
            coverFeatureId: body.coverFeatureId,
            lyrics: body.lyrics,
          }),
        },
  );

  const data = await response.json();

  if (response.status === 422) {
    return parseGenerationResponse(data);
  }

  if (!response.ok) {
    throw parseApiError(data as ApiErrorBody, "COVER_GENERATION_FAILED");
  }

  return { entry: data.entry };
}

export async function generateTts(
  body: TtsGenerateRequest,
): Promise<{ entry: HistoryEntry; error?: GenerationError }> {
  const hasFile = Boolean(body.audioFile);

  const response = await fetch(
    "/api/tts/generate",
    hasFile
      ? {
          method: "POST",
          body: buildCoverFormData(
            {
              model: body.model,
              text: body.text,
              audioUrl: body.audioUrl,
            },
            body.audioFile,
          ),
        }
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: body.model,
            text: body.text,
            audioUrl: body.audioUrl,
          }),
        },
  );

  const data = await response.json();

  if (response.status === 422) {
    return parseGenerationResponse(data);
  }

  if (!response.ok) {
    throw parseApiError(data as ApiErrorBody, "TTS_GENERATION_FAILED");
  }

  return { entry: data.entry };
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  await request(`/api/history/${id}`, { method: "DELETE" });
}

export async function updateHistoryEntry(
  id: string,
  patch: { title?: string; pinned?: boolean },
): Promise<HistoryEntry> {
  const data = await request<{ entry: HistoryEntry }>(`/api/history/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return data.entry;
}

export { translateError, ApiClientError, isApiClientError } from "../lib/translateError.ts";
