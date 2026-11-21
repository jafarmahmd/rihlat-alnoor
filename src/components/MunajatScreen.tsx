import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Moon,
  ScrollText,
  Search,
  Share2,
  Sun,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ShareCardModal, ShareCardPayload } from './ShareCardModal';
import {
  ReadingFocusSettings,
  getReadingUnitClasses,
  getSavedReadingPosition,
  saveReadingPositionForKey,
  splitIntoReadableLines,
  useReadingFocusTracker,
} from './ReadingFocusControls';
import { ManuscriptBookFlip, ManuscriptBookPage } from './ManuscriptBookFlip';
import {
  ReaderViewMode,
  loadReaderViewMode,
  paginateProseBlocks,
  saveReaderViewMode,
  toArabicDigits,
} from '../utils/bookPagination';
import { AudioReciterPlayer } from './AudioReciterPlayer';
import { ENTRY_AUDIO_TRACKS } from '../data/reciterAudio';
import { MUNAJAT_LIST } from '../data/munajat';
import { MunajatItem } from '../types/game';
import { registerHardwareBackHandler } from '../utils/hardwareBack';
import {
  isGlobalNightTheme,
  subscribeAppAppearance,
} from '../utils/appAppearance';
import {
  AstrolabeIcon,
  ManuscriptCornerBracket,
  ManuscriptDivider,
  MunajatMoonIcon,
} from './IslamicOrnaments';

interface MunajatScreenProps {
  completedReadingIds: string[];
  bookmarkedIds?: string[];
  focusSettings: ReadingFocusSettings;
  onOpenSettings: () => void;
  onCompleteReading: (readingId: string) => boolean;
  onToggleBookmark?: (itemId: string) => void;
  onBackHome: () => void;
  onSetLastRead?: (section: string, itemId: string, title: string) => void;
}

const FONT_SIZE_STEPS = [
  'text-lg sm:text-xl leading-loose',
  'text-xl sm:text-2xl leading-[2.3]',
  'text-2xl sm:text-3xl leading-[2.35]',
  'text-3xl sm:text-4xl leading-[2.4]',
];

const FONT_PIXEL_VALUES = [18, 22, 26, 30];

function normalizeArabicTitle(input: string): string {
  return input
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim()
    .toLowerCase();
}

