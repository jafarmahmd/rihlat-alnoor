import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  Edit3,
  Infinity as InfinityIcon,
  RotateCcw,
  Sparkles,
  Star,
  Undo2,
  Vibrate,
} from 'lucide-react';
import {
  playBeadTickSound,
  playTasbihPhaseSound,
  playVictorySound,
} from '../utils/sound';

interface TasbihScreenProps {
  muted: boolean;
  completedReadingIds: string[];
  onCompleteReading: (readingId: string) => boolean;
  onBackHome: () => void;
}

type TasbihMode = 'zahra' | 'open';

interface ZahraPhase {
  id: 'takbir' | 'tahmid' | 'tasbih';
  label: string;
  arabic: string;
  target: number;
  meaning: string;
}

const ZAHRA_PHASES: ZahraPhase[] = [
  {
    id: 'takbir',
    label: 'التكبير',
    arabic: 'اللَّهُ أَكْبَرُ',
    target: 34,
    meaning: 'الله أعظمُ من كلِّ شيءٍ في هذا الوجود',
  },
  {
    id: 'tahmid',
    label: 'التحميد',
    arabic: 'الْحَمْدُ لِلَّهِ',
    target: 33,
    meaning: 'الشكرُ والثناءُ الكاملُ للهِ على نعمهِ الظاهرة والباطنة',
  },
  {
    id: 'tasbih',
    label: 'التسبيح',
    arabic: 'سُبْحَانَ اللَّهِ',
    target: 33,
    meaning: 'تنزيهُ اللهِ وتقديسُهُ عن كلِّ نقصٍ وعيب',
  },
];

const ZAHRA_TOTAL = 100;

interface OpenDhikrPreset {
  id: string;
  arabic: string;
  shortTitle: string;
  virtue: string;
}

const OPEN_DHIKR_PRESETS: OpenDhikrPreset[] = [
  {
    id: 'salawat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ',
    shortTitle: 'الصلاة على النبي وآله',
    virtue: 'أحبُّ الأذكارِ إلى اللهِ ومفتاحُ استجابةِ الدعاء',
  },
  {
    id: 'tasbih-hamd',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    shortTitle: 'سبحان الله وبحمده',
    virtue: 'كلمتانِ خفيفتانِ على اللسان، ثقيلتانِ في الميزان',
  },
  {
    id: 'istighfar',
    arabic: 'أَسْتَغْفِرُ اللَّهَ رَبِّي وَأَتُوبُ إِلَيْهِ',
    shortTitle: 'الاستغفار والتوبة',
    virtue: 'جلاءُ القلوبِ وبابُ الرحمةِ وسعةِ الرزق',
  },
  {
    id: 'tahlil',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',
    shortTitle: 'كلمة التوحيد',
    virtue: 'أفضلُ الذكرِ وحصنُ اللهِ الحصين',
  },
  {
    id: 'hawqala',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    shortTitle: 'الحوقلة',
    virtue: 'كنزٌ من كنوزِ الجنة وتفويضُ الأمرِ لله',
  },
  {
    id: 'hayy-qayyum',
    arabic: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ',
    shortTitle: 'يا حيّ يا قيّوم',
    virtue: 'نداءُ الاضطرارِ وطلبُ العونِ الإلهي',
  },
];

const OPEN_TARGETS: { value: number | null; label: string }[] = [
  { value: null, label: 'مفتوح ∞' },
  { value: 33, label: '٣٣' },
  { value: 100, label: '١٠٠' },
  { value: 1000, label: '١٠٠٠' },
];

const TASBIH_STORAGE_KEY = 'rihlat_alnoor_tasbih_v1';

interface TasbihPersistedState {
  todayDate: string;
  todayCount: number;
  totalCount: number;
  zahraRounds: number;
  customDhikr: string;
}

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

