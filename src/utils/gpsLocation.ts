import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import {
  AdhanSchedulerPlugin,
  isCustomAdhanPluginAvailable,
} from '../plugins/adhanNativePlugin';
import {
  PrayerLocationPreference,
  hasSavedPrayerLocationPreference,
  loadPrayerLocationPreference,
  savePrayerLocationPreference,
  toArabicNums,
} from './prayerTimes';

export interface ResolvedPlaceInfo {
  governorate?: string;
  city?: string;
  country?: string;
  cityLabel: string;
  source: 'bigdatacloud' | 'nominatim' | 'offline-gazetteer' | 'coords';
}

export type LocationPermissionStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'location-disabled'
  | 'unsupported'
  | 'timeout'
  | 'error';

export interface GpsDetectionResult {
  ok: boolean;
  reason?:
    | 'granted'
    | 'denied'
    | 'location-disabled'
    | 'unsupported'
    | 'timeout'
    | 'error';
  preference?: PrayerLocationPreference;
  message: string;
}

export interface ComprehensiveLocationDiagnostics {
  permissionStatus: LocationPermissionStatus;
  permissionGranted: boolean;
  locationServicesEnabled: boolean;
  lastCoords: { lat: number; lng: number };
  locationMode: 'gps' | 'city';
  locationLabel: string;
  updatedAt: number | null;
}

const FIRST_OPEN_GPS_PROMPTED_KEY = 'rihlat_alnoor_first_open_gps_v1';
const LAST_GOOD_GPS_KEY = 'rihlat_alnoor_last_good_gps_v1';

interface OfflineGazetteerEntry {
  city: string;
  governorate: string;
  country: string;
  lat: number;
  lng: number;
}

