import { ApiError } from "./errors.ts";
import type { CoverGenerateRequest, CoverModel, CoverPreprocessRequest } from "./types.ts";
import { COVER_MODELS } from "./types.ts";

const MAX_AUDIO_BYTES = 50 * 1024 * 1024;

function parseCoverModel(value: string | null): CoverModel | null {
  if (value && COVER_MODELS.has(value as CoverModel)) {
    return value as CoverModel;
  }
  return null;
}

async function fileToBase64(file: File): Promise<string> {
  if (file.size > MAX_AUDIO_BYTES) {
    throw new ApiError("REFERENCE_AUDIO_TOO_LARGE", { maxMB: 50 });
  }
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export async function parseCoverPreprocessRequest(
  req: Request,
): Promise<CoverPreprocessRequest> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const model = parseCoverModel(form.get("model")?.toString() ?? null);
    if (!model) throw new ApiError("VALID_COVER_MODEL_REQUIRED");

    const audioUrl = form.get("audioUrl")?.toString().trim();
    const audioFile = form.get("audio");

    if (audioFile instanceof File && audioFile.size > 0) {
      return {
        model,
        audioBase64: await fileToBase64(audioFile),
      };
    }

    return { model, audioUrl: audioUrl || undefined };
  }

  const body = (await req.json()) as CoverPreprocessRequest;
  return body;
}

export async function parseCoverGenerateRequest(
  req: Request,
): Promise<CoverGenerateRequest> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const model = parseCoverModel(form.get("model")?.toString() ?? null);
    if (!model) throw new ApiError("VALID_COVER_MODEL_REQUIRED");

    const prompt = form.get("prompt")?.toString() ?? "";
    const coverFeatureId = form.get("coverFeatureId")?.toString().trim();
    const lyrics = form.get("lyrics")?.toString();
    const audioUrl = form.get("audioUrl")?.toString().trim();
    const audioFile = form.get("audio");

    if (coverFeatureId) {
      return {
        model,
        prompt,
        coverFeatureId,
        lyrics: lyrics ?? undefined,
      };
    }

    if (audioFile instanceof File && audioFile.size > 0) {
      return {
        model,
        prompt,
        audioBase64: await fileToBase64(audioFile),
      };
    }

    return {
      model,
      prompt,
      audioUrl: audioUrl || undefined,
    };
  }

  const body = (await req.json()) as CoverGenerateRequest;
  return body;
}

export function referenceAudioLabel(req: CoverGenerateRequest): string | undefined {
  if (req.coverFeatureId) return undefined;
  if (req.audioUrl?.trim()) return req.audioUrl.trim();
  if (req.audioBase64?.trim()) return "(uploaded file)";
  return undefined;
}
