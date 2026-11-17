import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  BookHeart,
  BookOpen,
  CalendarDays,
  Gamepad2,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { OFFICIAL_LOGO_URL } from './RihlatLogo';
import { APP_OVERVIEW, AppOverviewSectionItem } from '../data/appOverview';
import { DigitalLibrarySection, ScreenView } from '../types/game';

interface WelcomeScreenProps {
  needsProfile: boolean;
  initialName: string;
  initialAge: number | null;
  onSaveProfile: (name: string, age: number | null) => void;
  onEnterHome: () => void;
  onEnterScreen: (screen: ScreenView) => void;
  onEnterLibrarySection: (section: DigitalLibrarySection) => void;
}

const ARABIC_ORDINAL_NUMBERS = ['٠١', '٠٢', '٠٣', '٠٤', '٠٥', '٠٦'];

function renderSectionIcon(id: string) {
  switch (id) {
    case 'quran':
      return <BookOpen className="w-5 h-5" aria-hidden="true" />;
    case 'adiyat':
      return <BookHeart className="w-5 h-5" aria-hidden="true" />;
    case 'sahifa':
      return <ScrollText className="w-5 h-5" aria-hidden="true" />;
    case 'stories-games':
      return <Gamepad2 className="w-5 h-5" aria-hidden="true" />;
    case 'tasbih':
      return <Sparkles className="w-5 h-5" aria-hidden="true" />;
    case 'calendar':
    default:
      return <CalendarDays className="w-5 h-5" aria-hidden="true" />;
  }
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  needsProfile,
  initialName,
  initialAge,
  onSaveProfile,
  onEnterHome,
  onEnterScreen,
  onEnterLibrarySection,
}) => {
  const [pendingSection, setPendingSection] =
    useState<AppOverviewSectionItem | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [pendingDestination, setPendingDestination] = useState<
    (() => void) | null
  >(null);

  const [nameInput, setNameInput] = useState(initialName);
  const [ageInput, setAgeInput] = useState(
    initialAge != null ? String(initialAge) : ''
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setNameInput(initialName);
    setAgeInput(initialAge != null ? String(initialAge) : '');
  }, [initialName, initialAge]);

  useEffect(() => {
    if (!pendingSection && !profileModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (profileModalOpen) {
          setProfileModalOpen(false);
          setPendingDestination(null);
          setFormError(null);
        } else if (pendingSection) {
          setPendingSection(null);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pendingSection, profileModalOpen]);

  const attemptEntry = (destination: () => void) => {
    if (needsProfile) {
      setPendingDestination(() => destination);
      setFormError(null);
      setProfileModalOpen(true);
    } else {
      destination();
    }
  };

  const handleConfirmDirectEntry = () => {
    if (!pendingSection) return;
    const target = pendingSection.targetAction;
    setPendingSection(null);
    attemptEntry(() => {
      if (target.type === 'library') {
        onEnterLibrarySection(target.section);
      } else {
        onEnterScreen(target.screen);
      }
    });
  };

  const normalizeDigits = (val: string) =>
    val
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = nameInput.trim();
    const cleanedAge = normalizeDigits(ageInput.trim());
    const parsedAge = Number(cleanedAge);

    if (trimmedName.length < 2) {
      setFormError('يرجى كتابة اسمك الكريم (حرفان على الأقل).');
      return;
    }
    if (
      cleanedAge === '' ||
      !Number.isFinite(parsedAge) ||
      parsedAge < 4 ||
      parsedAge > 120
    ) {
      setFormError('يرجى كتابة عمرك بشكل صحيح (من ٤ إلى ١٢٠ سنة).');
      return;
    }

    setFormError(null);
    onSaveProfile(trimmedName, Math.round(parsedAge));
    setProfileModalOpen(false);
    const go = pendingDestination;
    setPendingDestination(null);
    if (go) {
      go();
    } else {
      onEnterHome();
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen relative overflow-x-hidden bg-[#F4F1E8] text-slate-900 flex flex-col justify-between"
    >
      {/* Subtle Illuminated Architectural Ambient Layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(20, 83, 68, 0.09) 0%, transparent 55%), radial-gradient(circle at 12% 85%, rgba(196, 164, 98, 0.1) 0%, transparent 45%), radial-gradient(circle at 88% 75%, rgba(20, 83, 68, 0.06) 0%, transparent 45%)',
        }}
      />

      <main className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-9">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl overflow-hidden bg-[#FDFCF9] border border-[#DDD4BE] shadow-lg shadow-[#143D32]/8"
        >
          {/* 1. Distinct Illuminated Mihrab Arch Header */}
          <header className="relative bg-gradient-to-b from-[#0E392E] via-[#13473A] to-[#175445] text-white px-5 sm:px-10 pt-7 sm:pt-10 pb-8 sm:pb-11 overflow-hidden">
            {/* Delicate Islamic Geometric Star & Arch SVG Lattice */}
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 w-full h-full opacity-20"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern
                  id="mihrab-lattice"
                  width="72"
                  height="72"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M36 6 L43 29 L66 36 L43 43 L36 66 L29 43 L6 36 L29 29 Z"
                    fill="none"
                    stroke="#E5D3A3"
                    strokeWidth="0.7"
                  />
                  <circle
                    cx="36"
                    cy="36"
                    r="8"
                    fill="none"
                    stroke="#E5D3A3"
                    strokeWidth="0.6"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mihrab-lattice)" />
            </svg>

            {/* Subtle Top Gold Arch Glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[360px] sm:w-[540px] h-[220px] rounded-full bg-[#E5D3A3]/12 blur-3xl"
            />

            <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
              {/* Basmalah Calligraphic Opening */}
              <p className="font-arabic text-lg sm:text-2xl text-[#E9D8AA] tracking-wide mb-4 sm:mb-5">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>

              {/* Framed Official Emblem inside Arch-Inspired Crest */}
              <div className="p-1.5 sm:p-2 rounded-[26px] bg-gradient-to-b from-[#E5D3A3]/55 via-[#C4A462]/25 to-[#E5D3A3]/45 shadow-xl shadow-black/25">
                <div className="w-[210px] sm:w-[290px] rounded-[20px] bg-white p-2 sm:p-2.5">
                  <img
                    src={OFFICIAL_LOGO_URL}
                    alt="الشعار الرسمي لتطبيق رحلة النور"
                    className="w-full h-auto object-contain rounded-xl bg-white"
                  />
                </div>
              </div>

              {/* Quiet Unboxed Supervision Attribution */}
              <p className="mt-4 sm:mt-5 inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-[#D6E7DF]">
                <ShieldCheck
                  className="w-4 h-4 text-[#E5D3A3] shrink-0"
                  aria-hidden="true"
                />
                <span>{APP_OVERVIEW.supervision}</span>
              </p>

              <h1 className="mt-2.5 font-display font-extrabold text-2xl sm:text-4xl text-white leading-tight">
                تطبيق «رحلة النور»
              </h1>
              <p className="mt-1.5 font-display font-medium text-sm sm:text-lg text-[#E9D8AA]">
                {APP_OVERVIEW.subtitle}
              </p>

              {/* Primary Entry Action */}
              <div className="mt-6 w-full sm:w-auto flex justify-center">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => attemptEntry(onEnterHome)}
                  className="w-full sm:w-auto min-h-[50px] sm:min-h-[54px] px-8 sm:px-11 py-3 rounded-2xl bg-[#EFE2BE] hover:bg-[#F7ECD0] text-[#0E392E] font-display font-extrabold text-base sm:text-lg shadow-lg shadow-black/20 flex items-center justify-center gap-2.5 cursor-pointer transition-colors"
                >
                  <span>الدخول إلى التطبيق</span>
                  <ArrowLeft className="w-5 h-5 text-[#0E392E]" aria-hidden="true" />
                </motion.button>
              </div>
            </div>
          </header>

          {/* Subtle Ornamental Arch Divider */}
          <div className="h-1.5 bg-gradient-to-l from-[#DFD4B8] via-[#C6A868] to-[#DFD4B8]" />

          {/* 2. Manuscript Preface & Preview-Only Index Body */}
          <div className="p-5 sm:p-9 space-y-7 sm:space-y-8">
            {/* Editorial About Block */}
            <section
              aria-label="نبذة عن التطبيق"
              className="rounded-2xl bg-[#F7F4EB] border border-[#E6DEC9] p-5 sm:p-6 text-center sm:text-right"
            >
              <h2 className="font-display font-bold text-base sm:text-lg text-[#143D32] mb-2">
                نبذة عن التطبيق
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-3xl">
                {APP_OVERVIEW.aboutBody}
              </p>
            </section>

            {/* Preview-Only Sections Grid (Click prompts confirmation before direct entry) */}
            <section aria-label="المحتويات والأقسام الأساسية">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1.5 mb-4">
                <div>
                  <h2 className="font-display font-bold text-lg sm:text-xl text-[#143D32]">
                    المحتويات والأقسام الأساسية
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                    فهرس تعريفي للاطلاع على أقسام المنصة · اضغط على أي قسم إذا رغبت بالدخول إليه مباشرة
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {APP_OVERVIEW.sections.map((section, idx) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setPendingSection(section)}
                    className="text-right rounded-2xl bg-white hover:bg-[#F7F5EE] border border-[#E5DEC9] hover:border-[#9EBDB2] p-4 sm:p-5 transition-colors cursor-pointer group flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="w-10 h-11 rounded-t-full rounded-b-xl bg-[#EFF5F2] border border-[#D4E2DA] group-hover:bg-[#145344] text-[#145344] group-hover:text-[#F5EFE0] flex items-center justify-center transition-colors shrink-0">
                          {renderSectionIcon(section.id)}
                        </span>
                        <span className="font-arabic text-base font-bold text-[#9A7B3E] tabular-nums">
                          {ARABIC_ORDINAL_NUMBERS[idx] ?? idx + 1}
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-base sm:text-lg text-[#143D32]">
                        {section.title}
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {section.description}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-[#F0ECE1] flex items-center justify-between text-xs font-semibold text-stone-500 group-hover:text-[#145344] transition-colors">
                      <span>للاطلاع والدخول</span>
                      <ArrowLeft
                        className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:-translate-x-0.5 transition-all"
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Closing Verse / Footer Line */}
            <footer className="pt-5 border-t border-[#E8E2D4] flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="font-display font-bold text-sm sm:text-base text-[#145344] text-center sm:text-right">
                {APP_OVERVIEW.closingLine}
              </p>

              <button
                type="button"
                onClick={() => attemptEntry(onEnterHome)}
                className="w-full sm:w-auto min-h-[46px] px-7 py-2.5 rounded-xl bg-[#145344] hover:bg-[#0F4236] text-white font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0"
              >
                <span>الدخول إلى الصفحة الرئيسية</span>
                <ArrowLeft className="w-4 h-4 text-[#E5D3A3]" aria-hidden="true" />
              </button>
            </footer>
          </div>
        </motion.article>
      </main>

      {/* Short Confirmation Dialog for Direct Section Entry */}
      <AnimatePresence>
        {pendingSection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-section-title"
            className="fixed inset-0 z-50 bg-[#0A221C]/55 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setPendingSection(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-[#FDFCF9] border border-[#DDD4BE] shadow-2xl p-5 sm:p-6 text-right"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-t-full rounded-b-xl bg-[#EFF5F2] border border-[#D4E2DA] text-[#145344] flex items-center justify-center shrink-0">
                    {renderSectionIcon(pendingSection.id)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#7D602B]">
                      تأكيد الدخول المباشر
                    </p>
                    <h3
                      id="confirm-section-title"
                      className="font-display font-bold text-lg text-[#143D32] truncate"
                    >
                      {pendingSection.title}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPendingSection(null)}
                  aria-label="إغلاق الرسالة"
                  className="min-w-[40px] min-h-[40px] rounded-xl bg-[#F4F1E8] hover:bg-[#EAE5D8] text-stone-600 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <p className="mt-3.5 text-sm text-slate-700 leading-relaxed">
                هل ترغب بالانتقال مباشرة إلى قسم{' '}
                <strong className="text-[#143D32]">{pendingSection.title}</strong>؟
              </p>

              <div className="mt-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPendingSection(null)}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#F4F1E8] hover:bg-[#EAE4D5] text-stone-700 border border-[#E0D9C6] font-display font-bold text-sm cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDirectEntry}
                  className="min-h-[44px] px-6 py-2 rounded-xl bg-[#145344] hover:bg-[#0F4236] text-white font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>تأكيد الدخول</span>
                  <ArrowLeft className="w-4 h-4 text-[#E5D3A3]" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name & Age Prompt Dialog on Entering the App */}
      <AnimatePresence>
        {profileModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-profile-title"
            className="fixed inset-0 z-50 bg-[#0A221C]/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => {
              setProfileModalOpen(false);
              setPendingDestination(null);
              setFormError(null);
            }}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleProfileSubmit}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-[#FDFCF9] border border-[#DDD4BE] shadow-2xl p-5 sm:p-6 text-right"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-t-full rounded-b-xl bg-[#145344] text-[#EFE2BE] flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#7D602B]">
                      التعريف السريع قبل الدخول
                    </p>
                    <h3
                      id="welcome-profile-title"
                      className="font-display font-bold text-lg sm:text-xl text-[#143D32]"
                    >
                      أهلاً بك في رحلة النور
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProfileModalOpen(false);
                    setPendingDestination(null);
                    setFormError(null);
                  }}
                  aria-label="إغلاق"
                  className="min-w-[40px] min-h-[40px] rounded-xl bg-[#F4F1E8] hover:bg-[#EAE5D8] text-stone-600 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                يرجى كتابة اسمك وعمرك للمتابعة والدخول إلى التطبيق.
              </p>

              <div className="mt-4 space-y-3.5">
                <div>
                  <label
                    htmlFor="welcome-user-name"
                    className="block text-xs font-bold text-[#145344] mb-1.5"
                  >
                    الاسم
                  </label>
                  <input
                    id="welcome-user-name"
                    type="text"
                    maxLength={24}
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="اكتب اسمك الكريم..."
                    autoFocus
                    className="w-full min-h-[48px] px-4 rounded-xl border border-[#D4E2DA] bg-white focus:border-[#145344] focus:outline-none font-bold text-base text-[#143D32]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="welcome-user-age"
                    className="block text-xs font-bold text-[#145344] mb-1.5"
                  >
                    العمر (بالسنوات)
                  </label>
                  <input
                    id="welcome-user-age"
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    value={ageInput}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setAgeInput(raw.replace(/[^0-9٠-٩۰-۹]/g, ''));
                      if (formError) setFormError(null);
                    }}
                    placeholder="اكتب عمرك بالأرقام (مثال: 15)..."
                    className="w-full min-h-[48px] px-4 rounded-xl border border-[#D4E2DA] bg-white focus:border-[#145344] focus:outline-none font-bold text-base text-[#143D32]"
                  />
                </div>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="mt-3 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2"
                >
                  {formError}
                </p>
              )}

              <div className="mt-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setProfileModalOpen(false);
                    setPendingDestination(null);
                    setFormError(null);
                  }}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#F4F1E8] hover:bg-[#EAE4D5] text-stone-700 border border-[#E0D9C6] font-display font-bold text-sm cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#145344] hover:bg-[#0F4236] text-white font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>متابعة والدخول</span>
                  <ArrowLeft className="w-4 h-4 text-[#E5D3A3]" aria-hidden="true" />
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
