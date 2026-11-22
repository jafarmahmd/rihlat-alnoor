import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, animate } from 'motion/react';
import { ArrowLeft, Bookmark, CheckCircle2, ChevronDown, ChevronUp, LocateFixed, X } from 'lucide-react';
import { GlobalSearchBar } from './GlobalSearchBar';
import {
  QiblaCompassModal,
  requestIosCompassPermissionIfNeeded,
} from './QiblaCompassModal';
import {
  AsrSunIcon,
  AstrolabeIcon,
  BookmarkStarIcon,
  CalendarArchIcon,
  DhikrHandsIcon,
  DuaScrollIcon,
  FajrHorizonIcon,
  HomeDomeCornerSvg,
  HomeIllustratedBannerSvg,
  InfoCircleArchIcon,
  IshaStarsIcon,
  KidsQuizLanternIcon,
  MafatihKeyIcon,
  MaghribCrescentIcon,
  MidnightStarMoonIcon,
  MinaretAdhanIcon,
  MunajatMoonIcon,
  NoonSunIcon,
  PinArchIcon,
  QiblaKaabaCompassIcon,
  QuranBookIcon,
  SahifaManuscriptIcon,
  SearchCrescentIcon,
  SeasonalCrescentCalendarIcon,
  ShrineDomeIcon,
  StoriesLanternIcon,
  SunriseOrbIcon,
  SunsetHorizonIcon,
  TasbihBeadsIcon,
  WeeklySunScrollIcon,
} from './IslamicOrnaments';
import { loadAdhanSettings } from '../data/adhanSettings';
import { getVerseOfTheDay } from '../data/dailyVerses';
import { getTodayWisdom } from '../data/dailyWisdom';
import { DIGITAL_LIBRARY_ENTRIES } from '../data/digitalLibrary';
import { DUAS_LIST } from '../data/duas';
import { ARABIC_WEEKDAYS, getTodayHijriDate } from '../data/hijriCalendar';
import { MASOOMEEN_LIBRARY } from '../data/library';
import { MUNAJAT_LIST } from '../data/munajat';
import { QURAN_SURAHS_META } from '../data/quran';
import { getTodaySpiritualGuidance } from '../data/spiritualNotifications';
import { DigitalLibrarySection, LastReadPosition } from '../types/game';
import {
  loadAppAppearanceSettings,
  subscribeAppAppearance,
} from '../utils/appAppearance';
import { registerHardwareBackHandler } from '../utils/hardwareBack';
import {
  PrayerLocationPreference,
  computeLocalAdhanPrayerTimes,
  formatHHMMArabic12h,
  getNextPrayerInfo,
  loadPrayerLocationPreference,
  toArabicNums,
} from '../utils/prayerTimes';
import { Capacitor } from '@capacitor/core';
import {
  GpsDetectionResult,
  LocationPermissionStatus,
  detectAndSaveGpsLocation,
  getGpsDetecting,
  openAppLocationPermissionSettings,
  openDeviceLocationSettings,
  subscribeGpsStatus,
} from '../utils/gpsLocation';

interface HomeScreenProps {
  availableStars: number;
  completedCount: number;
  completedReadingIds: string[];
  bookmarkedIds?: string[];
  hijriOffset: number;
  lastRead: LastReadPosition | null;
  currentLocation?: PrayerLocationPreference;
  locationStatus?: LocationPermissionStatus;
  onStartJourney: () => void;
  onOpenStore: () => void;
  onOpenLibrary: (storyId?: string) => void;
  onOpenTasbih: () => void;
  onOpenCalendar: () => void;
  onOpenAdhanSettings?: () => void;
  onOpenInfo?: () => void;
  onOpenSettings?: () => void;
  onOpenLibrarySection: (
    section: DigitalLibrarySection,
    entryId?: string
  ) => void;
  onCompleteReading: (readingId: string) => boolean;
  onResumeLastRead: () => void;
}

interface DailyActChip {
  id: string;
  label: string;
  sublabel?: string;
  kind: 'direct' | 'summary';
  summaryText?: string;
  action: () => void;
}

const DAY_ZIYARAT_LINK: Record<number, { id: string; label: string }> = {
  0: { id: 'dl-z-amin', label: 'زيارة أمير المؤمنين (ع)' },
  1: { id: 'dl-z-husain', label: 'زيارة السبطين (ع)' },
  2: { id: 'dl-z-kadhimein', label: 'زيارة أئمة البقيع' },
  3: { id: 'dl-z-reza', label: 'زيارة الإمام الرضا (ع)' },
  4: { id: 'dl-dua-kumayl', label: 'دعاء كميل (ليلة الجمعة)' },
  5: { id: 'dl-z-yasin', label: 'زيارة آل ياسين' },
  6: { id: 'dl-z-prophet-near', label: 'زيارة النبي الأكرم (ص)' },
};

const DAY_DUA_IDS: Record<number, string> = {
  0: 'dua-sunday',
  1: 'dua-monday',
  2: 'dua-tuesday',
  3: 'dua-wednesday',
  4: 'dua-thursday',
  5: 'dua-friday',
  6: 'dua-saturday',
};