const OFFLINE_GAZETTEER: OfflineGazetteerEntry[] = [
  // العراق — المحافظات والمدن الرئيسية
  { city: 'النجف الأشرف', governorate: 'محافظة النجف الأشرف', country: 'العراق', lat: 32.0005, lng: 44.336 },
  { city: 'الكوفة', governorate: 'محافظة النجف الأشرف', country: 'العراق', lat: 32.0322, lng: 44.4036 },
  { city: 'كربلاء المقدسة', governorate: 'محافظة كربلاء المقدسة', country: 'العراق', lat: 32.616, lng: 44.0249 },
  { city: 'الهندية', governorate: 'محافظة كربلاء المقدسة', country: 'العراق', lat: 32.5467, lng: 44.2278 },
  { city: 'بغداد', governorate: 'محافظة بغداد', country: 'العراق', lat: 33.3152, lng: 44.3661 },
  { city: 'الكاظمية المقدسة', governorate: 'محافظة بغداد', country: 'العراق', lat: 33.3788, lng: 44.3396 },
  { city: 'مدينة الصدر', governorate: 'محافظة بغداد', country: 'العراق', lat: 33.3908, lng: 44.4581 },
  { city: 'الحلة', governorate: 'محافظة بابل', country: 'العراق', lat: 32.4637, lng: 44.4196 },
  { city: 'المسيب', governorate: 'محافظة بابل', country: 'العراق', lat: 32.7787, lng: 44.29 },
  { city: 'البصرة', governorate: 'محافظة البصرة', country: 'العراق', lat: 30.5085, lng: 47.7804 },
  { city: 'الزبير', governorate: 'محافظة البصرة', country: 'العراق', lat: 30.3921, lng: 47.7017 },
  { city: 'الناصرية', governorate: 'محافظة ذي قار', country: 'العراق', lat: 31.0439, lng: 46.2573 },
  { city: 'العمارة', governorate: 'محافظة ميسان', country: 'العراق', lat: 31.8356, lng: 47.1448 },
  { city: 'الديوانية', governorate: 'محافظة القادسية', country: 'العراق', lat: 31.9929, lng: 44.9255 },
  { city: 'السماوة', governorate: 'محافظة المثنى', country: 'العراق', lat: 31.332, lng: 45.2944 },
  { city: 'الكوت', governorate: 'محافظة واسط', country: 'العراق', lat: 32.5128, lng: 45.8182 },
  { city: 'بعقوبة', governorate: 'محافظة ديالى', country: 'العراق', lat: 33.7481, lng: 44.6436 },
  { city: 'سامراء', governorate: 'محافظة صلاح الدين', country: 'العراق', lat: 34.196, lng: 43.885 },
  { city: 'بلد', governorate: 'محافظة صلاح الدين', country: 'العراق', lat: 34.0149, lng: 44.1457 },
  { city: 'تكريت', governorate: 'محافظة صلاح الدين', country: 'العراق', lat: 34.6158, lng: 43.6786 },
  { city: 'كركوك', governorate: 'محافظة كركوك', country: 'العراق', lat: 35.4681, lng: 44.3922 },
  { city: 'الموصل', governorate: 'محافظة نينوى', country: 'العراق', lat: 36.335, lng: 43.1189 },
  { city: 'أربيل', governorate: 'محافظة أربيل', country: 'العراق', lat: 36.1911, lng: 44.0092 },
  { city: 'السليمانية', governorate: 'محافظة السليمانية', country: 'العراق', lat: 35.565, lng: 45.4329 },
  { city: 'دهوك', governorate: 'محافظة دهوك', country: 'العراق', lat: 36.8669, lng: 42.9503 },
  { city: 'الرمادي', governorate: 'محافظة الأنبار', country: 'العراق', lat: 33.4258, lng: 43.2992 },
  { city: 'الفلوجة', governorate: 'محافظة الأنبار', country: 'العراق', lat: 33.3491, lng: 43.786 },
  // دول عربية وإسلامية وعالمية مجاورة
  { city: 'بيروت', governorate: 'محافظة بيروت', country: 'لبنان', lat: 33.8938, lng: 35.5018 },
  { city: 'صور', governorate: 'محافظة الجنوب', country: 'لبنان', lat: 33.2705, lng: 35.2038 },
  { city: 'النبطية', governorate: 'محافظة النبطية', country: 'لبنان', lat: 33.3772, lng: 35.4839 },
  { city: 'بعلبك', governorate: 'محافظة بعلبك الهرمل', country: 'لبنان', lat: 34.0058, lng: 36.2181 },
  { city: 'المنامة', governorate: 'محافظة العاصمة', country: 'البحرين', lat: 26.2285, lng: 50.586 },
  { city: 'القطيف', governorate: 'المنطقة الشرقية', country: 'السعودية', lat: 26.5765, lng: 49.9982 },
  { city: 'الأحساء', governorate: 'المنطقة الشرقية', country: 'السعودية', lat: 25.38, lng: 49.5888 },
  { city: 'مكة المكرمة', governorate: 'منطقة مكة المكرمة', country: 'السعودية', lat: 21.4225, lng: 39.8262 },
  { city: 'المدينة المنورة', governorate: 'منطقة المدينة المنورة', country: 'السعودية', lat: 24.4672, lng: 39.6111 },
  { city: 'الرياض', governorate: 'منطقة الرياض', country: 'السعودية', lat: 24.7136, lng: 46.6753 },
  { city: 'الكويت', governorate: 'محافظة العاصمة', country: 'الكويت', lat: 29.3759, lng: 47.9774 },
  { city: 'دمشق', governorate: 'محافظة دمشق', country: 'سوريا', lat: 33.5138, lng: 36.2765 },
  { city: 'قم المقدسة', governorate: 'محافظة قم', country: 'إيران', lat: 34.6416, lng: 50.8746 },
  { city: 'مشهد المقدسة', governorate: 'محافظة خراسان الرضوية', country: 'إيران', lat: 36.2972, lng: 59.6067 },
  { city: 'طهران', governorate: 'محافظة طهران', country: 'إيران', lat: 35.6892, lng: 51.389 },
  { city: 'القاهرة', governorate: 'محافظة القاهرة', country: 'مصر', lat: 30.0444, lng: 31.2357 },
  { city: 'عمّان', governorate: 'محافظة العاصمة', country: 'الأردن', lat: 31.9454, lng: 35.9284 },
  { city: 'دبي', governorate: 'إمارة دبي', country: 'الإمارات', lat: 25.2048, lng: 55.2708 },
  { city: 'الدوحة', governorate: 'بلدية الدوحة', country: 'قطر', lat: 25.2854, lng: 51.531 },
  { city: 'مسقط', governorate: 'محافظة مسقط', country: 'عُمان', lat: 23.588, lng: 58.3829 },
  { city: 'لندن', governorate: 'لندن الكبرى', country: 'بريطانيا', lat: 51.5072, lng: -0.1276 },
  { city: 'ديربورن', governorate: 'ميشيغان', country: 'أمريكا', lat: 42.3223, lng: -83.1763 },
];

let gpsDetectingState = false;
let locationPermissionStatusState: LocationPermissionStatus = 'idle';
const gpsStatusListeners = new Set<(detecting: boolean) => void>();
const permissionStatusListeners = new Set<
  (status: LocationPermissionStatus) => void
