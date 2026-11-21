import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  ArrowRight,
  BatteryCharging,
  BellRing,
  CheckCircle2,
  Clock,
  LocateFixed,
  MapPin,
  Minus,
  Play,
  Plus,
  RefreshCw,
  ShieldAlert,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  MUEZZIN_ENTRIES,
  getMuezzinByRawName,
} from '../config/muezzins';
import {
  AdhanSettings,
  CALCULATION_METHOD_PRESETS,
  CalculationMethodId,
  PRAYER_ALERT_KEYS,
  PRAYER_LABELS_AR,
  PRE_REMINDER_OPTIONS,
  PrayerAlertKey,
  SalatAlLaylSoundMode,
  clampSalatAlLaylTime,
  loadAdhanSettings,
  saveAdhanSettings,
} from '../data/adhanSettings';
import {
  AdhanSchedulerPlugin,
  isCustomAdhanPluginAvailable,
} from '../plugins/adhanNativePlugin';
import {
  AdhanPlaybackState,
  getAdhanPlaybackState,
  playLocalMuezzinPreview,
  stopAnyAdhanPlayback,
  subscribeAdhanPlaybackState,
} from '../utils/adhanAudioPlayer';
import {
  CombinedAdhanDiagnostics,
  getCombinedAdhanDiagnostics,
  syncAdhanAndPrayerAlarms,
  triggerPrayerAdhanTestNow,
} from '../utils/adhanScheduler';
import {
  ensureNotificationPermissionIfMissing,
  requestNotificationPermission,
} from '../utils/notificationManager';
import {
  PRESET_CITIES,
  PrayerLocationPreference,
  computeLocalAdhanPrayerTimes,
  formatHHMMArabic12h,
  loadPrayerLocationPreference,
  savePrayerLocationPreference,
  toArabicNums,
} from '../utils/prayerTimes';
import {
  CrescentBellIcon,
  ManuscriptCornerBracket,
  ManuscriptDivider,
  MinaretAdhanIcon,
  NightPrayerLampIcon,
} from './IslamicOrnaments';

interface AdhanSettingsScreenProps {
  onBackHome: () => void;
}

const SALAT_LAYL_HOURS: { value: string; label: string }[] = [
  { value: '22', label: '١٠ مساءً' },
  { value: '23', label: '١١ مساءً' },
  { value: '00', label: '١٢ منتصف الليل' },
];

const SALAT_LAYL_MINUTES: string[] = [
  '00',
  '05',
  '10',
  '15',
  '20',
  '25',
  '30',
  '35',
  '40',
  '45',
  '50',
  '55',
];

