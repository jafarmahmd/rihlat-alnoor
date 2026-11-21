import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Download,
  Lightbulb,
  Menu,
  Moon,
  RefreshCw,
  ScrollText,
  Search,
  Share2,
  Sun,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ShareCardModal, ShareCardPayload } from './ShareCardModal';
import { getKhatmahSummary } from '../utils/khatmahTracker';
import {
  isGlobalNightTheme,
  subscribeAppAppearance,
} from '../utils/appAppearance';
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
  paginateQuranAyat,
  saveReaderViewMode,
} from '../utils/bookPagination';
import { DIGITAL_LIBRARY_ENTRIES } from '../data/digitalLibrary';
import { DUAS_LIST } from '../data/duas';
import { MUNAJAT_LIST } from '../data/munajat';
import { AudioReciterPlayer } from './AudioReciterPlayer';
import { ENTRY_AUDIO_TRACKS } from '../data/reciterAudio';
import {
  LOCAL_QURAN_SURAHS,
  QURAN_SURAHS_META,
  cacheAllQuranSurahsOffline,
  fetchQuranSurahAyat,
  getCachedOfflineSurahCount,
  isSurahAvailableOffline,
} from '../data/quran';
import {
  DigitalLibrarySection,
  DigitalLibrarySegment,
  QuranSurahMeta,
} from '../types/game';
import { registerHardwareBackHandler } from '../utils/hardwareBack';
import {
  AstrolabeIcon,
  AyahRosetteMarker,
  DuaScrollIcon,
  ManuscriptCornerBracket,
  ManuscriptDivider,
  ManuscriptSpinner,
  MunajatMoonIcon,
  QuranBookIcon,
  ShrineDomeIcon,
  SurahCartoucheHeader,
  TasbihBeadsIcon,
} from './IslamicOrnaments';

interface DigitalLibraryScreenProps {
  initialSection?: DigitalLibrarySection;
  initialEntryId?: string | null;
  navigationNonce?: number;
  completedReadingIds: string[];
  bookmarkedIds?: string[];
  focusSettings: ReadingFocusSettings;
  onOpenSettings: () => void;
  onCompleteReading: (readingId: string) => boolean;
  onToggleBookmark?: (itemId: string) => void;
  onBackHome: () => void;
  onOpenTasbih?: () => void;
  onSetLastRead?: (section: string, itemId: string, title: string) => void;
}

type DuaSubGroup = 'all' | 'days' | 'daily' | 'major' | 'favorites';
type ZiyaratSubGroup = 'all' | 'prophet' | 'karbala' | 'imams' | 'favorites';
type QuranSubFilter = 'all' | 'local' | 'meccan' | 'medinan' | 'favorites';
type ListFirstSection = 'adiyat' | 'sahifa' | 'munajat';

interface UnifiedDuaOrZiyaratItem {
  id: string;
  section: 'adiyat' | 'sahifa' | 'ziyarat';
  groupKey: string;
  groupLabel: string;
  title: string;
  subtitle: string;
  meaningSummary?: string;
  segments: DigitalLibrarySegment[];
}

const SECTION_TABS: {
  id: DigitalLibrarySection;
  label: string;
}[] = [
  { id: 'adiyat', label: 'الأدعية' },
  { id: 'sahifa', label: 'الصحيفة' },
  { id: 'ziyarat', label: 'الزيارات' },
  { id: 'munajat', label: 'المناجاة' },
  { id: 'quran', label: 'القرآن' },
];

const DUA_SUBFILTERS: { id: DuaSubGroup; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'days', label: 'الأيام السبعة' },
  { id: 'daily', label: 'يومية' },
  { id: 'major', label: 'الأدعية الكبرى' },
  { id: 'favorites', label: 'المفضلة' },
];

const ZIYARAT_SUBFILTERS: { id: ZiyaratSubGroup; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'prophet', label: 'النبوية والجامعة' },
  { id: 'karbala', label: 'كربلاء المقدسة' },
  { id: 'imams', label: 'الأئمة الأطهار' },
  { id: 'favorites', label: 'المفضلة' },
];

const QURAN_SUBFILTERS: { id: QuranSubFilter; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'local', label: 'أوفلاين' },
  { id: 'meccan', label: 'مكية' },
  { id: 'medinan', label: 'مدنية' },
  { id: 'favorites', label: 'المفضلة' },
];

const DL_LAST_SELECTED_KEY = 'rihlat_alnoor_dl_last_selected_v1';

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

function toArabicDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => ARABIC_INDIC_DIGITS[Number(d)] ?? d);
}

function isListFirstLibrarySection(
  sec: DigitalLibrarySection
): sec is ListFirstSection {
  return sec === 'adiyat' || sec === 'sahifa' || sec === 'munajat';
}

