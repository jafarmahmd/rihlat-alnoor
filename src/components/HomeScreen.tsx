import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Star,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Bookmark,
  Clock,
} from 'lucide-react';
import { RihlatLogo } from './RihlatLogo';
import { HijriBanner } from './HijriBanner';
import { SpiritualNotificationsModal } from './SpiritualNotificationsModal';
import { GlobalSearchBar } from './GlobalSearchBar';
import { PrayerQiblaCard } from './PrayerQiblaCard';
import {
  getKhatmahSummary,
  loadKhatmahConfig,
  saveKhatmahConfig,
} from '../utils/khatmahTracker';
import {
  getOccasionsForHijriDay,
  getTodayHijriDate,
} from '../data/hijriCalendar';
import { toArabicDigits } from '../utils/bookPagination';
import {
  DuaScrollIcon,
  JourneyCompassIcon,
  ManuscriptCornerBracket,
  ManuscriptDivider,
  MunajatMoonIcon,
  QuranBookIcon,
  ShrineDomeIcon,
  StoriesLanternIcon,
  StoreTreasuryIcon,
  TasbihBeadsIcon,
} from './IslamicOrnaments';
import {
  formatTimeArabic12h,
  getTodaySpiritualGuidance,
  loadNotificationSettings,
} from '../data/spiritualNotifications';
import heroDuasImg from '../assets/images/hero_duas_1794742826288.jpg';
import heroZiyaratImg from '../assets/images/hero_ziyarat_shrine_1794742826126.jpg';
import heroMunajatImg from '../assets/images/hero_munajat_supplication_1794742827119.jpg';
import heroQuranImg from '../assets/images/hero_quran_recitation_1794742827475.jpg';
import heroMapImg from '../assets/images/hero_journey_map_1794742828035.jpg';
import {
  HERO_ARTWORK,
  STAGES,
  STATIONS,
  TOTAL_POSSIBLE_STARS,
} from '../data/stations';
import { DUAS_LIST } from '../data/duas';
import { MUNAJAT_LIST } from '../data/munajat';
import { MASOOMEEN_LIBRARY } from '../data/library';
import { DIGITAL_LIBRARY_ENTRIES } from '../data/digitalLibrary';
import { QURAN_SURAHS_META } from '../data/quran';
import { DigitalLibrarySection, LastReadPosition } from '../types/game';
import { getTodayWisdom } from '../data/dailyWisdom';

interface HomeScreenProps {
  availableStars: number;
  completedCount: number;
  completedReadingIds: string[];
  bookmarkedIds?: string[];
  hijriOffset: number;
  lastRead: LastReadPosition | null;
  onStartJourney: () => void;
  onOpenStore: () => void;
  onOpenLibrary: (storyId?: string) => void;
  onOpenTasbih: () => void;
  onOpenCalendar: () => void;
  onOpenAdhanSettings?: () => void;
  onOpenLibrarySection: (
    section: DigitalLibrarySection,
    entryId?: string
  ) => void;
  onCompleteReading: (readingId: string) => boolean;
  onResumeLastRead: () => void;
}

