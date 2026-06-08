export type MusicModel = "music-2.6" | "music-2.6-free" | "music-cover" | "music-cover-free";

export type HistoryStatus = "completed" | "failed";

export interface GenerateRequest {
  model: MusicModel;
  prompt: string;
  lyrics?: string;
  isInstrumental: boolean;
  lyricsOptimizer: boolean;
  audioUrl?: string;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  model: MusicModel;
  prompt: string;
  lyrics?: string;
  isInstrumental: boolean;
  lyricsOptimizer: boolean;
  referenceAudioUrl?: string;
  audioUrl?: string;
  title?: string;
  styleTags?: string[];
  pinned?: boolean;
  status: HistoryStatus;
  error?: string;
  traceId?: string;
  durationMs?: number;
}

export const MUSIC_MODELS: { value: MusicModel; label: string }[] = [
  { value: "music-2.6", label: "Music 2.6 (Token Plan)" },
  { value: "music-2.6-free", label: "Music 2.6 Free" },
  { value: "music-cover", label: "Music Cover (Token Plan)" },
  { value: "music-cover-free", label: "Music Cover Free" },
];

export const COVER_MODELS = new Set<MusicModel>(["music-cover", "music-cover-free"]);
