export type AppColorTheme = 'morning' | 'night';

export type AppArabicFontId =
  | 'default'
  | 'amiri'
  | 'cairo'
  | 'tajawal'
  | 'noto-naskh'
  | 'scheherazade';

export interface AppFontOption {
  id: AppArabicFontId;
  name: string;
  subtitle: string;
  sample: string;
  bodyFamily: string;
  displayFamily: string;
  arabicFamily: string;
}

export interface AppAppearanceSettings {
  colorTheme: AppColorTheme;
  fontId: AppArabicFontId;
}

export const APP_FONT_OPTIONS: readonly AppFontOption[] = [
  {
    id: 'default',
    name: 'الخط الافتراضي للتطبيق',
    subtitle: 'IBM Plex & Reem Kufi — خط المنصة الأصلي المتوازن',
    sample: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ · رحلة النور',
    bodyFamily: '"IBM Plex Sans Arabic", "Noto Naskh Arabic", sans-serif',
    displayFamily: '"Reem Kufi", "IBM Plex Sans Arabic", sans-serif',
    arabicFamily: '"Amiri", "Noto Naskh Arabic", serif',
  },
  {
    id: 'amiri',
    name: 'خط أميري التراثي (Amiri)',
    subtitle: 'خط نسخي كلاسيكي فخم يليق بالكتب والمخطوطات',
    sample: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ',
    bodyFamily: '"Amiri", "Noto Naskh Arabic", serif',
    displayFamily: '"Amiri", "Reem Kufi", serif',
    arabicFamily: '"Amiri", "Noto Naskh Arabic", serif',
  },
  {
    id: 'cairo',
    name: 'خط القاهرة الحديث (Cairo)',
    subtitle: 'خط عربي هندسي واضح وأنيق لشاشات الهواتف',
    sample: 'اللَّهُمَّ كُنْ لِوَلِيِّكَ الْحُجَّةِ بْنِ الْحَسَنِ',
    bodyFamily: '"Cairo", "IBM Plex Sans Arabic", sans-serif',
    displayFamily: '"Cairo", "IBM Plex Sans Arabic", sans-serif',
    arabicFamily: '"Cairo", "Noto Naskh Arabic", sans-serif',
  },
  {
    id: 'tajawal',
    name: 'خط تجوّل الهادئ (Tajawal)',
    subtitle: 'خط لطيف ناعم الحواف يريح العين في القراءة الطويلة',
    sample: 'إِلَهِي أَلْهِمْنَا ذِكْرَكَ فِي الْخَلَاءِ وَالْمَلَاءِ',
    bodyFamily: '"Tajawal", "IBM Plex Sans Arabic", sans-serif',
    displayFamily: '"Tajawal", "IBM Plex Sans Arabic", sans-serif',
    arabicFamily: '"Tajawal", "Noto Naskh Arabic", sans-serif',
  },
  {
    id: 'noto-naskh',
    name: 'خط نسخ نوتو (Noto Naskh Arabic)',
    subtitle: 'خط طباعي متزن يبرز الحركات والتشكيل بدقة عالية',
    sample: 'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ',
    bodyFamily: '"Noto Naskh Arabic", "Amiri", serif',
    displayFamily: '"Noto Naskh Arabic", "IBM Plex Sans Arabic", serif',
    arabicFamily: '"Noto Naskh Arabic", "Amiri", serif',
  },
  {
    id: 'scheherazade',
    name: 'خط شهرزاد الجديد (Scheherazade New)',
    subtitle: 'خط مطبعي أصيل واضح التشكيل للأدعية والزيارات',
    sample: 'السَّلَامُ عَلَيْكَ يَا أَبَا عَبْدِ اللَّهِ الْحُسَيْنِ',
    bodyFamily: '"Scheherazade New", "Amiri", serif',
    displayFamily: '"Scheherazade New", "Amiri", serif',
    arabicFamily: '"Scheherazade New", "Amiri", serif',
  },
] as const;

const APPEARANCE_STORAGE_KEY = 'rihlat_alnoor_appearance_v1';
const APPEARANCE_EVENT = 'rihlat:appearance-updated';

export const DEFAULT_APPEARANCE_SETTINGS: AppAppearanceSettings = {
  colorTheme: 'morning',
  fontId: 'default',
};

function isValidFontId(val: unknown): val is AppArabicFontId {
  return APP_FONT_OPTIONS.some((f) => f.id === val);
}

export function getAppFontOption(fontId: AppArabicFontId): AppFontOption {
  return (
    APP_FONT_OPTIONS.find((f) => f.id === fontId) || APP_FONT_OPTIONS[0]
  );
}

export function loadAppAppearanceSettings(): AppAppearanceSettings {
  if (typeof window === 'undefined') return DEFAULT_APPEARANCE_SETTINGS;
  try {
    const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw) return DEFAULT_APPEARANCE_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppAppearanceSettings>;
    return {
      colorTheme: parsed.colorTheme === 'night' ? 'night' : 'morning',
      fontId: isValidFontId(parsed.fontId) ? parsed.fontId : 'default',
    };
  } catch {
    return DEFAULT_APPEARANCE_SETTINGS;
  }
}

export function applyAppAppearanceToDocument(
  settings: AppAppearanceSettings
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const font = getAppFontOption(settings.fontId);

  root.dataset.theme = settings.colorTheme;
  root.dataset.appFont = settings.fontId;
  root.style.colorScheme = settings.colorTheme === 'night' ? 'dark' : 'light';

  root.style.setProperty('--app-font-body', font.bodyFamily);
  root.style.setProperty('--app-font-display', font.displayFamily);
  root.style.setProperty('--app-font-arabic', font.arabicFamily);

  const metaTheme = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]'
  );
  if (metaTheme) {
    metaTheme.content =
      settings.colorTheme === 'night' ? '#071712' : '#0F3D2E';
  }
}

export function saveAppAppearanceSettings(
  settings: AppAppearanceSettings
): void {
  applyAppAppearanceToDocument(settings);
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify(settings)
    );
  } catch {
    // Ignore storage quota errors
  }
  window.dispatchEvent(
    new CustomEvent<AppAppearanceSettings>(APPEARANCE_EVENT, {
      detail: settings,
    })
  );
}

export function isGlobalNightTheme(): boolean {
  return loadAppAppearanceSettings().colorTheme === 'night';
}

export function subscribeAppAppearance(
  cb: (settings: AppAppearanceSettings) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<AppAppearanceSettings>;
    cb(custom.detail || loadAppAppearanceSettings());
  };
  window.addEventListener(APPEARANCE_EVENT, handler);
  return () => window.removeEventListener(APPEARANCE_EVENT, handler);
}