>();
let autoLaunchRan = false;
let inFlightGpsPromise: Promise<GpsDetectionResult> | null = null;

function setGpsDetecting(next: boolean): void {
  gpsDetectingState = next;
  gpsStatusListeners.forEach((cb) => {
    try {
      cb(next);
    } catch {
      // Ignore subscriber errors
    }
  });
}

function setLocationPermissionStatus(next: LocationPermissionStatus): void {
  locationPermissionStatusState = next;
  permissionStatusListeners.forEach((cb) => {
    try {
      cb(next);
    } catch {
      // Ignore subscriber errors
    }
  });
}

export function getGpsDetecting(): boolean {
  return gpsDetectingState;
}

export function getLocationPermissionStatus(): LocationPermissionStatus {
  return locationPermissionStatusState;
}

export function subscribeGpsStatus(
  listener: (detecting: boolean) => void
): () => void {
  gpsStatusListeners.add(listener);
  return () => {
    gpsStatusListeners.delete(listener);
  };
}

export function subscribeLocationPermissionStatus(
  listener: (status: LocationPermissionStatus) => void
): () => void {
  permissionStatusListeners.add(listener);
  return () => {
    permissionStatusListeners.delete(listener);
  };
}

function hasFirstOpenGpsPrompted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(FIRST_OPEN_GPS_PROMPTED_KEY) === '1';
  } catch {
    return false;
  }
}

function markFirstOpenGpsPrompted(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FIRST_OPEN_GPS_PROMPTED_KEY, '1');
  } catch {
    // Ignore storage quota errors
  }
}

function saveLastGoodGpsBackup(pref: PrayerLocationPreference): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_GOOD_GPS_KEY, JSON.stringify(pref));
  } catch {
    // Ignore quota errors
  }
}

export function loadLastGoodGpsBackup(): PrayerLocationPreference | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LAST_GOOD_GPS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PrayerLocationPreference>;
    if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
      return parsed as PrayerLocationPreference;
    }
    return null;
  } catch {
    return null;
  }
}

export async function openAppLocationPermissionSettings(): Promise<boolean> {
  if (isCustomAdhanPluginAvailable() && AdhanSchedulerPlugin.openAppSettings) {
    try {
      const res = await AdhanSchedulerPlugin.openAppSettings();
      return Boolean(res.opened);
    } catch {
      return false;
    }
  }
  return false;
}

export async function openDeviceLocationSettings(): Promise<boolean> {
  if (isCustomAdhanPluginAvailable() && AdhanSchedulerPlugin.openLocationSettings) {
    try {
      const res = await AdhanSchedulerPlugin.openLocationSettings();
      return Boolean(res.opened);
    } catch {
      return false;
    }
  }
  return false;
}

export async function openDeviceAutostartSettings(): Promise<boolean> {
  if (isCustomAdhanPluginAvailable() && AdhanSchedulerPlugin.openAutostartSettings) {
    try {
      const res = await AdhanSchedulerPlugin.openAutostartSettings();
      return Boolean(res.opened);
    } catch {
      return false;
    }
  }
  return false;
}

async function checkNativeLocationServicesEnabled(): Promise<boolean> {
  if (
    isCustomAdhanPluginAvailable() &&
    AdhanSchedulerPlugin.getLocationDiagnostics
  ) {
    try {
      const diag = await AdhanSchedulerPlugin.getLocationDiagnostics();
      return Boolean(diag.locationServicesEnabled);
    } catch {
      return true;
    }
  }
  return true;
}

