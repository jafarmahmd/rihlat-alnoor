import { DEFAULT_MUEZZIN_RAW_NAME, getMuezzinByRawName } from '../config/muezzins';

export type PrayerAlertKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export const PRAYER_ALERT_KEYS: readonly PrayerAlertKey[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
] as const;

export const PRAYER_LABELS_AR: Record<PrayerAlertKey, string> = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

export type CalculationMethodId =
  | 'jafari'
  | 'tehran'
  | 'muslimWorldLeague'
  | 'ummAlQura'
  | 'egyptian'
  | 'karachi'
  | 'custom';

export interface CalculationMethodPreset {
  id: CalculationMethodId;
  labelAr: string;
  shortDescAr: string;
  fajrAngle: number;
  maghribAngle: number;
  ishaAngle: number;
}

export const CALCULATION_METHOD_PRESETS: readonly CalculationMethodPreset[] = [
  {
    id: 'jafari',
    labelAr: 'الشيعة الاثنا عشرية (الجعفري — لواء قم)',
    shortDescAr: 'الفجر ١٦° · المغرب ٤° · العشاء ١٤°',
    fajrAngle: 16,
    maghribAngle: 4,
    ishaAngle: 14,
  },
  {
    id: 'tehran',
    labelAr: 'معهد الجيوفيزياء — جامعة طهران',
    shortDescAr: 'الفجر ١٧٫٧° · المغرب ٤٫٥° · العشاء ١٤°',
    fajrAngle: 17.7,
    maghribAngle: 4.5,
    ishaAngle: 14,
  },
  {
    id: 'muslimWorldLeague',
    labelAr: 'رابطة العالم الإسلامي',
    shortDescAr: 'الفجر ١٨° · العشاء ١٧°',
    fajrAngle: 18,
    maghribAngle: 0,
    ishaAngle: 17,
  },
  {
    id: 'ummAlQura',
    labelAr: 'تقويم أم القرى (مكة المكرمة)',
    shortDescAr: 'الفجر ١٨٫٥° · العشاء بعد المغرب بـ ٩٠ دقيقة',
    fajrAngle: 18.5,
    maghribAngle: 0,
    ishaAngle: 0,
  },
  {
    id: 'egyptian',
    labelAr: 'الهيئة المصرية العامة للمساحة',
    shortDescAr: 'الفجر ١٩٫٥° · العشاء ١٧٫٥°',
    fajrAngle: 19.5,
    maghribAngle: 0,
    ishaAngle: 17.5,
  },
  {
    id: 'karachi',
    labelAr: 'جامعة العلوم الإسلامية — كراتشي',
    shortDescAr: 'الفجر ١٨° · العشاء ١٨°',
    fajrAngle: 18,
    maghribAngle: 0,
    ishaAngle: 18,
  },
  {
    id: 'custom',
    labelAr: 'درجات يدوية مخصصة',
    shortDescAr: 'تحديد زوايا الفجر والمغرب والعشاء يدوياً',
    fajrAngle: 16,
    maghribAngle: 4,
    ishaAngle: 14,
  },
];

export type PrayerAlertMode = 'adhan' | 'silent';
export type SalatAlLaylSoundMode = 'adhan' | 'gentle' | 'silent';

export interface SinglePrayerAdhanConfig {
  enabled: boolean;
  alertMode: PrayerAlertMode;
  muezzinRawName: string;
  preReminderMinutes: number; // 0 = معطل، أو 5، 10، 15، 20، 30
  adjustmentMinutes: number; // تعديل يدوي بالدقائق (-60 إلى +60)
}

export interface SalatAlLaylConfig {
  enabled: boolean;
  /** محصور بين 22:00 و 00:00 (أو 23:59) */
  timeHHMM: string;
  soundType: SalatAlLaylSoundMode;
  muezzinRawName: string;
}

export interface CustomCalculationAngles {
  fajrAngle: number;
  maghribAngle: number;
  ishaAngle: number;
}

export interface AdhanSettings {
  methodId: CalculationMethodId;
  customAngles: CustomCalculationAngles;
  prayers: Record<PrayerAlertKey, SinglePrayerAdhanConfig>;
  salatAlLayl: SalatAlLaylConfig;
  /** السماح باستمرار ظهور الإشعارات والتنبيهات حتى في وقت الأذان */
  allowNotificationsDuringAdhan: boolean;
}

