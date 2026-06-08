import type { GenerateRequest, HistoryEntry, MusicModel } from "../types.ts";
import { COVER_MODELS } from "../types.ts";

export interface GenerationPrefill {
  model: MusicModel;
  form: Omit<GenerateRequest, "model">;
}

export const defaultForm: Omit<GenerateRequest, "model"> = {
  prompt: "",
  lyrics: "",
  isInstrumental: false,
  lyricsOptimizer: false,
};

export function entryToForm(entry: HistoryEntry): Omit<GenerateRequest, "model"> {
  return {
    prompt: entry.prompt,
    lyrics: entry.lyrics ?? "",
    isInstrumental: entry.isInstrumental,
    lyricsOptimizer: entry.lyricsOptimizer,
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
