import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";

interface AudioPlayerProps {
  src: string;
  durationMs?: number | null;
  filename?: string;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function downloadFilename(name: string | undefined, src: string): string {
  const base = (name?.trim() || "audio")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
  const extMatch = src.match(/\.(mp3|wav|m4a|flac|ogg)(\?|$)/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : "mp3";
  return `${base}.${ext}`;
}

export function AudioPlayer({ src, durationMs, filename }: AudioPlayerProps) {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(
    durationMs != null ? durationMs / 1000 : 0,
  );
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setPlaying(false);
    setCurrentTime(0);
    setDuration(durationMs != null ? durationMs / 1000 : 0);

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [src, durationMs]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      void audio.play();
    }
  };

  const seek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  const changeVolume = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = value;
    audio.muted = value === 0;
    setVolume(value);
    setMuted(value === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (muted || volume === 0) {
      const restored = volume > 0 ? volume : 1;
      audio.muted = false;
      audio.volume = restored;
      setMuted(false);
      setVolume(restored);
    } else {
      audio.muted = true;
      setMuted(true);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumeLevel = muted ? 0 : volume;
  const volumeProgress = volumeLevel * 100;

  const handleDownload = async () => {
    setDownloading(true);
    const name = downloadFilename(filename, src);
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error("fetch failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      const link = document.createElement("a");
      link.href = src;
      link.download = name;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        type="button"
        className="audio-player-play"
        onClick={togglePlay}
        aria-label={playing ? t("player.pause") : t("player.play")}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {playing ? (
            <path
              d="M8 6.5v11M16 6.5v11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M9 7.5v9l8-4.5-8-4.5Z"
              fill="currentColor"
            />
          )}
        </svg>
      </button>

      <div className="audio-player-track">
        <div className="audio-player-times">
          <span className="audio-player-time">{formatTime(currentTime)}</span>
          <span className="audio-player-time">{formatTime(duration)}</span>
        </div>
        <div className="audio-player-sliders">
          <div
            className="audio-player-progress"
            style={{ "--progress": `${progress}%` } as CSSProperties}
          >
            <input
              type="range"
              className="audio-player-seek"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label={t("player.seek")}
            />
          </div>
          <div className="audio-player-volume">
            <button
              type="button"
              className="audio-player-mute"
              onClick={toggleMute}
              aria-label={muted ? t("player.unmute") : t("player.mute")}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                {muted || volume === 0 ? (
                  <>
                    <path
                      d="M11 7.5 7 11H4.5v2H7l4 3.5V7.5Z"
                      fill="currentColor"
                    />
                    <path
                      d="m16 9 5 5M21 9l-5 5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </>
                ) : volume < 0.5 ? (
                  <>
                    <path
                      d="M11 7.5 7 11H4.5v2H7l4 3.5V7.5Z"
                      fill="currentColor"
                    />
                    <path
                      d="M16 13.5a3.5 3.5 0 0 0 0-5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </>
                ) : (
                  <>
                    <path
                      d="M11 7.5 7 11H4.5v2H7l4 3.5V7.5Z"
                      fill="currentColor"
                    />
                    <path
                      d="M15 9.5a4.5 4.5 0 0 1 0 5M17.5 7a7.5 7.5 0 0 1 0 10"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </svg>
            </button>
            <div
              className="audio-player-progress audio-player-volume-bar"
              style={{ "--progress": `${volumeProgress}%` } as CSSProperties}
            >
              <input
                type="range"
                className="audio-player-seek"
                min={0}
                max={1}
                step={0.05}
                value={volumeLevel}
                onChange={(e) => changeVolume(Number(e.target.value))}
                aria-label={t("player.volume")}
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="audio-player-download"
        onClick={() => void handleDownload()}
        disabled={downloading}
        aria-label={t("player.download")}
        title={t("player.download")}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 4v10m0 0 3.5-3.5M12 14l-3.5-3.5M6 18h12"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