export const AdhanSettingsScreen: React.FC<AdhanSettingsScreenProps> = ({
  onBackHome,
}) => {
  const [settings, setSettings] = useState<AdhanSettings>(() => loadAdhanSettings());
  const [locPref, setLocPref] = useState<PrayerLocationPreference>(() =>
    loadPrayerLocationPreference()
  );
  const [loadingGps, setLoadingGps] = useState(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);
  const [playback, setPlayback] = useState<AdhanPlaybackState>(() =>
    getAdhanPlaybackState()
  );
  const [diagnostics, setDiagnostics] = useState<CombinedAdhanDiagnostics | null>(
    null
  );
  const [rescheduling, setRescheduling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showVerifyGuide, setShowVerifyGuide] = useState(false);
  const [showOemGuide, setShowOemGuide] = useState(false);

  const isNative = Capacitor.isNativePlatform();
  const isAndroid = isNative && Capacitor.getPlatform() === 'android';

  const refreshDiagnostics = useCallback(async () => {
    const diag = await getCombinedAdhanDiagnostics();
    setDiagnostics(diag);
  }, []);

  useEffect(() => {
    void refreshDiagnostics();
    const unsubPlayback = subscribeAdhanPlaybackState(setPlayback);
    const onMetaUpdated = () => {
      void refreshDiagnostics();
    };
    window.addEventListener('rihlat:adhan-meta-updated', onMetaUpdated);
    return () => {
      unsubPlayback();
      window.removeEventListener('rihlat:adhan-meta-updated', onMetaUpdated);
    };
  }, [refreshDiagnostics]);

  const updateSettings = (next: AdhanSettings) => {
    setSettings(next);
    saveAdhanSettings(next);
    window.setTimeout(() => {
      void refreshDiagnostics();
    }, 300);
  };

  const todayPrayers = useMemo(
    () =>
      computeLocalAdhanPrayerTimes(
        locPref.lat,
        locPref.lng,
        locPref.cityLabel,
        new Date(),
        settings
      ),
    [locPref, settings]
  );

  const handleMethodChange = (methodId: CalculationMethodId) => {
    const preset = CALCULATION_METHOD_PRESETS.find((m) => m.id === methodId);
    const nextCustom =
      methodId === 'custom'
        ? settings.customAngles
        : preset
        ? {
            fajrAngle: preset.fajrAngle,
            maghribAngle: preset.maghribAngle,
            ishaAngle: preset.ishaAngle,
          }
        : settings.customAngles;

    updateSettings({
      ...settings,
      methodId,
      customAngles: nextCustom,
    });
  };

  const handleCustomAngleChange = (
    field: 'fajrAngle' | 'maghribAngle' | 'ishaAngle',
    valStr: string
  ) => {
    const num = Number(valStr);
    if (!Number.isFinite(num)) return;
    const clamped = Math.round(Math.max(0, Math.min(24, num)) * 10) / 10;
    updateSettings({
      ...settings,
      methodId: 'custom',
      customAngles: {
        ...settings.customAngles,
        [field]: clamped,
      },
    });
  };

  const handlePrayerPatch = (
    key: PrayerAlertKey,
    patch: Partial<AdhanSettings['prayers'][PrayerAlertKey]>
  ) => {
    const turningOn = patch.enabled === true && !settings.prayers[key].enabled;
    updateSettings({
      ...settings,
      prayers: {
        ...settings.prayers,
        [key]: {
          ...settings.prayers[key],
          ...patch,
        },
      },
    });
    if (turningOn) {
      void ensureNotificationPermissionIfMissing().then(() => {
        void refreshDiagnostics();
      });
    }
  };

  const handleApplyMuezzinToAll = (rawName: string) => {
    const nextPrayers = { ...settings.prayers };
    for (const k of PRAYER_ALERT_KEYS) {
      nextPrayers[k] = {
        ...nextPrayers[k],
        muezzinRawName: rawName,
      };
    }
    updateSettings({
      ...settings,
      prayers: nextPrayers,
      salatAlLayl: {
        ...settings.salatAlLayl,
        muezzinRawName: rawName,
      },
    });
    const m = getMuezzinByRawName(rawName);
    setStatusMessage(`تم اعتماد صوت المؤذن «${m.displayName}» لجميع الصلوات.`);
  };

  const handleCitySelect = (cityId: string) => {
    const found = PRESET_CITIES.find((c) => c.id === cityId);
    if (!found) return;
    setGpsNotice(null);
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
      setGpsNotice('الجهاز لا يدعم تحديد الموقع التلقائي، اختر المدينة من القائمة.');
      return;
    }
    setLoadingGps(true);
    setGpsNotice(null);
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
        setStatusMessage('تم تحديث الإحداثيات الجغرافية وإعادة جدولة ١٤ يوماً.');
      },
      () => {
        setLoadingGps(false);
        setGpsNotice('تعذّر الوصول لـ GPS؛ تأكد من تفعيل الموقع أو اختر المدينة يدوياً.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleToggleMuezzinPreview = async (rawName: string) => {
    if (playback.isPlaying && playback.muezzinRawName === rawName) {
      await stopAnyAdhanPlayback();
      return;
    }
    await playLocalMuezzinPreview(rawName);
  };

  const handleTestPrayer = async (
    key: PrayerAlertKey | 'salat_allayl'
  ) => {
    if (diagnostics && !diagnostics.notificationsGranted) {
      await ensureNotificationPermissionIfMissing();
      await refreshDiagnostics();
    }
    const res = await triggerPrayerAdhanTestNow({ prayerKey: key });
    if (res.usedFallbackSound) {
      setStatusMessage(
        'ملف المؤذن غير موجود بعد في مجلد res/raw؛ تم تشغيل النغمة الافتراضية بدلاً منه دون تعطيل الجدولة.'
      );
    } else if (key === 'salat_allayl') {
      setStatusMessage('تم إرسال تجربة تذكير صلاة الليل الآن.');
    } else {
      setStatusMessage(`تم إرسال تجربة أذان صلاة ${PRAYER_LABELS_AR[key]} الآن.`);
    }
  };

  const handleManualReschedule = async () => {
    setRescheduling(true);
    if (diagnostics && !diagnostics.notificationsGranted) {
      await ensureNotificationPermissionIfMissing();
    }
    const meta = await syncAdhanAndPrayerAlarms();
    await refreshDiagnostics();
    setRescheduling(false);
    setStatusMessage(
      `تمت إعادة جدولة ${toArabicNums(meta.scheduledCount)} تنبيهاً للأيام الـ ١٤ القادمة بنجاح.`
    );
  };

  const handleRequestNotifPerm = async () => {
    let granted = false;
    if (isCustomAdhanPluginAvailable()) {
      const res = await AdhanSchedulerPlugin.requestNotificationPermission();
      granted = Boolean(res.granted);
      if (!granted) {
        await AdhanSchedulerPlugin.openAppNotificationSettings();
      }
    } else {
      granted = await requestNotificationPermission();
    }
    await syncAdhanAndPrayerAlarms();
    await refreshDiagnostics();
    if (granted) {
      setStatusMessage('تم منح إذن الإشعارات بنجاح؛ ستصلك التنبيهات حتى في وقت الأذان.');
    }
  };

  const handleToggleAllowDuringAdhan = async () => {
    const nextAllow = !settings.allowNotificationsDuringAdhan;
    updateSettings({
      ...settings,
      allowNotificationsDuringAdhan: nextAllow,
    });
    if (nextAllow) {
      const granted = await ensureNotificationPermissionIfMissing();
      await syncAdhanAndPrayerAlarms();
      await refreshDiagnostics();
      setStatusMessage(
        granted
          ? 'تم تفعيل السماح للإشعارات حتى في وقت الأذان وإضافة إذن الإشعارات بنجاح.'
          : 'تم تفعيل السماح للإشعارات حتى في وقت الأذان؛ يُرجى الموافقة على إذن الإشعارات من إعدادات الجهاز.'
      );
    } else {
      setStatusMessage('تم تحديث تفضيل الإشعارات أثناء وقت الأذان.');
    }
  };

  const handleOpenExactAlarm = async () => {
    if (isCustomAdhanPluginAvailable()) {
      await AdhanSchedulerPlugin.openExactAlarmSettings();
      window.setTimeout(() => void refreshDiagnostics(), 1200);
    }
  };

  const handleRequestBatteryExemption = async () => {
    if (isCustomAdhanPluginAvailable()) {
      await AdhanSchedulerPlugin.requestBatteryOptimizationExemption();
      window.setTimeout(() => void refreshDiagnostics(), 1200);
    }
  };

  const handleOpenDndSettings = async () => {
    if (isCustomAdhanPluginAvailable() && AdhanSchedulerPlugin.openNotificationPolicySettings) {
      await AdhanSchedulerPlugin.openNotificationPolicySettings();
      window.setTimeout(() => void refreshDiagnostics(), 1200);
    }
  };

  // تفكيك وقت صلاة الليل (محصور 22:00 - 00:00)
  const clampedLaylTime = clampSalatAlLaylTime(settings.salatAlLayl.timeHHMM);
  const [laylHour, laylMinute] = clampedLaylTime.split(':');

  const handleLaylTimePart = (nextHour: string, nextMinute: string) => {
    const safeMin = nextHour === '00' ? '00' : nextMinute;
    const clamped = clampSalatAlLaylTime(`${nextHour}:${safeMin}`);
    updateSettings({
      ...settings,
      salatAlLayl: {
        ...settings.salatAlLayl,
        timeHHMM: clamped,
      },
    });
  };

  return (
    <main
      dir="rtl"
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 text-[#11271F]"
    >
      {/* Top Page Masthead */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#B8924A]/35">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackHome}
            className="min-h-[42px] px-3.5 py-1.5 btn-manuscript text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <ArrowRight className="w-4 h-4 text-[#0F3D2E]" aria-hidden="true" />
            <span>الرئيسية</span>
          </button>
          <div className="min-w-0">
            <h1 className="font-calligraphy font-bold text-2xl sm:text-3xl text-[#0F3D2E] truncate">
              إعدادات الأذان وتنبيهات الصلاة
            </h1>
            <p className="text-xs sm:text-sm text-[#425B51]">
              حساب محلي دون إنترنت وجدولة أربعة عشر يوماً مع تحكم مستقل لكل صلاة
            </p>
          </div>
        </div>

        <MinaretAdhanIcon className="w-8 h-8 text-[#B8924A] hidden sm:block shrink-0" />
      </div>

      {/* Web-Only Friendly Notice (No Server Needed) */}
      {!isNative && (
        <div className="rounded-[6px] bg-[#F3ECDA] border border-[#B8924A]/60 p-4 flex items-start gap-3">
          <CrescentBellIcon className="w-5 h-5 text-[#0F3D2E] shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-[#11271F] leading-relaxed">
            <strong className="text-[#0F3D2E] block font-display">
              لتنبيهات الأذان وهو مغلق، حمّل نسخة الأندرويد
            </strong>
            <span className="text-[#425B51]">
              أنت تتصفح الآن من المتصفح؛ يمكنك تجربة أصوات المؤذنين وضبط المواقيت وحسابها محلياً بالكامل، بينما تعمل الجدولة التلقائية في الخلفية والتطبيق مغلق تماماً داخل تطبيق الأندرويد (APK).
            </span>
          </div>
        </div>
      )}

      {/* Missing Notification Permission Banner ("إذا كانت غير مضافة") */}
      {diagnostics && !diagnostics.notificationsGranted && (
        <div className="rounded-[6px] bg-[#0F3D2E] text-[#FAF6EC] border border-[#D9B96A]/75 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <BellRing className="w-5 h-5 text-[#D9B96A] shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs sm:text-sm leading-relaxed">
              <strong className="block font-display text-[#FAF6EC]">
                إذن الإشعارات غير مضاف بعد
              </strong>
              <span className="text-[#DFECE6]/85">
                فعّل السماح للإشعارات الآن لتصلك تنبيهات الصلاة والأذكار والتذكير القبلي حتى في وقت الأذان.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleRequestNotifPerm()}
            className="min-h-[44px] px-4 py-2 btn-gilded text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <BellRing className="w-4 h-4" aria-hidden="true" />
            <span>السماح للإشعارات الآن</span>
          </button>
        </div>
      )}

      {/* Active Playback / Stop Adhan Strip */}
      {playback.isPlaying && (
        <div className="rounded-[6px] bg-[#0F3D2E] text-[#FAF6EC] border border-[#D9B96A] p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Volume2 className="w-5 h-5 text-[#D9B96A] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <span className="text-[11px] text-[#D9B96A] block">قيد التشغيل الآن</span>
              <strong className="font-display text-sm sm:text-base truncate block">
                {playback.label || 'الأذان الشريف'}
              </strong>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void stopAnyAdhanPlayback()}
            className="min-h-[44px] px-5 py-2 btn-gilded text-sm inline-flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Square className="w-4 h-4 fill-current" aria-hidden="true" />
            <span>إيقاف الأذان</span>
          </button>
        </div>
      )}

      {statusMessage && (
        <div className="rounded-[6px] bg-[#FAF6EC] border border-[#1F6B50]/50 px-4 py-3 text-xs sm:text-sm font-medium text-[#0F3D2E] flex items-center justify-between gap-3">
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold text-[#7A5E2A] hover:underline cursor-pointer shrink-0"
          >
            إخفاء
          </button>
        </div>
      )}

      {/* 1. Location, Calculation Method, Custom Degrees & Minute Offsets */}
      <section
        aria-label="الموقع وطريقة الحساب وتعديل الدقائق"
        className="relative manuscript-folio rounded-[6px] p-4 sm:p-6 space-y-5"
      >
        <ManuscriptCornerBracket position="top-right" className="absolute top-2.5 right-2.5" />
        <ManuscriptCornerBracket position="top-left" className="absolute top-2.5 left-2.5" />

        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#B8924A]/30">
          <div>
            <h2 className="font-display font-bold text-lg sm:text-xl text-[#0F3D2E]">
              ١. الموقع الجغرافي وطريقة الحساب الفلكي
            </h2>
            <p className="text-xs text-[#425B51] mt-0.5">
              يُحسب محلياً بمكتبة adhan الفلكية دون اتصال بالإنترنت
            </p>
          </div>
          <span className="text-xs font-semibold text-[#7A5E2A] tabular-nums" dir="ltr">
            {locPref.lat.toFixed(3)}°, {locPref.lng.toFixed(3)}°
          </span>
        </div>

        {/* GPS & City Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label
              htmlFor="adhan-city-select"
              className="block text-xs font-bold text-[#0F3D2E]"
            >
              اختيار المدينة (كبديل أو يدوي)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <MapPin
                  className="w-4 h-4 text-[#B8924A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <select
                  id="adhan-city-select"
                  value={locPref.mode === 'gps' ? 'gps' : locPref.cityId}
                  onChange={(e) => {
                    if (e.target.value !== 'gps') handleCitySelect(e.target.value);
                  }}
                  className="w-full min-h-[44px] pr-9 pl-3 rounded-[5px] bg-[#F3ECDA]/80 border border-[#B8924A]/50 font-display font-bold text-xs sm:text-sm text-[#0F3D2E] focus:outline-none focus:border-[#0F3D2E] cursor-pointer"
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
                className="min-h-[44px] px-3.5 btn-emerald text-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                <LocateFixed className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
                <span>{loadingGps ? 'جارٍ التحديد...' : 'تحديد GPS'}</span>
              </button>
            </div>
            {gpsNotice && (
              <p className="text-xs font-medium text-[#7A5E2A]">{gpsNotice}</p>
            )}
          </div>

          {/* Calculation Method */}
          <div className="space-y-1.5">
            <label
              htmlFor="adhan-method-select"
              className="block text-xs font-bold text-[#0F3D2E]"
            >
              طريقة الحساب المعتمدة
            </label>
            <select
              id="adhan-method-select"
              value={settings.methodId}
              onChange={(e) =>
                handleMethodChange(e.target.value as CalculationMethodId)
              }
              className="w-full min-h-[44px] px-3 rounded-[5px] bg-[#F3ECDA]/80 border border-[#B8924A]/50 font-display font-bold text-xs sm:text-sm text-[#0F3D2E] focus:outline-none focus:border-[#0F3D2E] cursor-pointer"
            >
              {CALCULATION_METHOD_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.labelAr}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#425B51]">
              {CALCULATION_METHOD_PRESETS.find((p) => p.id === settings.methodId)
                ?.shortDescAr || ''}
            </p>
          </div>
        </div>

        {/* Custom Angles Panel (Always accessible when custom or if user wants manual degrees) */}
        <div className="rounded-[5px] bg-[#F3ECDA]/60 border border-[#B8924A]/35 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display font-bold text-sm text-[#0F3D2E]">
                درجات زوايا الفجر والمغرب والعشاء
              </h3>
              <p className="text-[11px] text-[#425B51]">
                للجعفري عادةً: الفجر ١٦°، المغرب ٤°، العشاء ١٤°. أي تعديل يحوّل الطريقة إلى مخصصة تلقائياً.
              </p>
            </div>
            {settings.methodId !== 'custom' && (
              <button
                type="button"
                onClick={() => handleMethodChange('custom')}
                className="btn-text-ornate text-xs cursor-pointer"
              >
                تفعيل الوضع اليدوي
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              [
                ['fajrAngle', 'درجة الفجر', 'المعتاد ١٦°'],
                ['maghribAngle', 'درجة المغرب', 'المعتاد ٤°'],
                ['ishaAngle', 'درجة العشاء', 'المعتاد ١٤°'],
              ] as const
            ).map(([field, label, hint]) => (
              <div
                key={field}
                className="rounded-[4px] bg-[#FAF6EC] border border-[#B8924A]/40 p-2.5 flex items-center justify-between gap-2"
              >
                <div>
                  <label
                    htmlFor={`angle-${field}`}
                    className="text-xs font-bold text-[#0F3D2E] block"
                  >
                    {label}
                  </label>
                  <span className="text-[10px] text-[#425B51]">{hint}</span>
                </div>
                <div className="flex items-center gap-1" dir="ltr">
                  <input
                    id={`angle-${field}`}
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={settings.customAngles[field]}
                    onChange={(e) => handleCustomAngleChange(field, e.target.value)}
                    className="w-16 min-h-[38px] px-2 rounded-[4px] border border-[#B8924A]/50 bg-[#FAF6EC] text-center font-display font-bold text-sm text-[#0F3D2E] tabular-nums"
                  />
                  <span className="text-xs font-bold text-[#7A5E2A]">°</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manual Minute Adjustments (+/-) per Prayer & Live Verification */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display font-bold text-sm text-[#0F3D2E]">
              تعديل الدقائق يدوياً (+/-) ومواقيت اليوم الناتجة
            </h3>
            <button
              type="button"
              onClick={() => setShowVerifyGuide((v) => !v)}
              className="btn-text-ornate text-xs cursor-pointer"
            >
              {showVerifyGuide ? 'إخفاء شرح المطابقة' : 'كيف أتحقق من مطابقة الأوقات لمصدري؟'}
            </button>
          </div>

          {showVerifyGuide && (
            <div className="rounded-[5px] bg-[#F3ECDA]/75 border border-[#B8924A]/45 p-3.5 text-xs text-[#11271F] leading-relaxed space-y-1.5">
              <p className="font-bold text-[#0F3D2E]">خطوات التحقق والمطابقة بدقة:</p>
              <p>
                ١. قارن الأوقات المعروضة أدناه (خصوصاً الفجر والظهر والمغرب) مع التقويم المحلي أو مرجعك المعتمد لنفس اليوم ومدينتك.
              </p>
              <p>
                ٢. إن لاحظت فرقاً ثابتاً في الفجر أو المغرب بمقدار بضع دقائق، اختر «درجات يدوية مخصصة» واضبط زاوية الفجر (مثلاً ١٦° أو ١٧٫٧° أو ١٨°) أو المغرب (٤° أو ٤٫٥°).
              </p>
              <p>
                ٣. للاحتياط الشرعي الدقيق (كزيادة دقيقة أو دقيقتين في الفجر أو المغرب)، استخدم أزرار (+ / -) بجانب كل صلاة لحفظ فرق الدقائق بشكل دائم لكل الأيام الـ ١٤ المجدولة.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {PRAYER_ALERT_KEYS.map((key) => {
              const adj = settings.prayers[key].adjustmentMinutes;
              return (
                <div
                  key={key}
                  className="rounded-[5px] bg-[#FAF6EC] border border-[#B8924A]/40 p-3 flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-[#0F3D2E]">
                      {PRAYER_LABELS_AR[key]}
                    </span>
                    <span className="font-display font-bold text-sm text-[#1F6B50] tabular-nums">
                      {formatHHMMArabic12h(todayPrayers.timings[key])}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#B8924A]/20">
                    <button
                      type="button"
                      aria-label={`إنقاص دقيقة من ${PRAYER_LABELS_AR[key]}`}
                      onClick={() =>
                        handlePrayerPatch(key, {
                          adjustmentMinutes: Math.max(-60, adj - 1),
                        })
                      }
                      className="min-w-[36px] min-h-[36px] rounded-[4px] border border-[#B8924A]/45 bg-[#F3ECDA] hover:bg-[#E7DEC4] flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5 text-[#0F3D2E]" aria-hidden="true" />
                    </button>
                    <span className="text-xs font-bold text-[#425B51] tabular-nums" dir="ltr">
                      {adj === 0 ? '0 د' : adj > 0 ? `+${adj} د` : `${adj} د`}
                    </span>
                    <button
                      type="button"
                      aria-label={`زيادة دقيقة إلى ${PRAYER_LABELS_AR[key]}`}
                      onClick={() =>
                        handlePrayerPatch(key, {
                          adjustmentMinutes: Math.min(60, adj + 1),
                        })
                      }
                      className="min-w-[36px] min-h-[36px] rounded-[4px] border border-[#B8924A]/45 bg-[#F3ECDA] hover:bg-[#E7DEC4] flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#0F3D2E]" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Per-Prayer Independent Controls */}
      <section
        aria-label="إعدادات كل صلاة على حدة"
        className="manuscript-folio rounded-[6px] p-4 sm:p-6 space-y-4"
      >
        <div className="pb-3 border-b border-[#B8924A]/30">
          <h2 className="font-display font-bold text-lg sm:text-xl text-[#0F3D2E]">
            ٢. التحكم المستقل بكل صلاة
          </h2>
          <p className="text-xs text-[#425B51] mt-0.5">
            شغّل أو أوقف أي صلاة، واختر الأذان الكامل أو الإشعار الصامت، والمؤذن، والتنبيه القبلي بالدقائق
          </p>
        </div>

        <div className="divide-y divide-[#B8924A]/30">
          {PRAYER_ALERT_KEYS.map((key) => {
            const cfg = settings.prayers[key];
            const timeLabel = formatHHMMArabic12h(todayPrayers.timings[key]);
            return (
              <div key={key} className="py-4 first:pt-1 last:pb-1 space-y-3">
                {/* Row Header: Name + Today's Time + Test + Switch */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      dir="ltr"
                      aria-label={`تفعيل تنبيه صلاة ${PRAYER_LABELS_AR[key]}`}
                      aria-checked={cfg.enabled}
                      onClick={() => handlePrayerPatch(key, { enabled: !cfg.enabled })}
                      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors border ${
                        cfg.enabled
                          ? 'bg-[#1F6B50] border-[#0F3D2E]'
                          : 'bg-[#E5DEC9] border-[#B8924A]/50'
                      }`}
                    >
                      <span
                        className={`inline-block h-5.5 w-5.5 transform rounded-full bg-[#FAF6EC] shadow-xs transition-transform ${
                          cfg.enabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>

                    <div>
                      <h3 className="font-display font-bold text-base sm:text-lg text-[#0F3D2E]">
                        صلاة {PRAYER_LABELS_AR[key]}
                      </h3>
                      <p className="text-xs text-[#425B51] tabular-nums">
                        اليوم: <strong className="text-[#0F3D2E]">{timeLabel}</strong> ·{' '}
                        {cfg.enabled
                          ? cfg.alertMode === 'adhan'
                            ? `أذان بصوت ${getMuezzinByRawName(cfg.muezzinRawName).displayName}`
                            : 'إشعار صامت فقط'
                          : 'التنبيه متوقف'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleTestPrayer(key)}
                    className="min-h-[40px] px-3.5 py-1.5 btn-manuscript text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-[#1F6B50]" aria-hidden="true" />
                    <span>تجربة الأذان الآن</span>
                  </button>
                </div>

                {/* Controls Grid */}
                {cfg.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                    {/* Alert Type */}
                    <div className="md:col-span-4 space-y-1">
                      <span className="text-[11px] font-bold text-[#425B51] block">
                        نوع التنبيه عند الأذان
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-[5px] bg-[#F3ECDA] border border-[#B8924A]/35">
                        <button
                          type="button"
                          onClick={() =>
                            handlePrayerPatch(key, { alertMode: 'adhan' })
                          }
                          className={`min-h-[38px] px-2 rounded-[4px] text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                            cfg.alertMode === 'adhan'
                              ? 'bg-[#0F3D2E] text-[#FAF6EC]'
                              : 'text-[#425B51] hover:text-[#0F3D2E]'
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>أذان كامل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handlePrayerPatch(key, { alertMode: 'silent' })
                          }
                          className={`min-h-[38px] px-2 rounded-[4px] text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                            cfg.alertMode === 'silent'
                              ? 'bg-[#0F3D2E] text-[#FAF6EC]'
                              : 'text-[#425B51] hover:text-[#0F3D2E]'
                          }`}
                        >
                          <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>إشعار صامت</span>
                        </button>
                      </div>
                    </div>

                    {/* Muezzin Selector + Apply to All */}
                    <div className="md:col-span-5 space-y-1">
                      <label
                        htmlFor={`muezzin-${key}`}
                        className="text-[11px] font-bold text-[#425B51] block"
                      >
                        صوت المؤذن لهذه الصلاة
                      </label>
                      <div className="flex items-center gap-1.5">
                        <select
                          id={`muezzin-${key}`}
                          disabled={cfg.alertMode === 'silent'}
                          value={cfg.muezzinRawName}
                          onChange={(e) =>
                            handlePrayerPatch(key, { muezzinRawName: e.target.value })
                          }
                          className="flex-1 min-h-[40px] px-2.5 rounded-[5px] bg-[#FAF6EC] border border-[#B8924A]/50 text-xs font-bold text-[#0F3D2E] disabled:opacity-45 cursor-pointer"
                        >
                          {MUEZZIN_ENTRIES.map((m) => (
                            <option key={m.rawName} value={m.rawName}>
                              {m.displayName} ({toArabicNums(m.durationLabel)})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleApplyMuezzinToAll(cfg.muezzinRawName)}
                          className="min-h-[40px] px-2.5 py-1 btn-manuscript text-[11px] whitespace-nowrap cursor-pointer"
                          title="تطبيق هذا المؤذن على جميع الصلوات الخمس"
                        >
                          تطبيق على الكل
                        </button>
                      </div>
                    </div>

                    {/* Pre-prayer reminder minutes */}
                    <div className="md:col-span-3 space-y-1">
                      <label
                        htmlFor={`pre-${key}`}
                        className="text-[11px] font-bold text-[#425B51] block"
                      >
                        تنبيه قبل الصلاة
                      </label>
                      <select
                        id={`pre-${key}`}
                        value={cfg.preReminderMinutes}
                        onChange={(e) =>
                          handlePrayerPatch(key, {
                            preReminderMinutes: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full min-h-[40px] px-2.5 rounded-[5px] bg-[#FAF6EC] border border-[#B8924A]/50 text-xs font-bold text-[#0F3D2E] cursor-pointer"
                      >
                        {PRE_REMINDER_OPTIONS.map((mins) => (
                          <option key={mins} value={mins}>
                            {mins === 0
                              ? 'بدون تنبيه قبلي'
                              : `قبل ${toArabicNums(mins)} دقيقة`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Muezzin Voice Showcase & Local Offline Audition */}
      <section
        aria-label="قائمة أصوات المؤذنين"
        className="manuscript-folio rounded-[6px] p-4 sm:p-6 space-y-4"
      >
        <div className="pb-3 border-b border-[#B8924A]/30">
          <h2 className="font-display font-bold text-lg sm:text-xl text-[#0F3D2E]">
            ٣. أصوات المؤذنين (ملفات محلية دون إنترنت)
          </h2>
          <p className="text-xs text-[#425B51] mt-0.5">
            استمع لكل صوت وتأكد من جاهزيته، أو اعتمده لجميع الصلوات بضغطة واحدة
          </p>
        </div>

        <div className="divide-y divide-[#B8924A]/25">
          {MUEZZIN_ENTRIES.map((m, idx) => {
            const isThisPlaying =
              playback.isPlaying && playback.muezzinRawName === m.rawName;
            return (
              <div
                key={m.rawName}
                className="py-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#7A5E2A] tabular-nums">
                      {toArabicNums(idx + 1)}.
                    </span>
                    <h3 className="font-display font-bold text-sm sm:text-base text-[#0F3D2E]">
                      {m.displayName}
                    </h3>
                  </div>
                  <p className="text-xs text-[#425B51] mt-0.5 tabular-nums">
                    المدة: {toArabicNums(m.durationLabel)} دقيقة · الرمز المرجعي:{' '}
                    <span dir="ltr" className="font-mono text-[11px]">
                      {m.refCode}
                    </span>{' '}
                    · الملف:{' '}
                    <span dir="ltr" className="font-mono text-[11px]">
                      {m.rawName}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleToggleMuezzinPreview(m.rawName)}
                    className={`min-h-[42px] px-4 py-1.5 text-xs inline-flex items-center gap-1.5 cursor-pointer ${
                      isThisPlaying ? 'btn-gilded' : 'btn-emerald'
                    }`}
                  >
                    {isThisPlaying ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                        <span>إيقاف</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-[#D9B96A]" aria-hidden="true" />
                        <span>تجربة صوت المؤذن</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyMuezzinToAll(m.rawName)}
                    className="min-h-[42px] px-3 py-1.5 btn-manuscript text-xs cursor-pointer"
                  >
                    اعتماد للكل
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Salat al-Layl (Night Prayer) Reminder — Strictly 10:00 PM to 12:00 AM */}
      <section
        aria-label="تذكير صلاة الليل"
        className="manuscript-folio rounded-[6px] p-4 sm:p-6 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#B8924A]/30">
          <div className="flex items-center gap-3">
            <NightPrayerLampIcon className="w-6 h-6 text-[#B8924A] shrink-0" />
            <div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-[#0F3D2E]">
                ٤. تذكير صلاة الليل
              </h2>
              <p className="text-xs text-[#425B51]">
                متاح اختيار الوقت بين الساعة ١٠:٠٠ مساءً و ١٢:٠٠ منتصف الليل فقط
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            dir="ltr"
            aria-label="تفعيل تذكير صلاة الليل"
            aria-checked={settings.salatAlLayl.enabled}
            onClick={() => {
              const nextEnabled = !settings.salatAlLayl.enabled;
              updateSettings({
                ...settings,
                salatAlLayl: {
                  ...settings.salatAlLayl,
                  enabled: nextEnabled,
                },
              });
              if (nextEnabled) {
                void ensureNotificationPermissionIfMissing().then(() => {
                  void refreshDiagnostics();
                });
              }
            }}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors border ${
              settings.salatAlLayl.enabled
                ? 'bg-[#1F6B50] border-[#0F3D2E]'
                : 'bg-[#E5DEC9] border-[#B8924A]/50'
            }`}
          >
            <span
              className={`inline-block h-5.5 w-5.5 transform rounded-full bg-[#FAF6EC] shadow-xs transition-transform ${
                settings.salatAlLayl.enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Bounded 22:00 - 00:00 Time Picker */}
          <div className="md:col-span-5 space-y-1.5">
            <span className="text-xs font-bold text-[#0F3D2E] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
              <span>
                الوقت المختار: {formatHHMMArabic12h(clampedLaylTime)}
              </span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <select
                aria-label="ساعة تذكير صلاة الليل"
                value={laylHour}
                onChange={(e) => handleLaylTimePart(e.target.value, laylMinute)}
                className="min-h-[44px] px-3 rounded-[5px] bg-[#FAF6EC] border border-[#B8924A]/50 text-xs font-bold text-[#0F3D2E] cursor-pointer"
              >
                {SALAT_LAYL_HOURS.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="دقيقة تذكير صلاة الليل"
                disabled={laylHour === '00'}
                value={laylHour === '00' ? '00' : laylMinute}
                onChange={(e) => handleLaylTimePart(laylHour, e.target.value)}
                className="min-h-[44px] px-3 rounded-[5px] bg-[#FAF6EC] border border-[#B8924A]/50 text-xs font-bold text-[#0F3D2E] disabled:opacity-50 cursor-pointer"
              >
                {(laylHour === '00' ? ['00'] : SALAT_LAYL_MINUTES).map((min) => (
                  <option key={min} value={min}>
                    الدقيقة {toArabicNums(min)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sound Type */}
          <div className="md:col-span-5 space-y-1.5">
            <span className="text-xs font-bold text-[#0F3D2E] block">
              نوع الصوت لتذكير صلاة الليل
            </span>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-[5px] bg-[#F3ECDA] border border-[#B8924A]/35">
              {(
                [
                  ['adhan', 'أذان'],
                  ['gentle', 'نغمة هادئة'],
                  ['silent', 'صامت'],
                ] as [SalatAlLaylSoundMode, string][]
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() =>
                    updateSettings({
                      ...settings,
                      salatAlLayl: {
                        ...settings.salatAlLayl,
                        soundType: mode,
                      },
                    })
                  }
                  className={`min-h-[38px] px-2 rounded-[4px] text-xs font-bold cursor-pointer transition-colors ${
                    settings.salatAlLayl.soundType === mode
                      ? 'bg-[#0F3D2E] text-[#FAF6EC]'
                      : 'text-[#425B51] hover:text-[#0F3D2E]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => void handleTestPrayer('salat_allayl')}
              className="w-full min-h-[44px] px-3 btn-manuscript text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-[#1F6B50]" aria-hidden="true" />
              <span>تجربة</span>
            </button>
          </div>
        </div>

        {settings.salatAlLayl.soundType === 'adhan' && (
          <div className="pt-1 flex flex-wrap items-center gap-2">
            <label
              htmlFor="layl-muezzin"
              className="text-xs font-bold text-[#425B51]"
            >
              صوت المؤذن لصلاة الليل:
            </label>
            <select
              id="layl-muezzin"
              value={settings.salatAlLayl.muezzinRawName}
              onChange={(e) =>
                updateSettings({
                  ...settings,
                  salatAlLayl: {
                    ...settings.salatAlLayl,
                    muezzinRawName: e.target.value,
                  },
                })
              }
              className="min-h-[40px] px-3 rounded-[5px] bg-[#FAF6EC] border border-[#B8924A]/50 text-xs font-bold text-[#0F3D2E] cursor-pointer"
            >
              {MUEZZIN_ENTRIES.map((m) => (
                <option key={m.rawName} value={m.rawName}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* 5. Android Permissions, Battery Optimization & Diagnostics */}
      <section
        aria-label="صلاحيات الأندرويد والتشخيص"
        className="manuscript-folio rounded-[6px] p-4 sm:p-6 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#B8924A]/30">
          <div>
            <h2 className="font-display font-bold text-lg sm:text-xl text-[#0F3D2E]">
              ٥. تشخيص الأذونات والجدولة
            </h2>
            <p className="text-xs text-[#425B51] mt-0.5">
              تحقق من جاهزية تنبيهات الخلفية واختبر الأذان الكامل الآن
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleTestPrayer('fajr')}
              className="min-h-[44px] px-4 py-2 btn-gilded text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              <span>اختبار الأذان الآن</span>
            </button>

            <button
              type="button"
              onClick={() => void handleManualReschedule()}
              disabled={rescheduling}
              className="min-h-[44px] px-4 py-2 btn-emerald text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw
                className={`w-4 h-4 text-[#D9B96A] ${rescheduling ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{rescheduling ? 'جارٍ الجدولة...' : 'إعادة الجدولة الآن'}</span>
            </button>
          </div>
        </div>

        {/* Allow Notifications Even During Adhan Time (+ Auto-grant if missing) */}
        <div className="rounded-[6px] bg-[#F3ECDA]/80 border border-[#B8924A]/55 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <BellRing className="w-5 h-5 text-[#1F6B50] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-[#0F3D2E]">
                السماح للإشعارات حتى في وقت الأذان
              </h3>
              <p className="text-xs text-[#425B51] mt-0.5 leading-relaxed">
                يُبقي إشعارات التنبيه القبلي والمستحبات والنظام مسموحة ومرئية حتى أثناء وقت الأذان، ويطلب إضافة إذن الإشعارات تلقائياً إذا لم يكن مضافاً.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <span className="text-xs font-bold text-[#1F6B50]">
              {settings.allowNotificationsDuringAdhan ? 'مفعّل ✓' : 'متوقف'}
            </span>
            <button
              type="button"
              role="switch"
              dir="ltr"
              aria-label="السماح للإشعارات حتى في وقت الأذان"
              aria-checked={settings.allowNotificationsDuringAdhan}
              onClick={() => void handleToggleAllowDuringAdhan()}
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors border ${
                settings.allowNotificationsDuringAdhan
                  ? 'bg-[#1F6B50] border-[#0F3D2E]'
                  : 'bg-[#E5DEC9] border-[#B8924A]/50'
              }`}
            >
              <span
                className={`inline-block h-5.5 w-5.5 transform rounded-full bg-[#FAF6EC] shadow-xs transition-transform ${
                  settings.allowNotificationsDuringAdhan ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Status Grid */}
        {diagnostics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-[5px] bg-[#FAF6EC] border border-[#B8924A]/40 p-3 space-y-1">
              <span className="text-[11px] text-[#425B51] block">إذن الإشعارات</span>
              <div className="flex items-center gap-1.5 font-display font-bold text-sm text-[#0F3D2E]">
                {diagnostics.notificationsGranted ? (
                  <CheckCircle2 className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-[#7A5E2A]" aria-hidden="true" />
                )}
                <span>
                  {diagnostics.notificationsGranted ? 'ممنوح ✓' : 'غير ممنوح'}
                </span>
              </div>
              {!diagnostics.notificationsGranted && (
                <button
                  type="button"
                  onClick={() => void handleRequestNotifPerm()}
                  className="btn-text-ornate text-xs cursor-pointer"
                >
                  طلب الإذن الآن
                </button>
              )}
            </div>

            <div className="rounded-[5px] bg-[#FAF6EC] border border-[#B8924A]/40 p-3 space-y-1">
              <span className="text-[11px] text-[#425B51] block">
                المنبهات الدقيقة (Exact Alarm)
              </span>
              <div className="flex items-center gap-1.5 font-display font-bold text-sm text-[#0F3D2E]">
                {diagnostics.exactAlarmsGranted || !isAndroid ? (
                  <CheckCircle2 className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-[#7A5E2A]" aria-hidden="true" />
                )}
                <span>
                  {!isAndroid
                    ? 'متاح في نسخة APK'
                    : diagnostics.exactAlarmsGranted
                    ? 'ممنوح ✓'
                    : 'يحتاج تفعيل'}
                </span>
              </div>
              {isAndroid && !diagnostics.exactAlarmsGranted && (
                <button
                  type="button"
                  onClick={() => void handleOpenExactAlarm()}
                  className="btn-text-ornate text-xs cursor-pointer"
                >
                  فتح شاشة إذن المنبه
                </button>
              )}
            </div>

            <div className="rounded-[5px] bg-[#FAF6EC] border border-[#B8924A]/40 p-3 space-y-1">
              <span className="text-[11px] text-[#425B51] block">
                استثناء توفير البطارية
              </span>
              <div className="flex items-center gap-1.5 font-display font-bold text-sm text-[#0F3D2E]">
                {diagnostics.batteryOptimizationIgnored ? (
                  <CheckCircle2 className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
                ) : (
                  <BatteryCharging className="w-4 h-4 text-[#7A5E2A]" aria-hidden="true" />
                )}
                <span>
                  {!isAndroid
                    ? 'خاص بالأندرويد'
                    : diagnostics.batteryOptimizationIgnored
                    ? 'مستثنى ✓'
                    : 'مقيّد بالبطارية'}
                </span>
              </div>
              {isAndroid && !diagnostics.batteryOptimizationIgnored && (
                <button
                  type="button"
                  onClick={() => void handleRequestBatteryExemption()}
                  className="btn-text-ornate text-xs cursor-pointer"
                >
                  طلب استثناء البطارية
                </button>
              )}
            </div>

            <div className="rounded-[5px] bg-[#FAF6EC] border border-[#B8924A]/40 p-3 space-y-1">
              <span className="text-[11px] text-[#425B51] block">
                التنبيهات المجدولة (١٤ يوماً)
              </span>
              <div className="font-display font-bold text-lg text-[#0F3D2E] tabular-nums">
                {toArabicNums(diagnostics.scheduledCount)} تنبيه
              </div>
              <span className="text-[11px] text-[#425B51] block tabular-nums">
                آخر جدولة:{' '}
                {diagnostics.lastScheduledAt
                  ? new Date(diagnostics.lastScheduledAt).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'لم تتم بعد'}
              </span>
            </div>
          </div>
        )}

        {/* Missing raw sound warning if Android reports any */}
        {diagnostics && diagnostics.missingRawFiles.length > 0 && (
          <div className="rounded-[5px] bg-[#F3ECDA] border border-[#B8924A]/65 p-3.5 text-xs text-[#11271F] space-y-1">
            <strong className="text-[#0F3D2E] block">
              تنبيه بخصوص ملفات res/raw المفقودة داخل حزمة الأندرويد:
            </strong>
            <p className="text-[#425B51]">
              لم يُعثر على الملفات التالية في مجلد res/raw؛ تم استخدام صوت التنبيه الافتراضي تلقائياً دون تعطيل الجدولة:
            </p>
            <p dir="ltr" className="font-mono text-[11px] text-[#7A5E2A]">
              {diagnostics.missingRawFiles.join(', ')}
            </p>
          </div>
        )}

        {/* Quick Android Permission Actions + OEM Guide */}
        <div className="space-y-3 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {isAndroid && (
                <>
                  <button
                    type="button"
                    onClick={() => void handleRequestNotifPerm()}
                    className="min-h-[38px] px-3 py-1 btn-manuscript text-xs cursor-pointer"
                  >
                    فحص إذن الإشعارات
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleOpenExactAlarm()}
                    className="min-h-[38px] px-3 py-1 btn-manuscript text-xs cursor-pointer"
                  >
                    إعدادات المنبهات الدقيقة
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRequestBatteryExemption()}
                    className="min-h-[38px] px-3 py-1 btn-manuscript text-xs cursor-pointer"
                  >
                    استثناء توفير البطارية
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleOpenDndSettings()}
                    className="min-h-[38px] px-3 py-1 btn-manuscript text-xs cursor-pointer"
                  >
                    {diagnostics?.dndPolicyAccessGranted
                      ? 'تجاوز عدم الإزعاج: مفعّل ✓'
                      : 'تجاوز عدم الإزعاج وقت الأذان'}
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowOemGuide((v) => !v)}
              className="btn-text-ornate text-xs cursor-pointer"
            >
              {showOemGuide
                ? 'إخفاء إرشادات الأجهزة'
                : 'إرشادات هواتف Xiaomi و Huawei و Samsung'}
            </button>
          </div>

          {showOemGuide && (
            <div className="rounded-[5px] bg-[#F3ECDA]/70 border border-[#B8924A]/40 p-4 text-xs text-[#11271F] space-y-2 leading-relaxed">
              <p>
                <strong className="text-[#0F3D2E]">• هواتف Xiaomi / Redmi / POCO (MIUI / HyperOS):</strong>{' '}
                افتح معلومات التطبيق ← فعّل «التشغيل التلقائي (Autostart)» ← وفي «موفر البطارية» اختر «لا توجد قيود (No restrictions)».
              </p>
              <p>
                <strong className="text-[#0F3D2E]">• هواتف Huawei / Honor:</strong>{' '}
                الإعدادات ← البطارية ← تشغيل التطبيقات ← ابحث عن «رحلة النور» ← حوّلها إلى «إدارة يدوياً» وفعّل: التشغيل التلقائي، التشغيل الثانوي، والتشغيل في الخلفية.
              </p>
              <p>
                <strong className="text-[#0F3D2E]">• هواتف Samsung (OneUI):</strong>{' '}
                الإعدادات ← العناية بالجهاز ← البطارية ← حدود استخدام الخلفية ← «التطبيقات غير الموضوعة في وضع السكون» ← أضف «رحلة النور».
              </p>
            </div>
          )}
        </div>
      </section>

      <ManuscriptDivider variant="rosette" />
    </main>
  );
};
