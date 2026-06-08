import { ApiError } from "./errors.ts";
import type {
  AudioOutputSettings,
  LanguageBoost,
  TtsSettings,
} from "./types.ts";

export const LANGUAGE_BOOST_VALUES = [
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
] as const;

export const TTS_EMOTIONS = [
  "happy",
  "sad",
  "angry",
  "fearful",
  "disgusted",
  "surprised",
  "calm",
  "fluent",
  "whisper",
] as const;

export const MUSIC_SAMPLE_RATES = [16000, 24000, 32000, 44100] as const;
export const MUSIC_BITRATES = [32000, 64000, 128000, 256000] as const;
export const MUSIC_FORMATS = ["mp3", "wav", "pcm"] as const;

export const TTS_SAMPLE_RATES = [8000, 16000, 22050, 24000, 32000, 44100] as const;
export const TTS_BITRATES = [32000, 64000, 128000, 256000] as const;
export const TTS_FORMATS = ["mp3", "pcm", "flac", "wav"] as const;

const LANGUAGE_BOOST_SET = new Set<string>(LANGUAGE_BOOST_VALUES);
const TTS_EMOTION_SET = new Set<string>(TTS_EMOTIONS);

export const DEFAULT_MUSIC_AUDIO = {
  sample_rate: 44100,
  bitrate: 256000,
  format: "mp3" as const,
};

export const DEFAULT_TTS_AUDIO = {
  sample_rate: 32000,
  bitrate: 128000,
  format: "mp3" as const,
  channel: 1,
};

export const DEFAULT_TTS_VOICE = {
  speed: 1,
  vol: 1,
  pitch: 0,
};

export function validateAudioOutputSettings(
  settings?: AudioOutputSettings,
): ApiError | null {
  if (!settings) return null;

  if (
    settings.sampleRate != null &&
    !MUSIC_SAMPLE_RATES.includes(settings.sampleRate as (typeof MUSIC_SAMPLE_RATES)[number])
  ) {
    return new ApiError("INVALID_MUSIC_SAMPLE_RATE");
  }
  if (
    settings.bitrate != null &&
    !MUSIC_BITRATES.includes(settings.bitrate as (typeof MUSIC_BITRATES)[number])
  ) {
    return new ApiError("INVALID_MUSIC_BITRATE");
  }
  if (
    settings.format != null &&
    !MUSIC_FORMATS.includes(settings.format as (typeof MUSIC_FORMATS)[number])
  ) {
    return new ApiError("INVALID_MUSIC_FORMAT");
  }

  return null;
}

export function buildMusicAudioSetting(settings?: AudioOutputSettings): Record<string, unknown> {
  return {
    sample_rate: settings?.sampleRate ?? DEFAULT_MUSIC_AUDIO.sample_rate,
    bitrate: settings?.bitrate ?? DEFAULT_MUSIC_AUDIO.bitrate,
    format: settings?.format ?? DEFAULT_MUSIC_AUDIO.format,
  };
}

export function validateTtsSettings(settings?: TtsSettings): ApiError | null {
  if (!settings) return null;

  if (settings.languageBoost != null && !LANGUAGE_BOOST_SET.has(settings.languageBoost)) {
    return new ApiError("INVALID_LANGUAGE_BOOST");
  }

  const voice = settings.voice;
  if (voice?.speed != null && (voice.speed < 0.5 || voice.speed > 2)) {
    return new ApiError("TTS_SPEED_OUT_OF_RANGE");
  }
  if (voice?.vol != null && (voice.vol <= 0 || voice.vol > 10)) {
    return new ApiError("TTS_VOL_OUT_OF_RANGE");
  }
  if (voice?.pitch != null && (voice.pitch < -12 || voice.pitch > 12)) {
    return new ApiError("TTS_PITCH_OUT_OF_RANGE");
  }
  if (voice?.emotion != null && !TTS_EMOTION_SET.has(voice.emotion)) {
    return new ApiError("INVALID_TTS_EMOTION");
  }

  const audio = settings.audio;
  if (
    audio?.sampleRate != null &&
    !TTS_SAMPLE_RATES.includes(audio.sampleRate as (typeof TTS_SAMPLE_RATES)[number])
  ) {
    return new ApiError("INVALID_TTS_SAMPLE_RATE");
  }
  if (
    audio?.bitrate != null &&
    !TTS_BITRATES.includes(audio.bitrate as (typeof TTS_BITRATES)[number])
  ) {
    return new ApiError("INVALID_TTS_BITRATE");
  }
  if (audio?.format != null && !TTS_FORMATS.includes(audio.format as (typeof TTS_FORMATS)[number])) {
    return new ApiError("INVALID_TTS_FORMAT");
  }

  return null;
}

export function buildT2aVoiceSetting(
  voiceId: string,
  settings?: TtsSettings,
): Record<string, unknown> {
  const voice = settings?.voice;
  const result: Record<string, unknown> = {
    voice_id: voiceId,
    speed: voice?.speed ?? DEFAULT_TTS_VOICE.speed,
    vol: voice?.vol ?? DEFAULT_TTS_VOICE.vol,
    pitch: voice?.pitch ?? DEFAULT_TTS_VOICE.pitch,
  };
  if (voice?.emotion) result.emotion = voice.emotion;
  if (voice?.textNormalization) result.text_normalization = true;
  return result;
}

export function buildT2aAudioSetting(settings?: TtsSettings): Record<string, unknown> {
  const audio = settings?.audio;
  return {
    format: audio?.format ?? DEFAULT_TTS_AUDIO.format,
    sample_rate: audio?.sampleRate ?? DEFAULT_TTS_AUDIO.sample_rate,
    bitrate: audio?.bitrate ?? DEFAULT_TTS_AUDIO.bitrate,
    channel: DEFAULT_TTS_AUDIO.channel,
  };
}

export function resolveLanguageBoost(settings?: TtsSettings): LanguageBoost {
  return settings?.languageBoost ?? "auto";
}
