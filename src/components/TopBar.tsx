import React, { useEffect, useState } from 'react';
import {
  Star,
  Volume2,
  VolumeX,
  User,
  Crown,
  Pencil,
  Menu,
  X,
  Bell,
  Sun,
  Moon,
} from 'lucide-react';
import {
  AppAppearanceSettings,
  loadAppAppearanceSettings,
  saveAppAppearanceSettings,
  subscribeAppAppearance,
} from '../utils/appAppearance';
import { RihlatLogo } from './RihlatLogo';
import { SpiritualNotificationsModal } from './SpiritualNotificationsModal';
import { AstrolabeIcon, MinaretAdhanIcon } from './IslamicOrnaments';
import { DigitalLibrarySection, ScreenView } from '../types/game';
import { TOTAL_POSSIBLE_STARS } from '../data/stations';
import { STORE_ITEMS } from '../data/storeItems';

interface TopBarProps {
  currentScreen: ScreenView;
  activeLibrarySection: DigitalLibrarySection;
  availableStars: number;
  childName: string;
  userAge: number | null;
  activeTitleId: string | null;
  activeFrameId: string | null;
  muted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onNavigateHome: () => void;
  onNavigateScreen: (screen: ScreenView) => void;
  onOpenLibrarySection: (section: DigitalLibrarySection, entryId?: string) => void;
  onUpdateProfile: (name: string, age: number | null) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentScreen,
  activeLibrarySection,
  availableStars,
  childName,
  userAge,
  activeTitleId,
  activeFrameId,
  muted,
  onToggleMute,
  onOpenSettings,
  onNavigateHome,
  onNavigateScreen,
  onOpenLibrarySection,
  onUpdateProfile,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(childName);
  const [draftAge, setDraftAge] = useState(userAge ? String(userAge) : '');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [appearance, setAppearance] = useState<AppAppearanceSettings>(
    loadAppAppearanceSettings
  );

  useEffect(() => {
    return subscribeAppAppearance(setAppearance);
  }, []);

  const toggleColorTheme = () => {
    const next: AppAppearanceSettings = {
      ...appearance,
      colorTheme: appearance.colorTheme === 'night' ? 'morning' : 'night',
    };
    setAppearance(next);
    saveAppAppearanceSettings(next);
  };

