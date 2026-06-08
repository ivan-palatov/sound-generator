import type { CoverGenerateRequest, CoverModel, CoverWorkflow, HistoryEntry } from "../types.ts";

export interface CoverFormState {
  prompt: string;
  audioUrl: string;
  audioFile: File | null;
  workflow: CoverWorkflow;
  lyrics: string;
  coverFeatureId: string;
}

export interface CoverPrefill {
  model: CoverModel;
  form: CoverFormState;
}

export const defaultCoverForm: CoverFormState = {
  prompt: "",
  audioUrl: "",
  audioFile: null,
  workflow: "quick",
  lyrics: "",
  coverFeatureId: "",
};

export function entryToCoverForm(entry: HistoryEntry): CoverFormState {
  const isUploaded = entry.referenceAudioUrl === "(uploaded file)";
  return {
    prompt: entry.prompt,
    audioUrl: isUploaded ? "" : (entry.referenceAudioUrl ?? ""),
    audioFile: null,
    workflow: entry.lyrics?.trim() ? "advanced" : "quick",
    lyrics: entry.lyrics ?? "",
    coverFeatureId: "",
  };
}

export function entryToCoverPrefill(entry: HistoryEntry): CoverPrefill {
  return {
    model: entry.model as CoverModel,
    form: entryToCoverForm(entry),
  };
}

export function coverFormToRequest(model: CoverModel, form: CoverFormState): CoverGenerateRequest {
  const base: CoverGenerateRequest = {
    model,
    prompt: form.prompt,
  };

  if (form.workflow === "advanced") {
    return {
      ...base,
      coverFeatureId: form.coverFeatureId,
      lyrics: form.lyrics,
    };
  }

  if (form.audioFile) {
    return { ...base, audioFile: form.audioFile };
  }

  return { ...base, audioUrl: form.audioUrl.trim() || undefined };
}
