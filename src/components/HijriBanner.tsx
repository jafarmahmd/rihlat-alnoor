import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, X, CheckCircle2, ArrowLeft } from 'lucide-react';
import {
  HIJRI_MONTH_NAMES,
  HIJRI_OCCASIONS,
  getCurrentOrUpcomingOccasions,
  getHijriFromUtcNoon,
  getTodayUtcNoon,
  toGregorianInfoFromUtcNoon,
} from '../data/hijriCalendar';
import { DigitalLibrarySection, HijriOccasion } from '../types/game';
import {
  BirthStarMark,
  CalendarArchIcon,
  DuaScrollIcon,
  EidRosetteMark,
  ManuscriptDivider,
  MartyrdomCrescentMark,
  StoriesLanternIcon,
} from './IslamicOrnaments';

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

  const handleMarkOccasionRead = (occId: string) => {
    const awarded = onCompleteReading(occId);
    if (awarded) {
      setJustRewardedId(occId);
      setTimeout(() => setJustRewardedId(null), 2600);
    }
  };

  const renderOccasionMark = (occ: HijriOccasion) => {
    if (occ.id.includes('eid') || occ.title.includes('عيد')) {
      return <EidRosetteMark className="w-4 h-4 text-[#B8924A] shrink-0" />;
    }
    if (occ.type === 'birth') {
      return <BirthStarMark className="w-4 h-4 text-[#1F6B50] shrink-0" />;
    }
    return <MartyrdomCrescentMark className="w-4 h-4 text-[#6B5423] shrink-0" />;
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        aria-label="التقويم الهجري الجعفري والميلادي والمناسبات"
        className="manuscript-folio rounded-[6px] p-3.5 sm:p-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Synchronized Date Ribbon & Occasion */}
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[5px] bg-[#0F3D2E] text-[#D9B96A] flex items-center justify-center shrink-0 border border-[#B8924A]/60">
              <CalendarArchIcon className="w-5 h-5" />
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs sm:text-sm font-medium text-[#425B51] tabular-nums">
                <span className="text-[#0F3D2E] font-bold">
                  {hijriToday.formattedArabic}
                </span>
                <span className="text-[#B8924A]" aria-hidden="true">|</span>
                <span>
                  {gregorianToday.day} {gregorianToday.monthNameAr} {gregorianToday.year} م
                </span>
                <span className="text-[#B8924A]" aria-hidden="true">|</span>
                <span className="inline-flex items-center gap-1 text-[#7A5E2A] font-semibold">
                  {renderOccasionMark(featuredOccasion)}
                  <span>
                    {isExactToday
                      ? 'مناسبة اليوم المباركة'
                      : daysUntil === 1
                      ? 'مناسبة غداً بمشيئة الله'
                      : `${featuredOccasion.day} ${HIJRI_MONTH_NAMES[featuredOccasion.month]}`}
                  </span>
                </span>
              </div>

              <h2 className="font-display font-bold text-base sm:text-lg text-[#11271F] leading-snug">
                {featuredOccasion.title}
              </h2>
            </div>
          </div>

          {/* 3 Architectural Action Links */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenCalendar}
              className="min-h-[40px] px-3.5 py-1.5 btn-manuscript text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarArchIcon className="w-4 h-4 text-[#0F3D2E]" />
              <span>التقويم السنوي</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedOccasion(featuredOccasion)}
              className="min-h-[40px] px-3.5 py-1.5 btn-emerald text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>القصة والدعاء</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAllOccasions((prev) => !prev)}
              className="min-h-[40px] px-2.5 py-1.5 btn-text-ornate text-xs sm:text-sm flex items-center gap-1 cursor-pointer"
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

        {/* Expandable Ledger Grid */}
        <AnimatePresence>
          {showAllOccasions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-[#B8924A]/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pl-1">
                {HIJRI_OCCASIONS.map((occ) => {
                  const done = completedReadingIds.includes(occ.id);
                  return (
                    <button
                      key={occ.id}
                      type="button"
                      onClick={() => setSelectedOccasion(occ)}
                      className="text-right p-3 rounded-[4px] bg-[#F4EEDB]/75 hover:bg-[#EDE4CC] border border-[#B8924A]/30 transition-colors cursor-pointer flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-[#7A5E2A] tabular-nums flex items-center gap-1.5">
                          {renderOccasionMark(occ)}
                          <span>
                            {occ.day} {HIJRI_MONTH_NAMES[occ.month]}
                          </span>
                        </p>
                        <p className="font-display font-bold text-sm text-[#11271F] mt-0.5 line-clamp-2">
                          {occ.title}
                        </p>
                      </div>
                      {done && (
                        <CheckCircle2
                          className="w-4 h-4 text-[#1F6B50] shrink-0 mt-1"
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
            className="fixed inset-0 z-50 bg-[#081A14]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
            onClick={() => setSelectedOccasion(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl max-h-[92vh] overflow-y-auto manuscript-folio rounded-[8px] shadow-2xl"
            >
              <div className="bg-[#0F3D2E] border-b border-[#B8924A] p-5 text-[#FAF6EC] flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-[#D9B96A] tabular-nums flex items-center gap-1.5">
                    {renderOccasionMark(selectedOccasion)}
                    <span>
                      {selectedOccasion.day}{' '}
                      {HIJRI_MONTH_NAMES[selectedOccasion.month]} ·{' '}
                      {selectedOccasion.figureName}
                    </span>
                  </p>
                  <h3 className="font-calligraphy font-bold text-2xl sm:text-3xl mt-1 leading-snug text-[#FAF6EC]">
                    {selectedOccasion.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOccasion(null)}
                  aria-label="إغلاق النافذة"
                  className="w-9 h-9 rounded-[4px] border border-[#D9B96A]/45 text-[#FAF6EC] hover:bg-white/10 flex items-center justify-center cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                <div className="pr-3.5 border-r-2 border-[#1F6B50]">
                  <h4 className="font-display font-bold text-[#0F3D2E] flex items-center gap-2 text-base mb-1.5">
                    <StoriesLanternIcon className="w-4 h-4 text-[#B8924A]" />
                    <span>نبذة عن المناسبة</span>
                  </h4>
                  <p className="text-[#11271F] text-base sm:text-lg leading-relaxed">
                    {selectedOccasion.shortStory}
                  </p>
                </div>

                <ManuscriptDivider variant="flourish" />

                <div className="p-4 rounded-[6px] bg-[#F3ECDA]/85 border border-[#B8924A]/45">
                  <h4 className="font-display font-bold text-[#0F3D2E] flex items-center gap-2 text-base mb-1.5">
                    <DuaScrollIcon className="w-4 h-4 text-[#B8924A]" />
                    <span>دعاء ومناجاة بهذه المناسبة</span>
                  </h4>
                  <p className="font-arabic font-bold text-[#11271F] text-lg sm:text-xl leading-loose">
                    {selectedOccasion.shortDua}
                  </p>
                </div>

                {justRewardedId === selectedOccasion.id && (
                  <div className="rounded-[5px] bg-[#0F3D2E] text-[#FAF6EC] border border-[#D9B96A] p-3 text-center font-display font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
                    <span>بارك الله فيك! تم تسجيل قراءة المناسبة</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#B8924A]/25">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {selectedOccasion.linkedSection && (
                      <button
                        type="button"
                        onClick={() => {
                          const sec = selectedOccasion.linkedSection!;
                          const eid = selectedOccasion.linkedEntryId;
                          setSelectedOccasion(null);
                          onOpenLibraryEntry(sec, eid);
                        }}
                        className="min-h-[44px] px-5 py-2 btn-gilded text-sm flex items-center gap-2 cursor-pointer"
                      >
                        <span>
                          {selectedOccasion.linkedLabel || 'افتح الزيارة / الدعاء'}
                        </span>
                        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}

                    {completedReadingIds.includes(selectedOccasion.id) ? (
                      <span className="inline-flex items-center gap-1.5 text-[#1F6B50] font-bold text-sm">
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        <span>تمت القراءة</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMarkOccasionRead(selectedOccasion.id)}
                        className="min-h-[44px] px-4 py-2 btn-manuscript text-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
                        <span>أتممت القراءة</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOccasion(null)}
                    className="min-h-[44px] px-4 btn-text-ornate text-sm cursor-pointer"
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
