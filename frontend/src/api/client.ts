import type {
  CoverGenerateRequest,
  CoverModel,
  CoverPreprocessResponse,
  GenerateRequest,
  HistoryEntry,
} from "../types.ts";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Request failed");
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
): Promise<{ entry: HistoryEntry; error?: string }> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (response.status === 422) {
    return { entry: data.entry, error: data.error };
  }

  if (!response.ok) {
    throw new Error(data.error ?? "Generation failed");
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
    throw new Error(data.error ?? "Preprocess failed");
  }

  return data as CoverPreprocessResponse;
}

export async function generateCover(
  body: CoverGenerateRequest,
): Promise<{ entry: HistoryEntry; error?: string }> {
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
    return { entry: data.entry, error: data.error };
  }

  if (!response.ok) {
    throw new Error(data.error ?? "Cover generation failed");
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
