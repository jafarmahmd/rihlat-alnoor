import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Moon,
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
  splitIntoReadableLines,
  useReadingFocusTracker,
} from './ReadingFocusControls';
import { toArabicDigits } from '../utils/arabicNumbers';
import { useFontsReady } from '../utils/fontsReady';
import {
  getSavedItemScrollY,
  saveItemScrollY,
  useItemScrollPersistence,
} from '../utils/readingScrollStorage';
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
  CornerOrnaments,
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
  const [justAwarded, setJustAwarded] = useState<boolean>(false);
  const [sharePayload, setSharePayload] = useState<ShareCardPayload | null>(null);
  const focusTrackerEnabled = focusSettings.enabled;
  const focusTheme = focusSettings.theme;
  const readerBodyRef = useRef<HTMLDivElement | null>(null);
  const listScrollYRef = useRef<number>(0);
  const pendingListRestoreRef = useRef<boolean>(false);
  const fontsReady = useFontsReady();

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

  const activeMunajatIndex = useMemo(() => {
    if (!openedId) return -1;
    return MUNAJAT_LIST.findIndex((m) => m.id === openedId);
  }, [openedId]);

  const activeMunajat: MunajatItem | null =
    activeMunajatIndex >= 0 ? MUNAJAT_LIST[activeMunajatIndex] : null;
  const prevMunajat =
    activeMunajatIndex > 0 ? MUNAJAT_LIST[activeMunajatIndex - 1] : null;
  const nextMunajat =
    activeMunajatIndex >= 0 && activeMunajatIndex < MUNAJAT_LIST.length - 1
      ? MUNAJAT_LIST[activeMunajatIndex + 1]
      : null;

  useEffect(() => {
    if (!activeMunajat) return;
    onSetLastRead?.('munajat', activeMunajat.id, activeMunajat.title);
  }, [activeMunajat?.id]);

  // Persist and restore exact vertical scroll position per Munajat ID
  useItemScrollPersistence({
    itemId: activeMunajat ? activeMunajat.id : null,
    ready: Boolean(activeMunajat) && fontsReady,
  });

  // Restore exact list scroll position upon returning from reader
  useLayoutEffect(() => {
    if (openedId !== null || !pendingListRestoreRef.current) return;
    pendingListRestoreRef.current = false;
    const restoreY = listScrollYRef.current;
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: restoreY, behavior: 'auto' });
      requestAnimationFrame(() => {
        window.scrollTo({ top: restoreY, behavior: 'auto' });
      });
    }
  }, [openedId]);

  const handleOpenMunajat = (id: string) => {
    listScrollYRef.current = typeof window !== 'undefined' ? window.scrollY : 0;
    setOpenedId(id);
    setJustAwarded(false);
  };

  const handleNavigateAdjacentMunajat = (targetId: string) => {
    if (activeMunajat && typeof window !== 'undefined') {
      saveItemScrollY(activeMunajat.id, window.scrollY);
    }
    setOpenedId(targetId);
    setJustAwarded(false);
  };

  const handleBackToList = () => {
    if (activeMunajat && typeof window !== 'undefined') {
      saveItemScrollY(activeMunajat.id, window.scrollY);
    }
    pendingListRestoreRef.current = true;
    setOpenedId(null);
    setJustAwarded(false);
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
    enabled: Boolean(activeMunajat) && focusTrackerEnabled,
    contentRef: readerBodyRef,
  });

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
              const hasProgress =
                !done &&
                (getSavedItemScrollY(item.id) > 0 ||
                  getSavedReadingPosition(item.id) > 0);

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

  // View 2: Static Single-Page Continuous Munajat Reader (Zero reflow / Zero animations)
  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      <div className="min-h-[58px] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-5 pb-3.5 border-b border-[#B8924A]/35">
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

      <section
        aria-label="لوحة قراءة المناجاة"
        className={`relative rounded-[6px] p-7 sm:p-10 transition-colors duration-200 ${
          nightMode ? 'manuscript-folio-dark' : 'manuscript-folio paper-grain'
        }`}
      >
        <CornerOrnaments tone={nightMode ? 'dark' : 'auto'} />

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

            <div className="mt-3 min-h-[38px] flex flex-wrap items-center justify-center gap-2">
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

          <div
            className={`mt-6 space-y-6 ${fontsReady ? 'opacity-100' : 'opacity-0'}`}
            ref={readerBodyRef}
          >
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

          {/* Static Previous / Next Munajat Navigation */}
          <nav
            aria-label="التنقل بين المناجاة"
            className="mt-6 pt-5 border-t border-[#B8924A]/25 grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <button
              type="button"
              disabled={!prevMunajat}
              onClick={() => prevMunajat && handleNavigateAdjacentMunajat(prevMunajat.id)}
              className={`min-h-[48px] px-4 py-2.5 rounded-[6px] border text-right flex items-center justify-between gap-2 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed transition-colors ${
                nightMode
                  ? 'bg-[#081A14] border-[#D9B96A]/35 text-[#F3EBD6] hover:bg-[#113127]'
                  : 'bg-[#FAF6EC] border-[#B8924A]/45 text-[#0F3D2E] hover:bg-[#F3ECDA]'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <ChevronRight className="w-4 h-4 shrink-0 text-[#B8924A]" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-[11px] opacity-75">السابق</span>
                  <span className="block font-display font-bold text-xs sm:text-sm truncate">
                    {prevMunajat ? prevMunajat.title : 'أول القائمة'}
                  </span>
                </span>
              </span>
            </button>

            <button
              type="button"
              disabled={!nextMunajat}
              onClick={() => nextMunajat && handleNavigateAdjacentMunajat(nextMunajat.id)}
              className={`min-h-[48px] px-4 py-2.5 rounded-[6px] border text-left flex items-center justify-end gap-2 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed transition-colors ${
                nightMode
                  ? 'bg-[#081A14] border-[#D9B96A]/35 text-[#F3EBD6] hover:bg-[#113127]'
                  : 'bg-[#FAF6EC] border-[#B8924A]/45 text-[#0F3D2E] hover:bg-[#F3ECDA]'
              }`}
            >
              <span className="min-w-0 text-left">
                <span className="block text-[11px] opacity-75">التالي</span>
                <span className="block font-display font-bold text-xs sm:text-sm truncate">
                  {nextMunajat ? nextMunajat.title : 'آخر القائمة'}
                </span>
              </span>
              <ChevronLeft className="w-4 h-4 shrink-0 text-[#B8924A]" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </section>

      <ShareCardModal
        payload={sharePayload}
        onClose={() => setSharePayload(null)}
      />
    </main>
  );
};
