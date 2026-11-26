import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  Share2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ShareCardModal, ShareCardPayload } from './ShareCardModal';
import {
  ReadingFocusSettings,
  getReadingUnitClasses,
  splitIntoReadableLines,
  useReadingFocusTracker,
} from './ReadingFocusControls';
import { toArabicDigits } from '../utils/arabicNumbers';
import { useFontsReady } from '../utils/fontsReady';
import {
  saveItemScrollY,
  useItemScrollPersistence,
} from '../utils/readingScrollStorage';
import { AudioReciterPlayer } from './AudioReciterPlayer';
import { ENTRY_AUDIO_TRACKS } from '../data/reciterAudio';
import { ZIYARAT_LIST, ZiyaratItem } from '../data/ziyarat';
import { registerHardwareBackHandler } from '../utils/hardwareBack';
import {
  isGlobalNightTheme,
  subscribeAppAppearance,
} from '../utils/appAppearance';
import {
  AstrolabeIcon,
  CornerOrnaments,
  DuaScrollIcon,
  ManuscriptDivider,
} from './IslamicOrnaments';

interface ZiyaratScreenProps {
  completedReadingIds: string[];
  bookmarkedIds?: string[];
  focusSettings: ReadingFocusSettings;
  initialEntryId?: string | null;
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

export const ZiyaratScreen: React.FC<ZiyaratScreenProps> = ({
  completedReadingIds,
  bookmarkedIds = [],
  focusSettings,
  initialEntryId = null,
  onOpenSettings,
  onCompleteReading,
  onToggleBookmark,
  onBackHome,
  onSetLastRead,
}) => {
  const [openedZiyaratId, setOpenedZiyaratId] = useState<string | null>(initialEntryId);
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

  const visibleZiyarat = useMemo(() => {
    if (!normalizedQuery) return ZIYARAT_LIST;
    return ZIYARAT_LIST.filter((z) =>
      normalizeArabicTitle(z.title).includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  const activeZiyaratIndex = useMemo(() => {
    if (!openedZiyaratId) return -1;
    return ZIYARAT_LIST.findIndex((z) => z.id === openedZiyaratId);
  }, [openedZiyaratId]);

  const activeZiyarat: ZiyaratItem | null =
    activeZiyaratIndex >= 0 ? ZIYARAT_LIST[activeZiyaratIndex] : null;
  const prevZiyarat = activeZiyaratIndex > 0 ? ZIYARAT_LIST[activeZiyaratIndex - 1] : null;
  const nextZiyarat =
    activeZiyaratIndex >= 0 && activeZiyaratIndex < ZIYARAT_LIST.length - 1
      ? ZIYARAT_LIST[activeZiyaratIndex + 1]
      : null;

  useEffect(() => {
    if (!activeZiyarat) return;
    onSetLastRead?.('ziyarat', activeZiyarat.id, activeZiyarat.title);
  }, [activeZiyarat?.id]);

  useItemScrollPersistence({
    itemId: activeZiyarat ? activeZiyarat.id : null,
    ready: Boolean(activeZiyarat) && fontsReady,
  });

  useLayoutEffect(() => {
    if (openedZiyaratId !== null || !pendingListRestoreRef.current) return;
    pendingListRestoreRef.current = false;
    const restoreY = listScrollYRef.current;
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: restoreY, behavior: 'auto' });
      requestAnimationFrame(() => {
        window.scrollTo({ top: restoreY, behavior: 'auto' });
      });
    }
  }, [openedZiyaratId]);

  const handleOpenZiyarat = (id: string) => {
    listScrollYRef.current = typeof window !== 'undefined' ? window.scrollY : 0;
    setOpenedZiyaratId(id);
    setJustAwarded(false);
  };

  const handleNavigateAdjacent = (targetId: string) => {
    if (activeZiyarat && typeof window !== 'undefined') {
      saveItemScrollY(activeZiyarat.id, window.scrollY);
    }
    setOpenedZiyaratId(targetId);
    setJustAwarded(false);
  };

  const handleBackToList = () => {
    if (activeZiyarat && typeof window !== 'undefined') {
      saveItemScrollY(activeZiyarat.id, window.scrollY);
    }
    pendingListRestoreRef.current = true;
    setOpenedZiyaratId(null);
    setJustAwarded(false);
  };

  useEffect(() => {
    return registerHardwareBackHandler(() => {
      if (sharePayload) {
        setSharePayload(null);
        return true;
      }
      if (openedZiyaratId) {
        handleBackToList();
        return true;
      }
      return false;
    });
  }, [sharePayload, openedZiyaratId]);

  const splitParagraphs = useMemo(() => {
    if (!activeZiyarat) return [];
    let cursor = 0;
    return activeZiyarat.arabicText.map((paragraph) =>
      splitIntoReadableLines(paragraph).map((text) => ({
        text,
        unitIdx: cursor++,
      }))
    );
  }, [activeZiyarat]);

  const unitCount = useMemo(
    () => splitParagraphs.reduce((sum, p) => sum + p.length, 0),
    [splitParagraphs]
  );

  const { activeUnitIndex, setActiveUnitIndex } = useReadingFocusTracker({
    resetKey: activeZiyarat?.id || 'ziyarat-list',
    unitCount,
    enabled: Boolean(activeZiyarat) && focusTrackerEnabled,
    contentRef: readerBodyRef,
  });

  const totalCompletedZiyarat = ZIYARAT_LIST.filter((z) =>
    completedReadingIds.includes(z.id)
  ).length;

  const isCompleted = activeZiyarat ? completedReadingIds.includes(activeZiyarat.id) : false;
  const isBookmarked = activeZiyarat ? bookmarkedIds.includes(activeZiyarat.id) : false;

  const handleFinishReading = () => {
    if (!activeZiyarat) return;
    const awarded = onCompleteReading(activeZiyarat.id);
    if (awarded) {
      setJustAwarded(true);
    }
  };

  const handleOpenShareCard = () => {
    if (!activeZiyarat) return;
    const bodyExcerpt = activeZiyarat.arabicText[0] || activeZiyarat.subtitle;
    setSharePayload({
      title: activeZiyarat.title,
      category: 'الزيارات الشريفة',
      quote: bodyExcerpt,
      attribution: 'رحلة النور — المخطوطة الرقمية',
    });
  };

  const renderParagraphLines = (lines: { text: string; unitIdx: number }[]) => (
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

  // View 1: Flat List + Search
  if (!activeZiyarat) {
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
                <DuaScrollIcon className="w-6 h-6 text-[#B8924A] shrink-0" />
                <span>زيارات أهل البيت (عليهم السلام)</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#425B51] mt-0.5 tabular-nums">
                {toArabicDigits(ZIYARAT_LIST.length)} زيارة · أتممت{' '}
                {toArabicDigits(totalCompletedZiyarat)}
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
            placeholder="ابحث في عناوين الزيارات..."
            aria-label="ابحث في عناوين الزيارات"
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
          {visibleZiyarat.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <p className="font-display font-bold text-sm text-[#425B51]">
                لم نعثر على زيارة مطابقة لـ «{searchQuery}».
              </p>
            </div>
          ) : (
            visibleZiyarat.map((item) => {
              const done = completedReadingIds.includes(item.id);
              const bookmarked = bookmarkedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenZiyarat(item.id)}
                  className="p-4 sm:p-5 hover:bg-[#F3ECDA]/65 transition-colors flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display font-bold text-base sm:text-lg text-[#0F3D2E] group-hover:text-[#1F6B50] transition-colors">
                        {item.title}
                      </span>
                      {done && (
                        <CheckCircle2
                          className="w-4 h-4 text-[#1F6B50] fill-[#1F6B50]/15 shrink-0"
                          aria-label="تم القراءة"
                        />
                      )}
                      {bookmarked && (
                        <Bookmark
                          className="w-3.5 h-3.5 text-[#B8924A] fill-[#D9B96A] shrink-0"
                          aria-label="مفعل في المحفوظات"
                        />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-[#425B51] line-clamp-1">
                      {item.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline-block text-xs font-bold text-[#9C7835] group-hover:translate-x-[-2px] transition-transform">
                      قراءة الزيارة
                    </span>
                    <ChevronLeft
                      className="w-5 h-5 text-[#B8924A] group-hover:text-[#0F3D2E] transition-colors"
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

  // View 2: Reader View
  const audioTrack = ENTRY_AUDIO_TRACKS[activeZiyarat.id];

  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8" ref={readerBodyRef}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[#B8924A]/35">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackToList}
            className="min-h-[42px] px-3.5 py-2 btn-manuscript text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <ArrowRight className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
            <span>رجوع للقائمة</span>
          </button>

          <div className="min-w-0">
            <h1 className="font-calligraphy font-bold text-xl sm:text-2xl text-[#0F3D2E] truncate">
              {activeZiyarat.title}
            </h1>
            <p className="text-xs text-[#425B51] truncate mt-0.5">
              {activeZiyarat.subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex items-center bg-[#FAF6EC] border border-[#B8924A]/50 rounded-[6px] p-0.5">
            <button
              type="button"
              onClick={() => setFontStep((s) => Math.max(0, s - 1))}
              disabled={fontStep <= 0}
              aria-label="تصغير الخط"
              className="min-h-[38px] min-w-[38px] px-2 hover:bg-[#F3ECDA] disabled:opacity-40 text-[#0F3D2E] font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="text-xs">أ-</span>
            </button>
            <span className="px-2.5 text-xs font-bold text-[#0F3D2E] border-x border-[#B8924A]/30 tabular-nums">
              {fontStep + 1}
            </span>
            <button
              type="button"
              onClick={() => setFontStep((s) => Math.min(FONT_SIZE_STEPS.length - 1, s + 1))}
              disabled={fontStep >= FONT_SIZE_STEPS.length - 1}
              aria-label="تكبير الخط"
              className="min-h-[38px] min-w-[38px] px-2 hover:bg-[#F3ECDA] disabled:opacity-40 text-[#0F3D2E] font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="text-xs">أ+</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onToggleBookmark?.(activeZiyarat.id)}
            aria-label={isBookmarked ? 'إزالة من المحفوظات' : 'حفظ في المحفوظات'}
            className={`min-h-[38px] px-3 py-1 rounded-[6px] border flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
              isBookmarked
                ? 'bg-[#D9B96A] border-[#9C7835] text-[#0F3D2E]'
                : 'bg-[#FAF6EC] border-[#B8924A]/50 text-[#0F3D2E] hover:bg-[#F3ECDA]'
            }`}
          >
            <Bookmark
              className={`w-4 h-4 ${isBookmarked ? 'fill-[#0F3D2E]' : ''}`}
            />
            <span className="hidden xs:inline">
              {isBookmarked ? 'محفوظ' : 'حفظ'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleOpenShareCard}
            aria-label="مشاركة الزيارة"
            className="min-h-[38px] px-3 py-1 rounded-[6px] border border-[#B8924A]/50 bg-[#FAF6EC] hover:bg-[#F3ECDA] text-[#0F3D2E] flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden xs:inline">مشاركة</span>
          </button>
        </div>
      </div>

      {audioTrack && audioTrack.length > 0 && (
        <div className="mb-4">
          <AudioReciterPlayer
            mode="entry"
            entryId={activeZiyarat.id}
            entryTitle={activeZiyarat.title}
            tracks={audioTrack}
            nightMode={nightMode}
          />
        </div>
      )}

      <div
        style={{ borderRadius: 'var(--radius-card)' }}
        className="manuscript-folio paper-grain p-5 sm:p-10 shadow-xl relative overflow-hidden"
      >
        <CornerOrnaments />
        <div className="text-center mb-8">
          <h2 className="font-calligraphy font-bold text-2xl sm:text-3xl text-[#0F3D2E] mb-1">
            {activeZiyarat.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#425B51]">
            {activeZiyarat.subtitle}
          </p>
          <ManuscriptDivider variant="rosette" className="mt-4" />
        </div>

        <div className="space-y-6">
          {splitParagraphs.map((paragraphLines, idx) => (
            <React.Fragment key={idx}>
              {renderParagraphLines(paragraphLines)}
            </React.Fragment>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-[#B8924A]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleFinishReading}
            className={`w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-[6px] border font-display font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isCompleted || justAwarded
                ? 'bg-[#1F6B50] text-[#FAF6EC] border-[#114232] shadow-sm'
                : 'bg-[#D9B96A]/20 hover:bg-[#D9B96A]/35 border-[#B8924A] text-[#0F3D2E]'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-[#1F6B50]" />
            <span>
              {isCompleted || justAwarded
                ? 'تم إتمام قراءة الزيارة (أخذت النجوم ⭐)'
                : 'أتممت القراءة (احصل على 5 نجوم ⭐)'}
            </span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {prevZiyarat ? (
              <button
                type="button"
                onClick={() => handleNavigateAdjacent(prevZiyarat.id)}
                className="min-h-[42px] px-3.5 py-2 btn-manuscript text-xs sm:text-sm flex items-center gap-1 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-[#1F6B50]" />
                <span className="truncate max-w-[120px]">{prevZiyarat.title}</span>
              </button>
            ) : (
              <div />
            )}

            {nextZiyarat && (
              <button
                type="button"
                onClick={() => handleNavigateAdjacent(nextZiyarat.id)}
                className="min-h-[42px] px-3.5 py-2 btn-manuscript text-xs sm:text-sm flex items-center gap-1 cursor-pointer"
              >
                <span className="truncate max-w-[120px]">{nextZiyarat.title}</span>
                <ChevronLeft className="w-4 h-4 text-[#1F6B50]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {sharePayload && (
        <ShareCardModal
          payload={sharePayload}
          onClose={() => setSharePayload(null)}
        />
      )}
    </main>
  );
};
