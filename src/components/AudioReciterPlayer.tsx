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

type AudioReciterPlayerProps =
  | {
      mode: 'quran';
      surahNumber: number;
      surahName: string;
      nightMode: boolean;
    }
  | {
      mode: 'entry';
      entryId: string;
      entryTitle: string;
      tracks: AudioTrackOption[];
      nightMode: boolean;
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
  const { nightMode } = props;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingAutoPlayRef = useRef<boolean>(false);

  // Quran reciter selection (persisted across surahs)
  const [quranReciterId, setQuranReciterId] = useState<QuranReciterId>(() =>
    loadSavedQuranReciter()
  );

  // Entry track selection (starts silent on each entry)
  const [selectedTrackId, setSelectedTrackId] = useState<string>('silent');

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRateIndex, setPlaybackRateIndex] = useState<number>(1); // 1x
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [reloadNonce, setReloadNonce] = useState<number>(0);

  const entryKey =
    props.mode === 'quran' ? `quran-${props.surahNumber}` : `entry-${props.entryId}`;

  // Reset entry track selection when switching Dua/Ziyarat/Munajat
  useEffect(() => {
    if (props.mode === 'entry') {
      setSelectedTrackId('silent');
    }
  }, [props.mode, props.mode === 'entry' ? props.entryId : null]);

  // Reset audio playback state cleanly whenever the active reading item changes
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

  // Sync playbackRate and mute state to <audio>
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = playbackRate;
    el.muted = isMuted;
  }, [playbackRate, isMuted, activeUrl]);

  // Trigger loading when URL or retry changes
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
      className={`mt-5 rounded-2xl p-3.5 sm:p-4 border transition-colors ${
        nightMode
          ? 'bg-slate-800/85 border-amber-500/30 text-amber-50'
          : 'bg-gradient-to-l from-emerald-50/90 via-white to-amber-50/70 border-emerald-200 text-slate-900'
      }`}
    >
      {/* Hidden native audio element */}
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

      {/* Top Row: Label + Reciter Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              nightMode
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            <Headphones className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p
              className={`font-display font-extrabold text-sm ${
                nightMode ? 'text-amber-200' : 'text-emerald-950'
              }`}
            >
              الاستماع بصوت القراء الأفاضل
            </p>
            <p
              className={`text-xs leading-snug ${
                nightMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {hasAvailableTracks
                ? props.mode === 'quran'
                  ? 'اختر القارئ لتلاوة السورة كاملة أو واصل القراءة الصامتة'
                  : 'اختر القارئ للاستماع أثناء القراءة أو واصل القراءة الصامتة'
                : 'وضع القراءة الشخصية الصامتة — لا يتوفر تسجيل صوتي لهذا النص حالياً'}
            </p>
          </div>
        </div>

        {hasAvailableTracks && (
          <div className="w-full sm:w-72 shrink-0">
            <select
              aria-label="اختيار القارئ"
              value={currentSelectValue}
              onChange={(e) => handleSelectChange(e.target.value)}
              className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-xs sm:text-sm font-display font-bold focus:outline-none focus:ring-2 cursor-pointer transition-colors ${
                nightMode
                  ? 'bg-slate-900 border-amber-500/40 text-amber-100 focus:ring-amber-400'
                  : 'bg-white border-emerald-300 text-emerald-950 focus:ring-emerald-500'
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
                  <option value="silent">وضع القراءة الشخصية الصامتة</option>
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

      {/* Audio Player Bar (Shown whenever a non-silent reciter is chosen) */}
      {activeUrl && (
        <div
          className={`mt-3.5 pt-3.5 border-t space-y-2.5 ${
            nightMode ? 'border-slate-700' : 'border-emerald-200/80'
          }`}
        >
          {resolvedTrack.note && (
            <p
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                nightMode
                  ? 'bg-amber-950/50 border-amber-500/30 text-amber-200'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {resolvedTrack.note}
            </p>
          )}

          {hasError ? (
            <div
              className={`flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border text-xs sm:text-sm font-bold ${
                nightMode
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <span>
                تعذر تشغيل التلاوة الآن. تأكد من الاتصال بالإنترنت أو اختر قارئاً آخر.
              </span>
              <button
                type="button"
                onClick={() => {
                  pendingAutoPlayRef.current = true;
                  setReloadNonce((n) => n + 1);
                }}
                className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-display font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {/* Controls Row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل التلاوة'}
                    className={`min-h-[42px] px-4 rounded-xl font-display font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer transition-colors shadow-xs ${
                      nightMode
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
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
                        : 'استماع الآن'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSkip(-10)}
                    aria-label="رجوع 10 ثوانٍ"
                    title="رجوع 10 ثوانٍ"
                    className={`min-h-[40px] px-2.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                      nightMode
                        ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-700'
                        : 'bg-white border-emerald-200 text-slate-700 hover:bg-emerald-50'
                    }`}
                  >
                    <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="tabular-nums">-10ث</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSkip(10)}
                    aria-label="تقديم 10 ثوانٍ"
                    title="تقديم 10 ثوانٍ"
                    className={`min-h-[40px] px-2.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                      nightMode
                        ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-700'
                        : 'bg-white border-emerald-200 text-slate-700 hover:bg-emerald-50'
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
                    className={`min-h-[40px] px-2.5 rounded-xl border text-xs font-extrabold tabular-nums cursor-pointer transition-colors ${
                      nightMode
                        ? 'bg-slate-900 border-slate-700 text-amber-300 hover:bg-slate-700'
                        : 'bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-50'
                    }`}
                    dir="ltr"
                  >
                    {playbackRate}x
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMuted((m) => !m)}
                    aria-label={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
                    className={`min-h-[40px] min-w-[40px] rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
                      nightMode
                        ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-700'
                        : 'bg-white border-emerald-200 text-slate-700 hover:bg-emerald-50'
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

              {/* Progress Slider & Time */}
              <div className="flex items-center gap-3" dir="ltr">
                <span
                  className={`text-xs font-bold tabular-nums w-12 text-right ${
                    nightMode ? 'text-slate-300' : 'text-slate-600'
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
                  className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-emerald-600 ${
                    nightMode ? 'bg-slate-700 accent-amber-400' : 'bg-emerald-100'
                  }`}
                />
                <span
                  className={`text-xs font-bold tabular-nums w-12 text-left ${
                    nightMode ? 'text-slate-300' : 'text-slate-600'
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
  );
};