export const MunajatScreen: React.FC<MunajatScreenProps> = ({
  completedReadingIds,
  bookmarkedIds = [],
  focusSettings,
  onOpenSettings,
  onCompleteReading,
  onToggleBookmark,
  onBackHome,
  onSetLastRead,
}) => {
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fontStep, setFontStep] = useState<number>(1);
  const [nightMode, setNightMode] = useState<boolean>(isGlobalNightTheme);
  useEffect(() => {
    return subscribeAppAppearance((s) => setNightMode(s.colorTheme === 'night'));
  }, []);
  const [viewMode, setViewMode] = useState<ReaderViewMode>(() => loadReaderViewMode());
  const [bookPage, setBookPage] = useState<number>(0);
  const [justAwarded, setJustAwarded] = useState<boolean>(false);
  const [sharePayload, setSharePayload] = useState<ShareCardPayload | null>(null);
  const focusTrackerEnabled = focusSettings.enabled;
  const focusTheme = focusSettings.theme;
  const readerBodyRef = useRef<HTMLDivElement | null>(null);
  const listScrollYRef = useRef<number>(0);

  const normalizedQuery = useMemo(
    () => normalizeArabicTitle(searchQuery),
    [searchQuery]
  );

  const visibleMunajat = useMemo(() => {
    if (!normalizedQuery) return MUNAJAT_LIST;
    return MUNAJAT_LIST.filter((m) =>
      normalizeArabicTitle(m.title).includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  const activeMunajat: MunajatItem | null = useMemo(() => {
    if (!openedId) return null;
    return MUNAJAT_LIST.find((m) => m.id === openedId) || null;
  }, [openedId]);

  useEffect(() => {
    if (!activeMunajat) return;
    onSetLastRead?.('munajat', activeMunajat.id, activeMunajat.title);
  }, [activeMunajat?.id]);

  const handleOpenMunajat = (id: string) => {
    listScrollYRef.current = typeof window !== 'undefined' ? window.scrollY : 0;
    setOpenedId(id);
    setJustAwarded(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const handleBackToList = () => {
    const restoreY = listScrollYRef.current;
    setOpenedId(null);
    setJustAwarded(false);
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        window.scrollTo({ top: restoreY, behavior: 'auto' });
        requestAnimationFrame(() => {
          window.scrollTo({ top: restoreY, behavior: 'auto' });
        });
      });
    }
  };

  useEffect(() => {
    return registerHardwareBackHandler(() => {
      if (sharePayload) {
        setSharePayload(null);
        return true;
      }
      if (openedId) {
        handleBackToList();
        return true;
      }
      return false;
    });
  }, [sharePayload, openedId]);

  const splitVerses = useMemo(() => {
    if (!activeMunajat) return [];
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
    resetKey: activeMunajat?.id || 'munajat-list',
    unitCount,
    enabled: Boolean(activeMunajat) && focusTrackerEnabled && viewMode === 'scroll',
    contentRef: readerBodyRef,
  });

  const handleChangeViewMode = (mode: ReaderViewMode) => {
    setViewMode(mode);
    saveReaderViewMode(mode);
  };

  const paginatedVerses = useMemo(() => {
    if (!activeMunajat) return [];
    const blocks = splitVerses.map((lines, idx) => ({
      id: idx,
      lines,
      textLength: lines.reduce((sum, l) => sum + l.text.length, 0),
      unitIndices: lines.map((l) => l.unitIdx),
    }));
    return paginateProseBlocks(
      blocks,
      FONT_PIXEL_VALUES[fontStep] ?? 22,
      true
    );
  }, [activeMunajat, splitVerses, fontStep]);

  useEffect(() => {
    if (!activeMunajat) return;
    const savedUnit = getSavedReadingPosition(activeMunajat.id);
    if (savedUnit > 0 && paginatedVerses.length > 0) {
      const targetIdx = paginatedVerses.findIndex((page) =>
        page.items.some((item) => item.unitIndices.includes(savedUnit))
      );
      setBookPage(targetIdx >= 0 ? targetIdx : 0);
    } else {
      setBookPage(0);
    }
  }, [activeMunajat?.id]);

  useEffect(() => {
    if (paginatedVerses.length > 0 && bookPage >= paginatedVerses.length) {
      setBookPage(Math.max(0, paginatedVerses.length - 1));
    }
  }, [paginatedVerses.length, bookPage]);

  const handleBookPageChange = (nextPage: number) => {
    setBookPage(nextPage);
    if (!activeMunajat) return;
    const slice = paginatedVerses[nextPage];
    const firstUnit = slice?.items.find((it) => it.unitIndices.length > 0)?.unitIndices[0];
    if (typeof firstUnit === 'number') {
      saveReadingPositionForKey(activeMunajat.id, firstUnit);
    }
  };

  const completedCount = MUNAJAT_LIST.filter((m) =>
    completedReadingIds.includes(m.id)
  ).length;
  const isCompleted = activeMunajat
    ? completedReadingIds.includes(activeMunajat.id)
    : false;
  const isBookmarked = activeMunajat
    ? bookmarkedIds.includes(activeMunajat.id)
    : false;

  const handleFinishReading = () => {
    if (!activeMunajat) return;
    const awarded = onCompleteReading(activeMunajat.id);
    if (awarded) {
      setJustAwarded(true);
    }
  };

  const handleOpenShareCard = () => {
    if (!activeMunajat) return;
    const quote =
      activeMunajat.verses.find((v, i) => i > 0 || !v.includes('بِسْمِ اللَّهِ')) ||
      activeMunajat.verses[0] ||
      activeMunajat.quickMeaning;
    setSharePayload({
      title: activeMunajat.title,
      category: 'المناجاة الخمس عشرة · الصحيفة السجادية',
      quote,
      attribution: `الإمام علي بن الحسين زين العابدين (عليه السلام) · المناجاة ${toArabicDigits(activeMunajat.number)}`,
    });
  };

  const renderVerseLines = (lines: { text: string; unitIdx: number }[]) => (
    <p
      className={`font-arabic whitespace-pre-line text-center sm:text-justify ${
        FONT_SIZE_STEPS[fontStep]
      } ${nightMode ? 'text-[#F3EBD6]' : 'text-[#11271F]'}`}
    >
      {lines.map(({ text, unitIdx }) => {
        const trailingNewlinesMatch = text.match(/\n+$/);
        const visibleChunk = trailingNewlinesMatch
          ? text.slice(0, text.length - trailingNewlinesMatch[0].length)
          : text;
        const trailingBreaks = trailingNewlinesMatch ? trailingNewlinesMatch[0] : '';
        const isActive = focusTrackerEnabled && activeUnitIndex === unitIdx;

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
  );

  const bookPages: ManuscriptBookPage[] = useMemo(() => {
    if (!activeMunajat) return [];
    return paginatedVerses.map((slice, pIdx) => ({
      id: `${activeMunajat.id}-page-${slice.pageNumber}`,
      content: (
        <div className="max-w-prose mx-auto">
          {pIdx === 0 && (
            <>
              <header className="text-center pb-4">
                <p
                  className={`text-xs font-medium ${
                    nightMode ? 'text-[#D9B96A]' : 'text-[#7A5E2A]'
                  }`}
                >
                  المناجاة رقم {toArabicDigits(activeMunajat.number)} من ١٥ · الصحيفة السجادية
                </p>
                <h2
                  className={`font-calligraphy font-bold text-3xl sm:text-4xl mt-1 ${
                    nightMode ? 'text-[#F3EBD6]' : 'text-[#0F3D2E]'
                  }`}
                >
                  {activeMunajat.title}
                </h2>
                {isCompleted && (
                  <div
                    className={`mt-2 inline-flex items-center gap-1.5 text-xs font-bold ${
                      nightMode ? 'text-[#9FD3C2]' : 'text-[#1F6B50]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>مقروءة</span>
                  </div>
                )}
              </header>

              <div
                className={`my-4 pr-4 border-r-2 space-y-1.5 text-sm leading-relaxed ${
                  nightMode
                    ? 'border-[#D9B96A] text-[#C8B88A]'
                    : 'border-[#B8924A] text-[#425B51]'
                }`}
              >
                <p>
                  <strong className={nightMode ? 'text-[#E8CE88]' : 'text-[#0F3D2E]'}>
                    المعنى:{' '}
                  </strong>
                  {activeMunajat.quickMeaning}
                </p>
                <p>
                  <strong className={nightMode ? 'text-[#9FD3C2]' : 'text-[#1F6B50]'}>
                    العبرة:{' '}
                  </strong>
                  {activeMunajat.lifeLesson}
                </p>
              </div>

              <ManuscriptDivider variant="crescent" dark={nightMode} />
            </>
          )}

          <div className="mt-4 space-y-6">
            {slice.items.map((block) => (
              <React.Fragment key={block.id}>
                {renderVerseLines(block.lines)}
              </React.Fragment>
            ))}
          </div>
        </div>
      ),
    }));
  }, [
    paginatedVerses,
    activeMunajat,
    nightMode,
    isCompleted,
    fontStep,
    focusTrackerEnabled,
    focusTheme,
    activeUnitIndex,
  ]);

  // View 1: Single Unified List + Title Search
  if (!activeMunajat) {
    return (
      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-[#B8924A]/35">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackHome}
              className="min-h-[42px] px-3.5 py-2 btn-manuscript text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ArrowRight className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
              <span>الرئيسية</span>
            </button>

            <div>
              <h1 className="font-calligraphy font-bold text-2xl sm:text-3xl text-[#0F3D2E] flex items-center gap-2">
                <MunajatMoonIcon className="w-6 h-6 text-[#B8924A] shrink-0" />
                <span>المناجاة الخمس عشرة</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#425B51] mt-0.5 tabular-nums">
                الإمام زين العابدين (عليه السلام) · أتممت {toArabicDigits(completedCount)} من{' '}
                {toArabicDigits(MUNAJAT_LIST.length)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="الإعدادات"
            className="min-h-[40px] px-3 py-1.5 btn-manuscript text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <AstrolabeIcon className="w-4 h-4 text-[#0F3D2E]" />
            <span>الإعدادات</span>
          </button>
        </div>

        <div className="relative mb-4">
          <Search
            className="w-4 h-4 text-[#1F6B50] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في العناوين..."
            aria-label="ابحث في عناوين المناجاة"
            className="w-full min-h-[46px] pr-10 pl-10 py-2 rounded-[6px] bg-[#FAF6EC] focus:bg-white border border-[#B8924A]/55 focus:border-[#0F3D2E] text-sm font-medium text-[#11271F] placeholder:text-[#425B51]/75 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="مسح البحث"
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-[#425B51] hover:text-[#0F3D2E] cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="manuscript-folio paper-grain rounded-[6px] divide-y divide-[#B8924A]/20 overflow-hidden">
          {visibleMunajat.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <p className="font-display font-bold text-sm text-[#425B51]">
                لم نعثر على مناجاة مطابقة لعنوان «{searchQuery}».
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 btn-text-ornate text-xs cursor-pointer"
              >
                عرض جميع المناجاة
              </button>
            </div>
          ) : (
            visibleMunajat.map((item) => {
              const done = completedReadingIds.includes(item.id);
              const fav = bookmarkedIds.includes(item.id);
              const hasProgress = !done && getSavedReadingPosition(item.id) > 0;

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenMunajat(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenMunajat(item.id);
                    }
                  }}
                  className="w-full text-right px-4 sm:px-5 py-3.5 hover:bg-[#F3ECDA]/75 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display font-bold text-base sm:text-lg text-[#0F3D2E] group-hover:text-[#1F6B50] leading-snug">
                      {item.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 text-xs text-[#425B51]">
                      <span className="truncate">{item.quickMeaning}</span>
                      {hasProgress && (
                        <span className="text-[#9C7835] font-bold">
                          · موضع قراءة محفوظ
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {done && (
                      <CheckCircle2
                        className="w-4 h-4 text-[#1F6B50]"
                        aria-label="مقروءة"
                      />
                    )}
                    {onToggleBookmark && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(item.id);
                        }}
                        aria-label={fav ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                        className={`min-w-[36px] min-h-[36px] rounded-[4px] flex items-center justify-center cursor-pointer transition-colors ${
                          fav
                            ? 'text-[#B8924A]'
                            : 'text-[#425B51]/60 hover:text-[#0F3D2E]'
                        }`}
                      >
                        <Bookmark
                          className={`w-4 h-4 ${fav ? 'fill-current' : ''}`}
                          aria-hidden="true"
                        />
                      </button>
                    )}
                    <ArrowLeft
                      className="w-4 h-4 text-[#1F6B50] transition-transform group-hover:-translate-x-1"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    );
  }

  // View 2: Full-Page Single Munajat Reader
  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-5 pb-3.5 border-b border-[#B8924A]/35">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBackToList}
            className="min-h-[42px] px-3.5 py-2 btn-manuscript text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowRight className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
            <span>رجوع إلى القائمة</span>
          </button>

          <div className="min-w-0">
            <h1 className="font-calligraphy font-bold text-xl sm:text-2xl text-[#0F3D2E] truncate">
              {activeMunajat.title}
            </h1>
            <p className="text-xs text-[#425B51] truncate mt-0.5">
              المناجاة رقم {toArabicDigits(activeMunajat.number)} من ١٥ · الصحيفة السجادية
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            role="group"
            aria-label="نمط عرض الصفحات"
            className="inline-flex items-center bg-[#FAF6EC] border border-[#B8924A]/50 rounded-[5px] p-0.5"
          >
            <button
              type="button"
              onClick={() => handleChangeViewMode('book')}
              aria-pressed={viewMode === 'book'}
              className={`min-h-[38px] px-3 py-1 rounded-[4px] font-display font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                viewMode === 'book'
                  ? 'bg-[#0F3D2E] text-[#FAF6EC]'
                  : 'text-[#425B51] hover:text-[#0F3D2E]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              <span>كتاب</span>
            </button>
            <button
              type="button"
              onClick={() => handleChangeViewMode('scroll')}
              aria-pressed={viewMode === 'scroll'}
              className={`min-h-[38px] px-3 py-1 rounded-[4px] font-display font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                viewMode === 'scroll'
                  ? 'bg-[#0F3D2E] text-[#FAF6EC]'
                  : 'text-[#425B51] hover:text-[#0F3D2E]'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>متصل</span>
            </button>
          </div>

          <div className="inline-flex items-center bg-[#FAF6EC] border border-[#B8924A]/50 rounded-[5px] p-0.5">
            <button
              type="button"
              onClick={() => setFontStep((s) => Math.max(0, s - 1))}
              disabled={fontStep === 0}
              aria-label="تصغير الخط"
              className="min-h-[38px] px-2.5 hover:bg-[#F3ECDA] disabled:opacity-40 text-[#0F3D2E] font-bold flex items-center gap-1 cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs">أ-</span>
            </button>
            <span className="px-2 text-xs text-[#425B51] border-x border-[#B8924A]/30">
              الخط
            </span>
            <button
              type="button"
              onClick={() =>
                setFontStep((s) => Math.min(FONT_SIZE_STEPS.length - 1, s + 1))
              }
              disabled={fontStep === FONT_SIZE_STEPS.length - 1}
              aria-label="تكبير الخط"
              className="min-h-[38px] px-2.5 hover:bg-[#F3ECDA] disabled:opacity-40 text-[#0F3D2E] font-bold flex items-center gap-1 cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs">أ+</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setNightMode((prev) => !prev)}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-[5px] font-bold text-xs sm:text-sm flex items-center gap-1.5 border cursor-pointer transition-colors ${
              nightMode
                ? 'bg-[#081A14] text-[#D9B96A] border-[#D9B96A]/60'
                : 'bg-[#FAF6EC] text-[#0F3D2E] border-[#B8924A]/50 hover:bg-[#F3ECDA]'
            }`}
          >
            {nightMode ? (
              <>
                <Sun className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
                <span>الوضع النهاري</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#0F3D2E]" aria-hidden="true" />
                <span>قراءة ليلية</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="إعدادات ألوان تغميق السطر"
            className="min-h-[40px] px-3 py-1.5 btn-manuscript text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <AstrolabeIcon className="w-4 h-4 text-[#0F3D2E]" />
            <span>الإعدادات</span>
          </button>
        </div>
      </div>

      {viewMode === 'book' ? (
        <div className="space-y-4">
          <div
            className={`rounded-[6px] border p-4 transition-colors duration-300 ${
              nightMode
                ? 'manuscript-folio-dark'
                : 'manuscript-folio paper-grain text-[#11271F]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                {onToggleBookmark && (
                  <button
                    type="button"
                    onClick={() => onToggleBookmark(activeMunajat.id)}
                    className={`min-h-[38px] px-3 py-1 rounded-[5px] border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      isBookmarked
                        ? nightMode
                          ? 'bg-[#D9B96A]/20 border-[#D9B96A] text-[#D9B96A]'
                          : 'bg-[#F3ECDA] border-[#B8924A] text-[#0F3D2E]'
                        : nightMode
                        ? 'bg-[#081A14] border-[#B8924A]/35 text-[#F3EBD6]/80'
                        : 'bg-[#FAF6EC] border-[#B8924A]/40 text-[#425B51]'
                    }`}
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`}
                      aria-hidden="true"
                    />
                    <span>{isBookmarked ? 'في المفضلة' : 'حفظ العلامة'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleOpenShareCard}
                  className={`min-h-[38px] px-3 py-1 rounded-[5px] border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    nightMode
                      ? 'bg-[#081A14] border-[#B8924A]/35 text-[#D9B96A]'
                      : 'bg-[#FAF6EC] border-[#B8924A]/45 text-[#0F3D2E] hover:bg-[#F3ECDA]'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>مشاركة كبطاقة</span>
                </button>
              </div>
            </div>

            <AudioReciterPlayer
              mode="entry"
              entryId={activeMunajat.id}
              entryTitle={activeMunajat.title}
              tracks={ENTRY_AUDIO_TRACKS[activeMunajat.id] || []}
              nightMode={nightMode}
            />
          </div>

          <ManuscriptBookFlip
            bookKey={activeMunajat.id}
            title={activeMunajat.title}
            pages={bookPages}
            currentPage={bookPage}
            onPageChange={handleBookPageChange}
            nightMode={nightMode}
            pageFlipSoundEnabled={focusSettings.pageFlipSound}
            colophonFooter={
              <div className="space-y-3">
                {justAwarded && (
                  <div className="rounded-[5px] bg-[#0F3D2E] text-[#FAF6EC] border border-[#D9B96A] p-3.5 font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#D9B96A]" aria-hidden="true" />
                    <span>بارك الله فيك! تم تسجيل إتمام قراءة هذه المناجاة</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {isCompleted ? (
                    <div
                      className={`flex items-center gap-2 font-bold text-sm ${
                        nightMode ? 'text-[#9FD3C2]' : 'text-[#1F6B50]'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                      <span>أتممت قراءة هذه المناجاة المباركة</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinishReading}
                      className={`w-full sm:w-auto min-h-[46px] px-7 py-2 text-base flex items-center justify-center gap-2 cursor-pointer ${
                        nightMode ? 'btn-gilded' : 'btn-emerald'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                      <span>أتممت القراءة</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleOpenShareCard}
                    className="min-h-[42px] px-4 py-2 btn-manuscript text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-[#0F3D2E]" aria-hidden="true" />
                    <span>مشاركة كبطاقة</span>
                  </button>
                </div>
              </div>
            }
          />
        </div>
      ) : (
        <motion.div
          key={activeMunajat.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={`relative rounded-[6px] p-5 sm:p-10 transition-colors duration-300 ${
            nightMode ? 'manuscript-folio-dark' : 'manuscript-folio paper-grain'
          }`}
        >
          <ManuscriptCornerBracket
            position="top-right"
            color={nightMode ? '#D9B96A' : '#B8924A'}
            className="absolute top-2.5 right-2.5"
          />
          <ManuscriptCornerBracket
            position="top-left"
            color={nightMode ? '#D9B96A' : '#B8924A'}
            className="absolute top-2.5 left-2.5"
          />

          <div className="max-w-prose mx-auto">
            <header className="text-center pb-4">
              <p
                className={`text-xs font-medium ${
                  nightMode ? 'text-[#D9B96A]' : 'text-[#7A5E2A]'
                }`}
              >
                المناجاة رقم {toArabicDigits(activeMunajat.number)} من ١٥ · الصحيفة السجادية
              </p>
              <h2
                className={`font-calligraphy font-bold text-3xl sm:text-4xl mt-1 ${
                  nightMode ? 'text-[#F3EBD6]' : 'text-[#0F3D2E]'
                }`}
              >
                {activeMunajat.title}
              </h2>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {onToggleBookmark && (
                  <button
                    type="button"
                    onClick={() => onToggleBookmark(activeMunajat.id)}
                    className={`min-h-[36px] px-3 py-1 rounded-[5px] border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      isBookmarked
                        ? nightMode
                          ? 'bg-[#D9B96A]/20 border-[#D9B96A] text-[#D9B96A]'
                          : 'bg-[#F3ECDA] border-[#B8924A] text-[#0F3D2E]'
                        : nightMode
                        ? 'bg-[#081A14] border-[#B8924A]/35 text-[#F3EBD6]/80'
                        : 'bg-[#FAF6EC] border-[#B8924A]/40 text-[#425B51]'
                    }`}
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`}
                      aria-hidden="true"
                    />
                    <span>{isBookmarked ? 'في المفضلة' : 'حفظ العلامة'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleOpenShareCard}
                  className={`min-h-[36px] px-3 py-1 rounded-[5px] border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    nightMode
                      ? 'bg-[#081A14] border-[#B8924A]/35 text-[#D9B96A]'
                      : 'bg-[#FAF6EC] border-[#B8924A]/45 text-[#0F3D2E] hover:bg-[#F3ECDA]'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>مشاركة كبطاقة</span>
                </button>

                {isCompleted && (
                  <div
                    className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                      nightMode ? 'text-[#9FD3C2]' : 'text-[#1F6B50]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>مقروءة</span>
                  </div>
                )}
              </div>
            </header>

            <AudioReciterPlayer
              mode="entry"
              entryId={activeMunajat.id}
              entryTitle={activeMunajat.title}
              tracks={ENTRY_AUDIO_TRACKS[activeMunajat.id] || []}
              nightMode={nightMode}
            />

            <div
              className={`my-5 pr-4 border-r-2 space-y-1.5 text-sm leading-relaxed ${
                nightMode
                  ? 'border-[#D9B96A] text-[#C8B88A]'
                  : 'border-[#B8924A] text-[#425B51]'
              }`}
            >
              <p>
                <strong className={nightMode ? 'text-[#E8CE88]' : 'text-[#0F3D2E]'}>
                  المعنى:{' '}
                </strong>
                {activeMunajat.quickMeaning}
              </p>
              <p>
                <strong className={nightMode ? 'text-[#9FD3C2]' : 'text-[#1F6B50]'}>
                  العبرة:{' '}
                </strong>
                {activeMunajat.lifeLesson}
              </p>
            </div>

            <ManuscriptDivider variant="crescent" dark={nightMode} />

            <div className="mt-6 space-y-6" ref={readerBodyRef}>
              {splitVerses.map((lines, idx) => (
                <React.Fragment key={idx}>
                  {renderVerseLines(lines)}
                </React.Fragment>
              ))}
            </div>

            {justAwarded && (
              <div className="mt-6 rounded-[5px] bg-[#0F3D2E] text-[#FAF6EC] border border-[#D9B96A] p-4 font-display font-bold text-base flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#D9B96A]" aria-hidden="true" />
                <span>بارك الله فيك! تم تسجيل إتمام قراءة هذه المناجاة</span>
              </div>
            )}

            <div className="mt-8 pt-5 border-t border-[#B8924A]/30 flex flex-wrap items-center justify-between gap-4">
              {isCompleted ? (
                <div
                  className={`flex items-center gap-2 font-bold text-sm ${
                    nightMode ? 'text-[#9FD3C2]' : 'text-[#1F6B50]'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                  <span>أتممت قراءة هذه المناجاة المباركة</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishReading}
                  className={`w-full sm:w-auto min-h-[48px] px-7 py-2.5 text-base flex items-center justify-center gap-2 cursor-pointer ${
                    nightMode ? 'btn-gilded' : 'btn-emerald'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                  <span>أتممت القراءة</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenShareCard}
                className="min-h-[42px] px-4 py-2 btn-manuscript text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-[#0F3D2E]" aria-hidden="true" />
                <span>مشاركة كبطاقة</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <ShareCardModal
        payload={sharePayload}
        onClose={() => setSharePayload(null)}
      />
    </main>
  );
};
