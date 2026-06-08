import type { CoverGenerateRequest, CoverModel, CoverWorkflow, HistoryEntry } from "../types.ts";
import {
  DEFAULT_AUDIO_OUTPUT_SETTINGS,
  mergeAudioSettings,
  stripDefaultAudioSettings,
} from "./generationOptions.ts";

export interface CoverFormState {
  prompt: string;
  audioUrl: string;
  audioFile: File | null;
  workflow: CoverWorkflow;
  lyrics: string;
  coverFeatureId: string;
  audioSettings: NonNullable<CoverGenerateRequest["audioSettings"]>;
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
  audioSettings: { ...DEFAULT_AUDIO_OUTPUT_SETTINGS },
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
    audioSettings: mergeAudioSettings(entry.audioSettings),
  };
}

export function entryToCoverPrefill(entry: HistoryEntry): CoverPrefill {
  return {
    model: entry.model as CoverModel,
    form: entryToCoverForm(entry),
  };
}

export function coverFormToRequest(model: CoverModel, form: CoverFormState): CoverGenerateRequest {
  const audioSettings = stripDefaultAudioSettings(form.audioSettings);
  const base: CoverGenerateRequest = {
    model,
    prompt: form.prompt,
    audioSettings,
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
