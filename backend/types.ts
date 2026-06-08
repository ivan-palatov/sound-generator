export type MusicModel =
  | "music-2.6"
  | "music-2.6-free"
  | "music-cover"
  | "music-cover-free"
  | "speech-2.8-hd"
  | "speech-2.8-turbo";

export type CoverModel = "music-cover" | "music-cover-free";

export type TtsModel = "speech-2.8-hd" | "speech-2.8-turbo";

export type HistoryStatus = "completed" | "failed";

export type LanguageBoost =
  | "auto"
  | "Chinese"
  | "Chinese,Yue"
  | "English"
  | "Arabic"
  | "Russian"
  | "Spanish"
  | "French"
  | "Portuguese"
  | "German"
  | "Turkish"
  | "Dutch"
  | "Ukrainian"
  | "Vietnamese"
  | "Indonesian"
  | "Japanese"
  | "Italian"
  | "Korean"
  | "Thai"
  | "Polish"
  | "Romanian"
  | "Greek"
  | "Czech"
  | "Finnish"
  | "Hindi"
  | "Bulgarian"
  | "Danish"
  | "Hebrew"
  | "Malay"
  | "Persian"
  | "Slovak"
  | "Swedish"
  | "Croatian"
  | "Filipino"
  | "Hungarian"
  | "Norwegian"
  | "Slovenian"
  | "Catalan"
  | "Nynorsk"
  | "Tamil"
  | "Afrikaans";

export type TtsEmotion =
  | "happy"
  | "sad"
  | "angry"
  | "fearful"
  | "disgusted"
  | "surprised"
  | "calm"
  | "fluent"
  | "whisper";

export interface AudioOutputSettings {
  sampleRate?: number;
  bitrate?: number;
  format?: "mp3" | "wav" | "pcm";
}

export interface TtsAudioSettings {
  sampleRate?: number;
  bitrate?: number;
  format?: "mp3" | "pcm" | "flac" | "wav";
}

export interface TtsVoiceSettings {
  speed?: number;
  vol?: number;
  pitch?: number;
  emotion?: TtsEmotion;
  textNormalization?: boolean;
}

export interface TtsSettings {
  languageBoost?: LanguageBoost;
  voice?: TtsVoiceSettings;
  audio?: TtsAudioSettings;
  needNoiseReduction?: boolean;
  needVolumeNormalization?: boolean;
}

export interface GenerateRequest {
  model: MusicModel;
  prompt: string;
  lyrics?: string;
  isInstrumental: boolean;
  lyricsOptimizer: boolean;
  audioSettings?: AudioOutputSettings;
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
  audioSettings?: AudioOutputSettings;
}

export interface TtsGenerateRequest {
  model: TtsModel;
  text: string;
  audioUrl?: string;
  audioBase64?: string;
  voicePrompt?: string;
  ttsSettings?: TtsSettings;
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
  voicePrompt?: string;
  audioSettings?: AudioOutputSettings;
  ttsSettings?: TtsSettings;
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

export interface MiniMaxFileUploadResponse {
  file?: {
    file_id?: number;
  };
  base_resp?: {
    status_code: number;
    status_msg: string;
  };
}

export interface MiniMaxVoiceCloneResponse {
  demo_audio?: string;
  trace_id?: string;
  extra_info?: {
    audio_length?: number;
  };
  base_resp?: {
    status_code: number;
    status_msg: string;
  };
}

export interface MiniMaxVoiceDesignResponse {
  voice_id?: string;
  trial_audio?: string;
  trace_id?: string;
  base_resp?: {
    status_code: number;
    status_msg: string;
  };
}

export interface MiniMaxT2aResponse {
  data?: {
    audio?: string;
    status?: number;
  };
  trace_id?: string;
  extra_info?: {
    audio_length?: number;
  };
  base_resp?: {
    status_code: number;
    status_msg: string;
  };
}

export const COVER_MODELS = new Set<MusicModel>(["music-cover", "music-cover-free"]);
export const SONG_MODELS = new Set<MusicModel>(["music-2.6", "music-2.6-free"]);
export const TTS_MODELS = new Set<TtsModel>(["speech-2.8-hd", "speech-2.8-turbo"]);
