import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Lightbulb,
  Moon,
  Settings,
  Sparkles,
  Star,
  Sun,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  ReadingFocusSettings,
  getReadingUnitClasses,
  splitIntoReadableLines,
  useReadingFocusTracker,
} from './ReadingFocusControls';
import { AudioReciterPlayer } from './AudioReciterPlayer';
import { ENTRY_AUDIO_TRACKS } from '../data/reciterAudio';
import { MUNAJAT_LIST } from '../data/munajat';
import { MunajatItem } from '../types/game';

interface MunajatScreenProps {
  completedReadingIds: string[];
  focusSettings: ReadingFocusSettings;
  onOpenSettings: () => void;
  onCompleteReading: (readingId: string) => boolean;
  onBackHome: () => void;
  onSetLastRead?: (section: string, itemId: string, title: string) => void;
}

const FONT_SIZE_STEPS = [
  'text-lg sm:text-xl leading-loose',
  'text-xl sm:text-2xl leading-[2.2]',
  'text-2xl sm:text-3xl leading-[2.3]',
  'text-3xl sm:text-4xl leading-[2.35]',
];

export const MunajatScreen: React.FC<MunajatScreenProps> = ({
  completedReadingIds,
  focusSettings,
  onOpenSettings,
  onCompleteReading,
  onBackHome,
  onSetLastRead,
}) => {
  const [selectedId, setSelectedId] = useState<string>(MUNAJAT_LIST[0].id);
  const [fontStep, setFontStep] = useState<number>(1);
  const [nightMode, setNightMode] = useState<boolean>(false);
  const [justAwarded, setJustAwarded] = useState<boolean>(false);
  const focusTrackerEnabled = focusSettings.enabled;
  const focusTheme = focusSettings.theme;
  const readerBodyRef = useRef<HTMLDivElement | null>(null);

  const activeMunajat: MunajatItem =
    MUNAJAT_LIST.find((m) => m.id === selectedId) || MUNAJAT_LIST[0];

  useEffect(() => {
    onSetLastRead?.('munajat', activeMunajat.id, activeMunajat.title);
  }, [activeMunajat.id]);

  const splitVerses = useMemo(() => {
    let cursor = 0;
    return activeMunajat.verses.map((verse) =>
      splitIntoReadableLines(verse).map((text) => ({
        text,
        unitIdx: cursor++,
      }))
    );
  }, [activeMunajat]);

  const unitCount = useMemo(
    () => splitVerses.reduce((sum, p) => sum + p.length, 0),
    [splitVerses]
  );

  const { activeUnitIndex, setActiveUnitIndex } = useReadingFocusTracker({
    resetKey: activeMunajat.id,
    unitCount,
    enabled: focusTrackerEnabled,
    contentRef: readerBodyRef,
  });

  const isCompleted = completedReadingIds.includes(activeMunajat.id);
  const completedCount = MUNAJAT_LIST.filter((m) =>
    completedReadingIds.includes(m.id)
  ).length;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setJustAwarded(false);
  };

  const handleFinishReading = () => {
    const awarded = onCompleteReading(activeMunajat.id);
    if (awarded) {
      setJustAwarded(true);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 mb-5 sm:mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackHome}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-sm flex items-center gap-2 shadow-xs cursor-pointer transition-colors whitespace-nowrap"
          >
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
            <span>الرئيسية</span>
          </button>

          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-emerald-900 flex items-center gap-2">
              <Heart className="w-7 h-7 text-amber-500 fill-amber-400 shrink-0" aria-hidden="true" />
              <span>همسات المناجاة</span>
            </h1>
            <p className="text-sm font-bold text-slate-600 mt-0.5 tabular-nums">
              المناجاة الخمس عشرة للإمام زين العابدين (عليه السلام) · {completedCount} من {MUNAJAT_LIST.length}
            </p>
          </div>
        </div>

        {/* Font & Night Mode Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center bg-white border border-emerald-200 rounded-xl p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setFontStep((s) => Math.max(0, s - 1))}
              disabled={fontStep === 0}
              aria-label="تصغير الخط"
              className="min-h-[40px] min-w-[40px] px-2.5 rounded-lg hover:bg-emerald-50 disabled:opacity-40 text-emerald-900 font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs">أ-</span>
            </button>
            <span className="px-2 text-xs font-bold text-slate-500 border-x border-emerald-100">
              حجم الخط
            </span>
            <button
              type="button"
              onClick={() =>
                setFontStep((s) => Math.min(FONT_SIZE_STEPS.length - 1, s + 1))
              }
              disabled={fontStep === FONT_SIZE_STEPS.length - 1}
              aria-label="تكبير الخط"
              className="min-h-[40px] min-w-[40px] px-2.5 rounded-lg hover:bg-emerald-50 disabled:opacity-40 text-emerald-900 font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs">أ+</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setNightMode((prev) => !prev)}
            className={`min-h-[44px] px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 border shadow-xs cursor-pointer transition-colors whitespace-nowrap ${
              nightMode
                ? 'bg-slate-900 text-amber-300 border-amber-400/60 hover:bg-slate-800'
                : 'bg-white text-slate-800 border-emerald-200 hover:bg-sky-50'
            }`}
          >
            {nightMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-300" aria-hidden="true" />
                <span>الوضع النهاري</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-sky-600" aria-hidden="true" />
                <span>الوضع الليلي المريح</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="إعدادات ألوان تغميق السطر"
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-sm flex items-center gap-2 shadow-xs cursor-pointer transition-colors whitespace-nowrap"
          >
            <Settings className="w-4 h-4 text-emerald-700" aria-hidden="true" />
            <span>الإعدادات</span>
          </button>
        </div>
      </div>

      {/* 15 Munajat Cards Strip / Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        <div className="lg:col-span-4 flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto pb-2 lg:pb-0 lg:max-h-[640px] lg:pl-1">
          {MUNAJAT_LIST.map((item) => {
            const selected = item.id === activeMunajat.id;
            const done = completedReadingIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`min-w-[215px] sm:min-w-[235px] lg:min-w-0 lg:w-full shrink-0 text-right p-3 sm:p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                  selected
                    ? 'bg-gradient-to-l from-sky-50 to-amber-50/70 border-sky-500 shadow-md'
                    : 'bg-white/90 border-emerald-100 hover:border-sky-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <span
                    className={`w-9 h-9 rounded-xl font-display font-black text-sm flex items-center justify-center shrink-0 tabular-nums ${
                      selected
                        ? 'bg-sky-600 text-white'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    {item.number}
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display font-extrabold text-sm sm:text-base text-slate-900 truncate">
                      {item.title}
                    </h2>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                      {item.quickMeaning}
                    </p>
                  </div>
                </div>

                {done && (
                  <CheckCircle2
                    className="w-5 h-5 text-emerald-600 shrink-0"
                    aria-label="مقروءة"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Munajat Reader */}
        <motion.div
          key={activeMunajat.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={`lg:col-span-8 rounded-3xl border-2 p-4 sm:p-8 shadow-xl transition-colors duration-300 ${
            nightMode
              ? 'bg-slate-900 border-sky-400/40 text-amber-50 shadow-slate-950/50'
              : 'bg-white/95 border-sky-200 text-slate-900 shadow-sky-950/5'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-current/10">
            <div>
              <p
                className={`text-xs sm:text-sm font-bold ${
                  nightMode ? 'text-sky-300' : 'text-sky-700'
                }`}
              >
                المناجاة رقم {activeMunajat.number} من ١٥ — الإمام زين العابدين (عليه السلام)
              </p>
              <h2
                className={`font-display font-black text-2xl sm:text-3xl mt-1 ${
                  nightMode ? 'text-amber-200' : 'text-emerald-950'
                }`}
              >
                {activeMunajat.title}
              </h2>
            </div>

            {isCompleted && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm ${
                  nightMode
                    ? 'bg-emerald-900/70 text-emerald-300 border border-emerald-700'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>مقروءة</span>
              </span>
            )}
          </div>

          <AudioReciterPlayer
            mode="entry"
            entryId={activeMunajat.id}
            entryTitle={activeMunajat.title}
            tracks={ENTRY_AUDIO_TRACKS[activeMunajat.id] || []}
            nightMode={nightMode}
          />

          {/* Quick Meaning Card before the Munajat */}
          <div
            className={`mt-5 rounded-2xl p-4 sm:p-5 border-2 space-y-2.5 ${
              nightMode
                ? 'bg-slate-800/85 border-amber-500/30 text-amber-100'
                : 'bg-gradient-to-l from-amber-50/90 to-emerald-50/80 border-amber-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 font-display font-extrabold text-base sm:text-lg">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0" aria-hidden="true" />
              <span>بطاقة المعنى السريع للطفل</span>
            </div>
            <p className="text-sm sm:text-base leading-relaxed">
              {activeMunajat.quickMeaning}
            </p>
            <div
              className={`pt-2 border-t flex items-start gap-2 text-sm font-bold ${
                nightMode
                  ? 'border-slate-700 text-sky-300'
                  : 'border-amber-200/70 text-emerald-800'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
              <span>العبرة: {activeMunajat.lifeLesson}</span>
            </div>
          </div>

          {/* Munajat Verses */}
          <div className="mt-6 space-y-5" ref={readerBodyRef}>
            {splitVerses.map((lines, idx) => (
              <p
                key={idx}
                className={`font-display font-bold whitespace-pre-line transition-all ${
                  FONT_SIZE_STEPS[fontStep]
                } ${nightMode ? 'text-amber-50' : 'text-slate-900'}`}
              >
                {lines.map(({ text, unitIdx }) => {
                  const trailingNewlinesMatch = text.match(/\n+$/);
                  const visibleChunk = trailingNewlinesMatch
                    ? text.slice(0, text.length - trailingNewlinesMatch[0].length)
                    : text;
                  const trailingBreaks = trailingNewlinesMatch
                    ? trailingNewlinesMatch[0]
                    : '';
                  const isActive =
                    focusTrackerEnabled && activeUnitIndex === unitIdx;

                  return (
                    <React.Fragment key={unitIdx}>
                      <span
                        data-reading-unit-index={unitIdx}
                        onMouseEnter={() => {
                          if (focusTrackerEnabled) setActiveUnitIndex(unitIdx);
                        }}
                        onClick={() => {
                          if (!focusTrackerEnabled) return;
                          const sel = window.getSelection()?.toString();
                          if (sel && sel.trim().length > 0) return;
                          setActiveUnitIndex(unitIdx);
                        }}
                        className={getReadingUnitClasses({
                          isActive,
                          enabled: focusTrackerEnabled,
                          nightMode,
                          theme: focusTheme,
                        })}
                      >
                        {visibleChunk}
                      </span>
                      {trailingBreaks}
                    </React.Fragment>
                  );
                })}
              </p>
            ))}
          </div>

          {justAwarded && (
            <div className="mt-6 rounded-2xl bg-emerald-600 text-white p-4 font-display font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 shadow-md">
              <CheckCircle2 className="w-5 h-5 text-amber-200" aria-hidden="true" />
              <span>بارك الله فيك! تم تسجيل إتمام قراءة هذه المناجاة</span>
            </div>
          )}

          {/* Completion CTA */}
          <div className="mt-7 pt-5 border-t border-current/10 flex flex-wrap items-center justify-between gap-4">
            {isCompleted ? (
              <div
                className={`flex items-center gap-2 font-bold text-base ${
                  nightMode ? 'text-emerald-300' : 'text-emerald-700'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                <span>أتممت قراءة هذه المناجاة المباركة</span>
              </div>
            ) : (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFinishReading}
                className="w-full sm:w-auto min-h-[54px] px-7 py-3 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-display font-black text-lg shadow-lg flex items-center justify-center gap-2.5 cursor-pointer transition-colors"
              >
                <CheckCircle2 className="w-5 h-5 text-amber-200" aria-hidden="true" />
                <span>أتممت القراءة</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
};
