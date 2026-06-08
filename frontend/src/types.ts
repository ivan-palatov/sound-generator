export type MusicModel = "music-2.6" | "music-2.6-free" | "music-cover" | "music-cover-free";

export type CoverModel = "music-cover" | "music-cover-free";

export type CoverWorkflow = "quick" | "advanced";

export type HistoryStatus = "completed" | "failed";

export interface GenerateRequest {
  model: MusicModel;
  prompt: string;
  lyrics?: string;
  isInstrumental: boolean;
  lyricsOptimizer: boolean;
}

export interface CoverPreprocessResponse {
  coverFeatureId: string;
  formattedLyrics: string;
  audioDuration?: number;
  structureResult?: string;
  traceId?: string;
}

export interface CoverGenerateRequest {
  model: CoverModel;
  prompt: string;
  audioUrl?: string;
  audioFile?: File | null;
  coverFeatureId?: string;
  lyrics?: string;
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

export const SONG_MODELS: { value: MusicModel; label: string }[] = [
  { value: "music-2.6", label: "Music 2.6 (Token Plan)" },
  { value: "music-2.6-free", label: "Music 2.6 Free" },
];

export const COVER_MODEL_OPTIONS: { value: CoverModel; label: string }[] = [
  { value: "music-cover", label: "Music Cover (Token Plan)" },
  { value: "music-cover-free", label: "Music Cover Free" },
];

export const COVER_MODELS = new Set<MusicModel>(["music-cover", "music-cover-free"]);