function loadTasbihState(): TasbihPersistedState {
  const today = getTodayKey();
  const fallback: TasbihPersistedState = {
    todayDate: today,
    todayCount: 0,
    totalCount: 0,
    zahraRounds: 0,
    customDhikr: 'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ',
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(TASBIH_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<TasbihPersistedState>;
    const isSameDay = parsed.todayDate === today;
    return {
      todayDate: today,
      todayCount:
        isSameDay && typeof parsed.todayCount === 'number' ? parsed.todayCount : 0,
      totalCount: typeof parsed.totalCount === 'number' ? parsed.totalCount : 0,
      zahraRounds: typeof parsed.zahraRounds === 'number' ? parsed.zahraRounds : 0,
      customDhikr:
        typeof parsed.customDhikr === 'string' && parsed.customDhikr.trim()
          ? parsed.customDhikr
          : fallback.customDhikr,
    };
  } catch {
    return fallback;
  }
}

function getZahraPhaseInfo(totalStep: number): {
  phaseIndex: number;
  phase: ZahraPhase;
  countInPhase: number;
  completed: boolean;
} {
  if (totalStep >= ZAHRA_TOTAL) {
    return {
      phaseIndex: 2,
      phase: ZAHRA_PHASES[2],
      countInPhase: ZAHRA_PHASES[2].target,
      completed: true,
    };
  }
  if (totalStep < 34) {
    return {
      phaseIndex: 0,
      phase: ZAHRA_PHASES[0],
      countInPhase: totalStep,
      completed: false,
    };
  }
  if (totalStep < 67) {
    return {
      phaseIndex: 1,
      phase: ZAHRA_PHASES[1],
      countInPhase: totalStep - 34,
      completed: false,
    };
  }
  return {
    phaseIndex: 2,
    phase: ZAHRA_PHASES[2],
    countInPhase: totalStep - 67,
    completed: false,
  };
}

export const TasbihScreen: React.FC<TasbihScreenProps> = ({
  muted,
  completedReadingIds,
  onCompleteReading,
  onBackHome,
}) => {
  const [mode, setMode] = useState<TasbihMode>('zahra');
  const [zahraStep, setZahraStep] = useState<number>(0);
  const [zahraStarAwardedToast, setZahraStarAwardedToast] = useState<boolean>(false);

  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    OPEN_DHIKR_PRESETS[0].id
  );
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [openCount, setOpenCount] = useState<number>(0);
  const [openTarget, setOpenTarget] = useState<number | null>(100);
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(true);
  const [rippleKey, setRippleKey] = useState<number>(0);

  const [persisted, setPersisted] = useState<TasbihPersistedState>(loadTasbihState);

  useEffect(() => {
    try {
      window.localStorage.setItem(TASBIH_STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      // Ignore storage quota errors
    }
  }, [persisted]);

  const zahraInfo = useMemo(() => getZahraPhaseInfo(zahraStep), [zahraStep]);
  const isZahraRewarded = completedReadingIds.includes('tasbih-zahra');

  const activeOpenPreset = useMemo(
    () =>
      OPEN_DHIKR_PRESETS.find((p) => p.id === selectedPresetId) ||
      OPEN_DHIKR_PRESETS[0],
    [selectedPresetId]
  );

  const activeOpenDhikrText = isCustomMode
    ? persisted.customDhikr.trim() || 'سُبْحَانَ اللَّهِ'
    : activeOpenPreset.arabic;

  const triggerHaptic = useCallback(
    (pattern: number | number[]) => {
      if (
        hapticEnabled &&
        typeof navigator !== 'undefined' &&
        typeof navigator.vibrate === 'function'
      ) {
        try {
          navigator.vibrate(pattern);
        } catch {
          // Ignore unsupported vibrate errors
        }
      }
    },
    [hapticEnabled]
  );

  const incrementCounter = useCallback(() => {
    setRippleKey((k) => k + 1);

    if (mode === 'zahra') {
      if (zahraStep >= ZAHRA_TOTAL) return;

      const next = zahraStep + 1;
      setZahraStep(next);

      const isPhaseBoundary = next === 34 || next === 67;
      const isRoundFinished = next === ZAHRA_TOTAL;

      if (isRoundFinished) {
        playVictorySound(muted);
        triggerHaptic([24, 50, 40]);
        const awarded = onCompleteReading('tasbih-zahra');
        if (awarded) {
          setZahraStarAwardedToast(true);
        }
        setPersisted((prev) => ({
          ...prev,
          todayDate: getTodayKey(),
          todayCount: prev.todayCount + 1,
          totalCount: prev.totalCount + 1,
          zahraRounds: prev.zahraRounds + 1,
        }));
      } else {
        if (isPhaseBoundary) {
          playTasbihPhaseSound(muted);
          triggerHaptic([18, 35, 18]);
        } else {
          playBeadTickSound(muted, next % 10 === 0);
          triggerHaptic(10);
        }
        setPersisted((prev) => ({
          ...prev,
          todayDate: getTodayKey(),
          todayCount: prev.todayCount + 1,
          totalCount: prev.totalCount + 1,
        }));
      }
    } else {
      const next = openCount + 1;
      setOpenCount(next);
      const reachedTarget = openTarget !== null && next % openTarget === 0;
      if (reachedTarget) {
        playTasbihPhaseSound(muted);
        triggerHaptic([20, 40, 20]);
      } else {
        playBeadTickSound(muted, next % 33 === 0);
        triggerHaptic(10);
      }
      setPersisted((prev) => ({
        ...prev,
        todayDate: getTodayKey(),
        todayCount: prev.todayCount + 1,
        totalCount: prev.totalCount + 1,
      }));
    }
  }, [
    mode,
    zahraStep,
    openCount,
    openTarget,
    muted,
    triggerHaptic,
    onCompleteReading,
  ]);

  const handleUndo = () => {
    if (mode === 'zahra') {
      if (zahraStep <= 0) return;
      setZahraStep((s) => Math.max(0, s - 1));
    } else {
      if (openCount <= 0) return;
      setOpenCount((c) => Math.max(0, c - 1));
    }
    setPersisted((prev) => ({
      ...prev,
      todayCount: Math.max(0, prev.todayCount - 1),
      totalCount: Math.max(0, prev.totalCount - 1),
    }));
  };

  const handleReset = () => {
    if (mode === 'zahra') {
      setZahraStep(0);
      setZahraStarAwardedToast(false);
    } else {
      setOpenCount(0);
    }
  };

  // Keyboard Spacebar shortcut for serene counting
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        incrementCounter();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [incrementCounter]);

  // SVG Misbaha Ring geometry (34 or 33 beads)
  const beadCount =
    mode === 'zahra'
      ? zahraInfo.phase.target
      : openTarget && openTarget <= 33
      ? openTarget
      : 33;

  const filledBeads =
    mode === 'zahra'
      ? zahraInfo.completed
        ? beadCount
        : zahraInfo.countInPhase
      : openTarget
      ? openCount % openTarget === 0 && openCount > 0
        ? beadCount
        : Math.round(((openCount % openTarget) / openTarget) * beadCount)
      : openCount % beadCount;

  const ringRadius = 148;
  const center = 180;
  const circumference = 2 * Math.PI * ringRadius;
  const progressRatio =
    mode === 'zahra'
      ? zahraStep / ZAHRA_TOTAL
      : openTarget
      ? ((openCount % openTarget) || (openCount > 0 ? openTarget : 0)) / openTarget
      : (openCount % 33) / 33;

  const beadPositions = useMemo(() => {
    return Array.from({ length: beadCount }, (_, idx) => {
      // Start at 12 o'clock (-90deg) and move clockwise
      const angle = ((idx + 1) / (beadCount + 1)) * 2 * Math.PI - Math.PI / 2;
      const x = center + ringRadius * Math.cos(angle);
      const y = center + ringRadius * Math.sin(angle);
      return { idx, x, y };
    });
  }, [beadCount]);

  return (
    <section
      aria-label="واحة التسبيح النوراني"
      className="min-h-[calc(100vh-3.5rem)] bg-[#061816] text-amber-50 relative overflow-hidden py-4 sm:py-9 px-3 sm:px-6"
    >
      {/* Atmospheric Nocturnal Mihrab Radial Lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 24%, rgba(20, 83, 75, 0.55) 0%, rgba(6, 24, 22, 0.2) 48%, rgba(4, 15, 14, 0.95) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg width=\'96\' height=\'96\' viewBox=\'0 0 96 96\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' stroke=\'%23D4AF37\' stroke-opacity=\'0.32\' stroke-width=\'0.8\'%3E%3Cpath d=\'M48 10 L57 39 L86 48 L57 57 L48 86 L39 57 L10 48 L39 39 Z\'/%3E%3Ccircle cx=\'48\' cy=\'48\' r=\'14\'/%3E%3C/g%3E%3C/svg%3E")',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Top Sanctuary Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3.5 sm:gap-4 pb-4 sm:pb-6 border-b border-amber-400/15">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onBackHome}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0B2622] hover:bg-[#113530] text-amber-100 border border-amber-400/25 font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
            >
              <ArrowRight className="w-4 h-4 text-amber-300" aria-hidden="true" />
              <span>الرئيسية</span>
            </button>

            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-amber-100 tracking-wide">
                واحة التسبيح النوراني
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200/80 mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 tabular-nums">
                <span>أذكار اليوم: {persisted.todayCount}</span>
                <span className="text-amber-400/60" aria-hidden="true">·</span>
                <span>دورات تسبيح الزهراء: {persisted.zahraRounds}</span>
                <span className="text-amber-400/60" aria-hidden="true">·</span>
                <span>المجموع الكلي: {persisted.totalCount}</span>
              </p>
            </div>
          </div>

          {/* Segmented Sanctuary Mode Switcher */}
          <div
            role="tablist"
            aria-label="اختيار نوع التسبيح"
            className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex items-center p-1 rounded-2xl bg-[#04110F] border border-amber-400/25"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'zahra'}
              onClick={() => setMode('zahra')}
              className={`min-h-[44px] px-3 sm:px-5 py-2 rounded-xl font-display font-extrabold text-xs sm:text-base transition-all cursor-pointer whitespace-nowrap ${
                mode === 'zahra'
                  ? 'bg-gradient-to-l from-amber-500 via-amber-400 to-yellow-300 text-[#061816] shadow-md shadow-amber-500/20'
                  : 'text-amber-100/80 hover:text-amber-50'
              }`}
            >
              تسبيح الزهراء (ع)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'open'}
              onClick={() => setMode('open')}
              className={`min-h-[44px] px-3 sm:px-5 py-2 rounded-xl font-display font-extrabold text-xs sm:text-base transition-all cursor-pointer whitespace-nowrap ${
                mode === 'open'
                  ? 'bg-gradient-to-l from-teal-400 to-emerald-400 text-[#061816] shadow-md shadow-teal-500/20'
                  : 'text-amber-100/80 hover:text-amber-50'
              }`}
            >
              التسبيح المفتوح
            </button>
          </div>
        </div>

        {/* Main Sanctuary Split Layout */}
        <div className="mt-5 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          {/* Interactive Radial Misbaha Column (Focal Anchor) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {/* Phase Sequence Progress Strip for Zahra Mode */}
            {mode === 'zahra' && (
              <div className="w-full max-w-md mb-4 sm:mb-5 grid grid-cols-3 gap-2 sm:gap-3 text-center">
                {ZAHRA_PHASES.map((p, idx) => {
                  const isActive = !zahraInfo.completed && zahraInfo.phaseIndex === idx;
                  const isDone =
                    zahraInfo.completed || zahraInfo.phaseIndex > idx;
                  const doneInThis =
                    zahraInfo.completed || zahraInfo.phaseIndex > idx
                      ? p.target
                      : zahraInfo.phaseIndex === idx
                      ? zahraInfo.countInPhase
                      : 0;
                  return (
                    <div
                      key={p.id}
                      className={`py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-2xl border transition-colors ${
                        isActive
                          ? 'bg-[#0E2F2A] border-amber-400/70 text-amber-100'
                          : isDone
                          ? 'bg-[#09211E] border-emerald-400/40 text-emerald-200'
                          : 'bg-[#081C1A] border-amber-400/10 text-slate-400'
                      }`}
                    >
                      <div className="font-arabic text-sm sm:text-base font-bold leading-[1.6] opacity-95">
                        {p.arabic}
                      </div>
                      <div className="mt-0.5 font-display font-black text-xs sm:text-sm tabular-nums">
                        {doneInThis} / {p.target}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Central Radial SVG Misbaha & Tactile Jewel Medallion */}
            <div className="relative w-[280px] h-[280px] min-[390px]:w-[324px] min-[390px]:h-[324px] sm:w-[380px] sm:h-[380px] mx-auto flex items-center justify-center select-none">
              <svg
                viewBox="0 0 360 360"
                className="absolute inset-0 w-full h-full pointer-events-none"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="beadPearl" cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#FFFBEB" />
                    <stop offset="55%" stopColor="#FDE68A" />
                    <stop offset="100%" stopColor="#B45309" />
                  </radialGradient>
                  <radialGradient id="beadTeal" cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#99F6E4" />
                    <stop offset="55%" stopColor="#14B8A6" />
                    <stop offset="100%" stopColor="#0F4C45" />
                  </radialGradient>
                  <radialGradient id="beadIdle" cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#1E4D45" />
                    <stop offset="100%" stopColor="#0A221E" />
                  </radialGradient>
                  <linearGradient id="goldTrack" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FCD34D" />
                    <stop offset="100%" stopColor="#2DD4BF" />
                  </linearGradient>
                </defs>

                {/* Outer Brass Astrolabe Hairlines */}
                <circle
                  cx={center}
                  cy={center}
                  r={168}
                  fill="none"
                  stroke="rgba(251, 191, 36, 0.16)"
                  strokeWidth="1"
                  strokeDasharray="3 6"
                />
                <circle
                  cx={center}
                  cy={center}
                  r={ringRadius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="3"
                />

                {/* Smooth Progress Arc */}
                <circle
                  cx={center}
                  cy={center}
                  r={ringRadius}
                  fill="none"
                  stroke="url(#goldTrack)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progressRatio)}
                  transform={`rotate(-90 ${center} ${center})`}
                  style={{ transition: 'stroke-dashoffset 180ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                />

                {/* Golden Top Shāhid Bead (12 o'clock anchor) */}
                <g transform={`translate(${center}, ${center - ringRadius})`}>
                  <rect
                    x="-4"
                    y="-18"
                    width="8"
                    height="12"
                    rx="3"
                    fill="#D97706"
                  />
                  <circle
                    r="8.5"
                    fill="url(#beadPearl)"
                    stroke="#FEF3C7"
                    strokeWidth="1.5"
                  />
                </g>

                {/* Radial Misbaha Beads */}
                {beadPositions.map(({ idx, x, y }) => {
                  const active = idx < filledBeads;
                  const isHead = idx === filledBeads - 1;
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r={isHead ? 7.5 : active ? 6 : 4.5}
                      fill={
                        active
                          ? mode === 'zahra'
                            ? 'url(#beadPearl)'
                            : 'url(#beadTeal)'
                          : 'url(#beadIdle)'
                      }
                      stroke={
                        isHead
                          ? '#FFFFFF'
                          : active
                          ? 'rgba(254, 243, 199, 0.65)'
                          : 'rgba(251, 191, 36, 0.2)'
                      }
                      strokeWidth={isHead ? 2 : 1}
                    />
                  );
                })}
              </svg>

              {/* Expanding Gold Ripple on Tap */}
              <AnimatePresence>
                <motion.span
                  key={rippleKey}
                  aria-hidden="true"
                  initial={{ scale: 0.78, opacity: 0.55 }}
                  animate={{ scale: 1.12, opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className={`absolute w-[178px] h-[178px] min-[390px]:w-[208px] min-[390px]:h-[208px] sm:w-[252px] sm:h-[252px] aspect-square rounded-full pointer-events-none border-2 ${
                    mode === 'zahra' ? 'border-amber-300/60' : 'border-teal-300/60'
                  }`}
                />
              </AnimatePresence>

              {/* Central Tactile Jewel Medallion Button */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={incrementCounter}
                disabled={mode === 'zahra' && zahraInfo.completed}
                aria-label={
                  mode === 'zahra'
                    ? `تسبيح ${zahraInfo.phase.arabic}، العدد الحالي ${zahraInfo.countInPhase} من ${zahraInfo.phase.target}`
                    : `تسبيح ${activeOpenDhikrText}، العدد الحالي ${openCount}`
                }
                className={`relative z-10 shrink-0 w-[178px] h-[178px] min-[390px]:w-[208px] min-[390px]:h-[208px] sm:w-[252px] sm:h-[252px] aspect-square rounded-full flex flex-col items-center justify-center px-3 py-3 sm:p-5 text-center cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 transition-shadow border-2 ${
                  mode === 'zahra' && zahraInfo.completed
                    ? 'bg-gradient-to-b from-[#173E36] to-[#0A211D] border-amber-300 shadow-[0_0_50px_rgba(251,191,36,0.28)] cursor-default'
                    : mode === 'zahra'
                    ? 'bg-gradient-to-b from-[#0E332D] via-[#092420] to-[#061816] border-amber-400/50 hover:border-amber-300 shadow-[0_0_45px_rgba(245,158,11,0.18)]'
                    : 'bg-gradient-to-b from-[#0D3233] via-[#082224] to-[#061816] border-teal-400/50 hover:border-teal-300 shadow-[0_0_45px_rgba(45,212,191,0.18)]'
                }`}
              >
                {mode === 'zahra' && zahraInfo.completed ? (
                  <>
                    <Sparkles
                      className="w-6 h-6 sm:w-8 sm:h-8 text-amber-300 mb-1 sm:mb-2 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="font-arabic font-bold text-xl min-[390px]:text-2xl sm:text-3xl text-amber-200 leading-[1.6] py-0.5">
                      لَا إِلَهَ إِلَّا اللَّهُ
                    </span>
                    <span className="mt-1 sm:mt-2 font-display font-black text-xs sm:text-sm text-emerald-200">
                      أتممت ١٠٠ / ١٠٠ بحمد الله
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className={`font-arabic font-bold w-full px-1 py-0.5 leading-[1.55] ${
                        mode === 'zahra'
                          ? 'text-2xl min-[390px]:text-[28px] sm:text-4xl text-amber-100'
                          : activeOpenDhikrText.length > 36
                          ? 'text-sm min-[390px]:text-base sm:text-lg text-teal-100 leading-[1.6]'
                          : activeOpenDhikrText.length > 22
                          ? 'text-base min-[390px]:text-lg sm:text-xl text-teal-100 leading-[1.6]'
                          : 'text-xl min-[390px]:text-2xl sm:text-3xl text-teal-100'
                      }`}
                    >
                      {mode === 'zahra' ? zahraInfo.phase.arabic : activeOpenDhikrText}
                    </span>

                    <div className="mt-1 sm:mt-2.5 flex items-baseline justify-center gap-1.5 tabular-nums">
                      <span className="font-display font-black text-3xl min-[390px]:text-4xl sm:text-5xl text-white leading-none">
                        {mode === 'zahra' ? zahraInfo.countInPhase : openCount}
                      </span>
                      {mode === 'zahra' ? (
                        <span className="text-sm sm:text-base font-bold text-amber-300/85">
                          / {zahraInfo.phase.target}
                        </span>
                      ) : openTarget !== null ? (
                        <span className="text-sm sm:text-base font-bold text-teal-300/85">
                          / {openTarget}
                        </span>
                      ) : null}
                    </div>

                    <span className="mt-1.5 sm:mt-2.5 text-[11px] sm:text-xs font-bold text-amber-200/75">
                      اضغط للتسبيح · مسافة
                    </span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Zahra Completion Banner / Restart Action */}
            {mode === 'zahra' && zahraInfo.completed && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 w-full max-w-md rounded-2xl bg-[#0D2E29] border border-amber-400/50 p-4 text-center space-y-3"
              >
                <p className="font-display font-extrabold text-amber-100 text-base">
                  تقبّل اللهُ تسبيحَك! يُستحبّ ختمُ التسبيحِ بقول: «لَا إِلَهَ إِلَّا اللَّهُ»
                </p>
                {zahraStarAwardedToast && (
                  <p className="text-sm font-black text-amber-300 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                    <span>تقبّل الله طاعتك! أتممت تسبيح الزهراء (عليها السلام)</span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#061816] font-display font-black text-sm inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  <span>ابدأ دورة تسبيح جديدة</span>
                </button>
              </motion.div>
            )}

            {/* Tactile Bottom Controls */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleUndo}
                disabled={mode === 'zahra' ? zahraStep === 0 : openCount === 0}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0B2320] hover:bg-[#123632] disabled:opacity-40 text-amber-100 border border-amber-400/20 font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Undo2 className="w-4 h-4 text-amber-300" aria-hidden="true" />
                <span>تراجع (-١)</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={mode === 'zahra' ? zahraStep === 0 : openCount === 0}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0B2320] hover:bg-[#123632] disabled:opacity-40 text-amber-100 border border-amber-400/20 font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-teal-300" aria-hidden="true" />
                <span>تصفير العداد</span>
              </button>

              <button
                type="button"
                onClick={() => setHapticEnabled((v) => !v)}
                className={`min-h-[44px] px-4 py-2 rounded-xl border font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors ${
                  hapticEnabled
                    ? 'bg-[#0F2F2A] border-teal-400/40 text-teal-200'
                    : 'bg-[#0B2320] border-amber-400/15 text-slate-400'
                }`}
              >
                <Vibrate className="w-4 h-4" aria-hidden="true" />
                <span>الاهتزاز: {hapticEnabled ? 'مفعّل' : 'متوقف'}</span>
              </button>
            </div>
          </div>

          {/* Right Context Column: Guidance & Dhikr Selector */}
          <div className="lg:col-span-5 space-y-5">
            {mode === 'zahra' ? (
              <div className="rounded-3xl bg-[#0A221E] border border-amber-400/25 p-6 sm:p-7 space-y-5">
                <div>
                  <p className="text-xs font-extrabold text-amber-300 tracking-wide">
                    تعقيب الصلوات المبارك · ١٠٠ تسبيحة
                  </p>
                  <h2 className="font-display font-black text-2xl text-white mt-1">
                    تسبيح السيدة فاطمة الزهراء (عليها السلام)
                  </h2>
                  <p className="text-sm text-emerald-100/80 mt-2 leading-relaxed">
                    الهدية النبوية التي علّمها رسولُ الله (ﷺ) لابنته السيدة الزهراء (عليها السلام)، وهي من أعظم الأذكار بعد كل صلاة وعند النوم.
                  </p>
                </div>

                {/* Clean Phase Meaning Card */}
                <div className="pt-4 border-t border-amber-400/15 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300 tabular-nums">
                    <span>التقدم الكلي في التسبيح</span>
                    <span>{zahraStep} / 100</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#041210] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-amber-400 to-teal-400 transition-all duration-200"
                      style={{ width: `${Math.min(100, zahraStep)}%` }}
                    />
                  </div>
                  <p className="text-sm text-amber-100/90 pt-1">
                    <strong className="text-amber-300 font-bold">معنى الذكر الحالي: </strong>
                    {zahraInfo.phase.meaning}
                  </p>
                </div>

                {/* Completion Status */}
                <div className="pt-4 border-t border-amber-400/15 flex items-center gap-2.5 text-sm font-bold">
                  {isZahraRewarded ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
                      <span className="text-emerald-200">
                        أتممت تسبيح السيدة فاطمة الزهراء (عليها السلام)
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-amber-300 shrink-0" aria-hidden="true" />
                      <span className="text-amber-200">
                        أكمل ١٠٠ تسبيحة لإتمام تسبيح الزهراء (عليها السلام)
                      </span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-[#0A221E] border border-teal-400/25 p-5 sm:p-6 space-y-5">
                <div>
                  <h2 className="font-display font-black text-xl sm:text-2xl text-white">
                    اختر الذكر أو اكتب ذكرك الخاص
                  </h2>
                  <p className="text-xs sm:text-sm text-emerald-100/75 mt-1">
                    {isCustomMode
                      ? 'ذكرٌ خاصٌّ من اختيارك يُحسب تلقائياً في سجلّك اليومي'
                      : activeOpenPreset.virtue}
                  </p>
                </div>

                {/* Preset List */}
                <div className="space-y-2">
                  {OPEN_DHIKR_PRESETS.map((preset) => {
                    const selected = !isCustomMode && selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setIsCustomMode(false);
                          setSelectedPresetId(preset.id);
                          setOpenCount(0);
                        }}
                        className={`w-full text-right px-4 py-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          selected
                            ? 'bg-[#113832] border-teal-400 text-white'
                            : 'bg-[#071A17] hover:bg-[#0D2924] border-amber-400/15 text-amber-100/85'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-arabic font-bold text-lg leading-snug truncate">
                            {preset.arabic}
                          </div>
                          <div className="text-xs text-teal-200/75 mt-0.5">
                            {preset.shortTitle}
                          </div>
                        </div>
                        {selected && (
                          <CheckCircle2
                            className="w-5 h-5 text-teal-300 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}

                  {/* Custom Dhikr Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMode(true);
                      setOpenCount(0);
                    }}
                    className={`w-full text-right px-4 py-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isCustomMode
                        ? 'bg-[#113832] border-amber-400 text-amber-100'
                        : 'bg-[#071A17] hover:bg-[#0D2924] border-amber-400/15 text-amber-100/85'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Edit3 className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
                      <span className="font-display font-bold text-sm sm:text-base">
                        كتابة ذكر مخصص
                      </span>
                    </div>
                    {isCustomMode && (
                      <CheckCircle2
                        className="w-5 h-5 text-amber-300 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </div>

                {/* Custom Dhikr Input */}
                {isCustomMode && (
                  <div>
                    <label
                      htmlFor="custom-dhikr-input"
                      className="block text-xs font-bold text-amber-200 mb-1.5"
                    >
                      نص الذكر المخصص:
                    </label>
                    <input
                      id="custom-dhikr-input"
                      type="text"
                      maxLength={80}
                      value={persisted.customDhikr}
                      onChange={(e) =>
                        setPersisted((prev) => ({
                          ...prev,
                          customDhikr: e.target.value,
                        }))
                      }
                      placeholder="اكتب الذكر هنا..."
                      className="w-full min-h-[44px] px-4 rounded-xl bg-[#051412] border border-amber-400/35 focus:border-amber-300 focus:outline-none font-arabic text-lg text-amber-50 placeholder:text-slate-500"
                    />
                  </div>
                )}

                {/* Target Cycle Selector */}
                <div className="pt-4 border-t border-teal-400/15">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-teal-200 flex items-center gap-1.5">
                      <InfinityIcon className="w-4 h-4" aria-hidden="true" />
                      <span>هدف الدورة</span>
                    </span>
                    {openTarget !== null && openCount >= openTarget && (
                      <span className="text-xs font-bold text-amber-300 tabular-nums">
                        أتممت {Math.floor(openCount / openTarget)} دورة
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {OPEN_TARGETS.map((t) => {
                      const active = openTarget === t.value;
                      return (
                        <button
                          key={t.label}
                          type="button"
                          onClick={() => setOpenTarget(t.value)}
                          className={`min-h-[40px] rounded-xl font-display font-extrabold text-xs sm:text-sm border transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                            active
                              ? 'bg-teal-400 text-[#061816] border-teal-300'
                              : 'bg-[#071A17] hover:bg-[#0E2B26] text-amber-100 border-amber-400/15'
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
