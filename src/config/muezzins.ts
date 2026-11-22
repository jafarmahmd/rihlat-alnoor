export interface MuezzinEntry {
  /** الاسم المعروض بالعربية */
  displayName: string;
  /** اسم الملف في android/app/src/main/res/raw بدون الامتداد (حروف إنجليزية صغيرة وأرقام و _ فقط) */
  rawName: string;
  /** المدة التقريبية للمقطع */
  durationLabel: string;
  /** الرمز المرجعي لتمييز المؤذن */
  refCode: string;
  /** المسار المحلي للملف الصوتي لتشغيله داخل التطبيق بدون إنترنت */
  localAudioPath: string;
}

/**
 * القائمة الموحدة للمؤذنين بالترتيب المعتمد.
 * لإضافة مؤذن جديد: أضف سطراً واحداً هنا فقط، ثم ضع ملف <rawName>.mp3 في res/raw و public/assets/aistudio/.
 */
export const MUEZZIN_ENTRIES: readonly MuezzinEntry[] = [
  { displayName: 'ميثم التمار', rawName: 'maytham_altammar', durationLabel: '7:02', refCode: 'rBs5V', localAudioPath: '/assets/aistudio/maytham_altammar_bc42705d.mp3' },
  { displayName: 'فريد النجفي', rawName: 'farid_alnajafi', durationLabel: '4:11', refCode: 'pxKYe', localAudioPath: '/assets/aistudio/farid_alnajafi_197dbbcc.mp3' },
  { displayName: 'بلاسم جليل', rawName: 'balasem_jalil', durationLabel: '5:49', refCode: 'KNYob', localAudioPath: '/assets/aistudio/balasem_jalil_44e27923.mp3' },
  { displayName: 'أباذر الحلواجي', rawName: 'abather_alhalwaji', durationLabel: '5:16', refCode: '0wonG', localAudioPath: '/assets/aistudio/abather_alhalwaji_0bed6602.mp3' },
  { displayName: 'عامر الكاظمي', rawName: 'amer_alkadhimi', durationLabel: '4:20', refCode: '8h6nr', localAudioPath: '/assets/aistudio/amer_alkadhimi_081283b8.mp3' },
  { displayName: 'الحاج مصطفى الصراف', rawName: 'mustafa_alsarraf', durationLabel: '5:10', refCode: 'ym6tb', localAudioPath: '/assets/aistudio/mustafa_alsarraf_72fc2cc7.mp3' },
  { displayName: 'الشيخ شبر المعلة', rawName: 'shubbar_almualla', durationLabel: '8:22', refCode: 'qng16', localAudioPath: '/assets/aistudio/qng16n_ff7ee017.mp3' },
] as const;

export const DEFAULT_MUEZZIN_RAW_NAME = MUEZZIN_ENTRIES[0].rawName;

export function isValidRawResourceName(rawName: string): boolean {
  return /^[a-z0-9_]+$/.test(rawName);
}

export function getMuezzinByRawName(rawName: string): MuezzinEntry {
  return (
    MUEZZIN_ENTRIES.find((m) => m.rawName === rawName) || MUEZZIN_ENTRIES[0]
  );
}

export const ADHAN_CHANNEL_VERSION = 'v2';

export function getAdhanChannelIdForMuezzin(rawName: string): string {
  const safeName = isValidRawResourceName(rawName)
    ? rawName
    : DEFAULT_MUEZZIN_RAW_NAME;
  return `adhan_${ADHAN_CHANNEL_VERSION}_${safeName}`;
}
