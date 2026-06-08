import { useTranslation } from "react-i18next";
import type { AudioOutputSettings, LanguageBoost, TtsEmotion, TtsSettings } from "../types.ts";
import {
  LANGUAGE_BOOST_OPTIONS,
  MUSIC_BITRATE_OPTIONS,
  MUSIC_FORMAT_OPTIONS,
  MUSIC_SAMPLE_RATE_OPTIONS,
  TTS_BITRATE_OPTIONS,
  TTS_EMOTION_OPTIONS,
  TTS_FORMAT_OPTIONS,
  TTS_SAMPLE_RATE_OPTIONS,
} from "../lib/generationOptions.ts";

interface MusicAdvancedSettingsProps {
  value: AudioOutputSettings;
  onChange: (value: AudioOutputSettings) => void;
  disabled?: boolean;
}

export function MusicAdvancedSettings({ value, onChange, disabled }: MusicAdvancedSettingsProps) {
  const { t } = useTranslation();

  const update = (patch: Partial<AudioOutputSettings>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <details className="advanced-settings">
      <summary>{t("advanced.title")}</summary>
      <div className="advanced-settings-body">
        <label className="field">
          <span className="field-label">{t("advanced.sampleRate")}</span>
          <select
            value={value.sampleRate ?? 44100}
            onChange={(e) => update({ sampleRate: Number(e.target.value) })}
            disabled={disabled}
          >
            {MUSIC_SAMPLE_RATE_OPTIONS.map((rate) => (
              <option key={rate} value={rate}>
                {rate} Hz
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">{t("advanced.bitrate")}</span>
          <select
            value={value.bitrate ?? 256000}
            onChange={(e) => update({ bitrate: Number(e.target.value) })}
            disabled={disabled}
          >
            {MUSIC_BITRATE_OPTIONS.map((rate) => (
              <option key={rate} value={rate}>
                {Math.round(rate / 1000)} kbps
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">{t("advanced.format")}</span>
          <select
            value={value.format ?? "mp3"}
            onChange={(e) => update({ format: e.target.value as AudioOutputSettings["format"] })}
            disabled={disabled}
          >
            {MUSIC_FORMAT_OPTIONS.map((format) => (
              <option key={format} value={format}>
                {format.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>
    </details>
  );
}

interface TtsAdvancedSettingsProps {
  value: TtsSettings;
  onChange: (value: TtsSettings) => void;
  hasVoiceSample: boolean;
  disabled?: boolean;
}

export function TtsAdvancedSettings({
  value,
  onChange,
  hasVoiceSample,
  disabled,
}: TtsAdvancedSettingsProps) {
  const { t } = useTranslation();

  const update = (patch: Partial<TtsSettings>) => {
    onChange({ ...value, ...patch });
  };

  const updateVoice = (patch: Partial<NonNullable<TtsSettings["voice"]>>) => {
    onChange({ ...value, voice: { ...value.voice, ...patch } });
  };

  const updateAudio = (patch: Partial<NonNullable<TtsSettings["audio"]>>) => {
    onChange({ ...value, audio: { ...value.audio, ...patch } });
  };

  return (
    <details className="advanced-settings">
      <summary>{t("advanced.title")}</summary>
      <div className="advanced-settings-body">
        <label className="field">
          <span className="field-label">{t("tts.advanced.languageBoost")}</span>
          <select
            value={value.languageBoost ?? "auto"}
            onChange={(e) => update({ languageBoost: e.target.value as LanguageBoost })}
            disabled={disabled}
          >
            {LANGUAGE_BOOST_OPTIONS.map((lang) => (
              <option key={lang} value={lang}>
                {t(`languages.${lang}`, { defaultValue: lang })}
              </option>
            ))}
          </select>
          <p className="field-hint">{t("tts.advanced.languageBoostHint")}</p>
        </label>

        <label className="field">
          <span className="field-label">{t("tts.advanced.speed")}</span>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={value.voice?.speed ?? 1}
            onChange={(e) => updateVoice({ speed: Number(e.target.value) })}
            disabled={disabled}
          />
          <p className="field-hint">{value.voice?.speed ?? 1}</p>
        </label>

        <label className="field">
          <span className="field-label">{t("tts.advanced.volume")}</span>
          <input
            type="range"
            min={0.1}
            max={10}
            step={0.1}
            value={value.voice?.vol ?? 1}
            onChange={(e) => updateVoice({ vol: Number(e.target.value) })}
            disabled={disabled}
          />
          <p className="field-hint">{value.voice?.vol ?? 1}</p>
        </label>

        <label className="field">
          <span className="field-label">{t("tts.advanced.pitch")}</span>
          <input
            type="range"
            min={-12}
            max={12}
            step={1}
            value={value.voice?.pitch ?? 0}
            onChange={(e) => updateVoice({ pitch: Number(e.target.value) })}
            disabled={disabled}
          />
          <p className="field-hint">{value.voice?.pitch ?? 0}</p>
        </label>

        <label className="field">
          <span className="field-label">{t("tts.advanced.emotion")}</span>
          <select
            value={value.voice?.emotion ?? ""}
            onChange={(e) =>
              updateVoice({
                emotion: (e.target.value || undefined) as TtsEmotion | undefined,
              })
            }
            disabled={disabled}
          >
            {TTS_EMOTION_OPTIONS.map((emotion) => (
              <option key={emotion || "auto"} value={emotion}>
                {emotion ? t(`tts.advanced.emotions.${emotion}`) : t("tts.advanced.emotionAuto")}
              </option>
            ))}
          </select>
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={value.voice?.textNormalization ?? false}
            onChange={(e) => updateVoice({ textNormalization: e.target.checked })}
            disabled={disabled}
          />
          {t("tts.advanced.textNormalization")}
        </label>

        {hasVoiceSample && (
          <>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={value.needNoiseReduction ?? false}
                onChange={(e) => update({ needNoiseReduction: e.target.checked })}
                disabled={disabled}
              />
              {t("tts.advanced.noiseReduction")}
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={value.needVolumeNormalization ?? false}
                onChange={(e) => update({ needVolumeNormalization: e.target.checked })}
                disabled={disabled}
              />
              {t("tts.advanced.volumeNormalization")}
            </label>
            <p className="field-hint">{t("tts.advanced.cloneOnlyHint")}</p>
          </>
        )}

        <label className="field">
          <span className="field-label">{t("advanced.sampleRate")}</span>
          <select
            value={value.audio?.sampleRate ?? 32000}
            onChange={(e) => updateAudio({ sampleRate: Number(e.target.value) })}
            disabled={disabled}
          >
            {TTS_SAMPLE_RATE_OPTIONS.map((rate) => (
              <option key={rate} value={rate}>
                {rate} Hz
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">{t("advanced.bitrate")}</span>
          <select
            value={value.audio?.bitrate ?? 128000}
            onChange={(e) => updateAudio({ bitrate: Number(e.target.value) })}
            disabled={disabled}
          >
            {TTS_BITRATE_OPTIONS.map((rate) => (
              <option key={rate} value={rate}>
                {Math.round(rate / 1000)} kbps
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">{t("advanced.format")}</span>
          <select
            value={value.audio?.format ?? "mp3"}
            onChange={(e) =>
              updateAudio({ format: e.target.value as NonNullable<TtsSettings["audio"]>["format"] })
            }
            disabled={disabled}
          >
            {TTS_FORMAT_OPTIONS.map((format) => (
              <option key={format} value={format}>
                {format.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>
    </details>
  );
}
