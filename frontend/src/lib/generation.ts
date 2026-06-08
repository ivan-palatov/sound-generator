import type { GenerateRequest, HistoryEntry, MusicModel } from "../types.ts";

export interface GenerationPrefill {
  model: MusicModel;
  form: Omit<GenerateRequest, "model">;
}

export const defaultForm: Omit<GenerateRequest, "model"> = {
  prompt: "",
  lyrics: "",
  isInstrumental: false,
  lyricsOptimizer: false,
  audioUrl: "",
};

export function entryToForm(entry: HistoryEntry): Omit<GenerateRequest, "model"> {
  return {
    prompt: entry.prompt,
    lyrics: entry.lyrics ?? "",
    isInstrumental: entry.isInstrumental,
    lyricsOptimizer: entry.lyricsOptimizer,
    audioUrl: entry.referenceAudioUrl ?? "",
  };
}

export function entryToPrefill(entry: HistoryEntry): GenerationPrefill {
  return {
    model: entry.model,
    form: entryToForm(entry),
  };
}
