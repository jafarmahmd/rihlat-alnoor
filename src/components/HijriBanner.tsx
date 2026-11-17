import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Sparkles,
  HeartHandshake,
  BookOpenCheck,
  Star,
  ChevronDown,
  X,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import {
  HIJRI_MONTH_NAMES,
  HIJRI_OCCASIONS,
  getCurrentOrUpcomingOccasions,
  getHijriFromUtcNoon,
  getTodayUtcNoon,
  toGregorianInfoFromUtcNoon,
} from '../data/hijriCalendar';
import { DigitalLibrarySection, HijriOccasion } from '../types/game';

interface HijriBannerProps {
  hijriOffset: number;
  completedReadingIds: string[];
  onCompleteReading: (readingId: string) => boolean;
  onOpenCalendar: () => void;
  onOpenLibraryEntry: (
    section: DigitalLibrarySection,
    entryId?: string
  ) => void;
}

export const HijriBanner: React.FC<HijriBannerProps> = ({
  hijriOffset,
  completedReadingIds,
  onCompleteReading,
  onOpenCalendar,
  onOpenLibraryEntry,
}) => {
  const todayUtc = useMemo(() => getTodayUtcNoon(), []);
  const gregorianToday = useMemo(
    () => toGregorianInfoFromUtcNoon(todayUtc),
    [todayUtc]
  );
  const hijriToday = useMemo(
    () => getHijriFromUtcNoon(todayUtc, hijriOffset),
    [todayUtc, hijriOffset]
  );

  const { occasions: featuredList, isExactToday, daysUntil } = useMemo(
    () => getCurrentOrUpcomingOccasions(hijriToday),
    [hijriToday]
  );
  const featuredOccasion = featuredList[0];

  const [selectedOccasion, setSelectedOccasion] = useState<HijriOccasion | null>(
    null
  );
  const [showAllOccasions, setShowAllOccasions] = useState(false);
  const [justRewardedId, setJustRewardedId] = useState<string | null>(null);

  const isBirth = featuredOccasion.type === 'birth';

  const handleMarkOccasionRead = (occId: string) => {
    const awarded = onCompleteReading(occId);
    if (awarded) {
      setJustRewardedId(occId);
      setTimeout(() => setJustRewardedId(null), 2600);
    }
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        aria-label="التقويم الهجري الجعفري والميلادي والمناسبات"
        className="rounded-2xl sm:rounded-3xl bg-[#FDFCF9] border border-[#E5E0D5] p-4 sm:p-5 shadow-2xs transition-colors"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
          {/* Synchronized Hijri & Gregorian Dates + Occasion Headline */}
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border border-[#D4E2DA] bg-[#EFF5F2] text-[#145344]">
              <Calendar className="w-5 h-5" aria-hidden="true" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm font-semibold text-stone-600 tabular-nums">
                <span className="text-[#145344] font-bold">الهجري: {hijriToday.formattedArabic}</span>
                <span className="text-stone-400" aria-hidden="true">·</span>
                <span>
                  الميلادي: {gregorianToday.day} {gregorianToday.monthNameAr} {gregorianToday.year} م
                </span>
                <span className="text-stone-400" aria-hidden="true">·</span>
                <span className={isExactToday ? 'text-[#7D602B] font-bold' : 'text-[#145344]'}>
                  {isExactToday
                    ? 'مناسبة اليوم المباركة'
                    : daysUntil === 1
                    ? 'مناسبة غداً بمشيئة الله'
                    : `المناسبة القادمة (${featuredOccasion.day} ${HIJRI_MONTH_NAMES[featuredOccasion.month]})`}
                </span>
              </div>

              <h2 className="font-display font-bold text-base sm:text-lg text-[#172B24] leading-snug">
                {featuredOccasion.title}
              </h2>
            </div>
          </div>

          {/* Simplified Calm Action Strip */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenCalendar}
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#EFF5F2] hover:bg-[#E2EFE8] text-[#145344] border border-[#CFE0D8] font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
            >
              <CalendarDays className="w-4 h-4 text-[#145344] shrink-0" aria-hidden="true" />
              <span>التقويم</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedOccasion(featuredOccasion)}
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#F7F5EE] hover:bg-[#EEEAE0] text-[#1E3B32] border border-[#E2DDD0] font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-[#9A7B3E] shrink-0" aria-hidden="true" />
              <span>القصة والدعاء</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAllOccasions((prev) => !prev)}
              className="min-h-[42px] px-3 py-2 rounded-xl bg-white hover:bg-[#F7F5EE] text-stone-700 border border-[#E5E0D5] font-bold text-xs sm:text-sm flex items-center justify-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
            >
              <span>المناسبات ({HIJRI_OCCASIONS.length})</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showAllOccasions ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* Expandable Yearly Occasions Grid */}
        <AnimatePresence>
          {showAllOccasions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-emerald-200/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pl-1">
                {HIJRI_OCCASIONS.map((occ) => {
                  const done = completedReadingIds.includes(occ.id);
                  return (
                    <button
                      key={occ.id}
                      type="button"
                      onClick={() => setSelectedOccasion(occ)}
                      className="text-right p-3 rounded-2xl bg-white/90 hover:bg-amber-50/70 border border-emerald-100 hover:border-amber-300 transition-colors cursor-pointer flex items-start justify-between gap-2"
                    >
                      <div>
                        <p className="text-xs font-bold text-sky-700 tabular-nums">
                          {occ.day} {HIJRI_MONTH_NAMES[occ.month]} ·{' '}
                          {occ.type === 'birth' ? 'ذكرى ولادة / عيد' : 'ذكرى عطرة'}
                        </p>
                        <p className="font-display font-bold text-sm text-slate-900 mt-0.5 line-clamp-2">
                          {occ.title}
                        </p>
                      </div>
                      {done && (
                        <CheckCircle2
                          className="w-4 h-4 text-emerald-600 shrink-0 mt-1"
                          aria-label="مقروء"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Occasion Story & Dua Modal */}
      <AnimatePresence>
        {selectedOccasion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4"
            onClick={() => setSelectedOccasion(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl sm:rounded-3xl border-2 border-amber-300 shadow-2xl"
            >
              <div className="bg-gradient-to-l from-emerald-600 to-teal-600 p-5 text-white flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-amber-200 tabular-nums">
                    {selectedOccasion.day}{' '}
                    {HIJRI_MONTH_NAMES[selectedOccasion.month]} ·{' '}
                    {selectedOccasion.figureName}
                  </p>
                  <h3 className="font-display font-black text-xl sm:text-2xl mt-1 leading-snug">
                    {selectedOccasion.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOccasion(null)}
                  aria-label="إغلاق النافذة"
                  className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-4">
                  <h4 className="font-display font-extrabold text-emerald-900 flex items-center gap-2 text-base mb-2">
                    <BookOpenCheck className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                    <span>نبذة عن المناسبة</span>
                  </h4>
                  <p className="text-slate-800 text-base sm:text-lg leading-relaxed">
                    {selectedOccasion.shortStory}
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-50/90 border border-amber-200 p-4">
                  <h4 className="font-display font-extrabold text-amber-900 flex items-center gap-2 text-base mb-2">
                    <HeartHandshake className="w-5 h-5 text-amber-600" aria-hidden="true" />
                    <span>دعاء قصير بهذه المناسبة</span>
                  </h4>
                  <p className="font-display font-bold text-amber-950 text-lg sm:text-xl leading-loose">
                    {selectedOccasion.shortDua}
                  </p>
                </div>

                {justRewardedId === selectedOccasion.id && (
                  <div className="rounded-2xl bg-emerald-600 text-white p-3.5 text-center font-display font-extrabold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-amber-200" aria-hidden="true" />
                    <span>بارك الله فيك! تم تسجيل قراءة المناسبة</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedOccasion.linkedSection && (
                      <button
                        type="button"
                        onClick={() => {
                          const sec = selectedOccasion.linkedSection!;
                          const eid = selectedOccasion.linkedEntryId;
                          setSelectedOccasion(null);
                          onOpenLibraryEntry(sec, eid);
                        }}
                        className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-extrabold text-sm sm:text-base flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-amber-200" aria-hidden="true" />
                        <span>
                          {selectedOccasion.linkedLabel || 'افتح الزيارة / الدعاء'}
                        </span>
                      </button>
                    )}

                    {completedReadingIds.includes(selectedOccasion.id) ? (
                      <span className="inline-flex items-center gap-2 text-emerald-700 font-extrabold text-sm sm:text-base">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                        <span>تمت القراءة</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMarkOccasionRead(selectedOccasion.id)}
                        className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-display font-black text-sm sm:text-base flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-700" aria-hidden="true" />
                        <span>أتممت القراءة</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOccasion(null)}
                    className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm cursor-pointer transition-colors"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
