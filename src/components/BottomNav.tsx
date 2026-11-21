import React from 'react';
import { DigitalLibrarySection, ScreenView } from '../types/game';
import {
  DuaScrollIcon,
  HomeArchIcon,
  JourneyCompassIcon,
  QuranBookIcon,
  TasbihBeadsIcon,
} from './IslamicOrnaments';

interface BottomNavProps {
  currentScreen: ScreenView;
  activeLibrarySection: DigitalLibrarySection;
  onNavigateScreen: (screen: ScreenView) => void;
  onOpenLibrarySection: (section: DigitalLibrarySection) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  activeLibrarySection,
  onNavigateScreen,
  onOpenLibrarySection,
}) => {
  const items = [
    {
      id: 'home',
      label: 'الرئيسية',
      active: currentScreen === 'home',
      icon: HomeArchIcon,
      onClick: () => onNavigateScreen('home'),
    },
    {
      id: 'quran',
      label: 'القرآن',
      active: currentScreen === 'digital-library' && activeLibrarySection === 'quran',
      icon: QuranBookIcon,
      onClick: () => onOpenLibrarySection('quran'),
    },
    {
      id: 'duas',
      label: 'الأدعية',
      active:
        currentScreen === 'duas' ||
        currentScreen === 'munajat' ||
        (currentScreen === 'digital-library' && activeLibrarySection !== 'quran'),
      icon: DuaScrollIcon,
      onClick: () => onOpenLibrarySection('adiyat'),
    },
    {
      id: 'tasbih',
      label: 'المسبحة',
      active: currentScreen === 'tasbih',
      icon: TasbihBeadsIcon,
      onClick: () => onNavigateScreen('tasbih'),
    },
    {
      id: 'map',
      label: 'الرحلة',
      active:
        currentScreen === 'map' ||
        currentScreen === 'station' ||
        currentScreen === 'library' ||
        currentScreen === 'store' ||
        currentScreen === 'calendar',
      icon: JourneyCompassIcon,
      onClick: () => onNavigateScreen('map'),
    },
  ];

  return (
    <nav
      aria-label="التنقل السريع بالهاتف"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="pointer-events-auto relative mx-auto max-w-lg bg-[#0F3D2E]/96 backdrop-blur-md border-t border-[#B8924A]/55 shadow-[0_-6px_24px_rgba(15,61,46,0.22)]">
        {/* Subtle Illuminated Top Hairline Crest */}
        <div
          className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-24 h-[3px]"
          style={{
            background: 'linear-gradient(90deg, transparent, #D9B96A, transparent)',
          }}
          aria-hidden="true"
        />

        <div className="grid grid-cols-5 items-stretch px-1.5 py-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                aria-current={item.active ? 'page' : undefined}
                className={`relative min-h-[48px] flex flex-col items-center justify-center gap-0.5 px-1 py-1 cursor-pointer transition-colors ${
                  item.active
                    ? 'text-[#D9B96A]'
                    : 'text-[#FAF6EC]/78 hover:text-[#FAF6EC]'
                }`}
              >
                {item.active && (
                  <span
                    className="absolute top-0 inset-x-3 h-[2px] bg-[#D9B96A]"
                    aria-hidden="true"
                  />
                )}
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[11px] font-medium leading-none tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
