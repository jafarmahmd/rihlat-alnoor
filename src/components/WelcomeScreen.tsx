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
      className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-[#F4F1E8] via-[#F7F5EE] to-[#EFECE2] text-slate-900 flex flex-col justify-between"
    >
      <main className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-10">
        {/* Welcome Hero Card */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl sm:rounded-3xl bg-[#FDFCF9] text-slate-900 border border-[#E5E0D5] shadow-sm p-5 sm:p-10"
        >
          <div className="flex flex-col items-center text-center">
            {/* Official Logo */}
            <div className="w-full max-w-[240px] sm:max-w-[340px] rounded-2xl bg-white border border-[#EAE5D9] p-2">
              <img
                src={OFFICIAL_LOGO_URL}
                alt="الشعار الرسمي لتطبيق رحلة النور"
                className="w-full h-auto object-contain rounded-xl bg-white"
              />
            </div>

            <p className="mt-4 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#145344]">
              <ShieldCheck className="w-4 h-4 text-[#145344] shrink-0" aria-hidden="true" />
              <span>{APP_OVERVIEW.supervision}</span>
            </p>

            <h1 className="mt-2.5 font-display font-extrabold text-2xl sm:text-4xl text-[#143D32]">
              {APP_OVERVIEW.title}
            </h1>
            <p className="mt-1 font-display font-bold text-sm sm:text-lg text-[#7D602B]">
              {APP_OVERVIEW.subtitle}
            </p>

            {/* Primary CTA */}
            <div className="mt-5 sm:mt-6 w-full sm:w-auto flex items-center justify-center">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onEnterHome}
                className="w-full sm:w-auto min-h-[48px] sm:min-h-[54px] px-7 sm:px-10 py-3 rounded-2xl bg-[#145344] hover:bg-[#0F4236] text-white font-display font-bold text-base sm:text-lg shadow-sm flex items-center justify-center gap-2.5 cursor-pointer transition-colors"
              >
                <span>الدخول إلى التطبيق</span>
                <ArrowLeft className="w-5 h-5 text-[#E5D3A3]" aria-hidden="true" />
              </motion.button>
            </div>
          </div>

          {/* About App Section */}
          <div className="mt-7 rounded-2xl bg-[#F6F4EC] border border-[#E6DFCE] p-4 sm:p-6 text-right">
            <h2 className="font-display font-extrabold text-base sm:text-xl text-[#143D32]">
              {APP_OVERVIEW.aboutHeading}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-700 leading-relaxed">
              {APP_OVERVIEW.aboutBody}
            </p>
          </div>

          {/* Core Contents & Sections */}
          <div className="mt-6">
            <h2 className="font-display font-extrabold text-base sm:text-xl text-[#143D32] mb-3.5 text-right">
              {APP_OVERVIEW.sectionsHeading}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {APP_OVERVIEW.sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleCardAction(section)}
                  className="text-right rounded-2xl bg-white hover:bg-[#F5F7F5] border border-[#E5E0D5] hover:border-[#9EBDB2] p-4 transition-colors cursor-pointer group flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="w-10 h-10 rounded-xl bg-[#EFF5F2] border border-[#D4E2DA] group-hover:bg-[#145344] text-[#145344] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                        {renderSectionIcon(section.id)}
                      </span>
                      <ArrowLeft
                        className="w-4 h-4 text-[#145344] opacity-60 group-hover:opacity-100 group-hover:-translate-x-1 transition-all"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="font-display font-bold text-base sm:text-lg text-[#143D32]">
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
          <div className="mt-7 pt-5 border-t border-[#EAE5D9] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-display font-bold text-sm sm:text-base text-[#145344] text-center sm:text-right">
              {APP_OVERVIEW.closingLine}
            </p>

            <button
              type="button"
              onClick={onEnterHome}
              className="w-full sm:w-auto min-h-[46px] px-7 py-2.5 rounded-xl bg-[#EFF5F2] hover:bg-[#E2EFE8] text-[#145344] border border-[#CFE0D8] font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0"
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
