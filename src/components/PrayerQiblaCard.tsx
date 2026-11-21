import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, Compass, LocateFixed, MapPin, Navigation, X } from 'lucide-react';
import { loadAdhanSettings } from '../data/adhanSettings';
import {
  ensureNotificationPermissionIfMissing,
  getNotificationPermissionAsync,
} from '../utils/notificationManager';
import {
  PRESET_CITIES,
  PrayerLocationPreference,
  PrayerTimesData,
  calculateQiblaDirection,
  computeLocalAdhanPrayerTimes,
  formatHHMMArabic12h,
  getNextPrayerInfo,
  loadPrayerLocationPreference,
  savePrayerLocationPreference,
  toArabicNums,
} from '../utils/prayerTimes';
import {
  ManuscriptCornerBracket,
  ManuscriptDivider,
  MinaretAdhanIcon,
} from './IslamicOrnaments';

interface PrayerQiblaCardProps {
  onOpenAdhanSettings?: () => void;
}

export const PrayerQiblaCard: React.FC<PrayerQiblaCardProps> = ({
  onOpenAdhanSettings,
}) => {
  const [locPref, setLocPref] = useState<PrayerLocationPreference>(() =>
    loadPrayerLocationPreference()
  );
  const [adhanSettings, setAdhanSettings] = useState(() => loadAdhanSettings());
  const [loadingGps, setLoadingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());
  const [qiblaModalOpen, setQiblaModalOpen] = useState(false);
  const [headingDeg, setHeadingDeg] = useState<number | null>(null);
  const [sensorStatus, setSensorStatus] = useState<'idle' | 'active' | 'unsupported'>('idle');
  const [notifPermission, setNotifPermission] = useState<
    NotificationPermission | 'unsupported'
  >('granted');

  useEffect(() => {
    const syncAdhan = () => setAdhanSettings(loadAdhanSettings());
    const syncLoc = () => setLocPref(loadPrayerLocationPreference());
    const checkNotif = () => {
      void getNotificationPermissionAsync().then(setNotifPermission);
    };
    checkNotif();
    window.addEventListener('rihlat:adhan-settings-updated', syncAdhan);
    window.addEventListener('rihlat:prayer-location-updated', syncLoc);
    window.addEventListener('focus', checkNotif);
    return () => {
      window.removeEventListener('rihlat:adhan-settings-updated', syncAdhan);
      window.removeEventListener('rihlat:prayer-location-updated', syncLoc);
      window.removeEventListener('focus', checkNotif);
    };
  }, []);

  const handleQuickAllowNotifications = async () => {
    const granted = await ensureNotificationPermissionIfMissing();
    const updated = await getNotificationPermissionAsync();
    setNotifPermission(granted ? 'granted' : updated);
  };

  const prayerData: PrayerTimesData = useMemo(
    () =>
      computeLocalAdhanPrayerTimes(
        locPref.lat,
        locPref.lng,
        locPref.cityLabel,
        now,
        adhanSettings
      ),
    [locPref, now, adhanSettings]
  );

  // Live 1-second tick for next-prayer countdown
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Device orientation listener when Qibla compass modal is opened
  useEffect(() => {
    if (!qiblaModalOpen || typeof window === 'undefined') return;
    if (!('DeviceOrientationEvent' in window)) {
      setSensorStatus('unsupported');
      return;
    }

    const onOrientation = (ev: DeviceOrientationEvent) => {
      const webkitHeading = (ev as unknown as { webkitCompassHeading?: number })
        .webkitCompassHeading;
      if (typeof webkitHeading === 'number' && Number.isFinite(webkitHeading)) {
        setHeadingDeg(webkitHeading);
        setSensorStatus('active');
      } else if (typeof ev.alpha === 'number' && Number.isFinite(ev.alpha)) {
        setHeadingDeg((360 - ev.alpha) % 360);
        setSensorStatus('active');
      }
    };

    window.addEventListener('deviceorientation', onOrientation, true);
    return () => window.removeEventListener('deviceorientation', onOrientation, true);
  }, [qiblaModalOpen]);

  const requestIosCompassIfNeeded = async () => {
    const DevOrient = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (DevOrient && typeof DevOrient.requestPermission === 'function') {
      try {
        const res = await DevOrient.requestPermission();
        if (res !== 'granted') setSensorStatus('unsupported');
      } catch {
        setSensorStatus('unsupported');
      }
    }
  };

  const handleCitySelect = (cityId: string) => {
    const found = PRESET_CITIES.find((c) => c.id === cityId);
    if (!found) return;
    setGpsError(null);
    const next: PrayerLocationPreference = {
      mode: 'city',
      cityId: found.id,
      lat: found.lat,
      lng: found.lng,
      cityLabel: found.nameAr,
    };
    setLocPref(next);
    savePrayerLocationPreference(next);
  };

  const handleUseGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('متصفحك لا يدعم تحديد الموقع التلقائي، اختر المدينة من القائمة.');
      return;
    }
    setLoadingGps(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoadingGps(false);
        const next: PrayerLocationPreference = {
          mode: 'gps',
          cityId: 'gps',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          cityLabel: 'موقعي الحالي (GPS)',
        };
        setLocPref(next);
        savePrayerLocationPreference(next);
      },
      () => {
        setLoadingGps(false);
        setGpsError('تعذّر الوصول للموقع الجغرافي، يمكنك اختيار مدينتك من القائمة.');
      },
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 600000 }
    );
  };

  const nextPrayer = useMemo(
    () => getNextPrayerInfo(prayerData.timings, now),
    [prayerData.timings, now]
  );

  const qibla = useMemo(
    () => calculateQiblaDirection(locPref.lat, locPref.lng),
    [locPref.lat, locPref.lng]
  );

  const prayerRows: {
    key: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
    label: string;
    value: string;
  }[] = [
    { key: 'fajr', label: 'الفجر', value: prayerData.timings.fajr },
    { key: 'sunrise', label: 'الشروق', value: prayerData.timings.sunrise },
    { key: 'dhuhr', label: 'الظهر', value: prayerData.timings.dhuhr },
    { key: 'asr', label: 'العصر', value: prayerData.timings.asr },
    { key: 'maghrib', label: 'المغرب', value: prayerData.timings.maghrib },
    { key: 'isha', label: 'العشاء', value: prayerData.timings.isha },
  ];

  const arrowRotationDeg =
    headingDeg !== null ? qibla.bearingDeg - headingDeg : qibla.bearingDeg;

  return (
    <>
      <section
        aria-label="مواقيت الصلاة واتجاه القبلة"
        className="manuscript-folio rounded-[6px] p-4 sm:p-5 space-y-4"
      >
        {/* Top Bar: City Selector + Next Prayer Countdown + Qibla & Adhan Settings */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-3 border-b border-[#B8924A]/30">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-[#0F3D2E]">
              <MapPin className="w-4 h-4 text-[#B8924A] shrink-0" aria-hidden="true" />
              <label htmlFor="prayer-city-select" className="sr-only">
                اختر المدينة لمواقيت الصلاة
              </label>
              <select
                id="prayer-city-select"
                value={locPref.mode === 'gps' ? 'gps' : locPref.cityId}
                onChange={(e) => {
                  if (e.target.value !== 'gps') handleCitySelect(e.target.value);
                }}
                className="min-h-[38px] px-2.5 py-1 rounded-[5px] bg-[#F3ECDA] border border-[#B8924A]/50 font-display font-bold text-xs sm:text-sm text-[#0F3D2E] focus:outline-none focus:border-[#0F3D2E] cursor-pointer"
              >
                {locPref.mode === 'gps' && (
                  <option value="gps">موقعي الحالي (GPS)</option>
                )}
                {PRESET_CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameAr} — {c.countryAr}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleUseGps}
              disabled={loadingGps}
              className="min-h-[38px] px-3 py-1 btn-manuscript text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              <LocateFixed className="w-3.5 h-3.5 text-[#1F6B50]" aria-hidden="true" />
              <span>{loadingGps ? 'جارٍ التحديد...' : 'موقعي التلقائي'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setQiblaModalOpen(true);
                void requestIosCompassIfNeeded();
              }}
              className="min-h-[38px] px-3 py-1 btn-emerald text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5 text-[#D9B96A]" aria-hidden="true" />
              <span>القبلة ({toArabicNums(qibla.bearingDeg)}°)</span>
            </button>

            {onOpenAdhanSettings && (
              <button
                type="button"
                onClick={onOpenAdhanSettings}
                className="min-h-[38px] px-3 py-1 btn-gilded text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <MinaretAdhanIcon className="w-3.5 h-3.5 text-[#0F3D2E]" />
                <span>إعدادات الأذان</span>
              </button>
            )}

            {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
              <button
                type="button"
                onClick={() => void handleQuickAllowNotifications()}
                className="min-h-[38px] px-3 py-1 btn-manuscript text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="تفعيل إذن الإشعارات حتى في وقت الأذان"
              >
                <BellRing className="w-3.5 h-3.5 text-[#1F6B50]" aria-hidden="true" />
                <span>السماح بالإشعارات</span>
              </button>
            )}
          </div>

          {/* Next Prayer Countdown */}
          <div className="flex items-center justify-between md:justify-end gap-3 bg-[#0F3D2E] text-[#FAF6EC] border border-[#B8924A]/65 rounded-[5px] px-3.5 py-2">
            <div className="text-right">
              <span className="text-[11px] text-[#D9B96A] block">
                الصلاة القادمة: {nextPrayer.nameAr} ({nextPrayer.time12hAr})
              </span>
            </div>
            <span
              dir="ltr"
              className="font-display font-bold text-base sm:text-lg text-[#D9B96A] tabular-nums"
            >
              {nextPrayer.countdownAr}
            </span>
          </div>
        </div>

        {gpsError && (
          <p className="text-xs font-medium text-[#7A5E2A]">{gpsError}</p>
        )}

        {/* 6-Column Prayer Ledger */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {prayerRows.map((p) => {
            const isNext = nextPrayer.key === p.key && !nextPrayer.isTomorrow;
            const alertCfg =
              p.key !== 'sunrise' ? adhanSettings.prayers[p.key] : null;
            return (
              <div
                key={p.key}
                className={`rounded-[5px] border px-2.5 py-2 text-center transition-colors ${
                  isNext
                    ? 'bg-[#0F3D2E] text-[#FAF6EC] border-[#D9B96A]'
                    : 'bg-[#FAF6EC] text-[#11271F] border-[#B8924A]/35'
                }`}
              >
                <div
                  className={`text-[11px] font-bold ${
                    isNext ? 'text-[#D9B96A]' : 'text-[#425B51]'
                  }`}
                >
                  {p.label}
                </div>
                <div className="mt-0.5 font-display font-bold text-xs sm:text-sm tabular-nums">
                  {formatHHMMArabic12h(p.value)}
                </div>
                {alertCfg && (
                  <div
                    className={`mt-0.5 text-[10px] ${
                      isNext ? 'text-[#D9B96A]/90' : 'text-[#7A5E2A]'
                    }`}
                  >
                    {alertCfg.enabled
                      ? alertCfg.alertMode === 'adhan'
                        ? 'أذان'
                        : 'صامت'
                      : 'مطفأ'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#425B51]">
          <span>
            الحساب: <strong className="text-[#0F3D2E]">{prayerData.methodLabel}</strong>
          </span>
          <span>حساب فلكي محلي دون اتصال (مكتبة adhan)</span>
        </div>
      </section>

      {/* Interactive Qibla Compass Modal */}
      {qiblaModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#081A14]/75 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="بوصلة تحديد اتجاه القبلة"
          onClick={() => setQiblaModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md manuscript-folio rounded-[8px] p-5 sm:p-7 text-center shadow-2xl"
          >
            <ManuscriptCornerBracket position="top-right" className="absolute top-2.5 right-2.5" />
            <ManuscriptCornerBracket position="top-left" className="absolute top-2.5 left-2.5" />
            <ManuscriptCornerBracket position="bottom-right" className="absolute bottom-2.5 right-2.5" />
            <ManuscriptCornerBracket position="bottom-left" className="absolute bottom-2.5 left-2.5" />

            <div className="flex items-center justify-between pb-3 border-b border-[#B8924A]/35">
              <h3 className="font-calligraphy font-bold text-2xl text-[#0F3D2E]">
                بوصلة القبلة الشريفة
              </h3>
              <button
                type="button"
                onClick={() => setQiblaModalOpen(false)}
                aria-label="إغلاق البوصلة"
                className="min-w-[38px] min-h-[38px] rounded-[5px] border border-[#B8924A]/40 text-[#425B51] hover:bg-[#F3ECDA] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="my-5 flex flex-col items-center">
              {/* Engraved Astrolabe Compass Dial */}
              <div className="relative w-56 h-56 rounded-full bg-[#0F3D2E] border-2 border-[#D9B96A] shadow-inner flex items-center justify-center">
                <span className="absolute top-2 text-xs font-bold text-[#D9B96A]">ش</span>
                <span className="absolute bottom-2 text-xs font-bold text-[#FAF6EC]/75">ج</span>
                <span className="absolute right-3 text-xs font-bold text-[#FAF6EC]/75">ق</span>
                <span className="absolute left-3 text-xs font-bold text-[#FAF6EC]/75">غ</span>

                {/* Inner gold degree ring */}
                <div className="w-44 h-44 rounded-full border border-[#D9B96A]/35 flex items-center justify-center relative">
                  <div
                    className="transition-transform duration-300 ease-out flex flex-col items-center"
                    style={{ transform: `rotate(${arrowRotationDeg}deg)` }}
                  >
                    <Navigation
                      className="w-12 h-12 text-[#D9B96A] fill-[#D9B96A]"
                      aria-hidden="true"
                    />
                    <span className="mt-1 text-[10px] font-bold text-[#FAF6EC]">
                      الكعبة
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-1">
                <p className="font-display font-bold text-lg text-[#0F3D2E] tabular-nums">
                  زاوية القبلة: {toArabicNums(qibla.bearingDeg)}° ({qibla.cardinalAr})
                </p>
                <p className="text-xs text-[#425B51] tabular-nums">
                  {locPref.cityLabel} · المسافة إلى مكة المكرمة: {toArabicNums(qibla.distanceKm)} كم
                </p>
              </div>
            </div>

            <ManuscriptDivider variant="crescent" />

            <p className="mt-3 text-xs text-[#425B51] leading-relaxed">
              {sensorStatus === 'active' && headingDeg !== null
                ? `البوصلة تتحرك تلقائياً وفق مستشعر جهازك (الاتجاه الحالي: ${toArabicNums(
                    Math.round(headingDeg)
                  )}° من الشمال).`
                : 'الاتجاه الموضح مقاس عقارب الساعة بدءاً من الشمال الحقيقي؛ إذا لم يدعم جهازك مستشعر المغناطيسية، وجّه الأعلى نحو الشمال الجغرافي.'}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
