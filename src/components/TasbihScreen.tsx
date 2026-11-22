import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  Edit3,
  Infinity as InfinityIcon,
  RotateCcw,
  Undo2,
  Vibrate,
} from 'lucide-react';
import {
  playBeadTickSound,
  playTasbihPhaseSound,
  playVictorySound,
} from '../utils/sound';
import {
  CornerOrnaments,
  ManuscriptDivider,
  TasbihBeadsIcon,
} from './IslamicOrnaments';

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
  ambientRadial: string;
}

const ZAHRA_PHASES: ZahraPhase[] = [
  {
    id: 'takbir',
    label: 'التكبير',
    arabic: 'اللَّهُ أَكْبَرُ',
    target: 34,
    meaning: 'الله أعظمُ من كلِّ شيءٍ في هذا الوجود',
    ambientRadial:
      'radial-gradient(circle at 50% 28%, rgba(31, 107, 80, 0.42) 0%, rgba(15, 61, 46, 0.25) 48%, rgba(8, 26, 20, 0.96) 100%)',
  },
  {
    id: 'tahmid',
    label: 'التحميد',
    arabic: 'الْحَمْدُ لِلَّهِ',
    target: 33,
    meaning: 'الشكرُ والثناءُ الكاملُ للهِ على نعمهِ الظاهرة والباطنة',
    ambientRadial:
      'radial-gradient(circle at 50% 28%, rgba(184, 146, 74, 0.24) 0%, rgba(15, 61, 46, 0.32) 48%, rgba(8, 26, 20, 0.96) 100%)',
  },
  {
    id: 'tasbih',
    label: 'التسبيح',
    arabic: 'سُبْحَانَ اللَّهِ',
    target: 33,
    meaning: 'تنزيهُ اللهِ وتقديسُهُ عن كلِّ نقصٍ وعيب',
    ambientRadial:
      'radial-gradient(circle at 50% 28%, rgba(25, 92, 74, 0.45) 0%, rgba(12, 46, 36, 0.28) 48%, rgba(7, 22, 18, 0.97) 100%)',
  },
];

const ZAHRA_TOTAL = 100;

interface OpenDhikrPreset {
  id: string;
  arabic: string;
  shortTitle: string;
  virtue: string;
  ambientRadial: string;
}

const OPEN_DHIKR_PRESETS: OpenDhikrPreset[] = [
  {
    id: 'salawat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ',
    shortTitle: 'الصلاة على النبي وآله',
    virtue: 'أحبُّ الأذكارِ إلى اللهِ ومفتاحُ استجابةِ الدعاء',
    ambientRadial:
      'radial-gradient(circle at 50% 28%, rgba(184, 146, 74, 0.22) 0%, rgba(15, 61, 46, 0.34) 48%, rgba(8, 26, 20, 0.96) 100%)',
  },
  {
    id: 'tasbih-hamd',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    shortTitle: 'سبحان الله وبحمده',
    virtue: 'كلمتانِ خفيفتانِ على اللسان، ثقيلتانِ في الميزان',
    ambientRadial:
      'radial-gradient(circle at 50% 28%, rgba(31, 107, 80, 0.44) 0%, rgba(15, 61, 46, 0.24) 48%, rgba(8, 26, 20, 0.96) 100%)',
  },
  {
    id: 'istighfar',
    arabic: 'أَسْتَغْفِرُ اللَّهَ رَبِّي وَأَتُوبُ إِلَيْهِ',
    shortTitle: 'الاستغفار والتوبة',
    virtue: 'جلاءُ القلوبِ وبابُ الرحمةِ وسعةِ الرزق',
    ambientRadial:
      'radial-gradient(circle at 50% 28%, rgba(22, 82, 66, 0.46) 0%, rgba(10, 42, 34, 0.3) 50%, rgba(7, 21, 17, 0.97) 100%)',
  },
  {
    id: 'tahlil',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',
    shortTitle: 'كلمة التوحيد',
    virtue: 'أفضلُ الذكرِ وحصنُ اللهِ الحصين',
    ambientRadial:
      'radial-gradient(circle at 50% 28%, rgba(217, 185, 106, 0.2) 0%, rgba(15, 61, 46, 0.3) 48%, rgba(8, 26, 20, 0.97) 100%)',
  },
  {
    id: 'hawqala',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    shortTitle: 'الحوقلة',
    virtue: 'كنزٌ من كنوزِ الجنة وتفويضُ الأمرِ لله',
    ambientRadial:
      'radial-gradient(circle at 50% 28%, rgba(31, 107, 80, 0.38) 0%, rgba(14, 54, 42, 0.32) 48%, rgba(8, 24, 19, 0.97) 100%)',
  },
  {
    id: 'hayy-qayyum',
    arabic: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ',
    shortTitle: 'يا حيّ يا قيّوم',
    virtue: 'نداءُ الاضطرارِ وطلبُ العونِ الإلهي',
    ambientRadial:
      'radial-gradient(circle at 50% 28%, rgba(184, 146, 74, 0.25) 0%, rgba(15, 61, 46, 0.28) 48%, rgba(8, 25, 20, 0.97) 100%)',
  },
];

