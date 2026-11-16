import { DigitalLibrarySection } from '../types/game';

export interface DaySpiritualGuidance {
  dayIndex: number; // 0 (Sun) to 6 (Sat)
  dayNameAr: string;
  badge: string;
  title: string;
  shortSummary: string;
  recommendedActs: string[];
  primaryDuaTitle: string;
  linkedSection: DigitalLibrarySection | 'library' | 'tasbih' | 'duas' | 'munajat';
  linkedEntryId?: string;
  linkedLabel: string;
}

export const WEEKLY_SPIRITUAL_GUIDANCE: DaySpiritualGuidance[] = [
  {
    dayIndex: 0, // Sunday
    dayNameAr: 'الأحد',
    badge: 'يوم أمير المؤمنين (ع)',
    title: 'مستحبات يوم الأحد وزيارة أمير المؤمنين (ع)',
    shortSummary:
      'بداية يوم مبارك مخصص لأمير المؤمنين علي بن أبي طالب (عليه السلام) وتسبيح الزهراء (ع).',
    recommendedActs: [
      'قراءة دعاء يوم الأحد من أدعية الأيام السبعة',
      'زيارة أمير المؤمنين (ع) الشريفة وزيارة أمين الله',
      'التسبيح بمسبحة الزهراء (ع) في واحة التسبيح',
      'صلة الرحم والإحسان إلى الوالدين والأهل',
    ],
    primaryDuaTitle: 'دعاء يوم الأحد وزيارة أمين الله',
    linkedSection: 'adiyat',
    linkedEntryId: 'dua-sunday',
    linkedLabel: 'اقرأ دعاء يوم الأحد',
  },
  {
    dayIndex: 1, // Monday
    dayNameAr: 'الإثنين',
    badge: 'يوم السبطين (ع)',
    title: 'مستحبات يوم الإثنين وزيارة الإمامين الحسن والحسين (ع)',
    shortSummary:
      'يوم ريحانتي رسول الله؛ يستحب فيه الصيام وزيارة السبطين الشهيدين (عليهما السلام).',
    recommendedActs: [
      'قراءة دعاء يوم الإثنين المأثور',
      'زيارة الإمام الحسن المجتبى والإمام الحسين (عليهما السلام)',
      'صيام يوم الإثنين قربةً إلى الله تعالى لمن استطاع',
      'التصدق بصدقة الصباح لحفظ الأهل والمسلمين',
    ],
    primaryDuaTitle: 'دعاء يوم الإثنين وزيارة السبطين',
    linkedSection: 'adiyat',
    linkedEntryId: 'dua-monday',
    linkedLabel: 'اقرأ دعاء يوم الإثنين',
  },
  {
    dayIndex: 2, // Tuesday
    dayNameAr: 'الثلاثاء',
    badge: 'يوم السجاد والباقر والصادق (ع)',
    title: 'مستحبات يوم الثلاثاء والصحيفة السجادية',
    shortSummary:
      'يوم الأئمة زين العابدين والباقر والصادق (ع)؛ محطة الاستغفار ومناجاة التائبين.',
    recommendedActs: [
      'قراءة دعاء يوم الثلاثاء المأثور',
      'زيارة أئمة البقيع: السجاد والباقر والصادق (عليهم السلام)',
      'قراءة مناجاة التائبين من الصحيفة السجادية',
      'طلب المغفرة والإكثار من ذكر «أستغفر الله ربي وأتوب إليه»',
    ],
    primaryDuaTitle: 'دعاء يوم الثلاثاء ومناجاة التائبين',
    linkedSection: 'munajat',
    linkedEntryId: 'munajat-1',
    linkedLabel: 'اقرأ مناجاة التائبين',
  },
  {
    dayIndex: 3, // Wednesday
    dayNameAr: 'الأربعاء',
    badge: 'يوم الكاظم والرضا والجواد والهادي (ع)',
    title: 'مستحبات يوم الأربعاء وباب الحوائج',
    shortSummary:
      'يوم مخصص لأربعة من أئمة الهدى (الكاظم والرضا والجواد والهادي عليهم السلام).',
    recommendedActs: [
      'قراءة دعاء يوم الأربعاء المبارك',
      'زيارة الإمام الكاظم والإمام الرضا والإمام الجواد والإمام الهادي (ع)',
      'التوسل لقضاء الحوائج وطلب العلم والبركة في الرزق',
      'إدخال السرور على الأطفال وإطعام مسكين',
    ],
    primaryDuaTitle: 'دعاء يوم الأربعاء وزيارة الرضا والكاظمين',
    linkedSection: 'adiyat',
    linkedEntryId: 'dua-wednesday',
    linkedLabel: 'اقرأ دعاء يوم الأربعاء',
  },
  {
    dayIndex: 4, // Thursday
    dayNameAr: 'الخميس',
    badge: 'ليلة الجمعة ودعاء كميل',
    title: 'مستحبات يوم وليلة الخميس — قراءة دعاء كميل وزيارة وارث',
    shortSummary:
      'يوم مبارك تتوجه فيه القلوب إلى ليلة الجمعة؛ من أرجى الأوقات لإجابة الدعاء وغفران الذنوب بدعاء كميل.',
    recommendedActs: [
      'قراءة دعاء كميل بن زياد ليلة الجمعة بخشوع وتدبر',
      'قراءة دعاء يوم الخميس وزيارة الإمام الحسين (عليه السلام)',
      'الإكثار من الصلاة على محمد وآل محمد (اللهم صل على محمد وآل محمد)',
      'الاستغفار للأموات وقراءة الفاتحة على أرواحهم والصدقة',
      'قراءة سورة يس وسورة الواقعة في ليلة الجمعة',
    ],
    primaryDuaTitle: 'دعاء كميل بن زياد وزيارة وارث',
    linkedSection: 'adiyat',
    linkedEntryId: 'dl-dua-kumayl',
    linkedLabel: 'اقرأ دعاء كميل الآن',
  },
  {
    dayIndex: 5, // Friday
    dayNameAr: 'الجمعة',
    badge: 'سيد الأيام ويوم الفرج',
    title: 'مستحبات يوم الجمعة — دعاء الندبة وزيارة آل ياسين',
    shortSummary:
      'أفضل أيام الأسبوع وأشرفها؛ عيد المسلمين ويوم صاحب الزمان الإمام المهدي (عجل الله فرجه).',
    recommendedActs: [
      'قراءة دعاء الندبة صباح يوم الجمعة شوقاً للعدل الإلهي',
      'قراءة زيارة آل ياسين الشريفة لتجديد البيعة',
      'غسل الجمعة المستحب والتطيب ولبس الثياب النظيفة',
      'الإكثار من الصلاة على محمد وآل محمد (١٠٠ مرة على الأقل)',
      'قراءة سورة الكهف وسورة الجمعة وسورة الرحمن',
      'قراءة دعاء السمات في آخر ساعة من نهار الجمعة',
    ],
    primaryDuaTitle: 'دعاء الندبة وزيارة آل ياسين',
    linkedSection: 'adiyat',
    linkedEntryId: 'dl-dua-nudba',
    linkedLabel: 'اقرأ دعاء الندبة الآن',
  },
  {
    dayIndex: 6, // Saturday
    dayNameAr: 'السبت',
    badge: 'يوم النبي الأكرم (ص)',
    title: 'مستحبات يوم السبت وزيارة النبي الأعظم (ﷺ)',
    shortSummary:
      'استهلال أسبوع جديد بذكرى رسول الله محمد (ﷺ) والتخلق بأخلاقه النبيلة.',
    recommendedActs: [
      'قراءة دعاء يوم السبت المبارك',
      'زيارة النبي محمد (ﷺ) المأثورة',
      'تلاوة آيات من القرآن الكريم وقراءة قصص الأنبياء وأهل البيت',
      'بدء الأسبوع بنية صالحة وبر الوالدين',
    ],
    primaryDuaTitle: 'دعاء يوم السبت وزيارة النبي (ﷺ)',
    linkedSection: 'adiyat',
    linkedEntryId: 'dua-saturday',
    linkedLabel: 'اقرأ دعاء يوم السبت',
  },
];

