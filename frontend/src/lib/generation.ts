import type { GenerateRequest, HistoryEntry, MusicModel } from "../types.ts";
import { COVER_MODELS } from "../types.ts";
import {
  DEFAULT_AUDIO_OUTPUT_SETTINGS,
  mergeAudioSettings,
  stripDefaultAudioSettings,
} from "./generationOptions.ts";

export interface GenerationPrefill {
  model: MusicModel;
  form: Omit<GenerateRequest, "model">;
}

export const defaultForm: Omit<GenerateRequest, "model"> = {
  prompt: "",
  lyrics: "",
  isInstrumental: false,
  lyricsOptimizer: false,
  audioSettings: { ...DEFAULT_AUDIO_OUTPUT_SETTINGS },
};

export function entryToForm(entry: HistoryEntry): Omit<GenerateRequest, "model"> {
  return {
    prompt: entry.prompt,
    lyrics: entry.lyrics ?? "",
    isInstrumental: entry.isInstrumental,
    lyricsOptimizer: entry.lyricsOptimizer,
    audioSettings: mergeAudioSettings(entry.audioSettings),
  };
}

export function entryToPrefill(entry: HistoryEntry): GenerationPrefill {
  return {
    model: entry.model,
    form: entryToForm(entry),
  };
}

export function isCoverEntry(entry: HistoryEntry): boolean {
  return COVER_MODELS.has(entry.model);
}

export function formToRequest(
  model: MusicModel,
  form: Omit<GenerateRequest, "model">,
): GenerateRequest {
  return {
    model,
    prompt: form.prompt,
    lyrics: form.lyrics,
    isInstrumental: form.isInstrumental,
    lyricsOptimizer: form.lyricsOptimizer,
    audioSettings: stripDefaultAudioSettings(mergeAudioSettings(form.audioSettings)),
  };
}
