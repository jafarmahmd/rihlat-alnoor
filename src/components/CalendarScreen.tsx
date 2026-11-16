import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Moon,
  Sparkles,
  Star,
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
  loadHijriOffset,
  saveHijriOffset,
  toGregorianInfoFromUtcNoon,
} from '../data/hijriCalendar';
import { DigitalLibrarySection, HijriOccasion } from '../types/game';

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

  // Build visible month cells
  const monthDays: DualCalendarDay[] = useMemo(() => {
    if (mode === 'hijri') {
      return buildHijriMonthDays(viewHYear, viewHMonth, hijriOffset);
    }
    return buildGregorianMonthDays(viewGYear, viewGMonth, hijriOffset);
  }, [mode, viewHYear, viewHMonth, viewGYear, viewGMonth, hijriOffset]);

  // Keep selectedIso valid inside current viewed month when navigating
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

  // Spanning counterpart label (e.g., if viewing Muharram -> shows matching Gregorian months)
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
    // Sync target month to the currently selected day so switching is seamless
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
        label: 'عيد ومناسبة سعيدة',
        dotClass: 'bg-amber-400',
        textLight: 'text-amber-800',
        textDark: 'text-amber-300',
        borderLight: 'border-amber-300 bg-amber-50/70',
        borderDark: 'border-amber-400/40 bg-[#13332C]',
      };
    }
    if (cat === 'birth') {
      return {
        label: 'ذكرى ولادة مباركة',
        dotClass: 'bg-emerald-500',
        textLight: 'text-emerald-800',
        textDark: 'text-emerald-300',
        borderLight: 'border-emerald-200 bg-emerald-50/65',
        borderDark: 'border-emerald-400/35 bg-[#0E2B26]',
      };
    }
    if (cat === 'martyrdom') {
      return {
        label: 'ذكرى شهادة ومواساة',
        dotClass: 'bg-sky-500',
        textLight: 'text-sky-800',
        textDark: 'text-sky-300',
        borderLight: 'border-sky-200 bg-sky-50/65',
        borderDark: 'border-sky-400/35 bg-[#0C242B]',
      };
    }
    return {
      label: 'حدث إسلامي وتاريخي',
      dotClass: 'bg-teal-500',
      textLight: 'text-teal-800',
      textDark: 'text-teal-300',
      borderLight: 'border-teal-200 bg-teal-50/65',
      borderDark: 'border-teal-400/35 bg-[#0D2B2A]',
    };
  };

  return (
    <section
      aria-label="التقويم الهجري الجعفري والميلادي"
      className={`min-h-[calc(100vh-3.5rem)] transition-colors duration-300 py-4 sm:py-8 px-3 sm:px-6 ${
        darkTheme
          ? 'bg-[#061816] text-amber-50'
          : 'text-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Top Bar & Theme / Mode Switch */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onBackHome}
              className={`min-h-[44px] px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 border cursor-pointer transition-colors whitespace-nowrap ${
                darkTheme
                  ? 'bg-[#0B2622] hover:bg-[#113630] text-amber-100 border-amber-400/30'
                  : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs'
              }`}
            >
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
              <span>الرئيسية</span>
            </button>

            <div className="min-w-0">
              <h1
                className={`font-display font-black text-xl sm:text-3xl flex items-center gap-2 ${
                  darkTheme ? 'text-amber-100' : 'text-emerald-950'
                }`}
              >
                <CalendarIcon
                  className={`w-6 h-6 sm:w-7 sm:h-7 shrink-0 ${
                    darkTheme ? 'text-amber-300' : 'text-emerald-600'
                  }`}
                  aria-hidden="true"
                />
                <span>التقويم الهجري الجعفري والميلادي</span>
              </h1>
              <p
                className={`text-xs sm:text-sm font-bold mt-0.5 tabular-nums ${
                  darkTheme ? 'text-emerald-200/80' : 'text-slate-600'
                }`}
              >
                اليوم: {todayHijri.formattedArabic} · الموافق {todayGreg.formattedArabic}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
            {/* Hijri vs Gregorian Mode Switcher */}
            <div
              role="tablist"
              aria-label="نوع عرض التقويم"
              className={`w-full sm:w-auto grid grid-cols-2 sm:inline-flex items-center p-1 rounded-2xl border ${
                darkTheme
                  ? 'bg-[#04110F] border-amber-400/25'
                  : 'bg-emerald-50/90 border-emerald-200'
              }`}
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'hijri'}
                onClick={() => handleModeSwitch('hijri')}
                className={`min-h-[42px] px-2 sm:px-4 py-1.5 rounded-xl font-display font-extrabold text-[11px] sm:text-sm transition-all cursor-pointer truncate ${
                  mode === 'hijri'
                    ? darkTheme
                      ? 'bg-amber-400 text-[#061816] shadow-sm'
                      : 'bg-emerald-600 text-white shadow-sm'
                    : darkTheme
                    ? 'text-amber-100/80 hover:text-white'
                    : 'text-emerald-900 hover:bg-white/80'
                }`}
              >
                التقويم الهجري الجعفري
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'gregorian'}
                onClick={() => handleModeSwitch('gregorian')}
                className={`min-h-[42px] px-2 sm:px-4 py-1.5 rounded-xl font-display font-extrabold text-[11px] sm:text-sm transition-all cursor-pointer truncate ${
                  mode === 'gregorian'
                    ? darkTheme
                      ? 'bg-teal-400 text-[#061816] shadow-sm'
                      : 'bg-sky-600 text-white shadow-sm'
                    : darkTheme
                    ? 'text-amber-100/80 hover:text-white'
                    : 'text-emerald-900 hover:bg-white/80'
                }`}
              >
                التقويم الميلادي
              </button>
            </div>

            <button
              type="button"
              onClick={() => setDarkTheme((d) => !d)}
              className={`min-h-[44px] px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 border cursor-pointer transition-colors whitespace-nowrap ${
                darkTheme
                  ? 'bg-[#0B2622] border-amber-400/40 text-amber-200 hover:bg-[#113630]'
                  : 'bg-white border-emerald-200 text-slate-800 hover:bg-slate-50 shadow-xs'
              }`}
            >
              {darkTheme ? (
                <>
                  <Sun className="w-4 h-4 text-amber-300" aria-hidden="true" />
                  <span>الوضع النهاري</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  <span>الداكن الليلي</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Lunar Sighting Offset & Quick Converter Bar */}
        <div
          className={`rounded-3xl border p-3.5 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4 ${
            darkTheme
              ? 'bg-[#0A221E] border-amber-400/20'
              : 'bg-white/95 border-emerald-200 shadow-sm'
          }`}
        >
          {/* Lunar Sighting Offset */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
            <span
              className={`text-xs sm:text-sm font-extrabold flex items-center gap-1.5 ml-1 ${
                darkTheme ? 'text-amber-300' : 'text-emerald-900'
              }`}
            >
              <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>مطابقة هلال الشهر (الرؤية الشرعية):</span>
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
                    className={`min-h-[38px] px-2.5 sm:px-3 py-1 rounded-xl text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                      active
                        ? darkTheme
                          ? 'bg-amber-400 text-[#061816]'
                          : 'bg-emerald-600 text-white'
                        : darkTheme
                        ? 'bg-[#061816] text-amber-100/80 border border-amber-400/15 hover:bg-[#0F2F2A]'
                        : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Jump to Today or Specific Gregorian Date */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <label
              htmlFor="calendar-greg-jump"
              className={`text-xs font-bold w-full sm:w-auto ${
                darkTheme ? 'text-emerald-200/80' : 'text-slate-600'
              }`}
            >
              انتقال لتاريخ ميلادي:
            </label>
            <input
              id="calendar-greg-jump"
              type="date"
              value={selectedDay.gregorian.isoDate}
              onChange={(e) => handleJumpToGregorianInput(e.target.value)}
              className={`min-h-[42px] flex-1 sm:flex-none px-3 rounded-xl border text-xs sm:text-sm font-bold tabular-nums focus:outline-none ${
                darkTheme
                  ? 'bg-[#061816] border-amber-400/30 text-amber-100'
                  : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
              }`}
            />
            <button
              type="button"
              onClick={handleJumpToday}
              className={`min-h-[42px] px-4 py-1.5 rounded-xl font-display font-extrabold text-xs sm:text-sm cursor-pointer transition-colors whitespace-nowrap ${
                darkTheme
                  ? 'bg-teal-400 hover:bg-teal-300 text-[#061816]'
                  : 'bg-amber-400 hover:bg-amber-300 text-amber-950'
              }`}
            >
              تاريخ اليوم
            </button>
          </div>
        </div>

        {/* Main Workspace Grid: Month Grid + Selected Day Occasion Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Calendar Grid Column */}
          <div
            className={`lg:col-span-8 rounded-3xl border p-3 sm:p-6 shadow-lg ${
              darkTheme
                ? 'bg-[#0A221E] border-amber-400/25 shadow-black/40'
                : 'bg-white/95 border-emerald-200 shadow-emerald-950/5'
            }`}
          >
            {/* Month Navigator Header */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 pb-4 sm:pb-5 border-b border-current/10">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="الشهر السابق"
                  className={`min-h-[42px] min-w-[42px] sm:min-h-[44px] sm:min-w-[44px] rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
                    darkTheme
                      ? 'bg-[#061816] hover:bg-[#113530] border-amber-400/25 text-amber-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="الشهر التالي"
                  className={`min-h-[42px] min-w-[42px] sm:min-h-[44px] sm:min-w-[44px] rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
                    darkTheme
                      ? 'bg-[#061816] hover:bg-[#113530] border-amber-400/25 text-amber-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {/* Active Month & Year Dropdown Selectors */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-none justify-end sm:justify-start min-w-0">
                {mode === 'hijri' ? (
                  <>
                    <select
                      aria-label="اختر الشهر الهجري"
                      value={viewHMonth}
                      onChange={(e) => setViewHMonth(Number(e.target.value))}
                      className={`min-h-[42px] min-w-0 flex-1 sm:flex-none px-2.5 sm:px-3 rounded-xl border font-display font-black text-sm sm:text-lg cursor-pointer focus:outline-none ${
                        darkTheme
                          ? 'bg-[#061816] border-amber-400/30 text-amber-100'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-950'
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
                      className={`min-h-[42px] px-2.5 sm:px-3 rounded-xl border font-display font-black text-sm sm:text-lg tabular-nums cursor-pointer focus:outline-none shrink-0 ${
                        darkTheme
                          ? 'bg-[#061816] border-amber-400/30 text-amber-300'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
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
                      className={`min-h-[42px] min-w-0 flex-1 sm:flex-none px-2.5 sm:px-3 rounded-xl border font-display font-black text-sm sm:text-lg cursor-pointer focus:outline-none ${
                        darkTheme
                          ? 'bg-[#061816] border-teal-400/30 text-teal-100'
                          : 'bg-sky-50 border-sky-200 text-sky-950'
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
                      className={`min-h-[42px] px-2.5 sm:px-3 rounded-xl border font-display font-black text-sm sm:text-lg tabular-nums cursor-pointer focus:outline-none shrink-0 ${
                        darkTheme
                          ? 'bg-[#061816] border-teal-400/30 text-teal-300'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
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
                className={`w-full sm:w-auto text-xs sm:text-sm font-bold tabular-nums ${
                  darkTheme ? 'text-amber-200/80' : 'text-slate-600'
                }`}
              >
                المقابل: {secondaryHeaderSpan}
              </div>
            </div>

            {/* Weekday Columns Header */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-3 sm:mt-4 mb-1.5 sm:mb-2 text-center">
              {ARABIC_WEEKDAYS.map((dayName, idx) => (
                <div
                  key={dayName}
                  className={`py-1.5 sm:py-2 text-[10px] sm:text-sm font-black truncate ${
                    idx === 5
                      ? darkTheme
                        ? 'text-amber-300'
                        : 'text-emerald-700'
                      : darkTheme
                      ? 'text-emerald-200/75'
                      : 'text-slate-600'
                  }`}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Smooth Animated Month Grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${mode}-${viewHYear}-${viewHMonth}-${viewGYear}-${viewGMonth}-${hijriOffset}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-7 gap-1 sm:gap-2"
              >
                {/* Leading Empty Cells */}
                {Array.from({ length: firstWeekdayOffset }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    aria-hidden="true"
                    className="min-h-[54px] sm:min-h-[78px]"
                  />
                ))}

                {/* Day Cells */}
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
                      className={`min-h-[54px] sm:min-h-[78px] p-1 sm:p-2 rounded-xl sm:rounded-2xl border text-right flex flex-col justify-between transition-all cursor-pointer relative ${
                        isSelected
                          ? darkTheme
                            ? 'bg-amber-400 text-[#061816] border-amber-300 shadow-lg shadow-amber-500/20'
                            : 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                          : cell.isToday
                          ? darkTheme
                            ? 'bg-[#123B34] border-amber-400 text-amber-100'
                            : 'bg-amber-50 border-amber-400 text-emerald-950'
                          : hasOccasions
                          ? darkTheme
                            ? 'bg-[#0D2B26] hover:bg-[#133832] border-amber-400/35 text-amber-50'
                            : occCat === 'eid' || occCat === 'birth'
                            ? 'bg-emerald-50/75 hover:bg-emerald-50 border-emerald-200 text-slate-900'
                            : 'bg-sky-50/75 hover:bg-sky-50 border-sky-200 text-slate-900'
                          : darkTheme
                          ? 'bg-[#071B18] hover:bg-[#0D2823] border-amber-400/10 text-emerald-50/90'
                          : 'bg-white hover:bg-emerald-50/40 border-slate-200/80 text-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 w-full">
                        <span className="font-display font-black text-base sm:text-xl leading-none tabular-nums">
                          {primaryNum}
                        </span>

                        {hasOccasions && (
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${
                              isSelected
                                ? darkTheme
                                  ? 'bg-[#061816]'
                                  : 'bg-amber-300'
                                : occCat === 'eid'
                                ? 'bg-amber-400'
                                : occCat === 'birth'
                                ? 'bg-emerald-500'
                                : 'bg-sky-500'
                            }`}
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      <div className="w-full">
                        {hasOccasions && (
                          <p
                            className={`hidden sm:block text-[10px] font-extrabold truncate leading-tight mb-0.5 ${
                              isSelected
                                ? darkTheme
                                  ? 'text-[#061816]/85'
                                  : 'text-amber-100'
                                : darkTheme
                                ? 'text-amber-300'
                                : occCat === 'martyrdom'
                                ? 'text-sky-800'
                                : 'text-emerald-800'
                            }`}
                          >
                            {primaryOcc.title}
                          </p>
                        )}
                        <div
                          className={`text-[10px] sm:text-[11px] font-bold tabular-nums truncate ${
                            isSelected
                              ? darkTheme
                                ? 'text-[#061816]/80'
                                : 'text-emerald-100'
                              : darkTheme
                              ? 'text-emerald-200/65'
                              : 'text-slate-500'
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

            {/* Color Legend */}
            <div
              className={`mt-5 pt-4 border-t border-current/10 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold ${
                darkTheme ? 'text-emerald-200/80' : 'text-slate-600'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" aria-hidden="true" />
                <span>أعياد مباركة</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
                <span>مواليد المعصومين (ع)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" aria-hidden="true" />
                <span>وفيات وذكرى عاشوراء</span>
              </span>
            </div>
          </div>

          {/* Right Column: Selected Day Card + Occasions */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-5">
            <motion.div
              key={selectedDay.gregorian.isoDate}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className={`rounded-3xl border p-4 sm:p-6 shadow-lg ${
                darkTheme
                  ? 'bg-[#0A221E] border-amber-400/30 shadow-black/40'
                  : 'bg-white/95 border-amber-200 shadow-emerald-950/5'
              }`}
            >
              <div className="pb-4 border-b border-current/10">
                <span
                  className={`text-xs font-extrabold ${
                    darkTheme ? 'text-amber-300' : 'text-emerald-700'
                  }`}
                >
                  {selectedDay.isToday ? 'تاريخ اليوم · ' : ''}
                  {selectedDay.gregorian.weekdayAr}
                </span>

                <h2
                  className={`font-display font-black text-2xl sm:text-3xl mt-1 tabular-nums ${
                    darkTheme ? 'text-amber-100' : 'text-emerald-950'
                  }`}
                >
                  {selectedDay.hijri.day} {selectedDay.hijri.monthName}{' '}
                  {selectedDay.hijri.year} هـ
                </h2>
                <p
                  className={`text-sm font-bold mt-1 tabular-nums ${
                    darkTheme ? 'text-teal-200' : 'text-sky-800'
                  }`}
                >
                  الموافق: {selectedDay.gregorian.day}{' '}
                  {selectedDay.gregorian.monthNameAr}{' '}
                  {selectedDay.gregorian.year} م
                </p>
              </div>

              {/* Occasions for Selected Day */}
              <div className="mt-5 space-y-4">
                {selectedDay.occasions.length === 0 ? (
                  <div
                    className={`rounded-2xl p-4 border text-center ${
                      darkTheme
                        ? 'bg-[#061816] border-amber-400/15 text-emerald-100/80'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <p className="font-display font-bold text-sm">
                      يوم مبارك لذكر الله وقراءة دعاء اليوم.
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenLibraryEntry('adiyat')}
                      className={`mt-3 min-h-[40px] px-4 py-2 rounded-xl font-display font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                        darkTheme
                          ? 'bg-[#123730] hover:bg-[#17443C] text-amber-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" aria-hidden="true" />
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
                        className={`rounded-2xl border p-4 space-y-3 ${
                          darkTheme ? meta.borderDark : meta.borderLight
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-black flex items-center gap-1.5 ${
                              darkTheme ? meta.textDark : meta.textLight
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${meta.dotClass}`}
                              aria-hidden="true"
                            />
                            <span>{meta.label}</span>
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              darkTheme ? 'text-amber-200/80' : 'text-slate-600'
                            }`}
                          >
                            {occ.figureName}
                          </span>
                        </div>

                        <h3
                          className={`font-display font-black text-lg leading-snug ${
                            darkTheme ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {occ.title}
                        </h3>

                        <p
                          className={`text-sm leading-relaxed ${
                            darkTheme ? 'text-emerald-100/85' : 'text-slate-700'
                          }`}
                        >
                          {occ.shortStory}
                        </p>

                        <div
                          className={`pt-2.5 border-t border-current/10 font-arabic font-bold text-base sm:text-lg leading-loose ${
                            darkTheme ? 'text-amber-200' : 'text-amber-950'
                          }`}
                        >
                          «{occ.shortDua}»
                        </div>

                        {justAwardedId === occ.id && (
                          <div className="rounded-xl bg-emerald-600 text-white px-3 py-2 text-xs font-extrabold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-amber-200" aria-hidden="true" />
                            <span>بارك الله فيك! تم تسجيل قراءة المناسبة</span>
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
                              className={`min-h-[40px] px-3.5 py-2 rounded-xl font-display font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                                darkTheme
                                  ? 'bg-amber-400 hover:bg-amber-300 text-[#061816]'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{occ.linkedLabel || 'افتح العمل المناسب'}</span>
                            </button>
                          )}

                          {isDone ? (
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-extrabold ${
                                darkTheme
                                  ? 'text-emerald-300'
                                  : 'text-emerald-700'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                              <span>مقروءة</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMarkRead(occ.id)}
                              className={`min-h-[40px] px-3.5 py-2 rounded-xl font-display font-extrabold text-xs flex items-center gap-1.5 border cursor-pointer transition-colors ${
                                darkTheme
                                  ? 'bg-[#061816] hover:bg-[#0D2C27] text-emerald-200 border-emerald-400/35'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
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

            {/* Occasions Summary for the Currently Viewed Month */}
            <div
              className={`rounded-3xl border p-5 ${
                darkTheme
                  ? 'bg-[#0A221E] border-amber-400/20'
                  : 'bg-white/95 border-emerald-200 shadow-sm'
              }`}
            >
              <h3
                className={`font-display font-black text-base mb-3 ${
                  darkTheme ? 'text-amber-200' : 'text-emerald-950'
                }`}
              >
                مناسبات هذا الشهر ({monthOccasionDays.length})
              </h3>
              {monthOccasionDays.length === 0 ? (
                <p
                  className={`text-xs font-bold ${
                    darkTheme ? 'text-emerald-200/70' : 'text-slate-500'
                  }`}
                >
                  لا توجد مناسبات مسجلة في هذا الشهر.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pl-1">
                  {monthOccasionDays.map((dayCell) =>
                    dayCell.occasions.map((occ) => (
                      <button
                        key={occ.id}
                        type="button"
                        onClick={() => setSelectedIso(dayCell.gregorian.isoDate)}
                        className={`w-full text-right p-2.5 rounded-2xl border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          selectedIso === dayCell.gregorian.isoDate
                            ? darkTheme
                              ? 'bg-[#123A33] border-amber-400'
                              : 'bg-emerald-50 border-emerald-400'
                            : darkTheme
                            ? 'bg-[#061816] hover:bg-[#0D2B26] border-amber-400/15'
                            : 'bg-slate-50/70 hover:bg-emerald-50/50 border-slate-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <div
                            className={`text-[11px] font-bold tabular-nums ${
                              darkTheme ? 'text-amber-300' : 'text-emerald-700'
                            }`}
                          >
                            {dayCell.hijri.day} {dayCell.hijri.monthName} ·{' '}
                            {dayCell.gregorian.day}/{dayCell.gregorian.month} م
                          </div>
                          <div className="font-display font-extrabold text-xs sm:text-sm truncate mt-0.5">
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
          className={`rounded-3xl border p-5 sm:p-7 ${
            darkTheme
              ? 'bg-[#0A221E] border-amber-400/20'
              : 'bg-white/95 border-emerald-200 shadow-sm'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-current/10">
            <div>
              <h2
                className={`font-display font-black text-xl sm:text-2xl ${
                  darkTheme ? 'text-amber-100' : 'text-emerald-950'
                }`}
              >
                دليل المناسبات الجعفرية على مدار السنة الهجرية ({HIJRI_OCCASIONS.length} مناسبة)
              </h2>
              <p
                className={`text-xs sm:text-sm font-bold mt-0.5 ${
                  darkTheme ? 'text-emerald-200/75' : 'text-slate-600'
                }`}
              >
                اضغط على أي مناسبة للانتقال الفوري إلى يومها وتاريخها الميلادي المقابل في التقويم
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
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-colors whitespace-nowrap ${
                    occasionFilter === tab.id
                      ? darkTheme
                        ? 'bg-amber-400 text-[#061816]'
                        : 'bg-emerald-600 text-white'
                      : darkTheme
                      ? 'bg-[#061816] text-amber-100/80 border border-amber-400/15'
                      : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pl-1">
            {filteredYearlyOccasions.map((occ) => {
              const meta = getCategoryMeta(occ);
              const done = completedReadingIds.includes(occ.id);
              return (
                <button
                  key={occ.id}
                  type="button"
                  onClick={() => handleJumpToOccasion(occ)}
                  className={`text-right p-4 rounded-2xl border transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                    darkTheme
                      ? 'bg-[#061816] hover:bg-[#0E2E29] border-amber-400/15'
                      : 'bg-slate-50/60 hover:bg-emerald-50/50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-black tabular-nums ${
                          darkTheme ? meta.textDark : meta.textLight
                        }`}
                      >
                        {occ.day} {HIJRI_MONTH_NAMES[occ.month]}
                      </span>
                      {done && (
                        <CheckCircle2
                          className="w-4 h-4 text-emerald-500 shrink-0"
                          aria-label="مقروءة"
                        />
                      )}
                    </div>
                    <h3
                      className={`font-display font-extrabold text-sm sm:text-base mt-1 leading-snug ${
                        darkTheme ? 'text-amber-50' : 'text-slate-900'
                      }`}
                    >
                      {occ.title}
                    </h3>
                  </div>
                  <p
                    className={`text-xs line-clamp-2 ${
                      darkTheme ? 'text-emerald-100/70' : 'text-slate-600'
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