export async function getComprehensiveLocationDiagnostics(): Promise<ComprehensiveLocationDiagnostics> {
  const pref = loadPrayerLocationPreference();
  let permissionGranted = false;
  let locationServicesEnabled = true;
  let status: LocationPermissionStatus = locationPermissionStatusState;

  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await Geolocation.checkPermissions();
      permissionGranted =
        perm.location === 'granted' || perm.coarseLocation === 'granted';
      if (permissionGranted) {
        status = 'granted';
      } else if (perm.location === 'denied') {
        status = 'denied';
      }
    } catch {
      // Fallback to native plugin diagnostics below
    }

    if (
      isCustomAdhanPluginAvailable() &&
      AdhanSchedulerPlugin.getLocationDiagnostics
    ) {
      try {
        const nativeDiag = await AdhanSchedulerPlugin.getLocationDiagnostics();
        permissionGranted =
          permissionGranted || Boolean(nativeDiag.locationPermissionGranted);
        locationServicesEnabled = Boolean(nativeDiag.locationServicesEnabled);
        if (!locationServicesEnabled) {
          status = 'location-disabled';
        } else if (permissionGranted) {
          status = 'granted';
        }
      } catch {
        // Ignore error
      }
    }
  } else {
    try {
      const perm = await Geolocation.checkPermissions();
      permissionGranted =
        perm.location === 'granted' || perm.coarseLocation === 'granted';
      status = permissionGranted
        ? 'granted'
        : perm.location === 'denied'
        ? 'denied'
        : 'idle';
    } catch {
      permissionGranted = pref.mode === 'gps';
    }
  }

  return {
    permissionStatus: status,
    permissionGranted,
    locationServicesEnabled,
    lastCoords: { lat: pref.lat, lng: pref.lng },
    locationMode: pref.mode,
    locationLabel: pref.cityLabel,
    updatedAt: pref.updatedAt ?? null,
  };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) *
      Math.cos(lat2 * rad) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function cleanPlacePart(raw: string | undefined | null): string {
  if (!raw) return '';
  return raw
    .replace(/\s+/g, ' ')
    .replace(/,\s*$/g, '')
    .trim();
}

export function formatGovernorateAndCityLabel(
  governorate?: string,
  city?: string,
  fallbackLat?: number,
  fallbackLng?: number
): string {
  const gov = cleanPlacePart(governorate);
  const cty = cleanPlacePart(city);

  if (gov && cty) {
    return `${gov} — ${cty}`;
  }
  if (gov) return gov;
  if (cty) return cty;
  if (typeof fallbackLat === 'number' && typeof fallbackLng === 'number') {
    return `موقعي الحالي (${toArabicNums(fallbackLat.toFixed(2))}°, ${toArabicNums(
      fallbackLng.toFixed(2)
    )}°)`;
  }
  return 'موقعي الحالي (GPS)';
}

function matchOfflineGazetteer(
  lat: number,
  lng: number
): OfflineGazetteerEntry | null {
  let best: OfflineGazetteerEntry | null = null;
  let bestDist = Infinity;
  for (const entry of OFFLINE_GAZETTEER) {
    const dist = haversineKm(lat, lng, entry.lat, entry.lng);
    if (dist < bestDist) {
      bestDist = dist;
      best = entry;
    }
  }
  return best && bestDist <= 130 ? best : null;
}

async function fetchJsonWithTimeout<T>(
  url: string,
  timeoutMs: number = 5500
): Promise<T | null> {
  if (typeof fetch === 'undefined') return null;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

interface BigDataCloudResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
  localityInfo?: {
    administrative?: Array<{
      name?: string;
      adminLevel?: number;
      order?: number;
    }>;
  };
}

interface NominatimReverseResponse {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    suburb?: string;
    city_district?: string;
    state?: string;
    province?: string;
    governorate?: string;
    region?: string;
    country?: string;
  };
}

/**
 * يحوّل الإحداثيات الجغرافية إلى اسم المحافظة والمدينة بالعربية
 * عبر خدمتي BigDataCloud و Nominatim مع قاعدة مدن ومحافظات محلية بدون إنترنت.
 */
