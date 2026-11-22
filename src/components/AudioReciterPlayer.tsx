import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Headphones,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AudioTrackOption,
  QURAN_RECITERS,
  QuranReciterId,
  getAvailableQuranRecitersForSurah,
  getQuranSurahAudioUrl,
  loadSavedQuranReciter,
  saveQuranReciter,
} from '../data/reciterAudio';

export interface AudioPlaybackProgress {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  hasActiveAudio: boolean;
}

type AudioReciterPlayerProps =
  | {
      mode: 'quran';
      surahNumber: number;
      surahName: string;
      nightMode: boolean;
      onPlaybackProgress?: (progress: AudioPlaybackProgress) => void;
    }
  | {
      mode: 'entry';
      entryId: string;
      entryTitle: string;
      tracks: AudioTrackOption[];
      nightMode: boolean;
      onPlaybackProgress?: (progress: AudioPlaybackProgress) => void;
    };

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5] as const;

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const totalSec = Math.floor(seconds);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  if (hrs > 0) {
    return `${hrs}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export const AudioReciterPlayer: React.FC<AudioReciterPlayerProps> = (props) => {
  const { nightMode, onPlaybackProgress } = props;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingAutoPlayRef = useRef<boolean>(false);

  const [quranReciterId, setQuranReciterId] = useState<QuranReciterId>(() =>
    loadSavedQuranReciter()
  );
  const [selectedTrackId, setSelectedTrackId] = useState<string>('silent');

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRateIndex, setPlaybackRateIndex] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [reloadNonce, setReloadNonce] = useState<number>(0);

  const entryKey =
    props.mode === 'quran' ? `quran-${props.surahNumber}` : `entry-${props.entryId}`;

  useEffect(() => {
    if (props.mode === 'entry') {
      setSelectedTrackId('silent');
    }
  }, [props.mode, props.mode === 'entry' ? props.entryId : null]);

  useEffect(() => {
    pendingAutoPlayRef.current = false;
    setIsPlaying(false);
    setIsBuffering(false);
    setHasError(false);
    setCurrentTime(0);
    setDuration(0);
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
  }, [entryKey]);

  const availableQuranReciters = useMemo(() => {
    if (props.mode !== 'quran') return [];
    return getAvailableQuranRecitersForSurah(props.surahNumber);
  }, [props.mode, props.mode === 'quran' ? props.surahNumber : 0]);

  const effectiveQuranReciterId: QuranReciterId = useMemo(() => {
    if (props.mode !== 'quran') return 'silent';
    return availableQuranReciters.some((r) => r.id === quranReciterId)
      ? quranReciterId
      : 'silent';
  }, [props.mode, availableQuranReciters, quranReciterId]);

  const resolvedTrack = useMemo<{
    url: string | null;
    label: string;
    note?: string;
  }>(() => {
    if (props.mode === 'quran') {
      if (effectiveQuranReciterId === 'silent') {
        return { url: null, label: 'وضع القراءة الشخصية الصامتة' };
      }
      const meta = QURAN_RECITERS.find((r) => r.id === effectiveQuranReciterId);
      const data = getQuranSurahAudioUrl(
        effectiveQuranReciterId,
        props.surahNumber
      );
      if (!data) {
        return { url: null, label: 'وضع القراءة الشخصية الصامتة' };
      }
      return {
        url: data.url,
        label: meta ? `${meta.name} · سورة ${props.surahName}` : `سورة ${props.surahName}`,
        note: data.note,
      };
    }

    if (selectedTrackId === 'silent' || props.tracks.length === 0) {
      return { url: null, label: 'وضع القراءة الشخصية الصامتة' };
    }

    const found = props.tracks.find((t) => t.id === selectedTrackId);
    if (!found) {
      return { url: null, label: 'وضع القراءة الشخصية الصامتة' };
    }
    return {
      url: found.url,
      label: `${found.reciterName} · ${props.entryTitle}`,
      note: found.note,
    };
  }, [props, effectiveQuranReciterId, selectedTrackId]);

  const activeUrl = resolvedTrack.url;
  const playbackRate = PLAYBACK_RATES[playbackRateIndex];

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = playbackRate;
    el.muted = isMuted;
  }, [playbackRate, isMuted, activeUrl]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    setHasError(false);
    setCurrentTime(0);
    setDuration(0);

    if (!activeUrl) {
      el.pause();
      el.removeAttribute('src');
      el.load();
      setIsPlaying(false);
      setIsBuffering(false);
      return;
    }

    setIsBuffering(true);
    el.src = activeUrl;
    el.playbackRate = playbackRate;
    el.muted = isMuted;
    el.load();

    if (pendingAutoPlayRef.current) {
      pendingAutoPlayRef.current = false;
      el.play().catch(() => {
        setIsPlaying(false);
        setIsBuffering(false);
      });
    }
  }, [activeUrl, reloadNonce]);

  useEffect(() => {
    onPlaybackProgress?.({
      currentTime,
      duration,
      isPlaying,
      hasActiveAudio: Boolean(activeUrl),
    });
  }, [currentTime, duration, isPlaying, activeUrl, onPlaybackProgress]);

  const handleSelectChange = (value: string) => {
    if (props.mode === 'quran') {
      const nextId = value as QuranReciterId;
      setQuranReciterId(nextId);
      saveQuranReciter(nextId);
      pendingAutoPlayRef.current = nextId !== 'silent';
    } else {
      setSelectedTrackId(value);
      pendingAutoPlayRef.current = value !== 'silent';
    }
  };

  const handleTogglePlay = () => {
    const el = audioRef.current;
    if (!el || !activeUrl) return;
    if (hasError) {
      pendingAutoPlayRef.current = true;
      setReloadNonce((n) => n + 1);
      return;
    }
    if (el.paused) {
      setIsBuffering(true);
      el.play().catch(() => {
        setIsBuffering(false);
        setHasError(true);
      });
    } else {
      el.pause();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(duration) || duration <= 0) return;
    const nextTime = Number(e.target.value);
    el.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleSkip = (deltaSeconds: number) => {
    const el = audioRef.current;
    if (!el || !activeUrl) return;
    const target = Math.min(
      Math.max(0, el.currentTime + deltaSeconds),
      Number.isFinite(duration) && duration > 0 ? duration : el.currentTime + deltaSeconds
    );
    el.currentTime = target;
    setCurrentTime(target);
  };

  const handleCycleRate = () => {
    setPlaybackRateIndex((idx) => (idx + 1) % PLAYBACK_RATES.length);
  };

  const currentSelectValue =
    props.mode === 'quran' ? effectiveQuranReciterId : selectedTrackId;

  const hasAvailableTracks =
    props.mode === 'quran'
      ? availableQuranReciters.some((r) => r.id !== 'silent')
      : props.tracks.length > 0;

  return (
    <div
      className={`my-4 min-h-[164px] flex flex-col justify-between rounded-[5px] p-3 sm:p-3.5 border transition-colors ${
        nightMode
          ? 'bg-[#0D2920] border-[#D9B96A]/35 text-[#F3EBD6]'
          : 'bg-[#F3ECDA]/75 border-[#B8924A]/45 text-[#11271F]'
      }`}
    >
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadStart={() => {
          if (activeUrl) setIsBuffering(true);
        }}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d)) setDuration(d);
        }}
        onCanPlay={() => {
          setIsBuffering(false);
          setHasError(false);
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsPlaying(true);
          setIsBuffering(false);
          setHasError(false);
        }}
        onPause={() => {
          setIsPlaying(false);
          setIsBuffering(false);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setIsBuffering(false);
        }}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime);
        }}
        onError={() => {
          if (!activeUrl) return;
          setIsPlaying(false);
          setIsBuffering(false);
          setHasError(true);
        }}
      />

      {/* Compact Top Bar: Label + Reciter Select */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Headphones
            className={`w-4 h-4 shrink-0 ${
              nightMode ? 'text-[#D9B96A]' : 'text-[#0F3D2E]'
            }`}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p
              className={`font-display font-bold text-xs sm:text-sm ${
                nightMode ? 'text-[#E8CE88]' : 'text-[#0F3D2E]'
              }`}
            >
              التلاوة الصوتية
            </p>
            <p
              className={`text-[11px] leading-snug ${
                nightMode ? 'text-[#C8B88A]' : 'text-[#425B51]'
              }`}
            >
              {hasAvailableTracks
                ? props.mode === 'quran'
                  ? 'اختر القارئ لتلاوة السورة أو واصل القراءة الصامتة'
                  : 'اختر القارئ للاستماع أو واصل القراءة الصامتة'
                : 'وضع القراءة الصامتة — لا يتوفر تسجيل صوتي لهذا النص حالياً'}
            </p>
          </div>
        </div>

        {hasAvailableTracks && (
          <div className="w-full sm:w-64 shrink-0">
            <select
              aria-label="اختيار القارئ"
              value={currentSelectValue}
              onChange={(e) => handleSelectChange(e.target.value)}
              className={`w-full min-h-[40px] px-3 py-1.5 rounded-[4px] border text-xs sm:text-sm font-display font-semibold focus:outline-none cursor-pointer transition-colors ${
                nightMode
                  ? 'bg-[#081A14] border-[#D9B96A]/45 text-[#F3EBD6] focus:border-[#D9B96A]'
                  : 'bg-[#FAF6EC] border-[#B8924A]/55 text-[#0F3D2E] focus:border-[#0F3D2E]'
              }`}
            >
              {props.mode === 'quran' ? (
                availableQuranReciters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="silent">القراءة الشخصية الصامتة</option>
                  {props.tracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.reciterName}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        )}
      </div>

      {/* Fixed-Height Audio Bar Slot (Zero vertical layout shift) */}
      <div
        className={`mt-3 pt-3 border-t min-h-[82px] flex flex-col justify-center ${
          nightMode ? 'border-[#D9B96A]/20' : 'border-[#B8924A]/25'
        }`}
      >
        {!activeUrl ? (
          <div className="flex items-center justify-between gap-2 text-xs leading-relaxed">
            <span className={nightMode ? 'text-[#C8B88A]' : 'text-[#425B51]'}>
              {hasAvailableTracks
                ? 'القراءة الصامتة مفعّلة — اختر قارئاً من القائمة أعلاه عند الرغبة دون أي اهتزاز للنص.'
                : 'وضع القراءة الصامتة الخالصة لهذا النص المبارك.'}
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {resolvedTrack.note && (
              <p
                className={`text-[11px] font-medium truncate px-2.5 py-1 rounded-[4px] border ${
                  nightMode
                    ? 'bg-[#081A14]/70 border-[#D9B96A]/30 text-[#E8CE88]'
                    : 'bg-[#FAF6EC] border-[#B8924A]/35 text-[#7A5E2A]'
                }`}
              >
                {resolvedTrack.note}
              </p>
            )}

          {hasError ? (
            <div
              className={`flex flex-wrap items-center justify-between gap-2 p-3 rounded-[4px] border text-xs font-semibold ${
                nightMode
                  ? 'bg-[#2A1215] border-[#B85454]/45 text-[#F4D0D0]'
                  : 'bg-[#FDF2F2] border-[#D48C8C] text-[#7A2020]'
              }`}
            >
              <span>تعذر تشغيل التلاوة الآن. تأكد من الاتصال أو اختر قارئاً آخر.</span>
              <button
                type="button"
                onClick={() => {
                  pendingAutoPlayRef.current = true;
                  setReloadNonce((n) => n + 1);
                }}
                className="min-h-[36px] px-3 py-1 btn-emerald text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل التلاوة'}
                    className={`min-h-[38px] px-3.5 rounded-[4px] font-display font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                      nightMode ? 'btn-gilded' : 'btn-emerald'
                    }`}
                  >
                    {isBuffering ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" aria-hidden="true" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                    )}
                    <span>
                      {isBuffering
                        ? 'جارٍ التحميل...'
                        : isPlaying
                        ? 'إيقاف مؤقت'
                        : 'استماع'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSkip(-10)}
                    aria-label="رجوع 10 ثوانٍ"
                    className={`min-h-[38px] px-2.5 rounded-[4px] border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                      nightMode
                        ? 'bg-[#081A14] border-[#D9B96A]/35 text-[#F3EBD6] hover:bg-[#13382C]'
                        : 'bg-[#FAF6EC] border-[#B8924A]/45 text-[#11271F] hover:bg-[#EDE4CC]'
                    }`}
                  >
                    <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="tabular-nums">-10ث</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSkip(10)}
                    aria-label="تقديم 10 ثوانٍ"
                    className={`min-h-[38px] px-2.5 rounded-[4px] border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                      nightMode
                        ? 'bg-[#081A14] border-[#D9B96A]/35 text-[#F3EBD6] hover:bg-[#13382C]'
                        : 'bg-[#FAF6EC] border-[#B8924A]/45 text-[#11271F] hover:bg-[#EDE4CC]'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="tabular-nums">+10ث</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCycleRate}
                    aria-label="تغيير سرعة التلاوة"
                    className={`min-h-[38px] px-2.5 rounded-[4px] border text-xs font-bold tabular-nums cursor-pointer transition-colors ${
                      nightMode
                        ? 'bg-[#081A14] border-[#D9B96A]/35 text-[#D9B96A]'
                        : 'bg-[#FAF6EC] border-[#B8924A]/45 text-[#0F3D2E]'
                    }`}
                    dir="ltr"
                  >
                    {playbackRate}x
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMuted((m) => !m)}
                    aria-label={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
                    className={`min-h-[38px] min-w-[38px] rounded-[4px] border flex items-center justify-center cursor-pointer transition-colors ${
                      nightMode
                        ? 'bg-[#081A14] border-[#D9B96A]/35 text-[#F3EBD6]'
                        : 'bg-[#FAF6EC] border-[#B8924A]/45 text-[#0F3D2E]'
                    }`}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Volume2 className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3" dir="ltr">
                <span
                  className={`text-xs font-semibold tabular-nums w-12 text-right ${
                    nightMode ? 'text-[#C8B88A]' : 'text-[#425B51]'
                  }`}
                >
                  {formatDuration(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration > 0 ? duration : 0}
                  step={1}
                  value={Math.min(currentTime, duration > 0 ? duration : 0)}
                  onChange={handleSeek}
                  disabled={!duration}
                  aria-label="شريط التقدم الصوتي"
                  className={`flex-1 h-1.5 rounded-none appearance-none cursor-pointer ${
                    nightMode
                      ? 'bg-[#081A14] accent-[#D9B96A]'
                      : 'bg-[#DED3B7] accent-[#0F3D2E]'
                  }`}
                />
                <span
                  className={`text-xs font-semibold tabular-nums w-12 text-left ${
                    nightMode ? 'text-[#C8B88A]' : 'text-[#425B51]'
                  }`}
                >
                  {formatDuration(duration)}
                </span>
              </div>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
};
