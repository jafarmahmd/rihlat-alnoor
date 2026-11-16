import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  BookHeart,
  BookOpen,
  CalendarDays,
  Gamepad2,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { OFFICIAL_LOGO_URL } from './RihlatLogo';
import { APP_OVERVIEW, AppOverviewSectionItem } from '../data/appOverview';
import { DigitalLibrarySection, ScreenView } from '../types/game';

interface WelcomeScreenProps {
  onEnterHome: () => void;
  onEnterScreen: (screen: ScreenView) => void;
  onEnterLibrarySection: (section: DigitalLibrarySection) => void;
}

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
  onEnterHome,
  onEnterScreen,
  onEnterLibrarySection,
}) => {
  const handleCardAction = (item: AppOverviewSectionItem) => {
    if (item.targetAction.type === 'library') {
      onEnterLibrarySection(item.targetAction.section);
    } else {
      onEnterScreen(item.targetAction.screen);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-[#04241E] via-[#06382E] to-[#041D18] text-white flex flex-col justify-between"
    >
      {/* Subtle Decorative Islamic Light Radiance */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(circle at 50% 10%, rgba(251, 191, 36, 0.16) 0%, transparent 48%), radial-gradient(circle at 15% 75%, rgba(20, 184, 166, 0.16) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(245, 158, 11, 0.12) 0%, transparent 45%)',
        }}
      />

      <main className="relative z-10 max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-12">
        {/* Welcome Hero Card */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl bg-white/97 text-slate-900 border-2 border-amber-300/70 shadow-2xl shadow-black/40 p-4 sm:p-10"
        >
          <div className="flex flex-col items-center text-center">
            {/* Official Logo Unaltered */}
            <div className="w-full max-w-[260px] sm:max-w-[370px] rounded-2xl bg-white border border-slate-100 shadow-sm p-2">
              <img
                src={OFFICIAL_LOGO_URL}
                alt="الشعار الرسمي لتطبيق رحلة النور"
                className="w-full h-auto object-contain rounded-xl bg-white"
              />
            </div>

            <div className="mt-4 sm:mt-5 inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-extrabold">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>{APP_OVERVIEW.supervision}</span>
            </div>

            <h1 className="mt-3.5 sm:mt-4 font-display font-black text-2xl sm:text-4xl text-emerald-950">
              {APP_OVERVIEW.title}
            </h1>
            <p className="mt-1 font-display font-extrabold text-sm sm:text-xl text-amber-700">
              {APP_OVERVIEW.subtitle}
            </p>

            {/* Primary CTA */}
            <div className="mt-5 sm:mt-6 w-full sm:w-auto flex flex-wrap items-center justify-center gap-3">
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onEnterHome}
                className="w-full sm:w-auto min-h-[52px] sm:min-h-[56px] px-7 sm:px-10 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-l from-emerald-700 via-emerald-600 to-teal-600 hover:from-emerald-800 hover:to-teal-700 text-white font-display font-black text-lg sm:text-xl shadow-xl shadow-emerald-900/25 border-2 border-amber-300 flex items-center justify-center gap-3 cursor-pointer transition-colors"
              >
                <span>الدخول إلى التطبيق</span>
                <ArrowLeft className="w-5 h-5 text-amber-200" aria-hidden="true" />
              </motion.button>
            </div>
          </div>

          {/* About App Section */}
          <div className="mt-8 rounded-2xl bg-gradient-to-l from-emerald-50/90 via-white to-amber-50/70 border border-emerald-200 p-5 sm:p-6 text-right">
            <h2 className="font-display font-black text-lg sm:text-xl text-emerald-950">
              {APP_OVERVIEW.aboutHeading}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
              {APP_OVERVIEW.aboutBody}
            </p>
          </div>

          {/* Core Contents & Sections */}
          <div className="mt-7">
            <h2 className="font-display font-black text-lg sm:text-xl text-emerald-950 mb-4 text-right">
              {APP_OVERVIEW.sectionsHeading}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {APP_OVERVIEW.sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleCardAction(section)}
                  className="text-right rounded-2xl bg-slate-50/85 hover:bg-emerald-50/70 border border-emerald-100 hover:border-emerald-400 p-4 transition-all cursor-pointer group flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="w-10 h-10 rounded-xl bg-emerald-100 group-hover:bg-emerald-600 text-emerald-800 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                        {renderSectionIcon(section.id)}
                      </span>
                      <ArrowLeft
                        className="w-4 h-4 text-emerald-600 opacity-70 group-hover:opacity-100 group-hover:-translate-x-1 transition-all"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="font-display font-black text-base sm:text-lg text-emerald-950">
                      {section.title}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {section.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Closing Tagline + Bottom Enter Button */}
          <div className="mt-7 pt-5 border-t border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-display font-extrabold text-sm sm:text-base text-emerald-900 text-center sm:text-right">
              {APP_OVERVIEW.closingLine}
            </p>

            <button
              type="button"
              onClick={onEnterHome}
              className="w-full sm:w-auto min-h-[48px] px-7 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-display font-black text-base shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0"
            >
              <span>ابدأ رحلة النور</span>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </motion.section>
      </main>
    </div>
  );
};
