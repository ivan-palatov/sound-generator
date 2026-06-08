export type MusicModel =
  | "music-2.6"
  | "music-2.6-free"
  | "music-cover"
  | "music-cover-free";

export type CoverModel = "music-cover" | "music-cover-free";

export type HistoryStatus = "completed" | "failed";

export interface GenerateRequest {
  model: MusicModel;
  prompt: string;
  lyrics?: string;
  isInstrumental: boolean;
  lyricsOptimizer: boolean;
}

export interface CoverPreprocessRequest {
  model: CoverModel;
  audioUrl?: string;
  audioBase64?: string;
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
  audioBase64?: string;
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

export interface MiniMaxMusicResponse {
  data?: {
    status?: number;
    audio?: string;
  };
  trace_id?: string;
  extra_info?: {
    music_duration?: number;
  };
  base_resp?: {
    status_code: number;
    status_msg: string;
  };
}

export interface MiniMaxCoverPreprocessResponse {
  cover_feature_id?: string;
  formatted_lyrics?: string;
  structure_result?: string;
  audio_duration?: number;
  trace_id?: string;
  base_resp?: {
    status_code: number;
    status_msg: string;
  };
}

export const COVER_MODELS = new Set<MusicModel>(["music-cover", "music-cover-free"]);
export const SONG_MODELS = new Set<MusicModel>(["music-2.6", "music-2.6-free"]);
