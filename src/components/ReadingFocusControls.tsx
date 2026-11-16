import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookHeart,
  BookOpen,
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  Gamepad2,
  Info,
  Palette,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { OFFICIAL_LOGO_URL } from './RihlatLogo';
import { APP_OVERVIEW } from '../data/appOverview';

export type ReadingFocusTheme = 'emerald' | 'amber' | 'slate';

export interface ReadingFocusSettings {
  enabled: boolean;
  theme: ReadingFocusTheme;
}

const FOCUS_SETTINGS_STORAGE_KEY = 'rihlat_alnoor_reading_focus_v1';

export const DEFAULT_READING_FOCUS_SETTINGS: ReadingFocusSettings = {
  enabled: true,
  theme: 'emerald',
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
      enabled:
        typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
      theme: validTheme,
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
    label: 'زمردي داكن',
    description: 'أخضر زمردي عميق ومريح للعين',
    swatchClass: 'bg-[#064E3B] border-emerald-700',
    lightActiveClass:
      'bg-[#064E3B] text-amber-50 ring-2 ring-emerald-900/30 shadow-md shadow-emerald-950/20',
    nightActiveClass:
      'bg-emerald-950 text-emerald-50 ring-2 ring-emerald-400/75 shadow-lg shadow-emerald-950/70',
    ayahBadgeActiveClass:
      'bg-amber-400/25 text-amber-200 border-amber-300/65',
  },
  {
    id: 'amber',
    label: 'كهرماني داكن',
    description: 'بني ذهبي دافئ للقراءة الهادئة',
    swatchClass: 'bg-[#5C2D0C] border-amber-800',
    lightActiveClass:
      'bg-[#5C2D0C] text-amber-50 ring-2 ring-amber-900/35 shadow-md shadow-amber-950/20',
    nightActiveClass:
      'bg-[#3E1F08] text-amber-100 ring-2 ring-amber-400/80 shadow-lg shadow-amber-950/70',
    ayahBadgeActiveClass:
      'bg-amber-300/25 text-amber-100 border-amber-200/70',
  },
  {
    id: 'slate',
    label: 'ليلي داكن',
    description: 'أردوازي عميق بتباين عالٍ جداً',
    swatchClass: 'bg-[#1E293B] border-slate-700',
    lightActiveClass:
      'bg-[#1E293B] text-slate-50 ring-2 ring-slate-900/35 shadow-md shadow-slate-950/20',
    nightActiveClass:
      'bg-slate-950 text-sky-50 ring-2 ring-sky-400/75 shadow-lg shadow-slate-950/80',
    ayahBadgeActiveClass:
      'bg-sky-400/25 text-sky-100 border-sky-300/65',
  },
];

export function getReadingFocusThemeConfig(
  theme: ReadingFocusTheme
): ReadingFocusThemeConfig {
  return (
    READING_FOCUS_THEMES.find((t) => t.id === theme) || READING_FOCUS_THEMES[0]
  );
}

