import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';
import {
  ARABIC_WEEKDAYS,
  DualCalendarDay,
  GREGORIAN_MONTH_NAMES,
  HIJRI_MONTH_NAMES,
  HIJRI_OCCASIONS,
  buildGregorianMonthDays,
  buildHijriMonthDays,
  getHijriFromUtcNoon,
  getTodayUtcNoon,
  saveHijriOffset,
  toGregorianInfoFromUtcNoon,
} from '../data/hijriCalendar';
import { DigitalLibrarySection, HijriOccasion } from '../types/game';
import {
  BirthStarMark,
  CalendarArchIcon,
  EidRosetteMark,
  JourneyCompassIcon,
  ManuscriptDivider,
  MartyrdomCrescentMark,
  QuranBookIcon,
} from './IslamicOrnaments';

interface CalendarScreenProps {
  completedReadingIds: string[];
  onCompleteReading: (readingId: string) => boolean;
  onOpenLibraryEntry: (
    section: DigitalLibrarySection,
    entryId?: string
  ) => void;
  onBackHome: () => void;
  hijriOffset: number;
  onChangeHijriOffset: (offset: number) => void;
}

type CalendarMode = 'hijri' | 'gregorian';
type OccasionFilter = 'all' | 'birth' | 'eid' | 'martyrdom';