interface HeroSlide {
  id: string;
  badge: string;
  caption: string;
  image: string;
  alt: string;
  actionType: 'library' | 'adiyat' | 'ziyarat' | 'munajat' | 'quran' | 'map';
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'stories',
    badge: 'مكتبة قصص أهل البيت',
    caption: 'قصص حقيقية من سيرة أهل البيت (عليهم السلام) تنير قلبك وعقلك',
    image: HERO_ARTWORK,
    alt: 'فانوس ذهبي مضيء وكتاب قصص مفتوح وسط أوراق الزيتون وزهور الياسمين',
    actionType: 'library',
  },
  {
    id: 'duas',
    badge: 'أدعية مباركة',
    caption: 'أدعية مباركة من الصحيفة السجادية والأيام السبعة والأدعية الكبرى',
    image: heroDuasImg,
    alt: 'كتاب أدعية مفتوح على حامل خشبي مزخرف بجانب فانوس ذهبي ومسبحة زمردية',
    actionType: 'adiyat',
  },
  {
    id: 'ziyarat',
    badge: 'الزيارات الشريفة',
    caption: 'الزيارات الشريفة في رحاب المراقد المطهرة لأهل البيت (عليهم السلام)',
    image: heroZiyaratImg,
    alt: 'مرقد شريف بقبة ذهبية ومآذن مزخرفة بالزخارف الإسلامية',
    actionType: 'ziyarat',
  },
  {
    id: 'munajat',
    badge: 'همسات المناجاة',
    caption: 'همسات المناجاة الخمس عشرة ومناجاة الله بخشوعٍ وإقبال',
    image: heroMunajatImg,
    alt: 'مؤمن يرفع يديه بالدعاء والمناجاة بخشوع تحت السماء المضيئة',
    actionType: 'munajat',
  },
  {
    id: 'quran',
    badge: 'القرآن الكريم',
    caption: 'القرآن الكريم تلاوةً عطرة واستماعاً بأصوات كبار القراء الأفاضل',
    image: heroQuranImg,
    alt: 'قارئ يجلس بخشوع لقراءة القرآن الكريم على حامل خشبي تحت ضوء الفانوس الذهبي',
    actionType: 'quran',
  },
  {
    id: 'map',
    badge: 'خريطة رحلة النور التفاعلية',
    caption: 'خريطة رحلة النور التفاعلية عبر ١٠٠ محطة تربوية ممتعة للأطفال',
    image: heroMapImg,
    alt: 'طريق مضيء بالفوانيس الذهبية يعبر التلال الخضراء وبساتين الزيتون',
    actionType: 'map',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  availableStars,
  completedCount,
  completedReadingIds,
  bookmarkedIds = [],
  hijriOffset,
  lastRead,
  onStartJourney,
  onOpenStore,
  onOpenLibrary,
  onOpenTasbih,
  onOpenCalendar,
  onOpenAdhanSettings,
  onOpenLibrarySection,
  onCompleteReading,
  onResumeLastRead,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const todayGuidance = getTodaySpiritualGuidance();
  const todayHijri = getTodayHijriDate(new Date(), hijriOffset);
  const todayOccasions = getOccasionsForHijriDay(todayHijri.month, todayHijri.day);
  const todayOccasion = todayOccasions[0] || null;
  const [khatmahConfig, setKhatmahConfig] = useState(() => loadKhatmahConfig());
  const khatmah = getKhatmahSummary(completedReadingIds, khatmahConfig);

  const [notifSettings, setNotifSettings] = useState(() =>
    loadNotificationSettings()
  );
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);
  const [failedSlideIds, setFailedSlideIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const syncNotif = () => setNotifSettings(loadNotificationSettings());
    window.addEventListener('rihlat:notification-settings-updated', syncNotif);
    return () =>
      window.removeEventListener('rihlat:notification-settings-updated', syncNotif);
  }, []);

  useEffect(() => {
    if (isSlidePaused) return;
    const timer = window.setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [isSlidePaused]);

  const currentSlide = HERO_SLIDES[activeSlideIndex];

  const handleHeroSlideClick = (slide: HeroSlide) => {
    if (slide.actionType === 'library') {
      onOpenLibrary();
    } else if (slide.actionType === 'map') {
      onStartJourney();
    } else {
      onOpenLibrarySection(slide.actionType);
    }
  };

  const allDuaEntries = [
    ...DUAS_LIST.map((d) => d.id),
    ...DIGITAL_LIBRARY_ENTRIES.filter((e) => e.section === 'adiyat').map(
      (e) => e.id
    ),
  ];
  const completedDuasCount = allDuaEntries.filter((id) =>
    completedReadingIds.includes(id)
  ).length;

  const sahifaEntries = DIGITAL_LIBRARY_ENTRIES.filter(
    (e) =>
      e.section === 'sahifa' &&
      e.id !== 'dl-sahifa-m1' &&
      e.id !== 'dl-sahifa-m2'
  );
  const completedSahifaCount = sahifaEntries.filter((e) =>
    completedReadingIds.includes(e.id)
  ).length;

  const ziyaratEntries = DIGITAL_LIBRARY_ENTRIES.filter(
    (e) => e.section === 'ziyarat'
  );
  const completedZiyaratCount = ziyaratEntries.filter((e) =>
    completedReadingIds.includes(e.id)
  ).length;

  const completedMunajatCount = MUNAJAT_LIST.filter((m) =>
    completedReadingIds.includes(m.id)
  ).length;

  const completedQuranCount = QURAN_SURAHS_META.filter((s) =>
    completedReadingIds.includes(`dl-quran-${s.number}`)
  ).length;

  const totalLibraryStories = MASOOMEEN_LIBRARY.reduce(
    (sum, m) => sum + m.stories.length,
    0
  );
  const completedLibraryCount = MASOOMEEN_LIBRARY.reduce(
    (sum, m) =>
      sum + m.stories.filter((s) => completedReadingIds.includes(s.id)).length,
    0
  );

  const isZahraTasbihCompleted = completedReadingIds.includes('tasbih-zahra');
  const todayWisdom = getTodayWisdom();

  const resolvedBookmarks = bookmarkedIds
    .map((id) => {
      if (id.startsWith('dl-quran-')) {
        const num = Number(id.replace('dl-quran-', ''));
        const surah = QURAN_SURAHS_META.find((s) => s.number === num);
        if (surah) {
          return {
            id,
            title: `سورة ${surah.name}`,
            category: 'القرآن الكريم',
            onOpen: () => onOpenLibrarySection('quran', id),
          };
        }
      }
      const dl = DIGITAL_LIBRARY_ENTRIES.find((e) => e.id === id);
      if (dl) {
        const targetSec: DigitalLibrarySection =
          dl.section === 'ziyarat'
            ? 'ziyarat'
            : dl.section === 'sahifa'
            ? 'sahifa'
            : 'adiyat';
        return {
          id,
          title: dl.title,
          category:
            targetSec === 'ziyarat'
              ? 'الزيارات'
              : targetSec === 'sahifa'
              ? 'الصحيفة السجادية'
              : 'الأدعية',
          onOpen: () => onOpenLibrarySection(targetSec, dl.id),
        };
      }
      const dua = DUAS_LIST.find((d) => d.id === id);
      if (dua) {
        return {
          id,
          title: dua.title,
          category: 'الأدعية',
          onOpen: () => onOpenLibrarySection('adiyat', dua.id),
        };
      }
      const munajat = MUNAJAT_LIST.find((m) => m.id === id);
      if (munajat) {
        return {
          id,
          title: munajat.title,
          category: 'المناجاة',
          onOpen: () => onOpenLibrarySection('munajat', munajat.id),
        };
      }
      for (const masoom of MASOOMEEN_LIBRARY) {
        const story = masoom.stories.find((s) => s.id === id);
        if (story) {
          return {
            id,
            title: story.title,
            category: 'قصص أهل البيت',
            onOpen: () => onOpenLibrary(story.id),
          };
        }
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top Hijri Manuscript Date Ribbon */}
      <HijriBanner
        hijriOffset={hijriOffset}
        completedReadingIds={completedReadingIds}
        onCompleteReading={onCompleteReading}
        onOpenCalendar={onOpenCalendar}
        onOpenLibraryEntry={onOpenLibrarySection}
      />

      {/* Global Search across Quran, Duas, Munajat, Ziyarat & Stories */}
      <GlobalSearchBar
        onOpenLibrarySection={onOpenLibrarySection}
        onOpenLibrary={onOpenLibrary}
      />

      {/* Quick Resume Silk Ribbon */}
      {lastRead && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onResumeLastRead}
          className="w-full text-right rounded-[6px] bg-[#0F3D2E] hover:bg-[#164C3A] text-[#FAF6EC] border border-[#B8924A]/65 p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <QuranBookIcon className="w-5 h-5 text-[#D9B96A] shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-[#D9B96A] block">
                مواصلة القراءة من موضع العلامة
              </span>
              <h3 className="font-display font-bold text-base sm:text-lg truncate">
                {lastRead.title}
              </h3>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#D9B96A] shrink-0">
            <span className="hidden sm:inline">استكمال</span>
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          </span>
        </motion.button>
      )}

      {/* Asymmetric Editorial Lead Spread */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Right Editorial Plate (7 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-7 relative manuscript-folio rounded-[6px] p-6 sm:p-8 flex flex-col justify-between text-center lg:text-right"
        >
          <ManuscriptCornerBracket position="top-right" className="absolute top-2.5 right-2.5" />
          <ManuscriptCornerBracket position="bottom-left" className="absolute bottom-2.5 left-2.5" />

          <div className="flex flex-col items-center lg:items-start">
            <RihlatLogo size="lg" />

            <h2 className="mt-5 font-calligraphy font-bold text-2xl sm:text-3xl text-[#0F3D2E] leading-snug max-w-xl">
              منصة تربوية ومعنوية تجمع بين رحلة ١٠٠ محطة ورياض الأدعية والزيارات والمناجاة
            </h2>

            <p className="mt-2.5 text-sm sm:text-base text-[#425B51] leading-relaxed max-w-xl">
              عشر مراحل تربوية عبر مواقف واقعية، إلى جانب المصحف الشريف، ومفاتيح الأدعية، ومسبحة الزهراء التفاعلية لكسب{' '}
              <strong className="text-[#7A5E2A] font-bold">نجوم النور</strong> في متجر الأنوار.
            </p>
          </div>

          <div className="mt-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={onStartJourney}
                className="min-h-[48px] px-7 py-2.5 btn-emerald text-base sm:text-lg flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <JourneyCompassIcon className="w-5 h-5 text-[#D9B96A]" />
                <span>ابدأ رحلة المحطات</span>
              </button>

              <button
                type="button"
                onClick={onOpenStore}
                className="min-h-[48px] px-5 py-2.5 btn-manuscript text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer"
              >
                <StoreTreasuryIcon className="w-4 h-4 text-[#B8924A]" />
                <span>متجر الأنوار</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#7A5E2A] tabular-nums border-r border-[#B8924A]/35 pr-2">
                  <Star className="w-3.5 h-3.5 text-[#B8924A] fill-[#D9B96A]" aria-hidden="true" />
                  {availableStars}
                </span>
              </button>
            </div>

            <div className="mt-5 pt-4 border-t border-[#B8924A]/25 flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1 text-xs sm:text-sm font-medium text-[#425B51] tabular-nums">
              <span className="text-[#0F3D2E] font-bold">{STAGES.length} مراحل</span>
              <span className="text-[#B8924A]" aria-hidden="true">·</span>
              <span>{STATIONS.length} محطة واقعية</span>
              <span className="text-[#B8924A]" aria-hidden="true">·</span>
              <span>{TOTAL_POSSIBLE_STARS} نجمة بالمراحل</span>
              {completedCount > 0 && (
                <>
                  <span className="text-[#B8924A]" aria-hidden="true">·</span>
                  <span className="text-[#1F6B50] font-bold">
                    أنجزت {completedCount} / {STATIONS.length}
                  </span>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Left Showcase Frame (5 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-5 flex"
        >
          <div
            onMouseEnter={() => setIsSlidePaused(true)}
            onMouseLeave={() => setIsSlidePaused(false)}
            onFocus={() => setIsSlidePaused(true)}
            onBlur={() => setIsSlidePaused(false)}
            className="relative w-full rounded-[6px] overflow-hidden bg-[#0F3D2E] border border-[#B8924A]/65 shadow-sm aspect-[4/3] sm:aspect-auto sm:min-h-[340px] flex flex-col"
          >
            <button
              type="button"
              onClick={() => handleHeroSlideClick(currentSlide)}
              aria-label={`افتح قسم ${currentSlide.badge}`}
              className="relative flex-1 w-full h-full text-right cursor-pointer group focus-visible:outline-none"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide.id}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: 'easeInOut' }}
                  className="absolute inset-0 flex flex-col"
                >
                  {!failedSlideIds[currentSlide.id] ? (
                    <img
                      src={currentSlide.image}
                      alt={currentSlide.alt}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedSlideIds((prev) => ({
                          ...prev,
                          [currentSlide.id]: true,
                        }))
                      }
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#0F3D2E] text-[#FAF6EC]">
                      <QuranBookIcon className="w-9 h-9 text-[#D9B96A] mb-3" />
                      <p className="font-display font-bold text-lg">{currentSlide.badge}</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Corner Framing & Label */}
              <div className="absolute top-3 right-3 z-10 px-3 py-1 bg-[#081A14]/82 border border-[#D9B96A]/55 text-[#FAF6EC] font-display font-bold text-xs">
                {currentSlide.badge}
              </div>

              {/* Scrim & Editorial Caption */}
              <div className="bg-gradient-to-t from-[#081A14]/95 via-[#081A14]/55 to-transparent absolute inset-x-0 bottom-0 p-4 sm:p-5 pt-12 z-10">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentSlide.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.28 }}
                    className="font-display font-bold text-[#FAF6EC] text-sm sm:text-base leading-snug"
                  >
                    {currentSlide.caption}
                  </motion.p>
                </AnimatePresence>
                <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#D9B96A]">
                  <span>فتح الباب</span>
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                </div>
              </div>
            </button>

            {/* Architectural Bar Indicators (No pill dots) */}
            <div
              className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-[#081A14]/75 px-2 py-1.5 border border-[#D9B96A]/35"
              aria-label="التبديل بين صور أقسام التطبيق"
            >
              {HERO_SLIDES.map((slide, idx) => {
                const isActive = idx === activeSlideIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSlideIndex(idx);
                    }}
                    aria-label={slide.badge}
                    title={slide.badge}
                    className={`h-1.5 transition-all cursor-pointer ${
                      isActive
                        ? 'w-5 bg-[#D9B96A]'
                        : 'w-2 bg-[#FAF6EC]/45 hover:bg-[#FAF6EC]/80'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Prayer Times & Qibla Compass Card */}
      <PrayerQiblaCard onOpenAdhanSettings={onOpenAdhanSettings} />

      {/* Quran Khatmah Progress Ledger */}
      <section
        aria-label="متابعة ختمة القرآن الكريم"
        className="manuscript-folio rounded-[6px] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#7A5E2A]">
            <QuranBookIcon className="w-4 h-4 text-[#0F3D2E]" />
            <span>متابعة ختمة القرآن الكريم · {khatmah.currentJuzInfo.name}</span>
          </div>
          <h3 className="font-display font-bold text-base sm:text-lg text-[#0F3D2E] mt-1 tabular-nums">
            {khatmah.isFinished
              ? 'مبارك! أتممت جميع سور القرآن الكريم'
              : `أتممت ${toArabicDigits(khatmah.completedSurahCount)} من ${toArabicDigits(khatmah.totalSurahCount)} سورة (${toArabicDigits(khatmah.percent)}٪)`}
          </h3>
          <div className="mt-2 h-2 w-full rounded-[3px] bg-[#B8924A]/20 overflow-hidden">
            <div
              className="h-full bg-[#1F6B50] transition-all duration-300"
              style={{ width: `${Math.max(2, khatmah.percent)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-[#425B51] tabular-nums">
            الورد المقترح: {toArabicDigits(khatmah.dailyAyatGoal)} آية يومياً لختمة {toArabicDigits(khatmahConfig.targetDays)} يوماً
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <label className="text-xs font-bold text-[#425B51] flex items-center gap-1.5">
            <span>مدة الختمة:</span>
            <select
              value={khatmahConfig.targetDays}
              onChange={(e) => {
                const days = Number(e.target.value);
                const updated = { ...khatmahConfig, targetDays: days };
                setKhatmahConfig(updated);
                saveKhatmahConfig(updated);
              }}
              aria-label="مدة ختمة القرآن بالأيام"
              className="min-h-[38px] px-2 py-1 rounded-[5px] bg-[#FAF6EC] border border-[#B8924A]/50 text-xs font-bold text-[#0F3D2E] cursor-pointer"
            >
              <option value={30}>٣٠ يوماً</option>
              <option value={60}>٦٠ يوماً</option>
              <option value={90}>٩٠ يوماً</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() =>
              onOpenLibrarySection('quran', `dl-quran-${khatmah.nextUnreadSurah.number}`)
            }
            className="min-h-[40px] px-4 py-1.5 btn-emerald text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>متابعة سورة {khatmah.nextUnreadSurah.name}</span>
            <ArrowLeft className="w-3.5 h-3.5 text-[#D9B96A]" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Bookmarks Strip (Only when bookmarks exist) */}
      {resolvedBookmarks.length > 0 && (
        <section
          aria-label="العلامات المرجعية"
          className="border-y border-[#B8924A]/35 py-3.5 px-1"
        >
          <div className="flex items-center gap-2 mb-2.5">
            <Bookmark className="w-4 h-4 text-[#B8924A] fill-[#D9B96A]" aria-hidden="true" />
            <h3 className="font-display font-bold text-sm text-[#0F3D2E]">
              العلامات المحفوظة ({resolvedBookmarks.length})
            </h3>
          </div>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
            {resolvedBookmarks.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onOpen}
                className="min-h-[42px] px-3.5 py-2 rounded-[5px] bg-[#FAF6EC] hover:bg-[#F3ECDA] border border-[#B8924A]/45 text-right shrink-0 cursor-pointer transition-colors"
              >
                <span className="text-[10px] font-medium text-[#7A5E2A] block">
                  {item.category}
                </span>
                <span className="font-display font-bold text-xs sm:text-sm text-[#0F3D2E]">
                  {item.title}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Gilded Illuminated Daily Wisdom / Verse Focal Panel */}
      <section
        aria-label="آية وذكر اليوم"
        className="relative manuscript-folio rounded-[6px] p-5 sm:p-8 text-center"
      >
        <ManuscriptCornerBracket position="top-right" className="absolute top-3 right-3" />
        <ManuscriptCornerBracket position="top-left" className="absolute top-3 left-3" />
        <ManuscriptCornerBracket position="bottom-right" className="absolute bottom-3 right-3" />
        <ManuscriptCornerBracket position="bottom-left" className="absolute bottom-3 left-3" />

        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-bold text-[#7A5E2A] tracking-wide">
            آية وورد اليوم · {todayWisdom.title}
          </span>

          <p className="mt-3 font-quran text-2xl sm:text-4xl text-[#0F3D2E] leading-relaxed">
            {todayWisdom.arabicDhikr}
          </p>

          <ManuscriptDivider variant="rosette" />

          <p className="font-arabic text-base sm:text-xl text-[#11271F] leading-relaxed">
            «{todayWisdom.wisdomText}»
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm">
            <span className="text-[#425B51]">
              التوجيه: <strong className="text-[#0F3D2E]">{todayWisdom.recommendedAction}</strong>
            </span>
            {todayWisdom.targetSection && (
              <button
                type="button"
                onClick={() => {
                  if (todayWisdom.targetSection === 'tasbih') onOpenTasbih();
                  else if (todayWisdom.targetSection === 'library') onOpenLibrary();
                  else if (
                    todayWisdom.targetSection === 'adiyat' ||
                    todayWisdom.targetSection === 'ziyarat' ||
                    todayWisdom.targetSection === 'munajat' ||
                    todayWisdom.targetSection === 'quran'
                  ) {
                    onOpenLibrarySection(todayWisdom.targetSection);
                  }
                }}
                className="btn-text-ornate inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>ادخل إلى الموضع</span>
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Asymmetric Editorial Sections Spread (Varied Proportions & Footprints) */}
      <section aria-label="أبواب المكتبة الروحية والتربوية" className="space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#B8924A]/35 pb-2.5">
          <h3 className="font-calligraphy font-bold text-2xl sm:text-3xl text-[#0F3D2E]">
            فهرس المكتبة والخلوة
          </h3>
          <p className="text-xs sm:text-sm text-[#425B51]">
            نصوص مشكّلة مضبوطة وتلاوات بأصوات كبار القراء
          </p>
        </div>

        {/* Row 1: Asymmetric Bento — Wide Quran Sanctuary (7 cols) + Vertical Tasbih Sanctuary (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Quran Lead Portal */}
          <button
            type="button"
            onClick={() => onOpenLibrarySection('quran')}
            className="lg:col-span-7 relative text-right rounded-[6px] bg-[#0F3D2E] hover:bg-[#134A38] text-[#FAF6EC] border border-[#B8924A] p-6 sm:p-7 flex flex-col justify-between gap-5 cursor-pointer transition-colors group overflow-hidden"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-[#D9B96A] block">
                  المصحف الشريف المرتّل · ١١٤ سورة
                </span>
                <h4 className="font-calligraphy font-bold text-3xl sm:text-4xl gold-foil-light-text mt-1">
                  القرآن الكريم
                </h4>
              </div>
              <QuranBookIcon className="w-8 h-8 text-[#D9B96A] shrink-0" />
            </div>

            <p className="text-sm sm:text-base text-[#DFECE6] leading-relaxed max-w-xl">
              صفحات مصحف بخط عثماني جليّ، فواصل آيات مذهّبة، بحث وتلاوات عطرة مع حفظ موضع التلاوة والوضع الليلي المريح.
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-[#D9B96A]/25 text-xs sm:text-sm">
              <span className="text-[#D9B96A] font-semibold tabular-nums">
                مقروء: {completedQuranCount} من {QURAN_SURAHS_META.length} سورة
              </span>
              <span className="inline-flex items-center gap-1.5 font-bold text-[#FAF6EC] group-hover:text-[#D9B96A] transition-colors">
                <span>افتح المصحف</span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </button>

          {/* Tasbih Sanctuary Portal */}
          <button
            type="button"
            onClick={onOpenTasbih}
            className="lg:col-span-5 text-right rounded-[6px] bg-[#F4EEDB] hover:bg-[#EFE6CE] border border-[#B8924A]/65 p-6 flex flex-col justify-between gap-4 cursor-pointer transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-medium text-[#7A5E2A] block">
                  ٣٤ · ٣٣ · ٣٣ والمسبحة التفاعلية
                </span>
                <h4 className="font-display font-bold text-xl sm:text-2xl text-[#0F3D2E] mt-1">
                  واحة التسبيح النوراني
                </h4>
              </div>
              <TasbihBeadsIcon className="w-7 h-7 text-[#0F3D2E] shrink-0" />
            </div>

            <p className="text-xs sm:text-sm text-[#425B51] leading-relaxed">
              مسبحة متحركة الخرز لتسبيح السيدة فاطمة الزهراء (ع) والتسبيح المفتوح مع تنوع الأذكار.
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-[#B8924A]/30 text-xs sm:text-sm">
              <span className="text-[#1F6B50] font-bold">
                {isZahraTasbihCompleted ? 'أتممت تسبيح الزهراء اليوم' : 'تسبيح الزهراء والأذكار'}
              </span>
              <span className="inline-flex items-center gap-1.5 font-bold text-[#0F3D2E]">
                <span>ابدأ الذكر</span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </button>
        </div>

        {/* Row 2: Four Editorial Manuscript Folios (Adiyat · Sahifa · Ziyarat · Munajat) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-y border-[#B8924A]/30 py-4">
          <button
            type="button"
            onClick={() => onOpenLibrarySection('adiyat')}
            className="text-right p-4 rounded-[5px] hover:bg-[#F3ECDA]/70 lg:border-l lg:border-[#B8924A]/25 transition-colors cursor-pointer group flex flex-col justify-between gap-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-[#B8924A]">
                <DuaScrollIcon className="w-5 h-5 text-[#0F3D2E]" />
                <span className="text-xs font-semibold text-[#7A5E2A] tabular-nums">
                  {completedDuasCount} / {allDuaEntries.length}
                </span>
              </div>
              <h4 className="font-display font-bold text-lg text-[#0F3D2E] mt-3 group-hover:text-[#1F6B50]">
                الأدعية ومفاتيح الجنان
              </h4>
              <p className="text-xs sm:text-sm text-[#425B51] mt-1 leading-relaxed">
                أدعية الأيام السبعة، الأدعية اليومية، وكميل والندبة والتوسل.
              </p>
            </div>
            <span className="text-xs font-bold text-[#0F3D2E] inline-flex items-center gap-1">
              <span>تصفح الأدعية</span>
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenLibrarySection('sahifa')}
            className="text-right p-4 rounded-[5px] hover:bg-[#F3ECDA]/70 lg:border-l lg:border-[#B8924A]/25 transition-colors cursor-pointer group flex flex-col justify-between gap-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-[#B8924A]">
                <DuaScrollIcon className="w-5 h-5 text-[#1F6B50]" />
                <span className="text-xs font-semibold text-[#7A5E2A] tabular-nums">
                  {completedSahifaCount} / {sahifaEntries.length}
                </span>
              </div>
              <h4 className="font-display font-bold text-lg text-[#0F3D2E] mt-3 group-hover:text-[#1F6B50]">
                الصحيفة السجادية
              </h4>
              <p className="text-xs sm:text-sm text-[#425B51] mt-1 leading-relaxed">
                مختارات زبور آل محمد للإمام علي بن الحسين السجاد (عليه السلام).
              </p>
            </div>
            <span className="text-xs font-bold text-[#0F3D2E] inline-flex items-center gap-1">
              <span>تصفح الصحيفة</span>
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenLibrarySection('ziyarat')}
            className="text-right p-4 rounded-[5px] hover:bg-[#F3ECDA]/70 lg:border-l lg:border-[#B8924A]/25 transition-colors cursor-pointer group flex flex-col justify-between gap-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <ShrineDomeIcon className="w-5 h-5 text-[#0F3D2E]" />
                <span className="text-xs font-semibold text-[#7A5E2A] tabular-nums">
                  {completedZiyaratCount} / {ziyaratEntries.length}
                </span>
              </div>
              <h4 className="font-display font-bold text-lg text-[#0F3D2E] mt-3 group-hover:text-[#1F6B50]">
                الزيارات الشريفة
              </h4>
              <p className="text-xs sm:text-sm text-[#425B51] mt-1 leading-relaxed">
                زيارة عاشوراء ووارث والعباس وآل ياسين والأئمة الأطهار (عليهم السلام).
              </p>
            </div>
            <span className="text-xs font-bold text-[#0F3D2E] inline-flex items-center gap-1">
              <span>ادخل إلى الزيارات</span>
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenLibrarySection('munajat')}
            className="text-right p-4 rounded-[5px] hover:bg-[#F3ECDA]/70 transition-colors cursor-pointer group flex flex-col justify-between gap-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <MunajatMoonIcon className="w-5 h-5 text-[#0F3D2E]" />
                <span className="text-xs font-semibold text-[#7A5E2A] tabular-nums">
                  {completedMunajatCount} / {MUNAJAT_LIST.length}
                </span>
              </div>
              <h4 className="font-display font-bold text-lg text-[#0F3D2E] mt-3 group-hover:text-[#1F6B50]">
                المناجاة الخمس عشرة
              </h4>
              <p className="text-xs sm:text-sm text-[#425B51] mt-1 leading-relaxed">
                همسات الإمام زين العابدين (عليه السلام) مع بيان المعنى والعبرة التربوية.
              </p>
            </div>
            <span className="text-xs font-bold text-[#0F3D2E] inline-flex items-center gap-1">
              <span>اقرأ المناجاة</span>
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            </span>
          </button>
        </div>

        {/* Row 3: Educational Kids World — Stories & 100-Station Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onOpenLibrary()}
            className="text-right manuscript-folio rounded-[6px] p-5 hover:bg-[#F4EEDB] flex items-center justify-between gap-4 cursor-pointer transition-colors group"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-[5px] bg-[#0F3D2E] text-[#D9B96A] flex items-center justify-center shrink-0">
                <StoriesLanternIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-medium text-[#7A5E2A] tabular-nums">
                  {completedLibraryCount} / {totalLibraryStories} قصة · ١٤ معصوماً · +٥ نجوم
                </span>
                <h4 className="font-display font-bold text-base sm:text-lg text-[#0F3D2E] mt-0.5">
                  مكتبة قصص أهل البيت (عليهم السلام)
                </h4>
                <p className="text-xs sm:text-sm text-[#425B51] mt-0.5">
                  قصص تربوية مصورة من سيرة المعصومين الأربعة عشر للأبناء والناشئة.
                </p>
              </div>
            </div>
            <ArrowLeft className="w-4 h-4 text-[#0F3D2E] shrink-0 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onStartJourney}
            className="text-right manuscript-folio rounded-[6px] p-5 hover:bg-[#F4EEDB] flex items-center justify-between gap-4 cursor-pointer transition-colors group"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-[5px] bg-[#1F6B50] text-[#FAF6EC] flex items-center justify-center shrink-0">
                <JourneyCompassIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-medium text-[#7A5E2A] tabular-nums">
                  {completedCount} / {STATIONS.length} محطة مكتملة · {STAGES.length} مراحل
                </span>
                <h4 className="font-display font-bold text-base sm:text-lg text-[#0F3D2E] mt-0.5">
                  خريطة رحلة النور التفاعلية
                </h4>
                <p className="text-xs sm:text-sm text-[#425B51] mt-0.5">
                  مواقف تربوية وأسئلة تفاعلية تكسبك نجوم النور لفتح الجوائز.
                </p>
              </div>
            </div>
            <ArrowLeft className="w-4 h-4 text-[#0F3D2E] shrink-0 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Today's Recommended Acts & Spiritual Reminders Ledger */}
      <section
        aria-label="مستحبات اليوم والتنبيهات"
        className="manuscript-folio rounded-[6px] p-5 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <Bell className="w-5 h-5 text-[#B8924A] mt-1 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#7A5E2A]">
                {todayGuidance.badge} · مستحبات يوم {todayGuidance.dayNameAr}
              </p>
              <h3 className="font-display font-bold text-lg sm:text-xl text-[#0F3D2E] mt-0.5">
                {todayGuidance.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="min-h-[40px] px-4 py-1.5 btn-manuscript text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Bell className="w-3.5 h-3.5 text-[#0F3D2E]" aria-hidden="true" />
            <span>ضبط مواعيد التنبيه</span>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[#425B51] mb-4 leading-relaxed">
          {todayGuidance.shortSummary}
        </p>

        {todayOccasion && (
          <div className="mb-4 rounded-[5px] bg-[#F3ECDA]/75 border-r-[3px] border border-[#B8924A]/40 border-r-[#0F3D2E] p-3.5 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#0F3D2E]">
                مناسبة اليوم الهجرية: {todayOccasion.title}
              </span>
              {todayOccasion.linkedSection && todayOccasion.linkedLabel && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenLibrarySection(
                      todayOccasion.linkedSection as DigitalLibrarySection,
                      todayOccasion.linkedEntryId
                    )
                  }
                  className="btn-text-ornate text-xs inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{todayOccasion.linkedLabel}</span>
                  <ArrowLeft className="w-3 h-3" aria-hidden="true" />
                </button>
              )}
            </div>
            <p className="font-arabic text-sm sm:text-base text-[#11271F] leading-relaxed">
              «{todayOccasion.shortDua}»
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 border-y border-[#B8924A]/25 py-3.5 mb-4">
          {todayGuidance.recommendedActs.slice(0, 4).map((act, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-xs sm:text-sm text-[#11271F]"
            >
              <CheckCircle2 className="w-4 h-4 text-[#1F6B50] shrink-0 mt-0.5" aria-hidden="true" />
              <span className="leading-relaxed">{act}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#425B51] font-medium">
            <span>
              دعاء اليوم: <strong className="text-[#0F3D2E]">{todayGuidance.primaryDuaTitle}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#B8924A]" aria-hidden="true" />
              <span>
                {notifSettings.enabled
                  ? `التنبيه اليومي: ${formatTimeArabic12h(notifSettings.reminderTime)}`
                  : 'التنبيهات اليومية متوقفة'}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (todayGuidance.linkedSection === 'library') onOpenLibrary();
              else if (todayGuidance.linkedSection === 'tasbih') onOpenTasbih();
              else if (todayGuidance.linkedSection === 'duas') {
                onOpenLibrarySection('adiyat', todayGuidance.linkedEntryId);
              } else {
                onOpenLibrarySection(
                  todayGuidance.linkedSection as DigitalLibrarySection,
                  todayGuidance.linkedEntryId
                );
              }
            }}
            className="min-h-[40px] px-4 py-1.5 btn-emerald text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>{todayGuidance.linkedLabel}</span>
            <ArrowLeft className="w-3.5 h-3.5 text-[#D9B96A]" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Manuscript Colophon Footer */}
      <footer className="pt-2 pb-4 text-center text-xs text-[#425B51]">
        <ManuscriptDivider variant="crescent" className="my-2" />
        <p className="font-arabic text-sm text-[#0F3D2E]">
          تطبيق «رحلة النور» — إشراف جمعية كشافة الموعود الإسلامية · محفوظ بالكامل للعمل دون انقطاع
        </p>
      </footer>

      <SpiritualNotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onOpenAdhanSettings={onOpenAdhanSettings}
        onOpenSection={(sec, entryId) => {
          if (sec === 'library') {
            onOpenLibrary();
          } else if (sec === 'tasbih') {
            onOpenTasbih();
          } else if (sec === 'duas') {
            onOpenLibrarySection('adiyat', entryId);
          } else if (sec === 'munajat') {
            onOpenLibrarySection('munajat', entryId);
          } else {
            onOpenLibrarySection(sec as DigitalLibrarySection, entryId);
          }
        }}
      />
    </main>
  );
};