const DAY_MUNAJAT_IDS: Record<number, string> = {
  0: 'munajat-7', // المطيعين
  1: 'munajat-2', // الشاكين
  2: 'munajat-1', // التائبين
  3: 'munajat-3', // الخائفين
  4: 'munajat-4', // الراجين
  5: 'munajat-5', // الراغبين
  6: 'munajat-11', // المفتقرين
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  completedReadingIds,
  bookmarkedIds = [],
  hijriOffset,
  lastRead,
  currentLocation,
  locationStatus,
  onStartJourney,
  onOpenLibrary,
  onOpenTasbih,
  onOpenCalendar,
  onOpenAdhanSettings,
  onOpenInfo,
  onOpenSettings,
  onOpenLibrarySection,
  onResumeLastRead,
}) => {
  const [now, setNow] = useState<Date>(() => new Date());
  const [appearance, setAppearance] = useState(loadAppAppearanceSettings);
  const [locPref, setLocPref] = useState<PrayerLocationPreference>(() =>
    currentLocation || loadPrayerLocationPreference()
  );
  const [gpsDetecting, setGpsDetecting] = useState<boolean>(getGpsDetecting);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);
  const [gpsReason, setGpsReason] = useState<GpsDetectionResult['reason'] | null>(
    null
  );
  const [adhanSettings, setAdhanSettings] = useState(() => loadAdhanSettings());
  const isAndroid =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  useEffect(() => {
    if (currentLocation) {
      setLocPref(currentLocation);
    }
  }, [currentLocation]);

  // Modals
  const [searchOpen, setSearchOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [qiblaOpen, setQiblaOpen] = useState(false);
  const [actDetailModal, setActDetailModal] = useState<{
    title: string;
    summary: string;
    ctaLabel: string;
    onGo: () => void;
  } | null>(null);

  // Draggable Bottom Sheet state
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [collapsedY, setCollapsedY] = useState<number>(() =>
    typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.44) : 340
  );
  const sheetY = useMotionValue(
    typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.44) : 340
  );
  const sheetScrollRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    active: boolean;
    startClientY: number;
    startSheetY: number;
    lastClientY: number;
    lastTime: number;
    velocity: number;
    moved: boolean;
  }>({
    active: false,
    startClientY: 0,
    startSheetY: 0,
    lastClientY: 0,
    lastTime: 0,
    velocity: 0,
    moved: false,
  });

  // Live clock + settings sync
  useEffect(() => {
    const unsubAppearance = subscribeAppAppearance(setAppearance);
    const unsubGps = subscribeGpsStatus(setGpsDetecting);
    const tickId = window.setInterval(() => setNow(new Date()), 1000);
    const syncAdhan = () => setAdhanSettings(loadAdhanSettings());
    const syncLoc = () => setLocPref(loadPrayerLocationPreference());
    window.addEventListener('rihlat:adhan-settings-updated', syncAdhan);
    window.addEventListener('rihlat:prayer-location-updated', syncLoc);
    return () => {
      unsubAppearance();
      unsubGps();
      window.clearInterval(tickId);
      window.removeEventListener('rihlat:adhan-settings-updated', syncAdhan);
      window.removeEventListener('rihlat:prayer-location-updated', syncLoc);
    };
  }, []);

  // Recompute collapsed sheet offset cleanly on viewport resize
  useEffect(() => {
    const updateSnap = () => {
      const vh = window.innerHeight || 800;
      const nextCollapsed = Math.max(220, Math.min(460, Math.round(vh * 0.44)));
      setCollapsedY(nextCollapsed);
      if (!sheetExpanded) {
        sheetY.set(nextCollapsed);
      }
    };
    updateSnap();
    window.addEventListener('resize', updateSnap);
    return () => window.removeEventListener('resize', updateSnap);
  }, [sheetExpanded, sheetY]);

  const snapSheetTo = useCallback(
    (expand: boolean) => {
      setSheetExpanded(expand);
      const target = expand ? 0 : collapsedY;
      animate(sheetY, target, {
        type: 'spring',
        stiffness: 340,
        damping: 34,
        mass: 0.9,
      });
      if (!expand && sheetScrollRef.current) {
        sheetScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [collapsedY, sheetY]
  );

  // Android hardware back handler for Home overlays/sheet
  useEffect(() => {
    if (!searchOpen && !favoritesOpen && !qiblaOpen && !actDetailModal && !sheetExpanded) {
      return;
    }
    return registerHardwareBackHandler(() => {
      if (actDetailModal) {
        setActDetailModal(null);
        return true;
      }
      if (qiblaOpen) {
        setQiblaOpen(false);
        return true;
      }
      if (searchOpen) {
        setSearchOpen(false);
        return true;
      }
      if (favoritesOpen) {
        setFavoritesOpen(false);
        return true;
      }
      if (sheetExpanded) {
        snapSheetTo(false);
        return true;
      }
      return false;
    });
  }, [searchOpen, favoritesOpen, qiblaOpen, actDetailModal, sheetExpanded, snapSheetTo]);

  // Pointer drag handlers for tactile 60fps Bottom Sheet
  const beginDrag = (clientY: number) => {
    dragStateRef.current = {
      active: true,
      startClientY: clientY,
      startSheetY: sheetY.get(),
      lastClientY: clientY,
      lastTime: performance.now(),
      velocity: 0,
      moved: false,
    };
  };

  const moveDrag = (clientY: number) => {
    const st = dragStateRef.current;
    if (!st.active) return;
    const nowTs = performance.now();
    const dt = Math.max(8, nowTs - st.lastTime);
    st.velocity = ((clientY - st.lastClientY) / dt) * 1000;
    st.lastClientY = clientY;
    st.lastTime = nowTs;

    const delta = clientY - st.startClientY;
    if (Math.abs(delta) > 5) st.moved = true;

    let nextY = st.startSheetY + delta;
    if (nextY < 0) nextY = nextY * 0.2;
    if (nextY > collapsedY) nextY = collapsedY + (nextY - collapsedY) * 0.25;
    sheetY.set(nextY);
  };

  const endDrag = () => {
    const st = dragStateRef.current;
    if (!st.active) return;
    st.active = false;
    const currentY = sheetY.get();
    if (!st.moved) return;

    if (st.velocity < -260) {
      snapSheetTo(true);
    } else if (st.velocity > 260) {
      snapSheetTo(false);
    } else {
      snapSheetTo(currentY < collapsedY * 0.55);
    }
  };

  // Prayer calculations & 8 times
  const prayerData = useMemo(
    () =>
      computeLocalAdhanPrayerTimes(
        locPref.lat,
        locPref.lng,
        locPref.cityLabel,
        now,
        adhanSettings
      ),
    [locPref.lat, locPref.lng, locPref.cityLabel, now, adhanSettings]
  );

  const nextPrayer = useMemo(
    () => getNextPrayerInfo(prayerData.timings, now),
    [prayerData.timings, now]
  );

  const todayHijri = useMemo(
    () => getTodayHijriDate(now, hijriOffset),
    [now, hijriOffset]
  );

  const weekdayName = ARABIC_WEEKDAYS[now.getDay()] || 'اليوم';
  const headerHijriLabel = `${weekdayName} / ${todayHijri.day} ${todayHijri.monthName} / ${todayHijri.year}`;

  const todayGuidance = useMemo(() => getTodaySpiritualGuidance(now), [now]);
  const todayWisdom = useMemo(() => getTodayWisdom(), []);
  const verseOfTheDay = useMemo(() => getVerseOfTheDay(now), [now]);

  const eightTimesGrid: {
    key: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'sunset' | 'maghrib' | 'isha' | 'midnight';
    label: string;
    timeHHMM: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'fajr',
      label: 'الصبح',
      timeHHMM: prayerData.timings.fajr,
      icon: <FajrHorizonIcon className="w-3.5 h-3.5" />,
    },
    {
      key: 'sunrise',
      label: 'الشروق',
      timeHHMM: prayerData.timings.sunrise,
      icon: <SunriseOrbIcon className="w-3.5 h-3.5" />,
    },
    {
      key: 'dhuhr',
      label: 'الظهر',
      timeHHMM: prayerData.timings.dhuhr,
      icon: <NoonSunIcon className="w-3.5 h-3.5" />,
    },
    {
      key: 'asr',
      label: 'العصر',
      timeHHMM: prayerData.timings.asr,
      icon: <AsrSunIcon className="w-3.5 h-3.5" />,
    },
    {
      key: 'sunset',
      label: 'الغروب',
      timeHHMM: prayerData.timings.sunset,
      icon: <SunsetHorizonIcon className="w-3.5 h-3.5" />,
    },
    {
      key: 'maghrib',
      label: 'المغرب',
      timeHHMM: prayerData.timings.maghrib,
      icon: <MaghribCrescentIcon className="w-3.5 h-3.5" />,
    },
    {
      key: 'isha',
      label: 'العشاء',
      timeHHMM: prayerData.timings.isha,
      icon: <IshaStarsIcon className="w-3.5 h-3.5" />,
    },
    {
      key: 'midnight',
      label: 'منتصف الليل',
      timeHHMM: prayerData.timings.midnight,
      icon: <MidnightStarMoonIcon className="w-3.5 h-3.5" />,
    },
  ];

  // Daily recommended acts chips
  const dayIdx = now.getDay();
  const todayDuaId = DAY_DUA_IDS[dayIdx] || 'dua-sunday';
  const todayZiyarat = DAY_ZIYARAT_LINK[dayIdx] || DAY_ZIYARAT_LINK[0];
  const todayMunajatId = DAY_MUNAJAT_IDS[dayIdx] || 'munajat-1';

  const dailyActChips: DailyActChip[] = useMemo(() => {
    const base: DailyActChip[] = [
      {
        id: 'chip-dua-today',
        label: `دعاء يوم ${todayGuidance.dayNameAr}`,
        kind: 'direct',
        action: () => onOpenLibrarySection('adiyat', todayDuaId),
      },
      {
        id: 'chip-tasbih-today',
        label: 'تسبيح اليوم',
        kind: 'direct',
        action: () => onOpenTasbih(),
      },
      {
        id: 'chip-ziyarat-today',
        label: todayZiyarat.label,
        kind: 'direct',
        action: () =>
          onOpenLibrarySection(
            todayZiyarat.id.startsWith('dl-dua') ? 'adiyat' : 'ziyarat',
            todayZiyarat.id
          ),
      },
      {
        id: 'chip-munajat-today',
        label: 'مناجاة وعوذة اليوم',
        kind: 'direct',
        action: () => onOpenLibrarySection('munajat', todayMunajatId),
      },
    ];

    // Add remaining curated daily acts from spiritual guidance
    todayGuidance.recommendedActs.slice(0, 3).forEach((actText, idx) => {
      base.push({
        id: `chip-act-${idx}`,
        label: actText.length > 32 ? `${actText.slice(0, 30)}...` : actText,
        kind: 'summary',
        summaryText: actText,
        action: () =>
          setActDetailModal({
            title: todayGuidance.title,
            summary: `${actText}\n\nالذكر المستحب: ${todayWisdom.arabicDhikr}`,
            ctaLabel: todayGuidance.linkedLabel,
            onGo: () => {
              setActDetailModal(null);
              if (todayGuidance.linkedSection === 'tasbih') {
                onOpenTasbih();
              } else if (todayGuidance.linkedSection === 'library') {
                onOpenLibrary(todayGuidance.linkedEntryId);
              } else if (todayGuidance.linkedSection === 'duas') {
                onOpenLibrarySection('adiyat', todayGuidance.linkedEntryId);
              } else {
                onOpenLibrarySection(
                  todayGuidance.linkedSection,
                  todayGuidance.linkedEntryId
                );
              }
            },
          }),
      });
    });

    return base;
  }, [
    todayGuidance,
    todayDuaId,
    todayZiyarat,
    todayMunajatId,
    todayWisdom.arabicDhikr,
    onOpenLibrarySection,
    onOpenTasbih,
    onOpenLibrary,
  ]);

  // Resolved Bookmarks list
  const bookmarkedItems = useMemo(() => {
    return bookmarkedIds.map((id) => {
      const dl = DIGITAL_LIBRARY_ENTRIES.find((e) => e.id === id);
      if (dl) {
        return {
          id,
          title: dl.title,
          category:
            dl.section === 'ziyarat'
              ? 'الزيارات'
              : dl.section === 'sahifa'
              ? 'الصحيفة السجادية'
              : 'الأدعية الكبرى',
          action: () => {
            setFavoritesOpen(false);
            onOpenLibrarySection(dl.section, dl.id);
          },
        };
      }
      const dua = DUAS_LIST.find((d) => d.id === id);
      if (dua) {
        return {
          id,
          title: dua.title,
          category: 'الأدعية الأسبوعية',
          action: () => {
            setFavoritesOpen(false);
            onOpenLibrarySection('adiyat', dua.id);
          },
        };
      }
      const munajat = MUNAJAT_LIST.find((m) => m.id === id);
      if (munajat) {
        return {
          id,
          title: munajat.title,
          category: 'المناجاة',
          action: () => {
            setFavoritesOpen(false);
            onOpenLibrarySection('munajat', munajat.id);
          },
        };
      }
      if (id.startsWith('dl-quran-')) {
        const sNum = Number(id.replace('dl-quran-', ''));
        const meta = QURAN_SURAHS_META.find((s) => s.number === sNum);
        return {
          id,
          title: meta ? `سورة ${meta.name}` : `سورة رقم ${sNum}`,
          category: 'القرآن الكريم',
          action: () => {
            setFavoritesOpen(false);
            onOpenLibrarySection('quran', id);
          },
        };
      }
      for (const fig of MASOOMEEN_LIBRARY) {
        const st = fig.stories.find((s) => s.id === id);
        if (st) {
          return {
            id,
            title: st.title,
            category: fig.name,
            action: () => {
              setFavoritesOpen(false);
              onOpenLibrary(st.id);
            },
          };
        }
      }
      return {
        id,
        title: id,
        category: 'مفضلة',
        action: () => setFavoritesOpen(false),
      };
    });
  }, [bookmarkedIds, onOpenLibrarySection, onOpenLibrary]);

  // 7 Worship Circles
  const worshipItems = [
    {
      id: 'w-quran',
      label: 'القرآن الكريم',
      icon: <QuranBookIcon className="w-6 h-6" />,
      onClick: () => onOpenLibrarySection('quran'),
    },
    {
      id: 'w-duas',
      label: 'الأدعية والصلوات',
      icon: <DuaScrollIcon className="w-6 h-6" />,
      onClick: () => onOpenLibrarySection('adiyat'),
    },
    {
      id: 'w-munajat',
      label: 'المناجاة والأذكار',
      icon: <MunajatMoonIcon className="w-6 h-6" />,
      onClick: () => onOpenLibrarySection('munajat'),
    },
    {
      id: 'w-sahifa',
      label: 'الصحيفة السجادية',
      icon: <SahifaManuscriptIcon className="w-6 h-6" />,
      onClick: () => onOpenLibrarySection('sahifa'),
    },
    {
      id: 'w-tasbih',
      label: 'المسبحة الإلكترونية',
      icon: <TasbihBeadsIcon className="w-6 h-6" />,
      onClick: onOpenTasbih,
    },
    {
      id: 'w-prayer',
      label: 'أوقات الصلاة',
      icon: <MinaretAdhanIcon className="w-6 h-6" />,
      onClick: () => onOpenAdhanSettings?.(),
    },
    {
      id: 'w-qibla',
      label: 'اتجاه القبلة',
      icon: <QiblaKaabaCompassIcon className="w-6 h-6" />,
      onClick: () => {
        setQiblaOpen(true);
        void requestIosCompassPermissionIfNeeded();
      },
    },
  ];

  // 6 Duas & Ziyarat Tiles (3 columns, identity-only non-rainbow muted tints)
  const duasZiyaratTiles = [
    {
      id: 'dz-mafatih',
      label: 'مفاتيح الجنان',
      dayTint: '#E5EFE9', // soft sage
      nightTint: '#113025',
      icon: <MafatihKeyIcon className="w-6 h-6" />,
      onClick: () => onOpenLibrarySection('adiyat'),
    },
    {
      id: 'dz-ziyarat',
      label: 'الزيارات',
      dayTint: '#EFE6D1', // sandy parchment
      nightTint: '#183227',
      icon: <ShrineDomeIcon className="w-6 h-6" />,
      onClick: () => onOpenLibrarySection('ziyarat'),
    },
    {
      id: 'dz-weekly',
      label: 'الأدعية الأسبوعية',
      dayTint: '#EAEFE2', // olive mist
      nightTint: '#14362B',
      icon: <WeeklySunScrollIcon className="w-6 h-6" />,
      onClick: () => onOpenLibrarySection('adiyat', todayDuaId),
    },
    {
      id: 'dz-annual',
      label: 'الأدعية السنوية',
      dayTint: '#F5EBD4', // warm pale gold
      nightTint: '#1B3429',
      icon: <SeasonalCrescentCalendarIcon className="w-6 h-6" />,
      onClick: () => onOpenLibrarySection('adiyat', 'dl-dua-arafah'),
    },
    {
      id: 'dz-munajat',
      label: 'المناجاة',
      dayTint: '#E2EBE7', // gray-green
      nightTint: '#102B22',
      icon: <MunajatMoonIcon className="w-6 h-6" />,
      onClick: () => onOpenLibrarySection('munajat'),
    },
    {
      id: 'dz-dhikr',
      label: 'الأذكار',
      dayTint: '#EAE1CC', // deeper ivory
      nightTint: '#163428',
      icon: <DhikrHandsIcon className="w-6 h-6" />,
      onClick: onOpenTasbih,
    },
  ];

  // 6 Other Topics Tiles (2 columns inside a rounded container card)
  const otherTopicTiles = [
    {
      id: 'ot-calendar',
      label: 'التقويم الهجري',
      dayTint: '#E6EFE9',
      nightTint: '#123227',
      icon: <CalendarArchIcon className="w-6 h-6" />,
      onClick: onOpenCalendar,
    },
    {
      id: 'ot-qibla',
      label: 'اتجاه القبلة',
      dayTint: '#F4EAD3',
      nightTint: '#18342A',
      icon: <QiblaKaabaCompassIcon className="w-6 h-6" />,
      onClick: () => {
        setQiblaOpen(true);
        void requestIosCompassPermissionIfNeeded();
      },
    },
    {
      id: 'ot-kids',
      label: 'الأطفال (القصص والألعاب)',
      dayTint: '#EAEFE2',
      nightTint: '#14352A',
      icon: <StoriesLanternIcon className="w-6 h-6" />,
      onClick: () => onOpenLibrary(),
    },
    {
      id: 'ot-qa',
      label: 'أسئلة وأجوبة الأطفال',
      dayTint: '#EFE6D2',
      nightTint: '#1A362B',
      icon: <KidsQuizLanternIcon className="w-6 h-6" />,
      onClick: onStartJourney,
    },
    {
      id: 'ot-sahifa',
      label: 'الصحيفة السجادية',
      dayTint: '#E3ECE8',
      nightTint: '#102C22',
      icon: <SahifaManuscriptIcon className="w-6 h-6" />,
      onClick: () => onOpenLibrarySection('sahifa'),
    },
    {
      id: 'ot-tasbih',
      label: 'المسبحة',
      dayTint: '#EBE2CD',
      nightTint: '#163328',
      icon: <TasbihBeadsIcon className="w-6 h-6" />,
      onClick: onOpenTasbih,
    },
  ];

  const isNight = appearance.colorTheme === 'night';

  const handleContinueReading = () => {
    if (lastRead) {
      onResumeLastRead();
    } else {
      onOpenLibrarySection('quran', `dl-quran-${verseOfTheDay.surahNumber}`);
    }
  };

  return (
    <div
      dir="rtl"
      className="relative w-full h-[100dvh] overflow-hidden home-top-gradient text-[#FAF6EC] select-none"
    >
      {/* Subtle 8-pointed star lattice (5-8% opacity) */}
      <div
        className="pointer-events-none absolute inset-0 home-khatam-overlay opacity-90"
        aria-hidden="true"
      />

      {/* Ultra-thin gold SVG dome/crescent corner ornament */}
      <HomeDomeCornerSvg className="pointer-events-none absolute -top-3 -left-6 w-44 sm:w-56 h-auto opacity-85" />

      {/* ================================================================
          UPPER EMERALD REGION (1 to 6 in strict vertical order)
          Scrollable smoothly inside its upper zone so even shorter screens
          can always reach every card above the bottom sheet.
         ================================================================ */}
      <div
        className="relative z-10 h-full overflow-y-auto no-scrollbar max-w-xl mx-auto px-3.5 sm:px-5 pt-[max(12px,env(safe-area-inset-top))]"
        style={{ paddingBottom: 'calc(56dvh + 24px)' }}
      >
        {/* 2) الشريط العلوي: معلومات التطبيق · التاريخ الهجري · الإعدادات */}
        <header className="flex items-center justify-between gap-2 pb-3">
          <button
            type="button"
            onClick={() => onOpenInfo?.()}
            aria-label="معلومات عن التطبيق"
            title="معلومات عن التطبيق"
            className="w-10 h-10 rounded-full bg-[#FAF6EC]/10 hover:bg-[#FAF6EC]/18 border border-[#D9B96A]/30 flex items-center justify-center text-[#FAF6EC] transition-colors cursor-pointer shrink-0"
          >
            <InfoCircleArchIcon className="w-5 h-5" />
          </button>

          <div className="text-center px-2 min-w-0">
            <p className="font-display font-bold text-xs sm:text-sm text-[#FAF6EC] tracking-wide truncate tabular-nums">
              {headerHijriLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenSettings?.()}
            aria-label="الإعدادات"
            title="الإعدادات"
            className="w-10 h-10 rounded-full bg-[#FAF6EC]/10 hover:bg-[#FAF6EC]/18 border border-[#D9B96A]/30 flex items-center justify-center text-[#D9B96A] transition-colors cursor-pointer shrink-0"
          >
            <AstrolabeIcon className="w-5 h-5" />
          </button>
        </header>

        {/* 3) بطاقة أوقات الصلاة (4×2 شبكة للأوقات الثمانية + عداد حي بالذهبي) */}
        <section aria-label="أوقات الصلاة">
          <div
            style={{ borderRadius: 'var(--radius-card)' }}
            className="w-full text-right bg-[#08241A]/75 border border-[#D9B96A]/30 backdrop-blur-xs p-3 sm:p-4 shadow-lg"
          >
            {/* Location (Governorate & City) + GPS Button + Live Countdown */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#D9B96A]/20">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onOpenAdhanSettings?.()}
                  className="flex items-center gap-1.5 min-w-0 text-right cursor-pointer hover:opacity-90"
                  title="إعدادات الأذان والموقع"
                >
                  <PinArchIcon className="w-3.5 h-3.5 text-[#D9B96A] shrink-0" />
                  <span className="text-xs font-bold text-[#FAF6EC] truncate">
                    {gpsDetecting
                      ? 'جارٍ تحديد محافظتك ومدينتك...'
                      : locPref.cityLabel}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setGpsNotice(null);
                    setGpsReason(null);
                    const res = await detectAndSaveGpsLocation();
                    if (!res.ok) {
                      setGpsNotice(res.message);
                      setGpsReason(res.reason || 'error');
                    }
                  }}
                  disabled={gpsDetecting || locationStatus === 'requesting'}
                  title="تحديث موقعي والمحافظة والمدينة عبر GPS"
                  aria-label="تحديث الموقع عبر GPS"
                  className="shrink-0 min-h-[26px] px-2 py-0.5 rounded-[5px] bg-[#D9B96A]/18 hover:bg-[#D9B96A]/32 border border-[#D9B96A]/45 text-[10px] font-bold text-[#E8CE88] inline-flex items-center gap-1 cursor-pointer disabled:opacity-60 transition-colors"
                >
                  <LocateFixed
                    className={`w-3 h-3 ${
                      gpsDetecting || locationStatus === 'requesting'
                        ? 'animate-pulse'
                        : ''
                    }`}
                    aria-hidden="true"
                  />
                  <span>GPS</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onOpenAdhanSettings?.()}
                className="flex items-center gap-2 shrink-0 cursor-pointer hover:opacity-90"
              >
                <span className="text-[11px] font-medium text-[#E7D8B0]/85">
                  المتبقي لصلاة {nextPrayer.nameAr.replace(' (غداً)', '')}
                </span>
                <span
                  dir="ltr"
                  className="font-display font-bold text-sm sm:text-base text-[#D9B96A] tabular-nums"
                >
                  {nextPrayer.countdownAr}
                </span>
              </button>
            </div>

            {gpsNotice && (
              <div className="mt-2 rounded-[6px] bg-[#FAF6EC]/10 border border-[#D9B96A]/45 p-2 space-y-1.5">
                <p className="text-[11px] font-medium text-[#E8CE88] leading-relaxed">
                  {gpsNotice}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {isAndroid && gpsReason === 'denied' && (
                    <button
                      type="button"
                      onClick={() => void openAppLocationPermissionSettings()}
                      className="min-h-[30px] px-2.5 py-0.5 rounded-[4px] bg-[#D9B96A] text-[#081A14] text-[11px] font-bold cursor-pointer"
                    >
                      فتح إعدادات التطبيق
                    </button>
                  )}
                  {isAndroid && gpsReason === 'location-disabled' && (
                    <button
                      type="button"
                      onClick={() => void openDeviceLocationSettings()}
                      className="min-h-[30px] px-2.5 py-0.5 rounded-[4px] bg-[#D9B96A] text-[#081A14] text-[11px] font-bold cursor-pointer"
                    >
                      فتح إعدادات الموقع
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenAdhanSettings?.()}
                    className="min-h-[30px] px-2.5 py-0.5 rounded-[4px] border border-[#D9B96A]/55 text-[#FAF6EC] text-[11px] font-bold cursor-pointer"
                  >
                    اختيار المدينة يدوياً
                  </button>
                  <button
                    type="button"
                    onClick={() => setGpsNotice(null)}
                    className="min-h-[30px] px-2 text-[11px] text-[#E7D8B0]/75 hover:underline cursor-pointer"
                  >
                    إخفاء
                  </button>
                </div>
              </div>
            )}

            {/* 4 cols x 2 rows Grid (8 Times) */}
            <button
              type="button"
              onClick={() => onOpenAdhanSettings?.()}
              className="w-full text-right grid grid-cols-4 gap-1.5 sm:gap-2 pt-2.5 cursor-pointer hover:opacity-95 transition-opacity"
            >
              {eightTimesGrid.map((cell) => {
                const isNext =
                  nextPrayer.key === cell.key && !nextPrayer.isTomorrow;
                return (
                  <div
                    key={cell.key}
                    className={`rounded-[10px] px-1.5 py-2 text-center border transition-colors ${
                      isNext
                        ? 'bg-[#D9B96A]/18 border-[#D9B96A]/75 shadow-xs'
                        : 'bg-[#FAF6EC]/[0.04] border-[#D9B96A]/15'
                    }`}
                  >
                    <div
                      className={`flex justify-center mb-1 ${
                        isNext ? 'text-[#D9B96A]' : 'text-[#D9B96A]/80'
                      }`}
                    >
                      {cell.icon}
                    </div>
                    <div
                      className={`text-[10px] sm:text-[11px] font-bold leading-tight truncate ${
                        isNext ? 'text-[#FAF6EC]' : 'text-[#E7D8B0]/85'
                      }`}
                    >
                      {cell.label}
                    </div>
                    <div
                      className={`mt-0.5 text-[10px] sm:text-xs font-display font-bold tabular-nums ${
                        isNext ? 'text-[#D9B96A]' : 'text-[#FAF6EC]/90'
                      }`}
                    >
                      {formatHHMMArabic12h(cell.timeHHMM)}
                    </div>
                  </div>
                );
              })}
            </button>
          </div>
        </section>

        {/* 4) شريط الأدوات السريعة: المفضلة | بحث */}
        <section aria-label="الأدوات السريعة" className="mt-2.5">
          <div
            style={{ borderRadius: 'var(--radius-card)' }}
            className="flex items-stretch bg-[#08241A]/68 border border-[#D9B96A]/25 backdrop-blur-xs overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setFavoritesOpen(true)}
              className="flex-1 min-h-[44px] px-3 py-2 flex items-center justify-center gap-2 hover:bg-[#FAF6EC]/10 transition-colors cursor-pointer"
            >
              <BookmarkStarIcon className="w-4 h-4 text-[#D9B96A]" />
              <span className="font-display font-bold text-xs sm:text-sm text-[#FAF6EC]">
                المفضلة
              </span>
              {bookmarkedIds.length > 0 && (
                <span className="text-[11px] font-bold text-[#D9B96A] tabular-nums">
                  ({toArabicNums(bookmarkedIds.length)})
                </span>
              )}
            </button>

            <div className="w-px my-2 bg-[#D9B96A]/25" aria-hidden="true" />

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex-1 min-h-[44px] px-3 py-2 flex items-center justify-center gap-2 hover:bg-[#FAF6EC]/10 transition-colors cursor-pointer"
            >
              <SearchCrescentIcon className="w-4 h-4 text-[#D9B96A]" />
              <span className="font-display font-bold text-xs sm:text-sm text-[#FAF6EC]">
                بحث
              </span>
            </button>
          </div>
        </section>

        {/* 5) بطاقة «آية اليوم» مع زر «أكمل القراءة» */}
        <section aria-label="آية اليوم" className="mt-2.5">
          <div
            style={{ borderRadius: 'var(--radius-card)' }}
            className="bg-[#08241A]/66 border border-[#D9B96A]/25 backdrop-blur-xs px-3.5 py-3"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-display font-bold text-[#D9B96A]">
                آية اليوم
              </span>
              <span className="text-[11px] text-[#E7D8B0]/80">
                سورة {verseOfTheDay.surahName} · الآية{' '}
                {toArabicNums(verseOfTheDay.ayahNumber)}
              </span>
            </div>

            <p className="font-quran text-base sm:text-lg text-[#FAF6EC] leading-[2.1] text-center">
              ﴿{verseOfTheDay.arabicText}﴾
            </p>

            <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-[#D9B96A]/15">
              <span className="text-[11px] text-[#E7D8B0]/80 truncate">
                {lastRead
                  ? `آخر قراءة: ${lastRead.title}`
                  : 'ابدأ تلاوة السورة المباركة'}
              </span>
              <button
                type="button"
                onClick={handleContinueReading}
                className="min-h-[34px] px-3 py-1 rounded-[8px] bg-[#D9B96A]/20 hover:bg-[#D9B96A]/30 border border-[#D9B96A]/55 text-[#FAF6EC] font-display font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <span>أكمل القراءة</span>
                <ArrowLeft className="w-3.5 h-3.5 text-[#D9B96A]" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        {/* 6) أعمال يوم [اسم اليوم]: عنوان + شريط رقائق أفقي قابل للسحب */}
        <section aria-label={`أعمال يوم ${todayGuidance.dayNameAr}`} className="mt-3">
          <div className="flex items-center justify-between px-0.5 mb-2">
            <h2 className="font-display font-bold text-xs sm:text-sm text-[#FAF6EC]">
              أعمال يوم {todayGuidance.dayNameAr}
            </h2>
            <span className="text-[11px] font-bold text-[#E8CE88]">
              {todayGuidance.badge}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {dailyActChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={chip.action}
                style={{ borderRadius: 'var(--radius-chip)' }}
                className={`shrink-0 min-h-[36px] px-4 py-1.5 border text-xs font-display font-bold whitespace-nowrap shadow-md transition-colors cursor-pointer ${
                  isNight
                    ? 'bg-[#2A1E0E] hover:bg-[#392914] border-[#D9B96A] text-[#FCEFA3]'
                    : 'bg-[#FFF9E6] hover:bg-[#F3E2B5] border-[#B8924A] text-[#08241A]'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* ================================================================
          7) اللوحة السفلية القابلة للسحب (Draggable Bottom Sheet)
          تبدأ من منتصف الشاشة تقريباً بحواف علوية 28px وتملأ الشاشة عند سحبها.
         ================================================================ */}
      <motion.section
        aria-label="أبواب رحلة النور"
        style={{
          y: sheetY,
          top: '52px',
          height: 'calc(100dvh - 52px)',
        }}
        onWheel={(e) => {
          if (!sheetExpanded && e.deltaY > 10) {
            snapSheetTo(true);
          } else if (
            sheetExpanded &&
            sheetScrollRef.current &&
            sheetScrollRef.current.scrollTop <= 1 &&
            e.deltaY < -20
          ) {
            snapSheetTo(false);
          }
        }}
        className="fixed inset-x-0 z-30 max-w-xl mx-auto home-sheet-surface flex flex-col overflow-hidden border-t border-[#B8924A]/30"
      >
        {/* Drag Handle Header Area */}
        <div
          onPointerDown={(e) => {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            beginDrag(e.clientY);
          }}
          onPointerMove={(e) => moveDrag(e.clientY)}
          onPointerUp={() => endDrag()}
          onPointerCancel={() => endDrag()}
          onClick={() => {
            if (!dragStateRef.current.moved) {
              snapSheetTo(!sheetExpanded);
            }
          }}
          className="pt-2.5 pb-2 px-4 flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing touch-none shrink-0"
          role="button"
          tabIndex={0}
          aria-expanded={sheetExpanded}
          aria-label={sheetExpanded ? 'تصغير اللوحة السفلية' : 'توسيع اللوحة السفلية'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              snapSheetTo(!sheetExpanded);
            }
          }}
        >
          <span
            className="w-11 h-1.5 rounded-full bg-[#B8924A]/55 block"
            aria-hidden="true"
          />
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${isNight ? 'text-[#D9B96A]' : 'text-[#8C6A2B]'}`}>
            {sheetExpanded ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                <span>تصغير القائمة</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                <span>اسحب أو اضغط لعرض كل الأقسام</span>
              </>
            )}
          </span>
        </div>

        {/* Scrollable Sheet Content */}
        <div
          ref={sheetScrollRef}
          onTouchStart={(e) => {
            if (
              !sheetExpanded ||
              (sheetScrollRef.current && sheetScrollRef.current.scrollTop <= 1)
            ) {
              beginDrag(e.touches[0].clientY);
            }
          }}
          onTouchMove={(e) => {
            if (!dragStateRef.current.active) return;
            const currentY = e.touches[0].clientY;
            const delta = currentY - dragStateRef.current.startClientY;
            if (sheetExpanded && delta < 0) {
              // Allow normal downward scroll inside expanded sheet
              dragStateRef.current.active = false;
              return;
            }
            moveDrag(currentY);
          }}
          onTouchEnd={() => endDrag()}
          style={{
            paddingBottom: sheetExpanded
              ? 'max(48px, calc(env(safe-area-inset-bottom) + 28px))'
              : `${collapsedY + 72}px`,
          }}
          className="flex-1 min-h-0 px-4 sm:px-5 space-y-6 overflow-y-auto overscroll-contain"
        >
          {/* أ) لافتة عريضة مرسومة بالكامل بـ SVG/CSS (بدل صورة) */}
          <HomeIllustratedBannerSvg dark={isNight} />

          {/* ب) قسم «العبادات» — صف أيقونات دائرية كبيرة قابلة للتمرير الأفقي */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-calligraphy font-bold text-lg sm:text-xl text-[#0F3D2E]">
                العبادات
              </h3>
              {!sheetExpanded && (
                <button
                  type="button"
                  onClick={() => snapSheetTo(true)}
                  className={`text-xs font-bold hover:underline cursor-pointer ${isNight ? 'text-[#D9B96A]' : 'text-[#8C6A2B]'}`}
                >
                  عرض كل الأقسام
                </button>
              )}
            </div>

            <div className="flex items-start gap-3.5 overflow-x-auto no-scrollbar pb-1">
              {worshipItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className="shrink-0 w-[72px] sm:w-[78px] flex flex-col items-center text-center gap-1.5 group cursor-pointer"
                >
                  <span
                    style={{
                      backgroundColor: isNight ? '#123327' : '#EFE6CE',
                      borderColor: isNight
                        ? 'rgba(217, 185, 106, 0.35)'
                        : 'rgba(184, 146, 74, 0.4)',
                    }}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border flex items-center justify-center text-[#0F3D2E] shadow-[0_3px_10px_-3px_rgba(15,61,46,0.12)] transition-transform duration-200 group-active:scale-95"
                  >
                    {item.icon}
                  </span>
                  <span className="text-[11px] font-bold text-[#11271F] leading-snug line-clamp-2">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ج) قسم «الأدعية والزيارات» — شبكة 3 أعمدة من مربعات مدورة 20px */}
          <div>
            <h3 className="font-calligraphy font-bold text-lg sm:text-xl text-[#0F3D2E] mb-3">
              الأدعية والزيارات
            </h3>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {duasZiyaratTiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  onClick={tile.onClick}
                  style={{
                    borderRadius: 'var(--radius-tile)',
                    backgroundColor: isNight ? tile.nightTint : tile.dayTint,
                  }}
                  className="px-2 py-3.5 sm:py-4 border border-[#B8924A]/28 hover:border-[#B8924A]/65 flex flex-col items-center justify-center text-center gap-2 shadow-[0_4px_12px_-4px_rgba(15,61,46,0.09)] transition-transform duration-200 active:scale-[0.97] cursor-pointer"
                >
                  <span className="text-[#0F3D2E]">{tile.icon}</span>
                  <span className="text-xs font-display font-bold text-[#11271F] leading-tight">
                    {tile.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* د) قسم «مواضيع أخرى» — بطاقة كبيرة مدورة فيها شبكة عمودين */}
          <div>
            <h3 className="font-calligraphy font-bold text-lg sm:text-xl text-[#0F3D2E] mb-3">
              مواضيع أخرى
            </h3>

            <div
              style={{ borderRadius: 'var(--radius-tile)' }}
              className="p-3 sm:p-4 bg-[#FAF6EC] border border-[#B8924A]/60 shadow-[0_6px_18px_-6px_rgba(15,61,46,0.18)]"
            >
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {otherTopicTiles.map((tile) => (
                  <button
                    key={tile.id}
                    type="button"
                    onClick={tile.onClick}
                    style={{
                      borderRadius: 'var(--radius-tile)',
                      backgroundColor: '#FFF9E6',
                    }}
                    className="px-3 py-4 border border-[#B8924A]/60 hover:border-[#B8924A] flex flex-col items-center justify-center text-center gap-2 shadow-[0_3px_12px_-3px_rgba(15,61,46,0.15)] transition-transform duration-200 active:scale-[0.97] cursor-pointer"
                  >
                    <span className="text-[#0F3D2E] scale-110">{tile.icon}</span>
                    <span className="text-xs sm:text-sm font-display font-bold text-[#0F3D2E] leading-snug">
                      {tile.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ================================================================
          MODALS: Search, Favorites, Daily Act Summary, Qibla Compass
         ================================================================ */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#081A14]/75 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 pt-12"
          role="dialog"
          aria-modal="true"
          aria-label="البحث الشامل"
          onClick={() => setSearchOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: 'var(--radius-card)' }}
            className="w-full max-w-lg manuscript-folio p-4 sm:p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[#B8924A]/30">
              <h3 className="font-calligraphy font-bold text-xl text-[#0F3D2E]">
                البحث الشامل في رحلة النور
              </h3>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="إغلاق البحث"
                className="w-9 h-9 rounded-[8px] border border-[#B8924A]/40 text-[#425B51] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <GlobalSearchBar
              onOpenLibrarySection={(sec, entryId) => {
                setSearchOpen(false);
                onOpenLibrarySection(sec, entryId);
              }}
              onOpenLibrary={(storyId) => {
                setSearchOpen(false);
                onOpenLibrary(storyId);
              }}
            />
          </div>
        </div>
      )}

      {favoritesOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#081A14]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="المفضلة"
          onClick={() => setFavoritesOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: 'var(--radius-card)' }}
            className="w-full max-w-md max-h-[82dvh] flex flex-col manuscript-folio p-4 sm:p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#B8924A]/30 shrink-0">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#B8924A]" aria-hidden="true" />
                <h3 className="font-calligraphy font-bold text-xl text-[#0F3D2E]">
                  المفضلة والعلامات المرجعية
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFavoritesOpen(false)}
                aria-label="إغلاق المفضلة"
                className="w-9 h-9 rounded-[8px] border border-[#B8924A]/40 text-[#425B51] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {bookmarkedItems.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#425B51]">
                  لم تحفظ أي سورة أو دعاء أو زيارة في المفضلة بعد. اضغط على أيقونة العلامة المرجعية أثناء القراءة لحفظها هنا.
                </div>
              ) : (
                bookmarkedItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    className="w-full text-right p-3 rounded-[12px] bg-[#F3ECDA]/70 hover:bg-[#F3ECDA] border border-[#B8924A]/30 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-[#9C7835] block">
                        {item.category}
                      </span>
                      <span className="font-display font-bold text-sm text-[#0F3D2E] truncate block">
                        {item.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {completedReadingIds.includes(item.id) && (
                        <CheckCircle2
                          className="w-4 h-4 text-[#1F6B50]"
                          aria-hidden="true"
                        />
                      )}
                      <ArrowLeft className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {actDetailModal && (
        <div
          className="fixed inset-0 z-50 bg-[#081A14]/75 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setActDetailModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: 'var(--radius-card)' }}
            className="w-full max-w-md manuscript-folio p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#B8924A]/30">
              <h3 className="font-display font-bold text-base sm:text-lg text-[#0F3D2E]">
                {actDetailModal.title}
              </h3>
              <button
                type="button"
                onClick={() => setActDetailModal(null)}
                aria-label="إغلاق"
                className="w-8 h-8 rounded-[6px] border border-[#B8924A]/40 text-[#425B51] flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm leading-relaxed text-[#11271F] whitespace-pre-line font-medium">
              {actDetailModal.summary}
            </p>
            <button
              type="button"
              onClick={actDetailModal.onGo}
              className="w-full min-h-[44px] btn-emerald flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{actDetailModal.ctaLabel}</span>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <QiblaCompassModal
        isOpen={qiblaOpen}
        onClose={() => setQiblaOpen(false)}
        locationPref={locPref}
      />
    </div>
  );
};
