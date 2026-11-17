import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Compass,
  Sparkles,
  BookOpen,
  ShoppingBag,
  Star,
  BookHeart,
  Heart,
  Library,
  ArrowLeft,
  ScrollText,
  Landmark,
  Bell,
  Wifi,
  CheckCircle2,
  Bookmark,
  Clock,
} from 'lucide-react';
import { RihlatLogo } from './RihlatLogo';
import { HijriBanner } from './HijriBanner';
import { SpiritualNotificationsModal } from './SpiritualNotificationsModal';
import { useOnlineStatus } from '../utils/useOnlineStatus';
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
    alt: 'كتاب أدعية مفتوح على حامل خشبي مزخرف بجانب فانوس ذهبي ومسبحة زمردية تحت السماء المضيئة',
    actionType: 'adiyat',
  },
  {
    id: 'ziyarat',
    badge: 'الزيارات الشريفة',
    caption: 'الزيارات الشريفة في رحاب المراقد المطهرة لأهل البيت (عليهم السلام)',
    image: heroZiyaratImg,
    alt: 'مرقد شريف بقبة ذهبية ومآذن مزخرفة بالزخارف الإسلامية وساحة هادئة مضاءة بالفوانيس',
    actionType: 'ziyarat',
  },
  {
    id: 'munajat',
    badge: 'همسات المناجاة',
    caption: 'همسات المناجاة الخمس عشرة ومناجاة الله بخشوعٍ وإقبال',
    image: heroMunajatImg,
    alt: 'مؤمن يرفع يديه بالدعاء والمناجاة بخشوع في صحن مضاء بالفوانيس تحت الهلال والنجوم',
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
    alt: 'طريق مضيء بالفوانيس الذهبية يعبر التلال الخضراء وبساتين الزيتون نحو الأفق المشرق',
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
  onOpenLibrarySection,
  onCompleteReading,
  onResumeLastRead,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const isOnline = useOnlineStatus();
  const todayGuidance = getTodaySpiritualGuidance();
  const [notifSettings, setNotifSettings] = useState(() => loadNotificationSettings());
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
    }, 5000);
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
    ...DIGITAL_LIBRARY_ENTRIES.filter(
      (e) =>
        e.section === 'adiyat' ||
        (e.section === 'sahifa' &&
          e.id !== 'dl-sahifa-m1' &&
          e.id !== 'dl-sahifa-m2')
    ).map((e) => e.id),
  ];
  const completedDuasCount = allDuaEntries.filter((id) =>
    completedReadingIds.includes(id)
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
          dl.section === 'ziyarat' ? 'ziyarat' : 'adiyat';
        return {
          id,
          title: dl.title,
          category: targetSec === 'ziyarat' ? 'الزيارات' : 'الأدعية',
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
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-4 sm:space-y-6">
      {/* Top Hijri Calendar & Occasions Card */}
      <HijriBanner
        hijriOffset={hijriOffset}
        completedReadingIds={completedReadingIds}
        onCompleteReading={onCompleteReading}
        onOpenCalendar={onOpenCalendar}
        onOpenLibraryEntry={onOpenLibrarySection}
      />

      {/* Quick Resume Card if lastRead exists */}
      {lastRead && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onResumeLastRead}
          className="w-full text-right rounded-2xl sm:rounded-3xl bg-[#EFF5F2] hover:bg-[#E6F0EB] border border-[#CFE0D8] p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-3.5 cursor-pointer transition-colors group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl sm:rounded-2xl bg-[#145344] text-[#F5EFE0] flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#145344]">متابعة القراءة من حيث توقفت</span>
              <h3 className="font-display font-bold text-base sm:text-lg text-[#143D32] truncate mt-0.5">
                {lastRead.title}
              </h3>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#145344] shrink-0 whitespace-nowrap">
            <span className="hidden sm:inline">متابعة</span>
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          </span>
        </motion.button>
      )}

      {/* Primary Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 flex flex-col justify-center items-center lg:items-start text-center lg:text-right bg-[#FDFCF9] rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-[#E5E0D5] shadow-2xs"
        >
          <RihlatLogo size="lg" />

          <h2 className="mt-4 sm:mt-5 font-display font-bold text-lg sm:text-2xl lg:text-[26px] text-[#143D32] leading-snug max-w-xl text-balance">
            منصة تربوية ومعنوية تجمع بين رحلة 100 محطة ورياض الأدعية والزيارات والمناجاة والمسبحة النورانية
          </h2>

          <p className="mt-2.5 sm:mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
            عشر مراحل تربوية متدرجة عبر مواقف واقعية قصيرة، مع مكتبة دينية مرتبة ومسبحة تفاعلية لتجمع{' '}
            <strong className="text-[#7D602B] font-bold">نجوم النور</strong> وتنفقها في متجر الأنوار.
          </p>

          <div className="mt-5 sm:mt-6 w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={onStartJourney}
              className="min-h-[48px] sm:min-h-[54px] px-6 sm:px-8 py-3 rounded-2xl bg-[#145344] hover:bg-[#0F4236] text-white font-display font-bold text-base sm:text-xl shadow-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145344] whitespace-nowrap"
            >
              <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-[#E6D5A9] shrink-0" aria-hidden="true" />
              <span>ابدأ الرحلة</span>
            </motion.button>

            <button
              type="button"
              onClick={onOpenStore}
              className="min-h-[46px] sm:min-h-[54px] px-5 sm:px-6 py-2.5 rounded-2xl bg-[#F6F3EA] hover:bg-[#EDE8DA] text-[#1E3B32] font-display font-bold text-sm sm:text-base border border-[#DFD8C8] flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A7B3E] whitespace-nowrap"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-[#7D602B] shrink-0" aria-hidden="true" />
              <span>متجر الأنوار</span>
              <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-extrabold text-[#6B5423] tabular-nums">
                <Star className="w-3.5 h-3.5 text-[#9A7B3E] fill-[#C9A962]" aria-hidden="true" />
                {availableStars}
              </span>
            </button>
          </div>

          <div className="mt-5 pt-4 border-t border-[#EAE5D9] w-full flex flex-wrap items-center justify-center lg:justify-start gap-x-2.5 gap-y-1 text-xs sm:text-sm font-semibold text-stone-600">
            <span className="tabular-nums text-[#145344]">{STAGES.length} مراحل تربوية</span>
            <span className="text-stone-400" aria-hidden="true">·</span>
            <span className="tabular-nums">{STATIONS.length} محطة واقعية</span>
            <span className="text-stone-400" aria-hidden="true">·</span>
            <span className="tabular-nums">{TOTAL_POSSIBLE_STARS} نجمة بالمراحل</span>
            {completedCount > 0 && (
              <>
                <span className="text-stone-400" aria-hidden="true">·</span>
                <span className="text-[#145344] font-bold tabular-nums">
                  تقدّمك: {completedCount}/{STATIONS.length} محطة
                </span>
              </>
            )}
          </div>
        </motion.div>

        {/* Hero Rotating Showcase Column */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 flex"
        >
          <div
            onMouseEnter={() => setIsSlidePaused(true)}
            onMouseLeave={() => setIsSlidePaused(false)}
            onFocus={() => setIsSlidePaused(true)}
            onBlur={() => setIsSlidePaused(false)}
            className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#EFECE3] border border-[#E5E0D5] shadow-2xs aspect-[4/3] sm:aspect-auto sm:min-h-[340px] flex flex-col"
          >
            <button
              type="button"
              onClick={() => handleHeroSlideClick(currentSlide)}
              aria-label={`افتح قسم ${currentSlide.badge}`}
              className="relative flex-1 w-full h-full text-right cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145344]"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide.id}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
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
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#F3EFE6]">
                      <div className="w-16 h-16 rounded-2xl bg-[#EFF5F2] border border-[#D4E2DA] flex items-center justify-center mb-3 text-[#145344]">
                        <BookOpen className="w-8 h-8" aria-hidden="true" />
                      </div>
                      <p className="font-display font-bold text-lg text-[#143D32]">
                        {currentSlide.badge}
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Subtle Top Category Label */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 inline-flex items-center gap-1.5 max-w-[60%] px-3 py-1 rounded-xl bg-[#102E26]/80 backdrop-blur-xs border border-white/20 text-[#F5EFE0] font-display font-bold text-xs sm:text-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#E5D3A3] shrink-0" aria-hidden="true" />
                <span className="truncate">{currentSlide.badge}</span>
              </div>

              {/* Bottom Caption Scrim */}
              <div className="bg-gradient-to-t from-black/85 via-black/45 to-transparent absolute inset-x-0 bottom-0 p-4 sm:p-5 pt-10 z-10">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentSlide.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3 }}
                    className="font-display font-bold text-white text-sm sm:text-lg leading-snug"
                  >
                    {currentSlide.caption}
                  </motion.p>
                </AnimatePresence>
                <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#E5D3A3]">
                  <span>اضغط لفتح القسم</span>
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                </div>
              </div>
            </button>

            {/* Manual Slide Selector Dots */}
            <div
              className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-1.5 bg-[#102E26]/70 backdrop-blur-xs px-2.5 py-1.5 rounded-full border border-white/15"
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
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      isActive
                        ? 'w-5 bg-[#E5D3A3]'
                        : 'w-2 bg-white/55 hover:bg-white/85'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Quick Bookmarks / Favorites Card */}
      {resolvedBookmarks.length > 0 && (
        <section
          aria-label="المفضلة السريعة"
          className="rounded-2xl sm:rounded-3xl bg-[#FDFCF9] border border-[#E5E0D5] p-4 sm:p-5 shadow-2xs"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#F6F3EA] border border-[#E2DBC8] flex items-center justify-center text-[#7D602B] shrink-0">
              <Bookmark className="w-4 h-4 fill-[#C9A962] text-[#9A7B3E]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-sm sm:text-base text-[#143D32]">
                المفضلة السريعة ({resolvedBookmarks.length})
              </h3>
              <p className="text-xs text-stone-600">
                وصول مباشر للسور والأدعية والقصص المحفوظة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {resolvedBookmarks.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onOpen}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F7F5EE] hover:bg-[#EFECE2] border border-[#E2DDD0] text-right shrink-0 cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-semibold text-stone-500">{item.category}</div>
                <div className="font-display font-bold text-xs sm:text-sm text-[#143D32]">
                  {item.title}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Daily Spiritual Wisdom Card (Calm Warm Parchment) */}
      <section
        aria-label="حكمة اليوم الروحية"
        className="rounded-2xl sm:rounded-3xl bg-[#FAF7F0] border border-[#E5DEC9] p-4 sm:p-6 shadow-2xs"
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#F2ECE0] border border-[#DFD6C1] flex items-center justify-center text-[#7D602B] shrink-0">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#7D602B]">حكمة اليوم والذكر المبارك</span>
              <h4 className="font-display font-bold text-base sm:text-lg text-[#143D32]">
                {todayWisdom.title}
              </h4>
            </div>
          </div>
          <span className="text-xs font-bold text-[#145344] shrink-0">ورد اليوم</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white/95 border border-[#EAE4D6] mb-3 text-center">
          <p className="font-display font-extrabold text-lg sm:text-2xl text-[#143D32] leading-snug">
            {todayWisdom.arabicDhikr}
          </p>
          <p className="font-display font-medium text-sm sm:text-base text-slate-700 mt-2 leading-relaxed">
            «{todayWisdom.wisdomText}»
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs sm:text-sm font-semibold text-stone-600 pt-2.5 border-t border-[#EAE4D6]">
          <span className="text-[#145344]">التوجيه: {todayWisdom.recommendedAction}</span>
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
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#EFF5F2] hover:bg-[#E2EFE8] text-[#145344] border border-[#CFE0D8] font-display font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
            >
              <span>افتح القسم</span>
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      {/* Today's Recommended Acts & Spiritual Notifications Card (Calm Sage Surface) */}
      <section
        aria-label="مستحبات اليوم والتنبيهات"
        className="rounded-2xl sm:rounded-3xl bg-[#F3F7F4] border border-[#D4E2DA] p-4 sm:p-6 shadow-2xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#145344] text-[#F5EFE0] flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-stone-600">
                <span className="text-[#145344] font-bold">{todayGuidance.badge}</span>
                <span className="mx-1.5 text-stone-400" aria-hidden="true">·</span>
                <span>مستحبات يوم {todayGuidance.dayNameAr}</span>
              </p>
              <h3 className="font-display font-bold text-base sm:text-xl text-[#143D32] mt-0.5">
                {todayGuidance.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-white hover:bg-[#FAF8F3] text-[#145344] border border-[#CFE0D8] font-display font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <Bell className="w-4 h-4 text-[#145344]" aria-hidden="true" />
            <span>ضبط الإشعارات</span>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 mb-3.5 leading-relaxed">
          {todayGuidance.shortSummary}
        </p>

        {/* Recommended Acts Clean Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          {todayGuidance.recommendedActs.slice(0, 4).map((act, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 bg-white/90 border border-[#DFEAE3] rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm text-slate-700"
            >
              <CheckCircle2 className="w-4 h-4 text-[#145344] shrink-0 mt-0.5" aria-hidden="true" />
              <span className="leading-relaxed">{act}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#DCE8E0]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 font-medium">
            <span>
              دعاء اليوم: <strong className="text-[#143D32]">{todayGuidance.primaryDuaTitle}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#145344]" aria-hidden="true" />
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
              else if (todayGuidance.linkedSection === 'duas') onOpenLibrarySection('adiyat', todayGuidance.linkedEntryId);
              else {
                onOpenLibrarySection(
                  todayGuidance.linkedSection as DigitalLibrarySection,
                  todayGuidance.linkedEntryId
                );
              }
            }}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#145344] hover:bg-[#0F4236] text-white font-display font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>{todayGuidance.linkedLabel}</span>
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Distinct Feature Card: Oasis of Luminous Tasbih (Calm Earth-Sage Card) */}
      <section aria-label="واحة التسبيح النوراني">
        <button
          type="button"
          onClick={onOpenTasbih}
          className="w-full text-right rounded-2xl sm:rounded-3xl bg-[#F6F3EA] hover:bg-[#EFEAE0] border border-[#E2DBC8] p-4 sm:p-6 shadow-2xs cursor-pointer transition-colors group"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#145344] border border-[#236B58] flex items-center justify-center shrink-0">
                <svg
                  viewBox="0 0 64 64"
                  className="w-9 h-9 sm:w-10 sm:h-10"
                  aria-hidden="true"
                >
                  <circle
                    cx="32"
                    cy="32"
                    r="21"
                    fill="none"
                    stroke="rgba(229,211,163,0.4)"
                    strokeWidth="1.5"
                    strokeDasharray="3 4"
                  />
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                    const rad = ((deg - 90) * Math.PI) / 180;
                    const cx = 32 + 21 * Math.cos(rad);
                    const cy = 32 + 21 * Math.sin(rad);
                    return (
                      <circle
                        key={deg}
                        cx={cx}
                        cy={cy}
                        r={deg === 0 ? 4 : 2.8}
                        fill={deg === 0 ? '#E5D3A3' : deg % 90 === 0 ? '#9FD3C2' : '#F5EFE0'}
                      />
                    );
                  })}
                  <circle cx="32" cy="32" r="4.5" fill="#C9A962" opacity="0.9" />
                </svg>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold text-[#7D602B]">
                  مسبحة تفاعلية · تسبيح الزهراء والتسبيح المفتوح
                </p>
                <h3 className="font-display font-bold text-lg sm:text-2xl text-[#143D32] mt-0.5">
                  واحة التسبيح النوراني
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed max-w-2xl">
                  تسبيح السيدة فاطمة الزهراء (ع) بالترتيب المأثور (٣٤ الله أكبر · ٣٣ الحمد لله · ٣٣ سبحان الله) مع مسبحة لؤلؤية تفاعلية للأذكار.
                </p>
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E5DEC9]">
              <span className="text-xs font-semibold text-[#145344]">
                {isZahraTasbihCompleted ? 'أتممت التسبيح اليوم' : 'تسبيح الزهراء والأذكار'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-display font-bold text-[#145344]">
                <span>افتح المسبحة</span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </div>
        </button>
      </section>

      {/* Organized & Unified Spiritual Portals */}
      <section aria-label="الأقسام الدينية المرتبة" className="pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 px-1">
          <h3 className="font-display font-bold text-lg sm:text-2xl text-[#143D32]">
            المكتبة الدينية المرتّبة
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-stone-600">
            نصوص مشكولة كاملة وتلاوات بأصوات القراء
          </p>
        </div>

        {/* 4 Unified Calm Cards: Duas · Ziyarat · Munajat · Quran */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* 1. All Duas */}
          <button
            type="button"
            onClick={() => onOpenLibrarySection('adiyat')}
            className="text-right rounded-2xl sm:rounded-3xl bg-[#FDFCF9] hover:bg-white border border-[#E5E0D5] hover:border-[#9EBDB2] p-4 sm:p-5 shadow-2xs flex flex-col justify-between gap-3.5 cursor-pointer transition-colors group"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="w-11 h-11 rounded-2xl bg-[#EFF5F2] border border-[#D4E2DA] flex items-center justify-center text-[#145344]">
                  <BookHeart className="w-5 h-5" aria-hidden="true" />
                </div>
                <span className="text-xs font-bold text-stone-500 tabular-nums">
                  {completedDuasCount} / {allDuaEntries.length} دعاءً
                </span>
              </div>
              <h4 className="font-display font-bold text-lg text-[#143D32] mt-3.5">
                الأدعية المباركة
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                أدعية الأيام السبعة، اليومية، الصحيفة السجادية، والأدعية الكبرى.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#145344] pt-3 border-t border-[#EAE5D9]">
              <span>تصفح الأدعية</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            </div>
          </button>

          {/* 2. All Ziyarat */}
          <button
            type="button"
            onClick={() => onOpenLibrarySection('ziyarat')}
            className="text-right rounded-2xl sm:rounded-3xl bg-[#FDFCF9] hover:bg-white border border-[#E5E0D5] hover:border-[#9EBDB2] p-4 sm:p-5 shadow-2xs flex flex-col justify-between gap-3.5 cursor-pointer transition-colors group"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="w-11 h-11 rounded-2xl bg-[#F6F3EA] border border-[#E2DBC8] flex items-center justify-center text-[#7D602B]">
                  <Landmark className="w-5 h-5" aria-hidden="true" />
                </div>
                <span className="text-xs font-bold text-stone-500 tabular-nums">
                  {completedZiyaratCount} / {ziyaratEntries.length} زيارة
                </span>
              </div>
              <h4 className="font-display font-bold text-lg text-[#143D32] mt-3.5">
                الزيارات الشريفة
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                زيارات النبي وأهل البيت (ع)، عاشوراء ووارث والعباس وآل ياسين.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#145344] pt-3 border-t border-[#EAE5D9]">
              <span>تصفح الزيارات</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            </div>
          </button>

          {/* 3. All 15 Munajat */}
          <button
            type="button"
            onClick={() => onOpenLibrarySection('munajat')}
            className="text-right rounded-2xl sm:rounded-3xl bg-[#FDFCF9] hover:bg-white border border-[#E5E0D5] hover:border-[#9EBDB2] p-4 sm:p-5 shadow-2xs flex flex-col justify-between gap-3.5 cursor-pointer transition-colors group"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="w-11 h-11 rounded-2xl bg-[#EFF5F2] border border-[#D4E2DA] flex items-center justify-center text-[#145344]">
                  <Heart className="w-5 h-5" aria-hidden="true" />
                </div>
                <span className="text-xs font-bold text-stone-500 tabular-nums">
                  {completedMunajatCount} / {MUNAJAT_LIST.length} مناجاة
                </span>
              </div>
              <h4 className="font-display font-bold text-lg text-[#143D32] mt-3.5">
                همسات المناجاة
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                المناجاة الخمس عشرة للإمام السجاد (ع) مرتبة مع شرح المعنى والعبرة.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#145344] pt-3 border-t border-[#EAE5D9]">
              <span>اقرأ المناجاة</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            </div>
          </button>

          {/* 4. Holy Quran */}
          <button
            type="button"
            onClick={() => onOpenLibrarySection('quran')}
            className="text-right rounded-2xl sm:rounded-3xl bg-[#FDFCF9] hover:bg-white border border-[#E5E0D5] hover:border-[#9EBDB2] p-4 sm:p-5 shadow-2xs flex flex-col justify-between gap-3.5 cursor-pointer transition-colors group"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="w-11 h-11 rounded-2xl bg-[#F6F3EA] border border-[#E2DBC8] flex items-center justify-center text-[#7D602B]">
                  <ScrollText className="w-5 h-5" aria-hidden="true" />
                </div>
                <span className="text-xs font-bold text-stone-500 tabular-nums">
                  {completedQuranCount} / {QURAN_SURAHS_META.length} سورة
                </span>
              </div>
              <h4 className="font-display font-bold text-lg text-[#143D32] mt-3.5">
                القرآن الكريم
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                سور المصحف الشريف الـ ١١٤ مرتبة مع التلاوة العطرة والوضع الليلي.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#145344] pt-3 border-t border-[#EAE5D9]">
              <span>افتح المصحف</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            </div>
          </button>
        </div>

        {/* Secondary Unified Row: Stories Library + Journey Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4 mt-4">
          <button
            type="button"
            onClick={() => onOpenLibrary()}
            className="text-right rounded-2xl sm:rounded-3xl bg-[#FDFCF9] hover:bg-white border border-[#E5E0D5] hover:border-[#9EBDB2] p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-3 cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#F6F3EA] border border-[#E2DBC8] flex items-center justify-center text-[#7D602B] shrink-0">
                <Library className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-stone-500 tabular-nums">
                  {completedLibraryCount} / {totalLibraryStories} قصة · ١٤ معصوماً · +5 ★ لكل قصة
                </div>
                <h4 className="font-display font-bold text-base sm:text-lg text-[#143D32] mt-0.5">
                  مكتبة قصص أهل البيت (عليهم السلام)
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 line-clamp-2 sm:line-clamp-1">
                  سيرة المعصومين الأربعة عشر وقصص واقعية ملهمة.
                </p>
              </div>
            </div>
            <ArrowLeft className="w-4 h-4 text-[#145344] shrink-0 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onStartJourney}
            className="text-right rounded-2xl sm:rounded-3xl bg-[#FDFCF9] hover:bg-white border border-[#E5E0D5] hover:border-[#9EBDB2] p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-3 cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF5F2] border border-[#D4E2DA] flex items-center justify-center text-[#145344] shrink-0">
                <Compass className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-stone-500 tabular-nums">
                  {completedCount} / {STATIONS.length} محطة مكتملة · {STAGES.length} مراحل
                </div>
                <h4 className="font-display font-bold text-base sm:text-lg text-[#143D32] mt-0.5">
                  خريطة رحلة النور التفاعلية
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 line-clamp-2 sm:line-clamp-1">
                  مواقف تربوية يومية وأسئلة ذكية تكسبك نجوم النور.
                </p>
              </div>
            </div>
            <ArrowLeft className="w-4 h-4 text-[#145344] shrink-0 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Quiet Offline Readiness Note */}
      <div className="rounded-2xl bg-[#FDFCF9] border border-[#E5E0D5] p-3.5 sm:p-4 flex items-center gap-3 text-right">
        <div className="w-9 h-9 rounded-xl bg-[#EFF5F2] border border-[#D4E2DA] flex items-center justify-center text-[#145344] shrink-0">
          <Wifi className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-xs sm:text-sm text-[#143D32]">
            جاهز دائماً بدون إنترنت
            <span className="mx-1.5 text-stone-400" aria-hidden="true">·</span>
            <span className="font-semibold text-stone-600">
              {isOnline ? 'متصل الآن' : 'يعمل دون اتصال'}
            </span>
          </p>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            جميع السور والأدعية والزيارات والمناجاة والقصص محفوظة محلياً في جهازك.
          </p>
        </div>
      </div>

      <SpiritualNotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
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
