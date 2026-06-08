import type { HistoryEntry, TtsGenerateRequest, TtsModel } from "../types.ts";
import { TTS_MODELS } from "../types.ts";

export interface TtsFormState {
  text: string;
  audioFile: File | null;
  audioUrl: string;
}

export interface TtsPrefill {
  model: TtsModel;
  form: TtsFormState;
}

export const defaultTtsForm: TtsFormState = {
  text: "",
  audioFile: null,
  audioUrl: "",
};

export function isTtsEntry(entry: HistoryEntry): boolean {
  return TTS_MODELS.has(entry.model as TtsModel);
}

export function entryToTtsForm(entry: HistoryEntry): TtsFormState {
  return {
    text: entry.prompt,
    audioFile: null,
    audioUrl: entry.referenceAudioUrl?.startsWith("http") ? entry.referenceAudioUrl : "",
  };
}

export function entryToTtsPrefill(entry: HistoryEntry): TtsPrefill {
  return {
    model: entry.model as TtsModel,
    form: entryToTtsForm(entry),
  };
}

export function ttsFormToRequest(model: TtsModel, form: TtsFormState): TtsGenerateRequest {
  return {
    model,
    text: form.text.trim(),
    audioUrl: form.audioFile ? undefined : form.audioUrl.trim() || undefined,
    audioFile: form.audioFile,
  };
}
