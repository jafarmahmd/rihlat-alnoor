import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Lightbulb,
  Moon,
  Radio,
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
import { DIGITAL_LIBRARY_ENTRIES } from '../data/digitalLibrary';
import { DUAS_LIST } from '../data/duas';
import { MUNAJAT_LIST } from '../data/munajat';
import { AudioPlaybackProgress, AudioReciterPlayer } from './AudioReciterPlayer';
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
  CornerOrnaments,
  DuaScrollIcon,
  ManuscriptDivider,
  ManuscriptSpinner,
  MunajatMoonIcon,
  QuranBookIcon,
  ShrineDomeIcon,
  SurahCartoucheHeader,
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

const DUA_SUBFILTERS: { id: DuaSubGroup; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'major', label: 'الأدعية الكبرى' },
  { id: 'days', label: 'الأيام السبعة' },
  { id: 'daily', label: 'يومية' },
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

  // All sections open at their flat list (null) unless an explicit entry ID is requested
  const [openedEntryId, setOpenedEntryId] = useState<string | null>(() => {
    if (!initialEntryId) return null;
    if (initialEntryId === 'dl-sahifa-m1') return 'munajat-1';
    if (initialEntryId === 'dl-sahifa-m2') return 'munajat-2';
    if (initialEntryId.startsWith('dl-quran-')) {
      const num = Number(initialEntryId.replace('dl-quran-', ''));
      if (Number.isFinite(num) && num >= 1 && num <= 114) {
        return `dl-quran-${num}`;
      }
    }
    if (
      allDuas.some((d) => d.id === initialEntryId) ||
      allSahifa.some((s) => s.id === initialEntryId) ||
      allZiyarat.some((z) => z.id === initialEntryId) ||
      MUNAJAT_LIST.some((m) => m.id === initialEntryId)
    ) {
      return initialEntryId;
    }
    return null;
  });

  const [titleSearchBySection, setTitleSearchBySection] = useState<
    Record<DigitalLibrarySection, string>
  >({
    adiyat: '',
    sahifa: '',
    ziyarat: '',
    munajat: '',
    quran: '',
  });
  const listScrollYRef = useRef<Record<string, number>>({});
  const pendingListRestoreRef = useRef<boolean>(false);
  const fontsReady = useFontsReady();

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
      setOpenedEntryId(null);
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
        setOpenedEntryId(`dl-quran-${num}`);
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
      setOpenedEntryId(mappedId);
    } else if (MUNAJAT_LIST.some((m) => m.id === mappedId)) {
      setActiveSection('munajat');
      setSelectedMunajatId(mappedId);
      setOpenedEntryId(mappedId);
    }
  }, [initialSection, initialEntryId, navigationNonce, allDuas, allSahifa, allZiyarat]);

  const [fontSize, setFontSize] = useState<number>(22);
  const [nightMode, setNightMode] = useState<boolean>(isGlobalNightTheme);
  useEffect(() => {
    return subscribeAppAppearance((s) => setNightMode(s.colorTheme === 'night'));
  }, []);
  const [justAwardedId, setJustAwardedId] = useState<string | null>(null);
  const [sharePayload, setSharePayload] = useState<ShareCardPayload | null>(null);

  // Quran synced recitation highlight + user-controlled auto-follow toggle
  const [autoFollowRecitation, setAutoFollowRecitation] = useState<boolean>(false);
  const [playingAyahIndex, setPlayingAyahIndex] = useState<number | null>(null);
  const isQuranActivelyPlayingRef = useRef<boolean>(false);
  const lastFollowedAyahRef = useRef<number | null>(null);

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

  const currentTitleSearch = titleSearchBySection[activeSection] || '';
  const normalizedTitleSearch = useMemo(
    () => normalizeArabicForSearch(currentTitleSearch),
    [currentTitleSearch]
  );

  const visibleListEntries = useMemo(() => {
    if (activeSection === 'quran') {
      let base = QURAN_SURAHS_META;
      if (quranSubFilter === 'local') {
        base = base.filter((s) => isSurahAvailableOffline(s.number));
      } else if (quranSubFilter === 'favorites') {
        base = base.filter((s) => bookmarkedIds.includes(`dl-quran-${s.number}`));
      } else if (quranSubFilter === 'meccan') {
        base = base.filter((s) => s.type === 'مكية');
      } else if (quranSubFilter === 'medinan') {
        base = base.filter((s) => s.type === 'مدنية');
      }
      if (normalizedTitleSearch) {
        base = base.filter((surah) => {
          const arName = normalizeArabicForSearch(`سورة ${surah.name}`);
          const numMatch = String(surah.number) === normalizedTitleSearch;
          const typeMatch = normalizeArabicForSearch(surah.type).includes(
            normalizedTitleSearch
          );
          return arName.includes(normalizedTitleSearch) || numMatch || typeMatch;
        });
      }
      return base.map((s) => ({
        id: `dl-quran-${s.number}`,
        title: `${toArabicDigits(s.number)}. سورة ${s.name}`,
        subtitle: `${s.type} · ${toArabicDigits(s.ayahCount)} آية${
          isSurahAvailableOffline(s.number) ? ' · متاحة دون إنترنت' : ''
        }`,
      }));
    }

    if (activeSection === 'ziyarat') {
      let base = allZiyarat;
      if (ziyaratSubFilter === 'favorites') {
        base = base.filter((z) => bookmarkedIds.includes(z.id));
      } else if (ziyaratSubFilter !== 'all') {
        base = base.filter((z) => z.groupKey === ziyaratSubFilter);
      }
      if (normalizedTitleSearch) {
        base = base.filter(
          (z) =>
            normalizeArabicForSearch(z.title).includes(normalizedTitleSearch) ||
            normalizeArabicForSearch(z.subtitle).includes(normalizedTitleSearch)
        );
      }
      return base;
    }

    if (activeSection === 'adiyat') {
      let base = allDuas;
      if (duaSubFilter === 'favorites') {
        base = base.filter((d) => bookmarkedIds.includes(d.id));
      } else if (duaSubFilter !== 'all') {
        base = base.filter((d) => d.groupKey === duaSubFilter);
      }
      if (normalizedTitleSearch) {
        base = base.filter(
          (d) =>
            normalizeArabicForSearch(d.title).includes(normalizedTitleSearch) ||
            normalizeArabicForSearch(d.subtitle).includes(normalizedTitleSearch)
        );
      }
      return base;
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
        ).map((m) => ({
          id: m.id,
          title: m.title,
          subtitle: m.quickMeaning,
        }))
      : MUNAJAT_LIST.map((m) => ({
          id: m.id,
          title: m.title,
          subtitle: m.quickMeaning,
        }));
  }, [
    activeSection,
    quranSubFilter,
    ziyaratSubFilter,
    duaSubFilter,
    normalizedTitleSearch,
    allDuas,
    allSahifa,
    allZiyarat,
    bookmarkedIds,
  ]);

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

  const isInActiveReader = openedEntryId !== null;

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

  const isQuranReady =
    activeSection !== 'quran' || (!surahLoading && !surahError && surahAyat.length > 0);

  // Save and restore exact vertical scroll position per Surah / Dua / Ziyarat / Sahifa / Munajat ID
  useItemScrollPersistence({
    itemId: isInActiveReader ? activeReadingId : null,
    ready: isInActiveReader && fontsReady && isQuranReady,
  });

  // Restore exact list scroll position upon returning from reader
  useLayoutEffect(() => {
    if (openedEntryId !== null || !pendingListRestoreRef.current) {
      return;
    }
    pendingListRestoreRef.current = false;
    const restoreY = listScrollYRef.current[activeSection] ?? 0;
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: restoreY, behavior: 'auto' });
      requestAnimationFrame(() => {
        window.scrollTo({ top: restoreY, behavior: 'auto' });
      });
    }
  }, [openedEntryId, activeSection]);

  // Reset recitation highlight when changing surah or leaving Quran
  useEffect(() => {
    setPlayingAyahIndex(null);
    isQuranActivelyPlayingRef.current = false;
    lastFollowedAyahRef.current = null;
  }, [activeSection, selectedSurahNumber]);

  const surahCharPrefixWeights = useMemo(() => {
    const weights: number[] = [];
    let running = 0;
    for (const ayah of surahAyat) {
      running += Math.max(10, ayah.length);
      weights.push(running);
    }
    return weights;
  }, [surahAyat]);

  const handleQuranPlaybackProgress = useCallback(
    (progress: AudioPlaybackProgress) => {
      isQuranActivelyPlayingRef.current = progress.isPlaying;
      if (
        !progress.hasActiveAudio ||
        progress.duration <= 0 ||
        surahCharPrefixWeights.length === 0 ||
        (!progress.isPlaying && progress.currentTime <= 0.1)
      ) {
        setPlayingAyahIndex(null);
        return;
      }

      const totalWeight = surahCharPrefixWeights[surahCharPrefixWeights.length - 1];
      const ratio = Math.min(0.999999, Math.max(0, progress.currentTime / progress.duration));
      const targetWeight = ratio * totalWeight;
      let idx = surahCharPrefixWeights.findIndex((w) => w >= targetWeight);
      if (idx < 0) idx = surahCharPrefixWeights.length - 1;
      setPlayingAyahIndex((prev) => (prev === idx ? prev : idx));
    },
    [surahCharPrefixWeights]
  );

  // Adjacent Previous / Next navigation metadata for current section
  const adjacentNav = useMemo<{
    prevLabel: string | null;
    nextLabel: string | null;
    goPrev: (() => void) | null;
    goNext: (() => void) | null;
  }>(() => {
    const persistCurrent = () => {
      if (typeof window !== 'undefined') {
        saveItemScrollY(activeReadingId, window.scrollY);
      }
    };

    if (activeSection === 'quran') {
      const idx = QURAN_SURAHS_META.findIndex((s) => s.number === selectedSurahNumber);
      const prev = idx > 0 ? QURAN_SURAHS_META[idx - 1] : null;
      const next =
        idx >= 0 && idx < QURAN_SURAHS_META.length - 1
          ? QURAN_SURAHS_META[idx + 1]
          : null;
      return {
        prevLabel: prev ? `سورة ${prev.name}` : null,
        nextLabel: next ? `سورة ${next.name}` : null,
        goPrev: prev
          ? () => {
              persistCurrent();
              setSelectedSurahNumber(prev.number);
              setOpenedEntryId(`dl-quran-${prev.number}`);
              setJustAwardedId(null);
            }
          : null,
        goNext: next
          ? () => {
              persistCurrent();
              setSelectedSurahNumber(next.number);
              setOpenedEntryId(`dl-quran-${next.number}`);
              setJustAwardedId(null);
            }
          : null,
      };
    }

    if (activeSection === 'munajat') {
      const idx = MUNAJAT_LIST.findIndex((m) => m.id === activeMunajat.id);
      const prev = idx > 0 ? MUNAJAT_LIST[idx - 1] : null;
      const next =
        idx >= 0 && idx < MUNAJAT_LIST.length - 1 ? MUNAJAT_LIST[idx + 1] : null;
      return {
        prevLabel: prev ? prev.title : null,
        nextLabel: next ? next.title : null,
        goPrev: prev
          ? () => {
              persistCurrent();
              setSelectedMunajatId(prev.id);
              setOpenedEntryId(prev.id);
              setJustAwardedId(null);
            }
          : null,
        goNext: next
          ? () => {
              persistCurrent();
              setSelectedMunajatId(next.id);
              setOpenedEntryId(next.id);
              setJustAwardedId(null);
            }
          : null,
      };
    }

    const list =
      activeSection === 'sahifa'
        ? allSahifa
        : activeSection === 'ziyarat'
        ? allZiyarat
        : allDuas;
    const currentId =
      activeSection === 'sahifa'
        ? activeSahifa.id
        : activeSection === 'ziyarat'
        ? activeZiyarat.id
        : activeDua.id;
    const idx = list.findIndex((item) => item.id === currentId);
    const prev = idx > 0 ? list[idx - 1] : null;
    const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

    const selectEntry = (targetId: string) => {
      persistCurrent();
      if (activeSection === 'sahifa') {
        setSelectedSahifaId(targetId);
      } else if (activeSection === 'ziyarat') {
        setSelectedZiyaratId(targetId);
      } else {
        setSelectedDuaId(targetId);
      }
      setOpenedEntryId(targetId);
      setJustAwardedId(null);
    };

    return {
      prevLabel: prev ? prev.title : null,
      nextLabel: next ? next.title : null,
      goPrev: prev ? () => selectEntry(prev.id) : null,
      goNext: next ? () => selectEntry(next.id) : null,
    };
  }, [
    activeReadingId,
    activeSection,
    selectedSurahNumber,
    activeMunajat.id,
    activeSahifa.id,
    activeZiyarat.id,
    activeDua.id,
    allSahifa,
    allZiyarat,
    allDuas,
  ]);

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
    listScrollYRef.current[activeSection] =
      typeof window !== 'undefined' ? window.scrollY : 0;
    if (activeSection === 'quran') {
      const num = Number(id.replace('dl-quran-', ''));
      if (Number.isFinite(num) && num >= 1 && num <= 114) {
        setSelectedSurahNumber(num);
      }
    } else if (activeSection === 'adiyat') {
      setSelectedDuaId(id);
    } else if (activeSection === 'sahifa') {
      setSelectedSahifaId(id);
    } else if (activeSection === 'ziyarat') {
      setSelectedZiyaratId(id);
    } else if (activeSection === 'munajat') {
      setSelectedMunajatId(id);
    }
    setOpenedEntryId(id);
    setJustAwardedId(null);
  };

  const handleBackToList = () => {
    if (typeof window !== 'undefined') {
      saveItemScrollY(activeReadingId, window.scrollY);
    }
    pendingListRestoreRef.current = true;
    setOpenedEntryId(null);
    setJustAwardedId(null);
  };

  useEffect(() => {
    return registerHardwareBackHandler(() => {
      if (sharePayload) {
        setSharePayload(null);
        return true;
      }
      if (openedEntryId !== null) {
        handleBackToList();
        return true;
      }
      return false;
    });
  }, [sharePayload, openedEntryId, activeSection]);

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
      !surahLoading &&
      !surahError,
    contentRef: readerBodyRef,
  });

  // Smoothly auto-follow active ayah ONLY when user explicitly toggles "متابعة تلقائية" ON
  useEffect(() => {
    if (
      activeSection !== 'quran' ||
      !autoFollowRecitation ||
      playingAyahIndex === null ||
      !isQuranActivelyPlayingRef.current
    ) {
      return;
    }
    if (lastFollowedAyahRef.current === playingAyahIndex) return;
    lastFollowedAyahRef.current = playingAyahIndex;

    const container = readerBodyRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(
      `[data-reading-unit-index="${playingAyahIndex}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeSection, autoFollowRecitation, playingAyahIndex]);

  const fontClass =
    FONT_SIZE_CLASS_MAP[fontSize] || FONT_SIZE_CLASS_MAP[22];

  const hasSurahBismillah = activeSurah.number !== 1 && activeSurah.number !== 9;

  // 1) Section List View (Quran, Adiyat, Sahifa, Ziyarat, Munajat) — No Cross-Section Index Drawer
  if (openedEntryId === null) {
    const sectionMeta =
      activeSection === 'quran'
        ? {
            title: 'القرآن الكريم',
            subtitle: `${toArabicDigits(QURAN_SURAHS_META.length)} سورة مباركة · أتممت ${toArabicDigits(
              QURAN_SURAHS_META.filter((s) =>
                completedReadingIds.includes(`dl-quran-${s.number}`)
              ).length
            )}`,
            icon: <QuranBookIcon className="w-6 h-6 text-[#B8924A] shrink-0" />,
            emptyLabel: 'عرض جميع السور',
            placeholder: 'ابحث باسم السورة أو رقمها...',
          }
        : activeSection === 'ziyarat'
        ? {
            title: 'الزيارات الشريفة',
            subtitle: `${toArabicDigits(allZiyarat.length)} زيارة مأثورة · أتممت ${toArabicDigits(
              allZiyarat.filter((z) => completedReadingIds.includes(z.id)).length
            )}`,
            icon: <ShrineDomeIcon className="w-6 h-6 text-[#B8924A] shrink-0" />,
            emptyLabel: 'عرض جميع الزيارات',
            placeholder: 'ابحث في الزيارات...',
          }
        : activeSection === 'sahifa'
        ? {
            title: 'الصحيفة السجادية',
            subtitle: `${toArabicDigits(allSahifa.length)} دعاءً مأثوراً للإمام السجاد (عليه السلام)`,
            icon: <ScrollText className="w-6 h-6 text-[#B8924A] shrink-0" aria-hidden="true" />,
            emptyLabel: 'عرض جميع أدعية الصحيفة',
            placeholder: 'ابحث في عناوين الصحيفة...',
          }
        : activeSection === 'munajat'
        ? {
            title: 'المناجاة الخمس عشرة',
            subtitle: `${toArabicDigits(MUNAJAT_LIST.length)} مناجاة للإمام زين العابدين (عليه السلام)`,
            icon: <MunajatMoonIcon className="w-6 h-6 text-[#B8924A] shrink-0" />,
            emptyLabel: 'عرض جميع المناجاة',
            placeholder: 'ابحث في المناجاة...',
          }
        : {
            title: 'الأدعية ومفاتيح الجنان',
            subtitle: `${toArabicDigits(allDuas.length)} دعاءً مباركاً · أتممت ${toArabicDigits(
              allDuas.filter((d) => completedReadingIds.includes(d.id)).length
            )}`,
            icon: <DuaScrollIcon className="w-6 h-6 text-[#B8924A] shrink-0" />,
            emptyLabel: 'عرض جميع الأدعية',
            placeholder: 'ابحث في الأدعية...',
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

        {/* Section-specific Offline Download & Khatmah Progress (Quran) */}
        {activeSection === 'quran' && (
          <div className="space-y-3 mb-4">
            <div className="flex flex-wrap gap-1.5">
              {QURAN_SUBFILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setQuranSubFilter(f.id)}
                  className={`min-h-[34px] px-3 py-1 rounded-[5px] border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    quranSubFilter === f.id
                      ? 'bg-[#0F3D2E] text-[#FAF6EC] border-[#B8924A]'
                      : 'bg-[#FAF6EC] hover:bg-[#F3ECDA] text-[#425B51] border-[#B8924A]/35'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {offlineQuranCount < QURAN_SURAHS_META.length ? (
                <button
                  type="button"
                  onClick={handleDownloadAllQuranOffline}
                  disabled={downloadingAllQuran}
                  className="w-full min-h-[44px] px-3.5 py-2 btn-manuscript text-xs flex items-center justify-between gap-2 cursor-pointer disabled:opacity-75"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Download className="w-4 h-4 text-[#1F6B50] shrink-0" aria-hidden="true" />
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
                <div className="min-h-[44px] px-3.5 py-2 rounded-[6px] bg-[#0F3D2E]/8 border border-[#1F6B50]/35 text-[#0F3D2E] text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#1F6B50] shrink-0" aria-hidden="true" />
                  <span>المصحف كاملاً (١١٤ سورة) محفوظ دون إنترنت</span>
                </div>
              )}

              <div className="px-3.5 py-2 rounded-[6px] bg-[#F3ECDA]/70 border border-[#B8924A]/35 text-xs flex flex-col justify-center">
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
          </div>
        )}

        {/* Section-specific Subfilters for Adiyat & Ziyarat */}
        {activeSection === 'adiyat' && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {DUA_SUBFILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDuaSubFilter(f.id)}
                className={`min-h-[34px] px-3 py-1 rounded-[5px] border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
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

        {activeSection === 'ziyarat' && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {ZIYARAT_SUBFILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setZiyaratSubFilter(f.id)}
                className={`min-h-[34px] px-3 py-1 rounded-[5px] border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
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

        {/* Live Title Search inside Current Section Only */}
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
            placeholder={sectionMeta.placeholder}
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

        {/* Clean Single-Column Flat List */}
        <div className="manuscript-folio paper-grain rounded-[6px] divide-y divide-[#B8924A]/20 overflow-hidden">
          {visibleListEntries.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <p className="font-display font-bold text-sm text-[#425B51]">
                لم نعثر على نتائج مطابقة في هذا القسم.
              </p>
              <button
                type="button"
                onClick={() => {
                  setTitleSearchBySection((prev) => ({
                    ...prev,
                    [activeSection]: '',
                  }));
                  setQuranSubFilter('all');
                  setDuaSubFilter('all');
                  setZiyaratSubFilter('all');
                }}
                className="mt-2 btn-text-ornate text-xs cursor-pointer"
              >
                {sectionMeta.emptyLabel}
              </button>
            </div>
          ) : (
            visibleListEntries.map((entry) => {
              const id = entry.id;
              const done = completedReadingIds.includes(id);
              const fav = bookmarkedIds.includes(id);
              const hasProgress =
                !done &&
                (getSavedItemScrollY(id) > 0 || getSavedReadingPosition(id) > 0);

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
                      {entry.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 text-xs text-[#425B51]">
                      <span className="truncate">{entry.subtitle}</span>
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

  // 2) Full-Page Single Entry Reader (Unified across Quran, Adiyat, Sahifa, Ziyarat, Munajat)
  const readerTitle =
    activeSection === 'quran'
      ? `سورة ${activeSurah.name}`
      : activeSection === 'munajat'
      ? activeMunajat.title
      : currentDuaOrZiyaratItem.title;

  const readerSubtitle =
    activeSection === 'quran'
      ? `السورة رقم ${toArabicDigits(activeSurah.number)} · ${activeSurah.type} · ${toArabicDigits(
          activeSurah.ayahCount
        )} آية`
      : activeSection === 'munajat'
      ? `المناجاة رقم ${toArabicDigits(activeMunajat.number)} من ١٥ · الإمام زين العابدين (عليه السلام)`
      : `${currentDuaOrZiyaratItem.groupLabel} · ${currentDuaOrZiyaratItem.subtitle}`;

  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Top Reader Controls: Back to List / Home + Typography + Night Mode */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-4 mb-5 border-b border-[#B8924A]/35">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={handleBackToList}
            className="min-h-[42px] px-3.5 py-2 btn-manuscript text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowRight className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
            <span>رجوع للقائمة</span>
          </button>

          <div className="min-w-0">
            <h1 className="font-calligraphy font-bold text-xl sm:text-2xl text-[#0F3D2E] truncate">
              {readerTitle}
            </h1>
            <p className="text-xs text-[#425B51] truncate mt-0.5 tabular-nums">
              {readerSubtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
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

      {/* Illuminated Continuous Reader Folio */}
      <section
        aria-label="لوحة القراءة"
        className={`relative rounded-[6px] p-7 sm:p-9 lg:p-11 transition-colors duration-200 paper-grain ${
          nightMode ? 'manuscript-folio-dark' : 'manuscript-folio text-[#11271F]'
        }`}
      >
        <CornerOrnaments tone={nightMode ? 'dark' : 'auto'} />

        {activeSection === 'quran' ? (
          <>
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
                  <button
                    type="button"
                    onClick={() => setAutoFollowRecitation((v) => !v)}
                    aria-pressed={autoFollowRecitation}
                    className={`min-h-[38px] px-3 py-1 rounded-[5px] border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      autoFollowRecitation
                        ? 'bg-[#0F3D2E] border-[#D9B96A] text-[#FAF6EC]'
                        : nightMode
                          ? 'bg-[#081A14] border-[#B8924A]/35 text-[#F3EBD6]/85 hover:text-[#D9B96A]'
                          : 'bg-[#FAF6EC] border-[#B8924A]/45 text-[#0F3D2E] hover:bg-[#F3ECDA]'
                    }`}
                  >
                    <Radio
                      className={`w-3.5 h-3.5 ${
                        autoFollowRecitation ? 'text-[#D9B96A]' : ''
                      }`}
                      aria-hidden="true"
                    />
                    <span>متابعة تلقائية</span>
                  </button>

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
              onPlaybackProgress={handleQuranPlaybackProgress}
            />

            {hasSurahBismillah && (
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
                    fontsReady ? 'opacity-100' : 'opacity-0'
                  } ${nightMode ? 'text-[#F3EBD6]' : 'text-[#11271F]'}`}
                >
                  {surahAyat.map((ayah, idx) => {
                    const isRecited = playingAyahIndex === idx;
                    const isActive =
                      focusTrackerEnabled && activeUnitIndex === idx;
                    const recitedBgOnly =
                      isRecited && !isActive
                        ? nightMode
                          ? 'bg-[#D9B96A]/18 rounded-[4px] px-1 py-0.5'
                          : 'bg-[#B8924A]/20 rounded-[4px] px-1 py-0.5'
                        : '';
                    const spanClass = isActive
                      ? getReadingUnitClasses({
                          isActive: true,
                          enabled: true,
                          nightMode,
                          theme: focusTheme,
                        })
                      : isRecited
                      ? `inline box-decoration-clone cursor-pointer transition-colors duration-150 ${recitedBgOnly}`
                      : getReadingUnitClasses({
                          isActive: false,
                          enabled: focusTrackerEnabled,
                          nightMode,
                          theme: focusTheme,
                        });
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
                          className={spanClass}
                        >
                          {ayah}
                          <AyahRosetteMarker
                            numberArabic={toArabicDigits(idx + 1)}
                            dark={nightMode}
                            highlighted={isActive || isRecited}
                          />
                        </span>{' '}
                      </React.Fragment>
                    );
                  })}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="pt-2 pb-4 border-b border-[#B8924A]/35 flex flex-wrap items-start justify-between gap-3">
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                    nightMode ? 'text-[#D9B96A]' : 'text-[#1F6B50]'
                  }`}
                >
                  {activeSection === 'munajat' ? (
                    <MunajatMoonIcon className="w-4 h-4" />
                  ) : activeSection === 'ziyarat' ? (
                    <ShrineDomeIcon className="w-4 h-4" />
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

                <div
                  className={`mt-4 max-w-prose mx-auto space-y-6 ${
                    fontsReady ? 'opacity-100' : 'opacity-0'
                  }`}
                  ref={readerBodyRef}
                >
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

                <div
                  className={`mt-4 max-w-prose mx-auto space-y-6 ${
                    fontsReady ? 'opacity-100' : 'opacity-0'
                  }`}
                  ref={readerBodyRef}
                >
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

        {/* Static Previous / Next Navigation */}
        <nav
          aria-label="التنقل بين النصوص"
          className="mt-6 pt-5 border-t border-[#B8924A]/25 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <button
            type="button"
            disabled={!adjacentNav.goPrev}
            onClick={() => adjacentNav.goPrev?.()}
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
                  {adjacentNav.prevLabel || 'أول القائمة'}
                </span>
              </span>
            </span>
          </button>

          <button
            type="button"
            disabled={!adjacentNav.goNext}
            onClick={() => adjacentNav.goNext?.()}
            className={`min-h-[48px] px-4 py-2.5 rounded-[6px] border text-left flex items-center justify-end gap-2 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed transition-colors ${
              nightMode
                ? 'bg-[#081A14] border-[#D9B96A]/35 text-[#F3EBD6] hover:bg-[#113127]'
                : 'bg-[#FAF6EC] border-[#B8924A]/45 text-[#0F3D2E] hover:bg-[#F3ECDA]'
            }`}
          >
            <span className="min-w-0 text-left">
              <span className="block text-[11px] opacity-75">التالي</span>
              <span className="block font-display font-bold text-xs sm:text-sm truncate">
                {adjacentNav.nextLabel || 'آخر القائمة'}
              </span>
            </span>
            <ChevronLeft className="w-4 h-4 shrink-0 text-[#B8924A]" aria-hidden="true" />
          </button>
        </nav>
      </section>

      <ShareCardModal
        payload={sharePayload}
        onClose={() => setSharePayload(null)}
      />
    </main>
  );
};
