export type MusicModel =
  | "music-2.6"
  | "music-2.6-free"
  | "music-cover"
  | "music-cover-free";

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
  audioUrl?: string;
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
