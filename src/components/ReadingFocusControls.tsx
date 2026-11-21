import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Eye,
  EyeOff,
  Info,
  Moon,
  Palette,
  RefreshCw,
  ShieldCheck,
  Sun,
  Type,
  X,
} from 'lucide-react';
import {
  APP_FONT_OPTIONS,
  AppAppearanceSettings,
  AppArabicFontId,
  AppColorTheme,
  loadAppAppearanceSettings,
  saveAppAppearanceSettings,
  subscribeAppAppearance,
} from '../utils/appAppearance';
import { OFFICIAL_LOGO_URL } from './RihlatLogo';
import { APP_OVERVIEW } from '../data/appOverview';
import {
  AppUpdateInfo,
  checkForAppUpdate,
  getCurrentAppVersion,
} from '../utils/appUpdateChecker';
import {
  AstrolabeIcon,
  CalendarArchIcon,
  DuaScrollIcon,
  MinaretAdhanIcon,
  QuranBookIcon,
  ShrineDomeIcon,
  StoriesLanternIcon,
  TasbihBeadsIcon,
} from './IslamicOrnaments';

export type ReadingFocusTheme = 'emerald' | 'amber' | 'slate';

export interface ReadingFocusSettings {
  enabled: boolean;
  theme: ReadingFocusTheme;
  pageFlipSound: boolean;
}

const FOCUS_SETTINGS_STORAGE_KEY = 'rihlat_alnoor_reading_focus_v1';

export const DEFAULT_READING_FOCUS_SETTINGS: ReadingFocusSettings = {
  enabled: true,
  theme: 'emerald',
  pageFlipSound: false,
};

export function loadReadingFocusSettings(): ReadingFocusSettings {
  if (typeof window === 'undefined') return DEFAULT_READING_FOCUS_SETTINGS;
  try {
    const raw = window.localStorage.getItem(FOCUS_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_READING_FOCUS_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ReadingFocusSettings>;
    const validTheme: ReadingFocusTheme =
      parsed.theme === 'emerald' ||
      parsed.theme === 'amber' ||
      parsed.theme === 'slate'
        ? parsed.theme
        : 'emerald';
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
      theme: validTheme,
      pageFlipSound:
        typeof parsed.pageFlipSound === 'boolean' ? parsed.pageFlipSound : false,
    };
  } catch {
    return DEFAULT_READING_FOCUS_SETTINGS;
  }
}

export function saveReadingFocusSettings(settings: ReadingFocusSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      FOCUS_SETTINGS_STORAGE_KEY,
      JSON.stringify(settings)
    );
  } catch {
    // Ignore storage quota errors
  }
}

export interface ReadingFocusThemeConfig {
  id: ReadingFocusTheme;
  label: string;
  description: string;
  swatchClass: string;
  lightActiveClass: string;
  nightActiveClass: string;
  ayahBadgeActiveClass: string;
}

export const READING_FOCUS_THEMES: ReadingFocusThemeConfig[] = [
  {
    id: 'emerald',
    label: 'زمردي عميق',
    description: 'أخضر المخطوطات الداكن لتباين هادئ وواضح',
    swatchClass: 'bg-[#0F3D2E] border-[#B8924A]',
    lightActiveClass:
      'bg-[#0F3D2E] text-[#FAF6EC] ring-1 ring-[#B8924A] shadow-xs',
    nightActiveClass:
      'bg-[#175440] text-[#FAF6EC] ring-1 ring-[#D9B96A]',
    ayahBadgeActiveClass:
      'bg-[#D9B96A]/25 text-[#FAF6EC] border-[#D9B96A]',
  },
  {
    id: 'amber',
    label: 'حبر العنبر الدافئ',
    description: 'تظليل كهرماني دافئ يحاكي تذهيب الهوامش',
    swatchClass: 'bg-[#6D4D1C] border-[#D9B96A]',
    lightActiveClass:
      'bg-[#5B3D12] text-[#FAF6EC] ring-1 ring-[#D9B96A] shadow-xs',
    nightActiveClass:
      'bg-[#4A3210] text-[#FAF6EC] ring-1 ring-[#D9B96A]',
    ayahBadgeActiveClass:
      'bg-[#D9B96A]/30 text-[#FAF6EC] border-[#D9B96A]',
  },
  {
    id: 'slate',
    label: 'حبر الليل الداكن',
    description: 'حبر ليلي داكن جداً لقراءة خاشعة عالية الوضوح',
    swatchClass: 'bg-[#11271F] border-[#1F6B50]',
    lightActiveClass:
      'bg-[#11271F] text-[#FAF6EC] ring-1 ring-[#B8924A]',
    nightActiveClass:
      'bg-[#05110D] text-[#FAF6EC] ring-1 ring-[#D9B96A]',
    ayahBadgeActiveClass:
      'bg-[#D9B96A]/25 text-[#F3EBD6] border-[#D9B96A]',
  },
];

