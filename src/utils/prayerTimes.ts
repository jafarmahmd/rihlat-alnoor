import {
  CalculationMethod,
  CalculationParameters,
  Coordinates,
  Madhab,
  PrayerTimes,
  Qibla,
  SunnahTimes,
} from 'adhan';
import {
  AdhanSettings,
  CALCULATION_METHOD_PRESETS,
  loadAdhanSettings,
} from '../data/adhanSettings';

export interface CityCoordinate {
  id: string;
  nameAr: string;
  countryAr: string;
  lat: number;
  lng: number;
  tzOffsetHours: number;
}

export interface PrayerTimesData {
  dateIso: string; // YYYY-MM-DD
  cityLabel: string;
  lat: number;
  lng: number;
  source: 'adhan-offline' | 'aladhan' | 'offline-solar';
  methodLabel: string;
  timings: {
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    sunset: string;
    maghrib: string;
    isha: string;
    midnight: string;
  };
  /** مواعيد Date الدقيقة لكل صلاة (تستخدم للجدولة والتنبيهات) */
  dateObjects: {
    fajr: Date;
    sunrise: Date;
    dhuhr: Date;
    asr: Date;
    sunset: Date;
    maghrib: Date;
    isha: Date;
    midnight: Date;
  };
  fetchedAt: number;
}

export interface PrayerLocationPreference {
  mode: 'city' | 'gps';
  cityId: string;
  lat: number;
  lng: number;
  cityLabel: string;
  governorate?: string;
  city?: string;
  country?: string;
  updatedAt?: number;
}

export interface NextPrayerInfo {
  key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nameAr: string;
  timeHHMM: string;
  time12hAr: string;
  remainingSeconds: number;
  countdownAr: string;
  isTomorrow: boolean;
}