export interface AdhanScheduleMeta {
  lastScheduledAt: number | null;
  scheduledCount: number;
  missingRawFiles: string[];
  engine: 'native-foreground' | 'local-notifications' | 'web';
}

const ADHAN_SETTINGS_STORAGE_KEY = 'rihlat_alnoor_adhan_settings_v1';
const ADHAN_META_STORAGE_KEY = 'rihlat_alnoor_adhan_meta_v1';

export const PRE_REMINDER_OPTIONS: readonly number[] = [0, 5, 10, 15, 20, 30];

export const DEFAULT_ADHAN_SETTINGS: AdhanSettings = {
  methodId: 'jafari',
  customAngles: {
    fajrAngle: 16,
    maghribAngle: 4,
    ishaAngle: 14,
  },
  prayers: {
    fajr: {
      enabled: true,
      alertMode: 'adhan',
      muezzinRawName: DEFAULT_MUEZZIN_RAW_NAME,
      preReminderMinutes: 0,
      adjustmentMinutes: 0,
    },
    dhuhr: {
      enabled: true,
      alertMode: 'adhan',
      muezzinRawName: DEFAULT_MUEZZIN_RAW_NAME,
      preReminderMinutes: 0,
      adjustmentMinutes: 0,
    },
    asr: {
      enabled: false,
      alertMode: 'silent',
      muezzinRawName: DEFAULT_MUEZZIN_RAW_NAME,
      preReminderMinutes: 0,
      adjustmentMinutes: 0,
    },
    maghrib: {
      enabled: true,
      alertMode: 'adhan',
      muezzinRawName: DEFAULT_MUEZZIN_RAW_NAME,
      preReminderMinutes: 0,
      adjustmentMinutes: 0,
    },
    isha: {
      enabled: false,
      alertMode: 'silent',
      muezzinRawName: DEFAULT_MUEZZIN_RAW_NAME,
      preReminderMinutes: 0,
      adjustmentMinutes: 0,
    },
  },
  salatAlLayl: {
    enabled: false,
    timeHHMM: '23:30',
    soundType: 'gentle',
    muezzinRawName: DEFAULT_MUEZZIN_RAW_NAME,
  },
  allowNotificationsDuringAdhan: true,
};

/**
 * يحصر وقت تذكير صلاة الليل ضمن النطاق المحدد:
 * من 10:00 مساءً (22:00) إلى 12:00 منتصف الليل (00:00) فقط.
 */
export function clampSalatAlLaylTime(hhmm: string): string {
  const match = String(hhmm || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '23:30';
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return '23:30';

  if (h === 0 && m === 0) return '00:00';
  if (h === 22 || h === 23) {
    const safeMin = Math.max(0, Math.min(59, Math.round(m)));
    return `${String(h).padStart(2, '0')}:${String(safeMin).padStart(2, '0')}`;
  }
  if (h >= 0 && h < 12) {
    return '00:00';
  }
  return '22:00';
}

function clampAngle(val: unknown, fallback: number, min = 0, max = 25): number {
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.round(Math.max(min, Math.min(max, n)) * 10) / 10;
}

function clampAdjustment(val: unknown): number {
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-60, Math.min(60, Math.round(n)));
}

