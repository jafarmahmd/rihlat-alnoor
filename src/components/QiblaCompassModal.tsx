import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { CheckCircle2, Compass, LocateFixed, Search, Settings, X } from 'lucide-react';
import {
  PRESET_CITIES,
  PrayerLocationPreference,
  calculateQiblaDirection,
  loadPrayerLocationPreference,
  savePrayerLocationPreference,
  toArabicNums,
} from '../utils/prayerTimes';
import {
  GpsDetectionResult,
  detectAndSaveGpsLocation,
  openAppLocationPermissionSettings,
  openDeviceLocationSettings,
} from '../utils/gpsLocation';
import { CornerOrnaments, ManuscriptDivider } from './IslamicOrnaments';

interface QiblaCompassModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationPref?: PrayerLocationPreference;
}

export async function requestIosCompassPermissionIfNeeded(): Promise<
  'granted' | 'denied' | 'unsupported'
> {
  if (typeof window === 'undefined') return 'unsupported';
  const DevOrient = window.DeviceOrientationEvent as unknown as {
    requestPermission?: () => Promise<'granted' | 'denied'>;
  };
  if (DevOrient && typeof DevOrient.requestPermission === 'function') {
    try {
      return await DevOrient.requestPermission();
    } catch {
      return 'denied';
    }
  }
  return 'granted';
}

function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function shortestSignedDelta(fromDeg: number, toDeg: number): number {
  return ((toDeg - fromDeg + 540) % 360) - 180;
}

/**
 * حساب زاوية اتجاه الهاتف من الشمال باتجاه عقارب الساعة [0..360)
 * مع تعويض الميل (Tilt-compensated W3C Z-X'-Y'' rotation matrix)
 * وتصحيح دوران الشاشة إن وُجد.
 */
function computeTiltCompensatedHeading(
  alphaDeg: number,
  betaDeg: number | null,
  gammaDeg: number | null
): number {
  const degToRad = Math.PI / 180;
  const alpha = alphaDeg * degToRad;
  const beta = (betaDeg ?? 0) * degToRad;
  const gamma = (gammaDeg ?? 0) * degToRad;

  let eastComponent: number;
  let northComponent: number;

  if (Math.abs(betaDeg ?? 0) > 60) {
    // عندما يكون الهاتف مائلاً بشدة أو عمودياً نستخدم محور الظهر (-Z') لتفادي gimbal lock
    eastComponent =
      -Math.cos(alpha) * Math.sin(gamma) -
      Math.sin(alpha) * Math.sin(beta) * Math.cos(gamma);
    northComponent =
      -Math.sin(alpha) * Math.sin(gamma) +
      Math.cos(alpha) * Math.sin(beta) * Math.cos(gamma);
  } else {
    // عندما يكون الهاتف ممسوكاً باليد بوضع أفقي أو مائل برفق نستخدم الحافة العلوية (+Y')
    eastComponent = -Math.sin(alpha) * Math.cos(beta);
    northComponent = Math.cos(alpha) * Math.cos(beta);
  }

  let heading = Math.atan2(eastComponent, northComponent) * (180 / Math.PI);
  const screenAngle =
    typeof window !== 'undefined' && window.screen?.orientation?.angle
      ? window.screen.orientation.angle
      : 0;
  heading += screenAngle;

  return normalizeDeg(heading);
}

