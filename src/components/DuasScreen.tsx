import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookHeart,
  CheckCircle2,
  Moon,
  Settings,
  Sun,
  Star,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from 'lucide-react';
import {
  ReadingFocusSettings,
  getReadingUnitClasses,
  splitIntoReadableLines,
  useReadingFocusTracker,
} from './ReadingFocusControls';
import { AudioReciterPlayer } from './AudioReciterPlayer';
import { ENTRY_AUDIO_TRACKS } from '../data/reciterAudio';
import { DUAS_LIST } from '../data/duas';
import { DuaItem } from '../types/game';

interface DuasScreenProps {
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

export const DuasScreen: React.FC<DuasScreenProps> = ({
  completedReadingIds,
  focusSettings,
  onOpenSettings,
  onCompleteReading,
  onBackHome,
  onSetLastRead,
}) => {
  const [activeCategory, setActiveCategory] = useState<'days' | 'daily'>('days');
  const [selectedDuaId, setSelectedDuaId] = useState<string>(DUAS_LIST[0].id);
  const [fontStep, setFontStep] = useState<number>(1);
  const [nightMode, setNightMode] = useState<boolean>(false);
  const [justAwarded, setJustAwarded] = useState<boolean>(false);
  const focusTrackerEnabled = focusSettings.enabled;
  const focusTheme = focusSettings.theme;
  const readerBodyRef = useRef<HTMLDivElement | null>(null);

  const filteredDuas = useMemo(
    () => DUAS_LIST.filter((d) => d.category === activeCategory),
    [activeCategory]
  );

  const activeDua: DuaItem =
    DUAS_LIST.find((d) => d.id === selectedDuaId) || filteredDuas[0];

  useEffect(() => {
    onSetLastRead?.('duas', activeDua.id, activeDua.title);
  }, [activeDua.id]);

  const splitParagraphs = useMemo(() => {
    let cursor = 0;
    return activeDua.arabicText.map((paragraph) =>
      splitIntoReadableLines(paragraph).map((text) => ({
        text,
        unitIdx: cursor++,
      }))
    );
  }, [activeDua]);

  const unitCount = useMemo(
    () => splitParagraphs.reduce((sum, p) => sum + p.length, 0),
    [splitParagraphs]
  );

  const { activeUnitIndex, setActiveUnitIndex } = useReadingFocusTracker({
    resetKey: activeDua.id,
    unitCount,
    enabled: focusTrackerEnabled,
    contentRef: readerBodyRef,
  });

  const isCompleted = completedReadingIds.includes(activeDua.id);
  const totalCompletedDuas = DUAS_LIST.filter((d) =>
    completedReadingIds.includes(d.id)
  ).length;

  const handleCategoryChange = (cat: 'days' | 'daily') => {
    setActiveCategory(cat);
    const first = DUAS_LIST.find((d) => d.category === cat);
    if (first) setSelectedDuaId(first.id);
    setJustAwarded(false);
  };

  const handleSelectDua = (duaId: string) => {
    setSelectedDuaId(duaId);
    setJustAwarded(false);
  };

  const handleFinishReading = () => {
    const awarded = onCompleteReading(activeDua.id);
    if (awarded) {
      setJustAwarded(true);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-10">
      {/* Header Bar */}
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
              <BookHeart className="w-7 h-7 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>رياض الأدعية</span>
            </h1>
            <p className="text-sm font-bold text-slate-600 mt-0.5 tabular-nums">
              أدعية مشكولة واضحة للأطفال · أتممت {totalCompletedDuas} من {DUAS_LIST.length}
            </p>
          </div>
        </div>

        {/* Reading Controls: Font Size + Night Mode */}
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

      {/* Category Switcher */}
      <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2.5 sm:gap-3 mb-5 sm:mb-6">
        <button
          type="button"
          onClick={() => handleCategoryChange('days')}
          className={`min-h-[46px] px-4 sm:px-6 py-2.5 rounded-2xl font-display font-extrabold text-sm sm:text-lg transition-all cursor-pointer border-2 ${
            activeCategory === 'days'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-900/15'
              : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          أدعية الأيام السبعة (٧)
        </button>

        <button
          type="button"
          onClick={() => handleCategoryChange('daily')}
          className={`min-h-[46px] px-4 sm:px-6 py-2.5 rounded-2xl font-display font-extrabold text-sm sm:text-lg transition-all cursor-pointer border-2 ${
            activeCategory === 'daily'
              ? 'bg-sky-600 text-white border-sky-700 shadow-md shadow-sky-900/15'
              : 'bg-white text-sky-900 border-sky-200 hover:bg-sky-50'
          }`}
        >
          أدعية المناسبات اليومية (٥)
        </button>
      </div>

      {/* Main Split Layout: Selector List + Reader Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Dua List Sidebar (Horizontal on mobile, Sidebar on desktop) */}
        <div className="lg:col-span-4 flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {filteredDuas.map((dua) => {
            const selected = dua.id === activeDua.id;
            const done = completedReadingIds.includes(dua.id);

            return (
              <button
                key={dua.id}
                type="button"
                onClick={() => handleSelectDua(dua.id)}
                className={`min-w-[205px] sm:min-w-[230px] lg:min-w-0 lg:w-full shrink-0 text-right p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2.5 sm:gap-3 ${
                  selected
                    ? 'bg-gradient-to-l from-emerald-50 to-amber-50/70 border-emerald-500 shadow-md'
                    : 'bg-white/90 border-emerald-100 hover:border-emerald-300 hover:bg-white'
                }`}
              >
                <div className="min-w-0">
                  <h2 className="font-display font-extrabold text-sm sm:text-lg text-slate-900 truncate">
                    {dua.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 truncate mt-0.5">
                    {dua.subtitle}
                  </p>
                </div>

                {done && (
                  <CheckCircle2
                    className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0"
                    aria-label="تمت قراءته"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Dua Reader Card */}
        <motion.div
          key={activeDua.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={`lg:col-span-8 rounded-3xl border-2 p-4 sm:p-8 shadow-xl transition-colors duration-300 ${
            nightMode
              ? 'bg-slate-900 border-amber-500/40 text-amber-50 shadow-slate-950/50'
              : 'bg-white/95 border-amber-200 text-slate-900 shadow-emerald-950/5'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-current/10">
            <div>
              <span
                className={`text-xs sm:text-sm font-bold ${
                  nightMode ? 'text-amber-300' : 'text-emerald-700'
                }`}
              >
                {activeDua.sourceNote}
              </span>
              <h2
                className={`font-display font-black text-2xl sm:text-3xl mt-1 ${
                  nightMode ? 'text-amber-200' : 'text-emerald-950'
                }`}
              >
                {activeDua.title}
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
                <span>مقروء</span>
              </span>
            )}
          </div>

          <AudioReciterPlayer
            mode="entry"
            entryId={activeDua.id}
            entryTitle={activeDua.title}
            tracks={ENTRY_AUDIO_TRACKS[activeDua.id] || []}
            nightMode={nightMode}
          />

          {/* Child-friendly Meaning Summary */}
          <div
            className={`mt-5 rounded-2xl p-4 border ${
              nightMode
                ? 'bg-slate-800/80 border-slate-700 text-sky-200'
                : 'bg-sky-50/90 border-sky-200 text-sky-950'
            }`}
          >
            <p className="font-display font-extrabold text-sm sm:text-base flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
              <span>معنى الدعاء باختصار:</span>
            </p>
            <p className="text-sm sm:text-base leading-relaxed">
              {activeDua.meaningSummary}
            </p>
          </div>

          {/* Vocalized Arabic Dua Text */}
          <div className="mt-6 space-y-5" ref={readerBodyRef}>
            {splitParagraphs.map((lines, idx) => (
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

          {/* Completion Toast */}
          {justAwarded && (
            <div className="mt-6 rounded-2xl bg-emerald-600 text-white p-4 font-display font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 shadow-md">
              <CheckCircle2 className="w-5 h-5 text-amber-200" aria-hidden="true" />
              <span>بارك الله فيك! تم تسجيل إتمام قراءة هذا الدعاء المبارك</span>
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
                <span>أتممت قراءة هذا الدعاء المبارك</span>
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