/**
 * Splits a vocalized Arabic paragraph losslessly into readable 1–2 line clauses.
 * Guaranteed invariant: splitIntoReadableLines(text).join('') === text
 */
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
    return `inline box-decoration-clone rounded-xl px-2 py-0.5 transition-all duration-150 cursor-pointer ${
      nightMode ? themeConfig.nightActiveClass : themeConfig.lightActiveClass
    }`;
  }

  return `inline box-decoration-clone rounded-xl px-1 py-0.5 transition-all duration-150 cursor-pointer ${
    nightMode
      ? 'text-amber-50/70 hover:text-amber-50 hover:bg-slate-800/70'
      : 'text-slate-900/75 hover:text-slate-950 hover:bg-emerald-950/10'
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

function saveReadingPositionForKey(itemKey: string, index: number): void {
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

  // Restore saved reading position whenever item or loaded unitCount becomes ready
  useEffect(() => {
    if (unitCount <= 0) return;

    const saved = getSavedReadingPosition(itemKey);
    const clamped = Math.max(0, Math.min(unitCount - 1, saved));
    setActiveUnitIndex(clamped);

    const restoreSignature = `${itemKey}:${unitCount}`;
    if (clamped > 0 && restoredForKeyRef.current !== restoreSignature) {
      restoredForKeyRef.current = restoreSignature;
      programmaticScrollUntilRef.current = Date.now() + 900;
      const timer = window.setTimeout(() => {
        scrollUnitIntoView(clamped);
      }, 120);
      return () => window.clearTimeout(timer);
    }
    restoredForKeyRef.current = restoreSignature;
  }, [itemKey, unitCount, scrollUnitIntoView]);

  // Persist activeUnitIndex whenever user advances or clicks an ayah/line
  useEffect(() => {
    if (unitCount <= 0) return;
    if (Date.now() < programmaticScrollUntilRef.current - 300) return;
    saveReadingPositionForKey(itemKey, activeUnitIndex);
  }, [itemKey, activeUnitIndex, unitCount]);

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
    if (unitCount <= 1) return;

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
  }, [unitCount, itemKey, contentRef]);

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
}

function renderOverviewSectionIcon(id: string) {
  switch (id) {
    case 'quran':
      return <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />;
    case 'adiyat':
      return <BookHeart className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />;
    case 'sahifa':
      return <ScrollText className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />;
    case 'stories-games':
      return <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />;
    case 'tasbih':
      return <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />;
    case 'calendar':
    default:
      return <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />;
  }
}

export const ReadingSettingsModal: React.FC<ReadingSettingsModalProps> = ({
  isOpen,
  settings,
  onChange,
  onClose,
  onOpenWelcome,
}) => {
  const [activeTab, setActiveTab] = useState<'reading' | 'overview'>('reading');

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
      className="fixed inset-0 z-50 bg-emerald-950/55 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reading-settings-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-emerald-200 shadow-2xl text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-emerald-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0">
              {activeTab === 'reading' ? (
                <Palette className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Info className="w-5 h-5" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <h2
                id="reading-settings-title"
                className="font-display font-black text-lg sm:text-xl text-emerald-950 truncate flex items-center gap-1.5"
              >
                <Settings className="w-4 h-4 text-emerald-700 shrink-0 hidden sm:inline" aria-hidden="true" />
                <span>الإعدادات</span>
              </h2>
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 truncate">
                إعدادات القراءة والتغميق · اللمحة العامة عن التطبيق
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق الإعدادات"
            className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Clean 2-Tab Switcher */}
        <div
          role="tablist"
          aria-label="أقسام الإعدادات"
          className="grid grid-cols-2 gap-1.5 mt-3.5 p-1 rounded-2xl bg-emerald-50 border border-emerald-100 shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'reading'}
            onClick={() => setActiveTab('reading')}
            className={`min-h-[42px] px-2 sm:px-3 py-2 rounded-xl font-display font-extrabold text-[11px] sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'reading'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-emerald-900 hover:bg-white/80'
            }`}
          >
            <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">إعدادات القراءة والتغميق</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            className={`min-h-[42px] px-2 sm:px-3 py-2 rounded-xl font-display font-extrabold text-[11px] sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-emerald-900 hover:bg-white/80'
            }`}
          >
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">اللمحة العامة عن التطبيق</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4 overflow-y-auto flex-1 pr-0.5">
          {activeTab === 'reading' ? (
            <>
              {/* Enable / Disable Toggle */}
              <button
                type="button"
                onClick={() =>
                  onChange({ ...settings, enabled: !settings.enabled })
                }
                aria-pressed={settings.enabled}
                className={`w-full p-3.5 sm:p-4 rounded-2xl border-2 flex items-center justify-between gap-3 cursor-pointer transition-all text-right ${
                  settings.enabled
                    ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-start gap-2.5 sm:gap-3">
                  {settings.enabled ? (
                    <Eye
                      className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  ) : (
                    <EyeOff
                      className="w-5 h-5 text-slate-500 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  )}
                  <div>
                    <div className="font-display font-extrabold text-sm sm:text-base">
                      تغميق السطر أو الآية عند العبور
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      يميز السطر أو الآية تلقائياً عند التمرير أو الوقوف بالمؤشر أو اللمس حتى لا تتيه العين.
                    </p>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 ${
                    settings.enabled
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {settings.enabled ? 'مفعّل' : 'متوقف'}
                </span>
              </button>

              {/* Color Presets */}
              <div className="mt-5">
                <h3 className="font-display font-extrabold text-sm text-emerald-950 mb-2.5">
                  لون تغميق السطر والآية
                </h3>

                <div className="space-y-2">
                  {READING_FOCUS_THEMES.map((item) => {
                    const selected = settings.theme === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={!settings.enabled}
                        onClick={() =>
                          onChange({ ...settings, theme: item.id })
                        }
                        aria-pressed={selected}
                        className={`w-full p-3 sm:p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all text-right cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                          selected
                            ? 'bg-emerald-50/60 border-emerald-600 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-9 h-9 rounded-xl border-2 shrink-0 ${item.swatchClass}`}
                            aria-hidden="true"
                          />
                          <div>
                            <div className="font-display font-extrabold text-sm sm:text-base text-slate-900">
                              {item.label}
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.description}
                            </div>
                          </div>
                        </div>

                        {selected && (
                          <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4" aria-hidden="true" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview */}
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/40 p-3.5 sm:p-4">
                <div className="text-xs font-extrabold text-amber-900 mb-2">
                  معاينة مباشرة لشكل التغميق:
                </div>
                <p className="font-arabic text-base sm:text-lg leading-[2.2] text-slate-900/75">
                  <span>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ، </span>
                  <span
                    className={
                      settings.enabled
                        ? `inline box-decoration-clone rounded-xl px-2 py-0.5 ${activeThemeConfig.lightActiveClass}`
                        : ''
                    }
                  >
                    إِلَهِي أَلْهِمْنَا ذِكْرَكَ فِي الْخَلَاءِ وَالْمَلَاءِ
                  </span>
                  <span> وَآنِسْنَا بِالذِّكْرِ الْخَفِيِّ.</span>
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-3.5 sm:space-y-4">
              {/* Official Brand Identity Header */}
              <div className="rounded-2xl bg-gradient-to-b from-emerald-50/90 via-white to-amber-50/40 border border-amber-200/80 p-4 sm:p-5 flex flex-col items-center text-center shadow-xs">
                <div className="w-full max-w-[200px] sm:max-w-[230px] rounded-2xl bg-white border border-slate-100 shadow-xs p-1.5">
                  <img
                    src={OFFICIAL_LOGO_URL}
                    alt="الشعار الرسمي لتطبيق رحلة النور"
                    className="w-full h-auto object-contain rounded-xl bg-white"
                  />
                </div>
                <h3 className="mt-3 font-display font-black text-lg sm:text-2xl text-emerald-950">
                  {APP_OVERVIEW.title}
                </h3>
                <p className="text-xs sm:text-sm font-extrabold text-amber-700 mt-0.5">
                  {APP_OVERVIEW.subtitle}
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100/80 border border-emerald-200 text-emerald-900 text-xs font-extrabold">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                  <span>{APP_OVERVIEW.supervision}</span>
                </div>
              </div>

              {/* About */}
              <div className="rounded-2xl bg-gradient-to-l from-emerald-50/80 via-white to-amber-50/55 border border-emerald-200 p-4">
                <h4 className="font-display font-black text-sm sm:text-base text-emerald-950">
                  {APP_OVERVIEW.aboutHeading}
                </h4>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {APP_OVERVIEW.aboutBody}
                </p>
              </div>

              {/* Core Contents & Sections */}
              <div className="rounded-2xl bg-white border border-emerald-100 p-4 space-y-3">
                <h4 className="font-display font-black text-sm sm:text-base text-emerald-950">
                  {APP_OVERVIEW.sectionsHeading}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {APP_OVERVIEW.sections.map((sec) => (
                    <div
                      key={sec.id}
                      className="rounded-2xl bg-emerald-50/50 border border-emerald-100 p-3 flex items-start gap-2.5"
                    >
                      <span className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                        {renderOverviewSectionIcon(sec.id)}
                      </span>
                      <div className="min-w-0">
                        <div className="font-display font-extrabold text-sm text-emerald-950">
                          {sec.title}
                        </div>
                        <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                          {sec.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Closing Line — Signature Emerald & Gold Banner */}
              <div className="rounded-2xl bg-[#062E26] border border-amber-400/50 p-4 text-center shadow-sm">
                <p className="font-display font-extrabold text-xs sm:text-sm text-amber-100 leading-relaxed">
                  {APP_OVERVIEW.closingLine}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-emerald-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
          {onOpenWelcome ? (
            <button
              type="button"
              onClick={onOpenWelcome}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
              <span>عرض شاشة الدخول الترحيبية</span>
            </button>
          ) : (
            <span className="hidden sm:block" />
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-extrabold text-sm cursor-pointer transition-colors"
          >
            إغلاق وحفظ
          </button>
        </div>
      </div>
    </div>
  );
};
