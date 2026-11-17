import React, { useState } from 'react';
import {
  Star,
  Volume2,
  VolumeX,
  User,
  Crown,
  Pencil,
  Settings,
  Menu,
  X,
  Bell,
  WifiOff,
} from 'lucide-react';
import { RihlatLogo } from './RihlatLogo';
import { SpiritualNotificationsModal } from './SpiritualNotificationsModal';
import { useOnlineStatus } from '../utils/useOnlineStatus';
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
  const isOnline = useOnlineStatus();

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
      id: 'adiyat',
      label: 'الأدعية',
      active:
        currentScreen === 'duas' ||
        (currentScreen === 'digital-library' && activeLibrarySection === 'adiyat'),
      onClick: () => onOpenLibrarySection('adiyat'),
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
        (currentScreen === 'digital-library' &&
          activeLibrarySection === 'munajat'),
      onClick: () => onOpenLibrarySection('munajat'),
    },
    {
      id: 'tasbih',
      label: 'التسبيح',
      active: currentScreen === 'tasbih',
      onClick: () => onNavigateScreen('tasbih'),
    },
    {
      id: 'calendar',
      label: 'التقويم',
      active: currentScreen === 'calendar',
      onClick: () => onNavigateScreen('calendar'),
    },
    {
      id: 'quran',
      label: 'القرآن',
      active:
        currentScreen === 'digital-library' && activeLibrarySection === 'quran',
      onClick: () => onOpenLibrarySection('quran'),
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 h-14 sm:h-16 bg-[#FDFCF9]/95 backdrop-blur-md border-b border-[#E5E0D5] shadow-2xs">
        <div className="max-w-7xl mx-auto h-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={onNavigateHome}
            className="min-h-[40px] sm:min-h-[44px] flex items-center rounded-xl px-1 hover:bg-emerald-50/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 shrink-0 cursor-pointer"
            aria-label="العودة إلى الشاشة الرئيسية رحلة النور"
          >
            <RihlatLogo size="sm" />
          </button>

          {/* Zone 2: Clean Single-Line Navigation Links */}
          <nav
            className="hidden lg:flex items-center gap-6 text-sm font-extrabold text-emerald-800 shrink-0"
            aria-label="التنقل الرئيسي"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`min-h-[44px] px-1 flex items-center whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                  item.active
                    ? 'border-emerald-600 text-emerald-950'
                    : 'border-transparent text-emerald-700 hover:text-emerald-950 hover:border-emerald-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Profile, Stars, Audio & Mobile Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setDraftName(childName);
                setDraftAge(userAge ? String(userAge) : '');
                setEditingName(true);
              }}
              title="اضغط لتعديل الاسم والعمر"
              className="hidden sm:flex min-h-[44px] px-2 py-1 rounded-xl hover:bg-emerald-50/80 items-center gap-2 transition-colors cursor-pointer min-w-0"
            >
              <div
                className={`relative w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  hasGoldFrame
                    ? 'bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300 border-2 border-amber-500 ring-2 ring-amber-300 shadow-sm text-amber-800'
                    : 'bg-sky-100 border border-sky-200 text-sky-800'
                }`}
              >
                <User className="w-4 h-4" aria-hidden="true" />
                {hasGoldFrame && (
                  <Crown
                    className="w-3.5 h-3.5 text-amber-600 fill-amber-400 absolute -top-1.5 -right-1"
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className="text-right min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-display font-extrabold text-xs sm:text-sm text-emerald-950 truncate max-w-[110px]">
                    {childName}
                  </span>
                  <Pencil className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                </div>
                {(activeTitle || userAge != null) && (
                  <div className="text-[11px] font-bold text-[#7D602B] truncate max-w-[140px]">
                    {[activeTitle, userAge != null ? `${userAge} سنة` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                )}
              </div>
            </button>

            <div
              className="min-h-[40px] sm:min-h-[44px] px-2.5 sm:px-3 py-1 rounded-xl bg-[#F6F3EA] border border-[#E2DBC8] flex items-center gap-1.5"
              aria-label={`رصيد نجوم النور المتاح: ${availableStars} من ${TOTAL_POSSIBLE_STARS}`}
            >
              <Star
                className="w-4 h-4 text-[#9A7B3E] fill-[#C9A962] shrink-0"
                aria-hidden="true"
              />
              <span className="font-display font-extrabold text-sm sm:text-base text-[#4A3B1C] tabular-nums whitespace-nowrap">
                {availableStars}
              </span>
            </div>

            <button
              type="button"
              onClick={onToggleMute}
              className="hidden sm:flex min-w-[44px] min-h-[44px] rounded-xl border border-[#DFDBD0] bg-[#F7F5EE] hover:bg-[#EEEAE0] text-[#145344] items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145344]"
              aria-label={muted ? 'تشغيل المؤثرات الصوتية' : 'كتم المؤثرات الصوتية'}
              title={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
            >
              {muted ? (
                <VolumeX className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Volume2 className="w-5 h-5" aria-hidden="true" />
              )}
            </button>

            {!isOnline && (
              <div
                title="أنت تعمل في وضع عدم الاتصال (بدون إنترنت)"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#EEF4F1] text-[#145344] text-xs font-bold shrink-0 border border-[#CFE0D8]"
              >
                <WifiOff className="w-3.5 h-3.5 text-[#145344]" aria-hidden="true" />
                <span>أوفلاين</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] rounded-xl border border-[#DFDBD0] bg-[#F7F5EE] hover:bg-[#EEEAE0] text-[#145344] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145344]"
              title="إشعارات مستحبات الأيام ودعاء كميل"
              aria-label="إشعارات مستحبات الأيام ودعاء كميل"
            >
              <Bell className="w-5 h-5 text-[#145344]" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] rounded-xl border border-[#D4E2DA] bg-[#EFF5F2] hover:bg-[#E3EFE9] text-[#145344] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145344]"
              aria-label="الإعدادات واللمحة العامة"
              title="الإعدادات"
            >
              <Settings className="w-5 h-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="فتح القائمة الرئيسية"
              aria-expanded={mobileMenuOpen}
              className="lg:hidden min-w-[40px] min-h-[40px] rounded-xl border border-[#D4E2DA] bg-[#EFF5F2] hover:bg-[#E3EFE9] text-[#145344] flex items-center justify-center cursor-pointer transition-colors"
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

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="قائمة الأقسام"
        >
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-[85%] max-w-xs bg-white h-full p-4 shadow-2xl border-r border-emerald-200 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <RihlatLogo size="sm" />
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="إغلاق القائمة"
                className="min-h-[40px] min-w-[40px] rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Mobile Profile Card inside Drawer */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setDraftName(childName);
                setDraftAge(userAge ? String(userAge) : '');
                setEditingName(true);
              }}
              className="mb-3 p-3 rounded-2xl bg-[#F6F3EA] border border-[#E2DBC8] flex items-center justify-between gap-2 text-right cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`relative w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    hasGoldFrame
                      ? 'bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300 border-2 border-amber-500 text-amber-800'
                      : 'bg-[#EFF5F2] border border-[#D4E2DA] text-[#145344]'
                  }`}
                >
                  <User className="w-4 h-4" aria-hidden="true" />
                  {hasGoldFrame && (
                    <Crown
                      className="w-3.5 h-3.5 text-amber-600 fill-amber-400 absolute -top-1.5 -right-1"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-display font-bold text-sm text-[#143D32] truncate">
                    {childName}
                  </div>
                  <div className="text-[11px] font-semibold text-[#7D602B] truncate">
                    {[activeTitle, userAge != null ? `${userAge} سنة` : null]
                      .filter(Boolean)
                      .join(' · ') || 'اضغط لتعديل الاسم والعمر'}
                  </div>
                </div>
              </div>
              <Pencil className="w-4 h-4 text-[#145344] shrink-0" aria-hidden="true" />
            </button>

            <nav className="space-y-1 flex-1 overflow-y-auto">
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
                  className={`w-full min-h-[44px] px-3.5 rounded-xl text-right font-display font-extrabold text-sm sm:text-base flex items-center justify-between cursor-pointer transition-colors ${
                    item.active
                      ? 'bg-emerald-600 text-white'
                      : 'text-emerald-950 hover:bg-emerald-50'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              ))}

              <div className="border-t border-[#E5E0D5] mt-3 pt-3 space-y-1.5">
                <button
                  type="button"
                  onClick={onToggleMute}
                  className="w-full min-h-[44px] px-3.5 rounded-xl text-right font-display font-bold text-sm flex items-center justify-between text-[#145344] bg-[#F7F5EE] hover:bg-[#EEEAE0] border border-[#E5E0D5] cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {muted ? (
                      <VolumeX className="w-4 h-4 text-[#145344]" aria-hidden="true" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-[#145344]" aria-hidden="true" />
                    )}
                    <span>المؤثرات الصوتية</span>
                  </span>
                  <span className="text-xs font-extrabold text-stone-600">
                    {muted ? 'مكتومة' : 'مفعّلة'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setNotificationsOpen(true);
                  }}
                  className="w-full min-h-[44px] px-3.5 rounded-xl text-right font-display font-bold text-sm flex items-center justify-between text-[#145344] bg-[#EFF5F2] border border-[#D4E2DA] hover:bg-[#E4EFE9] cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#145344]" aria-hidden="true" />
                    <span>إشعارات المستحبات</span>
                  </span>
                  <span className="text-xs font-bold text-[#145344]">تنبيهات</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full min-h-[44px] px-3.5 rounded-xl text-right font-display font-bold text-sm flex items-center gap-2 text-[#1E3B32] hover:bg-[#F4F1EA] cursor-pointer transition-colors"
                >
                  <Settings className="w-4 h-4 text-[#145344] shrink-0" aria-hidden="true" />
                  <span>الإعدادات واللمحة العامة</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Child Name Edit Modal */}
      {editingName && (
        <div
          className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-name-title"
        >
          <form
            onSubmit={handleSaveName}
            className="w-full max-w-sm bg-[#FDFCF9] rounded-3xl p-6 border border-[#DDD4BE] shadow-2xl"
          >
            <h2
              id="edit-name-title"
              className="font-display font-bold text-xl text-[#143D32]"
            >
              بياناتك في رحلة النور
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              يمكنك تعديل اسمك وعمرك في أي وقت.
            </p>
            <label className="block mt-4 text-xs font-bold text-[#145344]">
              الاسم
            </label>
            <input
              type="text"
              maxLength={24}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="اكتب اسمك هنا..."
              autoFocus
              className="mt-1.5 w-full min-h-[46px] px-4 rounded-xl border border-[#D4E2DA] bg-white focus:border-[#145344] focus:outline-none font-bold text-base text-[#143D32]"
            />
            <label className="block mt-3.5 text-xs font-bold text-[#145344]">
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
              className="mt-1.5 w-full min-h-[46px] px-4 rounded-xl border border-[#D4E2DA] bg-white focus:border-[#145344] focus:outline-none font-bold text-base text-[#143D32]"
            />
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingName(false)}
                className="min-h-[44px] px-5 rounded-xl bg-[#F4F1E8] hover:bg-[#EAE4D5] text-slate-700 font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-6 rounded-xl bg-[#145344] hover:bg-[#0F4236] text-white font-bold cursor-pointer"
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
