import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Calendar,
  CheckCircle2,
  Lightbulb,
  Moon,
  Quote,
  Search,
  Sparkles,
  Star,
  Sun,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { MASOOMEEN_LIBRARY } from '../data/library';
import { StationIllustration } from './StationIllustration';

interface LibraryScreenProps {
  completedReadingIds: string[];
  bookmarkedIds?: string[];
  initialStoryId?: string | null;
  onCompleteReading: (readingId: string) => boolean;
  onToggleBookmark?: (itemId: string) => void;
  onSetLastRead?: (section: string, itemId: string, title: string) => void;
  onBackHome: () => void;
}

const LIBRARY_LAST_KEY = 'rihlat_alnoor_stories_last_v1';

const FONT_SIZE_STEPS = [
  'text-base sm:text-lg leading-relaxed',
  'text-lg sm:text-xl leading-loose',
  'text-xl sm:text-2xl leading-[2.15]',
];

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  completedReadingIds,
  bookmarkedIds = [],
  initialStoryId = null,
  onCompleteReading,
  onToggleBookmark,
  onSetLastRead,
  onBackHome,
}) => {
  const initialSelection = useMemo(() => {
    if (initialStoryId) {
      for (const m of MASOOMEEN_LIBRARY) {
        const sIdx = m.stories.findIndex((s) => s.id === initialStoryId);
        if (sIdx !== -1) return { masoomId: m.id, storyIdx: sIdx };
      }
    }
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(LIBRARY_LAST_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { masoomId?: string; storyIdx?: number };
          const foundM = MASOOMEEN_LIBRARY.find((m) => m.id === parsed.masoomId);
          if (
            foundM &&
            typeof parsed.storyIdx === 'number' &&
            parsed.storyIdx >= 0 &&
            parsed.storyIdx < foundM.stories.length
          ) {
            return { masoomId: foundM.id, storyIdx: parsed.storyIdx };
          }
        }
      } catch {
        // Ignore storage errors
      }
    }
    return { masoomId: MASOOMEEN_LIBRARY[0].id, storyIdx: 0 };
  }, [initialStoryId]);

  const [selectedMasoomId, setSelectedMasoomId] = useState<string>(
    initialSelection.masoomId
  );
  const [selectedStoryIdx, setSelectedStoryIdx] = useState<number>(
    initialSelection.storyIdx
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fontStep, setFontStep] = useState<number>(1);
  const [nightMode, setNightMode] = useState<boolean>(false);
  const [justAwardedId, setJustAwardedId] = useState<string | null>(null);

  const activeMasoom =
    MASOOMEEN_LIBRARY.find((m) => m.id === selectedMasoomId) ||
    MASOOMEEN_LIBRARY[0];

  const activeStory =
    activeMasoom.stories[selectedStoryIdx] || activeMasoom.stories[0];

  useEffect(() => {
    try {
      window.localStorage.setItem(
        LIBRARY_LAST_KEY,
        JSON.stringify({ masoomId: activeMasoom.id, storyIdx: selectedStoryIdx })
      );
    } catch {
      // Ignore storage errors
    }
    onSetLastRead?.(
      'library',
      activeStory.id,
      `${activeMasoom.name}: ${activeStory.title}`
    );
  }, [activeMasoom.id, selectedStoryIdx, activeStory.id]);

  const filteredStories = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) {
      return activeMasoom.stories.map((story, idx) => ({ story, idx }));
    }
    return activeMasoom.stories
      .map((story, idx) => ({ story, idx }))
      .filter(
        ({ story }) =>
          story.title.includes(q) ||
          story.valueTag.includes(q) ||
          story.overview.includes(q)
      );
  }, [activeMasoom.stories, searchQuery]);

  const totalStories = MASOOMEEN_LIBRARY.reduce(
    (sum, m) => sum + m.stories.length,
    0
  );
  const completedStoriesCount = MASOOMEEN_LIBRARY.reduce(
    (sum, m) =>
      sum + m.stories.filter((s) => completedReadingIds.includes(s.id)).length,
    0
  );

  const isStoryCompleted = completedReadingIds.includes(activeStory.id);
  const isStoryBookmarked = bookmarkedIds.includes(activeStory.id);

  const handleSelectMasoom = (id: string) => {
    setSelectedMasoomId(id);
    setSelectedStoryIdx(0);
    setSearchQuery('');
    setJustAwardedId(null);
  };

  const handleSelectStory = (idx: number) => {
    setSelectedStoryIdx(idx);
    setJustAwardedId(null);
  };

  const handleFinishStory = () => {
    const awarded = onCompleteReading(activeStory.id);
    if (awarded) {
      setJustAwardedId(activeStory.id);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-10">
      {/* Header & Reader Controls */}
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
              <BookOpen className="w-7 h-7 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>مكتبة قصص أهل البيت (عليهم السلام)</span>
            </h1>
            <p className="text-sm font-bold text-slate-600 mt-0.5 tabular-nums">
              ٢١ قصة حقيقية طويلة لكل معصوم ({totalStories} قصة) · أتممت {completedStoriesCount} من {totalStories}
            </p>
          </div>
        </div>

        {/* Font Controls & Night Reading Mode */}
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* 14 Ma'soomeen Selector (Horizontal Swipeable on Mobile, Sidebar on Desktop) */}
        <div className="lg:col-span-4 flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto pb-2 lg:pb-0 lg:max-h-[840px] lg:pl-1">
          {MASOOMEEN_LIBRARY.map((masoom) => {
            const selected = masoom.id === activeMasoom.id;
            const masoomDoneCount = masoom.stories.filter((s) =>
              completedReadingIds.includes(s.id)
            ).length;

            return (
              <button
                key={masoom.id}
                type="button"
                onClick={() => handleSelectMasoom(masoom.id)}
                className={`min-w-[215px] sm:min-w-[235px] lg:min-w-0 lg:w-full shrink-0 text-right p-3 sm:p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2.5 sm:gap-3 ${
                  selected
                    ? 'bg-gradient-to-l from-emerald-50 to-amber-50/70 border-emerald-500 shadow-md'
                    : 'bg-white/90 border-emerald-100 hover:border-emerald-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <span
                    className={`w-9 h-9 rounded-xl font-display font-black text-sm flex items-center justify-center shrink-0 tabular-nums ${
                      selected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {masoom.orderNumber}
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display font-extrabold text-sm sm:text-base text-slate-900 truncate">
                      {masoom.name}
                    </h2>
                    <p className="text-xs text-slate-600 truncate mt-0.5">
                      {masoom.title}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-extrabold shrink-0 tabular-nums ${
                    masoomDoneCount === masoom.stories.length
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >
                  {masoomDoneCount}/{masoom.stories.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Profile Card + 21-Story Explorer + Long Illustrated Story Reader */}
        <div className="lg:col-span-8 space-y-5 sm:space-y-6">
          {/* Ma'soom Identity Card */}
          <motion.section
            key={activeMasoom.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl bg-gradient-to-l from-emerald-900 via-emerald-800 to-teal-800 text-white p-4 sm:p-7 border-2 border-amber-300/70 shadow-xl"
          >
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>الولادة: {activeMasoom.birthInfo}</span>
              </p>
              <h2 className="font-display font-black text-2xl sm:text-3xl mt-1">
                {activeMasoom.name}
              </h2>
              <p className="font-display font-bold text-amber-300 text-base sm:text-lg mt-0.5">
                اللقب الأشهر: {activeMasoom.title}
              </p>
            </div>

            <p className="mt-4 text-emerald-50 text-sm sm:text-base leading-relaxed">
              {activeMasoom.summary}
            </p>

            {/* Unboxed Key Values Strip */}
            <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm font-bold text-amber-200">
              <span className="text-white/90">أبرز القيم:</span>
              {activeMasoom.keyValues.map((val, i) => (
                <React.Fragment key={val}>
                  <span>{val}</span>
                  {i < activeMasoom.keyValues.length - 1 && (
                    <span className="text-white/40" aria-hidden="true">
                      ·
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.section>

          {/* Searchable Shelf of the 21+ Stories */}
          <section
            aria-label="فهرس القصص"
            className="rounded-3xl bg-white/95 border-2 border-emerald-200 p-4 sm:p-5 shadow-md"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
              <h3 className="font-display font-black text-lg text-emerald-950 tabular-nums">
                فهرس القصص الواقعية ({activeMasoom.stories.length} قصة)
              </h3>

              <div className="relative w-full sm:w-64">
                <Search
                  className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالعنوان أو القيمة..."
                  aria-label="ابحث في قصص المعصوم"
                  className="w-full min-h-[40px] pr-9 pl-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pl-1">
              {filteredStories.length === 0 ? (
                <p className="col-span-full text-center py-6 text-sm font-bold text-slate-500">
                  لا توجد قصة مطابقة لكلمة البحث «{searchQuery}»
                </p>
              ) : (
                filteredStories.map(({ story, idx }) => {
                  const selected = idx === selectedStoryIdx;
                  const done = completedReadingIds.includes(story.id);
                  return (
                    <button
                      key={story.id}
                      type="button"
                      onClick={() => handleSelectStory(idx)}
                      className={`text-right p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                        selected
                          ? 'bg-gradient-to-l from-amber-50 to-emerald-50 border-amber-400 shadow-sm'
                          : 'bg-slate-50/70 hover:bg-white border-emerald-100 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-lg font-display font-black text-xs flex items-center justify-center shrink-0 mt-0.5 tabular-nums ${
                            selected
                              ? 'bg-amber-500 text-amber-950'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-display font-extrabold text-sm text-slate-900 line-clamp-1">
                            {story.title}
                          </p>
                          <p className="text-xs font-bold text-emerald-700 mt-0.5">
                            {story.valueTag}
                          </p>
                        </div>
                      </div>

                      {done ? (
                        <CheckCircle2
                          className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
                          aria-label="مقروءة"
                        />
                      ) : (
                        <span className="text-[11px] font-extrabold text-amber-700 shrink-0 mt-0.5 tabular-nums">
                          +5 ★
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Illustrated Long Story Card (Strictly Luminous No-Face Artwork) */}
          <motion.article
            key={activeStory.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`rounded-3xl border-2 shadow-xl overflow-hidden transition-colors duration-300 ${
              nightMode
                ? 'bg-slate-900 border-amber-500/40 text-amber-50 shadow-slate-950/50'
                : 'bg-white/95 border-emerald-200 text-slate-900 shadow-emerald-950/5'
            }`}
          >
            {/* Luminous Illustration Above Story */}
            <StationIllustration
              stationId={activeStory.sceneStationId}
              stageId={1}
              title={activeStory.title}
            />

            <div className="p-4 sm:p-8">
              {/* Top Story Step Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-current/10">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={selectedStoryIdx === 0}
                    onClick={() => handleSelectStory(selectedStoryIdx - 1)}
                    className={`min-h-[40px] px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1 border cursor-pointer disabled:opacity-40 transition-colors ${
                      nightMode
                        ? 'bg-slate-800 border-slate-700 text-amber-200 hover:bg-slate-700'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                    }`}
                  >
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    <span>السابقة</span>
                  </button>

                  <span
                    className={`text-xs sm:text-sm font-extrabold px-2 tabular-nums ${
                      nightMode ? 'text-sky-300' : 'text-sky-700'
                    }`}
                  >
                    القصة {selectedStoryIdx + 1} من {activeMasoom.stories.length}
                  </span>

                  <button
                    type="button"
                    disabled={selectedStoryIdx >= activeMasoom.stories.length - 1}
                    onClick={() => handleSelectStory(selectedStoryIdx + 1)}
                    className={`min-h-[40px] px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1 border cursor-pointer disabled:opacity-40 transition-colors ${
                      nightMode
                        ? 'bg-slate-800 border-slate-700 text-amber-200 hover:bg-slate-700'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                    }`}
                  >
                    <span>التالية</span>
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {onToggleBookmark && (
                    <button
                      type="button"
                      onClick={() => onToggleBookmark(activeStory.id)}
                      aria-label={isStoryBookmarked ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isStoryBookmarked
                          ? nightMode
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-amber-50 border-amber-400 text-amber-800'
                          : nightMode
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-amber-300'
                            : 'bg-white border-emerald-200 text-slate-700 hover:bg-amber-50'
                      }`}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${isStoryBookmarked ? 'fill-current' : ''}`}
                        aria-hidden="true"
                      />
                      <span>{isStoryBookmarked ? 'في المفضلة' : 'حفظ'}</span>
                    </button>
                  )}

                  {isStoryCompleted && (
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
              </div>

              {/* Story Title */}
              <div className="mt-5">
                <span
                  className={`text-xs sm:text-sm font-extrabold ${
                    nightMode ? 'text-amber-300' : 'text-amber-700'
                  }`}
                >
                  قيمة القصة: {activeStory.valueTag}
                </span>
                <h3
                  className={`font-display font-black text-2xl sm:text-3xl mt-1 ${
                    nightMode ? 'text-amber-200' : 'text-emerald-950'
                  }`}
                >
                  {activeStory.title}
                </h3>
              </div>

              {/* Overview Card (نبذة عن القصة) */}
              <div
                className={`mt-5 rounded-2xl p-4 border ${
                  nightMode
                    ? 'bg-slate-800/85 border-slate-700 text-sky-200'
                    : 'bg-sky-50/90 border-sky-200 text-sky-950'
                }`}
              >
                <p className="font-display font-extrabold text-sm sm:text-base flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
                  <span>نبذة عن القصة:</span>
                </p>
                <p className="text-sm sm:text-base leading-relaxed">
                  {activeStory.overview}
                </p>
              </div>

              {/* Full Multi-paragraph Realistic Story */}
              <div className="mt-6 space-y-4">
                {activeStory.paragraphs.map((p, idx) => (
                  <p
                    key={idx}
                    className={`${FONT_SIZE_STEPS[fontStep]} ${
                      nightMode ? 'text-amber-50/95' : 'text-slate-800'
                    }`}
                  >
                    {p}
                  </p>
                ))}
              </div>

              {/* Dedicated Wisdom & Educational Lesson Box (حكمة من القصة + العبرة) */}
              <div
                className={`mt-7 rounded-2xl p-5 border-2 space-y-3 ${
                  nightMode
                    ? 'bg-slate-800/90 border-amber-500/40 text-amber-100'
                    : 'bg-amber-50/90 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <Quote
                    className="w-5 h-5 text-amber-500 shrink-0 mt-1"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-display font-black text-base sm:text-lg">
                      حكمة من القصة:
                    </p>
                    <p className="font-display font-bold text-base sm:text-lg leading-relaxed mt-0.5">
                      «{activeStory.wisdom}»
                    </p>
                  </div>
                </div>

                <div
                  className={`pt-3 border-t flex items-start gap-2.5 text-sm sm:text-base font-bold ${
                    nightMode
                      ? 'border-slate-700 text-emerald-300'
                      : 'border-amber-200/80 text-emerald-900'
                  }`}
                >
                  <Lightbulb
                    className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>العبرة التطبيقية: {activeStory.lesson}</span>
                </div>
              </div>

              {justAwardedId === activeStory.id && (
                <div className="mt-5 rounded-2xl bg-emerald-600 text-white p-4 font-display font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 shadow-md">
                  <Star className="w-5 h-5 fill-amber-300 text-amber-300" aria-hidden="true" />
                  <span>ممتاز! أُضيفت +5 نجوم نور إلى رصيدك!</span>
                </div>
              )}

              {/* Completion CTA + Next Story Shortcut */}
              <div className="mt-6 pt-5 border-t border-current/10 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                {isStoryCompleted ? (
                  <div
                    className={`flex items-center gap-2 font-bold text-sm sm:text-base ${
                      nightMode ? 'text-emerald-300' : 'text-emerald-700'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span>أتممت قراءة هذه القصة وحصلت على +5 نجوم نور</span>
                  </div>
                ) : (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFinishStory}
                    className="w-full sm:w-auto min-h-[54px] px-6 sm:px-7 py-3 rounded-2xl bg-gradient-to-l from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-amber-950 font-display font-black text-base sm:text-lg shadow-lg flex items-center justify-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Star className="w-5 h-5 fill-white text-white shrink-0" aria-hidden="true" />
                    <span>أتممت قراءة القصة (+5 نجوم نور)</span>
                  </motion.button>
                )}

                {selectedStoryIdx < activeMasoom.stories.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleSelectStory(selectedStoryIdx + 1)}
                    className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-base flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>اقرأ القصة التالية</span>
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </motion.article>
        </div>
      </div>
    </main>
  );
};