export async function resolveGovernorateAndCity(
  lat: number,
  lng: number
): Promise<ResolvedPlaceInfo> {
  // ١) BigDataCloud Arabic Client Reverse Geocoder
  const bdc = await fetchJsonWithTimeout<BigDataCloudResponse>(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
      lat
    )}&longitude=${encodeURIComponent(lng)}&localityLanguage=ar`,
    5500
  );

  if (bdc) {
    const adminList = Array.isArray(bdc.localityInfo?.administrative)
      ? bdc.localityInfo.administrative
      : [];
    const adminGov = adminList.find((a) => a.adminLevel === 4)?.name;
    const adminDistrict = adminList.find(
      (a) => a.adminLevel === 6 || a.adminLevel === 5
    )?.name;

    const governorate =
      cleanPlacePart(bdc.principalSubdivision) || cleanPlacePart(adminGov);
    const city =
      cleanPlacePart(bdc.city) ||
      cleanPlacePart(bdc.locality) ||
      cleanPlacePart(adminDistrict);
    const country = cleanPlacePart(bdc.countryName);

    if (governorate || city) {
      return {
        governorate: governorate || undefined,
        city: city || undefined,
        country: country || undefined,
        cityLabel: formatGovernorateAndCityLabel(governorate, city, lat, lng),
        source: 'bigdatacloud',
      };
    }
  }

  // ٢) OpenStreetMap Nominatim
  const nom = await fetchJsonWithTimeout<NominatimReverseResponse>(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&accept-language=ar&zoom=12`,
    5500
  );

  if (nom?.address) {
    const addr = nom.address;
    const governorate = cleanPlacePart(
      addr.state || addr.province || addr.governorate || addr.region
    );
    const city = cleanPlacePart(
      addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.county ||
        addr.city_district ||
        addr.suburb
    );
    const country = cleanPlacePart(addr.country);

    if (governorate || city) {
      return {
        governorate: governorate || undefined,
        city: city || undefined,
        country: country || undefined,
        cityLabel: formatGovernorateAndCityLabel(governorate, city, lat, lng),
        source: 'nominatim',
      };
    }
  }

  // ٣) المطابقة المحلية دون إنترنت
  const offline = matchOfflineGazetteer(lat, lng);
  if (offline) {
    return {
      governorate: offline.governorate,
      city: offline.city,
      country: offline.country,
      cityLabel: formatGovernorateAndCityLabel(
        offline.governorate,
        offline.city,
        lat,
        lng
      ),
      source: 'offline-gazetteer',
    };
  }

  return {
    cityLabel: formatGovernorateAndCityLabel(undefined, undefined, lat, lng),
    source: 'coords',
  };
}

async function acquireRawCoordinates(): Promise<{
  ok: true;
  lat: number;
  lng: number;
} | {
  ok: false;
  reason: 'denied' | 'location-disabled' | 'unsupported' | 'timeout' | 'error';
}> {
  if (typeof window === 'undefined') {
    return { ok: false, reason: 'unsupported' };
  }

  // ١) استخدام @capacitor/geolocation موحّداً: checkPermissions ثم requestPermissions
  try {
    if (Capacitor.isNativePlatform()) {
      let perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
        perm = await Geolocation.requestPermissions();
      }
      if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
        return { ok: false, reason: 'denied' };
      }

      // ٢) فحص هل خدمة الموقع (GPS) مفعّلة في الهاتف أصلاً
      const servicesEnabled = await checkNativeLocationServicesEnabled();
      if (!servicesEnabled) {
        return { ok: false, reason: 'location-disabled' };
      }
    } else {
      // على المتصفح: نفحص عبر إضافة Geolocation دون التعطل إن لم يدعم المتصفح requestPermissions
      try {
        const perm = await Geolocation.checkPermissions();
        if (perm.location === 'denied') {
          return { ok: false, reason: 'denied' };
        }
        if (perm.location !== 'granted') {
          await Geolocation.requestPermissions().catch(() => undefined);
        }
      } catch {
        // بعض المتصفحات تستدعي الإذن مباشرة عند getCurrentPosition
      }
    }

    // ٣) طلب الموقع الحالي بمهلة 15 ثانية عبر @capacitor/geolocation
    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      });
      return {
        ok: true,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
    } catch (primaryErr: unknown) {
      if (Capacitor.isNativePlatform()) {
        const stillEnabled = await checkNativeLocationServicesEnabled();
        if (!stillEnabled) {
          return { ok: false, reason: 'location-disabled' };
        }
      }
      const primaryCode = (primaryErr as { code?: number })?.code;
      const primaryMsg = String(
        (primaryErr as { message?: string })?.message || ''
      ).toLowerCase();
      if (
        primaryCode === 1 ||
        primaryMsg.includes('denied') ||
        primaryMsg.includes('permission')
      ) {
        return { ok: false, reason: 'denied' };
      }
      if (
        primaryMsg.includes('location services are not enabled') ||
        primaryMsg.includes('disabled')
      ) {
        return { ok: false, reason: 'location-disabled' };
      }

      // محاولة ثانية بدقة متوسطة (الشبكة / Wi-Fi) للمباني المغلقة
      const fallbackPos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000,
      });
      return {
        ok: true,
        lat: fallbackPos.coords.latitude,
        lng: fallbackPos.coords.longitude,
      };
    }
  } catch (err: unknown) {
    if (Capacitor.isNativePlatform()) {
      const stillEnabled = await checkNativeLocationServicesEnabled();
      if (!stillEnabled) {
        return { ok: false, reason: 'location-disabled' };
      }
    }
    const code = (err as { code?: number })?.code;
    const msg = String((err as { message?: string })?.message || '').toLowerCase();
    if (code === 1 || msg.includes('denied') || msg.includes('permission')) {
      return { ok: false, reason: 'denied' };
    }
    if (
      msg.includes('location services are not enabled') ||
      msg.includes('disabled')
    ) {
      return { ok: false, reason: 'location-disabled' };
    }
    if (code === 3 || msg.includes('timeout')) {
      return { ok: false, reason: 'timeout' };
    }
    if (msg.includes('not supported') || msg.includes('unimplemented')) {
      return { ok: false, reason: 'unsupported' };
    }
    return { ok: false, reason: 'error' };
  }
}

