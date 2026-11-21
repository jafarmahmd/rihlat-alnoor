import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, UserCheck, X } from 'lucide-react';
import { OFFICIAL_LOGO_URL } from './RihlatLogo';
import { APP_OVERVIEW, AppOverviewSectionItem } from '../data/appOverview';
import { DigitalLibrarySection, ScreenView } from '../types/game';
import {
  CalendarArchIcon,
  DuaScrollIcon,
  ManuscriptCornerBracket,
  ManuscriptDivider,
  QuranBookIcon,
  ShrineDomeIcon,
  StoriesLanternIcon,
  TasbihBeadsIcon,
} from './IslamicOrnaments';

interface WelcomeScreenProps {
  needsProfile: boolean;
  initialName: string;
  initialAge: number | null;
  onSaveProfile: (name: string, age: number | null) => void;
  onEnterHome: () => void;
  onEnterScreen: (screen: ScreenView) => void;
  onEnterLibrarySection: (section: DigitalLibrarySection) => void;
}

function renderSectionIcon(id: string) {
  switch (id) {
    case 'quran':
      return <QuranBookIcon className="w-5 h-5" />;
    case 'adiyat':
      return <DuaScrollIcon className="w-5 h-5" />;
    case 'sahifa':
      return <ShrineDomeIcon className="w-5 h-5" />;
    case 'stories-games':
      return <StoriesLanternIcon className="w-5 h-5" />;
    case 'tasbih':
      return <TasbihBeadsIcon className="w-5 h-5" />;
    case 'calendar':
    default:
      return <CalendarArchIcon className="w-5 h-5" />;
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
      className="min-h-screen relative overflow-x-hidden noor-canvas text-[#11271F] flex flex-col justify-between"
    >
      <div className="fixed inset-0 pointer-events-none noor-pattern" aria-hidden="true" />
      <div className="fixed inset-0 pointer-events-none paper-grain" aria-hidden="true" />

      <main className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="relative manuscript-folio rounded-[8px] overflow-hidden"
        >
          {/* Illuminated Frontispiece Arch Header (Gilded Sarlawh) */}
          <header className="relative bg-[#0F3D2E] text-[#FAF6EC] px-6 sm:px-12 pt-8 sm:pt-11 pb-9 sm:pb-12 overflow-hidden border-b-2 border-[#B8924A]">
            {/* Subtle 6% geometric pattern overlay */}
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.07]"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern
                  id="sarlawh-lattice"
                  width="80"
                  height="80"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M40 8 L48 32 L72 40 L48 48 L40 72 L32 48 L8 40 L32 32 Z"
                    fill="none"
                    stroke="#D9B96A"
                    strokeWidth="0.9"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="11"
                    fill="none"
                    stroke="#D9B96A"
                    strokeWidth="0.7"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#sarlawh-lattice)" />
            </svg>

            <ManuscriptCornerBracket position="top-right" color="#D9B96A" className="absolute top-3 right-3" />
            <ManuscriptCornerBracket position="top-left" color="#D9B96A" className="absolute top-3 left-3" />
            <ManuscriptCornerBracket position="bottom-right" color="#D9B96A" className="absolute bottom-3 right-3" />
            <ManuscriptCornerBracket position="bottom-left" color="#D9B96A" className="absolute bottom-3 left-3" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-end justify-between gap-7 max-w-4xl mx-auto">
              {/* Right Side: Basmalah, Calligraphic Title & Attribution */}
              <div className="flex-1 text-center lg:text-right">
                <p className="font-calligraphy text-xl sm:text-2xl text-[#D9B96A] tracking-wide mb-3">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>

                <p className="text-xs sm:text-sm font-medium text-[#CFE0D8] mb-2">
                  {APP_OVERVIEW.supervision}
                </p>

                <h1 className="font-calligraphy font-bold text-4xl sm:text-5xl lg:text-6xl gold-foil-light-text leading-tight">
                  رحلة النور
                </h1>

                <p className="mt-2 font-display text-sm sm:text-lg text-[#FAF6EC]/90 max-w-xl mx-auto lg:mx-0">
                  {APP_OVERVIEW.subtitle}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <button
                    type="button"
                    onClick={() => attemptEntry(onEnterHome)}
                    className="w-full sm:w-auto min-h-[50px] px-8 py-3 btn-gilded text-base sm:text-lg flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <span>الدخول إلى التطبيق</span>
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Left Side: Framed Emblem */}
              <div className="shrink-0">
                <div className="relative p-1.5 bg-[#0A291F] border border-[#D9B96A]/70 rounded-[6px] shadow-xl">
                  <div className="w-[180px] sm:w-[225px] bg-[#FAF6EC] p-2 rounded-[4px]">
                    <img
                      src={OFFICIAL_LOGO_URL}
                      alt="الشعار الرسمي لتطبيق رحلة النور"
                      className="w-full h-auto object-contain rounded-[3px] bg-white block"
                    />
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Manuscript Preface & Asymmetric Chapter Index */}
          <div className="p-6 sm:p-10 space-y-8">
            {/* Editorial Preface */}
            <section
              aria-label="توطئة عن التطبيق"
              className="pr-4 sm:pr-6 border-r-2 border-[#B8924A] max-w-3xl"
            >
              <h2 className="font-display font-bold text-base sm:text-lg text-[#0F3D2E] mb-1.5">
                مقدمة المخطوطة الرقمية
              </h2>
              <p className="text-sm sm:text-base text-[#11271F]/85 leading-relaxed">
                {APP_OVERVIEW.aboutBody}
              </p>
            </section>

            <ManuscriptDivider variant="rosette" />

            {/* Asymmetric Manuscript Index (Zero uniform cards, zero corner numbers, zero repeated footers) */}
            <section aria-label="فهرس الأبواب والأقسام">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-5">
                <h2 className="font-calligraphy font-bold text-2xl sm:text-3xl text-[#0F3D2E]">
                  أبواب «رحلة النور»
                </h2>
                <p className="text-xs sm:text-sm text-[#425B51]">
                  اختر أي باب للاطلاع على محتواه والدخول إليه مباشرة
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 border-t border-[#B8924A]/30">
                {APP_OVERVIEW.sections.map((section, idx) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setPendingSection(section)}
                    className={`group text-right py-4 sm:py-5 px-2 border-b border-[#B8924A]/25 hover:bg-[#F3ECDA]/60 transition-colors cursor-pointer flex items-start justify-between gap-4 ${
                      idx === 0 ? 'md:col-span-2 bg-[#F4EEDB]/45 px-4' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <span className="mt-0.5 text-[#B8924A] group-hover:text-[#0F3D2E] transition-colors shrink-0">
                        {renderSectionIcon(section.id)}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-base sm:text-lg text-[#0F3D2E] group-hover:text-[#1F6B50] transition-colors">
                          {section.title}
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-[#425B51] leading-relaxed">
                          {section.description}
                        </p>
                      </div>
                    </div>

                    <ArrowLeft
                      className="w-4 h-4 mt-1.5 text-[#B8924A] opacity-65 group-hover:opacity-100 group-hover:-translate-x-1 transition-all shrink-0"
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </section>

            {/* Colophon Footer */}
            <footer className="pt-4 border-t border-[#B8924A]/35 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="font-arabic text-base sm:text-lg text-[#0F3D2E] text-center sm:text-right">
                {APP_OVERVIEW.closingLine}
              </p>

              <button
                type="button"
                onClick={() => attemptEntry(onEnterHome)}
                className="w-full sm:w-auto min-h-[46px] px-7 py-2.5 btn-emerald text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>الدخول إلى الصفحة الرئيسية</span>
                <ArrowLeft className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
              </button>
            </footer>
          </div>
        </motion.article>
      </main>

      {/* Confirmation Dialog for Direct Section Entry */}
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
            className="fixed inset-0 z-50 bg-[#081A14]/65 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setPendingSection(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md manuscript-folio rounded-[8px] shadow-2xl p-5 sm:p-6 text-right"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-[5px] bg-[#0F3D2E] text-[#D9B96A] flex items-center justify-center shrink-0">
                    {renderSectionIcon(pendingSection.id)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#7A5E2A]">
                      الانتقال المباشر
                    </p>
                    <h3
                      id="confirm-section-title"
                      className="font-display font-bold text-lg text-[#0F3D2E] truncate"
                    >
                      {pendingSection.title}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPendingSection(null)}
                  aria-label="إغلاق الرسالة"
                  className="min-w-[38px] min-h-[38px] rounded-[5px] border border-[#B8924A]/40 text-[#425B51] hover:bg-[#F3ECDA] flex items-center justify-center cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <p className="mt-4 text-sm text-[#11271F]/85 leading-relaxed">
                هل ترغب بفتح باب{' '}
                <strong className="text-[#0F3D2E]">{pendingSection.title}</strong> مباشرة؟
              </p>

              <div className="mt-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPendingSection(null)}
                  className="min-h-[44px] px-5 py-2 btn-manuscript text-sm cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDirectEntry}
                  className="min-h-[44px] px-6 py-2 btn-emerald text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>تأكيد الدخول</span>
                  <ArrowLeft className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Prompt Dialog */}
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
            className="fixed inset-0 z-50 bg-[#081A14]/65 backdrop-blur-xs flex items-center justify-center p-4"
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
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onSubmit={handleProfileSubmit}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md manuscript-folio rounded-[8px] shadow-2xl p-5 sm:p-6 text-right"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-[5px] bg-[#0F3D2E] text-[#D9B96A] flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#7A5E2A]">
                      بطاقة الزائر في رحلة النور
                    </p>
                    <h3
                      id="welcome-profile-title"
                      className="font-display font-bold text-lg sm:text-xl text-[#0F3D2E]"
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
                  className="min-w-[38px] min-h-[38px] rounded-[5px] border border-[#B8924A]/40 text-[#425B51] hover:bg-[#F3ECDA] flex items-center justify-center cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <p className="mt-3 text-sm text-[#425B51] leading-relaxed">
                يرجى تدوين اسمك وعمرك للمتابعة والدخول إلى المنصة.
              </p>

              <div className="mt-4 space-y-3.5">
                <div>
                  <label
                    htmlFor="welcome-user-name"
                    className="block text-xs font-bold text-[#0F3D2E] mb-1.5"
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
                    className="w-full min-h-[46px] px-4 rounded-[5px] border border-[#B8924A]/55 bg-white focus:border-[#0F3D2E] focus:outline-none font-bold text-base text-[#11271F]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="welcome-user-age"
                    className="block text-xs font-bold text-[#0F3D2E] mb-1.5"
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
                    className="w-full min-h-[46px] px-4 rounded-[5px] border border-[#B8924A]/55 bg-white focus:border-[#0F3D2E] focus:outline-none font-bold text-base text-[#11271F]"
                  />
                </div>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="mt-3 text-xs font-bold text-[#7A2020] bg-[#FDF2F2] border border-[#D48C8C] rounded-[4px] px-3.5 py-2"
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
                  className="min-h-[44px] px-5 py-2 btn-manuscript text-sm cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="min-h-[46px] px-6 py-2.5 btn-gilded text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>متابعة والدخول</span>
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