function loadLastSelectedMap(): {
  adiyat?: string;
  sahifa?: string;
  ziyarat?: string;
  munajat?: string;
  quran?: number;
} {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(DL_LAST_SELECTED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const DAYS_ORDER = [
  'dua-saturday',
  'dua-sunday',
  'dua-monday',
  'dua-tuesday',
  'dua-wednesday',
  'dua-thursday',
  'dua-friday',
];

const DAILY_ORDER = [
  'dua-morning',
  'dua-leave-home',
  'dua-knowledge',
  'dua-parents',
  'dua-sleep',
];

const MAJOR_DUAS_ORDER = [
  'dl-dua-sabah',
  'dl-dua-kumayl',
  'dl-dua-tawassul',
  'dl-dua-iftitah',
  'dl-dua-nudba',
  'dl-dua-ahed',
  'dl-dua-jawshan-kabir',
  'dl-dua-jawshan-saghir',
  'dl-dua-abi-hamza',
  'dl-dua-arafah',
];

const ZIYARAT_GROUP_MAP: Record<
  string,
  { groupKey: Exclude<ZiyaratSubGroup, 'all'>; groupLabel: string; order: number }
> = {
  'dl-z-amin': {
    groupKey: 'prophet',
    groupLabel: 'الزيارات الجامعة والنبوية والسيدة الزهراء (ع)',
    order: 1,
  },
  'dl-z-prophet-near': {
    groupKey: 'prophet',
    groupLabel: 'الزيارات الجامعة والنبوية والسيدة الزهراء (ع)',
    order: 2,
  },
  'dl-z-prophet-far': {
    groupKey: 'prophet',
    groupLabel: 'الزيارات الجامعة والنبوية والسيدة الزهراء (ع)',
    order: 3,
  },
  'dl-z-fatima': {
    groupKey: 'prophet',
    groupLabel: 'الزيارات الجامعة والنبوية والسيدة الزهراء (ع)',
    order: 4,
  },
  'dl-z-ashura': {
    groupKey: 'karbala',
    groupLabel: 'زيارات كربلاء المقدسة',
    order: 5,
  },
  'dl-z-husain': {
    groupKey: 'karbala',
    groupLabel: 'زيارات كربلاء المقدسة',
    order: 6,
  },
  'dl-z-husain-special': {
    groupKey: 'karbala',
    groupLabel: 'زيارات كربلاء المقدسة',
    order: 7,
  },
  'dl-z-abbas': {
    groupKey: 'karbala',
    groupLabel: 'زيارات كربلاء المقدسة',
    order: 8,
  },
  'dl-z-kadhim': {
    groupKey: 'imams',
    groupLabel: 'زيارات الأئمة الأطهار والمهدي (عج)',
    order: 9,
  },
  'dl-z-kadhimein': {
    groupKey: 'imams',
    groupLabel: 'زيارات الأئمة الأطهار والمهدي (عج)',
    order: 10,
  },
  'dl-z-jawad': {
    groupKey: 'imams',
    groupLabel: 'زيارات الأئمة الأطهار والمهدي (عج)',
    order: 11,
  },
  'dl-z-reza': {
    groupKey: 'imams',
    groupLabel: 'زيارات الأئمة الأطهار والمهدي (عج)',
    order: 12,
  },
  'dl-z-hadi': {
    groupKey: 'imams',
    groupLabel: 'زيارات الأئمة الأطهار والمهدي (عج)',
    order: 13,
  },
  'dl-z-askari': {
    groupKey: 'imams',
    groupLabel: 'زيارات الأئمة الأطهار والمهدي (عج)',
    order: 14,
  },
  'dl-z-askari-special': {
    groupKey: 'imams',
    groupLabel: 'زيارات الأئمة الأطهار والمهدي (عج)',
    order: 15,
  },
  'dl-z-yasin': {
    groupKey: 'imams',
    groupLabel: 'زيارات الأئمة الأطهار والمهدي (عج)',
    order: 16,
  },
};

const FONT_SIZE_CLASS_MAP: Record<number, string> = {
  16: 'text-[17px] leading-[2.35]',
  18: 'text-[19px] leading-[2.4]',
  20: 'text-[21px] leading-[2.45]',
  22: 'text-[23px] leading-[2.5]',
  24: 'text-[25px] leading-[2.5]',
  26: 'text-[27px] leading-[2.55]',
  28: 'text-[29px] leading-[2.55]',
  30: 'text-[31px] leading-[2.6]',
  32: 'text-[33px] leading-[2.6]',
  34: 'text-[35px] leading-[2.65]',
  36: 'text-[37px] leading-[2.65]',
};

const MIN_FONT_SIZE = 16;
const MAX_FONT_SIZE = 36;
const FONT_STEP = 2;

function normalizeArabicForSearch(input: string): string {
  return input
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim()
    .toLowerCase();
}

export const DigitalLibraryScreen: React.FC<DigitalLibraryScreenProps> = ({
  initialSection = 'adiyat',
  initialEntryId = null,
  navigationNonce = 0,
  completedReadingIds,
  bookmarkedIds = [],
  focusSettings,
  onOpenSettings,
  onCompleteReading,
  onToggleBookmark,
  onBackHome,
  onOpenTasbih,
  onSetLastRead,
}) => {
  const [activeSection, setActiveSection] =
    useState<DigitalLibrarySection>(initialSection);

  // Build unified lists separating Mafatih Duas, Sahifa Sajjadiyya, and Ziyarat cleanly
  const { allDuas, allSahifa, allZiyarat } = useMemo(() => {
    const dayDuas: UnifiedDuaOrZiyaratItem[] = DAYS_ORDER.map((id) =>
      DUAS_LIST.find((d) => d.id === id)
    )
      .filter((d): d is NonNullable<typeof d> => Boolean(d))
      .map((d) => ({
        id: d.id,
        section: 'adiyat',
        groupKey: 'days',
        groupLabel: 'أدعية الأيام السبعة',
        title: d.title,
        subtitle: d.subtitle,
        meaningSummary: d.meaningSummary,
        segments: d.arabicText.map((p) => ({ type: 'text' as const, content: p })),
      }));

    const dailyDuas: UnifiedDuaOrZiyaratItem[] = DAILY_ORDER.map((id) =>
      DUAS_LIST.find((d) => d.id === id)
    )
      .filter((d): d is NonNullable<typeof d> => Boolean(d))
      .map((d) => ({
        id: d.id,
        section: 'adiyat',
        groupKey: 'daily',
        groupLabel: 'الأدعية اليومية والمناسبات',
        title: d.title,
        subtitle: d.subtitle,
        meaningSummary: d.meaningSummary,
        segments: d.arabicText.map((p) => ({ type: 'text' as const, content: p })),
      }));

    const sahifaDuas: UnifiedDuaOrZiyaratItem[] = DIGITAL_LIBRARY_ENTRIES.filter(
      (e) =>
        e.section === 'sahifa' &&
        e.id !== 'dl-sahifa-m1' &&
        e.id !== 'dl-sahifa-m2'
    ).map((e) => ({
      id: e.id,
      section: 'sahifa',
      groupKey: 'sahifa',
      groupLabel: 'الصحيفة السجادية المباركة',
      title: e.title,
      subtitle: e.subtitle,
      segments: e.segments,
    }));

    const majorUnsorted = DIGITAL_LIBRARY_ENTRIES.filter(
      (e) => e.section === 'adiyat'
    );
    const majorDuas: UnifiedDuaOrZiyaratItem[] = [...majorUnsorted]
      .sort((a, b) => {
        const idxA = MAJOR_DUAS_ORDER.indexOf(a.id);
        const idxB = MAJOR_DUAS_ORDER.indexOf(b.id);
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
      })
      .map((e) => ({
        id: e.id,
        section: 'adiyat',
        groupKey: 'major',
        groupLabel: 'الأدعية الكبرى والمأثورة',
        title: e.title,
        subtitle: e.subtitle,
        segments: e.segments,
      }));

    const ziyaratUnsorted = DIGITAL_LIBRARY_ENTRIES.filter(
      (e) => e.section === 'ziyarat'
    );
    const sortedZiyarat: UnifiedDuaOrZiyaratItem[] = [...ziyaratUnsorted]
      .sort((a, b) => {
        const orderA = ZIYARAT_GROUP_MAP[a.id]?.order ?? 999;
        const orderB = ZIYARAT_GROUP_MAP[b.id]?.order ?? 999;
        return orderA - orderB;
      })
      .map((e) => {
        const meta = ZIYARAT_GROUP_MAP[e.id] || {
          groupKey: 'imams',
          groupLabel: 'زيارات الأئمة الأطهار والمهدي (عج)',
          order: 999,
        };
        return {
          id: e.id,
          section: 'ziyarat',
          groupKey: meta.groupKey,
          groupLabel: meta.groupLabel,
          title: e.title,
          subtitle: e.subtitle,
          segments: e.segments,
        };
      });

    return {
      allDuas: [...majorDuas, ...dayDuas, ...dailyDuas],
      allSahifa: sahifaDuas,
      allZiyarat: sortedZiyarat,
    };
  }, []);

  const [duaSubFilter, setDuaSubFilter] = useState<DuaSubGroup>('all');
  const [ziyaratSubFilter, setZiyaratSubFilter] =
    useState<ZiyaratSubGroup>('all');
  const [quranSubFilter, setQuranSubFilter] = useState<QuranSubFilter>('all');

  const initialMap = useMemo(() => loadLastSelectedMap(), []);

  const [selectedDuaId, setSelectedDuaId] = useState<string>(
    () =>
      initialMap.adiyat && allDuas.some((d) => d.id === initialMap.adiyat)
        ? initialMap.adiyat
        : allDuas[0].id
  );
  const [selectedSahifaId, setSelectedSahifaId] = useState<string>(
    () =>
      initialMap.sahifa && allSahifa.some((s) => s.id === initialMap.sahifa)
        ? initialMap.sahifa
        : allSahifa[0].id
  );
  const [selectedZiyaratId, setSelectedZiyaratId] = useState<string>(
    () =>
      initialMap.ziyarat && allZiyarat.some((z) => z.id === initialMap.ziyarat)
        ? initialMap.ziyarat
        : allZiyarat[0].id
  );
  const [selectedMunajatId, setSelectedMunajatId] = useState<string>(
    () =>
      initialMap.munajat && MUNAJAT_LIST.some((m) => m.id === initialMap.munajat)
        ? initialMap.munajat
        : MUNAJAT_LIST[0].id
  );
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(
    () =>
      typeof initialMap.quran === 'number' &&
      initialMap.quran >= 1 &&
      initialMap.quran <= 114
        ? initialMap.quran
        : 1
  );

  // List-first sections open at the list (null) unless an explicit entry ID is requested
  const [openedEntryId, setOpenedEntryId] = useState<string | null>(() => {
    if (!initialEntryId) return null;
    if (initialEntryId === 'dl-sahifa-m1') return 'munajat-1';
    if (initialEntryId === 'dl-sahifa-m2') return 'munajat-2';
    if (
      allDuas.some((d) => d.id === initialEntryId) ||
      allSahifa.some((s) => s.id === initialEntryId) ||
      MUNAJAT_LIST.some((m) => m.id === initialEntryId)
    ) {
      return initialEntryId;
    }
    return null;
  });

  const [titleSearchBySection, setTitleSearchBySection] = useState<
    Record<ListFirstSection, string>
  >({
    adiyat: '',
    sahifa: '',
    munajat: '',
  });
  const listScrollYRef = useRef<Record<string, number>>({});

  // Save per-section selection whenever it changes so returning preserves context
  useEffect(() => {
    try {
      window.localStorage.setItem(
        DL_LAST_SELECTED_KEY,
        JSON.stringify({
          adiyat: selectedDuaId,
          sahifa: selectedSahifaId,
          ziyarat: selectedZiyaratId,
          munajat: selectedMunajatId,
          quran: selectedSurahNumber,
        })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [
    selectedDuaId,
    selectedSahifaId,
    selectedZiyaratId,
    selectedMunajatId,
    selectedSurahNumber,
  ]);

  useEffect(() => {
    if (!initialEntryId) {
      setActiveSection(initialSection);
      if (isListFirstLibrarySection(initialSection)) {
        setOpenedEntryId(null);
      }
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
      return;
    }

    const mappedId =
      initialEntryId === 'dl-sahifa-m1'
        ? 'munajat-1'
        : initialEntryId === 'dl-sahifa-m2'
        ? 'munajat-2'
        : initialEntryId;

    if (mappedId.startsWith('dl-quran-')) {
      const num = Number(mappedId.replace('dl-quran-', ''));
      if (Number.isFinite(num) && num >= 1 && num <= 114) {
        setActiveSection('quran');
        setSelectedSurahNumber(num);
        setQuranSubFilter('all');
        setOpenedEntryId(null);
        return;
      }
    }

    if (allSahifa.some((s) => s.id === mappedId)) {
      setActiveSection('sahifa');
      setSelectedSahifaId(mappedId);
      setOpenedEntryId(mappedId);
    } else if (allDuas.some((d) => d.id === mappedId)) {
      setActiveSection('adiyat');
      setSelectedDuaId(mappedId);
      setDuaSubFilter('all');
      setOpenedEntryId(mappedId);
    } else if (allZiyarat.some((z) => z.id === mappedId)) {
      setActiveSection('ziyarat');
      setSelectedZiyaratId(mappedId);
      setZiyaratSubFilter('all');
      setOpenedEntryId(null);
    } else if (MUNAJAT_LIST.some((m) => m.id === mappedId)) {
      setActiveSection('munajat');
      setSelectedMunajatId(mappedId);
      setOpenedEntryId(mappedId);
    }
  }, [initialSection, initialEntryId, navigationNonce, allDuas, allSahifa, allZiyarat]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(22);
  const [nightMode, setNightMode] = useState<boolean>(isGlobalNightTheme);
  useEffect(() => {
    return subscribeAppAppearance((s) => setNightMode(s.colorTheme === 'night'));
  }, []);
  const [viewMode, setViewMode] = useState<ReaderViewMode>(() =>
    loadReaderViewMode()
  );
  const [bookPage, setBookPage] = useState<number>(0);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [justAwardedId, setJustAwardedId] = useState<string | null>(null);
  const [sharePayload, setSharePayload] = useState<ShareCardPayload | null>(null);

  const [offlineQuranCount, setOfflineQuranCount] = useState<number>(() =>
    getCachedOfflineSurahCount()
  );
  const [downloadingAllQuran, setDownloadingAllQuran] = useState<boolean>(false);

  const [surahAyat, setSurahAyat] = useState<string[]>(
    () => LOCAL_QURAN_SURAHS[1] || []
  );
  const [surahLoading, setSurahLoading] = useState<boolean>(false);
  const [surahError, setSurahError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState<number>(0);

  const activeDua = useMemo(
    () => allDuas.find((d) => d.id === selectedDuaId) || allDuas[0],
    [allDuas, selectedDuaId]
  );

  const activeSahifa = useMemo(
    () => allSahifa.find((s) => s.id === selectedSahifaId) || allSahifa[0],
    [allSahifa, selectedSahifaId]
  );

  const activeZiyarat = useMemo(
    () => allZiyarat.find((z) => z.id === selectedZiyaratId) || allZiyarat[0],
    [allZiyarat, selectedZiyaratId]
  );

  const activeMunajat = useMemo(
    () =>
      MUNAJAT_LIST.find((m) => m.id === selectedMunajatId) || MUNAJAT_LIST[0],
    [selectedMunajatId]
  );

  const activeSurah: QuranSurahMeta = useMemo(
    () =>
      QURAN_SURAHS_META.find((s) => s.number === selectedSurahNumber) ||
      QURAN_SURAHS_META[0],
    [selectedSurahNumber]
  );

  useEffect(() => {
    if (activeSection !== 'quran') return;

    const local = LOCAL_QURAN_SURAHS[selectedSurahNumber];
    if (local) {
      setSurahAyat(local);
      setSurahLoading(false);
      setSurahError(null);
      return;
    }

    const controller = new AbortController();
    setSurahLoading(true);
    setSurahError(null);

    fetchQuranSurahAyat(selectedSurahNumber, controller.signal)
      .then((ayat) => {
        setSurahAyat(ayat);
        setSurahLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setSurahAyat([]);
        setSurahLoading(false);
        setSurahError(
          'تعذر تحميل آيات السورة في الوقت الحالي. تأكد من اتصالك بالإنترنت ثم اضغط إعادة المحاولة، أو تصفح السور المتاحة دون إنترنت.'
        );
      });

    return () => controller.abort();
  }, [activeSection, selectedSurahNumber, retryToken]);

  const normalizedQuery = useMemo(
    () => normalizeArabicForSearch(searchQuery),
    [searchQuery]
  );

  const isSearching = normalizedQuery.length > 0;

  const isListFirstSection = isListFirstLibrarySection(activeSection);
  const currentTitleSearch = isListFirstSection
    ? titleSearchBySection[activeSection]
    : '';
  const normalizedTitleSearch = useMemo(
    () => normalizeArabicForSearch(currentTitleSearch),
    [currentTitleSearch]
  );

  const visibleListEntries = useMemo(() => {
    if (!isListFirstSection) return [];
    if (activeSection === 'adiyat') {
      return normalizedTitleSearch
        ? allDuas.filter((d) =>
            normalizeArabicForSearch(d.title).includes(normalizedTitleSearch)
          )
        : allDuas;
    }
    if (activeSection === 'sahifa') {
      return normalizedTitleSearch
        ? allSahifa.filter((s) =>
            normalizeArabicForSearch(s.title).includes(normalizedTitleSearch)
          )
        : allSahifa;
    }
    return normalizedTitleSearch
      ? MUNAJAT_LIST.filter((m) =>
          normalizeArabicForSearch(m.title).includes(normalizedTitleSearch)
        )
      : MUNAJAT_LIST;
  }, [
    isListFirstSection,
    activeSection,
    normalizedTitleSearch,
    allDuas,
    allSahifa,
  ]);

  const filteredDuasAndZiyarat = useMemo(() => {
    if (isSearching) {
      return [...allDuas, ...allSahifa, ...allZiyarat].filter((item) => {
        const titleMatch = normalizeArabicForSearch(item.title).includes(
          normalizedQuery
        );
        const subMatch = normalizeArabicForSearch(item.subtitle).includes(
          normalizedQuery
        );
        const groupMatch = normalizeArabicForSearch(item.groupLabel).includes(
          normalizedQuery
        );
        const bodyMatch = item.segments.some((seg) =>
          normalizeArabicForSearch(seg.content).includes(normalizedQuery)
        );
        return titleMatch || subMatch || groupMatch || bodyMatch;
      });
    }

    if (activeSection === 'ziyarat') {
      if (ziyaratSubFilter === 'all') return allZiyarat;
      if (ziyaratSubFilter === 'favorites') {
        return allZiyarat.filter((z) => bookmarkedIds.includes(z.id));
      }
      return allZiyarat.filter((z) => z.groupKey === ziyaratSubFilter);
    }

    return [];
  }, [
    isSearching,
    normalizedQuery,
    activeSection,
    ziyaratSubFilter,
    allDuas,
    allSahifa,
    allZiyarat,
    bookmarkedIds,
  ]);

  const filteredMunajat = useMemo(() => {
    if (isSearching) {
      return MUNAJAT_LIST.filter((m) => {
        const titleMatch = normalizeArabicForSearch(m.title).includes(
          normalizedQuery
        );
        const meaningMatch = normalizeArabicForSearch(m.quickMeaning).includes(
          normalizedQuery
        );
        const bodyMatch = m.verses.some((v) =>
          normalizeArabicForSearch(v).includes(normalizedQuery)
        );
        return titleMatch || meaningMatch || bodyMatch;
      });
    }
    return [];
  }, [isSearching, normalizedQuery]);

  const filteredSurahs = useMemo(() => {
    if (isSearching) {
      return QURAN_SURAHS_META.filter((surah) => {
        const arName = normalizeArabicForSearch(`سورة ${surah.name}`);
        const numMatch = String(surah.number) === normalizedQuery;
        const typeMatch = normalizeArabicForSearch(surah.type).includes(
          normalizedQuery
        );
        return arName.includes(normalizedQuery) || numMatch || typeMatch;
      });
    }

    if (activeSection !== 'quran') return [];
    if (quranSubFilter === 'local') {
      return QURAN_SURAHS_META.filter((s) => isSurahAvailableOffline(s.number));
    }
    if (quranSubFilter === 'favorites') {
      return QURAN_SURAHS_META.filter((s) =>
        bookmarkedIds.includes(`dl-quran-${s.number}`)
      );
    }
    if (quranSubFilter === 'meccan') {
      return QURAN_SURAHS_META.filter((s) => s.type === 'مكية');
    }
    if (quranSubFilter === 'medinan') {
      return QURAN_SURAHS_META.filter((s) => s.type === 'مدنية');
    }
    return QURAN_SURAHS_META;
  }, [isSearching, normalizedQuery, activeSection, quranSubFilter, bookmarkedIds]);

  const totalLibraryItems =
    allDuas.length +
    allSahifa.length +
    allZiyarat.length +
    MUNAJAT_LIST.length +
    QURAN_SURAHS_META.length;

  const totalCompletedDigital = useMemo(() => {
    const allIds = new Set<string>([
      ...allDuas.map((d) => d.id),
      ...allSahifa.map((s) => s.id),
      ...allZiyarat.map((z) => z.id),
      ...MUNAJAT_LIST.map((m) => m.id),
      ...QURAN_SURAHS_META.map((s) => `dl-quran-${s.number}`),
    ]);
    return completedReadingIds.filter((id) => allIds.has(id)).length;
  }, [completedReadingIds, allDuas, allSahifa, allZiyarat]);

  const khatmahSummary = useMemo(
    () => getKhatmahSummary(completedReadingIds),
    [completedReadingIds]
  );

  const activeReadingId =
    activeSection === 'quran'
      ? `dl-quran-${activeSurah.number}`
      : activeSection === 'munajat'
      ? activeMunajat.id
      : activeSection === 'sahifa'
      ? activeSahifa.id
      : activeSection === 'ziyarat'
      ? activeZiyarat.id
      : activeDua.id;

  const isInActiveReader = !isListFirstSection || openedEntryId !== null;

  useEffect(() => {
    if (!isInActiveReader) return;
    const title =
      activeSection === 'quran'
        ? `سورة ${activeSurah.name}`
        : activeSection === 'munajat'
        ? activeMunajat.title
        : activeSection === 'sahifa'
        ? activeSahifa.title
        : activeSection === 'ziyarat'
        ? activeZiyarat.title
        : activeDua.title;
    onSetLastRead?.(activeSection, activeReadingId, title);
  }, [activeSection, activeReadingId, isInActiveReader]);

  const isCurrentCompleted = completedReadingIds.includes(activeReadingId);
  const isCurrentBookmarked = bookmarkedIds.includes(activeReadingId);

  const handleDownloadAllQuranOffline = async () => {
    if (downloadingAllQuran) return;
    setDownloadingAllQuran(true);
    try {
      await cacheAllQuranSurahsOffline((cached) => {
        setOfflineQuranCount(cached);
      });
      setOfflineQuranCount(getCachedOfflineSurahCount());
    } finally {
      setDownloadingAllQuran(false);
    }
  };

  const handleOpenEntryFromList = (id: string) => {
    if (isListFirstSection) {
      listScrollYRef.current[activeSection] =
        typeof window !== 'undefined' ? window.scrollY : 0;
    }
    if (activeSection === 'adiyat') {
      setSelectedDuaId(id);
    } else if (activeSection === 'sahifa') {
      setSelectedSahifaId(id);
    } else if (activeSection === 'munajat') {
      setSelectedMunajatId(id);
    }
    setOpenedEntryId(id);
    setJustAwardedId(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const handleBackToList = () => {
    const restoreY = listScrollYRef.current[activeSection] ?? 0;
    setOpenedEntryId(null);
    setJustAwardedId(null);
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
      if (drawerOpen) {
        setDrawerOpen(false);
        return true;
      }
      if (isListFirstSection && openedEntryId !== null) {
        handleBackToList();
        return true;
      }
      return false;
    });
  }, [sharePayload, drawerOpen, isListFirstSection, openedEntryId, activeSection]);

  const handleSelectSection = (sec: DigitalLibrarySection) => {
    setActiveSection(sec);
    setJustAwardedId(null);
    if (isListFirstLibrarySection(sec)) {
      setOpenedEntryId(null);
      setDrawerOpen(false);
    }
  };

  const handleSelectDuaOrZiyarat = (item: UnifiedDuaOrZiyaratItem) => {
    setActiveSection(item.section);
    if (item.section === 'adiyat') {
      setSelectedDuaId(item.id);
      setOpenedEntryId(item.id);
    } else if (item.section === 'sahifa') {
      setSelectedSahifaId(item.id);
      setOpenedEntryId(item.id);
    } else {
      setSelectedZiyaratId(item.id);
      setOpenedEntryId(null);
    }
    setJustAwardedId(null);
    setDrawerOpen(false);
  };

  const handleSelectMunajat = (id: string) => {
    setActiveSection('munajat');
    setSelectedMunajatId(id);
    setOpenedEntryId(id);
    setJustAwardedId(null);
    setDrawerOpen(false);
  };

  const handleSelectSurah = (surahNumber: number) => {
    setActiveSection('quran');
    setSelectedSurahNumber(surahNumber);
    setOpenedEntryId(null);
    setJustAwardedId(null);
    setDrawerOpen(false);
  };

  const handleFinishReading = () => {
    const awarded = onCompleteReading(activeReadingId);
    if (awarded) {
      setJustAwardedId(activeReadingId);
    }
  };

  const handleOpenShareCard = () => {
    if (activeSection === 'quran') {
      const idx =
        activeUnitIndex >= 0 && surahAyat[activeUnitIndex] ? activeUnitIndex : 0;
      const ayahText =
        surahAyat[idx] || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
      setSharePayload({
        title: `سورة ${activeSurah.name}`,
        category: 'القرآن الكريم',
        quote: ayahText,
        attribution: `سورة ${activeSurah.name} — الآية ${toArabicDigits(idx + 1)}`,
      });
    } else if (activeSection === 'munajat') {
      const sample =
        activeMunajat.verses.find(
          (v) =>
            v.trim().length > 0 &&
            !v.includes('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')
        ) ||
        activeMunajat.verses[0] ||
        '';
      setSharePayload({
        title: activeMunajat.title,
        category: 'المناجاة الخمس عشرة',
        quote: sample,
        attribution: `${activeMunajat.title} — الإمام زين العابدين (عليه السلام)`,
      });
    } else {
      const firstSeg =
        currentDuaOrZiyaratItem.segments.find(
          (s) => s.type === 'text' && s.content.trim().length > 10
        ) || currentDuaOrZiyaratItem.segments[0];
      setSharePayload({
        title: currentDuaOrZiyaratItem.title,
        category:
          activeSection === 'ziyarat' ? 'الزيارات الشريفة' : 'الأدعية المباركة',
        quote: firstSeg?.content || '',
        attribution:
          currentDuaOrZiyaratItem.subtitle || currentDuaOrZiyaratItem.groupLabel,
      });
    }
  };

  const focusTrackerEnabled = focusSettings.enabled;
  const focusTheme = focusSettings.theme;
  const readerBodyRef = useRef<HTMLDivElement | null>(null);

  const munajatSplitParagraphs = useMemo(() => {
    let cursor = 0;
    return activeMunajat.verses.map((verse) => {
      const lines = splitIntoReadableLines(verse);
      return lines.map((text) => ({ text, unitIdx: cursor++ }));
    });
  }, [activeMunajat]);

  const currentDuaOrZiyaratItem =
    activeSection === 'ziyarat'
      ? activeZiyarat
      : activeSection === 'sahifa'
      ? activeSahifa
      : activeDua;

  const preparedSegments = useMemo(() => {
    let cursor = 0;
    return currentDuaOrZiyaratItem.segments.map((seg) => {
      if (seg.type === 'note') {
        return { type: 'note' as const, content: seg.content, lines: [] };
      }
      const lines = splitIntoReadableLines(seg.content).map((text) => ({
        text,
        unitIdx: cursor++,
      }));
      return { type: 'text' as const, content: seg.content, lines };
    });
  }, [currentDuaOrZiyaratItem]);

  const currentUnitCount = useMemo(() => {
    if (activeSection === 'quran') return surahAyat.length;
    if (activeSection === 'munajat') {
      return munajatSplitParagraphs.reduce((sum, p) => sum + p.length, 0);
    }
    return preparedSegments.reduce(
      (sum, seg) => sum + (seg.type === 'text' ? seg.lines.length : 0),
      0
    );
  }, [activeSection, surahAyat.length, munajatSplitParagraphs, preparedSegments]);

  const { activeUnitIndex, setActiveUnitIndex } = useReadingFocusTracker({
    resetKey: `${activeReadingId}:${surahAyat.length}:${openedEntryId || 'list'}`,
    unitCount: currentUnitCount,
    enabled:
      isInActiveReader &&
      focusTrackerEnabled &&
      viewMode === 'scroll' &&
      !surahLoading &&
      !surahError,
    contentRef: readerBodyRef,
  });

  const handleChangeViewMode = (mode: ReaderViewMode) => {
    setViewMode(mode);
    saveReaderViewMode(mode);
  };

  const fontClass =
    FONT_SIZE_CLASS_MAP[fontSize] || FONT_SIZE_CLASS_MAP[22];

  const hasSurahBismillah = activeSurah.number !== 1 && activeSurah.number !== 9;

  const quranSlices = useMemo(
    () => paginateQuranAyat(surahAyat, fontSize, hasSurahBismillah),
    [surahAyat, fontSize, hasSurahBismillah]
  );

  const munajatSlices = useMemo(() => {
    const blocks = munajatSplitParagraphs.map((lines, idx) => ({
      id: idx,
      lines,
      textLength: lines.reduce((sum, l) => sum + l.text.length, 0),
      unitIndices: lines.map((l) => l.unitIdx),
    }));
    return paginateProseBlocks(blocks, fontSize, true);
  }, [munajatSplitParagraphs, fontSize]);

  const duaSlices = useMemo(() => {
    const blocks = preparedSegments.map((seg, idx) => ({
      id: idx,
      seg,
      isNote: seg.type === 'note',
      textLength:
        seg.type === 'note'
          ? seg.content.length
          : seg.lines.reduce((sum, l) => sum + l.text.length, 0),
      unitIndices:
        seg.type === 'note' ? [] : seg.lines.map((l) => l.unitIdx),
    }));
    return paginateProseBlocks(
      blocks,
      fontSize,
      Boolean(currentDuaOrZiyaratItem.meaningSummary)
    );
  }, [preparedSegments, fontSize, currentDuaOrZiyaratItem.meaningSummary]);

  const activeBookTitle =
    activeSection === 'quran'
      ? `سورة ${activeSurah.name}`
      : activeSection === 'munajat'
      ? activeMunajat.title
      : currentDuaOrZiyaratItem.title;

  const activeBookSliceCount =
    activeSection === 'quran'
      ? quranSlices.length
      : activeSection === 'munajat'
      ? munajatSlices.length
      : duaSlices.length;

  // Restore book page matching saved reading position when opening an entry or once a surah loads
  const quranLoadedKey =
    activeSection === 'quran'
      ? `${activeReadingId}:${surahAyat.length}`
      : `${activeReadingId}:${openedEntryId || 'list'}`;

  useEffect(() => {
    if (!isInActiveReader) return;
    const savedUnit = getSavedReadingPosition(activeReadingId);
    if (savedUnit <= 0) {
      setBookPage(0);
      return;
    }

    if (activeSection === 'quran') {
      const idx = quranSlices.findIndex((slice) =>
        slice.ayat.some((a) => a.unitIndex === savedUnit)
      );
      setBookPage(idx >= 0 ? idx : 0);
    } else if (activeSection === 'munajat') {
      const idx = munajatSlices.findIndex((slice) =>
        slice.items.some((item) => item.unitIndices.includes(savedUnit))
      );
      setBookPage(idx >= 0 ? idx : 0);
    } else {
      const idx = duaSlices.findIndex((slice) =>
        slice.items.some((item) => item.unitIndices.includes(savedUnit))
      );
      setBookPage(idx >= 0 ? idx : 0);
    }
  }, [quranLoadedKey, isInActiveReader]);

  useEffect(() => {
    if (activeBookSliceCount > 0 && bookPage >= activeBookSliceCount) {
      setBookPage(Math.max(0, activeBookSliceCount - 1));
    }
  }, [activeBookSliceCount, bookPage]);

  const handleBookPageChange = (nextPage: number) => {
    setBookPage(nextPage);
    if (!isInActiveReader) return;

    if (activeSection === 'quran') {
      const slice = quranSlices[nextPage];
      const firstUnit = slice?.ayat[0]?.unitIndex;
      if (typeof firstUnit === 'number') {
        saveReadingPositionForKey(activeReadingId, firstUnit);
      }
      return;
    }

    if (activeSection === 'munajat') {
      const slice = munajatSlices[nextPage];
      const firstUnit = slice?.items.find((it) => it.unitIndices.length > 0)?.unitIndices[0];
      if (typeof firstUnit === 'number') {
        saveReadingPositionForKey(activeReadingId, firstUnit);
      }
      return;
    }

    const slice = duaSlices[nextPage];
    const firstUnit = slice?.items.find((it) => it.unitIndices.length > 0)?.unitIndices[0];
    if (typeof firstUnit === 'number') {
      saveReadingPositionForKey(activeReadingId, firstUnit);
    }
  };

  const activeBookPages: ManuscriptBookPage[] = useMemo(() => {
    if (activeSection === 'quran') {
      return quranSlices.map((slice, pageIdx) => ({
        id: `${activeReadingId}-quran-p-${slice.pageNumber}`,
        content: (
          <div className="max-w-prose mx-auto">
            {pageIdx === 0 && (
              <>
                <div className="mb-4">
                  <SurahCartoucheHeader
                    surahName={activeSurah.name}
                    revelationType={activeSurah.type}
                    ayahCountArabic={toArabicDigits(activeSurah.ayahCount)}
                    dark={nightMode}
                  />
                </div>
                {hasSurahBismillah && (
                  <div className="mb-5 text-center">
                    <p
                      className={`font-quran text-2xl sm:text-3xl ${
                        nightMode ? 'text-[#D9B96A]' : 'text-[#0F3D2E]'
                      }`}
                    >
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </p>
                    <ManuscriptDivider
                      variant="flourish"
                      dark={nightMode}
                      className="my-2"
                    />
                  </div>
                )}
              </>
            )}

            <p
              className={`font-quran text-justify ${fontClass} ${
                nightMode ? 'text-[#F3EBD6]' : 'text-[#11271F]'
              }`}
            >
              {slice.ayat.map((ayah) => {
                const isActive =
                  focusTrackerEnabled && activeUnitIndex === ayah.unitIndex;
                return (
                  <React.Fragment key={ayah.unitIndex}>
                    <span
                      data-reading-unit-index={ayah.unitIndex}
                      onMouseEnter={() => {
                        if (focusTrackerEnabled)
                          setActiveUnitIndex(ayah.unitIndex);
                      }}
                      onClick={() => {
                        if (!focusTrackerEnabled) return;
                        const sel = window.getSelection()?.toString();
                        if (sel && sel.trim().length > 0) return;
                        setActiveUnitIndex(ayah.unitIndex);
                      }}
                      className={getReadingUnitClasses({
                        isActive,
                        enabled: focusTrackerEnabled,
                        nightMode,
                        theme: focusTheme,
                      })}
                    >
                      {ayah.text}
                      <AyahRosetteMarker
                        numberArabic={toArabicDigits(ayah.ayahNumber)}
                        dark={nightMode}
                        highlighted={isActive}
                      />
                    </span>{' '}
                  </React.Fragment>
                );
              })}
            </p>
          </div>
        ),
      }));
    }

    if (activeSection === 'munajat') {
      return munajatSlices.map((slice, pageIdx) => ({
        id: `${activeReadingId}-munajat-p-${slice.pageNumber}`,
        content: (
          <div className="max-w-prose mx-auto">
            {pageIdx === 0 && (
              <>
                <div className="pb-4 border-b border-[#B8924A]/35">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                      nightMode ? 'text-[#D9B96A]' : 'text-[#1F6B50]'
                    }`}
                  >
                    <MunajatMoonIcon className="w-4 h-4" />
                    <span>
                      المناجاة رقم {toArabicDigits(activeMunajat.number)} من ١٥ · الإمام زين العابدين (عليه السلام)
                    </span>
                  </span>
                  <h2
                    className={`font-calligraphy font-bold text-2xl sm:text-4xl mt-1.5 ${
                      nightMode ? 'text-[#F3EBD6]' : 'text-[#0F3D2E]'
                    }`}
                  >
                    {activeMunajat.title}
                  </h2>
                </div>

                <div
                  className={`mt-4 rounded-[5px] p-4 border-r-[3px] border border-[#B8924A]/35 space-y-2 ${
                    nightMode
                      ? 'bg-[#081A14]/75 border-r-[#D9B96A] text-[#F3EBD6]'
                      : 'bg-[#F3ECDA]/65 border-r-[#B8924A] text-[#11271F]'
                  }`}
                >
                  <p className="text-sm leading-relaxed">
                    {activeMunajat.quickMeaning}
                  </p>
                  <div
                    className={`pt-2 border-t flex items-start gap-2 text-xs font-medium ${
                      nightMode
                        ? 'border-[#D9B96A]/20 text-[#D9B96A]'
                        : 'border-[#B8924A]/25 text-[#1F6B50]'
                    }`}
                  >
                    <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>العبرة: {activeMunajat.lifeLesson}</span>
                  </div>
                </div>

                <ManuscriptDivider variant="crescent" dark={nightMode} />
              </>
            )}

            <div className="mt-4 space-y-6">
              {slice.items.map((block) => (
                <p
                  key={block.id}
                  className={`font-arabic whitespace-pre-line ${fontClass} ${
                    nightMode ? 'text-[#F3EBD6]' : 'text-[#11271F]'
                  }`}
                >
                  {block.lines.map(({ text, unitIdx }) => {
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
          </div>
        ),
      }));
    }

    return duaSlices.map((slice, pageIdx) => ({
      id: `${activeReadingId}-dua-p-${slice.pageNumber}`,
      content: (
        <div className="max-w-prose mx-auto">
          {pageIdx === 0 && (
            <>
              <div className="pb-4 border-b border-[#B8924A]/35">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                    nightMode ? 'text-[#D9B96A]' : 'text-[#1F6B50]'
                  }`}
                >
                  {activeSection === 'ziyarat' ? (
                    <ShrineDomeIcon className="w-4 h-4" />
                  ) : (
                    <DuaScrollIcon className="w-4 h-4" />
                  )}
                  <span>
                    {currentDuaOrZiyaratItem.groupLabel} ·{' '}
                    {currentDuaOrZiyaratItem.subtitle}
                  </span>
                </span>
                <h2
                  className={`font-calligraphy font-bold text-2xl sm:text-4xl mt-1.5 ${
                    nightMode ? 'text-[#F3EBD6]' : 'text-[#0F3D2E]'
                  }`}
                >
                  {currentDuaOrZiyaratItem.title}
                </h2>
              </div>

              {currentDuaOrZiyaratItem.meaningSummary && (
                <div
                  className={`mt-4 rounded-[5px] p-4 border-r-[3px] border border-[#B8924A]/35 ${
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
                    معنى الدعاء باختصار
                  </p>
                  <p className="text-sm leading-relaxed">
                    {currentDuaOrZiyaratItem.meaningSummary}
                  </p>
                </div>
              )}

              <ManuscriptDivider variant="rosette" dark={nightMode} />
            </>
          )}

          <div className="mt-4 space-y-6">
            {slice.items.map(({ id, seg }) =>
              seg.type === 'note' ? (
                <div key={id}>
                  <span
                    className={
                      nightMode ? 'editorial-note-dark' : 'editorial-note'
                    }
                  >
                    {seg.content}
                  </span>
                </div>
              ) : (
                <p
                  key={id}
                  className={`font-arabic whitespace-pre-line ${fontClass} ${
                    nightMode ? 'text-[#F3EBD6]' : 'text-[#11271F]'
                  }`}
                >
                  {seg.lines.map(({ text, unitIdx }) => {
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
              )
            )}
          </div>
        </div>
      ),
    }));
  }, [
    activeSection,
    activeReadingId,
    quranSlices,
    munajatSlices,
    duaSlices,
    activeSurah,
    hasSurahBismillah,
    activeMunajat,
    currentDuaOrZiyaratItem,
    nightMode,
    fontClass,
    focusTrackerEnabled,
    focusTheme,
    activeUnitIndex,
  ]);

  const renderSidebarContent = () => {
    let lastGroupRendered = '';

    return (
      <div className="flex flex-col h-full">
        {/* Search Input */}
        <div className="relative mb-3">
          <Search
            className="w-4 h-4 text-[#1F6B50] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في السور والأدعية والمناجاة..."
            aria-label="البحث في المكتبة الدينية"
            className="w-full min-h-[42px] pr-9 pl-8 py-1.5 rounded-[5px] bg-[#F3ECDA]/65 focus:bg-[#FAF6EC] border border-[#B8924A]/45 focus:border-[#0F3D2E] text-sm font-medium text-[#11271F] placeholder:text-[#425B51]/75 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="مسح البحث"
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-[#425B51] hover:text-[#0F3D2E] cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Section Ledger Tabs */}
        <div
          role="tablist"
          aria-label="أقسام المكتبة المباركة"
          className="grid grid-cols-5 border-y border-[#B8924A]/35 mb-3 bg-[#F3ECDA]/55"
        >
          {SECTION_TABS.map((tab) => {
            const isActive = activeSection === tab.id && !isSearching;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeSection === tab.id}
                onClick={() => {
                  setSearchQuery('');
                  handleSelectSection(tab.id);
                }}
                className={`min-h-[40px] px-1 py-2 font-display font-bold text-[11px] sm:text-xs transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'bg-[#0F3D2E] text-[#FAF6EC] border-[#D9B96A]'
                    : 'text-[#11271F] border-transparent hover:bg-[#FAF6EC]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Contextual Architectural Sub-Filters */}
        {!isSearching && activeSection === 'adiyat' && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {DUA_SUBFILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDuaSubFilter(f.id)}
                className={`min-h-[32px] px-2.5 py-1 rounded-[4px] border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  duaSubFilter === f.id
                    ? 'bg-[#0F3D2E] text-[#FAF6EC] border-[#B8924A]'
                    : 'bg-[#FAF6EC] hover:bg-[#F3ECDA] text-[#425B51] border-[#B8924A]/35'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {!isSearching && activeSection === 'ziyarat' && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {ZIYARAT_SUBFILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setZiyaratSubFilter(f.id)}
                className={`min-h-[32px] px-2.5 py-1 rounded-[4px] border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  ziyaratSubFilter === f.id
                    ? 'bg-[#0F3D2E] text-[#FAF6EC] border-[#B8924A]'
                    : 'bg-[#FAF6EC] hover:bg-[#F3ECDA] text-[#425B51] border-[#B8924A]/35'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {!isSearching && activeSection === 'quran' && (
          <div className="space-y-2.5 mb-3">
            <div className="flex flex-wrap gap-1.5">
              {QURAN_SUBFILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setQuranSubFilter(f.id)}
                  className={`min-h-[32px] px-2.5 py-1 rounded-[4px] border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    quranSubFilter === f.id
                      ? 'bg-[#0F3D2E] text-[#FAF6EC] border-[#B8924A]'
                      : 'bg-[#FAF6EC] hover:bg-[#F3ECDA] text-[#425B51] border-[#B8924A]/35'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {offlineQuranCount < QURAN_SURAHS_META.length ? (
              <button
                type="button"
                onClick={handleDownloadAllQuranOffline}
                disabled={downloadingAllQuran}
                className="w-full min-h-[40px] px-3 py-2 btn-manuscript text-xs flex items-center justify-between gap-2 cursor-pointer disabled:opacity-75"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Download className="w-3.5 h-3.5 text-[#1F6B50] shrink-0" aria-hidden="true" />
                  <span className="truncate font-bold text-[#0F3D2E]">
                    {downloadingAllQuran
                      ? 'جارٍ حفظ المصحف أوفلاين...'
                      : 'حفظ المصحف كاملاً دون إنترنت'}
                  </span>
                </span>
                <span className="text-[11px] font-bold text-[#9C7835] tabular-nums shrink-0">
                  {toArabicDigits(offlineQuranCount)}/{toArabicDigits(QURAN_SURAHS_META.length)}
                </span>
              </button>
            ) : (
              <div className="px-3 py-2 rounded-[5px] bg-[#0F3D2E]/8 border border-[#1F6B50]/35 text-[#0F3D2E] text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#1F6B50] shrink-0" aria-hidden="true" />
                <span>المصحف كاملاً (١١٤ سورة) محفوظ دون إنترنت</span>
              </div>
            )}

            <div className="px-3 py-2 rounded-[5px] bg-[#F3ECDA]/70 border border-[#B8924A]/35 text-xs">
              <div className="flex items-center justify-between gap-2 font-bold text-[#0F3D2E] tabular-nums">
                <span>متابعة الختمة · {khatmahSummary.currentJuzInfo.name}</span>
                <span className="text-[#7A5E2A]">{toArabicDigits(khatmahSummary.percent)}٪</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-[2px] bg-[#B8924A]/20 overflow-hidden">
                <div
                  className="h-full bg-[#1F6B50] transition-all duration-300"
                  style={{ width: `${Math.max(2, khatmahSummary.percent)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Search Notice */}
        {isSearching && (
          <div className="mb-2 px-1 flex items-center justify-between text-xs font-bold text-[#7A5420]">
            <span className="tabular-nums">
              نتائج البحث (
              {toArabicDigits(
                filteredDuasAndZiyarat.length +
                  filteredMunajat.length +
                  filteredSurahs.length
              )}
              )
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="btn-text-ornate text-xs cursor-pointer"
            >
              إظهار الكل
            </button>
          </div>
        )}

        {/* Manuscript Index List */}
        <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-[#B8924A]/20 border-t border-[#B8924A]/25 pr-0.5 lg:max-h-[60vh]">
          {filteredDuasAndZiyarat.map((item) => {
            const selected =
              (activeSection === 'adiyat' &&
                item.section === 'adiyat' &&
                activeDua.id === item.id) ||
              (activeSection === 'ziyarat' &&
                item.section === 'ziyarat' &&
                activeZiyarat.id === item.id);
            const done = completedReadingIds.includes(item.id);
            const showGroupHeading =
              !isSearching && item.groupLabel !== lastGroupRendered;
            if (showGroupHeading) {
              lastGroupRendered = item.groupLabel;
            }

            return (
              <React.Fragment key={item.id}>
                {showGroupHeading && (
                  <div className="pt-3 pb-1.5 px-2 text-xs font-display font-bold text-[#9C7835] bg-[#F3ECDA]/60">
                    {item.groupLabel}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleSelectDuaOrZiyarat(item)}
                  className={`w-full text-right px-3 py-3 transition-colors cursor-pointer flex items-center justify-between gap-2.5 border-r-[3px] ${
                    selected
                      ? 'bg-[#F3ECDA]/90 border-[#B8924A] text-[#0F3D2E]'
                      : 'bg-transparent border-transparent hover:bg-[#F3ECDA]/45 text-[#11271F]'
                  }`}
                >
                  <div className="min-w-0">
                    {isSearching && (
                      <div className="text-[11px] font-bold text-[#9C7835] mb-0.5">
                        {item.section === 'adiyat' ? 'الأدعية' : 'الزيارات'} ·{' '}
                        {item.groupLabel}
                      </div>
                    )}
                    <h3 className="font-display font-bold text-sm sm:text-base leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#425B51] mt-0.5 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                  {done && (
                    <CheckCircle2
                      className="w-4 h-4 text-[#1F6B50] shrink-0"
                      aria-label="تمت قراءته"
                    />
                  )}
                </button>
              </React.Fragment>
            );
          })}

          {filteredMunajat.map((m) => {
            const selected =
              activeSection === 'munajat' && activeMunajat.id === m.id;
            const done = completedReadingIds.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMunajat(m.id)}
                className={`w-full text-right px-3 py-3 transition-colors cursor-pointer flex items-center justify-between gap-2.5 border-r-[3px] ${
                  selected
                    ? 'bg-[#F3ECDA]/90 border-[#B8924A] text-[#0F3D2E]'
                    : 'bg-transparent border-transparent hover:bg-[#F3ECDA]/45 text-[#11271F]'
                }`}
              >
                <div className="flex items-baseline gap-2.5 min-w-0">
                  <span className="font-arabic font-bold text-base text-[#9C7835] shrink-0 tabular-nums">
                    {toArabicDigits(m.number)}.
                  </span>
                  <div className="min-w-0">
                    {isSearching && (
                      <div className="text-[11px] font-bold text-[#9C7835]">
                        المناجاة الخمس عشرة
                      </div>
                    )}
                    <h3 className="font-display font-bold text-sm sm:text-base truncate">
                      {m.title}
                    </h3>
                    <p className="text-xs text-[#425B51] truncate">
                      {m.quickMeaning}
                    </p>
                  </div>
                </div>
                {done && (
                  <CheckCircle2
                    className="w-4 h-4 text-[#1F6B50] shrink-0"
                    aria-label="مقروءة"
                  />
                )}
              </button>
            );
          })}

          {filteredSurahs.map((surah) => {
            const selected =
              activeSection === 'quran' && activeSurah.number === surah.number;
            const readingId = `dl-quran-${surah.number}`;
            const done = completedReadingIds.includes(readingId);
            const isLocal = isSurahAvailableOffline(surah.number);

            return (
              <button
                key={surah.number}
                type="button"
                onClick={() => handleSelectSurah(surah.number)}
                className={`w-full text-right px-3 py-2.5 transition-colors cursor-pointer flex items-center justify-between gap-2.5 border-r-[3px] ${
                  selected
                    ? 'bg-[#F3ECDA]/90 border-[#B8924A] text-[#0F3D2E]'
                    : 'bg-transparent border-transparent hover:bg-[#F3ECDA]/45 text-[#11271F]'
                }`}
              >
                <div className="flex items-baseline gap-2.5 min-w-0">
                  <span className="font-arabic font-bold text-base text-[#9C7835] shrink-0 tabular-nums">
                    {toArabicDigits(surah.number)}.
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-sm sm:text-base truncate">
                      سورة {surah.name}
                    </h3>
                    <p className="text-xs text-[#425B51] tabular-nums">
                      {surah.type} · {toArabicDigits(surah.ayahCount)} آية
                      {isLocal ? ' · مخزنة' : ''}
                    </p>
                  </div>
                </div>

                {done && (
                  <CheckCircle2
                    className="w-4 h-4 text-[#1F6B50] shrink-0"
                    aria-label="تمت قراءتها"
                  />
                )}
              </button>
            );
          })}

          {filteredDuasAndZiyarat.length === 0 &&
            filteredMunajat.length === 0 &&
            filteredSurahs.length === 0 && (
              <div className="text-center py-8 px-4">
                <p className="font-display font-bold text-[#425B51] text-sm">
                  لم نجد نتائج مطابقة لعبارة البحث.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 btn-text-ornate text-xs cursor-pointer"
                >
                  عرض جميع المواد
                </button>
              </div>
            )}
        </div>
      </div>
    );
  };

  // List-First UX for Adiyat, Sahifa, and Munajat:
  // 1) Direct single flat list with simple live title search
  if (isListFirstSection && openedEntryId === null) {
    const sectionMeta =
      activeSection === 'sahifa'
        ? {
            title: 'الصحيفة السجادية',
            subtitle: `${toArabicDigits(allSahifa.length)} دعاءً مأثوراً للإمام السجاد (عليه السلام)`,
            icon: <ScrollText className="w-6 h-6 text-[#B8924A] shrink-0" aria-hidden="true" />,
            emptyLabel: 'عرض جميع أدعية الصحيفة',
          }
        : activeSection === 'munajat'
        ? {
            title: 'المناجاة الخمس عشرة',
            subtitle: `${toArabicDigits(MUNAJAT_LIST.length)} مناجاة للإمام زين العابدين (عليه السلام)`,
            icon: <MunajatMoonIcon className="w-6 h-6 text-[#B8924A] shrink-0" />,
            emptyLabel: 'عرض جميع المناجاة',
          }
        : {
            title: 'الأدعية ومفاتيح الجنان',
            subtitle: `${toArabicDigits(allDuas.length)} دعاءً مباركاً · أتممت ${toArabicDigits(
              allDuas.filter((d) => completedReadingIds.includes(d.id)).length
            )}`,
            icon: <DuaScrollIcon className="w-6 h-6 text-[#B8924A] shrink-0" />,
            emptyLabel: 'عرض جميع الأدعية',
          };

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
                {sectionMeta.icon}
                <span>{sectionMeta.title}</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#425B51] mt-0.5 tabular-nums">
                {sectionMeta.subtitle}
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

        {/* Simple Live Title Search Box */}
        <div className="relative mb-4">
          <Search
            className="w-4 h-4 text-[#1F6B50] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={currentTitleSearch}
            onChange={(e) => {
              const val = e.target.value;
              setTitleSearchBySection((prev) => ({
                ...prev,
                [activeSection]: val,
              }));
            }}
            placeholder="ابحث في العناوين..."
            aria-label={`ابحث في عناوين ${sectionMeta.title}`}
            className="w-full min-h-[46px] pr-10 pl-10 py-2 rounded-[6px] bg-[#FAF6EC] focus:bg-white border border-[#B8924A]/55 focus:border-[#0F3D2E] text-sm font-medium text-[#11271F] placeholder:text-[#425B51]/75 focus:outline-none transition-colors"
          />
          {currentTitleSearch && (
            <button
              type="button"
              onClick={() =>
                setTitleSearchBySection((prev) => ({
                  ...prev,
                  [activeSection]: '',
                }))
              }
              aria-label="مسح البحث"
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-[#425B51] hover:text-[#0F3D2E] cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Single Flat List — No Sidebar Index, No Sub-Sections */}
        <div className="manuscript-folio paper-grain rounded-[6px] divide-y divide-[#B8924A]/20 overflow-hidden">
          {visibleListEntries.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <p className="font-display font-bold text-sm text-[#425B51]">
                لم نعثر على عنوان مطابق لـ «{currentTitleSearch}».
              </p>
              <button
                type="button"
                onClick={() =>
                  setTitleSearchBySection((prev) => ({
                    ...prev,
                    [activeSection]: '',
                  }))
                }
                className="mt-2 btn-text-ornate text-xs cursor-pointer"
              >
                {sectionMeta.emptyLabel}
              </button>
            </div>
          ) : (
            visibleListEntries.map((entry) => {
              const id = entry.id;
              const title = entry.title;
              const subtitle =
                'subtitle' in entry ? entry.subtitle : entry.quickMeaning;
              const done = completedReadingIds.includes(id);
              const fav = bookmarkedIds.includes(id);
              const hasProgress = !done && getSavedReadingPosition(id) > 0;

              return (
                <div
                  key={id}
                  onClick={() => handleOpenEntryFromList(id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenEntryFromList(id);
                    }
                  }}
                  className="w-full text-right px-4 sm:px-5 py-3.5 hover:bg-[#F3ECDA]/75 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display font-bold text-base sm:text-lg text-[#0F3D2E] group-hover:text-[#1F6B50] leading-snug">
                      {title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 text-xs text-[#425B51]">
                      <span className="truncate">{subtitle}</span>
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
                        aria-label="تمت قراءته"
                      />
                    )}
                    {onToggleBookmark && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(id);
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

  // 2) Full-Page Single Entry Reader for Adiyat, Sahifa, and Munajat
  if (isListFirstSection && openedEntryId !== null) {
    const readerTitle =
      activeSection === 'munajat'
        ? activeMunajat.title
        : currentDuaOrZiyaratItem.title;
    const readerSubtitle =
      activeSection === 'munajat'
        ? `المناجاة رقم ${toArabicDigits(activeMunajat.number)} من ١٥ · الإمام زين العابدين (عليه السلام)`
        : currentDuaOrZiyaratItem.subtitle;

    return (
      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-4 mb-5 border-b border-[#B8924A]/35">
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
                {readerTitle}
              </h1>
              <p className="text-xs text-[#425B51] truncate mt-0.5">
                {readerSubtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div
              role="group"
              aria-label="نمط عرض الصفحات"
              className="inline-flex items-center bg-[#FAF6EC] border border-[#B8924A]/50 rounded-[6px] p-0.5"
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

            <div className="inline-flex items-center bg-[#FAF6EC] border border-[#B8924A]/50 rounded-[6px] p-0.5">
              <button
                type="button"
                onClick={() =>
                  setFontSize((s) => Math.max(MIN_FONT_SIZE, s - FONT_STEP))
                }
                disabled={fontSize <= MIN_FONT_SIZE}
                aria-label="تصغير الخط"
                className="min-h-[38px] min-w-[38px] px-2 hover:bg-[#F3ECDA] disabled:opacity-40 text-[#0F3D2E] font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="text-xs">أ-</span>
              </button>
              <span
                className="px-2.5 text-xs font-bold text-[#0F3D2E] border-x border-[#B8924A]/30 tabular-nums"
                dir="ltr"
              >
                {fontSize}px
              </span>
              <button
                type="button"
                onClick={() =>
                  setFontSize((s) => Math.min(MAX_FONT_SIZE, s + FONT_STEP))
                }
                disabled={fontSize >= MAX_FONT_SIZE}
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
                  ? 'bg-[#081A14] text-[#D9B96A] border-[#D9B96A]/65 hover:bg-[#0E2920]'
                  : 'btn-manuscript'
              }`}
            >
              {nightMode ? (
                <>
                  <Sun className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
                  <span>ورق نهاري</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
                  <span>مخطوط ليلي</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="إعدادات تغميق القراءة والتطبيق"
              className="min-h-[42px] px-3 py-2 btn-manuscript text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <AstrolabeIcon className="w-4 h-4 text-[#1F6B50]" />
              <span>الإعدادات</span>
            </button>
          </div>
        </div>

        {viewMode === 'book' ? (
          <section aria-label="لوحة القراءة بنمط الكتاب" className="space-y-4">
            <div
              className={`rounded-[6px] border p-4 sm:p-5 transition-colors duration-300 ${
                nightMode
                  ? 'manuscript-folio-dark'
                  : 'manuscript-folio paper-grain text-[#11271F]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {onToggleBookmark && (
                    <button
                      type="button"
                      onClick={() => onToggleBookmark(activeReadingId)}
                      aria-label={isCurrentBookmarked ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                      className={`min-h-[38px] px-3 py-1 rounded-[5px] border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isCurrentBookmarked
                          ? nightMode
                            ? 'bg-[#D9B96A]/20 border-[#D9B96A] text-[#D9B96A]'
                            : 'bg-[#F3ECDA] border-[#B8924A] text-[#0F3D2E]'
                          : nightMode
                          ? 'bg-[#081A14] border-[#B8924A]/35 text-[#F3EBD6]/80 hover:text-[#D9B96A]'
                          : 'bg-[#FAF6EC] border-[#B8924A]/40 text-[#425B51] hover:border-[#B8924A]'
                      }`}
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${isCurrentBookmarked ? 'fill-current' : ''}`}
                        aria-hidden="true"
                      />
                      <span>{isCurrentBookmarked ? 'في المفضلة' : 'حفظ العلامة'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleOpenShareCard}
                    className={`min-h-[38px] px-3 py-1 rounded-[5px] border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      nightMode
                        ? 'bg-[#081A14] border-[#B8924A]/35 text-[#D9B96A] hover:border-[#D9B96A]'
                        : 'bg-[#FAF6EC] border-[#B8924A]/45 text-[#0F3D2E] hover:bg-[#F3ECDA]'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>مشاركة كبطاقة</span>
                  </button>

                  {isCurrentCompleted && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold ${
                        nightMode ? 'text-[#D9B96A]' : 'text-[#1F6B50]'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>مقروء</span>
                    </span>
                  )}
                </div>
              </div>

              <AudioReciterPlayer
                mode="entry"
                entryId={activeReadingId}
                entryTitle={readerTitle}
                tracks={ENTRY_AUDIO_TRACKS[activeReadingId] || []}
                nightMode={nightMode}
              />
            </div>

            <ManuscriptBookFlip
              bookKey={activeReadingId}
              title={activeBookTitle}
              pages={activeBookPages}
              currentPage={bookPage}
              onPageChange={handleBookPageChange}
              nightMode={nightMode}
              pageFlipSoundEnabled={focusSettings.pageFlipSound}
              colophonFooter={
                <div className="space-y-3">
                  {justAwardedId === activeReadingId && (
                    <div className="rounded-[5px] bg-[#0F3D2E] border border-[#D9B96A]/65 text-[#FAF6EC] p-3.5 font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#D9B96A]" aria-hidden="true" />
                      <span>تقبّل الله طاعتك! تم تسجيل إتمام هذه القراءة المباركة</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {isCurrentCompleted ? (
                      <div
                        className={`flex items-center gap-2 font-display font-bold text-sm sm:text-base ${
                          nightMode ? 'text-[#D9B96A]' : 'text-[#1F6B50]'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                        <span>أتممت هذه القراءة المباركة</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleFinishReading}
                        className="min-h-[46px] px-7 py-2 btn-gilded text-base flex items-center gap-2.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                        <span>أتممت القراءة</span>
                      </button>
                    )}
                  </div>
                </div>
              }
            />
          </section>
        ) : (
          <motion.section
            key={activeReadingId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            aria-label="لوحة القراءة"
            className={`relative rounded-[6px] p-5 sm:p-8 lg:p-11 transition-colors duration-300 paper-grain ${
              nightMode ? 'manuscript-folio-dark' : 'manuscript-folio text-[#11271F]'
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
            <ManuscriptCornerBracket
              position="bottom-right"
              color={nightMode ? '#D9B96A' : '#B8924A'}
              className="absolute bottom-2.5 right-2.5"
            />
            <ManuscriptCornerBracket
              position="bottom-left"
              color={nightMode ? '#D9B96A' : '#B8924A'}
              className="absolute bottom-2.5 left-2.5"
            />

            <div className="pt-2 pb-4 border-b border-[#B8924A]/35 flex flex-wrap items-start justify-between gap-3">
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                    nightMode ? 'text-[#D9B96A]' : 'text-[#1F6B50]'
                  }`}
                >
                  {activeSection === 'munajat' ? (
                    <MunajatMoonIcon className="w-4 h-4" />
                  ) : (
                    <DuaScrollIcon className="w-4 h-4" />
                  )}
                  <span>{readerSubtitle}</span>
                </span>
                <h2
                  className={`font-calligraphy font-bold text-2xl sm:text-4xl mt-1.5 ${
                    nightMode ? 'text-[#F3EBD6]' : 'text-[#0F3D2E]'
                  }`}
                >
                  {readerTitle}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {onToggleBookmark && (
                  <button
                    type="button"
                    onClick={() => onToggleBookmark(activeReadingId)}
                    aria-label={isCurrentBookmarked ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                    className={`min-h-[38px] px-3 py-1 rounded-[5px] border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      isCurrentBookmarked
                        ? nightMode
                          ? 'bg-[#D9B96A]/20 border-[#D9B96A] text-[#D9B96A]'
                          : 'bg-[#F3ECDA] border-[#B8924A] text-[#0F3D2E]'
                        : nightMode
                        ? 'bg-[#081A14] border-[#B8924A]/35 text-[#F3EBD6]/80 hover:text-[#D9B96A]'
                        : 'bg-[#FAF6EC] border-[#B8924A]/40 text-[#425B51] hover:border-[#B8924A]'
                    }`}
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${isCurrentBookmarked ? 'fill-current' : ''}`}
                      aria-hidden="true"
                    />
                    <span>{isCurrentBookmarked ? 'في المفضلة' : 'حفظ العلامة'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleOpenShareCard}
                  className={`min-h-[38px] px-3 py-1 rounded-[5px] border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    nightMode
                      ? 'bg-[#081A14] border-[#B8924A]/35 text-[#D9B96A] hover:border-[#D9B96A]'
                      : 'bg-[#FAF6EC] border-[#B8924A]/45 text-[#0F3D2E] hover:bg-[#F3ECDA]'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>مشاركة كبطاقة</span>
                </button>

                {isCurrentCompleted && (
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

            <AudioReciterPlayer
              mode="entry"
              entryId={activeReadingId}
              entryTitle={readerTitle}
              tracks={ENTRY_AUDIO_TRACKS[activeReadingId] || []}
              nightMode={nightMode}
            />

            {activeSection === 'munajat' ? (
              <>
                <div
                  className={`mt-5 rounded-[5px] p-4 sm:p-5 border-r-[3px] border border-[#B8924A]/35 space-y-2.5 ${
                    nightMode
                      ? 'bg-[#081A14]/75 border-r-[#D9B96A] text-[#F3EBD6]'
                      : 'bg-[#F3ECDA]/65 border-r-[#B8924A] text-[#11271F]'
                  }`}
                >
                  <p className="text-sm sm:text-base leading-relaxed">
                    {activeMunajat.quickMeaning}
                  </p>
                  <div
                    className={`pt-2 border-t flex items-start gap-2 text-xs sm:text-sm font-medium ${
                      nightMode
                        ? 'border-[#D9B96A]/20 text-[#D9B96A]'
                        : 'border-[#B8924A]/25 text-[#1F6B50]'
                    }`}
                  >
                    <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>العبرة: {activeMunajat.lifeLesson}</span>
                  </div>
                </div>

                <ManuscriptDivider variant="crescent" dark={nightMode} />

                <div className="mt-4 max-w-prose mx-auto space-y-6" ref={readerBodyRef}>
                  {munajatSplitParagraphs.map((lines, idx) => (
                    <p
                      key={idx}
                      className={`font-arabic whitespace-pre-line ${fontClass} ${
                        nightMode ? 'text-[#F3EBD6]' : 'text-[#11271F]'
                      }`}
                    >
                      {lines.map(({ text, unitIdx }) => {
                        const trailingNewlinesMatch = text.match(/\n+$/);
                        const visibleChunk = trailingNewlinesMatch
                          ? text.slice(
                              0,
                              text.length - trailingNewlinesMatch[0].length
                            )
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
                                if (focusTrackerEnabled)
                                  setActiveUnitIndex(unitIdx);
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
              </>
            ) : (
              <>
                {currentDuaOrZiyaratItem.meaningSummary && (
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
                      معنى الدعاء باختصار
                    </p>
                    <p className="text-sm sm:text-base leading-relaxed">
                      {currentDuaOrZiyaratItem.meaningSummary}
                    </p>
                  </div>
                )}

                <ManuscriptDivider variant="rosette" dark={nightMode} />

                <div className="mt-4 max-w-prose mx-auto space-y-6" ref={readerBodyRef}>
                  {preparedSegments.map((seg, idx) =>
                    seg.type === 'note' ? (
                      <div key={idx}>
                        <span
                          className={
                            nightMode ? 'editorial-note-dark' : 'editorial-note'
                          }
                        >
                          {seg.content}
                        </span>
                      </div>
                    ) : (
                      <p
                        key={idx}
                        className={`font-arabic whitespace-pre-line ${fontClass} ${
                          nightMode ? 'text-[#F3EBD6]' : 'text-[#11271F]'
                        }`}
                      >
                        {seg.lines.map(({ text, unitIdx }) => {
                          const trailingNewlinesMatch = text.match(/\n+$/);
                          const visibleChunk = trailingNewlinesMatch
                            ? text.slice(
                                0,
                                text.length - trailingNewlinesMatch[0].length
                              )
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
                                  if (focusTrackerEnabled)
                                    setActiveUnitIndex(unitIdx);
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
                    )
                  )}
                </div>
              </>
            )}

            {justAwardedId === activeReadingId && (
              <div className="mt-6 rounded-[5px] bg-[#0F3D2E] border border-[#D9B96A]/65 text-[#FAF6EC] p-3.5 font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#D9B96A]" aria-hidden="true" />
                <span>تقبّل الله طاعتك! تم تسجيل إتمام هذه القراءة المباركة</span>
              </div>
            )}

            <div className="mt-8 pt-5 border-t border-[#B8924A]/35 flex flex-wrap items-center justify-between gap-4">
              {isCurrentCompleted ? (
                <div
                  className={`flex items-center gap-2 font-display font-bold text-sm sm:text-base ${
                    nightMode ? 'text-[#D9B96A]' : 'text-[#1F6B50]'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                  <span>أتممت هذه القراءة المباركة</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishReading}
                  className="min-h-[48px] px-7 py-2.5 btn-gilded text-base sm:text-lg flex items-center gap-2.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                  <span>أتممت القراءة</span>
                </button>
              )}
            </div>
          </motion.section>
        )}

        <ShareCardModal
          payload={sharePayload}
          onClose={() => setSharePayload(null)}
        />
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Editorial Masthead Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4 pb-4 mb-5 border-b border-[#B8924A]/35">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBackHome}
            className="min-h-[42px] px-3.5 py-2 btn-manuscript text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <ArrowRight className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
            <span>الرئيسية</span>
          </button>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden min-h-[42px] px-3.5 py-2 btn-emerald text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Menu className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
            <span>الفهرس والأقسام</span>
          </button>

          <div>
            <h1 className="font-calligraphy font-bold text-2xl sm:text-3xl text-[#0F3D2E] flex items-center gap-2.5">
              {activeSection === 'quran' ? (
                <QuranBookIcon className="w-6 h-6 text-[#B8924A] shrink-0" />
              ) : activeSection === 'ziyarat' ? (
                <ShrineDomeIcon className="w-6 h-6 text-[#B8924A] shrink-0" />
              ) : activeSection === 'munajat' ? (
                <MunajatMoonIcon className="w-6 h-6 text-[#B8924A] shrink-0" />
              ) : (
                <DuaScrollIcon className="w-6 h-6 text-[#B8924A] shrink-0" />
              )}
              <span>خزانة القرآن والأدعية</span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#425B51] mt-0.5 tabular-nums">
              الأدعية ({toArabicDigits(allDuas.length)}) · الزيارات ({toArabicDigits(allZiyarat.length)}) · المناجاة ({toArabicDigits(MUNAJAT_LIST.length)}) · المصحف الشريف ({toArabicDigits(QURAN_SURAHS_META.length)}) · أتممت {toArabicDigits(totalCompletedDigital)} من {toArabicDigits(totalLibraryItems)}
            </p>
          </div>
        </div>

        {/* Book View Toggle, Typographic Size, Night Ink Toggle & Settings */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="نمط عرض الصفحات"
            className="inline-flex items-center bg-[#FAF6EC] border border-[#B8924A]/50 rounded-[6px] p-0.5"
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

          {onOpenTasbih && (
            <button
              type="button"
              onClick={onOpenTasbih}
              className="min-h-[42px] px-3.5 py-2 btn-emerald text-xs sm:text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <TasbihBeadsIcon className="w-4 h-4 text-[#D9B96A]" />
              <span>المسبحة</span>
            </button>
          )}

          <div className="inline-flex items-center bg-[#FAF6EC] border border-[#B8924A]/50 rounded-[6px] p-0.5">
            <button
              type="button"
              onClick={() =>
                setFontSize((s) => Math.max(MIN_FONT_SIZE, s - FONT_STEP))
              }
              disabled={fontSize <= MIN_FONT_SIZE}
              aria-label="تصغير الخط"
              className="min-h-[38px] min-w-[38px] px-2 hover:bg-[#F3ECDA] disabled:opacity-40 text-[#0F3D2E] font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="text-xs">أ-</span>
            </button>
            <span
              className="px-2.5 text-xs font-bold text-[#0F3D2E] border-x border-[#B8924A]/30 tabular-nums"
              dir="ltr"
            >
              {fontSize}px
            </span>
            <button
              type="button"
              onClick={() =>
                setFontSize((s) => Math.min(MAX_FONT_SIZE, s + FONT_STEP))
              }
              disabled={fontSize >= MAX_FONT_SIZE}
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
                ? 'bg-[#081A14] text-[#D9B96A] border-[#D9B96A]/65 hover:bg-[#0E2920]'
                : 'btn-manuscript'
            }`}
          >
            {nightMode ? (
              <>
                <Sun className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
                <span>ورق نهاري</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
                <span>مخطوط ليلي</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="إعدادات تغميق القراءة والتطبيق"
            className="min-h-[42px] px-3 py-2 btn-manuscript text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <AstrolabeIcon className="w-4 h-4 text-[#1F6B50]" />
            <span>الإعدادات</span>
          </button>
        </div>
      </div>

      {/* Mobile Manuscript Index Drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="فهرس المكتبة الدينية"
        >
          <div
            className="fixed inset-0 bg-[#081A14]/65 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative z-10 w-[90%] max-w-sm bg-[#FAF6EC] paper-grain h-full p-4 shadow-2xl border-l border-[#B8924A] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#B8924A]/35">
              <h2 className="font-calligraphy font-bold text-xl text-[#0F3D2E]">
                فهرس الخزانة المباركة
              </h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="إغلاق الفهرس"
                className="min-h-[40px] min-w-[40px] btn-manuscript flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5 text-[#0F3D2E]" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">{renderSidebarContent()}</div>
          </div>
        </div>
      )}

      {/* Main Asymmetric Ledger Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Desktop Index Column */}
        <aside className="hidden lg:block lg:col-span-4 manuscript-folio paper-grain rounded-[6px] p-4 sticky top-20">
          {renderSidebarContent()}
        </aside>

        {/* Illuminated Manuscript / Mushaf Reader Folio (3D Flip Book OR Continuous Scroll) */}
        {viewMode === 'book' ? (
          <section
            aria-label="لوحة القراءة بنمط الكتاب"
            className="lg:col-span-8 space-y-4"
          >
            {/* Persistent Top Title / Bookmark / Audio Bar */}
            <div
              className={`rounded-[6px] border p-4 sm:p-5 transition-colors duration-300 ${
                nightMode
                  ? 'manuscript-folio-dark'
                  : 'manuscript-folio paper-grain text-[#11271F]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <span
                    className={`text-xs font-medium block ${
                      nightMode ? 'text-[#D9B96A]' : 'text-[#7A5E2A]'
                    }`}
                  >
                    {activeSection === 'quran'
                      ? `القرآن الكريم · السورة رقم ${toArabicDigits(activeSurah.number)}`
                      : activeSection === 'munajat'
                      ? `المناجاة رقم ${toArabicDigits(activeMunajat.number)} من ١٥`
                      : currentDuaOrZiyaratItem.groupLabel}
                  </span>
                  <h2
                    className={`font-calligraphy font-bold text-xl sm:text-2xl truncate ${
                      nightMode ? 'text-[#F3EBD6]' : 'text-[#0F3D2E]'
                    }`}
                  >
                    {activeBookTitle}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {onToggleBookmark && (
                    <button
                      type="button"
                      onClick={() => onToggleBookmark(activeReadingId)}
                      aria-label={isCurrentBookmarked ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                      className={`min-h-[38px] px-3 py-1 rounded-[5px] border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isCurrentBookmarked
                          ? nightMode
                            ? 'bg-[#D9B96A]/20 border-[#D9B96A] text-[#D9B96A]'
                            : 'bg-[#F3ECDA] border-[#B8924A] text-[#0F3D2E]'
                          : nightMode
                            ? 'bg-[#081A14] border-[#B8924A]/35 text-[#F3EBD6]/80 hover:text-[#D9B96A]'
                            : 'bg-[#FAF6EC] border-[#B8924A]/40 text-[#425B51] hover:border-[#B8924A]'
                      }`}
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${isCurrentBookmarked ? 'fill-current' : ''}`}
                        aria-hidden="true"
                      />
                      <span>{isCurrentBookmarked ? 'في المفضلة' : 'حفظ العلامة'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleOpenShareCard}
                    className={`min-h-[38px] px-3 py-1 rounded-[5px] border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      nightMode
                        ? 'bg-[#081A14] border-[#B8924A]/35 text-[#D9B96A] hover:border-[#D9B96A]'
                        : 'bg-[#FAF6EC] border-[#B8924A]/45 text-[#0F3D2E] hover:bg-[#F3ECDA]'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>مشاركة كبطاقة</span>
                  </button>

                  {isCurrentCompleted && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold ${
                        nightMode ? 'text-[#D9B96A]' : 'text-[#1F6B50]'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>مقروء</span>
                    </span>
                  )}
                </div>
              </div>

              {activeSection === 'quran' ? (
                <AudioReciterPlayer
                  mode="quran"
                  surahNumber={activeSurah.number}
                  surahName={activeSurah.name}
                  nightMode={nightMode}
                />
              ) : activeSection === 'munajat' ? (
                <AudioReciterPlayer
                  mode="entry"
                  entryId={activeMunajat.id}
                  entryTitle={activeMunajat.title}
                  tracks={ENTRY_AUDIO_TRACKS[activeMunajat.id] || []}
                  nightMode={nightMode}
                />
              ) : (
                <AudioReciterPlayer
                  mode="entry"
                  entryId={currentDuaOrZiyaratItem.id}
                  entryTitle={currentDuaOrZiyaratItem.title}
                  tracks={ENTRY_AUDIO_TRACKS[currentDuaOrZiyaratItem.id] || []}
                  nightMode={nightMode}
                />
              )}
            </div>

            {activeSection === 'quran' && surahLoading ? (
              <div
                className={`rounded-[6px] p-8 ${
                  nightMode ? 'manuscript-folio-dark' : 'manuscript-folio paper-grain'
                }`}
              >
                <ManuscriptSpinner
                  label={`جارٍ إحضار آيات سورة ${activeSurah.name}...`}
                  dark={nightMode}
                />
              </div>
            ) : activeSection === 'quran' && surahError ? (
              <div
                className={`rounded-[6px] p-6 text-center border ${
                  nightMode
                    ? 'bg-[#081A14] border-[#D9B96A]/45 text-[#F3EBD6]'
                    : 'bg-[#F3ECDA]/75 border-[#B8924A]/50 text-[#11271F]'
                }`}
              >
                <p className="font-display font-bold text-base leading-relaxed">
                  {surahError}
                </p>
                <button
                  type="button"
                  onClick={() => setRetryToken((t) => t + 1)}
                  className="mt-4 min-h-[42px] px-5 py-2 btn-emerald text-sm inline-flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
                  <span>إعادة المحاولة</span>
                </button>
              </div>
            ) : (
              <ManuscriptBookFlip
                bookKey={activeReadingId}
                title={activeBookTitle}
                pages={activeBookPages}
                currentPage={bookPage}
                onPageChange={handleBookPageChange}
                nightMode={nightMode}
                pageFlipSoundEnabled={focusSettings.pageFlipSound}
                colophonFooter={
                  <div className="space-y-3">
                    {justAwardedId === activeReadingId && (
                      <div className="rounded-[5px] bg-[#0F3D2E] border border-[#D9B96A]/65 text-[#FAF6EC] p-3.5 font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2">
                        <CheckCircle2
                          className="w-5 h-5 text-[#D9B96A]"
                          aria-hidden="true"
                        />
                        <span>تقبّل الله طاعتك! تم تسجيل إتمام هذه القراءة المباركة</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      {isCurrentCompleted ? (
                        <div
                          className={`flex items-center gap-2 font-display font-bold text-sm sm:text-base ${
                            nightMode ? 'text-[#D9B96A]' : 'text-[#1F6B50]'
                          }`}
                        >
                          <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                          <span>أتممت هذه القراءة المباركة</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleFinishReading}
                          className="min-h-[46px] px-7 py-2 btn-gilded text-base flex items-center gap-2.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                          <span>أتممت القراءة</span>
                        </button>
                      )}
                    </div>
                  </div>
                }
              />
            )}
          </section>
        ) : (
        <motion.section
          key={activeReadingId}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          aria-label="لوحة القراءة"
          className={`lg:col-span-8 relative rounded-[6px] p-5 sm:p-8 lg:p-11 transition-colors duration-300 paper-grain ${
            nightMode ? 'manuscript-folio-dark' : 'manuscript-folio text-[#11271F]'
          }`}
        >
          {/* Four Illuminated Corner Brackets */}
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
          <ManuscriptCornerBracket
            position="bottom-right"
            color={nightMode ? '#D9B96A' : '#B8924A'}
            className="absolute bottom-2.5 right-2.5"
          />
          <ManuscriptCornerBracket
            position="bottom-left"
            color={nightMode ? '#D9B96A' : '#B8924A'}
            className="absolute bottom-2.5 left-2.5"
          />

          {activeSection === 'quran' ? (
            <>
              {/* Authentic Mushaf Cartouche Header */}
              <div className="pt-2">
                <SurahCartoucheHeader
                  surahName={activeSurah.name}
                  revelationType={activeSurah.type}
                  ayahCountArabic={toArabicDigits(activeSurah.ayahCount)}
                  dark={nightMode}
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
                  <span
                    className={`text-xs font-medium ${
                      nightMode ? 'text-[#C8B88A]' : 'text-[#425B51]'
                    }`}
                  >
                    القرآن الكريم · السورة رقم {toArabicDigits(activeSurah.number)}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {onToggleBookmark && (
                      <button
                        type="button"
                        onClick={() => onToggleBookmark(activeReadingId)}
                        aria-label={isCurrentBookmarked ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                        className={`min-h-[38px] px-3 py-1 rounded-[5px] border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                          isCurrentBookmarked
                            ? nightMode
                              ? 'bg-[#D9B96A]/20 border-[#D9B96A] text-[#D9B96A]'
                              : 'bg-[#F3ECDA] border-[#B8924A] text-[#0F3D2E]'
                            : nightMode
                              ? 'bg-[#081A14] border-[#B8924A]/35 text-[#F3EBD6]/80 hover:text-[#D9B96A]'
                              : 'bg-[#FAF6EC] border-[#B8924A]/40 text-[#425B51] hover:border-[#B8924A]'
                        }`}
                      >
                        <Bookmark
                          className={`w-3.5 h-3.5 ${isCurrentBookmarked ? 'fill-current' : ''}`}
                          aria-hidden="true"
                        />
                        <span>{isCurrentBookmarked ? 'في المفضلة' : 'حفظ العلامة'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleOpenShareCard}
                      className={`min-h-[38px] px-3 py-1 rounded-[5px] border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        nightMode
                          ? 'bg-[#081A14] border-[#B8924A]/35 text-[#D9B96A] hover:border-[#D9B96A]'
                          : 'bg-[#FAF6EC] border-[#B8924A]/45 text-[#0F3D2E] hover:bg-[#F3ECDA]'
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>مشاركة كبطاقة</span>
                    </button>

                    {isCurrentCompleted && (
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
              </div>

              <AudioReciterPlayer
                mode="quran"
                surahNumber={activeSurah.number}
                surahName={activeSurah.name}
                nightMode={nightMode}
              />

              {activeSurah.number !== 1 && activeSurah.number !== 9 && (
                <div className="mt-6 text-center">
                  <p
                    className={`font-quran text-2xl sm:text-3xl ${
                      nightMode ? 'text-[#D9B96A]' : 'text-[#0F3D2E]'
                    }`}
                  >
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                  <ManuscriptDivider variant="flourish" dark={nightMode} className="my-2" />
                </div>
              )}

              <div className="mt-5 max-w-prose mx-auto" ref={readerBodyRef}>
                {surahLoading ? (
                  <ManuscriptSpinner
                    label={`جارٍ إحضار آيات سورة ${activeSurah.name}...`}
                    dark={nightMode}
                  />
                ) : surahError ? (
                  <div
                    className={`rounded-[6px] p-6 text-center border ${
                      nightMode
                        ? 'bg-[#081A14] border-[#D9B96A]/45 text-[#F3EBD6]'
                        : 'bg-[#F3ECDA]/75 border-[#B8924A]/50 text-[#11271F]'
                    }`}
                  >
                    <p className="font-display font-bold text-base leading-relaxed">
                      {surahError}
                    </p>
                    <button
                      type="button"
                      onClick={() => setRetryToken((t) => t + 1)}
                      className="mt-4 min-h-[42px] px-5 py-2 btn-emerald text-sm inline-flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
                      <span>إعادة المحاولة</span>
                    </button>
                  </div>
                ) : (
                  <p
                    className={`font-quran text-justify ${fontClass} ${
                      nightMode ? 'text-[#F3EBD6]' : 'text-[#11271F]'
                    }`}
                  >
                    {surahAyat.map((ayah, idx) => {
                      const isActive =
                        focusTrackerEnabled && activeUnitIndex === idx;
                      return (
                        <React.Fragment key={idx}>
                          <span
                            data-reading-unit-index={idx}
                            onMouseEnter={() => {
                              if (focusTrackerEnabled) setActiveUnitIndex(idx);
                            }}
                            onClick={() => {
                              if (!focusTrackerEnabled) return;
                              const sel = window.getSelection()?.toString();
                              if (sel && sel.trim().length > 0) return;
                              setActiveUnitIndex(idx);
                            }}
                            className={getReadingUnitClasses({
                              isActive,
                              enabled: focusTrackerEnabled,
                              nightMode,
                              theme: focusTheme,
                            })}
                          >
                            {ayah}
                            <AyahRosetteMarker
                              numberArabic={toArabicDigits(idx + 1)}
                              dark={nightMode}
                              highlighted={isActive}
                            />
                          </span>{' '}
                        </React.Fragment>
                      );
                    })}
                  </p>
                )}
              </div>
            </>
          ) : activeSection === 'munajat' ? (
            <>
              {/* Munajat Prayer Book Header */}
              <div className="pt-2 pb-4 border-b border-[#B8924A]/35 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                      nightMode ? 'text-[#D9B96A]' : 'text-[#1F6B50]'
                    }`}
                  >
                    <MunajatMoonIcon className="w-4 h-4" />
                    <span>
                      المناجاة رقم {toArabicDigits(activeMunajat.number)} من ١٥ · الإمام زين العابدين (عليه السلام)
                    </span>
                  </span>
                  <h2
                    className={`font-calligraphy font-bold text-2xl sm:text-4xl mt-1.5 ${
                      nightMode ? 'text-[#F3EBD6]' : 'text-[#0F3D2E]'
                    }`}
                  >
                    {activeMunajat.title}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {onToggleBookmark && (
                    <button
                      type="button"
                      onClick={() => onToggleBookmark(activeReadingId)}
                      aria-label={isCurrentBookmarked ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                      className={`min-h-[38px] px-3 py-1 rounded-[5px] border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isCurrentBookmarked
                          ? nightMode
                            ? 'bg-[#D9B96A]/20 border-[#D9B96A] text-[#D9B96A]'
                            : 'bg-[#F3ECDA] border-[#B8924A] text-[#0F3D2E]'
                          : nightMode
                            ? 'bg-[#081A14] border-[#B8924A]/35 text-[#F3EBD6]/80 hover:text-[#D9B96A]'
                            : 'bg-[#FAF6EC] border-[#B8924A]/40 text-[#425B51] hover:border-[#B8924A]'
                      }`}
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${isCurrentBookmarked ? 'fill-current' : ''}`}
                        aria-hidden="true"
                      />
                      <span>{isCurrentBookmarked ? 'في المفضلة' : 'حفظ العلامة'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleOpenShareCard}
                    className={`min-h-[38px] px-3 py-1 rounded-[5px] border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      nightMode
                        ? 'bg-[#081A14] border-[#B8924A]/35 text-[#D9B96A] hover:border-[#D9B96A]'
                        : 'bg-[#FAF6EC] border-[#B8924A]/45 text-[#0F3D2E] hover:bg-[#F3ECDA]'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>مشاركة كبطاقة</span>
                  </button>

                  {isCurrentCompleted && (
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

              <AudioReciterPlayer
                mode="entry"
                entryId={activeMunajat.id}
                entryTitle={activeMunajat.title}
                tracks={ENTRY_AUDIO_TRACKS[activeMunajat.id] || []}
                nightMode={nightMode}
              />

              {/* Marginal Illumination Summary */}
              <div
                className={`mt-5 rounded-[5px] p-4 sm:p-5 border-r-[3px] border border-[#B8924A]/35 space-y-2.5 ${
                  nightMode
                    ? 'bg-[#081A14]/75 border-r-[#D9B96A] text-[#F3EBD6]'
                    : 'bg-[#F3ECDA]/65 border-r-[#B8924A] text-[#11271F]'
                }`}
              >
                <p className="text-sm sm:text-base leading-relaxed">
                  {activeMunajat.quickMeaning}
                </p>
                <div
                  className={`pt-2 border-t flex items-start gap-2 text-xs sm:text-sm font-medium ${
                    nightMode
                      ? 'border-[#D9B96A]/20 text-[#D9B96A]'
                      : 'border-[#B8924A]/25 text-[#1F6B50]'
                  }`}
                >
                  <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>العبرة: {activeMunajat.lifeLesson}</span>
                </div>
              </div>

              <ManuscriptDivider variant="crescent" dark={nightMode} />

              <div className="mt-4 max-w-prose mx-auto space-y-6" ref={readerBodyRef}>
                {munajatSplitParagraphs.map((lines, idx) => (
                  <p
                    key={idx}
                    className={`font-arabic whitespace-pre-line ${fontClass} ${
                      nightMode ? 'text-[#F3EBD6]' : 'text-[#11271F]'
                    }`}
                  >
                    {lines.map(({ text, unitIdx }) => {
                      const trailingNewlinesMatch = text.match(/\n+$/);
                      const visibleChunk = trailingNewlinesMatch
                        ? text.slice(
                            0,
                            text.length - trailingNewlinesMatch[0].length
                          )
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
                              if (focusTrackerEnabled)
                                setActiveUnitIndex(unitIdx);
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
            </>
          ) : (
            <>
              {/* Classic Prayer Book Header (Duas / Ziyarat) */}
              <div className="pt-2 pb-4 border-b border-[#B8924A]/35 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                      nightMode ? 'text-[#D9B96A]' : 'text-[#1F6B50]'
                    }`}
                  >
                    {activeSection === 'ziyarat' ? (
                      <ShrineDomeIcon className="w-4 h-4" />
                    ) : (
                      <DuaScrollIcon className="w-4 h-4" />
                    )}
                    <span>
                      {currentDuaOrZiyaratItem.groupLabel} ·{' '}
                      {currentDuaOrZiyaratItem.subtitle}
                    </span>
                  </span>
                  <h2
                    className={`font-calligraphy font-bold text-2xl sm:text-4xl mt-1.5 ${
                      nightMode ? 'text-[#F3EBD6]' : 'text-[#0F3D2E]'
                    }`}
                  >
                    {currentDuaOrZiyaratItem.title}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {onToggleBookmark && (
                    <button
                      type="button"
                      onClick={() => onToggleBookmark(activeReadingId)}
                      aria-label={isCurrentBookmarked ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                      className={`min-h-[38px] px-3 py-1 rounded-[5px] border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isCurrentBookmarked
                          ? nightMode
                            ? 'bg-[#D9B96A]/20 border-[#D9B96A] text-[#D9B96A]'
                            : 'bg-[#F3ECDA] border-[#B8924A] text-[#0F3D2E]'
                          : nightMode
                            ? 'bg-[#081A14] border-[#B8924A]/35 text-[#F3EBD6]/80 hover:text-[#D9B96A]'
                            : 'bg-[#FAF6EC] border-[#B8924A]/40 text-[#425B51] hover:border-[#B8924A]'
                      }`}
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${isCurrentBookmarked ? 'fill-current' : ''}`}
                        aria-hidden="true"
                      />
                      <span>{isCurrentBookmarked ? 'في المفضلة' : 'حفظ العلامة'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleOpenShareCard}
                    className={`min-h-[38px] px-3 py-1 rounded-[5px] border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      nightMode
                        ? 'bg-[#081A14] border-[#B8924A]/35 text-[#D9B96A] hover:border-[#D9B96A]'
                        : 'bg-[#FAF6EC] border-[#B8924A]/45 text-[#0F3D2E] hover:bg-[#F3ECDA]'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>مشاركة كبطاقة</span>
                  </button>

                  {isCurrentCompleted && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold ${
                        nightMode ? 'text-[#D9B96A]' : 'text-[#1F6B50]'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>مقروء</span>
                    </span>
                  )}
                </div>
              </div>

              <AudioReciterPlayer
                mode="entry"
                entryId={currentDuaOrZiyaratItem.id}
                entryTitle={currentDuaOrZiyaratItem.title}
                tracks={ENTRY_AUDIO_TRACKS[currentDuaOrZiyaratItem.id] || []}
                nightMode={nightMode}
              />

              {currentDuaOrZiyaratItem.meaningSummary && (
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
                    معنى الدعاء باختصار
                  </p>
                  <p className="text-sm sm:text-base leading-relaxed">
                    {currentDuaOrZiyaratItem.meaningSummary}
                  </p>
                </div>
              )}

              <ManuscriptDivider variant="rosette" dark={nightMode} />

              <div className="mt-4 max-w-prose mx-auto space-y-6" ref={readerBodyRef}>
                {preparedSegments.map((seg, idx) =>
                  seg.type === 'note' ? (
                    <div key={idx}>
                      <span
                        className={
                          nightMode ? 'editorial-note-dark' : 'editorial-note'
                        }
                      >
                        {seg.content}
                      </span>
                    </div>
                  ) : (
                    <p
                      key={idx}
                      className={`font-arabic whitespace-pre-line ${fontClass} ${
                        nightMode ? 'text-[#F3EBD6]' : 'text-[#11271F]'
                      }`}
                    >
                      {seg.lines.map(({ text, unitIdx }) => {
                        const trailingNewlinesMatch = text.match(/\n+$/);
                        const visibleChunk = trailingNewlinesMatch
                          ? text.slice(
                              0,
                              text.length - trailingNewlinesMatch[0].length
                            )
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
                                if (focusTrackerEnabled)
                                  setActiveUnitIndex(unitIdx);
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
                  )
                )}
              </div>
            </>
          )}

          {/* Completion Feedback */}
          {justAwardedId === activeReadingId && (
            <div className="mt-6 rounded-[5px] bg-[#0F3D2E] border border-[#D9B96A]/65 text-[#FAF6EC] p-3.5 font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2">
              <CheckCircle2
                className="w-5 h-5 text-[#D9B96A]"
                aria-hidden="true"
              />
              <span>تقبّل الله طاعتك! تم تسجيل إتمام هذه القراءة المباركة</span>
            </div>
          )}

          {/* Colophon Completion CTA */}
          <div className="mt-8 pt-5 border-t border-[#B8924A]/35 flex flex-wrap items-center justify-between gap-4">
            {isCurrentCompleted ? (
              <div
                className={`flex items-center gap-2 font-display font-bold text-sm sm:text-base ${
                  nightMode ? 'text-[#D9B96A]' : 'text-[#1F6B50]'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                <span>أتممت هذه القراءة المباركة</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleFinishReading}
                className="min-h-[48px] px-7 py-2.5 btn-gilded text-base sm:text-lg flex items-center gap-2.5 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                <span>أتممت القراءة</span>
              </button>
            )}
          </div>
        </motion.section>
        )}
      </div>

      <ShareCardModal
        payload={sharePayload}
        onClose={() => setSharePayload(null)}
      />
    </main>
  );
};