export function getReadingFocusThemeConfig(
  theme: ReadingFocusTheme
): ReadingFocusThemeConfig {
  return (
    READING_FOCUS_THEMES.find((t) => t.id === theme) || READING_FOCUS_THEMES[0]
  );
}

export function splitIntoReadableLines(text: string): string[] {
  if (!text) return [text];

  const rawChunks = text.match(/[^،؛.؟!\n]+[،؛.؟!\n]*\s*/g);
  if (!rawChunks || rawChunks.length <= 1) {
    return [text];
  }

  const merged: string[] = [];
  let buffer = '';

  for (const chunk of rawChunks) {
    buffer += chunk;
    if (buffer.trim().length >= 44 || buffer.includes('\n')) {
      merged.push(buffer);
      buffer = '';
    }
  }

  if (buffer) {
    if (merged.length > 0 && buffer.trim().length < 24) {
      merged[merged.length - 1] += buffer;
    } else {
      merged.push(buffer);
    }
  }

  if (merged.join('') !== text) {
    return [text];
  }

  return merged;
}

export function getReadingUnitClasses(options: {
  isActive: boolean;
  enabled: boolean;
  nightMode: boolean;
  theme: ReadingFocusTheme;
}): string {
  const { isActive, enabled, nightMode, theme } = options;
  if (!enabled) return '';

  const themeConfig = getReadingFocusThemeConfig(theme);

  if (isActive) {
    return `inline box-decoration-clone rounded-[4px] px-2 py-0.5 transition-all duration-150 cursor-pointer ${
      nightMode ? themeConfig.nightActiveClass : themeConfig.lightActiveClass
    }`;
  }

  return `inline box-decoration-clone rounded-[4px] px-1 py-0.5 transition-all duration-150 cursor-pointer ${
    nightMode
      ? 'text-[#F3EBD6]/75 hover:text-[#FAF6EC] hover:bg-[#13382C]/65'
      : 'text-[#11271F]/80 hover:text-[#0F3D2E] hover:bg-[#B8924A]/15'
  }`;
}

