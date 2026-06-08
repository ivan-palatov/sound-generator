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

export const LANGUAGE_BOOST_OPTIONS: LanguageBoost[] = [
  "auto",
  "Chinese",
  "Chinese,Yue",
  "English",
  "Arabic",
  "Russian",
  "Spanish",
  "French",
  "Portuguese",
  "German",
  "Turkish",
  "Dutch",
  "Ukrainian",
  "Vietnamese",
  "Indonesian",
  "Japanese",
  "Italian",
  "Korean",
  "Thai",
  "Polish",
  "Romanian",
  "Greek",
  "Czech",
  "Finnish",
  "Hindi",
  "Bulgarian",
  "Danish",
  "Hebrew",
  "Malay",
  "Persian",
  "Slovak",
  "Swedish",
  "Croatian",
  "Filipino",
  "Hungarian",
  "Norwegian",
  "Slovenian",
  "Catalan",
  "Nynorsk",
  "Tamil",
  "Afrikaans",
];

export const TTS_EMOTION_OPTIONS: (TtsEmotion | "")[] = [
  "",
  "happy",
  "sad",
  "angry",
  "fearful",
  "disgusted",
  "surprised",
  "calm",
  "fluent",
  "whisper",
];

export const MUSIC_SAMPLE_RATE_OPTIONS = [16000, 24000, 32000, 44100] as const;
export const MUSIC_BITRATE_OPTIONS = [32000, 64000, 128000, 256000] as const;
export const MUSIC_FORMAT_OPTIONS = ["mp3", "wav", "pcm"] as const;

export const TTS_SAMPLE_RATE_OPTIONS = [8000, 16000, 22050, 24000, 32000, 44100] as const;
export const TTS_BITRATE_OPTIONS = [32000, 64000, 128000, 256000] as const;
export const TTS_FORMAT_OPTIONS = ["mp3", "pcm", "flac", "wav"] as const;

export const DEFAULT_AUDIO_OUTPUT_SETTINGS: AudioOutputSettings = {
  sampleRate: 44100,
  bitrate: 256000,
  format: "mp3",
};

export const DEFAULT_TTS_SETTINGS: TtsSettings = {
  languageBoost: "auto",
  voice: {
    speed: 1,
    vol: 1,
    pitch: 0,
    textNormalization: false,
  },
  audio: {
    sampleRate: 32000,
    bitrate: 128000,
    format: "mp3",
  },
  needNoiseReduction: false,
  needVolumeNormalization: false,
};

export function mergeAudioSettings(settings?: AudioOutputSettings): AudioOutputSettings {
  return {
    ...DEFAULT_AUDIO_OUTPUT_SETTINGS,
    ...settings,
  };
}

export function mergeTtsSettings(settings?: TtsSettings): TtsSettings {
  return {
    languageBoost: settings?.languageBoost ?? DEFAULT_TTS_SETTINGS.languageBoost,
    voice: {
      ...DEFAULT_TTS_SETTINGS.voice,
      ...settings?.voice,
    },
    audio: {
      ...DEFAULT_TTS_SETTINGS.audio,
      ...settings?.audio,
    },
    needNoiseReduction: settings?.needNoiseReduction ?? DEFAULT_TTS_SETTINGS.needNoiseReduction,
    needVolumeNormalization:
      settings?.needVolumeNormalization ?? DEFAULT_TTS_SETTINGS.needVolumeNormalization,
  };
}

export function isDefaultAudioSettings(settings: AudioOutputSettings): boolean {
  return (
    settings.sampleRate === DEFAULT_AUDIO_OUTPUT_SETTINGS.sampleRate &&
    settings.bitrate === DEFAULT_AUDIO_OUTPUT_SETTINGS.bitrate &&
    settings.format === DEFAULT_AUDIO_OUTPUT_SETTINGS.format
  );
}

export function isDefaultTtsSettings(settings: TtsSettings): boolean {
  const merged = mergeTtsSettings(settings);
  const defaults = DEFAULT_TTS_SETTINGS;
  return (
    merged.languageBoost === defaults.languageBoost &&
    merged.voice?.speed === defaults.voice?.speed &&
    merged.voice?.vol === defaults.voice?.vol &&
    merged.voice?.pitch === defaults.voice?.pitch &&
    !merged.voice?.emotion &&
    !merged.voice?.textNormalization &&
    merged.audio?.sampleRate === defaults.audio?.sampleRate &&
    merged.audio?.bitrate === defaults.audio?.bitrate &&
    merged.audio?.format === defaults.audio?.format &&
    !merged.needNoiseReduction &&
    !merged.needVolumeNormalization
  );
}

export function stripDefaultAudioSettings(
  settings: AudioOutputSettings,
): AudioOutputSettings | undefined {
  return isDefaultAudioSettings(settings) ? undefined : settings;
}

export function stripDefaultTtsSettings(settings: TtsSettings): TtsSettings | undefined {
  return isDefaultTtsSettings(settings) ? undefined : mergeTtsSettings(settings);
}