export function loadAdhanSettings(): AdhanSettings {
  if (typeof window === 'undefined') return DEFAULT_ADHAN_SETTINGS;
  try {
    const raw = window.localStorage.getItem(ADHAN_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_ADHAN_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AdhanSettings>;

    const methodExists = CALCULATION_METHOD_PRESETS.some(
      (m) => m.id === parsed.methodId
    );
    const methodId: CalculationMethodId = methodExists
      ? (parsed.methodId as CalculationMethodId)
      : 'jafari';

    const customAngles: CustomCalculationAngles = {
      fajrAngle: clampAngle(parsed.customAngles?.fajrAngle, 16, 10, 24),
      maghribAngle: clampAngle(parsed.customAngles?.maghribAngle, 4, 0, 12),
      ishaAngle: clampAngle(parsed.customAngles?.ishaAngle, 14, 10, 24),
    };

    const prayers = { ...DEFAULT_ADHAN_SETTINGS.prayers };
    for (const key of PRAYER_ALERT_KEYS) {
      const def = DEFAULT_ADHAN_SETTINGS.prayers[key];
      const inc = parsed.prayers?.[key];
      const validMuezzin = getMuezzinByRawName(
        inc?.muezzinRawName || def.muezzinRawName
      ).rawName;
      prayers[key] = {
        enabled: typeof inc?.enabled === 'boolean' ? inc.enabled : def.enabled,
        alertMode: inc?.alertMode === 'silent' ? 'silent' : 'adhan',
        muezzinRawName: validMuezzin,
        preReminderMinutes: PRE_REMINDER_OPTIONS.includes(
          Number(inc?.preReminderMinutes)
        )
          ? Number(inc?.preReminderMinutes)
          : def.preReminderMinutes,
        adjustmentMinutes: clampAdjustment(inc?.adjustmentMinutes),
      };
    }

    const laylInc = parsed.salatAlLayl;
    const salatAlLayl: SalatAlLaylConfig = {
      enabled:
        typeof laylInc?.enabled === 'boolean'
          ? laylInc.enabled
          : DEFAULT_ADHAN_SETTINGS.salatAlLayl.enabled,
      timeHHMM: clampSalatAlLaylTime(
        laylInc?.timeHHMM || DEFAULT_ADHAN_SETTINGS.salatAlLayl.timeHHMM
      ),
      soundType:
        laylInc?.soundType === 'adhan' ||
        laylInc?.soundType === 'gentle' ||
        laylInc?.soundType === 'silent'
          ? laylInc.soundType
          : DEFAULT_ADHAN_SETTINGS.salatAlLayl.soundType,
      muezzinRawName: getMuezzinByRawName(
        laylInc?.muezzinRawName || DEFAULT_MUEZZIN_RAW_NAME
      ).rawName,
    };

    return {
      methodId,
      customAngles,
      prayers,
      salatAlLayl,
      allowNotificationsDuringAdhan:
        typeof parsed.allowNotificationsDuringAdhan === 'boolean'
          ? parsed.allowNotificationsDuringAdhan
          : DEFAULT_ADHAN_SETTINGS.allowNotificationsDuringAdhan,
    };
  } catch {
    return DEFAULT_ADHAN_SETTINGS;
  }
}

export function saveAdhanSettings(settings: AdhanSettings): void {
  if (typeof window === 'undefined') return;
  try {
    const normalized: AdhanSettings = {
      ...settings,
      salatAlLayl: {
        ...settings.salatAlLayl,
        timeHHMM: clampSalatAlLaylTime(settings.salatAlLayl.timeHHMM),
      },
    };
    window.localStorage.setItem(
      ADHAN_SETTINGS_STORAGE_KEY,
      JSON.stringify(normalized)
    );
    window.dispatchEvent(new CustomEvent('rihlat:adhan-settings-updated'));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadAdhanScheduleMeta(): AdhanScheduleMeta {
  if (typeof window === 'undefined') {
    return {
      lastScheduledAt: null,
      scheduledCount: 0,
      missingRawFiles: [],
      engine: 'web',
    };
  }
  try {
    const raw = window.localStorage.getItem(ADHAN_META_STORAGE_KEY);
    if (!raw) {
      return {
        lastScheduledAt: null,
        scheduledCount: 0,
        missingRawFiles: [],
        engine: 'web',
      };
    }
    const parsed = JSON.parse(raw) as Partial<AdhanScheduleMeta>;
    return {
      lastScheduledAt:
        typeof parsed.lastScheduledAt === 'number' ? parsed.lastScheduledAt : null,
      scheduledCount:
        typeof parsed.scheduledCount === 'number' ? parsed.scheduledCount : 0,
      missingRawFiles: Array.isArray(parsed.missingRawFiles)
        ? parsed.missingRawFiles.filter((x): x is string => typeof x === 'string')
        : [],
      engine:
        parsed.engine === 'native-foreground' ||
        parsed.engine === 'local-notifications' ||
        parsed.engine === 'web'
          ? parsed.engine
          : 'web',
    };
  } catch {
    return {
      lastScheduledAt: null,
      scheduledCount: 0,
      missingRawFiles: [],
      engine: 'web',
    };
  }
}

export function saveAdhanScheduleMeta(meta: AdhanScheduleMeta): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ADHAN_META_STORAGE_KEY, JSON.stringify(meta));
    window.dispatchEvent(new CustomEvent('rihlat:adhan-meta-updated'));
  } catch {
    // Ignore storage quota errors
  }
}