export const PRESET_CITIES: CityCoordinate[] = [
  { id: 'najaf', nameAr: 'النجف الأشرف', countryAr: 'العراق', lat: 32.0005, lng: 44.336, tzOffsetHours: 3 },
  { id: 'karbala', nameAr: 'كربلاء المقدسة', countryAr: 'العراق', lat: 32.616, lng: 44.0249, tzOffsetHours: 3 },
  { id: 'baghdad', nameAr: 'بغداد', countryAr: 'العراق', lat: 33.3152, lng: 44.3661, tzOffsetHours: 3 },
  { id: 'basra', nameAr: 'البصرة', countryAr: 'العراق', lat: 30.5085, lng: 47.7804, tzOffsetHours: 3 },
  { id: 'hilla', nameAr: 'الحلة (بابل)', countryAr: 'العراق', lat: 32.4637, lng: 44.4196, tzOffsetHours: 3 },
  { id: 'nasiriyah', nameAr: 'الناصرية (ذي قار)', countryAr: 'العراق', lat: 31.0439, lng: 46.2573, tzOffsetHours: 3 },
  { id: 'amarah', nameAr: 'العمارة (ميسان)', countryAr: 'العراق', lat: 31.8356, lng: 47.1448, tzOffsetHours: 3 },
  { id: 'diwaniyah', nameAr: 'الديوانية (القادسية)', countryAr: 'العراق', lat: 31.9929, lng: 44.9255, tzOffsetHours: 3 },
  { id: 'samawah', nameAr: 'السماوة (المثنى)', countryAr: 'العراق', lat: 31.332, lng: 45.2944, tzOffsetHours: 3 },
  { id: 'kut', nameAr: 'الكوت (واسط)', countryAr: 'العراق', lat: 32.5128, lng: 45.8182, tzOffsetHours: 3 },
  { id: 'baqubah', nameAr: 'بعقوبة (ديالى)', countryAr: 'العراق', lat: 33.7481, lng: 44.6436, tzOffsetHours: 3 },
  { id: 'samarra', nameAr: 'سامراء (صلاح الدين)', countryAr: 'العراق', lat: 34.196, lng: 43.885, tzOffsetHours: 3 },
  { id: 'kirkuk', nameAr: 'كركوك', countryAr: 'العراق', lat: 35.4681, lng: 44.3922, tzOffsetHours: 3 },
  { id: 'mosul', nameAr: 'الموصل (نينوى)', countryAr: 'العراق', lat: 36.335, lng: 43.1189, tzOffsetHours: 3 },
  { id: 'erbil', nameAr: 'أربيل', countryAr: 'العراق', lat: 36.1911, lng: 44.0092, tzOffsetHours: 3 },
  { id: 'sulaymaniyah', nameAr: 'السليمانية', countryAr: 'العراق', lat: 35.565, lng: 45.4329, tzOffsetHours: 3 },
  { id: 'duhok', nameAr: 'دهوك', countryAr: 'العراق', lat: 36.8669, lng: 42.9503, tzOffsetHours: 3 },
  { id: 'ramadi', nameAr: 'الرمادي (الأنبار)', countryAr: 'العراق', lat: 33.4258, lng: 43.2992, tzOffsetHours: 3 },
  { id: 'beirut', nameAr: 'بيروت', countryAr: 'لبنان', lat: 33.8938, lng: 35.5018, tzOffsetHours: 2 },
  { id: 'tyre', nameAr: 'صور', countryAr: 'لبنان', lat: 33.2705, lng: 35.2038, tzOffsetHours: 2 },
  { id: 'nabatieh', nameAr: 'النبطية', countryAr: 'لبنان', lat: 33.3772, lng: 35.4839, tzOffsetHours: 2 },
  { id: 'baalbek', nameAr: 'بعلبك', countryAr: 'لبنان', lat: 34.0058, lng: 36.2181, tzOffsetHours: 2 },
  { id: 'manama', nameAr: 'المنامة', countryAr: 'البحرين', lat: 26.2285, lng: 50.586, tzOffsetHours: 3 },
  { id: 'qatif', nameAr: 'القطيف', countryAr: 'السعودية', lat: 26.5765, lng: 49.9982, tzOffsetHours: 3 },
  { id: 'ahsa', nameAr: 'الأحساء', countryAr: 'السعودية', lat: 25.38, lng: 49.5888, tzOffsetHours: 3 },
  { id: 'kuwait', nameAr: 'الكويت', countryAr: 'الكويت', lat: 29.3759, lng: 47.9774, tzOffsetHours: 3 },
  { id: 'qom', nameAr: 'قم المقدسة', countryAr: 'إيران', lat: 34.6416, lng: 50.8746, tzOffsetHours: 3.5 },
  { id: 'mashhad', nameAr: 'مشهد المقدسة', countryAr: 'إيران', lat: 36.2972, lng: 59.6067, tzOffsetHours: 3.5 },
  { id: 'mecca', nameAr: 'مكة المكرمة', countryAr: 'السعودية', lat: 21.4225, lng: 39.8262, tzOffsetHours: 3 },
  { id: 'medina', nameAr: 'المدينة المنورة', countryAr: 'السعودية', lat: 24.4672, lng: 39.6111, tzOffsetHours: 3 },
  { id: 'damascus', nameAr: 'دمشق', countryAr: 'سوريا', lat: 33.5138, lng: 36.2765, tzOffsetHours: 3 },
  { id: 'amman', nameAr: 'عمّان', countryAr: 'الأردن', lat: 31.9454, lng: 35.9284, tzOffsetHours: 3 },
  { id: 'cairo', nameAr: 'القاهرة', countryAr: 'مصر', lat: 30.0444, lng: 31.2357, tzOffsetHours: 2 },
  { id: 'dubai', nameAr: 'دبي', countryAr: 'الإمارات', lat: 25.2048, lng: 55.2708, tzOffsetHours: 4 },
  { id: 'doha', nameAr: 'الدوحة', countryAr: 'قطر', lat: 25.2854, lng: 51.531, tzOffsetHours: 3 },
  { id: 'muscat', nameAr: 'مسقط', countryAr: 'عُمان', lat: 23.588, lng: 58.3829, tzOffsetHours: 4 },
  { id: 'london', nameAr: 'لندن', countryAr: 'بريطانيا', lat: 51.5072, lng: -0.1276, tzOffsetHours: 0 },
  { id: 'dearborn', nameAr: 'ديربورن', countryAr: 'أمريكا', lat: 42.3223, lng: -83.1763, tzOffsetHours: -5 },
];

