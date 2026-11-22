import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Calendar,
  CheckCircle2,
  Lightbulb,
  Moon,
  Quote,
  Search,
  Star,
  Sun,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { MASOOMEEN_LIBRARY } from '../data/library';
import { StationIllustration } from './StationIllustration';
import {
  CornerOrnaments,
  ManuscriptDivider,
  StoriesLanternIcon,
} from './IslamicOrnaments';
import {
  isGlobalNightTheme,
  subscribeAppAppearance,
} from '../utils/appAppearance';

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
  'text-base sm:text-lg leading-[1.95]',
  'text-lg sm:text-xl leading-[2.05]',
  'text-xl sm:text-2xl leading-[2.15]',
];

const ARABIC_INDIC = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
function toArabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => ARABIC_INDIC[Number(d)] ?? d);
}

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
  const [nightMode, setNightMode] = useState<boolean>(isGlobalNightTheme);
  useEffect(() => {
    return subscribeAppAppearance((s) => setNightMode(s.colorTheme === 'night'));
  }, []);
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
    <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Masthead & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 mb-5 border-b border-[#B8924A]/35">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackHome}
            className="min-h-[42px] px-3.5 py-2 btn-manuscript text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <ArrowRight className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
            <span>الرئيسية</span>
          </button>

          <div>
            <h1 className="font-calligraphy font-bold text-2xl sm:text-3xl text-[#0F3D2E] flex items-center gap-2">
              <StoriesLanternIcon className="w-6 h-6 text-[#B8924A] shrink-0" />
              <span>مكتبة قصص أهل البيت (عليهم السلام)</span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#425B51] mt-0.5 tabular-nums">
              {toArabicDigits(totalStories)} قصة واقعية مصوّرة · أتممت {toArabicDigits(completedStoriesCount)} من {toArabicDigits(totalStories)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center bg-[#FAF6EC] border border-[#B8924A]/50 rounded-[6px] p-0.5">
            <button
              type="button"
              onClick={() => setFontStep((s) => Math.max(0, s - 1))}
              disabled={fontStep === 0}
              aria-label="تصغير الخط"
              className="min-h-[38px] min-w-[38px] px-2 hover:bg-[#F3ECDA] disabled:opacity-40 text-[#0F3D2E] font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="text-xs">أ-</span>
            </button>
            <span className="px-2.5 text-xs font-bold text-[#425B51] border-x border-[#B8924A]/30">
              الخط
            </span>
            <button
              type="button"
              onClick={() =>
                setFontStep((s) => Math.min(FONT_SIZE_STEPS.length - 1, s + 1))
              }
              disabled={fontStep === FONT_SIZE_STEPS.length - 1}
              aria-label="تكبير الخط"
              className="min-h-[38px] min-w-[38px] px-2 hover:bg-[#F3ECDA] disabled:opacity-40 text-[#0F3D2E] font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="text-xs">أ+</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setNightMode((prev) => !prev)}
            className={`min-h-[42px] px-3.5 py-2 rounded-[6px] border font-display font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              nightMode
                ? 'bg-[#081A14] text-[#D9B96A] border-[#D9B96A]/60 hover:bg-[#0E2920]'
                : 'btn-manuscript'
            }`}
          >
            {nightMode ? (
              <>
                <Sun className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
                <span>الوضع النهاري</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
                <span>المخطوط الليلي</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* 14 Ma'soomeen Index Ledger */}
        <div className="lg:col-span-4 flex lg:flex-col gap-2 lg:gap-0 lg:manuscript-folio lg:paper-grain lg:rounded-[6px] lg:divide-y lg:divide-[#B8924A]/20 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto pb-2 lg:pb-0 lg:max-h-[820px]">
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
                className={`min-w-[215px] lg:min-w-0 lg:w-full shrink-0 text-right px-3.5 py-3 transition-colors cursor-pointer flex items-center justify-between gap-2.5 border lg:border-0 lg:border-r-[3px] rounded-[5px] lg:rounded-none ${
                  selected
                    ? 'bg-[#F3ECDA] border-[#B8924A] lg:border-r-[#B8924A] text-[#0F3D2E]'
                    : 'bg-[#FAF6EC] border-[#B8924A]/35 lg:border-r-transparent hover:bg-[#F3ECDA]/55 text-[#11271F]'
                }`}
              >
                <div className="flex items-baseline gap-2.5 min-w-0">
                  <span className="font-arabic font-bold text-base text-[#9C7835] shrink-0 tabular-nums">
                    {toArabicDigits(masoom.orderNumber)}.
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display font-bold text-sm sm:text-base truncate">
                      {masoom.name}
                    </h2>
                    <p className="text-xs text-[#425B51] truncate mt-0.5">
                      {masoom.title}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold shrink-0 tabular-nums ${
                    masoomDoneCount === masoom.stories.length
                      ? 'text-[#1F6B50]'
                      : 'text-[#7A5420]'
                  }`}
                >
                  {toArabicDigits(masoomDoneCount)}/{toArabicDigits(masoom.stories.length)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Profile Banner + Story Directory + Illustrated Story Reader */}
        <div className="lg:col-span-8 space-y-5">
          {/* Deep Emerald Ma'soom Identity Placard */}
          <motion.section
            key={activeMasoom.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="relative rounded-[6px] bg-[#0F3D2E] text-[#FAF6EC] p-7 sm:p-8 border border-[#B8924A] shadow-lg"
          >
            <CornerOrnaments tone="dark" />

            <div className="pt-1">
              <p className="text-xs font-bold text-[#D9B96A] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>الولادة: {activeMasoom.birthInfo}</span>
              </p>
              <h2 className="font-calligraphy font-bold text-2xl sm:text-4xl mt-1 text-[#FAF6EC]">
                {activeMasoom.name}
              </h2>
              <p className="font-display font-bold text-[#D9B96A] text-sm sm:text-base mt-0.5">
                اللقب الأشهر: {activeMasoom.title}
              </p>
            </div>

            <p className="mt-3.5 text-[#FAF6EC]/90 text-sm sm:text-base leading-relaxed">
              {activeMasoom.summary}
            </p>

            <div className="mt-4 pt-3 border-t border-[#D9B96A]/25 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm font-medium text-[#D9B96A]">
              <span className="text-[#FAF6EC]">أبرز القيم:</span>
              {activeMasoom.keyValues.map((val, i) => (
                <React.Fragment key={val}>
                  <span>{val}</span>
                  {i < activeMasoom.keyValues.length - 1 && (
                    <span className="text-[#B8924A]/60" aria-hidden="true">·</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.section>

          {/* Searchable Story Ledger */}
          <section
            aria-label="فهرس القصص"
            className="manuscript-folio paper-grain rounded-[6px] p-4 sm:p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
              <h3 className="font-display font-bold text-base sm:text-lg text-[#0F3D2E] tabular-nums">
                فهرس القصص الواقعية ({toArabicDigits(activeMasoom.stories.length)} قصة)
              </h3>

              <div className="relative w-full sm:w-64">
                <Search
                  className="w-4 h-4 text-[#1F6B50] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالعنوان أو القيمة..."
                  aria-label="ابحث في قصص المعصوم"
                  className="w-full min-h-[38px] pr-9 pl-3 py-1 rounded-[5px] bg-[#F3ECDA]/65 focus:bg-[#FAF6EC] border border-[#B8924A]/45 focus:border-[#0F3D2E] text-sm text-[#11271F] placeholder:text-[#425B51]/70 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pl-1">
              {filteredStories.length === 0 ? (
                <p className="col-span-full text-center py-6 text-sm font-bold text-[#425B51]">
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
                      className={`text-right px-3 py-2.5 rounded-[5px] border transition-colors cursor-pointer flex items-start justify-between gap-2 ${
                        selected
                          ? 'bg-[#0F3D2E] border-[#B8924A] text-[#FAF6EC]'
                          : 'bg-[#F3ECDA]/45 hover:bg-[#F3ECDA] border-[#B8924A]/35 text-[#11271F]'
                      }`}
                    >
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span
                          className={`font-arabic font-bold text-sm shrink-0 tabular-nums ${
                            selected ? 'text-[#D9B96A]' : 'text-[#9C7835]'
                          }`}
                        >
                          {toArabicDigits(idx + 1)}.
                        </span>
                        <div className="min-w-0">
                          <p className="font-display font-bold text-sm line-clamp-1">
                            {story.title}
                          </p>
                          <p
                            className={`text-xs mt-0.5 ${
                              selected ? 'text-[#D9B96A]/90' : 'text-[#425B51]'
                            }`}
                          >
                            {story.valueTag}
                          </p>
                        </div>
                      </div>

                      {done ? (
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            selected ? 'text-[#D9B96A]' : 'text-[#1F6B50]'
                          }`}
                          aria-label="مقروءة"
                        />
                      ) : (
                        <span
                          className={`text-[11px] font-bold shrink-0 mt-0.5 tabular-nums ${
                            selected ? 'text-[#D9B96A]' : 'text-[#7A5420]'
                          }`}
                        >
                          +5 ★
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Illustrated Manuscript Story Folio */}
          <motion.article
            key={activeStory.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className={`rounded-[6px] overflow-hidden transition-colors duration-300 ${
              nightMode ? 'manuscript-folio-dark' : 'manuscript-folio paper-grain'
            }`}
          >
            <StationIllustration
              stationId={activeStory.sceneStationId}
              stageId={1}
              title={activeStory.title}
            />

            <div className="p-5 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#B8924A]/35">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={selectedStoryIdx === 0}
                    onClick={() => handleSelectStory(selectedStoryIdx - 1)}
                    className={`min-h-[38px] px-3 py-1 rounded-[5px] border font-display font-bold text-xs sm:text-sm flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-colors ${
                      nightMode
                        ? 'bg-[#081A14] border-[#B8924A]/45 text-[#D9B96A] hover:bg-[#143B2E]'
                        : 'btn-manuscript'
                    }`}
                  >
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    <span>السابقة</span>
                  </button>

                  <span
                    className={`text-xs sm:text-sm font-bold px-2 tabular-nums ${
                      nightMode ? 'text-[#C8B88A]' : 'text-[#425B51]'
                    }`}
                  >
                    القصة {toArabicDigits(selectedStoryIdx + 1)} من {toArabicDigits(activeMasoom.stories.length)}
                  </span>

                  <button
                    type="button"
                    disabled={selectedStoryIdx >= activeMasoom.stories.length - 1}
                    onClick={() => handleSelectStory(selectedStoryIdx + 1)}
                    className={`min-h-[38px] px-3 py-1 rounded-[5px] border font-display font-bold text-xs sm:text-sm flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-colors ${
                      nightMode
                        ? 'bg-[#081A14] border-[#B8924A]/45 text-[#D9B96A] hover:bg-[#143B2E]'
                        : 'btn-manuscript'
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
                      className={`min-h-[38px] px-3 py-1 rounded-[5px] border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isStoryBookmarked
                          ? nightMode
                            ? 'bg-[#D9B96A]/20 border-[#D9B96A] text-[#D9B96A]'
                            : 'bg-[#F3ECDA] border-[#B8924A] text-[#0F3D2E]'
                          : nightMode
                            ? 'bg-[#081A14] border-[#B8924A]/35 text-[#F3EBD6]/80'
                            : 'btn-manuscript'
                      }`}
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${isStoryBookmarked ? 'fill-current' : ''}`}
                        aria-hidden="true"
                      />
                      <span>{isStoryBookmarked ? 'في المفضلة' : 'حفظ'}</span>
                    </button>
                  )}

                  {isStoryCompleted && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold ${
                        nightMode ? 'text-[#D9B96A]' : 'text-[#1F6B50]'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>مقروءة</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="max-w-prose mx-auto mt-5">
                <span
                  className={`text-xs sm:text-sm font-bold ${
                    nightMode ? 'text-[#D9B96A]' : 'text-[#7A5420]'
                  }`}
                >
                  قيمة القصة: {activeStory.valueTag}
                </span>
                <h3
                  className={`font-calligraphy font-bold text-2xl sm:text-3xl mt-1 ${
                    nightMode ? 'text-[#FAF6EC]' : 'text-[#0F3D2E]'
                  }`}
                >
                  {activeStory.title}
                </h3>

                {/* Overview Note */}
                <div
                  className={`mt-5 rounded-[5px] p-4 border-r-[3px] border border-[#B8924A]/35 ${
                    nightMode
                      ? 'bg-[#081A14]/75 border-r-[#D9B96A] text-[#F3EBD6]'
                      : 'bg-[#F3ECDA]/65 border-r-[#B8924A] text-[#11271F]'
                  }`}
                >
                  <p
                    className={`font-display font-bold text-xs mb-1 ${
                      nightMode ? 'text-[#D9B96A]' : 'text-[#7A5420]'
                    }`}
                  >
                    نبذة عن القصة
                  </p>
                  <p className="text-sm sm:text-base leading-relaxed">
                    {activeStory.overview}
                  </p>
                </div>

                <ManuscriptDivider variant="flourish" dark={nightMode} />

                {/* Multi-paragraph Story Prose */}
                <div className="mt-4 space-y-4">
                  {activeStory.paragraphs.map((p, idx) => (
                    <p
                      key={idx}
                      className={`${FONT_SIZE_STEPS[fontStep]} ${
                        nightMode ? 'text-[#F3EBD6]' : 'text-[#11271F]'
                      }`}
                    >
                      {p}
                    </p>
                  ))}
                </div>

                {/* Wisdom & Practical Lesson Colophon */}
                <div
                  className={`mt-7 rounded-[5px] p-5 border space-y-3 ${
                    nightMode
                      ? 'bg-[#081A14]/85 border-[#D9B96A]/45 text-[#F3EBD6]'
                      : 'bg-[#F3ECDA]/75 border-[#B8924A]/50 text-[#11271F]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <Quote
                      className={`w-5 h-5 shrink-0 mt-1 ${
                        nightMode ? 'text-[#D9B96A]' : 'text-[#B8924A]'
                      }`}
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-display font-bold text-sm text-[#7A5420]">
                        <span className={nightMode ? 'text-[#D9B96A]' : ''}>
                          حكمة من القصة:
                        </span>
                      </p>
                      <p
                        className={`font-arabic font-bold text-lg sm:text-xl leading-relaxed mt-0.5 ${
                          nightMode ? 'text-[#FAF6EC]' : 'text-[#0F3D2E]'
                        }`}
                      >
                        «{activeStory.wisdom}»
                      </p>
                    </div>
                  </div>

                  <div
                    className={`pt-3 border-t flex items-start gap-2 text-sm sm:text-base font-medium ${
                      nightMode
                        ? 'border-[#D9B96A]/25 text-[#9ED3BA]'
                        : 'border-[#B8924A]/30 text-[#1F6B50]'
                    }`}
                  >
                    <Lightbulb className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>العبرة التطبيقية: {activeStory.lesson}</span>
                  </div>
                </div>

                {justAwardedId === activeStory.id && (
                  <div className="mt-5 rounded-[5px] bg-[#0F3D2E] border border-[#D9B96A] text-[#FAF6EC] p-3.5 font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2">
                    <Star className="w-5 h-5 fill-[#D9B96A] text-[#D9B96A]" aria-hidden="true" />
                    <span>ممتاز! أُضيفت +٥ نجوم نور إلى رصيدك!</span>
                  </div>
                )}

                <div className="mt-7 pt-5 border-t border-[#B8924A]/35 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3">
                  {isStoryCompleted ? (
                    <div
                      className={`flex items-center gap-2 font-display font-bold text-sm ${
                        nightMode ? 'text-[#D9B96A]' : 'text-[#1F6B50]'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                      <span>أتممت قراءة هذه القصة (+٥ نجوم نور)</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinishStory}
                      className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 btn-gilded text-base flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Star className="w-4 h-4 fill-current shrink-0" aria-hidden="true" />
                      <span>أتممت قراءة القصة (+٥ نجوم)</span>
                    </button>
                  )}

                  {selectedStoryIdx < activeMasoom.stories.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleSelectStory(selectedStoryIdx + 1)}
                      className="w-full sm:w-auto min-h-[44px] px-5 py-2 btn-emerald text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>اقرأ القصة التالية</span>
                      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.article>
        </div>
      </div>
    </main>
  );
};
