import type { GenerateRequest, HistoryEntry } from "../types.ts";

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
    audioUrl: "",
  };
}
