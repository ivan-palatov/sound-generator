import type { TtsGenerateRequest, TtsModel } from "./types.ts";
import { TTS_MODELS } from "./types.ts";

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

function parseTtsModel(value: string | null): TtsModel | null {
  if (value && TTS_MODELS.has(value as TtsModel)) {
    return value as TtsModel;
  }
  return null;
}

async function fileToBase64(file: File): Promise<string> {
  if (file.size > MAX_AUDIO_BYTES) {
    throw new Error("Voice sample must be at most 20 MB");
  }
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export async function parseTtsGenerateRequest(req: Request): Promise<TtsGenerateRequest> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const model = parseTtsModel(form.get("model")?.toString() ?? null);
    if (!model) throw new Error("Valid TTS model is required");

    const text = form.get("text")?.toString() ?? "";
    const audioUrl = form.get("audioUrl")?.toString().trim();
    const audioFile = form.get("audio");

    if (audioFile instanceof File && audioFile.size > 0) {
      return {
        model,
        text,
        audioBase64: await fileToBase64(audioFile),
      };
    }

    return { model, text, audioUrl: audioUrl || undefined };
  }

  const body = (await req.json()) as TtsGenerateRequest;
  return body;
}

export function referenceAudioLabel(req: TtsGenerateRequest): string | undefined {
  if (req.audioUrl?.trim()) return req.audioUrl.trim();
  if (req.audioBase64?.trim()) return "(uploaded file)";
  return undefined;
}