export interface ReminderTimePreset {
  value: string;
  label: string;
  badge?: string;
}

export const REMINDER_TIME_PRESETS: ReminderTimePreset[] = [
  {
    value: '00:05',
    label: '12:05 ص — بداية اليوم الجديد (بعد منتصف الليل مباشرة)',
    badge: 'موصى به',
  },
  {
    value: '00:30',
    label: '12:30 ص — ما وراء منتصف الليل',
  },
  {
    value: '05:00',
    label: '05:00 ص — مع وقت الفجر وبداية الصباح',
  },
  {
    value: '08:00',
    label: '08:00 ص — الصباح',
  },
  {
    value: '12:30',
    label: '12:30 م — وقت الظهر',
  },
  {
    value: '16:30',
    label: '04:30 م — وقت العصر',
  },
  {
    value: '19:00',
    label: '07:00 م — بعد المغرب (ليلة الجمعة ودعاء كميل)',
  },
  {
    value: '20:00',
    label: '08:00 م — المساء',
  },
];

export interface SpiritualNotificationSettings {
  enabled: boolean;
  reminderTime: string; // "HH:MM" 24-hour format, default "00:05" (after 12 AM)
  enabledDays: Record<number, boolean>;
  soundEnabled: boolean;
  includeHijriOccasions: boolean;
  inAppToastEnabled: boolean;
  lastNotifiedDate: string; // YYYY-MM-DD
}