  const activeTitle = activeTitleId
    ? STORE_ITEMS.find((i) => i.id === activeTitleId)?.name
    : null;
  const hasGoldFrame = activeFrameId === 'theme-gold-frame';

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draftName.trim();
    const cleanedAge = draftAge
      .trim()
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
    const parsedAge = Number(cleanedAge);
    const validAge =
      cleanedAge !== '' &&
      Number.isFinite(parsedAge) &&
      parsedAge >= 4 &&
      parsedAge <= 120
        ? Math.round(parsedAge)
        : userAge;
    if (trimmed) {
      onUpdateProfile(trimmed, validAge);
    }
    setEditingName(false);
  };

  const navItems: {
    id: string;
    label: string;
    active: boolean;
    onClick: () => void;
  }[] = [
    {
      id: 'home',
      label: 'الرئيسية',
      active: currentScreen === 'home',
      onClick: onNavigateHome,
    },
    {
      id: 'quran',
      label: 'القرآن الكريم',
      active:
        currentScreen === 'digital-library' && activeLibrarySection === 'quran',
      onClick: () => onOpenLibrarySection('quran'),
    },
    {
      id: 'adiyat',
      label: 'الأدعية',
      active:
        currentScreen === 'duas' ||
        (currentScreen === 'digital-library' && activeLibrarySection === 'adiyat'),
      onClick: () => onOpenLibrarySection('adiyat'),
    },
    {
      id: 'sahifa',
      label: 'الصحيفة',
      active:
        currentScreen === 'digital-library' && activeLibrarySection === 'sahifa',
      onClick: () => onOpenLibrarySection('sahifa'),
    },
    {
      id: 'ziyarat',
      label: 'الزيارات',
      active:
        currentScreen === 'digital-library' && activeLibrarySection === 'ziyarat',
      onClick: () => onOpenLibrarySection('ziyarat'),
    },
    {
      id: 'munajat',
      label: 'المناجاة',
      active:
        currentScreen === 'munajat' ||
        (currentScreen === 'digital-library' && activeLibrarySection === 'munajat'),
      onClick: () => onOpenLibrarySection('munajat'),
    },
    {
      id: 'tasbih',
      label: 'المسبحة',
      active: currentScreen === 'tasbih',
      onClick: () => onNavigateScreen('tasbih'),
    },
    {
      id: 'calendar',
      label: 'التقويم',
      active: currentScreen === 'calendar',
      onClick: () => onNavigateScreen('calendar'),
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 h-14 sm:h-16 bg-[#FAF6EC]/95 backdrop-blur-md border-b border-[#B8924A]/35">
        <div className="max-w-7xl mx-auto h-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
          {/* Masthead Brand */}
          <button
            type="button"
            onClick={onNavigateHome}
            className="min-h-[42px] flex items-center px-1 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F3D2E] shrink-0 cursor-pointer"
            aria-label="العودة إلى الشاشة الرئيسية رحلة النور"
          >
            <RihlatLogo size="sm" />
          </button>

          {/* Editorial Typographic Navigation (Desktop) */}
          <nav
            className="hidden lg:flex items-center gap-4 xl:gap-6 text-sm font-display font-semibold text-[#11271F] shrink-0"
            aria-label="التنقل الرئيسي"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`min-h-[44px] px-1 flex items-center whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                  item.active
                    ? 'border-[#B8924A] text-[#0F3D2E] font-bold'
                    : 'border-transparent text-[#425B51] hover:text-[#0F3D2E] hover:border-[#B8924A]/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Utility Cluster: Profile, Star Ledger, Chime, Astrolabe Settings */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setDraftName(childName);
                setDraftAge(userAge ? String(userAge) : '');
                setEditingName(true);
              }}
              title="اضغط لتعديل الاسم والعمر"
              className="hidden sm:flex min-h-[42px] px-2.5 py-1 hover:bg-[#F3ECDA] rounded-[6px] items-center gap-2 transition-colors cursor-pointer min-w-0"
            >
              <div
                className={`relative w-8 h-8 rounded-[5px] flex items-center justify-center shrink-0 border ${
                  hasGoldFrame
                    ? 'bg-gradient-to-br from-[#F7E8BD] to-[#D9B96A] border-[#9C7835] text-[#0F3D2E]'
                    : 'bg-[#F3ECDA] border-[#B8924A]/50 text-[#0F3D2E]'
                }`}
              >
                <User className="w-4 h-4" aria-hidden="true" />
                {hasGoldFrame && (
                  <Crown
                    className="w-3.5 h-3.5 text-[#9C7835] fill-[#D9B96A] absolute -top-2 -right-1.5"
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className="text-right min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-display font-bold text-xs sm:text-sm text-[#11271F] truncate max-w-[105px]">
                    {childName}
                  </span>
                  <Pencil className="w-3 h-3 text-[#425B51] shrink-0" aria-hidden="true" />
                </div>
                {(activeTitle || userAge != null) && (
                  <div className="text-[11px] font-medium text-[#7A5E2A] truncate max-w-[135px]">
                    {[activeTitle, userAge != null ? `${userAge} سنة` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                )}
              </div>
            </button>

            <div
              className="min-h-[38px] sm:min-h-[42px] px-2.5 sm:px-3 py-1 rounded-[5px] bg-[#F3ECDA] border border-[#B8924A]/55 flex items-center gap-1.5"
              aria-label={`رصيد نجوم النور المتاح: ${availableStars} من ${TOTAL_POSSIBLE_STARS}`}
            >
              <Star
                className="w-3.5 h-3.5 text-[#B8924A] fill-[#D9B96A] shrink-0"
                aria-hidden="true"
              />
              <span className="font-display font-bold text-sm text-[#0F3D2E] tabular-nums whitespace-nowrap">
                {availableStars}
              </span>
            </div>

            <button
              type="button"
              onClick={onToggleMute}
              className="hidden sm:flex min-w-[40px] min-h-[40px] rounded-[5px] border border-[#B8924A]/45 bg-[#FAF6EC] hover:bg-[#F3ECDA] text-[#0F3D2E] items-center justify-center transition-colors cursor-pointer"
              aria-label={muted ? 'تشغيل المؤثرات الصوتية' : 'كتم المؤثرات الصوتية'}
              title={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
            >
              {muted ? (
                <VolumeX className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Volume2 className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleColorTheme}
              className="min-w-[40px] min-h-[40px] rounded-[5px] border border-[#B8924A]/45 bg-[#FAF6EC] hover:bg-[#F3ECDA] text-[#0F3D2E] flex items-center justify-center transition-colors cursor-pointer"
              aria-label={
                appearance.colorTheme === 'night'
                  ? 'التبديل إلى الوضع الصباحي'
                  : 'التبديل إلى الوضع الليلي'
              }
              title={
                appearance.colorTheme === 'night' ? 'الوضع الصباحي' : 'الوضع الليلي'
              }
            >
              {appearance.colorTheme === 'night' ? (
                <Sun className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="min-w-[40px] min-h-[40px] rounded-[5px] border border-[#B8924A]/45 bg-[#FAF6EC] hover:bg-[#F3ECDA] text-[#0F3D2E] flex items-center justify-center transition-colors cursor-pointer"
              title="إشعارات مستحبات الأيام ودعاء كميل"
              aria-label="إشعارات مستحبات الأيام ودعاء كميل"
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="min-w-[40px] min-h-[40px] rounded-[5px] border border-[#0F3D2E]/30 bg-[#0F3D2E] hover:bg-[#17513E] text-[#FAF6EC] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="الإعدادات واللمحة العامة"
              title="الإعدادات"
            >
              <AstrolabeIcon className="w-4 h-4 text-[#D9B96A]" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="فتح فهرس الأقسام"
              aria-expanded={mobileMenuOpen}
              className="lg:hidden min-w-[40px] min-h-[40px] rounded-[5px] border border-[#B8924A]/50 bg-[#FAF6EC] hover:bg-[#F3ECDA] text-[#0F3D2E] flex items-center justify-center cursor-pointer transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Manuscript Index Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="فهرس الأقسام"
        >
          <div
            className="fixed inset-0 bg-[#081A14]/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-[86%] max-w-xs bg-[#FAF6EC] paper-grain h-full p-4 shadow-2xl border-r border-[#B8924A]/60 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#B8924A]/35">
              <RihlatLogo size="sm" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="إغلاق القائمة"
                className="min-h-[40px] min-w-[40px] rounded-[5px] border border-[#B8924A]/45 text-[#0F3D2E] flex items-center justify-center cursor-pointer hover:bg-[#F3ECDA]"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setDraftName(childName);
                setDraftAge(userAge ? String(userAge) : '');
                setEditingName(true);
              }}
              className="mb-3 p-3 rounded-[6px] bg-[#F3ECDA] border border-[#B8924A]/45 flex items-center justify-between gap-2 text-right cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`relative w-9 h-9 rounded-[5px] flex items-center justify-center shrink-0 border ${
                    hasGoldFrame
                      ? 'bg-[#D9B96A]/35 border-[#B8924A] text-[#0F3D2E]'
                      : 'bg-[#FAF6EC] border-[#B8924A]/40 text-[#0F3D2E]'
                  }`}
                >
                  <User className="w-4 h-4" aria-hidden="true" />
                  {hasGoldFrame && (
                    <Crown
                      className="w-3.5 h-3.5 text-[#9C7835] fill-[#D9B96A] absolute -top-2 -right-1"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-display font-bold text-sm text-[#0F3D2E] truncate">
                    {childName}
                  </div>
                  <div className="text-[11px] font-medium text-[#7A5E2A] truncate">
                    {[activeTitle, userAge != null ? `${userAge} سنة` : null]
                      .filter(Boolean)
                      .join(' · ') || 'اضغط لتعديل الاسم والعمر'}
                  </div>
                </div>
              </div>
              <Pencil className="w-4 h-4 text-[#0F3D2E] shrink-0" aria-hidden="true" />
            </button>

            <nav className="divide-y divide-[#B8924A]/20 flex-1 overflow-y-auto">
              {[
                ...navItems,
                {
                  id: 'map',
                  label: 'خريطة الرحلة (١٠٠ محطة)',
                  active: currentScreen === 'map',
                  onClick: () => onNavigateScreen('map'),
                },
                {
                  id: 'library',
                  label: 'قصص أهل البيت (ع)',
                  active: currentScreen === 'library',
                  onClick: () => onNavigateScreen('library'),
                },
                {
                  id: 'store',
                  label: 'متجر الأنوار',
                  active: currentScreen === 'store',
                  onClick: () => onNavigateScreen('store'),
                },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.onClick();
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full min-h-[44px] px-3 text-right font-display font-bold text-sm flex items-center justify-between cursor-pointer transition-colors ${
                    item.active
                      ? 'bg-[#0F3D2E] text-[#FAF6EC]'
                      : 'text-[#11271F] hover:bg-[#F3ECDA]'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.active && (
                    <span className="w-1.5 h-4 bg-[#D9B96A]" aria-hidden="true" />
                  )}
                </button>
              ))}
            </nav>

            <div className="border-t border-[#B8924A]/35 pt-3 mt-2 space-y-2">
              <button
                type="button"
                onClick={toggleColorTheme}
                className="w-full min-h-[42px] px-3 rounded-[5px] text-right font-semibold text-xs flex items-center justify-between text-[#11271F] bg-[#F3ECDA] border border-[#B8924A]/40 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {appearance.colorTheme === 'night' ? (
                    <Moon className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
                  ) : (
                    <Sun className="w-4 h-4 text-[#0F3D2E]" aria-hidden="true" />
                  )}
                  <span>مظهر التطبيق</span>
                </span>
                <span className="text-[#7A5E2A] font-bold">
                  {appearance.colorTheme === 'night' ? 'الوضع الليلي' : 'الوضع الصباحي'}
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleMute}
                className="w-full min-h-[42px] px-3 rounded-[5px] text-right font-semibold text-xs flex items-center justify-between text-[#11271F] bg-[#F3ECDA] border border-[#B8924A]/40 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {muted ? (
                    <VolumeX className="w-4 h-4 text-[#0F3D2E]" aria-hidden="true" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-[#0F3D2E]" aria-hidden="true" />
                  )}
                  <span>المؤثرات الصوتية</span>
                </span>
                <span className="text-[#7A5E2A] font-bold">
                  {muted ? 'مكتومة' : 'مفعّلة'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setNotificationsOpen(true);
                }}
                className="w-full min-h-[42px] px-3 rounded-[5px] text-right font-semibold text-xs flex items-center justify-between text-[#0F3D2E] bg-[#FAF6EC] border border-[#B8924A]/45 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Bell className="w-4 h-4" aria-hidden="true" />
                  <span>إشعارات المستحبات اليومية</span>
                </span>
                <span className="text-[#7A5E2A]">ضبط</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateScreen('adhan-settings');
                }}
                className="w-full min-h-[42px] px-3 rounded-[5px] text-right font-semibold text-xs flex items-center justify-between text-[#0F3D2E] bg-[#FAF6EC] border border-[#B8924A]/45 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <MinaretAdhanIcon className="w-4 h-4 text-[#B8924A]" />
                  <span>الأذان ومواقيت الصلاة</span>
                </span>
                <span className="text-[#7A5E2A]">ضبط</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSettings();
                }}
                className="w-full min-h-[42px] px-3 rounded-[5px] text-right font-semibold text-xs flex items-center gap-2 text-[#FAF6EC] bg-[#0F3D2E] cursor-pointer"
              >
                <AstrolabeIcon className="w-4 h-4 text-[#D9B96A]" />
                <span>الإعدادات واللمحة العامة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editingName && (
        <div
          className="fixed inset-0 z-50 bg-[#081A14]/65 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-name-title"
        >
          <form
            onSubmit={handleSaveName}
            className="w-full max-w-sm manuscript-folio rounded-[8px] p-6 shadow-2xl"
          >
            <h2
              id="edit-name-title"
              className="font-display font-bold text-xl text-[#0F3D2E]"
            >
              بياناتك في رحلة النور
            </h2>
            <p className="text-sm text-[#425B51] mt-1">
              يمكنك تعديل اسمك وعمرك في أي وقت.
            </p>
            <label className="block mt-4 text-xs font-bold text-[#0F3D2E]">
              الاسم
            </label>
            <input
              type="text"
              maxLength={24}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="اكتب اسمك هنا..."
              autoFocus
              className="mt-1.5 w-full min-h-[46px] px-3.5 rounded-[5px] border border-[#B8924A]/55 bg-white focus:border-[#0F3D2E] focus:outline-none font-bold text-base text-[#11271F]"
            />
            <label className="block mt-3.5 text-xs font-bold text-[#0F3D2E]">
              العمر (بالسنوات)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={3}
              value={draftAge}
              onChange={(e) =>
                setDraftAge(e.target.value.replace(/[^0-9٠-٩۰-۹]/g, ''))
              }
              placeholder="اكتب عمرك..."
              className="mt-1.5 w-full min-h-[46px] px-3.5 rounded-[5px] border border-[#B8924A]/55 bg-white focus:border-[#0F3D2E] focus:outline-none font-bold text-base text-[#11271F]"
            />
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingName(false)}
                className="min-h-[44px] px-5 btn-manuscript cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-6 btn-emerald cursor-pointer"
              >
                حفظ البيانات
              </button>
            </div>
          </form>
        </div>
      )}

      <SpiritualNotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onOpenAdhanSettings={() => {
          setNotificationsOpen(false);
          onNavigateScreen('adhan-settings');
        }}
        onOpenSection={(sec, entryId) => {
          if (sec === 'library' || sec === 'tasbih') {
            onNavigateScreen(sec);
          } else if (sec === 'duas') {
            onOpenLibrarySection('adiyat', entryId);
          } else if (sec === 'munajat') {
            onOpenLibrarySection('munajat', entryId);
          } else {
            onOpenLibrarySection(sec as DigitalLibrarySection, entryId);
          }
        }}
      />
    </>
  );
};