const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

const LOCATION_STORAGE_KEY = 'rihlat_alnoor_prayer_loc_v1';

const ARABIC_INDIC = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
export function toArabicNums(val: number | string): string {
  return String(val).replace(/\d/g, (d) => ARABIC_INDIC[Number(d)] ?? d);
}

export function getTodayIso(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export function hasSavedPrayerLocationPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(window.localStorage.getItem(LOCATION_STORAGE_KEY));
  } catch {
    return false;
  }
}

export function loadPrayerLocationPreference(): PrayerLocationPreference {
  const defaultCity = PRESET_CITIES[0]; // Najaf
  const fallback: PrayerLocationPreference = {
    mode: 'city',
    cityId: defaultCity.id,
    lat: defaultCity.lat,
    lng: defaultCity.lng,
    cityLabel: defaultCity.nameAr,
    governorate: 'محافظة النجف الأشرف',
    city: defaultCity.nameAr,
    country: defaultCity.countryAr,
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PrayerLocationPreference>;
    if (
      typeof parsed.lat === 'number' &&
      typeof parsed.lng === 'number' &&
      typeof parsed.cityLabel === 'string'
    ) {
      return {
        mode: parsed.mode === 'gps' ? 'gps' : 'city',
        cityId: typeof parsed.cityId === 'string' ? parsed.cityId : defaultCity.id,
        lat: parsed.lat,
        lng: parsed.lng,
        cityLabel: parsed.cityLabel,
        governorate:
          typeof parsed.governorate === 'string' ? parsed.governorate : undefined,
        city: typeof parsed.city === 'string' ? parsed.city : undefined,
        country: typeof parsed.country === 'string' ? parsed.country : undefined,
        updatedAt:
          typeof parsed.updatedAt === 'number' ? parsed.updatedAt : undefined,
      };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function savePrayerLocationPreference(pref: PrayerLocationPreference): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(pref));
    window.dispatchEvent(new CustomEvent('rihlat:prayer-location-updated'));
  } catch {
    // Ignore quota errors
  }
}

export function formatDateToHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;
}

