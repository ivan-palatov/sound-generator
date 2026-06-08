export type MusicModel =
  | "music-2.6"
  | "music-2.6-free"
  | "music-cover"
  | "music-cover-free"
  | "speech-2.8-hd"
  | "speech-2.8-turbo";

export type CoverModel = "music-cover" | "music-cover-free";

export type TtsModel = "speech-2.8-hd" | "speech-2.8-turbo";

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

export interface TtsGenerateRequest {
  model: TtsModel;
  text: string;
  audioUrl?: string;
  audioFile?: File | null;
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
  errorCode?: string;
  errorParams?: Record<string, string | number>;
  traceId?: string;
  durationMs?: number;
  voiceId?: string;
}

export const SONG_MODELS: { value: MusicModel }[] = [
  { value: "music-2.6" },
  { value: "music-2.6-free" },
];

export const COVER_MODEL_OPTIONS: { value: CoverModel }[] = [
  { value: "music-cover" },
  { value: "music-cover-free" },
];

export const COVER_MODELS = new Set<MusicModel>(["music-cover", "music-cover-free"]);

export const TTS_MODEL_OPTIONS: { value: TtsModel }[] = [
  { value: "speech-2.8-hd" },
  { value: "speech-2.8-turbo" },
];

export const TTS_MODELS = new Set<TtsModel>(["speech-2.8-hd", "speech-2.8-turbo"]);