const OPEN_TARGETS: { value: number | null; label: string }[] = [
  { value: null, label: 'مفتوح ∞' },
  { value: 33, label: '٣٣' },
  { value: 100, label: '١٠٠' },
  { value: 1000, label: '١٠٠٠' },
];

const TASBIH_STORAGE_KEY = 'rihlat_alnoor_tasbih_v1';

const ARABIC_INDIC = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
function toArabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => ARABIC_INDIC[Number(d)] ?? d);
}

interface TasbihPersistedState {
  todayDate: string;
  todayCount: number;
  totalCount: number;
  zahraRounds: number;
  customDhikr: string;
  dailyHistory: Record<string, number>;
}

function getDateKeyOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function getTodayKey(): string {
  return getDateKeyOffset(0);
}

function loadTasbihState(): TasbihPersistedState {
  const today = getTodayKey();
  const fallback: TasbihPersistedState = {
    todayDate: today,
    todayCount: 0,
    totalCount: 0,
    zahraRounds: 0,
    customDhikr:
      'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ',
    dailyHistory: {},
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(TASBIH_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<TasbihPersistedState>;
    const isSameDay = parsed.todayDate === today;
    const todayVal =
      isSameDay && typeof parsed.todayCount === 'number' ? parsed.todayCount : 0;
    const rawHistory =
      parsed.dailyHistory && typeof parsed.dailyHistory === 'object'
        ? parsed.dailyHistory
        : {};
    const cleanedHistory: Record<string, number> = {};
    for (const [k, v] of Object.entries(rawHistory)) {
      if (typeof v === 'number' && v >= 0) cleanedHistory[k] = v;
    }
    if (parsed.todayDate && typeof parsed.todayCount === 'number' && parsed.todayCount > 0) {
      cleanedHistory[parsed.todayDate] = Math.max(
        cleanedHistory[parsed.todayDate] || 0,
        parsed.todayCount
      );
    }
    return {
      todayDate: today,
      todayCount: todayVal,
      totalCount: typeof parsed.totalCount === 'number' ? parsed.totalCount : 0,
      zahraRounds: typeof parsed.zahraRounds === 'number' ? parsed.zahraRounds : 0,
      customDhikr:
        typeof parsed.customDhikr === 'string' && parsed.customDhikr.trim()
          ? parsed.customDhikr
          : fallback.customDhikr,
      dailyHistory: cleanedHistory,
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

/* Compute (x, y) point along arched silk misbaha cord (parabolic Mihrab arch) */
function sampleMisbahaArch(t: number): { x: number; y: number } {
  const clamped = Math.max(0, Math.min(1, t));
  // Cubic arch peaking at center top (180, 32)
  const p0 = { x: 42, y: 244 };
  const p1 = { x: 64, y: 28 };
  const p2 = { x: 296, y: 28 };
  const p3 = { x: 318, y: 244 };

  const u = 1 - clamped;
  const x =
    u * u * u * p0.x +
    3 * u * u * clamped * p1.x +
    3 * u * clamped * clamped * p2.x +
    clamped * clamped * clamped * p3.x;
  const y =
    u * u * u * p0.y +
    3 * u * u * clamped * p1.y +
    3 * u * clamped * clamped * p2.y +
    clamped * clamped * clamped * p3.y;
  return { x, y };
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
  const [pulseKey, setPulseKey] = useState<number>(0);

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

  const activeAmbientRadial =
    mode === 'zahra'
      ? zahraInfo.phase.ambientRadial
      : activeOpenPreset.ambientRadial;

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
    setPulseKey((k) => k + 1);

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
        setPersisted((prev) => {
          const today = getTodayKey();
          const nextToday = (prev.todayDate === today ? prev.todayCount : 0) + 1;
          return {
            ...prev,
            todayDate: today,
            todayCount: nextToday,
            totalCount: prev.totalCount + 1,
            zahraRounds: prev.zahraRounds + 1,
            dailyHistory: { ...prev.dailyHistory, [today]: nextToday },
          };
        });
      } else {
        if (isPhaseBoundary) {
          playTasbihPhaseSound(muted);
          triggerHaptic([18, 35, 18]);
        } else {
          playBeadTickSound(muted, next % 10 === 0);
          triggerHaptic(12);
        }
        setPersisted((prev) => {
          const today = getTodayKey();
          const nextToday = (prev.todayDate === today ? prev.todayCount : 0) + 1;
          return {
            ...prev,
            todayDate: today,
            todayCount: nextToday,
            totalCount: prev.totalCount + 1,
            dailyHistory: { ...prev.dailyHistory, [today]: nextToday },
          };
        });
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
        triggerHaptic(12);
      }
      setPersisted((prev) => {
        const today = getTodayKey();
        const nextToday = (prev.todayDate === today ? prev.todayCount : 0) + 1;
        return {
          ...prev,
          todayDate: today,
          todayCount: nextToday,
          totalCount: prev.totalCount + 1,
          dailyHistory: { ...prev.dailyHistory, [today]: nextToday },
        };
      });
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
    setPersisted((prev) => {
      const today = getTodayKey();
      const nextToday = Math.max(0, (prev.todayDate === today ? prev.todayCount : 0) - 1);
      return {
        ...prev,
        todayDate: today,
        todayCount: nextToday,
        totalCount: Math.max(0, prev.totalCount - 1),
        dailyHistory: { ...prev.dailyHistory, [today]: nextToday },
      };
    });
  };

  const handleReset = () => {
    if (mode === 'zahra') {
      setZahraStep(0);
      setZahraStarAwardedToast(false);
    } else {
      setOpenCount(0);
    }
  };

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

  /* Visible tactile arched misbaha cord geometry:
     15 representative beads visible in the arched track; remaining uncounted beads
     gather gracefully on the left base (t: 0.04..0.38) while counted beads glide
     across the apex bridge to the right side (t: 0.62..0.96). */
  const visibleStrandSize =
    mode === 'zahra'
      ? zahraInfo.phase.target
      : openTarget && openTarget <= 33
      ? openTarget
      : 33;

  const filledInCycle =
    mode === 'zahra'
      ? zahraInfo.completed
        ? visibleStrandSize
        : zahraInfo.countInPhase
      : openTarget
      ? openCount % openTarget === 0 && openCount > 0
        ? visibleStrandSize
        : Math.round(((openCount % openTarget) / openTarget) * visibleStrandSize)
      : openCount % visibleStrandSize;

  // Map up to 18 visible sliding beads cleanly along the cord so every tap slides one bead smoothly across the apex
  const displayBeadCount = Math.min(18, visibleStrandSize);
  const displayFilled = Math.round(
    (filledInCycle / Math.max(1, visibleStrandSize)) * displayBeadCount
  );

  const slidingBeadCoords = useMemo(() => {
    return Array.from({ length: displayBeadCount }, (_, i) => {
      const isCounted = i < displayFilled;
      // Uncounted beads pack smoothly on the left (t from 0.03 to 0.36); counted pack on the right (t from 0.64 to 0.97)
      const uncountedIndex = i - displayFilled;
      const uncountedTotal = Math.max(1, displayBeadCount - displayFilled);
      const t = isCounted
        ? 0.97 - (i / Math.max(1, displayBeadCount)) * 0.33
        : 0.03 + ((uncountedTotal - 1 - uncountedIndex) / Math.max(1, displayBeadCount)) * 0.33;
      const { x, y } = sampleMisbahaArch(t);
      return { i, isCounted, x, y };
    });
  }, [displayBeadCount, displayFilled]);

  return (
    <section
      aria-label="محراب المسبحة النورانية"
      className="min-h-[calc(100vh-3.5rem)] bg-[#081A14] text-[#F3EBD6] relative overflow-hidden py-5 sm:py-9 px-3 sm:px-6 transition-colors duration-700"
    >
      {/* Dynamic Atmospheric Mihrab Backdrop per Active Dhikr */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-all duration-700"
        style={{ background: activeAmbientRadial }}
      />
      {/* Low-opacity 5% Sacred Lattice */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg width=\'96\' height=\'96\' viewBox=\'0 0 96 96\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' stroke=\'%23D9B96A\' stroke-opacity=\'0.13\' stroke-width=\'0.8\'%3E%3Cpath d=\'M48 10 L57 39 L86 48 L57 57 L48 86 L39 57 L10 48 L39 39 Z\'/%3E%3Ccircle cx=\'48\' cy=\'48\' r=\'12\'/%3E%3C/g%3E%3C/svg%3E")',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Nocturnal Sanctuary Masthead */}
        <div className="flex flex-wrap items-center justify-between gap-3.5 pb-4 sm:pb-5 border-b border-[#D9B96A]/25">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackHome}
              className="min-h-[42px] px-3.5 py-2 rounded-[6px] bg-[#0E2920] hover:bg-[#143B2E] text-[#F3EBD6] border border-[#B8924A]/50 font-display font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
            >
              <ArrowRight className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
              <span>الرئيسية</span>
            </button>

            <div>
              <h1 className="font-calligraphy font-bold text-2xl sm:text-3xl text-[#D9B96A] flex items-center gap-2">
                <TasbihBeadsIcon className="w-6 h-6 text-[#D9B96A] shrink-0" />
                <span>المسبحة النورانية</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#C8D8CE]/85 mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 tabular-nums">
                <span>أذكار اليوم: {toArabicDigits(persisted.todayCount)}</span>
                <span className="text-[#B8924A]/60" aria-hidden="true">·</span>
                <span>دورات الزهراء (ع): {toArabicDigits(persisted.zahraRounds)}</span>
                <span className="text-[#B8924A]/60" aria-hidden="true">·</span>
                <span>المجموع: {toArabicDigits(persisted.totalCount)}</span>
              </p>
            </div>
          </div>

          {/* Architectural Tab Switcher */}
          <div
            role="tablist"
            aria-label="اختيار نوع التسبيح"
            className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex border border-[#B8924A]/45 rounded-[6px] overflow-hidden bg-[#05120E]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'zahra'}
              onClick={() => setMode('zahra')}
              className={`min-h-[42px] px-4 py-2 font-display font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap ${
                mode === 'zahra'
                  ? 'bg-[#B8924A] text-[#081A14]'
                  : 'text-[#F3EBD6]/80 hover:text-[#D9B96A]'
              }`}
            >
              تسبيح الزهراء (ع)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'open'}
              onClick={() => setMode('open')}
              className={`min-h-[42px] px-4 py-2 font-display font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap border-r border-[#B8924A]/35 ${
                mode === 'open'
                  ? 'bg-[#B8924A] text-[#081A14]'
                  : 'text-[#F3EBD6]/80 hover:text-[#D9B96A]'
              }`}
            >
              التسبيح المفتوح
            </button>
          </div>
        </div>

        {/* Main Sanctuary Split Layout */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
          {/* Interactive Sliding Misbaha Arch Column */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {mode === 'zahra' && (
              <div className="w-full max-w-lg mb-4 grid grid-cols-3 border border-[#B8924A]/35 rounded-[5px] divide-x divide-x-reverse divide-[#B8924A]/25 bg-[#0B221A]/85 text-center">
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
                      className={`py-2.5 px-2 transition-colors ${
                        isActive
                          ? 'bg-[#143B2E] text-[#FAF6EC] border-b-2 border-[#D9B96A]'
                          : isDone
                          ? 'bg-[#0E2920] text-[#D9B96A]'
                          : 'text-[#9FB5AA]'
                      }`}
                    >
                      <div className="font-arabic text-sm sm:text-base font-bold leading-relaxed">
                        {p.arabic}
                      </div>
                      <div className="mt-0.5 font-display font-bold text-xs tabular-nums">
                        {toArabicDigits(doneInThis)} / {toArabicDigits(p.target)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Illuminated Nocturnal Mihrab Plaque + Sliding Misbaha Cord SVG */}
            <div className="relative w-full max-w-[390px] mx-auto manuscript-folio-dark rounded-[6px] pt-7 pb-8 px-7 select-none">
              <CornerOrnaments tone="dark" />

              {/* Arched Sliding Misbaha SVG */}
              <div className="relative w-full aspect-[360/250] -mb-6">
                <svg
                  viewBox="0 0 360 250"
                  className="w-full h-full overflow-visible"
                  aria-hidden="true"
                >
                  <defs>
                    <radialGradient id="amberBeadGrad" cx="35%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#FAF0CF" />
                      <stop offset="55%" stopColor="#D9B96A" />
                      <stop offset="100%" stopColor="#7A5420" />
                    </radialGradient>
                    <radialGradient id="jadeBeadGrad" cx="35%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#347A61" />
                      <stop offset="65%" stopColor="#144434" />
                      <stop offset="100%" stopColor="#081A14" />
                    </radialGradient>
                  </defs>

                  {/* Silk Cord Arch */}
                  <path
                    d="M 42 244 C 64 28, 296 28, 318 244"
                    fill="none"
                    stroke="#B8924A"
                    strokeOpacity="0.45"
                    strokeWidth="2.2"
                  />

                  {/* Top Imam/Shahid Tassel Bead at Arch Peak */}
                  <g transform="translate(180, 74)">
                    <line x1="0" y1="-26" x2="0" y2="8" stroke="#D9B96A" strokeWidth="2" />
                    <path d="M-5 8 L5 8 L3 24 L-3 24 Z" fill="#B8924A" opacity="0.85" />
                    <circle
                      cy="-8"
                      r="9.5"
                      fill="url(#amberBeadGrad)"
                      stroke="#FAF6EC"
                      strokeWidth="1.2"
                    />
                  </g>

                  {/* Sliding Tactile Beads along the Silk Cord */}
                  {slidingBeadCoords.map(({ i, isCounted, x, y }) => (
                    <motion.g
                      key={i}
                      animate={{ x, y }}
                      transition={{
                        type: 'spring',
                        stiffness: 320,
                        damping: 26,
                      }}
                    >
                      <circle
                        r={isCounted ? 9.5 : 8}
                        fill={isCounted ? 'url(#amberBeadGrad)' : 'url(#jadeBeadGrad)'}
                        stroke={isCounted ? '#FAF6EC' : '#B8924A'}
                        strokeOpacity={isCounted ? 0.75 : 0.45}
                        strokeWidth={isCounted ? 1.4 : 1}
                      />
                    </motion.g>
                  ))}
                </svg>

                {/* Subtle Matte-Gold Pulse Ring on Each Bead Slide */}
                <AnimatePresence>
                  <motion.span
                    key={pulseKey}
                    aria-hidden="true"
                    initial={{ scale: 0.75, opacity: 0.5 }}
                    animate={{ scale: 1.25, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="pointer-events-none absolute top-[18%] left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border border-[#D9B96A]"
                  />
                </AnimatePresence>
              </div>

              {/* Tactile Focal Dhikr & Matte Gold Counter Tap Area */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.985 }}
                onClick={incrementCounter}
                disabled={mode === 'zahra' && zahraInfo.completed}
                aria-label={
                  mode === 'zahra'
                    ? `تسبيح ${zahraInfo.phase.arabic}، العدد الحالي ${zahraInfo.countInPhase} من ${zahraInfo.phase.target}`
                    : `تسبيح ${activeOpenDhikrText}، العدد الحالي ${openCount}`
                }
                className={`relative z-10 w-full rounded-[6px] border p-5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B96A] ${
                  mode === 'zahra' && zahraInfo.completed
                    ? 'bg-[#0F3D2E] border-[#D9B96A] cursor-default'
                    : 'bg-[#0E2920]/90 hover:bg-[#133529] border-[#B8924A]/65 cursor-pointer'
                }`}
              >
                {mode === 'zahra' && zahraInfo.completed ? (
                  <div className="space-y-1.5 py-2">
                    <span className="block font-arabic font-bold text-2xl sm:text-3xl text-[#D9B96A]">
                      لَا إِلَهَ إِلَّا اللَّهُ
                    </span>
                    <span className="block font-display font-bold text-sm text-[#FAF6EC]">
                      أتممت تسبيح السيدة الزهراء (١٠٠ / ١٠٠)
                    </span>
                  </div>
                ) : (
                  <>
                    <div
                      className={`font-arabic font-bold leading-[1.6] ${
                        mode === 'zahra'
                          ? 'text-2xl sm:text-3xl text-[#FAF6EC]'
                          : activeOpenDhikrText.length > 34
                          ? 'text-lg sm:text-xl text-[#FAF6EC]'
                          : 'text-xl sm:text-2xl text-[#FAF6EC]'
                      }`}
                    >
                      {mode === 'zahra' ? zahraInfo.phase.arabic : activeOpenDhikrText}
                    </div>

                    <div className="mt-3 flex items-baseline justify-center gap-2 tabular-nums">
                      <span className="font-display font-bold text-5xl sm:text-6xl text-[#D9B96A] leading-none">
                        {toArabicDigits(mode === 'zahra' ? zahraInfo.countInPhase : openCount)}
                      </span>
                      {mode === 'zahra' ? (
                        <span className="text-base font-bold text-[#C8D8CE]">
                          / {toArabicDigits(zahraInfo.phase.target)}
                        </span>
                      ) : openTarget !== null ? (
                        <span className="text-base font-bold text-[#C8D8CE]">
                          / {toArabicDigits(openTarget)}
                        </span>
                      ) : null}
                    </div>

                    <span className="mt-3 inline-block text-xs font-medium text-[#C8B88A]">
                      المس هنا لتمرير حبة المسبحة · أو اضغط مسافة
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
                className="mt-5 w-full max-w-lg rounded-[6px] bg-[#0E2920] border border-[#D9B96A] p-4 text-center space-y-3"
              >
                <p className="font-display font-bold text-[#FAF6EC] text-base">
                  تقبّل اللهُ تسبيحَك! يُستحبّ ختمُ التسبيحِ بقول: «لَا إِلَهَ إِلَّا اللَّهُ»
                </p>
                {zahraStarAwardedToast && (
                  <p className="text-xs sm:text-sm font-bold text-[#D9B96A] flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>تقبّل الله طاعتك! سُجّل إتمام تسبيح الزهراء (ع)</span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  className="min-h-[42px] px-6 py-2 btn-gilded text-sm inline-flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  <span>ابدأ دورة تسبيح جديدة</span>
                </button>
              </motion.div>
            )}

            {/* Tactile Architectural Sanctuary Controls */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={mode === 'zahra' ? zahraStep === 0 : openCount === 0}
                className="min-h-[42px] px-4 py-2 rounded-[6px] bg-[#0E2920] hover:bg-[#143B2E] disabled:opacity-40 text-[#F3EBD6] border border-[#B8924A]/40 font-display font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Undo2 className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
                <span>تراجع (-١)</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={mode === 'zahra' ? zahraStep === 0 : openCount === 0}
                className="min-h-[42px] px-4 py-2 rounded-[6px] bg-[#0E2920] hover:bg-[#143B2E] disabled:opacity-40 text-[#F3EBD6] border border-[#B8924A]/40 font-display font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
                <span>تصفير</span>
              </button>

              <button
                type="button"
                onClick={() => setHapticEnabled((v) => !v)}
                className={`min-h-[42px] px-4 py-2 rounded-[6px] border font-display font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors ${
                  hapticEnabled
                    ? 'bg-[#143B2E] border-[#D9B96A] text-[#D9B96A]'
                    : 'bg-[#0E2920] border-[#B8924A]/30 text-[#9FB5AA]'
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
              <div className="manuscript-folio-dark rounded-[6px] p-6 sm:p-7 space-y-4">
                <div>
                  <p className="text-xs font-bold text-[#D9B96A]">
                    تعقيب الصلوات المبارك · ١٠٠ تسبيحة
                  </p>
                  <h2 className="font-calligraphy font-bold text-2xl sm:text-3xl text-[#FAF6EC] mt-1">
                    تسبيح السيدة فاطمة الزهراء (ع)
                  </h2>
                  <p className="text-sm text-[#C8D8CE]/90 mt-2 leading-relaxed">
                    الهدية النبوية التي علّمها رسولُ الله (ﷺ) لابنته السيدة الزهراء (عليها السلام)، وهي من أعظم الأذكار بعد كل صلاة وعند النوم.
                  </p>
                </div>

                <ManuscriptDivider variant="crescent" dark />

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-[#D9B96A] tabular-nums">
                    <span>التقدم الكلي في الدورة</span>
                    <span>{toArabicDigits(zahraStep)} / ١٠٠</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#05120E] border border-[#B8924A]/30 overflow-hidden">
                    <div
                      className="h-full bg-[#D9B96A] transition-all duration-200"
                      style={{ width: `${Math.min(100, zahraStep)}%` }}
                    />
                  </div>
                  <p className="text-sm text-[#F3EBD6]/90 pt-1 leading-relaxed">
                    <strong className="text-[#D9B96A]">معنى الذكر الحالي: </strong>
                    {zahraInfo.phase.meaning}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#B8924A]/25 flex items-center gap-2 text-xs sm:text-sm font-bold">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      isZahraRewarded ? 'text-[#D9B96A]' : 'text-[#347A61]'
                    }`}
                    aria-hidden="true"
                  />
                  <span className={isZahraRewarded ? 'text-[#D9B96A]' : 'text-[#C8D8CE]'}>
                    {isZahraRewarded
                      ? 'أتممت تسبيح السيدة الزهراء (ع) بحمد الله'
                      : 'أكمل ١٠٠ تسبيحة لإتمام الورد المبارك'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="manuscript-folio-dark rounded-[6px] p-5 sm:p-6 space-y-4">
                <div>
                  <h2 className="font-calligraphy font-bold text-2xl text-[#FAF6EC]">
                    أذكار المسبحة المفتوحة
                  </h2>
                  <p className="text-xs sm:text-sm text-[#C8D8CE]/85 mt-1">
                    {isCustomMode
                      ? 'ذكرٌ خاصٌّ من اختيارك يُحسب تلقائياً في سجلّك اليومي'
                      : activeOpenPreset.virtue}
                  </p>
                </div>

                <div className="divide-y divide-[#B8924A]/25 border border-[#B8924A]/35 rounded-[5px] overflow-hidden">
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
                        className={`w-full text-right px-4 py-3 transition-colors cursor-pointer flex items-center justify-between gap-2 border-r-[3px] ${
                          selected
                            ? 'bg-[#143B2E] border-r-[#D9B96A] text-[#FAF6EC]'
                            : 'bg-[#081A14]/60 hover:bg-[#0E2920] border-r-transparent text-[#F3EBD6]/85'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-arabic font-bold text-base sm:text-lg leading-snug truncate">
                            {preset.arabic}
                          </div>
                          <div className="text-xs text-[#C8B88A] mt-0.5">
                            {preset.shortTitle}
                          </div>
                        </div>
                        {selected && (
                          <CheckCircle2
                            className="w-4 h-4 text-[#D9B96A] shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMode(true);
                      setOpenCount(0);
                    }}
                    className={`w-full text-right px-4 py-3 transition-colors cursor-pointer flex items-center justify-between gap-2 border-r-[3px] ${
                      isCustomMode
                        ? 'bg-[#143B2E] border-r-[#D9B96A] text-[#FAF6EC]'
                        : 'bg-[#081A14]/60 hover:bg-[#0E2920] border-r-transparent text-[#F3EBD6]/85'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-[#D9B96A] shrink-0" aria-hidden="true" />
                      <span className="font-display font-bold text-sm">
                        كتابة ذكر مخصص
                      </span>
                    </div>
                    {isCustomMode && (
                      <CheckCircle2
                        className="w-4 h-4 text-[#D9B96A] shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </div>

                {isCustomMode && (
                  <div>
                    <label
                      htmlFor="custom-dhikr-input"
                      className="block text-xs font-bold text-[#D9B96A] mb-1.5"
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
                      className="w-full min-h-[42px] px-3.5 rounded-[5px] bg-[#05120E] border border-[#B8924A]/55 focus:border-[#D9B96A] focus:outline-none font-arabic text-lg text-[#FAF6EC] placeholder:text-[#425B51]"
                    />
                  </div>
                )}

                {/* Target Cycle Selector */}
                <div className="pt-3 border-t border-[#B8924A]/25">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#D9B96A] flex items-center gap-1.5">
                      <InfinityIcon className="w-4 h-4" aria-hidden="true" />
                      <span>هدف الدورة</span>
                    </span>
                    {openTarget !== null && openCount >= openTarget && (
                      <span className="text-xs font-bold text-[#D9B96A] tabular-nums">
                        أتممت {toArabicDigits(Math.floor(openCount / openTarget))} دورة
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
                          className={`min-h-[38px] rounded-[5px] font-display font-bold text-xs sm:text-sm border transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                            active
                              ? 'bg-[#B8924A] text-[#081A14] border-[#D9B96A]'
                              : 'bg-[#081A14] hover:bg-[#0E2920] text-[#F3EBD6] border-[#B8924A]/35'
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

            {/* 7-Day Daily Tasbih Ledger Stats */}
            <div className="manuscript-folio-dark rounded-[6px] p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display font-bold text-sm sm:text-base text-[#D9B96A]">
                  إحصائيات الذكر اليومية (٧ أيام)
                </h3>
                <span className="text-xs text-[#C8D8CE] tabular-nums">
                  الإجمالي الكلي: {toArabicDigits(persisted.totalCount)}
                </span>
              </div>

              {(() => {
                const days = Array.from({ length: 7 }, (_, i) => {
                  const offset = i - 6;
                  const key = getDateKeyOffset(offset);
                  const dObj = new Date();
                  dObj.setDate(dObj.getDate() + offset);
                  const dayLabel = dObj.toLocaleDateString('ar-IQ', { weekday: 'short' });
                  const count =
                    key === persisted.todayDate
                      ? persisted.todayCount
                      : persisted.dailyHistory[key] || 0;
                  return { key, dayLabel, count, isToday: offset === 0 };
                });
                const maxVal = Math.max(33, ...days.map((d) => d.count));
                const weeklySum = days.reduce((s, d) => s + d.count, 0);
                return (
                  <>
                    <div className="grid grid-cols-7 gap-2 items-end h-24 pt-2 border-b border-[#B8924A]/25 pb-2">
                      {days.map((d) => {
                        const pct = Math.max(6, Math.round((d.count / maxVal) * 100));
                        return (
                          <div
                            key={d.key}
                            className="flex flex-col items-center justify-end h-full gap-1"
                            title={`${d.dayLabel}: ${d.count}`}
                          >
                            <span className="text-[10px] font-bold text-[#C8D8CE] tabular-nums">
                              {d.count > 0 ? toArabicDigits(d.count) : '٠'}
                            </span>
                            <div
                              className={`w-full max-w-[26px] rounded-t-[3px] transition-all ${
                                d.isToday
                                  ? 'bg-[#D9B96A]'
                                  : d.count > 0
                                  ? 'bg-[#1F6B50]'
                                  : 'bg-[#0E2920]'
                              }`}
                              style={{ height: `${pct}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-center">
                      {days.map((d) => (
                        <span
                          key={d.key}
                          className={`text-[10px] font-bold ${
                            d.isToday ? 'text-[#D9B96A]' : 'text-[#9FB5AA]'
                          }`}
                        >
                          {d.dayLabel}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#C8D8CE]/90 pt-1 tabular-nums">
                      <span>حصيلة الأسبوع: {toArabicDigits(weeklySum)} تسبيحة</span>
                      <span>دورات الزهراء (ع): {toArabicDigits(persisted.zahraRounds)}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