export function formatHHMMArabic12h(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const period = h < 12 ? 'ص' : 'م';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${toArabicNums(String(hour12).padStart(2, '0'))}:${toArabicNums(
    String(m).padStart(2, '0')
  )} ${period}`;
}

function buildCalculationParameters(settings: AdhanSettings): {
  params: CalculationParameters;
  methodLabel: string;
} {
  let params: CalculationParameters;

  switch (settings.methodId) {
    case 'jafari':
      // الشيعة الاثنا عشرية — معهد لواء قم: الفجر 16°، المغرب 4°، العشاء 14°
      params = new CalculationParameters(null, 16, 14, 0, 4);
      break;
    case 'tehran':
      params = CalculationMethod.Tehran();
      break;
    case 'muslimWorldLeague':
      params = CalculationMethod.MuslimWorldLeague();
      break;
    case 'ummAlQura':
      params = CalculationMethod.UmmAlQura();
      break;
    case 'egyptian':
      params = CalculationMethod.Egyptian();
      break;
    case 'karachi':
      params = CalculationMethod.Karachi();
      break;
    case 'custom':
    default:
      params = new CalculationParameters(
        null,
        settings.customAngles.fajrAngle,
        settings.customAngles.ishaAngle,
        0,
        settings.customAngles.maghribAngle
      );
      break;
  }

  params.madhab = Madhab.Shafi;
  params.adjustments.fajr = settings.prayers.fajr.adjustmentMinutes || 0;
  params.adjustments.dhuhr = settings.prayers.dhuhr.adjustmentMinutes || 0;
  params.adjustments.asr = settings.prayers.asr.adjustmentMinutes || 0;
  params.adjustments.maghrib = settings.prayers.maghrib.adjustmentMinutes || 0;
  params.adjustments.isha = settings.prayers.isha.adjustmentMinutes || 0;

  const preset = CALCULATION_METHOD_PRESETS.find((m) => m.id === settings.methodId);
  const methodLabel =
    settings.methodId === 'custom'
      ? `زوايا يدوية (فجر ${toArabicNums(settings.customAngles.fajrAngle)}° · مغرب ${toArabicNums(
          settings.customAngles.maghribAngle
        )}° · عشاء ${toArabicNums(settings.customAngles.ishaAngle)}°)`
      : preset?.labelAr || 'الشيعة الاثنا عشرية (الجعفري)';

  return { params, methodLabel };
}

/**
 * يحسب أوقات الصلاة محلياً بالكامل بدون إنترنت باستخدام مكتبة adhan الفلكية
 * مع احترام طريقة الحساب المختارة، الزوايا اليدوية، وتعديلات الدقائق (+/-) لكل صلاة.
 */
export function computeLocalAdhanPrayerTimes(
  lat: number,
  lng: number,
  cityLabel: string,
  date: Date = new Date(),
  overrideSettings?: AdhanSettings
): PrayerTimesData {
  const settings = overrideSettings || loadAdhanSettings();
  const coords = new Coordinates(lat, lng);
  const { params, methodLabel } = buildCalculationParameters(settings);
  const prayerTimes = new PrayerTimes(coords, date, params);
  const sunnahTimes = new SunnahTimes(prayerTimes);

  return {
    dateIso: getTodayIso(date),
    cityLabel,
    lat,
    lng,
    source: 'adhan-offline',
    methodLabel,
    timings: {
      fajr: formatDateToHHMM(prayerTimes.fajr),
      sunrise: formatDateToHHMM(prayerTimes.sunrise),
      dhuhr: formatDateToHHMM(prayerTimes.dhuhr),
      asr: formatDateToHHMM(prayerTimes.asr),
      sunset: formatDateToHHMM(prayerTimes.sunset),
      maghrib: formatDateToHHMM(prayerTimes.maghrib),
      isha: formatDateToHHMM(prayerTimes.isha),
      midnight: formatDateToHHMM(sunnahTimes.middleOfTheNight),
    },
    dateObjects: {
      fajr: prayerTimes.fajr,
      sunrise: prayerTimes.sunrise,
      dhuhr: prayerTimes.dhuhr,
      asr: prayerTimes.asr,
      sunset: prayerTimes.sunset,
      maghrib: prayerTimes.maghrib,
      isha: prayerTimes.isha,
      midnight: sunnahTimes.middleOfTheNight,
    },
    fetchedAt: Date.now(),
  };
}

/**
 * واجهة متوافقة مع الاستدعاءات السابقة؛ تستخدم الآن الحساب المحلي لمكتبة adhan
 * مباشرة بدون أي اعتماد على الخوادم الخارجية.
 */
export function computeOfflineSolarPrayerTimes(
  lat: number,
  lng: number,
  cityLabel: string,
  date: Date = new Date()
): PrayerTimesData {
  return computeLocalAdhanPrayerTimes(lat, lng, cityLabel, date);
}

export function loadCachedPrayerTimes(
  lat: number,
  lng: number,
  _dateIso?: string
): PrayerTimesData | null {
  const pref = loadPrayerLocationPreference();
  return computeLocalAdhanPrayerTimes(lat, lng, pref.cityLabel, new Date());
}

export async function fetchAladhanPrayerTimes(
  pref: PrayerLocationPreference
): Promise<PrayerTimesData> {
  return computeLocalAdhanPrayerTimes(pref.lat, pref.lng, pref.cityLabel, new Date());
}

export function getNextPrayerInfo(
  timings: PrayerTimesData['timings'],
  now: Date = new Date()
): NextPrayerInfo {
  const entries: {
    key: NextPrayerInfo['key'];
    nameAr: string;
    timeHHMM: string;
  }[] = [
    { key: 'fajr', nameAr: 'الفجر', timeHHMM: timings.fajr },
    { key: 'dhuhr', nameAr: 'الظهر', timeHHMM: timings.dhuhr },
    { key: 'asr', nameAr: 'العصر', timeHHMM: timings.asr },
    { key: 'maghrib', nameAr: 'المغرب', timeHHMM: timings.maghrib },
    { key: 'isha', nameAr: 'العشاء', timeHHMM: timings.isha },
  ];

  const nowSeconds =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  for (const item of entries) {
    const [h, m] = item.timeHHMM.split(':').map(Number);
    const targetSeconds = (h || 0) * 3600 + (m || 0) * 60;
    if (targetSeconds > nowSeconds) {
      const diff = targetSeconds - nowSeconds;
      const hrs = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const secs = diff % 60;
      const countdownAr = `${toArabicNums(String(hrs).padStart(2, '0'))}:${toArabicNums(
        String(mins).padStart(2, '0')
      )}:${toArabicNums(String(secs).padStart(2, '0'))}`;
      return {
        key: item.key,
        nameAr: item.nameAr,
        timeHHMM: item.timeHHMM,
        time12hAr: formatHHMMArabic12h(item.timeHHMM),
        remainingSeconds: diff,
        countdownAr,
        isTomorrow: false,
      };
    }
  }

  // Fajr tomorrow
  const fajr = entries[0];
  const [fh, fm] = fajr.timeHHMM.split(':').map(Number);
  const diff = 24 * 3600 - nowSeconds + ((fh || 0) * 3600 + (fm || 0) * 60);
  const hrs = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  const secs = diff % 60;
  return {
    key: 'fajr',
    nameAr: 'الفجر (غداً)',
    timeHHMM: fajr.timeHHMM,
    time12hAr: formatHHMMArabic12h(fajr.timeHHMM),
    remainingSeconds: diff,
    countdownAr: `${toArabicNums(String(hrs).padStart(2, '0'))}:${toArabicNums(
      String(mins).padStart(2, '0')
    )}:${toArabicNums(String(secs).padStart(2, '0'))}`,
    isTomorrow: true,
  };
}

/**
 * يحسب زاوية القبلة بدقة فلكية عبر مكتبة adhan + المسافة إلى الكعبة المشرفة.
 */
export function calculateQiblaDirection(lat: number, lng: number): {
  bearingDeg: number;
  distanceKm: number;
  cardinalAr: string;
} {
  const bearingDeg = ((Qibla(new Coordinates(lat, lng)) % 360) + 360) % 360;

  const rad = Math.PI / 180;
  const lat1 = lat * rad;
  const lat2 = KAABA_LAT * rad;
  const dLng = (KAABA_LNG - lng) * rad;
  const dLat = lat2 - lat1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.round(6371 * c);

  const dirs = [
    'الشمال',
    'الشمال الشرقي',
    'الشرق',
    'الجنوب الشرقي',
    'الجنوب',
    'الجنوب الغربي',
    'الغرب',
    'الشمال الغربي',
  ];
  const cardinalAr = dirs[Math.round(bearingDeg / 45) % 8];

  return {
    bearingDeg: Math.round(bearingDeg * 10) / 10,
    distanceKm,
    cardinalAr,
  };
}