interface UseReadingFocusTrackerProps {
  resetKey: string;
  unitCount: number;
  enabled: boolean;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

const READING_POSITIONS_KEY = 'rihlat_alnoor_reading_positions_v1';

function loadSavedReadingPositions(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(READING_POSITIONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function saveReadingPositionForKey(
  itemKey: string,
  index: number
): void {
  if (typeof window === 'undefined' || !itemKey) return;
  try {
    const map = loadSavedReadingPositions();
    map[itemKey] = index;
    window.localStorage.setItem(READING_POSITIONS_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

export function getSavedReadingPosition(itemKey: string): number {
  const map = loadSavedReadingPositions();
  const val = map[itemKey];
  return typeof val === 'number' && Number.isFinite(val) && val >= 0 ? val : 0;
}

export function useReadingFocusTracker({
  resetKey,
  unitCount,
  enabled,
  contentRef,
}: UseReadingFocusTrackerProps) {
  const itemKey = resetKey.split(':')[0] || resetKey;
  const [activeUnitIndex, setActiveUnitIndex] = useState<number>(() =>
    getSavedReadingPosition(itemKey)
  );
  const programmaticScrollUntilRef = useRef<number>(0);
  const restoredForKeyRef = useRef<string>('');

  const scrollUnitIntoView = useCallback(
    (index: number) => {
      const container = contentRef.current;
      if (!container) return;
      const target = container.querySelector<HTMLElement>(
        `[data-reading-unit-index="${index}"]`
      );
      if (!target) return;
      programmaticScrollUntilRef.current = Date.now() + 800;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    [contentRef]
  );

  useEffect(() => {
    if (!enabled || unitCount <= 0) {
      if (!enabled) {
        restoredForKeyRef.current = '';
      }
      return;
    }

    const saved = getSavedReadingPosition(itemKey);
    const clamped = Math.max(0, Math.min(unitCount - 1, saved));
    setActiveUnitIndex(clamped);

    const restoreSignature = `${resetKey}:${unitCount}:${enabled ? 1 : 0}`;
    if (clamped > 0 && restoredForKeyRef.current !== restoreSignature) {
      restoredForKeyRef.current = restoreSignature;
      programmaticScrollUntilRef.current = Date.now() + 900;
      const timer = window.setTimeout(() => {
        scrollUnitIntoView(clamped);
      }, 140);
      return () => window.clearTimeout(timer);
    }
    restoredForKeyRef.current = restoreSignature;
  }, [resetKey, itemKey, unitCount, enabled, scrollUnitIntoView]);

  useEffect(() => {
    if (!enabled || unitCount <= 0) return;
    if (Date.now() < programmaticScrollUntilRef.current - 300) return;
    saveReadingPositionForKey(itemKey, activeUnitIndex);
  }, [enabled, itemKey, activeUnitIndex, unitCount]);

  useEffect(() => {
    if (unitCount > 0 && activeUnitIndex >= unitCount) {
      setActiveUnitIndex(unitCount - 1);
    }
  }, [unitCount, activeUnitIndex]);

  const stepUnit = useCallback(
    (delta: number) => {
      if (!enabled || unitCount <= 0) return;
      setActiveUnitIndex((prev) => {
        const next = Math.max(0, Math.min(unitCount - 1, prev + delta));
        if (next !== prev) {
          saveReadingPositionForKey(itemKey, next);
          requestAnimationFrame(() => scrollUnitIntoView(next));
        }
        return next;
      });
    },
    [enabled, unitCount, itemKey, scrollUnitIntoView]
  );

  useEffect(() => {
    if (!enabled || unitCount <= 1) return;

    let rafId = 0;

    const handleScroll = () => {
      if (Date.now() < programmaticScrollUntilRef.current) return;
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const container = contentRef.current;
        if (!container) return;

        const units = container.querySelectorAll<HTMLElement>(
          '[data-reading-unit-index]'
        );
        if (units.length === 0) return;

        const containerRect = container.getBoundingClientRect();
        if (
          containerRect.bottom < 80 ||
          containerRect.top > window.innerHeight - 40
        ) {
          return;
        }

        const focusY = window.innerHeight * 0.38;
        let bestIndex: number | null = null;
        let bestDistance = Infinity;

        units.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > window.innerHeight) return;

          const idxAttr = el.getAttribute('data-reading-unit-index');
          if (!idxAttr) return;
          const idx = Number(idxAttr);
          if (!Number.isFinite(idx)) return;

          const dist =
            focusY >= rect.top && focusY <= rect.bottom
              ? 0
              : Math.min(
                  Math.abs(rect.top - focusY),
                  Math.abs(rect.bottom - focusY)
                );

          if (dist < bestDistance) {
            bestDistance = dist;
            bestIndex = idx;
          }
        });

        if (bestIndex !== null) {
          setActiveUnitIndex(bestIndex);
          saveReadingPositionForKey(itemKey, bestIndex);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [enabled, unitCount, itemKey, contentRef]);

  useEffect(() => {
    if (!enabled || unitCount <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        stepUnit(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        stepUnit(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, unitCount, stepUnit]);

  return {
    activeUnitIndex,
    setActiveUnitIndex,
    stepUnit,
  };
}

interface ReadingSettingsModalProps {
  isOpen: boolean;
  settings: ReadingFocusSettings;
  onChange: (next: ReadingFocusSettings) => void;
  onClose: () => void;
  onOpenWelcome?: () => void;
  onOpenAdhanSettings?: () => void;
  onUpdateFound?: (update: AppUpdateInfo) => void;
}

function renderOverviewSectionIcon(id: string) {
  switch (id) {
    case 'quran':
      return <QuranBookIcon className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'adiyat':
      return <DuaScrollIcon className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'sahifa':
      return <ShrineDomeIcon className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'stories-games':
      return <StoriesLanternIcon className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'tasbih':
      return <TasbihBeadsIcon className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'calendar':
    default:
      return <CalendarArchIcon className="w-4 h-4 sm:w-5 sm:h-5" />;
  }
}

export const ReadingSettingsModal: React.FC<ReadingSettingsModalProps> = ({
  isOpen,
  settings,
  onChange,
  onClose,
  onOpenWelcome,
  onOpenAdhanSettings,
  onUpdateFound,
}) => {
  const [activeTab, setActiveTab] = useState<'reading' | 'overview'>('reading');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);
  const [appearance, setAppearance] = useState<AppAppearanceSettings>(
    loadAppAppearanceSettings
  );
  const currentVersion = getCurrentAppVersion();

  useEffect(() => {
    if (!isOpen) return;
    setAppearance(loadAppAppearanceSettings());
    return subscribeAppAppearance(setAppearance);
  }, [isOpen]);

  const handleSetColorTheme = (colorTheme: AppColorTheme) => {
    const next: AppAppearanceSettings = { ...appearance, colorTheme };
    setAppearance(next);
    saveAppAppearanceSettings(next);
  };

  const handleSetFont = (fontId: AppArabicFontId) => {
    const next: AppAppearanceSettings = { ...appearance, fontId };
    setAppearance(next);
    saveAppAppearanceSettings(next);
  };

  const handleManualUpdateCheck = async () => {
    if (checkingUpdate) return;
    setCheckingUpdate(true);
    setUpdateFeedback(null);
    const result = await checkForAppUpdate({
      force: true,
      respectDismissed: false,
    });
    setCheckingUpdate(false);
    setUpdateFeedback(result.message);
    if (result.status === 'update-available' && result.update && onUpdateFound) {
      onUpdateFound(result.update);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeThemeConfig = getReadingFocusThemeConfig(settings.theme);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#081A14]/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reading-settings-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] flex flex-col manuscript-folio rounded-[8px] p-4 sm:p-6 shadow-2xl text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#B8924A]/35 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-[5px] bg-[#0F3D2E] text-[#D9B96A] flex items-center justify-center shrink-0">
              {activeTab === 'reading' ? (
                <AstrolabeIcon className="w-5 h-5" />
              ) : (
                <Info className="w-5 h-5" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <h2
                id="reading-settings-title"
                className="font-display font-bold text-lg sm:text-xl text-[#0F3D2E] truncate"
              >
                الإعدادات واللمحة العامة
              </h2>
              <p className="text-[11px] sm:text-xs text-[#425B51] truncate">
                الوضع الليلي/الصباحي · نوع الخط · تظليل القراءة · الإصدار
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق الإعدادات"
            className="min-h-[38px] min-w-[38px] rounded-[5px] border border-[#B8924A]/40 text-[#425B51] hover:bg-[#F3ECDA] flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* 2-Tab Switcher */}
        <div
          role="tablist"
          aria-label="أقسام الإعدادات"
          className="grid grid-cols-2 gap-1.5 mt-3.5 p-1 rounded-[5px] bg-[#F3ECDA] border border-[#B8924A]/35 shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'reading'}
            onClick={() => setActiveTab('reading')}
            className={`min-h-[40px] px-2 sm:px-3 py-1.5 rounded-[4px] font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'reading'
                ? 'bg-[#0F3D2E] text-[#FAF6EC]'
                : 'text-[#11271F] hover:bg-[#FAF6EC]'
            }`}
          >
            <Palette className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">المظهر والخط والقراءة</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            className={`min-h-[40px] px-2 sm:px-3 py-1.5 rounded-[4px] font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#0F3D2E] text-[#FAF6EC]'
                : 'text-[#11271F] hover:bg-[#FAF6EC]'
            }`}
          >
            <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">اللمحة العامة عن التطبيق</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4 overflow-y-auto flex-1 pr-0.5 space-y-5">
          {activeTab === 'reading' ? (
            <>
              {/* App-Wide Morning / Night Mode Switcher */}
              <div className="p-3.5 sm:p-4 rounded-[6px] bg-[#F3ECDA]/70 border border-[#B8924A]/45 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-base text-[#0F3D2E]">
                      المظهر العام للتطبيق (كامل البرنامج)
                    </h3>
                    <p className="text-xs text-[#425B51] mt-0.5">
                      بدّل بين الوضع الصباحي الورقي الدافئ والوضع الليلي المريح للعين في جميع الشاشات.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetColorTheme('morning')}
                    aria-pressed={appearance.colorTheme === 'morning'}
                    className={`min-h-[46px] px-3 py-2 rounded-[5px] border flex items-center justify-center gap-2 font-display font-bold text-xs sm:text-sm cursor-pointer transition-colors ${
                      appearance.colorTheme === 'morning'
                        ? 'bg-[#0F3D2E] text-[#FAF6EC] border-[#B8924A]'
                        : 'bg-[#FAF6EC] text-[#11271F] border-[#B8924A]/40 hover:border-[#B8924A]'
                    }`}
                  >
                    <Sun
                      className={`w-4 h-4 shrink-0 ${
                        appearance.colorTheme === 'morning'
                          ? 'text-[#D9B96A]'
                          : 'text-[#B8924A]'
                      }`}
                      aria-hidden="true"
                    />
                    <span>الوضع الصباحي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetColorTheme('night')}
                    aria-pressed={appearance.colorTheme === 'night'}
                    className={`min-h-[46px] px-3 py-2 rounded-[5px] border flex items-center justify-center gap-2 font-display font-bold text-xs sm:text-sm cursor-pointer transition-colors ${
                      appearance.colorTheme === 'night'
                        ? 'bg-[#0F3D2E] text-[#FAF6EC] border-[#D9B96A]'
                        : 'bg-[#FAF6EC] text-[#11271F] border-[#B8924A]/40 hover:border-[#B8924A]'
                    }`}
                  >
                    <Moon
                      className={`w-4 h-4 shrink-0 ${
                        appearance.colorTheme === 'night'
                          ? 'text-[#D9B96A]'
                          : 'text-[#425B51]'
                      }`}
                      aria-hidden="true"
                    />
                    <span>الوضع الليلي</span>
                  </button>
                </div>
              </div>

              {/* Arabic Font Picker (Default + 5 Arabic Fonts) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-[#B8924A] shrink-0" aria-hidden="true" />
                    <h3 className="font-display font-bold text-sm sm:text-base text-[#0F3D2E]">
                      نوع الخط العربي في التطبيق
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-[#7A5E2A]">
                    ٦ خطوط متاحة
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {APP_FONT_OPTIONS.map((font) => {
                    const selected = appearance.fontId === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => handleSetFont(font.id)}
                        aria-pressed={selected}
                        className={`p-3 rounded-[5px] border text-right flex flex-col justify-between gap-1.5 cursor-pointer transition-colors ${
                          selected
                            ? 'bg-[#F3ECDA] border-[#0F3D2E]'
                            : 'bg-[#FAF6EC] border-[#B8924A]/35 hover:border-[#B8924A]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 w-full">
                          <div className="min-w-0">
                            <div
                              className="font-bold text-sm text-[#0F3D2E]"
                              style={{ fontFamily: font.displayFamily }}
                            >
                              {font.name}
                            </div>
                            <div className="text-[11px] text-[#425B51] leading-snug">
                              {font.subtitle}
                            </div>
                          </div>
                          {selected && (
                            <Check
                              className="w-4 h-4 text-[#0F3D2E] shrink-0 mt-0.5"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <div
                          className="pt-1.5 mt-0.5 border-t border-[#B8924A]/25 text-xs sm:text-sm text-[#11271F] leading-relaxed"
                          style={{ fontFamily: font.arabicFamily }}
                        >
                          {font.sample}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onChange({ ...settings, enabled: !settings.enabled })
                }
                aria-pressed={settings.enabled}
                className={`w-full p-3.5 sm:p-4 rounded-[5px] border flex items-center justify-between gap-3 cursor-pointer transition-colors text-right ${
                  settings.enabled
                    ? 'bg-[#F3ECDA]/85 border-[#0F3D2E] text-[#0F3D2E]'
                    : 'bg-[#FAF6EC] border-[#B8924A]/35 text-[#425B51]'
                }`}
              >
                <div className="flex items-start gap-2.5 sm:gap-3">
                  {settings.enabled ? (
                    <Eye className="w-5 h-5 text-[#0F3D2E] shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-[#425B51] shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <div>
                    <div className="font-display font-bold text-sm sm:text-base">
                      تغميق السطر أو الآية عند العبور
                    </div>
                    <p className="text-xs text-[#425B51] mt-0.5 leading-relaxed">
                      يميز السطر أو الآية تلقائياً عند التمرير أو اللمس حتى لا تتيه العين.
                    </p>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-[4px] text-xs font-bold shrink-0 ${
                    settings.enabled
                      ? 'bg-[#0F3D2E] text-[#FAF6EC]'
                      : 'bg-[#E5DEC9] text-[#425B51]'
                  }`}
                >
                  {settings.enabled ? 'مفعّل' : 'متوقف'}
                </span>
              </button>

              <div className="mt-5">
                <h3 className="font-display font-bold text-sm text-[#0F3D2E] mb-2.5">
                  لون حبر التغميق
                </h3>

                <div className="space-y-2">
                  {READING_FOCUS_THEMES.map((item) => {
                    const selected = settings.theme === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={!settings.enabled}
                        onClick={() => onChange({ ...settings, theme: item.id })}
                        aria-pressed={selected}
                        className={`w-full p-3 rounded-[5px] border flex items-center justify-between gap-3 transition-colors text-right cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                          selected
                            ? 'bg-[#F3ECDA] border-[#0F3D2E]'
                            : 'bg-[#FAF6EC] border-[#B8924A]/35 hover:border-[#B8924A]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-[4px] border-2 shrink-0 ${item.swatchClass}`}
                            aria-hidden="true"
                          />
                          <div>
                            <div className="font-display font-bold text-sm text-[#11271F]">
                              {item.label}
                            </div>
                            <div className="text-xs text-[#425B51]">
                              {item.description}
                            </div>
                          </div>
                        </div>

                        {selected && (
                          <Check className="w-5 h-5 text-[#0F3D2E] shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 rounded-[5px] border border-[#B8924A]/45 bg-[#F3ECDA]/60 p-4">
                <div className="text-xs font-bold text-[#7A5E2A] mb-2">
                  معاينة التغميق على صفحة المخطوطة:
                </div>
                <p className="font-arabic text-lg leading-[2.25] text-[#11271F]/80">
                  <span>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ، </span>
                  <span
                    className={
                      settings.enabled
                        ? `inline box-decoration-clone rounded-[4px] px-2 py-0.5 ${activeThemeConfig.lightActiveClass}`
                        : ''
                    }
                  >
                    إِلَهِي أَلْهِمْنَا ذِكْرَكَ فِي الْخَلَاءِ وَالْمَلَاءِ
                  </span>
                  <span> وَآنِسْنَا بِالذِّكْرِ الْخَفِيِّ.</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...settings,
                    pageFlipSound: !settings.pageFlipSound,
                  })
                }
                aria-pressed={settings.pageFlipSound}
                className={`mt-4 w-full p-3.5 rounded-[5px] border flex items-center justify-between gap-3 cursor-pointer transition-colors text-right ${
                  settings.pageFlipSound
                    ? 'bg-[#F3ECDA]/85 border-[#0F3D2E] text-[#0F3D2E]'
                    : 'bg-[#FAF6EC] border-[#B8924A]/35 text-[#425B51]'
                }`}
              >
                <div>
                  <div className="font-display font-bold text-sm">
                    صوت تقليب الورق في وضع الكتاب
                  </div>
                  <p className="text-xs text-[#425B51] mt-0.5 leading-relaxed">
                    صوت همس ورقي خفيف عند الانتقال بين صفحات القرآن والأدعية.
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-[4px] text-xs font-bold shrink-0 ${
                    settings.pageFlipSound
                      ? 'bg-[#0F3D2E] text-[#FAF6EC]'
                      : 'bg-[#E5DEC9] text-[#425B51]'
                  }`}
                >
                  {settings.pageFlipSound ? 'مفعّل' : 'متوقف'}
                </span>
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-[6px] bg-[#0F3D2E] text-[#FAF6EC] border border-[#B8924A] p-5 flex flex-col items-center text-center">
                <div className="w-full max-w-[180px] rounded-[4px] bg-white p-1.5 border border-[#D9B96A]">
                  <img
                    src={OFFICIAL_LOGO_URL}
                    alt="الشعار الرسمي لتطبيق رحلة النور"
                    className="w-full h-auto object-contain rounded-[3px] bg-white"
                  />
                </div>
                <h3 className="mt-3 font-calligraphy font-bold text-2xl gold-foil-light-text">
                  {APP_OVERVIEW.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#D9B96A] mt-0.5">
                  {APP_OVERVIEW.subtitle}
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-[#DFECE6]">
                  <ShieldCheck className="w-4 h-4 text-[#D9B96A] shrink-0" aria-hidden="true" />
                  <span>{APP_OVERVIEW.supervision}</span>
                </div>
              </div>

              <div className="pr-3.5 border-r-2 border-[#B8924A]">
                <h4 className="font-display font-bold text-sm sm:text-base text-[#0F3D2E]">
                  {APP_OVERVIEW.aboutHeading}
                </h4>
                <p className="mt-1 text-xs sm:text-sm text-[#425B51] leading-relaxed">
                  {APP_OVERVIEW.aboutBody}
                </p>
              </div>

              <div className="border-t border-[#B8924A]/30 pt-3">
                <h4 className="font-display font-bold text-sm text-[#0F3D2E] mb-2.5">
                  {APP_OVERVIEW.sectionsHeading}
                </h4>
                <div className="divide-y divide-[#B8924A]/20">
                  {APP_OVERVIEW.sections.map((sec) => (
                    <div key={sec.id} className="py-2.5 flex items-start gap-2.5">
                      <span className="text-[#B8924A] shrink-0 mt-0.5">
                        {renderOverviewSectionIcon(sec.id)}
                      </span>
                      <div className="min-w-0">
                        <div className="font-display font-bold text-sm text-[#0F3D2E]">
                          {sec.title}
                        </div>
                        <p className="text-xs text-[#425B51] mt-0.5 leading-relaxed">
                          {sec.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[5px] bg-[#0F3D2E] border border-[#B8924A] p-4 text-center">
                <p className="font-arabic text-sm text-[#D9B96A] leading-relaxed">
                  {APP_OVERVIEW.closingLine}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Adhan Settings Row */}
        {onOpenAdhanSettings && (
          <div className="mt-3 pt-2.5 border-t border-[#B8924A]/30 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <MinaretAdhanIcon className="w-4 h-4 text-[#0F3D2E] shrink-0" />
              <span className="text-xs font-bold text-[#0F3D2E] truncate">
                الأذان ومواقيت الصلاة وصلاة الليل
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenAdhanSettings}
              className="min-h-[38px] px-3.5 py-1.5 btn-manuscript text-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>إعدادات الأذان</span>
            </button>
          </div>
        )}

        {/* Version & Manual Update Check Row (Preserved from Task 1) */}
        <div className="mt-3 pt-2.5 border-t border-[#B8924A]/30 flex flex-col gap-1.5 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-[#0F3D2E]">
              رقم الإصدار الحالي: <span dir="ltr">v{currentVersion}</span>
            </span>
            <button
              type="button"
              onClick={handleManualUpdateCheck}
              disabled={checkingUpdate}
              className="min-h-[36px] px-3.5 py-1 btn-emerald disabled:opacity-60 text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#D9B96A] ${
                  checkingUpdate ? 'animate-spin' : ''
                }`}
                aria-hidden="true"
              />
              <span>
                {checkingUpdate ? 'جارٍ التحقق...' : 'التحقق من التحديث يدوياً'}
              </span>
            </button>
          </div>
          {updateFeedback && (
            <p className="text-[11px] font-semibold text-[#1F6B50]">
              {updateFeedback}
            </p>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-[#B8924A]/30 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
          {onOpenWelcome ? (
            <button
              type="button"
              onClick={onOpenWelcome}
              className="w-full sm:w-auto min-h-[42px] px-4 py-2 btn-manuscript text-xs sm:text-sm flex items-center justify-center cursor-pointer"
            >
              عرض شاشة الدخول الترحيبية
            </button>
          ) : (
            <span className="hidden sm:block" />
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[42px] px-6 py-2 btn-gilded text-sm cursor-pointer"
          >
            إغلاق وحفظ
          </button>
        </div>
      </div>
    </div>
  );
};
