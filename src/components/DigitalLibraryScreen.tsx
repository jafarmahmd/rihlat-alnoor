import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Download,
  Heart,
  Lightbulb,
  Loader2,
  Menu,
  Moon,
  RefreshCw,
  ScrollText,
  Search,
  Settings,
  Sparkles,
  Sun,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  ReadingFocusSettings,
  getReadingFocusThemeConfig,
  getReadingUnitClasses,
  splitIntoReadableLines,
  useReadingFocusTracker,
} from './ReadingFocusControls';
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

interface DigitalLibraryScreenProps {
  initialSection?: DigitalLibrarySection;
  initialEntryId?: string | null;
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

type DuaSubGroup = 'all' | 'days' | 'daily' | 'sahifa' | 'major' | 'favorites';
type ZiyaratSubGroup = 'all' | 'prophet' | 'karbala' | 'imams' | 'favorites';
type QuranSubFilter = 'all' | 'local' | 'meccan' | 'medinan' | 'favorites';

interface UnifiedDuaOrZiyaratItem {
  id: string;
  section: 'adiyat' | 'ziyarat';
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
  { id: 'ziyarat', label: 'الزيارات' },
  { id: 'munajat', label: 'المناجاة' },
  { id: 'quran', label: 'القرآن' },
];

const DUA_SUBFILTERS: { id: DuaSubGroup; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'days', label: 'الأيام السبعة' },
  { id: 'daily', label: 'يومية' },
  { id: 'sahifa', label: 'الصحيفة السجادية' },
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
  { id: 'local', label: 'مخزن أوفلاين' },
  { id: 'meccan', label: 'مكية' },
  { id: 'medinan', label: 'مدنية' },
  { id: 'favorites', label: 'المفضلة' },
];

const DL_LAST_SELECTED_KEY = 'rihlat_alnoor_dl_last_selected_v1';

function loadLastSelectedMap(): {
  adiyat?: string;
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
  16: 'text-[16px] leading-[2.2]',
  18: 'text-[18px] leading-[2.25]',
  20: 'text-[20px] leading-[2.25]',
  22: 'text-[22px] leading-[2.3]',
  24: 'text-[24px] leading-[2.3]',
  26: 'text-[26px] leading-[2.35]',
  28: 'text-[28px] leading-[2.35]',
  30: 'text-[30px] leading-[2.4]',
  32: 'text-[32px] leading-[2.4]',
  34: 'text-[34px] leading-[2.45]',
  36: 'text-[36px] leading-[2.45]',
};

const MIN_FONT_SIZE = 16;
const MAX_FONT_SIZE = 36;
const FONT_STEP = 2;

function normalizeArabicForSearch(input: string): string {
  return input
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim()
    .toLowerCase();
}