const OFFSET_OPTIONS = [
  { value: -2, label: '-٢ يوم' },
  { value: -1, label: '-١ يوم' },
  { value: 0, label: 'قياسي (٠)' },
  { value: 1, label: '+١ يوم' },
  { value: 2, label: '+٢ يوم' },
];

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  completedReadingIds,
  onCompleteReading,
  onOpenLibraryEntry,
  onBackHome,
  hijriOffset,
  onChangeHijriOffset,
}) => {
  const todayUtc = useMemo(() => getTodayUtcNoon(), []);
  const todayGreg = useMemo(
    () => toGregorianInfoFromUtcNoon(todayUtc),
    [todayUtc]
  );
  const todayHijri = useMemo(
    () => getHijriFromUtcNoon(todayUtc, hijriOffset),
    [todayUtc, hijriOffset]
  );

  const [mode, setMode] = useState<CalendarMode>('hijri');
  const [darkTheme, setDarkTheme] = useState<boolean>(false);

  const [viewHYear, setViewHYear] = useState<number>(todayHijri.year);
  const [viewHMonth, setViewHMonth] = useState<number>(todayHijri.month);

  const [viewGYear, setViewGYear] = useState<number>(todayGreg.year);
  const [viewGMonth, setViewGMonth] = useState<number>(todayGreg.month);

  const [selectedIso, setSelectedIso] = useState<string>(todayGreg.isoDate);
  const [occasionFilter, setOccasionFilter] = useState<OccasionFilter>('all');
  const [justAwardedId, setJustAwardedId] = useState<string | null>(null);

  const monthDays: DualCalendarDay[] = useMemo(() => {
    if (mode === 'hijri') {
      return buildHijriMonthDays(viewHYear, viewHMonth, hijriOffset);
    }
    return buildGregorianMonthDays(viewGYear, viewGMonth, hijriOffset);
  }, [mode, viewHYear, viewHMonth, viewGYear, viewGMonth, hijriOffset]);

  useEffect(() => {
    if (monthDays.length === 0) return;
    const stillVisible = monthDays.some(
      (d) => d.gregorian.isoDate === selectedIso
    );
    if (!stillVisible) {
      const todayCell = monthDays.find((d) => d.isToday);
      const firstOccCell = monthDays.find((d) => d.occasions.length > 0);
      setSelectedIso(
        (todayCell || firstOccCell || monthDays[0]).gregorian.isoDate
      );
    }
  }, [monthDays, selectedIso]);

  const selectedDay: DualCalendarDay = useMemo(() => {
    return (
      monthDays.find((d) => d.gregorian.isoDate === selectedIso) ||
      monthDays[0] || {
        hijri: todayHijri,
        gregorian: todayGreg,
        occasions: [],
        isToday: true,
      }
    );
  }, [monthDays, selectedIso, todayHijri, todayGreg]);

  const firstWeekdayOffset = monthDays[0]?.gregorian.weekdayIndex ?? 0;

  const secondaryHeaderSpan = useMemo(() => {
    if (monthDays.length === 0) return '';
    const first = monthDays[0];
    const last = monthDays[monthDays.length - 1];
    if (mode === 'hijri') {
      const m1 = GREGORIAN_MONTH_NAMES[first.gregorian.month];
      const m2 = GREGORIAN_MONTH_NAMES[last.gregorian.month];
      if (first.gregorian.year === last.gregorian.year) {
        return first.gregorian.month === last.gregorian.month
          ? `${m1} ${first.gregorian.year} م`
          : `${m1} – ${m2} ${first.gregorian.year} م`;
      }
      return `${m1} ${first.gregorian.year} – ${m2} ${last.gregorian.year} م`;
    } else {
      const m1 = HIJRI_MONTH_NAMES[first.hijri.month];
      const m2 = HIJRI_MONTH_NAMES[last.hijri.month];
      if (first.hijri.year === last.hijri.year) {
        return first.hijri.month === last.hijri.month
          ? `${m1} ${first.hijri.year} هـ`
          : `${m1} – ${m2} ${first.hijri.year} هـ`;
      }
      return `${m1} ${first.hijri.year} – ${m2} ${last.hijri.year} هـ`;
    }
  }, [monthDays, mode]);

  const monthOccasionDays = useMemo(
    () => monthDays.filter((d) => d.occasions.length > 0),
    [monthDays]
  );

  const filteredYearlyOccasions = useMemo(() => {
    return HIJRI_OCCASIONS.filter((occ) => {
      if (occasionFilter === 'all') return true;
      if (occasionFilter === 'birth') return occ.category === 'birth';
      if (occasionFilter === 'eid') return occ.category === 'eid';
      return occ.category === 'martyrdom';
    });
  }, [occasionFilter]);

  const handleModeSwitch = (nextMode: CalendarMode) => {
    if (nextMode === mode) return;
    if (nextMode === 'gregorian') {
      setViewGYear(selectedDay.gregorian.year);
      setViewGMonth(selectedDay.gregorian.month);
    } else {
      setViewHYear(selectedDay.hijri.year);
      setViewHMonth(selectedDay.hijri.month);
    }
    setMode(nextMode);
  };

  const handlePrevMonth = () => {
    if (mode === 'hijri') {
      if (viewHMonth === 1) {
        setViewHMonth(12);
        setViewHYear((y) => y - 1);
      } else {
        setViewHMonth((m) => m - 1);
      }
    } else {
      if (viewGMonth === 1) {
        setViewGMonth(12);
        setViewGYear((y) => y - 1);
      } else {
        setViewGMonth((m) => m - 1);
      }
    }
  };

  const handleNextMonth = () => {
    if (mode === 'hijri') {
      if (viewHMonth === 12) {
        setViewHMonth(1);
        setViewHYear((y) => y + 1);
      } else {
        setViewHMonth((m) => m + 1);
      }
    } else {
      if (viewGMonth === 12) {
        setViewGMonth(1);
        setViewGYear((y) => y + 1);
      } else {
        setViewGMonth((m) => m + 1);
      }
    }
  };

  const handleJumpToday = () => {
    const freshHijri = getHijriFromUtcNoon(todayUtc, hijriOffset);
    setViewHYear(freshHijri.year);
    setViewHMonth(freshHijri.month);
    setViewGYear(todayGreg.year);
    setViewGMonth(todayGreg.month);
    setSelectedIso(todayGreg.isoDate);
  };

  const handleJumpToGregorianInput = (iso: string) => {
    if (!iso) return;
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return;
    const targetUtc = Date.UTC(y, m - 1, d, 12, 0, 0);
    const targetHijri = getHijriFromUtcNoon(targetUtc, hijriOffset);
    setViewGYear(y);
    setViewGMonth(m);
    setViewHYear(targetHijri.year);
    setViewHMonth(targetHijri.month);
    setSelectedIso(iso);
  };

  const handleJumpToOccasion = (occ: HijriOccasion) => {
    setMode('hijri');
    setViewHYear(todayHijri.year);
    setViewHMonth(occ.month);
    const days = buildHijriMonthDays(todayHijri.year, occ.month, hijriOffset);
    const match = days.find((d) => d.hijri.day === occ.day);
    if (match) {
      setSelectedIso(match.gregorian.isoDate);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMarkRead = (occId: string) => {
    const awarded = onCompleteReading(occId);
    if (awarded) {
      setJustAwardedId(occId);
      setTimeout(() => setJustAwardedId(null), 2600);
    }
  };

  const getCategoryMeta = (occ: HijriOccasion) => {
    const cat = occ.category || (occ.type === 'birth' ? 'birth' : 'martyrdom');
    if (cat === 'eid') {
      return {
        cat,
        label: 'عيد ومناسبة سعيدة',
        textLight: 'text-[#8C6423]',
        textDark: 'text-[#D9B96A]',
        boxLight: 'border-[#B8924A]/50 bg-[#F3ECDA]/75',
        boxDark: 'border-[#D9B96A]/45 bg-[#123328]',
      };
    }
    if (cat === 'birth') {
      return {
        cat,
        label: 'ذكرى ولادة مباركة',
        textLight: 'text-[#1F6B50]',
        textDark: 'text-[#9ED3BA]',
        boxLight: 'border-[#1F6B50]/35 bg-[#FAF6EC]',
        boxDark: 'border-[#347A61]/45 bg-[#0E2920]',
      };
    }
    if (cat === 'martyrdom') {
      return {
        cat,
        label: 'ذكرى شهادة ومواساة',
        textLight: 'text-[#425B51]',
        textDark: 'text-[#C8D8CE]',
        boxLight: 'border-[#11271F]/25 bg-[#F3ECDA]/45',
        boxDark: 'border-[#B8924A]/30 bg-[#0A2018]',
      };
    }
    return {
      cat,
      label: 'حدث إسلامي وتاريخي',
      textLight: 'text-[#0F3D2E]',
      textDark: 'text-[#D9B96A]',
      boxLight: 'border-[#B8924A]/35 bg-[#FAF6EC]',
      boxDark: 'border-[#B8924A]/35 bg-[#0E2920]',
    };
  };

  const renderOccasionIcon = (cat: string | null, selected: boolean) => {
    const colorClass = selected
      ? darkTheme
        ? 'text-[#081A14]'
        : 'text-[#D9B96A]'
      : cat === 'eid'
      ? 'text-[#B8924A]'
      : cat === 'birth'
      ? darkTheme
        ? 'text-[#9ED3BA]'
        : 'text-[#1F6B50]'
      : darkTheme
      ? 'text-[#C8D8CE]'
      : 'text-[#425B51]';

    if (cat === 'eid') return <EidRosetteMark className={`w-3.5 h-3.5 shrink-0 ${colorClass}`} />;
    if (cat === 'birth') return <BirthStarMark className={`w-3.5 h-3.5 shrink-0 ${colorClass}`} />;
    return <MartyrdomCrescentMark className={`w-3.5 h-3.5 shrink-0 ${colorClass}`} />;
  };

  return (
    <section
      aria-label="التقويم الهجري الجعفري والميلادي"
      className={`min-h-[calc(100vh-3.5rem)] transition-colors duration-300 py-5 sm:py-8 px-3 sm:px-6 ${
        darkTheme
          ? 'bg-[#081A14] text-[#F3EBD6]'
          : 'text-[#11271F]'
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Masthead & Mode Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-4 border-b border-[#B8924A]/35">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onBackHome}
              className={`min-h-[42px] px-3.5 py-2 rounded-[6px] font-display font-bold text-sm flex items-center gap-2 border cursor-pointer transition-colors whitespace-nowrap ${
                darkTheme
                  ? 'bg-[#0E2920] hover:bg-[#143B2E] text-[#F3EBD6] border-[#B8924A]/45'
                  : 'btn-manuscript'
              }`}
            >
              <ArrowRight className="w-4 h-4 text-[#B8924A]" aria-hidden="true" />
              <span>الرئيسية</span>
            </button>

            <div className="min-w-0">
              <h1
                className={`font-calligraphy font-bold text-2xl sm:text-3xl flex items-center gap-2.5 ${
                  darkTheme ? 'text-[#D9B96A]' : 'text-[#0F3D2E]'
                }`}
              >
                <CalendarArchIcon className="w-6 h-6 text-[#B8924A] shrink-0" />
                <span>التقويم الهجري والميلادي</span>
              </h1>
              <p
                className={`text-xs sm:text-sm font-medium mt-0.5 tabular-nums ${
                  darkTheme ? 'text-[#C8D8CE]/85' : 'text-[#425B51]'
                }`}
              >
                اليوم: {todayHijri.formattedArabic} · الموافق {todayGreg.formattedArabic}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
            {/* Segmented Architectural Calendar Switch */}
            <div
              role="tablist"
              aria-label="نوع عرض التقويم"
              className={`w-full sm:w-auto grid grid-cols-2 sm:inline-flex border rounded-[6px] overflow-hidden ${
                darkTheme
                  ? 'bg-[#05120E] border-[#B8924A]/45'
                  : 'bg-[#F3ECDA]/80 border-[#B8924A]/50'
              }`}
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'hijri'}
                onClick={() => handleModeSwitch('hijri')}
                className={`min-h-[40px] px-3 sm:px-4 py-1.5 font-display font-bold text-xs sm:text-sm transition-colors cursor-pointer truncate ${
                  mode === 'hijri'
                    ? darkTheme
                      ? 'bg-[#D9B96A] text-[#081A14]'
                      : 'bg-[#0F3D2E] text-[#FAF6EC]'
                    : darkTheme
                    ? 'text-[#F3EBD6]/80 hover:text-[#D9B96A]'
                    : 'text-[#11271F] hover:bg-[#FAF6EC]'
                }`}
              >
                التقويم الهجري
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'gregorian'}
                onClick={() => handleModeSwitch('gregorian')}
                className={`min-h-[40px] px-3 sm:px-4 py-1.5 font-display font-bold text-xs sm:text-sm transition-colors cursor-pointer truncate border-r border-[#B8924A]/30 ${
                  mode === 'gregorian'
                    ? darkTheme
                      ? 'bg-[#D9B96A] text-[#081A14]'
                      : 'bg-[#0F3D2E] text-[#FAF6EC]'
                    : darkTheme
                    ? 'text-[#F3EBD6]/80 hover:text-[#D9B96A]'
                    : 'text-[#11271F] hover:bg-[#FAF6EC]'
                }`}
              >
                التقويم الميلادي
              </button>
            </div>

            <button
              type="button"
              onClick={() => setDarkTheme((d) => !d)}
              className={`min-h-[42px] px-3.5 py-2 rounded-[6px] font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border cursor-pointer transition-colors whitespace-nowrap ${
                darkTheme
                  ? 'bg-[#0E2920] border-[#D9B96A]/55 text-[#D9B96A] hover:bg-[#143B2E]'
                  : 'btn-manuscript'
              }`}
            >
              {darkTheme ? (
                <>
                  <Sun className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
                  <span>الوضع النهاري</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
                  <span>المخطوط الليلي</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Lunar Offset & Date Converter Strip */}
        <div
          className={`rounded-[6px] border p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 ${
            darkTheme ? 'manuscript-folio-dark' : 'manuscript-folio paper-grain'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
            <span
              className={`text-xs sm:text-sm font-display font-bold flex items-center gap-1.5 ml-1 ${
                darkTheme ? 'text-[#D9B96A]' : 'text-[#0F3D2E]'
              }`}
            >
              <JourneyCompassIcon className="w-4 h-4 text-[#B8924A] shrink-0" />
              <span>مطابقة الرؤية الشرعية للهلال:</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {OFFSET_OPTIONS.map((opt) => {
                const active = hijriOffset === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      saveHijriOffset(opt.value);
                      onChangeHijriOffset(opt.value);
                    }}
                    className={`min-h-[34px] px-2.5 py-1 rounded-[4px] border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                      active
                        ? darkTheme
                          ? 'bg-[#D9B96A] text-[#081A14] border-[#D9B96A]'
                          : 'bg-[#0F3D2E] text-[#FAF6EC] border-[#B8924A]'
                        : darkTheme
                        ? 'bg-[#081A14] text-[#F3EBD6]/80 border-[#B8924A]/30 hover:border-[#D9B96A]'
                        : 'bg-[#FAF6EC] text-[#425B51] border-[#B8924A]/35 hover:border-[#B8924A]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="calendar-greg-jump"
              className={`text-xs font-bold w-full sm:w-auto ${
                darkTheme ? 'text-[#C8D8CE]' : 'text-[#425B51]'
              }`}
            >
              انتقال لتاريخ ميلادي:
            </label>
            <input
              id="calendar-greg-jump"
              type="date"
              value={selectedDay.gregorian.isoDate}
              onChange={(e) => handleJumpToGregorianInput(e.target.value)}
              className={`min-h-[40px] flex-1 sm:flex-none px-3 rounded-[5px] border text-xs sm:text-sm font-bold tabular-nums focus:outline-none ${
                darkTheme
                  ? 'bg-[#081A14] border-[#B8924A]/45 text-[#F3EBD6]'
                  : 'bg-[#F3ECDA]/60 border-[#B8924A]/45 text-[#11271F]'
              }`}
            />
            <button
              type="button"
              onClick={handleJumpToday}
              className="min-h-[40px] px-4 py-1.5 btn-gilded text-xs sm:text-sm cursor-pointer whitespace-nowrap"
            >
              تاريخ اليوم
            </button>
          </div>
        </div>

        {/* Main Asymmetric Calendar Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Wall Almanac Grid Column */}
          <div
            className={`lg:col-span-8 rounded-[6px] p-4 sm:p-6 ${
              darkTheme ? 'manuscript-folio-dark' : 'manuscript-folio paper-grain'
            }`}
          >
            {/* Month Navigator Header */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-[#B8924A]/35">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="الشهر السابق"
                  className={`min-h-[40px] min-w-[40px] rounded-[5px] border flex items-center justify-center cursor-pointer transition-colors ${
                    darkTheme
                      ? 'bg-[#081A14] hover:bg-[#143B2E] border-[#B8924A]/45 text-[#D9B96A]'
                      : 'btn-manuscript'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="الشهر التالي"
                  className={`min-h-[40px] min-w-[40px] rounded-[5px] border flex items-center justify-center cursor-pointer transition-colors ${
                    darkTheme
                      ? 'bg-[#081A14] hover:bg-[#143B2E] border-[#B8924A]/45 text-[#D9B96A]'
                      : 'btn-manuscript'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end sm:justify-start min-w-0">
                {mode === 'hijri' ? (
                  <>
                    <select
                      aria-label="اختر الشهر الهجري"
                      value={viewHMonth}
                      onChange={(e) => setViewHMonth(Number(e.target.value))}
                      className={`min-h-[40px] min-w-0 flex-1 sm:flex-none px-3 rounded-[5px] border font-display font-bold text-sm sm:text-base cursor-pointer focus:outline-none ${
                        darkTheme
                          ? 'bg-[#081A14] border-[#B8924A]/45 text-[#F3EBD6]'
                          : 'bg-[#F3ECDA]/75 border-[#B8924A]/50 text-[#0F3D2E]'
                      }`}
                    >
                      {Object.entries(HIJRI_MONTH_NAMES).map(([m, name]) => (
                        <option key={m} value={Number(m)}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="اختر السنة الهجرية"
                      value={viewHYear}
                      onChange={(e) => setViewHYear(Number(e.target.value))}
                      className={`min-h-[40px] px-3 rounded-[5px] border font-display font-bold text-sm sm:text-base tabular-nums cursor-pointer focus:outline-none shrink-0 ${
                        darkTheme
                          ? 'bg-[#081A14] border-[#B8924A]/45 text-[#D9B96A]'
                          : 'bg-[#F3ECDA]/75 border-[#B8924A]/50 text-[#7A5420]'
                      }`}
                    >
                      {Array.from(
                        { length: 11 },
                        (_, idx) => todayHijri.year - 5 + idx
                      ).map((y) => (
                        <option key={y} value={y}>
                          {y} هـ
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <select
                      aria-label="اختر الشهر الميلادي"
                      value={viewGMonth}
                      onChange={(e) => setViewGMonth(Number(e.target.value))}
                      className={`min-h-[40px] min-w-0 flex-1 sm:flex-none px-3 rounded-[5px] border font-display font-bold text-sm sm:text-base cursor-pointer focus:outline-none ${
                        darkTheme
                          ? 'bg-[#081A14] border-[#B8924A]/45 text-[#F3EBD6]'
                          : 'bg-[#F3ECDA]/75 border-[#B8924A]/50 text-[#0F3D2E]'
                      }`}
                    >
                      {Object.entries(GREGORIAN_MONTH_NAMES).map(([m, name]) => (
                        <option key={m} value={Number(m)}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="اختر السنة الميلادية"
                      value={viewGYear}
                      onChange={(e) => setViewGYear(Number(e.target.value))}
                      className={`min-h-[40px] px-3 rounded-[5px] border font-display font-bold text-sm sm:text-base tabular-nums cursor-pointer focus:outline-none shrink-0 ${
                        darkTheme
                          ? 'bg-[#081A14] border-[#B8924A]/45 text-[#D9B96A]'
                          : 'bg-[#F3ECDA]/75 border-[#B8924A]/50 text-[#7A5420]'
                      }`}
                    >
                      {Array.from(
                        { length: 11 },
                        (_, idx) => todayGreg.year - 5 + idx
                      ).map((y) => (
                        <option key={y} value={y}>
                          {y} م
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>

              <div
                className={`w-full sm:w-auto text-xs sm:text-sm font-medium tabular-nums ${
                  darkTheme ? 'text-[#C8B88A]' : 'text-[#425B51]'
                }`}
              >
                المقابل: {secondaryHeaderSpan}
              </div>
            </div>

            {/* Weekday Columns */}
            <div className="grid grid-cols-7 mt-4 mb-1.5 text-center border-b border-[#B8924A]/25 pb-2">
              {ARABIC_WEEKDAYS.map((dayName, idx) => (
                <div
                  key={dayName}
                  className={`text-[10px] sm:text-xs font-display font-bold truncate ${
                    idx === 5
                      ? darkTheme
                        ? 'text-[#D9B96A]'
                        : 'text-[#0F3D2E]'
                      : darkTheme
                      ? 'text-[#C8D8CE]/75'
                      : 'text-[#425B51]'
                  }`}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Crisp 1px Brass Wall-Calendar Grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${mode}-${viewHYear}-${viewHMonth}-${viewGYear}-${viewGMonth}-${hijriOffset}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className={`grid grid-cols-7 gap-px border ${
                  darkTheme
                    ? 'bg-[#B8924A]/25 border-[#B8924A]/35'
                    : 'bg-[#B8924A]/30 border-[#B8924A]/45'
                }`}
              >
                {Array.from({ length: firstWeekdayOffset }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    aria-hidden="true"
                    className={`min-h-[58px] sm:min-h-[82px] ${
                      darkTheme ? 'bg-[#081A14]/65' : 'bg-[#F3ECDA]/45'
                    }`}
                  />
                ))}

                {monthDays.map((cell) => {
                  const isSelected = cell.gregorian.isoDate === selectedIso;
                  const hasOccasions = cell.occasions.length > 0;
                  const primaryOcc = cell.occasions[0];
                  const occCat = primaryOcc
                    ? primaryOcc.category ||
                      (primaryOcc.type === 'birth' ? 'birth' : 'martyrdom')
                    : null;

                  const primaryNum =
                    mode === 'hijri' ? cell.hijri.day : cell.gregorian.day;
                  const secondaryLabel =
                    mode === 'hijri'
                      ? `${cell.gregorian.day}/${cell.gregorian.month}`
                      : `${cell.hijri.day} ${cell.hijri.monthName.split(' ')[0]}`;

                  return (
                    <button
                      key={cell.gregorian.isoDate}
                      type="button"
                      onClick={() => setSelectedIso(cell.gregorian.isoDate)}
                      aria-label={`${cell.hijri.formattedArabic} الموافق ${cell.gregorian.formattedArabic}`}
                      className={`min-h-[58px] sm:min-h-[82px] p-1.5 sm:p-2 text-right flex flex-col justify-between transition-colors cursor-pointer relative ${
                        isSelected
                          ? darkTheme
                            ? 'bg-[#D9B96A] text-[#081A14]'
                            : 'bg-[#0F3D2E] text-[#FAF6EC]'
                          : cell.isToday
                          ? darkTheme
                            ? 'bg-[#143B2E] text-[#FAF6EC] ring-2 ring-inset ring-[#D9B96A]'
                            : 'bg-[#F3ECDA] text-[#0F3D2E] ring-2 ring-inset ring-[#B8924A]'
                          : hasOccasions
                          ? darkTheme
                            ? 'bg-[#0E2920] hover:bg-[#133529] text-[#F3EBD6]'
                            : 'bg-[#FAF6EC] hover:bg-[#F3ECDA]/80 text-[#11271F]'
                          : darkTheme
                          ? 'bg-[#081A14] hover:bg-[#0E2920] text-[#F3EBD6]/90'
                          : 'bg-[#FAF6EC] hover:bg-[#F3ECDA]/50 text-[#11271F]'
                      }`}
                    >
                      {/* Inner hairline highlight when Today */}
                      {cell.isToday && !isSelected && (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-[3px] border border-[#B8924A]/50"
                        />
                      )}

                      <div className="flex items-start justify-between gap-1 w-full">
                        <span className="font-display font-bold text-base sm:text-xl leading-none tabular-nums">
                          {primaryNum}
                        </span>

                        {hasOccasions && renderOccasionIcon(occCat, isSelected)}
                      </div>

                      <div className="w-full">
                        {hasOccasions && (
                          <p
                            className={`hidden sm:block text-[10px] font-bold truncate leading-tight mb-0.5 ${
                              isSelected
                                ? darkTheme
                                  ? 'text-[#081A14]/85'
                                  : 'text-[#D9B96A]'
                                : darkTheme
                                ? 'text-[#D9B96A]'
                                : occCat === 'martyrdom'
                                ? 'text-[#425B51]'
                                : 'text-[#0F3D2E]'
                            }`}
                          >
                            {primaryOcc.title}
                          </p>
                        )}
                        <div
                          className={`text-[10px] sm:text-[11px] font-medium tabular-nums truncate ${
                            isSelected
                              ? darkTheme
                                ? 'text-[#081A14]/75'
                                : 'text-[#FAF6EC]/80'
                              : darkTheme
                              ? 'text-[#C8D8CE]/60'
                              : 'text-[#425B51]/85'
                          }`}
                        >
                          {secondaryLabel}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Geometric Occasion Marks Legend */}
            <div
              className={`mt-4 pt-3.5 border-t border-[#B8924A]/25 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium ${
                darkTheme ? 'text-[#C8D8CE]' : 'text-[#425B51]'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <EidRosetteMark className="w-3.5 h-3.5 text-[#B8924A]" />
                <span>أعياد مباركة</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BirthStarMark className="w-3.5 h-3.5 text-[#1F6B50]" />
                <span>مواليد المعصومين (ع)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MartyrdomCrescentMark
                  className={`w-3.5 h-3.5 ${
                    darkTheme ? 'text-[#C8D8CE]' : 'text-[#425B51]'
                  }`}
                />
                <span>وفيات وذكرى عاشوراء</span>
              </span>
            </div>
          </div>

          {/* Selected Day Folio & Monthly Occasions Ledger */}
          <div className="lg:col-span-4 space-y-5">
            <motion.div
              key={selectedDay.gregorian.isoDate}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className={`rounded-[6px] p-5 sm:p-6 ${
                darkTheme ? 'manuscript-folio-dark' : 'manuscript-folio paper-grain'
              }`}
            >
              <div className="pb-4 border-b border-[#B8924A]/35">
                <span
                  className={`text-xs font-bold ${
                    darkTheme ? 'text-[#D9B96A]' : 'text-[#7A5420]'
                  }`}
                >
                  {selectedDay.isToday ? 'تاريخ اليوم · ' : ''}
                  {selectedDay.gregorian.weekdayAr}
                </span>

                <h2
                  className={`font-calligraphy font-bold text-2xl sm:text-3xl mt-1 tabular-nums ${
                    darkTheme ? 'text-[#FAF6EC]' : 'text-[#0F3D2E]'
                  }`}
                >
                  {selectedDay.hijri.day} {selectedDay.hijri.monthName}{' '}
                  {selectedDay.hijri.year} هـ
                </h2>
                <p
                  className={`text-sm font-medium mt-1 tabular-nums ${
                    darkTheme ? 'text-[#C8D8CE]' : 'text-[#425B51]'
                  }`}
                >
                  الموافق: {selectedDay.gregorian.day}{' '}
                  {selectedDay.gregorian.monthNameAr}{' '}
                  {selectedDay.gregorian.year} م
                </p>
              </div>

              <div className="mt-5 space-y-4">
                {selectedDay.occasions.length === 0 ? (
                  <div
                    className={`rounded-[5px] p-4 border text-center ${
                      darkTheme
                        ? 'bg-[#081A14]/70 border-[#B8924A]/25 text-[#C8D8CE]'
                        : 'bg-[#F3ECDA]/55 border-[#B8924A]/35 text-[#425B51]'
                    }`}
                  >
                    <p className="font-display font-bold text-sm">
                      يوم مبارك لذكر الله وقراءة دعاء اليوم.
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenLibraryEntry('adiyat')}
                      className="mt-3 min-h-[40px] px-4 py-1.5 btn-emerald text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <QuranBookIcon className="w-4 h-4 text-[#D9B96A]" />
                      <span>افتح أدعية الأيام السبعة</span>
                    </button>
                  </div>
                ) : (
                  selectedDay.occasions.map((occ) => {
                    const meta = getCategoryMeta(occ);
                    const isDone = completedReadingIds.includes(occ.id);

                    return (
                      <div
                        key={occ.id}
                        className={`rounded-[5px] border p-4 space-y-3 ${
                          darkTheme ? meta.boxDark : meta.boxLight
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-bold flex items-center gap-1.5 ${
                              darkTheme ? meta.textDark : meta.textLight
                            }`}
                          >
                            {renderOccasionIcon(meta.cat, false)}
                            <span>{meta.label}</span>
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              darkTheme ? 'text-[#C8B88A]' : 'text-[#425B51]'
                            }`}
                          >
                            {occ.figureName}
                          </span>
                        </div>

                        <h3
                          className={`font-display font-bold text-lg leading-snug ${
                            darkTheme ? 'text-[#FAF6EC]' : 'text-[#0F3D2E]'
                          }`}
                        >
                          {occ.title}
                        </h3>

                        <p
                          className={`text-sm leading-relaxed ${
                            darkTheme ? 'text-[#C8D8CE]' : 'text-[#425B51]'
                          }`}
                        >
                          {occ.shortStory}
                        </p>

                        <div
                          className={`pt-2.5 border-t border-[#B8924A]/25 font-arabic font-bold text-base sm:text-lg leading-loose ${
                            darkTheme ? 'text-[#D9B96A]' : 'text-[#0F3D2E]'
                          }`}
                        >
                          «{occ.shortDua}»
                        </div>

                        {justAwardedId === occ.id && (
                          <div className="rounded-[4px] bg-[#0F3D2E] border border-[#D9B96A]/50 text-[#FAF6EC] px-3 py-2 text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
                            <span>بارك الله فيك! سُجلت قراءة المناسبة</span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {occ.linkedSection && (
                            <button
                              type="button"
                              onClick={() =>
                                onOpenLibraryEntry(
                                  occ.linkedSection!,
                                  occ.linkedEntryId
                                )
                              }
                              className="min-h-[38px] px-3.5 py-1.5 btn-gilded text-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>{occ.linkedLabel || 'افتح العمل المناسب'}</span>
                            </button>
                          )}

                          {isDone ? (
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-bold ${
                                darkTheme ? 'text-[#D9B96A]' : 'text-[#1F6B50]'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                              <span>مقروءة</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMarkRead(occ.id)}
                              className={`min-h-[38px] px-3.5 py-1.5 rounded-[5px] border font-display font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                                darkTheme
                                  ? 'bg-[#081A14] hover:bg-[#143B2E] text-[#D9B96A] border-[#D9B96A]/45'
                                  : 'btn-manuscript'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>أتممت القراءة</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* Current Month Occasions Summary */}
            <div
              className={`rounded-[6px] p-5 ${
                darkTheme ? 'manuscript-folio-dark' : 'manuscript-folio paper-grain'
              }`}
            >
              <h3
                className={`font-display font-bold text-base mb-3 ${
                  darkTheme ? 'text-[#D9B96A]' : 'text-[#0F3D2E]'
                }`}
              >
                مناسبات هذا الشهر ({monthOccasionDays.length})
              </h3>
              {monthOccasionDays.length === 0 ? (
                <p
                  className={`text-xs font-medium ${
                    darkTheme ? 'text-[#C8D8CE]/75' : 'text-[#425B51]'
                  }`}
                >
                  لا توجد مناسبات مسجلة في هذا الشهر.
                </p>
              ) : (
                <div className="divide-y divide-[#B8924A]/20 border-t border-[#B8924A]/25 max-h-64 overflow-y-auto pl-1">
                  {monthOccasionDays.map((dayCell) =>
                    dayCell.occasions.map((occ) => (
                      <button
                        key={occ.id}
                        type="button"
                        onClick={() => setSelectedIso(dayCell.gregorian.isoDate)}
                        className={`w-full text-right py-2.5 px-2 transition-colors cursor-pointer flex items-center justify-between gap-2 border-r-[3px] ${
                          selectedIso === dayCell.gregorian.isoDate
                            ? darkTheme
                              ? 'bg-[#143B2E] border-r-[#D9B96A]'
                              : 'bg-[#F3ECDA]/85 border-r-[#B8924A]'
                            : 'border-r-transparent hover:bg-[#B8924A]/10'
                        }`}
                      >
                        <div className="min-w-0">
                          <div
                            className={`text-[11px] font-bold tabular-nums ${
                              darkTheme ? 'text-[#D9B96A]' : 'text-[#7A5420]'
                            }`}
                          >
                            {dayCell.hijri.day} {dayCell.hijri.monthName} ·{' '}
                            {dayCell.gregorian.day}/{dayCell.gregorian.month} م
                          </div>
                          <div className="font-display font-bold text-xs sm:text-sm truncate mt-0.5">
                            {occ.title}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full Twelver Year Agenda Directory */}
        <section
          aria-label="دليل المناسبات الاثني عشرية على مدار العام"
          className={`rounded-[6px] p-5 sm:p-7 ${
            darkTheme ? 'manuscript-folio-dark' : 'manuscript-folio paper-grain'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#B8924A]/35">
            <div>
              <h2
                className={`font-calligraphy font-bold text-xl sm:text-2xl ${
                  darkTheme ? 'text-[#D9B96A]' : 'text-[#0F3D2E]'
                }`}
              >
                فهرس المناسبات الإسلامية على مدار السنة ({HIJRI_OCCASIONS.length} مناسبة)
              </h2>
              <p
                className={`text-xs sm:text-sm font-medium mt-0.5 ${
                  darkTheme ? 'text-[#C8D8CE]/80' : 'text-[#425B51]'
                }`}
              >
                اضغط على أي مناسبة للانتقال المباشر إلى يومها وتاريخها الميلادي المقابل
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: 'الكل' },
                  { id: 'birth', label: 'المواليد' },
                  { id: 'eid', label: 'الأعياد' },
                  { id: 'martyrdom', label: 'الوفيات وعاشوراء' },
                ] as { id: OccasionFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOccasionFilter(tab.id)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-[5px] border text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                    occasionFilter === tab.id
                      ? darkTheme
                        ? 'bg-[#D9B96A] text-[#081A14] border-[#D9B96A]'
                        : 'bg-[#0F3D2E] text-[#FAF6EC] border-[#B8924A]'
                      : darkTheme
                      ? 'bg-[#081A14] text-[#F3EBD6]/80 border-[#B8924A]/30'
                      : 'btn-manuscript'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <ManuscriptDivider variant="rosette" dark={darkTheme} />

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pl-1">
            {filteredYearlyOccasions.map((occ) => {
              const meta = getCategoryMeta(occ);
              const done = completedReadingIds.includes(occ.id);
              return (
                <button
                  key={occ.id}
                  type="button"
                  onClick={() => handleJumpToOccasion(occ)}
                  className={`text-right p-4 rounded-[5px] border transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                    darkTheme
                      ? 'bg-[#081A14]/75 hover:bg-[#123328] border-[#B8924A]/30'
                      : 'bg-[#F3ECDA]/45 hover:bg-[#F3ECDA] border-[#B8924A]/35'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold flex items-center gap-1.5 tabular-nums ${
                          darkTheme ? meta.textDark : meta.textLight
                        }`}
                      >
                        {renderOccasionIcon(meta.cat, false)}
                        <span>
                          {occ.day} {HIJRI_MONTH_NAMES[occ.month]}
                        </span>
                      </span>
                      {done && (
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            darkTheme ? 'text-[#D9B96A]' : 'text-[#1F6B50]'
                          }`}
                          aria-label="مقروءة"
                        />
                      )}
                    </div>
                    <h3
                      className={`font-display font-bold text-sm sm:text-base mt-1.5 leading-snug ${
                        darkTheme ? 'text-[#FAF6EC]' : 'text-[#0F3D2E]'
                      }`}
                    >
                      {occ.title}
                    </h3>
                  </div>
                  <p
                    className={`text-xs line-clamp-2 leading-relaxed ${
                      darkTheme ? 'text-[#C8D8CE]/75' : 'text-[#425B51]'
                    }`}
                  >
                    {occ.shortStory}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
};