export const QiblaCompassModal: React.FC<QiblaCompassModalProps> = ({
  isOpen,
  onClose,
  locationPref,
}) => {
  const [locPref, setLocPref] = useState<PrayerLocationPreference>(() =>
    locationPref || loadPrayerLocationPreference()
  );
  const [unwrappedHeadingDeg, setUnwrappedHeadingDeg] = useState<number | null>(
    null
  );
  const [sensorMode, setSensorMode] = useState<
    'idle' | 'absolute' | 'relative-fallback' | 'unsupported'
  >('idle');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'error'>(
    'idle'
  );
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsReason, setGpsReason] = useState<GpsDetectionResult['reason'] | null>(
    null
  );
  const [citySearch, setCitySearch] = useState('');

  const filteredCities = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    if (!q) return PRESET_CITIES;
    return PRESET_CITIES.filter(
      (c) =>
        c.nameAr.toLowerCase().includes(q) ||
        c.countryAr.toLowerCase().includes(q)
    );
  }, [citySearch]);

  const isAndroid =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  const unwrappedHeadingRef = useRef<number | null>(null);
  const hasAbsoluteEventRef = useRef<boolean>(false);
  const openedAtRef = useRef<number>(0);

  useEffect(() => {
    if (locationPref) {
      setLocPref(locationPref);
      return;
    }
    setLocPref(loadPrayerLocationPreference());
    const syncLoc = () => setLocPref(loadPrayerLocationPreference());
    window.addEventListener('rihlat:prayer-location-updated', syncLoc);
    return () =>
      window.removeEventListener('rihlat:prayer-location-updated', syncLoc);
  }, [locationPref]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') {
      unwrappedHeadingRef.current = null;
      hasAbsoluteEventRef.current = false;
      setUnwrappedHeadingDeg(null);
      setSensorMode('idle');
      return;
    }

    if (!('DeviceOrientationEvent' in window)) {
      setSensorMode('unsupported');
      return;
    }

    openedAtRef.current = performance.now();
    hasAbsoluteEventRef.current = false;
    unwrappedHeadingRef.current = null;

    const pushHeadingSample = (rawDeg: number, isTrueNorth: boolean) => {
      const normalized = normalizeDeg(rawDeg);
      const prev = unwrappedHeadingRef.current;
      let next: number;
      if (prev === null) {
        next = normalized;
      } else {
        const delta = shortestSignedDelta(normalizeDeg(prev), normalized);
        // تنعيم منخفض التمرير بدون أي التفاف عكسي عند ٣٦٠°/٠°
        next = prev + delta * 0.24;
      }
      unwrappedHeadingRef.current = next;
      setUnwrappedHeadingDeg(next);
      setSensorMode(isTrueNorth ? 'absolute' : 'relative-fallback');
    };

    const onAbsoluteOrientation = (ev: DeviceOrientationEvent) => {
      if (typeof ev.alpha !== 'number' || !Number.isFinite(ev.alpha)) return;
      hasAbsoluteEventRef.current = true;
      const heading = computeTiltCompensatedHeading(ev.alpha, ev.beta, ev.gamma);
      pushHeadingSample(heading, true);
    };

    const onStandardOrientation = (ev: DeviceOrientationEvent) => {
      const webkitObj = ev as unknown as {
        webkitCompassHeading?: number;
        webkitCompassAccuracy?: number;
      };
      if (
        typeof webkitObj.webkitCompassHeading === 'number' &&
        Number.isFinite(webkitObj.webkitCompassHeading) &&
        webkitObj.webkitCompassHeading >= 0
      ) {
        hasAbsoluteEventRef.current = true;
        pushHeadingSample(webkitObj.webkitCompassHeading, true);
        return;
      }

      if (hasAbsoluteEventRef.current) return;
      if (typeof ev.alpha !== 'number' || !Number.isFinite(ev.alpha)) return;

      if (ev.absolute === true) {
        hasAbsoluteEventRef.current = true;
        const heading = computeTiltCompensatedHeading(ev.alpha, ev.beta, ev.gamma);
        pushHeadingSample(heading, true);
        return;
      }

      // انتظر لحظة قصيرة لعلّ حدث deviceorientationabsolute يصل أولاً على أجهزة أندرويد
      if (performance.now() - openedAtRef.current < 900) return;

      const heading = computeTiltCompensatedHeading(ev.alpha, ev.beta, ev.gamma);
      pushHeadingSample(heading, false);
    };

    window.addEventListener(
      'deviceorientationabsolute' as unknown as keyof WindowEventMap,
      onAbsoluteOrientation as EventListener,
      true
    );
    window.addEventListener('deviceorientation', onStandardOrientation, true);

    const noSensorTimer = window.setTimeout(() => {
      if (unwrappedHeadingRef.current === null) {
        setSensorMode('unsupported');
      }
    }, 2500);

    return () => {
      window.clearTimeout(noSensorTimer);
      window.removeEventListener(
        'deviceorientationabsolute' as unknown as keyof WindowEventMap,
        onAbsoluteOrientation as EventListener,
        true
      );
      window.removeEventListener(
        'deviceorientation',
        onStandardOrientation,
        true
      );
    };
  }, [isOpen]);

  const handleUseGps = async () => {
    setGpsStatus('loading');
    setGpsError(null);
    setGpsReason(null);
    const res = await detectAndSaveGpsLocation();
    if (res.ok && res.preference) {
      setLocPref(res.preference);
      setGpsStatus('idle');
    } else {
      setGpsStatus('error');
      setGpsError(res.message);
      setGpsReason(res.reason || 'error');
    }
  };

  const handleSelectCity = (cityId: string) => {
    const city = PRESET_CITIES.find((c) => c.id === cityId);
    if (!city) return;
    const nextPref: PrayerLocationPreference = {
      mode: 'city',
      cityId: city.id,
      lat: city.lat,
      lng: city.lng,
      cityLabel: city.nameAr,
      city: city.nameAr,
      country: city.countryAr,
      updatedAt: Date.now(),
    };
    setLocPref(nextPref);
    savePrayerLocationPreference(nextPref);
    setGpsError(null);
    setGpsReason(null);
  };

  const qibla = useMemo(
    () => calculateQiblaDirection(locPref.lat, locPref.lng),
    [locPref.lat, locPref.lng]
  );

  if (!isOpen) return null;

  const hasLiveHeading = unwrappedHeadingDeg !== null;
  const normalizedHeading = hasLiveHeading
    ? normalizeDeg(unwrappedHeadingDeg)
    : null;

  // تدوير وردة البوصلة (ش/ق/ج/غ) عكس دوران الهاتف ليشير (ش) دائماً إلى الشمال الحقيقي،
  // وإبرة الكعبة مرسومة داخل الوردة عند زاوية القبلة (bearingDeg)، فتدور معها لتطابق الاتجاه الفعلي بدقة.
  const roseRotationDeg = hasLiveHeading ? -unwrappedHeadingDeg : 0;
  const deltaToQibla =
    normalizedHeading !== null
      ? shortestSignedDelta(normalizedHeading, qibla.bearingDeg)
      : null;
  const isAlignedToQibla =
    deltaToQibla !== null && Math.abs(deltaToQibla) <= 6;
  const isNearKaaba = qibla.distanceKm <= 2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#081A14]/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="بوصلة تحديد اتجاه القبلة"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto manuscript-folio rounded-[6px] p-6 sm:p-8 text-center shadow-2xl"
      >
        <CornerOrnaments />

        <div className="flex items-center justify-between pb-3 border-b border-[#B8924A]/35">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#B8924A]" aria-hidden="true" />
            <h3 className="font-calligraphy font-bold text-2xl text-[#0F3D2E]">
              بوصلة القبلة الشريفة
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق البوصلة"
            className="min-w-[38px] min-h-[38px] rounded-[5px] border border-[#B8924A]/40 text-[#425B51] hover:bg-[#F3ECDA] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Location Controls inside Compass */}
        <div className="mt-3 space-y-2 bg-[#F3ECDA]/75 border border-[#B8924A]/30 rounded-[6px] p-2.5 text-right">
          <div className="relative">
            <Search
              className="w-3.5 h-3.5 text-[#7A5E2A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="ابحث عن المدينة يدوياً..."
              aria-label="ابحث عن المدينة"
              className="w-full min-h-[34px] pr-8 pl-2.5 rounded-[5px] bg-[#FAF6EC] border border-[#B8924A]/40 text-xs text-[#0F3D2E] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <select
              value={locPref.mode === 'city' && !citySearch.trim() ? locPref.cityId : ''}
              onChange={(e) => handleSelectCity(e.target.value)}
              aria-label="اختر المدينة لحساب القبلة"
              className="flex-1 min-w-[140px] min-h-[36px] px-2.5 rounded-[5px] bg-[#FAF6EC] border border-[#B8924A]/45 text-xs font-bold text-[#0F3D2E] focus:outline-none"
            >
              {locPref.mode === 'gps' && (
                <option value="">{locPref.cityLabel} (GPS)</option>
              )}
              {filteredCities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAr} — {c.countryAr}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void handleUseGps()}
              disabled={gpsStatus === 'loading'}
              className="min-h-[36px] px-3 py-1 rounded-[5px] bg-[#0F3D2E] hover:bg-[#17513E] text-[#FAF6EC] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-65 shrink-0"
            >
              <LocateFixed className="w-3.5 h-3.5 text-[#D9B96A]" aria-hidden="true" />
              <span>{gpsStatus === 'loading' ? 'جارٍ التحديد...' : 'موقعي GPS'}</span>
            </button>
          </div>
        </div>

        {gpsError && (
          <div className="mt-2 rounded-[5px] bg-[#F3ECDA] border border-[#B8924A]/50 p-2 text-center space-y-1.5">
            <p className="text-[11px] font-medium text-[#7A5E2A] leading-relaxed">
              {gpsError}
            </p>
            {isAndroid && gpsReason === 'denied' && (
              <button
                type="button"
                onClick={() => void openAppLocationPermissionSettings()}
                className="min-h-[32px] px-3 py-1 btn-manuscript text-[11px] inline-flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3 h-3" aria-hidden="true" />
                <span>فتح إعدادات التطبيق</span>
              </button>
            )}
            {isAndroid && gpsReason === 'location-disabled' && (
              <button
                type="button"
                onClick={() => void openDeviceLocationSettings()}
                className="min-h-[32px] px-3 py-1 btn-manuscript text-[11px] inline-flex items-center gap-1 cursor-pointer"
              >
                <LocateFixed className="w-3 h-3" aria-hidden="true" />
                <span>فتح إعدادات الموقع</span>
              </button>
            )}
          </div>
        )}

        <div className="my-4 flex flex-col items-center">
          {/* Fixed top aim indicator representing the top edge of the phone */}
          <div
            className={`mb-1.5 px-2.5 py-0.5 rounded-[4px] text-[11px] font-bold flex items-center gap-1 border transition-colors ${
              isAlignedToQibla
                ? 'bg-[#1F6B50] border-[#D9B96A] text-[#FAF6EC]'
                : 'bg-[#F3ECDA] border-[#B8924A]/45 text-[#0F3D2E]'
            }`}
          >
            {isAlignedToQibla ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D9B96A]" aria-hidden="true" />
                <span>أنت متجه نحو مكة المكرمة ✓</span>
              </>
            ) : deltaToQibla !== null ? (
              <span>
                {deltaToQibla > 0
                  ? `أدر الهاتف لليمين ${toArabicNums(Math.round(Math.abs(deltaToQibla)))}°`
                  : `أدر الهاتف لليسار ${toArabicNums(Math.round(Math.abs(deltaToQibla)))}°`}
              </span>
            ) : (
              <span>اتجاه القبلة من الشمال الحقيقي</span>
            )}
          </div>

          <div
            className={`relative w-60 h-60 rounded-full bg-[#0F3D2E] border-2 shadow-inner flex items-center justify-center transition-colors ${
              isAlignedToQibla
                ? 'border-[#D9B96A] ring-4 ring-[#D9B96A]/35'
                : 'border-[#B8924A]'
            }`}
          >
            {/* Fixed top phone-aim triangle */}
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[10px] border-t-[#D9B96A]"
              aria-hidden="true"
            />

            {/* Rotating Compass Rose (North/East/South/West + Kaaba Needle anchored at bearingDeg) */}
            <div
              className="relative w-52 h-52 rounded-full border border-[#D9B96A]/35 will-change-transform flex items-center justify-center"
              style={{ transform: `rotate(${roseRotationDeg}deg)` }}
            >
              <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-xs font-bold text-[#D9B96A]">
                ش
              </span>
              <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-xs font-bold text-[#FAF6EC]/75">
                ج
              </span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#FAF6EC]/75">
                ق
              </span>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#FAF6EC]/75">
                غ
              </span>

              {/* Kaaba Bearing Pointer locked to bearingDeg on the Compass Rose (0 deg points strictly UP) */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-start pt-5"
                style={{ transform: `rotate(${qibla.bearingDeg}deg)` }}
              >
                <svg
                  viewBox="0 0 48 64"
                  className="w-11 h-14 drop-shadow"
                  aria-hidden="true"
                >
                  {/* Straight-up golden pointer tip */}
                  <polygon
                    points="24,2 34,26 24,21 14,26"
                    fill="#D9B96A"
                    stroke="#FAF6EC"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  {/* Minimal Kaaba emblem aligned on needle shaft */}
                  <rect
                    x="17"
                    y="28"
                    width="14"
                    height="15"
                    rx="1.5"
                    fill="#081A14"
                    stroke="#D9B96A"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="17"
                    y1="33"
                    x2="31"
                    y2="33"
                    stroke="#D9B96A"
                    strokeWidth="2"
                  />
                </svg>
                <span className="mt-0.5 px-1.5 py-0.5 rounded-[4px] bg-[#081A14]/85 border border-[#D9B96A]/60 text-[10px] font-bold text-[#FAF6EC]">
                  مكة
                </span>
              </div>
            </div>

            {/* Center pivot */}
            <div
              className="absolute w-3 h-3 rounded-full bg-[#D9B96A] border border-[#081A14] z-10"
              aria-hidden="true"
            />
          </div>

          <div className="mt-4 space-y-1">
            <p className="font-display font-bold text-lg text-[#0F3D2E] tabular-nums">
              زاوية القبلة: {toArabicNums(qibla.bearingDeg)}° ({qibla.cardinalAr})
            </p>
            <p className="text-xs text-[#425B51] tabular-nums">
              {locPref.cityLabel} ·{' '}
              {isNearKaaba
                ? 'أنت في رحاب مكة المكرمة'
                : `المسافة إلى الكعبة المشرفة: ${toArabicNums(qibla.distanceKm)} كم`}
            </p>
          </div>
        </div>

        <ManuscriptDivider variant="crescent" />

        <p className="mt-3 text-xs text-[#425B51] leading-relaxed">
          {sensorMode === 'absolute' && normalizedHeading !== null
            ? `مستشعر البوصلة المغناطيسي نشط (اتجاه رأس الهاتف: ${toArabicNums(
                Math.round(normalizedHeading)
              )}°). إن لاحظت أي انحراف، حرّك الهاتف في الهواء بشكل رقم 8 لمعايرة البوصلة.`
            : sensorMode === 'relative-fallback' && normalizedHeading !== null
            ? `تنبيه: جهازك يرسل حركة نسبية بدون بوصلة شمال مطلق (${toArabicNums(
                Math.round(normalizedHeading)
              )}°). للثقة الكاملة استخدم مستشعراً مغناطيسياً أو وجّه حرف (ش) نحو الشمال الجغرافي.`
            : 'أمسك الهاتف بشكل مسطّح؛ الإبرة الذهبية مضبوطة على الزاوية الفلكية لمكة المكرمة من الشمال الحقيقي.'}
        </p>
      </div>
    </div>
  );
};