/**
 * يطلب إذن الموقع عبر @capacitor/geolocation، يلتقط الإحداثيات بمهلة 15 ثانية،
 * ويستخرج المحافظة والمدينة ويحفظ آخر موقع ناجح محلياً للعمل بدون إنترنت.
 */
export async function detectAndSaveGpsLocation(): Promise<GpsDetectionResult> {
  if (inFlightGpsPromise) {
    return inFlightGpsPromise;
  }

  inFlightGpsPromise = (async (): Promise<GpsDetectionResult> => {
    setGpsDetecting(true);
    setLocationPermissionStatus('requesting');
    try {
      const coords = await acquireRawCoordinates();
      if (!coords.ok) {
        setLocationPermissionStatus(coords.reason);
        markFirstOpenGpsPrompted();
        const message =
          coords.reason === 'denied'
            ? 'نحتاج إذن الموقع الجغرافي لحساب أوقات الصلاة واتجاه القبلة بدقة في مدينتك. يمكنك تفعيل الإذن من «فتح إعدادات التطبيق» أو اختيار مدينتك يدوياً من القائمة.'
            : coords.reason === 'location-disabled'
            ? 'خدمة الموقع (GPS) في الهاتف مطفأة حالياً. شغّل خدمة الموقع من «فتح إعدادات الموقع» أو اختر مدينتك يدوياً.'
            : coords.reason === 'unsupported'
            ? 'الجهاز لا يدعم تحديد الموقع التلقائي، يمكنك اختيار مدينتك من القائمة اليدوية.'
            : coords.reason === 'timeout'
            ? 'استغرق التقاط إشارة GPS وقتاً أطول (١٥ ثانية)؛ تأكد من تفعيل الموقع أو اختر مدينتك يدوياً.'
            : 'تعذّر تحديد الموقع الحالي؛ تأكد من تفعيل خدمة الموقع في الهاتف أو اختر مدينتك يدوياً.';
        return { ok: false, reason: coords.reason, message };
      }

      markFirstOpenGpsPrompted();
      const resolved = await resolveGovernorateAndCity(coords.lat, coords.lng);
      const nextPref: PrayerLocationPreference = {
        mode: 'gps',
        cityId: 'gps',
        lat: coords.lat,
        lng: coords.lng,
        cityLabel: resolved.cityLabel,
        governorate: resolved.governorate,
        city: resolved.city,
        country: resolved.country,
        updatedAt: Date.now(),
      };
      savePrayerLocationPreference(nextPref);
      saveLastGoodGpsBackup(nextPref);
      setLocationPermissionStatus('granted');

      return {
        ok: true,
        reason: 'granted',
        preference: nextPref,
        message: `تم تحديد موقعك: ${resolved.cityLabel}`,
      };
    } finally {
      setGpsDetecting(false);
      inFlightGpsPromise = null;
    }
  })();

  return inFlightGpsPromise;
}

/**
 * يُستدعى تلقائياً عند فتح التطبيق لأول مرة أو عند اعتماد GPS مسبقاً.
 */
export async function autoDetectGpsOnAppEnter(): Promise<GpsDetectionResult | null> {
  if (autoLaunchRan) return null;
  autoLaunchRan = true;

  const isFirstOpen = !hasFirstOpenGpsPrompted();
  const hasSaved = hasSavedPrayerLocationPreference();
  const current = loadPrayerLocationPreference();

  // إن اختار المستخدم مدينة ثابتة يدوياً بعد الفتح الأول نحترم اختياره
  if (!isFirstOpen && hasSaved && current.mode === 'city') {
    return null;
  }

  try {
    const perm = await Geolocation.checkPermissions();
    if (perm.location === 'denied' && !isFirstOpen) {
      setLocationPermissionStatus('denied');
      return null;
    }
  } catch {
    // متابعة المحاولة أدناه
  }

  return detectAndSaveGpsLocation();
}