export const NOTIFICATION_STORAGE_KEY = 'rihlat_alnoor_spiritual_notifications_v2';
const LEGACY_NOTIFICATION_STORAGE_KEY = 'rihlat_alnoor_spiritual_notifications_v1';

export const DEFAULT_NOTIFICATION_SETTINGS: SpiritualNotificationSettings = {
  enabled: true,
  reminderTime: '00:05', // Start of every new day (just after 12:00 AM)
  enabledDays: {
    0: true, // Sun
    1: true, // Mon
    2: true, // Tue
    3: true, // Wed
    4: true, // Thu (Dua Kumayl)
    5: true, // Fri (Dua Nudba)
    6: true, // Sat
  },
  soundEnabled: true,
  includeHijriOccasions: true,
  inAppToastEnabled: true,
  lastNotifiedDate: '',
};

export function loadNotificationSettings(): SpiritualNotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SpiritualNotificationSettings>;
      return {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...parsed,
        enabledDays: {
          ...DEFAULT_NOTIFICATION_SETTINGS.enabledDays,
          ...(parsed.enabledDays || {}),
        },
      };
    }

    // Migrate legacy v1 settings cleanly while adopting the new 00:05 start-of-day default
    const legacyRaw = window.localStorage.getItem(LEGACY_NOTIFICATION_STORAGE_KEY);
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw) as Partial<SpiritualNotificationSettings>;
      const migrated: SpiritualNotificationSettings = {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        enabled:
          typeof legacyParsed.enabled === 'boolean'
            ? legacyParsed.enabled
            : true,
        soundEnabled:
          typeof legacyParsed.soundEnabled === 'boolean'
            ? legacyParsed.soundEnabled
            : true,
        enabledDays: {
          ...DEFAULT_NOTIFICATION_SETTINGS.enabledDays,
          ...(legacyParsed.enabledDays || {}),
        },
        reminderTime: '00:05',
        lastNotifiedDate: '',
      };
      saveNotificationSettings(migrated);
      return migrated;
    }

    return DEFAULT_NOTIFICATION_SETTINGS;
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export function saveNotificationSettings(settings: SpiritualNotificationSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('rihlat:notification-settings-updated'));
  } catch {
    // Ignore storage errors
  }
}

export function getTodaySpiritualGuidance(date: Date = new Date()): DaySpiritualGuidance {
  const day = date.getDay(); // 0..6
  return WEEKLY_SPIRITUAL_GUIDANCE[day] || WEEKLY_SPIRITUAL_GUIDANCE[4];
}

export function formatTimeArabic12h(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const period = h < 12 ? 'ص' : 'م';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}