export const DigitalLibraryScreen: React.FC<DigitalLibraryScreenProps> = ({
  initialSection = 'adiyat',
  initialEntryId = null,
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

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  // Build unified, cleanly sorted Duas & Ziyarat lists (no Munajat mixed in!)
  const { allDuas, allZiyarat } = useMemo(() => {
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

    // Pure Sahifa Duas only (exclude dl-sahifa-m1 / dl-sahifa-m2 which belong in Munajat tab)
    const sahifaDuas: UnifiedDuaOrZiyaratItem[] = DIGITAL_LIBRARY_ENTRIES.filter(
      (e) =>
        e.section === 'sahifa' &&
        e.id !== 'dl-sahifa-m1' &&
        e.id !== 'dl-sahifa-m2'
    ).map((e) => ({
      id: e.id,
      section: 'adiyat',
      groupKey: 'sahifa',
      groupLabel: 'مختارات الصحيفة السجادية',
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
      allDuas: [...dayDuas, ...dailyDuas, ...sahifaDuas, ...majorDuas],
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
      (initialMap.adiyat && allDuas.some((d) => d.id === initialMap.adiyat)
        ? initialMap.adiyat
        : allDuas[0].id)
  );
  const [selectedZiyaratId, setSelectedZiyaratId] = useState<string>(
    () =>
      (initialMap.ziyarat && allZiyarat.some((z) => z.id === initialMap.ziyarat)
        ? initialMap.ziyarat
        : allZiyarat[0].id)
  );
  const [selectedMunajatId, setSelectedMunajatId] = useState<string>(
    () =>
      (initialMap.munajat && MUNAJAT_LIST.some((m) => m.id === initialMap.munajat)
        ? initialMap.munajat
        : MUNAJAT_LIST[0].id)
  );
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(
    () =>
      (typeof initialMap.quran === 'number' &&
      initialMap.quran >= 1 &&
      initialMap.quran <= 114
        ? initialMap.quran
        : 1)
  );

  // Save per-section selection whenever it changes so returning via TopBar preserves position
  useEffect(() => {
    try {
      window.localStorage.setItem(
        DL_LAST_SELECTED_KEY,
        JSON.stringify({
          adiyat: selectedDuaId,
          ziyarat: selectedZiyaratId,
          munajat: selectedMunajatId,
          quran: selectedSurahNumber,
        })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [selectedDuaId, selectedZiyaratId, selectedMunajatId, selectedSurahNumber]);

  useEffect(() => {
    if (!initialEntryId) return;
    if (initialEntryId.startsWith('dl-quran-')) {
      const num = Number(initialEntryId.replace('dl-quran-', ''));
      if (Number.isFinite(num) && num >= 1 && num <= 114) {
        setActiveSection('quran');
        setSelectedSurahNumber(num);
        setQuranSubFilter('all');
        return;
      }
    }
    if (allDuas.some((d) => d.id === initialEntryId)) {
      setActiveSection('adiyat');
      setSelectedDuaId(initialEntryId);
      setDuaSubFilter('all');
    } else if (allZiyarat.some((z) => z.id === initialEntryId)) {
      setActiveSection('ziyarat');
      setSelectedZiyaratId(initialEntryId);
      setZiyaratSubFilter('all');
    } else if (MUNAJAT_LIST.some((m) => m.id === initialEntryId)) {
      setActiveSection('munajat');
      setSelectedMunajatId(initialEntryId);
    }
  }, [initialEntryId, allDuas, allZiyarat]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(22);
  const [nightMode, setNightMode] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [justAwardedId, setJustAwardedId] = useState<string | null>(null);

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

  const filteredDuasAndZiyarat = useMemo(() => {
    if (isSearching) {
      return [...allDuas, ...allZiyarat].filter((item) => {
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

    if (activeSection === 'adiyat') {
      if (duaSubFilter === 'all') return allDuas;
      if (duaSubFilter === 'favorites') {
        return allDuas.filter((d) => bookmarkedIds.includes(d.id));
      }
      return allDuas.filter((d) => d.groupKey === duaSubFilter);
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
    duaSubFilter,
    ziyaratSubFilter,
    allDuas,
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
    return activeSection === 'munajat' ? MUNAJAT_LIST : [];
  }, [isSearching, normalizedQuery, activeSection]);

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
    allZiyarat.length +
    MUNAJAT_LIST.length +
    QURAN_SURAHS_META.length;

  const totalCompletedDigital = useMemo(() => {
    const allIds = new Set<string>([
      ...allDuas.map((d) => d.id),
      ...allZiyarat.map((z) => z.id),
      ...MUNAJAT_LIST.map((m) => m.id),
      ...QURAN_SURAHS_META.map((s) => `dl-quran-${s.number}`),
    ]);
    return completedReadingIds.filter((id) => allIds.has(id)).length;
  }, [completedReadingIds, allDuas, allZiyarat]);

  const activeReadingId =
    activeSection === 'quran'
      ? `dl-quran-${activeSurah.number}`
      : activeSection === 'munajat'
      ? activeMunajat.id
      : activeSection === 'ziyarat'
      ? activeZiyarat.id
      : activeDua.id;

  useEffect(() => {
    const title =
      activeSection === 'quran'
        ? `سورة ${activeSurah.name}`
        : activeSection === 'munajat'
        ? activeMunajat.title
        : activeSection === 'ziyarat'
        ? activeZiyarat.title
        : activeDua.title;
    onSetLastRead?.(activeSection, activeReadingId, title);
  }, [activeSection, activeReadingId]);

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

  const handleSelectSection = (sec: DigitalLibrarySection) => {
    setActiveSection(sec);
    setJustAwardedId(null);
  };

  const handleSelectDuaOrZiyarat = (item: UnifiedDuaOrZiyaratItem) => {
    setActiveSection(item.section);
    if (item.section === 'adiyat') {
      setSelectedDuaId(item.id);
    } else {
      setSelectedZiyaratId(item.id);
    }
    setJustAwardedId(null);
    setDrawerOpen(false);
  };

  const handleSelectMunajat = (id: string) => {
    setActiveSection('munajat');
    setSelectedMunajatId(id);
    setJustAwardedId(null);
    setDrawerOpen(false);
  };

  const handleSelectSurah = (surahNumber: number) => {
    setActiveSection('quran');
    setSelectedSurahNumber(surahNumber);
    setJustAwardedId(null);
    setDrawerOpen(false);
  };

  const handleFinishReading = () => {
    const awarded = onCompleteReading(activeReadingId);
    if (awarded) {
      setJustAwardedId(activeReadingId);
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
    activeSection === 'ziyarat' ? activeZiyarat : activeDua;

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
    resetKey: `${activeReadingId}:${surahAyat.length}`,
    unitCount: currentUnitCount,
    enabled: focusTrackerEnabled && !surahLoading && !surahError,
    contentRef: readerBodyRef,
  });

  const focusThemeConfig = getReadingFocusThemeConfig(focusTheme);

  const fontClass =
    FONT_SIZE_CLASS_MAP[fontSize] || FONT_SIZE_CLASS_MAP[22];

  const renderSidebarContent = () => {
    let lastGroupRendered = '';

    return (
      <div className="flex flex-col h-full">
        {/* Search Box */}
        <div className="relative mb-3">
          <Search
            className="w-4 h-4 text-emerald-600 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في الأدعية، الزيارات، المناجاة، والسور..."
            aria-label="البحث في المكتبة الدينية"
            className="w-full min-h-[44px] pr-10 pl-9 py-2 rounded-2xl bg-emerald-50/70 focus:bg-white border border-emerald-200 focus:border-emerald-500 text-sm font-bold text-slate-900 placeholder:text-slate-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="مسح البحث"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-emerald-100 text-slate-500 cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* 4 Cleanly Separated Main Category Tabs */}
        <div
          role="tablist"
          aria-label="أقسام المكتبة المباركة"
          className="grid grid-cols-4 gap-1 mb-3 bg-emerald-50/90 p-1 rounded-2xl border border-emerald-100"
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
                className={`min-h-[40px] px-1.5 py-2 rounded-xl font-display font-extrabold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-900 hover:bg-white/85'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Contextual Sub-Filter Strip */}
        {!isSearching && activeSection === 'adiyat' && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {DUA_SUBFILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDuaSubFilter(f.id)}
                className={`min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                  duaSubFilter === f.id
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 hover:bg-emerald-50 text-slate-700'
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
                className={`min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                  ziyaratSubFilter === f.id
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 hover:bg-teal-50 text-slate-700'
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
                  className={`min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                    quranSubFilter === f.id
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 hover:bg-amber-50 text-slate-700'
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
                className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-950 font-display font-extrabold text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors disabled:opacity-75"
              >
                <span className="flex items-center gap-1.5 truncate">
                  {downloadingAllQuran ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700 shrink-0" aria-hidden="true" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                  )}
                  <span className="truncate">
                    {downloadingAllQuran
                      ? 'جاري حفظ سور القرآن أوفلاين...'
                      : 'حفظ المصحف كاملاً بدون إنترنت'}
                  </span>
                </span>
                <span className="text-[11px] font-black text-emerald-700 tabular-nums shrink-0">
                  {offlineQuranCount}/{QURAN_SURAHS_META.length}
                </span>
              </button>
            ) : (
              <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>المصحف كاملاً (١١٤ سورة) محفوظ بدون إنترنت</span>
              </div>
            )}
          </div>
        )}

        {/* Search Notice */}
        {isSearching && (
          <div className="mb-2.5 px-2 flex items-center justify-between text-xs font-bold text-amber-800">
            <span className="tabular-nums">
              نتائج البحث (
              {filteredDuasAndZiyarat.length +
                filteredMunajat.length +
                filteredSurahs.length}
              )
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-emerald-700 hover:underline cursor-pointer"
            >
              إظهار الكل
            </button>
          </div>
        )}

        {/* Sorted Items List */}
        <div className="min-h-0 flex-1 overflow-y-auto space-y-2 pr-0.5 lg:max-h-[62vh]">
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
                  <div className="pt-2 pb-1 px-1 text-xs font-black text-emerald-800 border-b border-emerald-100">
                    {item.groupLabel}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleSelectDuaOrZiyarat(item)}
                  className={`w-full text-right p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    selected
                      ? 'bg-gradient-to-l from-emerald-50 to-amber-50/70 border-emerald-500 shadow-xs'
                      : 'bg-white hover:bg-emerald-50/40 border-emerald-100 hover:border-emerald-300'
                  }`}
                >
                  <div className="min-w-0">
                    {isSearching && (
                      <div className="text-[11px] font-extrabold text-emerald-700 mb-0.5">
                        {item.section === 'adiyat' ? 'الأدعية' : 'الزيارات'} ·{' '}
                        {item.groupLabel}
                      </div>
                    )}
                    <h3 className="font-display font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                  {done && (
                    <CheckCircle2
                      className="w-5 h-5 text-emerald-600 shrink-0"
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
                className={`w-full text-right p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                  selected
                    ? 'bg-gradient-to-l from-sky-50 to-amber-50/70 border-sky-500 shadow-xs'
                    : 'bg-white hover:bg-sky-50/40 border-emerald-100 hover:border-sky-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-8 h-8 rounded-xl font-display font-black text-xs flex items-center justify-center shrink-0 tabular-nums ${
                      selected
                        ? 'bg-sky-600 text-white'
                        : 'bg-sky-100 text-sky-900'
                    }`}
                  >
                    {m.number}
                  </span>
                  <div className="min-w-0">
                    {isSearching && (
                      <div className="text-[11px] font-extrabold text-sky-700">
                        المناجاة الخمس عشرة
                      </div>
                    )}
                    <h3 className="font-display font-extrabold text-sm sm:text-base text-slate-900 truncate">
                      {m.title}
                    </h3>
                    <p className="text-xs text-slate-600 truncate">
                      {m.quickMeaning}
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
                className={`w-full text-right p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                  selected
                    ? 'bg-gradient-to-l from-emerald-50 to-amber-50/80 border-emerald-500 shadow-xs'
                    : 'bg-white hover:bg-emerald-50/40 border-emerald-100 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 font-display font-black text-xs flex items-center justify-center shrink-0 tabular-nums">
                    {surah.number}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display font-extrabold text-sm sm:text-base text-slate-900 truncate">
                      سورة {surah.name}
                    </h3>
                    <p className="text-xs text-slate-600 tabular-nums">
                      {surah.type} · {surah.ayahCount} آية
                      {isLocal ? ' · مباشر' : ''}
                    </p>
                  </div>
                </div>

                {done && (
                  <CheckCircle2
                    className="w-5 h-5 text-emerald-600 shrink-0"
                    aria-label="تمت قراءتها"
                  />
                )}
              </button>
            );
          })}

          {filteredDuasAndZiyarat.length === 0 &&
            filteredMunajat.length === 0 &&
            filteredSurahs.length === 0 && (
              <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="font-display font-bold text-slate-700 text-sm">
                  لم نجد نتائج مطابقة لعبارة البحث.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs font-extrabold text-emerald-700 hover:underline cursor-pointer"
                >
                  عرض جميع المواد
                </button>
              </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4 mb-5 sm:mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBackHome}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-sm flex items-center gap-2 shadow-xs cursor-pointer transition-colors whitespace-nowrap"
          >
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
            <span>الرئيسية</span>
          </button>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 shadow-xs cursor-pointer transition-colors whitespace-nowrap"
          >
            <Menu className="w-4 h-4" aria-hidden="true" />
            <span>الفهرس والأقسام</span>
          </button>

          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-emerald-950 flex items-center gap-2">
              <ScrollText
                className="w-7 h-7 text-emerald-600 shrink-0"
                aria-hidden="true"
              />
              <span>المكتبة الدينية الشاملة</span>
            </h1>
            <p className="text-sm font-bold text-slate-600 mt-0.5 tabular-nums">
              الأدعية ({allDuas.length}) · الزيارات ({allZiyarat.length}) · المناجاة (
              {MUNAJAT_LIST.length}) · القرآن ({QURAN_SURAHS_META.length}) · أتممت{' '}
              {totalCompletedDigital} من {totalLibraryItems}
            </p>
          </div>
        </div>

        {/* Font Size, Night Mode & Quick Tasbih Shortcut */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenTasbih && (
            <button
              type="button"
              onClick={onOpenTasbih}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0B2622] hover:bg-[#113630] text-amber-200 border border-amber-400/40 font-display font-extrabold text-sm flex items-center gap-2 shadow-xs cursor-pointer transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-amber-300" aria-hidden="true" />
              <span>المسبحة النورانية</span>
            </button>
          )}

          <div className="inline-flex items-center bg-white border border-emerald-200 rounded-xl p-1 shadow-xs">
            <button
              type="button"
              onClick={() =>
                setFontSize((s) => Math.max(MIN_FONT_SIZE, s - FONT_STEP))
              }
              disabled={fontSize <= MIN_FONT_SIZE}
              aria-label="تصغير الخط"
              className="min-h-[40px] min-w-[40px] px-2.5 rounded-lg hover:bg-emerald-50 disabled:opacity-40 text-emerald-900 font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs">أ-</span>
            </button>
            <span
              className="px-2.5 text-xs font-extrabold text-emerald-900 border-x border-emerald-100 tabular-nums"
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

      {/* Mobile Sidebar Drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="فهرس المكتبة الدينية"
        >
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative z-10 w-[88%] max-w-sm bg-white h-full p-4 shadow-2xl border-l border-emerald-200 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-100">
              <h2 className="font-display font-black text-lg text-emerald-950">
                فهرس المكتبة المباركة
              </h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="إغلاق الفهرس"
                className="min-h-[40px] min-w-[40px] rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">{renderSidebarContent()}</div>
          </div>
        </div>
      )}

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-4 rounded-3xl bg-white/95 border border-emerald-200 p-4 shadow-lg shadow-emerald-950/5 sticky top-20">
          {renderSidebarContent()}
        </aside>

        {/* Reader Panel */}
        <motion.section
          key={activeReadingId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          aria-label="لوحة القراءة"
          className={`lg:col-span-8 rounded-2xl sm:rounded-3xl border p-4 sm:p-8 lg:p-10 shadow-xl transition-colors duration-300 ${
            nightMode
              ? 'bg-slate-900 border-amber-500/40 text-amber-50 shadow-slate-950/50'
              : 'bg-white/95 border-amber-200 text-slate-900 shadow-emerald-950/5'
          }`}
        >
          {activeSection === 'quran' ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 pb-5 border-b border-current/10">
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold ${
                      nightMode ? 'text-amber-300' : 'text-emerald-700'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" aria-hidden="true" />
                    <span>
                      القرآن الكريم · سورة رقم {activeSurah.number} ·{' '}
                      {activeSurah.type} · {activeSurah.ayahCount} آية
                    </span>
                  </span>
                  <h2
                    className={`font-display font-black text-2xl sm:text-4xl mt-1.5 ${
                      nightMode ? 'text-amber-200' : 'text-emerald-950'
                    }`}
                  >
                    سورة {activeSurah.name}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {onToggleBookmark && (
                    <button
                      type="button"
                      onClick={() => onToggleBookmark(activeReadingId)}
                      aria-label={isCurrentBookmarked ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isCurrentBookmarked
                          ? nightMode
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-amber-50 border-amber-400 text-amber-800'
                          : nightMode
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-amber-300'
                            : 'bg-white border-emerald-200 text-slate-700 hover:bg-amber-50'
                      }`}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${isCurrentBookmarked ? 'fill-current' : ''}`}
                        aria-hidden="true"
                      />
                      <span>{isCurrentBookmarked ? 'في المفضلة' : 'حفظ'}</span>
                    </button>
                  )}

                  {isCurrentCompleted && (
                    <span
                      className={`inline-flex items-center gap-1.5 text-sm font-extrabold ${
                        nightMode ? 'text-emerald-300' : 'text-emerald-700'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>مقروءة</span>
                    </span>
                  )}
                </div>
              </div>

              <AudioReciterPlayer
                mode="quran"
                surahNumber={activeSurah.number}
                surahName={activeSurah.name}
                nightMode={nightMode}
              />

              {activeSurah.number !== 1 && activeSurah.number !== 9 && (
                <div
                  className={`mt-6 py-4 px-4 rounded-2xl text-center border ${
                    nightMode
                      ? 'bg-slate-800/80 border-amber-500/30 text-amber-200'
                      : 'bg-gradient-to-l from-emerald-50 via-amber-50/70 to-emerald-50 border-amber-200 text-emerald-950'
                  }`}
                >
                  <p className="font-arabic font-bold text-2xl sm:text-3xl">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                </div>
              )}

              <div className="mt-6" ref={readerBodyRef}>
                {surahLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
                    <Loader2
                      className={`w-10 h-10 animate-spin ${
                        nightMode ? 'text-amber-300' : 'text-emerald-600'
                      }`}
                      aria-hidden="true"
                    />
                    <p className="font-display font-bold text-base">
                      جارٍ تحميل آيات سورة {activeSurah.name}...
                    </p>
                  </div>
                ) : surahError ? (
                  <div
                    className={`rounded-2xl p-6 text-center border ${
                      nightMode
                        ? 'bg-slate-800 border-amber-500/40 text-amber-100'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    <p className="font-display font-bold text-base leading-relaxed">
                      {surahError}
                    </p>
                    <button
                      type="button"
                      onClick={() => setRetryToken((t) => t + 1)}
                      className="mt-4 min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-extrabold text-sm inline-flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" aria-hidden="true" />
                      <span>إعادة المحاولة</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p
                      className={`font-arabic text-justify ${fontClass} ${
                        nightMode ? 'text-amber-50' : 'text-slate-900'
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
                              {ayah}{' '}
                              <span
                                className={`inline-flex items-center justify-center font-display font-black text-[0.72em] mx-1 px-2 py-0.5 rounded-full border align-middle tabular-nums ${
                                  isActive
                                    ? focusThemeConfig.ayahBadgeActiveClass
                                    : nightMode
                                      ? 'bg-amber-900/50 text-amber-300 border-amber-500/40'
                                      : 'bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                              >
                                ﴿{idx + 1}﴾
                              </span>
                            </span>{' '}
                          </React.Fragment>
                        );
                      })}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : activeSection === 'munajat' ? (
            <>
              {/* Munajat Reader */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-5 border-b border-current/10">
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold ${
                      nightMode ? 'text-sky-300' : 'text-sky-700'
                    }`}
                  >
                    <Heart className="w-4 h-4" aria-hidden="true" />
                    <span>
                      المناجاة رقم {activeMunajat.number} من ١٥ · الإمام زين العابدين (عليه السلام)
                    </span>
                  </span>
                  <h2
                    className={`font-display font-black text-2xl sm:text-3xl mt-1.5 ${
                      nightMode ? 'text-amber-200' : 'text-emerald-950'
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
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isCurrentBookmarked
                          ? nightMode
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-amber-50 border-amber-400 text-amber-800'
                          : nightMode
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-amber-300'
                            : 'bg-white border-emerald-200 text-slate-700 hover:bg-amber-50'
                      }`}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${isCurrentBookmarked ? 'fill-current' : ''}`}
                        aria-hidden="true"
                      />
                      <span>{isCurrentBookmarked ? 'في المفضلة' : 'حفظ'}</span>
                    </button>
                  )}

                  {isCurrentCompleted && (
                    <span
                      className={`inline-flex items-center gap-1.5 text-sm font-extrabold ${
                        nightMode ? 'text-emerald-300' : 'text-emerald-700'
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

              <div
                className={`mt-5 rounded-2xl p-4 sm:p-5 border space-y-2.5 ${
                  nightMode
                    ? 'bg-slate-800/85 border-amber-500/30 text-amber-100'
                    : 'bg-gradient-to-l from-amber-50/90 to-sky-50/70 border-amber-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-display font-extrabold text-sm sm:text-base">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
                  <span>بطاقة المعنى السريع</span>
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

              <div className="mt-6 space-y-5" ref={readerBodyRef}>
                {munajatSplitParagraphs.map((lines, idx) => (
                  <p
                    key={idx}
                    className={`font-arabic whitespace-pre-line ${fontClass} ${
                      nightMode ? 'text-amber-50' : 'text-slate-900'
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
              {/* Dua or Ziyarat Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-5 pt-4 border-b border-current/10">
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold ${
                      nightMode ? 'text-amber-300' : 'text-emerald-700'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {currentDuaOrZiyaratItem.groupLabel} ·{' '}
                      {currentDuaOrZiyaratItem.subtitle}
                    </span>
                  </span>
                  <h2
                    className={`font-display font-black text-2xl sm:text-3xl mt-1.5 ${
                      nightMode ? 'text-amber-200' : 'text-emerald-950'
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
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isCurrentBookmarked
                          ? nightMode
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-amber-50 border-amber-400 text-amber-800'
                          : nightMode
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-amber-300'
                            : 'bg-white border-emerald-200 text-slate-700 hover:bg-amber-50'
                      }`}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${isCurrentBookmarked ? 'fill-current' : ''}`}
                        aria-hidden="true"
                      />
                      <span>{isCurrentBookmarked ? 'في المفضلة' : 'حفظ'}</span>
                    </button>
                  )}

                  {isCurrentCompleted && (
                    <span
                      className={`inline-flex items-center gap-1.5 text-sm font-extrabold ${
                        nightMode ? 'text-emerald-300' : 'text-emerald-700'
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
                  className={`mt-5 rounded-2xl p-4 border ${
                    nightMode
                      ? 'bg-slate-800/80 border-slate-700 text-sky-200'
                      : 'bg-sky-50/90 border-sky-200 text-sky-950'
                  }`}
                >
                  <p className="font-display font-extrabold text-sm sm:text-base mb-1">
                    معنى الدعاء باختصار:
                  </p>
                  <p className="text-sm sm:text-base leading-relaxed">
                    {currentDuaOrZiyaratItem.meaningSummary}
                  </p>
                </div>
              )}

              <div className="mt-6 space-y-5" ref={readerBodyRef}>
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
                        nightMode ? 'text-amber-50' : 'text-slate-900'
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

          {/* Completion Toast */}
          {justAwardedId === activeReadingId && (
            <div className="mt-6 rounded-2xl bg-emerald-600 text-white p-4 font-display font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 shadow-md">
              <CheckCircle2
                className="w-5 h-5 text-amber-200"
                aria-hidden="true"
              />
              <span>بارك الله فيك! تم تسجيل إتمام هذه القراءة المباركة</span>
            </div>
          )}

          {/* Completion CTA */}
          <div className="mt-8 pt-5 border-t border-current/10 flex flex-wrap items-center justify-between gap-4">
            {isCurrentCompleted ? (
              <div
                className={`flex items-center gap-2 font-bold text-base ${
                  nightMode ? 'text-emerald-300' : 'text-emerald-700'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                <span>أتممت هذه القراءة المباركة</span>
              </div>
            ) : (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFinishReading}
                className="min-h-[54px] px-7 py-3 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-display font-black text-lg shadow-lg flex items-center gap-2.5 cursor-pointer transition-colors"
              >
                <CheckCircle2
                  className="w-5 h-5 text-amber-200"
                  aria-hidden="true"
                />
                <span>أتممت القراءة</span>
              </motion.button>
            )}
          </div>
        </motion.section>
      </div>
    </main>
  );
};
