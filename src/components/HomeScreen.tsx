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
  Smartphone,
  Download,
  Bell,
  Wifi,
  CheckCircle2,
  Bookmark,
  Clock,
} from 'lucide-react';
import { RihlatLogo } from './RihlatLogo';
import { HijriBanner } from './HijriBanner';
import { PWAInstallModal } from './PWAInstallModal';
import { SpiritualNotificationsModal } from './SpiritualNotificationsModal';
import { usePWAInstall } from '../utils/usePWAInstall';
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
  const { isInstalled } = usePWAInstall();
  const [installModalOpen, setInstallModalOpen] = useState(false);
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
    <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-10 lg:py-12">
      {/* Top Hijri Calendar & Occasions Banner */}
      <HijriBanner
        hijriOffset={hijriOffset}
        completedReadingIds={completedReadingIds}
        onCompleteReading={onCompleteReading}
        onOpenCalendar={onOpenCalendar}
        onOpenLibraryEntry={onOpenLibrarySection}
      />

      {/* PWA Mobile Export / Install Banner */}
      {!isInstalled && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-3xl bg-gradient-to-l from-amber-500 via-amber-400 to-yellow-300 text-emerald-950 p-4 sm:p-5 shadow-lg border-2 border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3.5"
        >
          <div className="flex items-center gap-3.5 text-right min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-950 text-amber-300 flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-black text-emerald-900 bg-amber-200/80 px-2.5 py-0.5 rounded-lg inline-block mb-1">
                تطبيق جوال مستقل مع تحديث فوري مباشر
              </span>
              <h3 className="font-display font-black text-base sm:text-lg text-emerald-950">
                تثبيت رحلة النور على هاتفك (أندرويد وآيفون)
              </h3>
              <p className="text-xs sm:text-sm text-emerald-900/90 font-bold mt-0.5">
                تطبيق كامل بدون شريط المتصفح وتصلك كافة التحديثات التي نعملها هنا تلقائياً دون إعادة تثبيت!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setInstallModalOpen(true)}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-2xl bg-emerald-950 hover:bg-emerald-900 text-amber-200 font-display font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4 text-amber-300" aria-hidden="true" />
            <span>تثبيت التطبيق على الجوال</span>
          </button>
        </motion.div>
      )}

      {/* Quick Resume Card if lastRead exists */}
      {lastRead && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-3xl bg-gradient-to-l from-emerald-950 via-emerald-900 to-teal-950 text-white p-5 sm:p-6 shadow-xl border border-amber-300/40 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 text-right min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/50 flex items-center justify-center text-amber-300 shrink-0">
              <BookOpen className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-amber-300">متابعة القراءة من حيث توقفت</span>
              <h3 className="font-display font-black text-lg sm:text-xl text-white truncate mt-0.5">
                {lastRead.title}
              </h3>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                انقر للمتابعة الفورية من آخر موضع قراءة حفظته في التطبيق.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onResumeLastRead}
            className="min-h-[44px] px-6 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-display font-black text-sm flex items-center gap-2 shadow-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>تابع القراءة الآن</span>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </button>
        </motion.div>
      )}

      {/* Quick Bookmarks / Favorites Card */}
      {resolvedBookmarks.length > 0 && (
        <div className="mb-6 rounded-3xl bg-white/95 border border-amber-200 p-4 sm:p-5 shadow-md shadow-amber-950/5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <Bookmark className="w-4 h-4 fill-amber-500 text-amber-600" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display font-black text-base text-emerald-950">
                  المفضلة السريعة ({resolvedBookmarks.length})
                </h3>
                <p className="text-xs text-slate-600">
                  وصول مباشر للسور والأدعية والزيارات والقصص المحفوظة في مفضلتك
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {resolvedBookmarks.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onOpen}
                className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-amber-50/90 hover:bg-amber-100 border border-amber-200/90 text-right shrink-0 cursor-pointer transition-colors"
              >
                <div className="text-[11px] font-bold text-amber-800">{item.category}</div>
                <div className="font-display font-extrabold text-sm text-emerald-950">
                  {item.title}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Daily Spiritual Wisdom Card */}
      <div className="mb-6 rounded-3xl bg-white/95 border border-emerald-200 p-5 sm:p-6 shadow-md shadow-emerald-950/5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-black text-amber-700">حكمة اليوم الروحية والذكر المبارك</span>
              <h4 className="font-display font-black text-base sm:text-lg text-emerald-950">
                {todayWisdom.title}
              </h4>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-display font-black text-xs shrink-0">
            ورد اليوم
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-amber-50/60 border border-emerald-200/80 mb-3 text-center">
          <p className="font-display font-black text-lg sm:text-2xl text-emerald-950 tracking-wide">
            {todayWisdom.arabicDhikr}
          </p>
          <p className="font-display font-medium text-sm sm:text-base text-slate-700 mt-2 leading-relaxed">
            "{todayWisdom.wisdomText}"
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-700 pt-2.5 border-t border-emerald-100">
          <span className="text-emerald-800">التوجيه: {todayWisdom.recommendedAction}</span>
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
              className="min-h-[36px] px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <span>توجه للقسم</span>
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Today's Recommended Acts & Spiritual Notifications Card */}
      <div className="mb-6 rounded-3xl bg-gradient-to-l from-emerald-950 via-emerald-900 to-teal-950 text-white p-5 sm:p-6 shadow-xl border-2 border-amber-400/50 relative overflow-hidden">
        {/* Subtle Decorative Star Accent */}
        <div className="absolute -top-10 -left-10 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shrink-0 shadow-md">
              <Bell className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-lg border border-amber-300/30">
                  {todayGuidance.badge}
                </span>
                <span className="text-xs text-emerald-200/90 font-medium">
                  مستحبات يوم {todayGuidance.dayNameAr}
                </span>
              </div>
              <h3 className="font-display font-black text-lg sm:text-xl text-white mt-1">
                {todayGuidance.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="min-h-[44px] px-4 py-2 rounded-2xl bg-gradient-to-l from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-emerald-950 font-display font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <Bell className="w-4 h-4 text-emerald-950" aria-hidden="true" />
            <span>ضبط إشعارات المستحبات</span>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mb-3 leading-relaxed">
          {todayGuidance.shortSummary}
        </p>

        {/* Recommended Acts Quick List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          {todayGuidance.recommendedActs.slice(0, 4).map((act, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 bg-emerald-900/60 border border-emerald-700/50 rounded-xl p-2.5 text-xs text-emerald-100"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{act}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-800/60">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-emerald-200">
            <span>
              دعاء اليوم المخصص: <strong className="text-amber-200">{todayGuidance.primaryDuaTitle}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-200/90">
              <Clock className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
              <span>
                {notifSettings.enabled
                  ? `التنبيه اليومي تلقائياً: ${formatTimeArabic12h(notifSettings.reminderTime)}`
                  : 'التنبيهات اليومية متوقفة حالياً'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
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
              className="min-h-[40px] px-5 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-display font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{todayGuidance.linkedLabel}</span>
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Online & Complete Offline Readiness Assurance Banner */}
      <div className="mb-6 rounded-2xl bg-white/95 border border-emerald-200/90 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-right">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300/80 flex items-center justify-center text-emerald-800 shrink-0">
            <Wifi className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-display font-black text-sm sm:text-base text-emerald-950">
                يعمل بالكامل مع إنترنت وبدون إنترنت (Offline Ready)
              </h4>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                isOnline
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {isOnline ? 'متصل بالإنترنت' : 'يعمل الآن دون اتصال'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              جميع السور الـ ١١٤، والأدعية، والزيارات، والمناجاة، والقصص ومحطات الرحلة مخزنة محلياً في جهازك وجاهزة للقراءة دائماً دون استهلاك بيانات.
            </p>
          </div>
        </div>
      </div>

      {/* Primary Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-10 items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 flex flex-col justify-center items-center lg:items-start text-center lg:text-right bg-white/85 backdrop-blur-sm rounded-3xl p-4 sm:p-10 border border-emerald-200/80 shadow-lg shadow-emerald-950/5"
        >
          <RihlatLogo size="lg" />

          <h2 className="mt-4 sm:mt-6 font-display font-bold text-xl sm:text-3xl text-emerald-900 leading-snug max-w-xl text-balance">
            منصة تربوية ومعنوية تجمع بين رحلة 100 محطة ورياض الأدعية والزيارات والمناجاة والمسبحة النورانية
          </h2>

          <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-slate-700 leading-relaxed max-w-xl">
            عشر مراحل تربوية متدرجة عبر مواقف واقعية قصيرة وأسئلة ذكية، مع مكتبة دينية مرتبة ومسبحة تفاعلية لتجمع{' '}
            <strong className="text-amber-700 font-bold">نجوم النور</strong> وتنفقها في متجر الأنوار.
          </p>

          <div className="mt-6 sm:mt-8 w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onStartJourney}
              className="min-h-[54px] sm:min-h-[64px] px-6 sm:px-9 py-3 sm:py-4 rounded-2xl bg-gradient-to-l from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-display font-black text-xl sm:text-3xl shadow-xl shadow-emerald-700/25 border-2 border-amber-300/90 flex items-center justify-center gap-2.5 sm:gap-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 whitespace-nowrap"
            >
              <Compass className="w-6 h-6 sm:w-8 sm:h-8 text-amber-200 shrink-0" aria-hidden="true" />
              <span>ابدأ الرحلة</span>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenStore}
              className="min-h-[50px] sm:min-h-[64px] px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-l from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200/80 text-amber-950 font-display font-extrabold text-base sm:text-xl border-2 border-amber-300 shadow-md shadow-amber-900/5 flex items-center justify-center gap-2.5 sm:gap-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 whitespace-nowrap"
            >
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 shrink-0" aria-hidden="true" />
              <span>متجر الأنوار</span>
              <span className="inline-flex items-center gap-1 text-sm font-black text-amber-800 tabular-nums">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" aria-hidden="true" />
                {availableStars}
              </span>
            </motion.button>
          </div>

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-emerald-100 w-full flex flex-wrap items-center justify-center lg:justify-start gap-x-3 sm:gap-x-4 gap-y-1.5 text-xs sm:text-base font-bold text-emerald-800">
            <span className="tabular-nums">{STAGES.length} مراحل تربوية</span>
            <span className="text-amber-500" aria-hidden="true">·</span>
            <span className="tabular-nums">{STATIONS.length} محطة واقعية</span>
            <span className="text-amber-500" aria-hidden="true">·</span>
            <span className="tabular-nums">{TOTAL_POSSIBLE_STARS} نجمة بالمراحل</span>
            {completedCount > 0 && (
              <>
                <span className="text-amber-500" aria-hidden="true">·</span>
                <span className="text-sky-700 tabular-nums">
                  تقدّمك: {completedCount}/{STATIONS.length} محطة
                </span>
              </>
            )}
          </div>
        </motion.div>

        {/* Hero Rotating Showcase Column (every 5 seconds) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 flex"
        >
          <div
            onMouseEnter={() => setIsSlidePaused(true)}
            onMouseLeave={() => setIsSlidePaused(false)}
            onFocus={() => setIsSlidePaused(true)}
            onBlur={() => setIsSlidePaused(false)}
            className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-sky-100 via-emerald-50 to-amber-50 border-2 border-amber-200/80 shadow-lg shadow-emerald-950/10 aspect-[4/3] sm:aspect-auto sm:min-h-[360px] flex flex-col"
          >
            <button
              type="button"
              onClick={() => handleHeroSlideClick(currentSlide)}
              aria-label={`افتح قسم ${currentSlide.badge}`}
              className="relative flex-1 w-full h-full text-right cursor-pointer group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide.id}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: 'easeInOut' }}
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
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-sky-100 via-emerald-50 to-amber-50">
                      <div className="w-24 h-24 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center mb-4 animate-gentle-float">
                        <Sparkles className="w-12 h-12 text-amber-500" aria-hidden="true" />
                      </div>
                      <BookOpen className="w-10 h-10 text-emerald-600 mb-2" aria-hidden="true" />
                      <p className="font-display font-bold text-xl text-emerald-900">
                        {currentSlide.badge}
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Top Category Badge */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 inline-flex items-center gap-1.5 max-w-[58%] px-3 py-1 rounded-xl bg-emerald-950/80 backdrop-blur-xs border border-amber-300/50 text-amber-200 font-display font-extrabold text-[11px] sm:text-sm shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
                <span className="truncate">{currentSlide.badge}</span>
              </div>

              {/* Bottom Caption Overlay */}
              <div className="bg-gradient-to-t from-emerald-950/95 via-emerald-950/65 to-transparent absolute inset-x-0 bottom-0 p-4 sm:p-6 pt-10 sm:pt-12 z-10">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentSlide.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.35 }}
                    className="font-display font-bold text-white text-base sm:text-xl leading-snug"
                  >
                    {currentSlide.caption}
                  </motion.p>
                </AnimatePresence>
                <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-200 group-hover:text-amber-100">
                  <span>اضغط لفتح القسم</span>
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                </div>
              </div>
            </button>

            {/* Manual Slide Selector Dots */}
            <div
              className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-1.5 bg-emerald-950/65 backdrop-blur-xs px-2.5 py-1.5 rounded-full border border-white/15"
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
                        ? 'w-5 bg-amber-300'
                        : 'w-2 bg-white/55 hover:bg-white/85'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Distinct Feature Spotlight: Oasis of Luminous Tasbih */}
      <section aria-label="واحة التسبيح النوراني" className="mt-6 sm:mt-10">
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.995 }}
          onClick={onOpenTasbih}
          className="w-full text-right rounded-3xl bg-[#061816] hover:bg-[#08201D] border border-amber-400/40 p-4 sm:p-8 shadow-xl shadow-emerald-950/20 relative overflow-hidden cursor-pointer transition-colors group"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(circle at 18% 50%, rgba(20, 184, 166, 0.25) 0%, transparent 45%), radial-gradient(circle at 82% 30%, rgba(251, 191, 36, 0.2) 0%, transparent 50%)',
            }}
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-5">
              {/* Mini SVG Pearl Misbaha Emblem */}
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-[#0B2622] border border-amber-400/40 flex items-center justify-center shrink-0">
                <svg
                  viewBox="0 0 64 64"
                  className="w-10 h-10 sm:w-12 sm:h-12"
                  aria-hidden="true"
                >
                  <circle
                    cx="32"
                    cy="32"
                    r="21"
                    fill="none"
                    stroke="rgba(251,191,36,0.35)"
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
                        r={deg === 0 ? 4.2 : 3}
                        fill={deg === 0 ? '#FCD34D' : deg % 90 === 0 ? '#2DD4BF' : '#FEF3C7'}
                      />
                    );
                  })}
                  <circle cx="32" cy="32" r="5" fill="#F59E0B" opacity="0.85" />
                </svg>
              </div>

              <div>
                <p className="text-[11px] sm:text-sm font-extrabold text-amber-300">
                  تصميم مسبحة تفاعلي مستقل · تسبيح الزهراء والتسبيح المفتوح
                </p>
                <h3 className="font-display font-black text-xl sm:text-3xl text-white mt-1">
                  واحة التسبيح النوراني
                </h3>
                <p className="text-xs sm:text-base text-emerald-100/80 mt-1.5 leading-relaxed max-w-2xl">
                  تسبيح السيدة فاطمة الزهراء (ع) بالترتيب المأثور (٣٤ الله أكبر · ٣٣ الحمد لله · ٣٣ سبحان الله) مع مسبحة لؤلؤية تفاعلية للتسبيح المفتوح والذكر الحر.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-stretch sm:items-start md:items-end gap-2 shrink-0">
              <span className="min-h-[46px] sm:min-h-[48px] px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-l from-amber-400 to-yellow-300 text-[#061816] font-display font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg whitespace-nowrap">
                <span>افتح المسبحة النورانية</span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
              </span>
              <span className="text-xs font-bold text-amber-200/85 text-center md:text-left">
                {isZahraTasbihCompleted
                  ? 'أتممت تسبيح الزهراء (ع) اليوم'
                  : 'تسبيح تفاعلي بالترتيب المأثور والأذكار المفتوحة'}
              </span>
            </div>
          </div>
        </motion.button>
      </section>

      {/* Organized & Separated Spiritual Portals */}
      <section aria-label="الأقسام الدينية المرتبة" className="mt-8 sm:mt-10">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-1">
          <h3 className="font-display font-black text-xl sm:text-2xl text-emerald-950">
            المكتبة الدينية المرتّبة
          </h3>
          <p className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <span>نصوص مشكولة كاملة وتلاوات عطرة بأصوات القراء</span>
          </p>
        </div>

        {/* 4 Pure Separated Portals: Duas · Ziyarat · Munajat · Quran */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. All Duas Unified */}
          <motion.button
            type="button"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onOpenLibrarySection('adiyat')}
            className="text-right rounded-3xl bg-white/95 hover:bg-white border border-emerald-200 hover:border-emerald-400 p-5 sm:p-6 shadow-md shadow-emerald-950/5 flex flex-col justify-between gap-4 cursor-pointer transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <BookHeart className="w-6 h-6" aria-hidden="true" />
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-700 tabular-nums">
                  {completedDuasCount} / {allDuaEntries.length} دعاءً
                </span>
              </div>
              <h4 className="font-display font-black text-xl text-emerald-950 mt-4">
                الأدعية المباركة
              </h4>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                جميع الأدعية معاً مرتبة: أدعية الأيام السبعة، اليومية، الصحيفة السجادية، والأدعية الكبرى (كميل والندبة وعرفة والجوشن).
              </p>
            </div>
            <div className="flex items-center justify-between text-sm font-extrabold text-emerald-700 pt-3 border-t border-emerald-100">
              <span>تصفح جميع الأدعية</span>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </div>
          </motion.button>

          {/* 2. All Ziyarat Sorted */}
          <motion.button
            type="button"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onOpenLibrarySection('ziyarat')}
            className="text-right rounded-3xl bg-white/95 hover:bg-white border border-teal-200 hover:border-teal-400 p-5 sm:p-6 shadow-md shadow-teal-950/5 flex flex-col justify-between gap-4 cursor-pointer transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Landmark className="w-6 h-6" aria-hidden="true" />
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-teal-700 tabular-nums">
                  {completedZiyaratCount} / {ziyaratEntries.length} زيارة
                </span>
              </div>
              <h4 className="font-display font-black text-xl text-emerald-950 mt-4">
                الزيارات الشريفة
              </h4>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                مرتبة حسب المقامات الشريفة: النبوية والزهراء، كربلاء وعاشوراء ووارث والعباس، الكاظمين والرضا والعسكريين وآل ياسين.
              </p>
            </div>
            <div className="flex items-center justify-between text-sm font-extrabold text-teal-700 pt-3 border-t border-teal-100">
              <span>تصفح جميع الزيارات</span>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </div>
          </motion.button>

          {/* 3. All 15 Munajat Separated */}
          <motion.button
            type="button"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onOpenLibrarySection('munajat')}
            className="text-right rounded-3xl bg-white/95 hover:bg-white border border-sky-200 hover:border-sky-400 p-5 sm:p-6 shadow-md shadow-sky-950/5 flex flex-col justify-between gap-4 cursor-pointer transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700">
                  <Heart className="w-6 h-6" aria-hidden="true" />
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-sky-700 tabular-nums">
                  {completedMunajatCount} / {MUNAJAT_LIST.length} مناجاة
                </span>
              </div>
              <h4 className="font-display font-black text-xl text-emerald-950 mt-4">
                همسات المناجاة
              </h4>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                المناجاة الخمس عشرة للإمام زين العابدين (عليه السلام) مرقّمة ومفروزة بالكامل مع شرح المعنى السريع والعبرة.
              </p>
            </div>
            <div className="flex items-center justify-between text-sm font-extrabold text-sky-700 pt-3 border-t border-sky-100">
              <span>اقرأ المناجاة الخمس عشرة</span>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </div>
          </motion.button>

          {/* 4. Holy Quran */}
          <motion.button
            type="button"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onOpenLibrarySection('quran')}
            className="text-right rounded-3xl bg-white/95 hover:bg-white border border-amber-200 hover:border-amber-400 p-5 sm:p-6 shadow-md shadow-amber-950/5 flex flex-col justify-between gap-4 cursor-pointer transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
                  <ScrollText className="w-6 h-6" aria-hidden="true" />
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-amber-700 tabular-nums">
                  {completedQuranCount} / {QURAN_SURAHS_META.length} سورة
                </span>
              </div>
              <h4 className="font-display font-black text-xl text-emerald-950 mt-4">
                القرآن الكريم
              </h4>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                سور المصحف الشريف الـ ١١٤ مرتبة من الفاتحة إلى الناس مع تصنيف المكي والمدني وتكبير الخط والوضع الليلي.
              </p>
            </div>
            <div className="flex items-center justify-between text-sm font-extrabold text-amber-700 pt-3 border-t border-amber-100">
              <span>افتح المصحف الشريف</span>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </div>
          </motion.button>
        </div>

        {/* Secondary Balanced Row: Stories Library + Journey Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mt-5">
          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onOpenLibrary()}
            className="text-right rounded-3xl bg-white/95 hover:bg-white border border-amber-200 hover:border-amber-400 p-4 sm:p-6 shadow-md shadow-amber-950/5 flex items-center justify-between gap-3 sm:gap-4 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <Library className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-amber-700 tabular-nums">
                  {completedLibraryCount} / {totalLibraryStories} قصة مقروءة · ١٤ معصوماً · +5 ★ لكل قصة
                </div>
                <h4 className="font-display font-black text-base sm:text-xl text-emerald-950 mt-0.5">
                  مكتبة قصص أهل البيت (عليهم السلام)
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2 sm:line-clamp-1">
                  سيرة المعصومين الأربعة عشر وقصص واقعية ملهمة تكسبك نجوم النور.
                </p>
              </div>
            </div>
            <ArrowLeft className="w-5 h-5 text-amber-700 shrink-0" aria-hidden="true" />
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={onStartJourney}
            className="text-right rounded-3xl bg-white/95 hover:bg-white border border-emerald-200 hover:border-emerald-400 p-4 sm:p-6 shadow-md shadow-emerald-950/5 flex items-center justify-between gap-3 sm:gap-4 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <Compass className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-emerald-700 tabular-nums">
                  {completedCount} / {STATIONS.length} محطة مكتملة · {STAGES.length} مراحل
                </div>
                <h4 className="font-display font-black text-base sm:text-xl text-emerald-950 mt-0.5">
                  خريطة رحلة النور التفاعلية
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2 sm:line-clamp-1">
                  مواقف تربوية يومية وأسئلة ذكية تكسبك نجوم النور وتفتح لك ألقاب المتجر.
                </p>
              </div>
            </div>
            <ArrowLeft className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
          </motion.button>
        </div>
      </section>

      <PWAInstallModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
      />

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
