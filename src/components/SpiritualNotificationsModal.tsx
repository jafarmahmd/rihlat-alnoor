import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  X,
  Volume2,
  Calendar,
  ArrowLeft,
  Send,
  History,
  Sparkles,
} from 'lucide-react';
import {
  REMINDER_TIME_PRESETS,
  SpiritualNotificationSettings,
  WEEKLY_SPIRITUAL_GUIDANCE,
  formatTimeArabic12h,
  getTodaySpiritualGuidance,
  loadNotificationSettings,
  saveNotificationSettings,
} from '../data/spiritualNotifications';
import {
  DispatchedNotificationPayload,
  getNotificationHistory,
  getNotificationPermissionAsync,
  getPendingNativeNotificationCount,
  isNativeMobile,
  requestNotificationPermission,
  sendSpiritualNotification,
} from '../utils/notificationManager';
import { DigitalLibrarySection } from '../types/game';

interface SpiritualNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSection: (
    section: DigitalLibrarySection | 'library' | 'tasbih' | 'duas' | 'munajat',
    entryId?: string
  ) => void;
}

export const SpiritualNotificationsModal: React.FC<SpiritualNotificationsModalProps> = ({
  isOpen,
  onClose,
  onOpenSection,
}) => {
  const [settings, setSettings] = useState<SpiritualNotificationSettings>(loadNotificationSettings);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [testSent, setTestSent] = useState<boolean>(false);
  const [activePreviewDay, setActivePreviewDay] = useState<number>(() => new Date().getDay());
  const [activeTab, setActiveTab] = useState<'schedule' | 'history'>('schedule');
  const [history, setHistory] = useState<DispatchedNotificationPayload[]>([]);
  const [nativeAlarmCount, setNativeAlarmCount] = useState<number>(0);
  const nativePlatform = isNativeMobile();

  useEffect(() => {
    if (!isOpen) return;
    setSettings(loadNotificationSettings());
    setHistory(getNotificationHistory());
    void getNotificationPermissionAsync().then((p) => setPermission(p));
    if (nativePlatform) {
      void getPendingNativeNotificationCount().then((c) => setNativeAlarmCount(c));
    }
  }, [isOpen, nativePlatform]);

  if (!isOpen) return null;

  const updateSettings = (patch: Partial<SpiritualNotificationSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveNotificationSettings(next);
    if (nativePlatform) {
      window.setTimeout(() => {
        void getPendingNativeNotificationCount().then((c) => setNativeAlarmCount(c));
      }, 350);
    }
  };

  const handleToggleDay = (dayIndex: number) => {
    const next = {
      ...settings,
      enabledDays: {
        ...settings.enabledDays,
        [dayIndex]: !settings.enabledDays[dayIndex],
      },
    };
    setSettings(next);
    saveNotificationSettings(next);
    if (nativePlatform) {
      window.setTimeout(() => {
        void getPendingNativeNotificationCount().then((c) => setNativeAlarmCount(c));
      }, 350);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');
    if (granted && nativePlatform) {
      const count = await getPendingNativeNotificationCount();
      setNativeAlarmCount(count);
    }
  };

  const handleSendTest = async () => {
    const guidance = WEEKLY_SPIRITUAL_GUIDANCE[activePreviewDay] || getTodaySpiritualGuidance();
    const success = await sendSpiritualNotification(guidance, { isTest: true });
    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } else if (permission !== 'granted') {
      const granted = await requestNotificationPermission();
      setPermission(granted ? 'granted' : 'denied');
      if (granted) {
        await sendSpiritualNotification(guidance, { isTest: true });
        setTestSent(true);
        setTimeout(() => setTestSent(false), 3000);
      }
    }
  };

  const selectedDayGuidance =
    WEEKLY_SPIRITUAL_GUIDANCE[activePreviewDay] || WEEKLY_SPIRITUAL_GUIDANCE[4];
  const isToday = new Date().getDay() === activePreviewDay;
  const isPresetTime = REMINDER_TIME_PRESETS.some((p) => p.value === settings.reminderTime);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="إعدادات إشعارات المستحبات والأدعية اليومية"
    >
      <div className="relative w-full max-w-2xl max-h-[94vh] flex flex-col bg-white rounded-3xl border border-emerald-200 shadow-2xl overflow-hidden text-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-l from-emerald-950 via-emerald-900 to-teal-950 text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shrink-0">
              <BellRing className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-bold text-amber-300 block truncate">
                تنبيه تلقائي في بداية كل يوم (بعد ١٢:٠٠ ص)
              </span>
              <h2 className="font-display font-black text-base sm:text-xl text-white truncate">
                نظام إشعارات المستحبات والأدعية
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-emerald-50/70 border-b border-emerald-100 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`min-h-[42px] px-4 py-2 rounded-xl font-display font-extrabold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'schedule'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <Bell className="w-4 h-4" aria-hidden="true" />
            <span>الجدول والأيام</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setHistory(getNotificationHistory());
              setActiveTab('history');
            }}
            className={`min-h-[42px] px-4 py-2 rounded-xl font-display font-extrabold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'history'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <History className="w-4 h-4" aria-hidden="true" />
            <span>سجل التنبيهات ({history.length})</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {activeTab === 'history' ? (
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2" aria-hidden="true" />
                  <p className="font-display font-bold text-sm text-slate-700">
                    لا توجد تنبيهات مسجلة في السجل بعد.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    سيظهر هنا سجل كل تنبيه يصلك مع دخول اليوم الجديد بعد الساعة 12:00 صباحاً.
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-bold text-emerald-800">
                        {item.guidance.dayNameAr} · {item.hijriFormatted}
                      </span>
                      <span className="tabular-nums">
                        {new Date(item.sentAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <h4 className="font-display font-black text-sm sm:text-base text-emerald-950">
                      {item.guidance.title}
                    </h4>
                    {item.occasionToday && (
                      <p className="text-xs font-bold text-amber-700">
                        مناسبة اليوم: {item.occasionToday.title}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSection(item.guidance.linkedSection, item.guidance.linkedEntryId);
                      }}
                      className="min-h-[38px] px-4 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-display font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>{item.guidance.linkedLabel}</span>
                      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              {/* Permission & Instant Test Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50/60 border border-emerald-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
                <div className="flex items-start gap-3 text-right">
                  <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                    <Bell className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-base text-emerald-950">
                      {nativePlatform
                        ? 'إشعارات النظام المحلية (تعمل خارج التطبيق وبدون إنترنت)'
                        : 'إذن إشعارات الجهاز والتنبيه الفوري'}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {permission === 'granted'
                        ? nativePlatform
                          ? `تمت جدولة ${nativeAlarmCount} تنبيهات محلية في نظام الهاتف الساعة ${formatTimeArabic12h(
                              settings.reminderTime
                            )}؛ ستصلك حتى لو كان التطبيق مغلقاً تماماً وبدون إنترنت.`
                          : `مفعلة في جهازك؛ يصلك تنبيه اليوم الجديد الساعة ${formatTimeArabic12h(
                              settings.reminderTime
                            )}، وجدولة الخلفية التلقائية جاهزة عند التصدير لنسخة أندرويد/آيفون.`
                        : permission === 'denied'
                        ? 'إذن الإشعارات محظور في إعدادات الجهاز؛ يمكنك تفعيله من إعدادات النظام ليصلك التنبيه خارج التطبيق، وسيستمر التنبيه الداخلي بالعمل.'
                        : 'فعّل إذن الجهاز ليصلك تنبيه المستحبات والأدعية فور دخول كل يوم جديد (بعد ١٢ صباحاً).'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                  {permission !== 'granted' ? (
                    <button
                      type="button"
                      onClick={handleRequestPermission}
                      className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <BellRing className="w-4 h-4" aria-hidden="true" />
                      <span>تفعيل إذن الجهاز</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-300 whitespace-nowrap">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                      <span>مفعّلة</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleSendTest}
                    className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-display font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{testSent ? 'تم الإرسال!' : 'تجربة الإشعار'}</span>
                  </button>
                </div>
              </div>

              {/* Master Controls & Midnight Time Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-white border border-emerald-200 flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <span className="font-display font-black text-sm text-emerald-950 block">
                      تفعيل التنبيهات اليومية
                    </span>
                    <span className="text-xs text-slate-500">
                      تذكير يومي بمستحبات الأسبوع
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    dir="ltr"
                    aria-checked={settings.enabled}
                    onClick={() => updateSettings({ enabled: !settings.enabled })}
                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-200 ${
                      settings.enabled ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                        settings.enabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-emerald-200 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                      <span className="font-display font-black text-sm text-emerald-950">
                        وقت الإشعار اليومي
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-700 tabular-nums">
                      {formatTimeArabic12h(settings.reminderTime)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      aria-label="اختر موعد الإشعار اليومي"
                      value={isPresetTime ? settings.reminderTime : 'custom'}
                      onChange={(e) => {
                        if (e.target.value !== 'custom') {
                          updateSettings({ reminderTime: e.target.value });
                        }
                      }}
                      className="flex-1 min-h-[44px] px-3 rounded-xl border border-emerald-200 bg-emerald-50/70 font-bold text-xs text-emerald-950 focus:outline-none focus:border-emerald-500"
                    >
                      {REMINDER_TIME_PRESETS.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                      {!isPresetTime && (
                        <option value="custom">
                          وقت مخصص ({formatTimeArabic12h(settings.reminderTime)})
                        </option>
                      )}
                    </select>

                    <input
                      type="time"
                      aria-label="تحديد وقت مخصص"
                      value={settings.reminderTime}
                      onChange={(e) => {
                        if (e.target.value) {
                          updateSettings({ reminderTime: e.target.value });
                        }
                      }}
                      className="min-h-[44px] px-2.5 rounded-xl border border-emerald-200 bg-white font-bold text-xs text-emerald-950 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Extra Smart Notification Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    updateSettings({ includeHijriOccasions: !settings.includeHijriOccasions })
                  }
                  className={`min-h-[48px] p-3 rounded-2xl border text-right flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    settings.includeHijriOccasions
                      ? 'bg-amber-50/80 border-amber-300 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-bold">
                    <Calendar className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                    <span>دمج مناسبات التقويم الهجري</span>
                  </span>
                  <span
                    className={`text-xs font-black ${
                      settings.includeHijriOccasions ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {settings.includeHijriOccasions ? 'مفعّل' : 'متوقف'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateSettings({ inAppToastEnabled: !settings.inAppToastEnabled })
                  }
                  className={`min-h-[48px] p-3 rounded-2xl border text-right flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    settings.inAppToastEnabled
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-bold">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span>بطاقة تنبيه داخل التطبيق</span>
                  </span>
                  <span
                    className={`text-xs font-black ${
                      settings.inAppToastEnabled ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {settings.inAppToastEnabled ? 'مفعّل' : 'متوقف'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                  className={`min-h-[48px] p-3 rounded-2xl border text-right flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    settings.soundEnabled
                      ? 'bg-sky-50/80 border-sky-300 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-bold">
                    <Volume2 className="w-4 h-4 text-sky-600 shrink-0" aria-hidden="true" />
                    <span>نغمة لطيفة للتنبيه</span>
                  </span>
                  <span
                    className={`text-xs font-black ${
                      settings.soundEnabled ? 'text-sky-700' : 'text-slate-400'
                    }`}
                  >
                    {settings.soundEnabled ? 'مفعّل' : 'صامت'}
                  </span>
                </button>
              </div>

              {/* Days Selection Strip (Responsive for 360px+ Mobile) */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 px-1">
                  <span className="font-display font-black text-sm text-emerald-950">
                    أيام الأسبوع لتلقي التنبيه وتصفح المستحبات:
                  </span>
                  <span className="text-xs text-slate-500">
                    اضغط على اليوم للمعاينة، وعلى ✓ للتفعيل
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {WEEKLY_SPIRITUAL_GUIDANCE.map((day) => {
                    const isSelected = activePreviewDay === day.dayIndex;
                    const isDayEnabled = settings.enabledDays[day.dayIndex];
                    const isThursday = day.dayIndex === 4;
                    const isFriday = day.dayIndex === 5;

                    return (
                      <div
                        key={day.dayIndex}
                        className={`relative rounded-2xl border-2 p-2 text-center transition-all flex flex-col items-center justify-between gap-1.5 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/90 shadow-sm'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setActivePreviewDay(day.dayIndex)}
                          className="w-full pt-1 cursor-pointer focus-visible:outline-none"
                        >
                          {(isThursday || isFriday) && (
                            <span className="block text-[10px] font-black text-amber-700 mb-0.5 whitespace-nowrap">
                              {isThursday ? 'كميل' : 'الندبة'}
                            </span>
                          )}
                          <span className="font-display font-extrabold text-xs sm:text-sm block text-emerald-950 whitespace-nowrap">
                            {day.dayNameAr}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleDay(day.dayIndex)}
                          aria-label={
                            isDayEnabled
                              ? `تعطيل إشعار يوم ${day.dayNameAr}`
                              : `تفعيل إشعار يوم ${day.dayNameAr}`
                          }
                          className={`min-w-[40px] min-h-[32px] px-2 rounded-xl inline-flex items-center justify-center text-xs font-black cursor-pointer transition-colors ${
                            isDayEnabled
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isDayEnabled ? '✓' : '—'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Day Guidance Detail Card */}
              <div className="rounded-3xl p-4 sm:p-6 bg-gradient-to-br from-emerald-900 to-teal-950 text-white shadow-xl border border-amber-300/40 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <span>{selectedDayGuidance.badge}</span>
                    {isToday && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-200">اليوم الحالي</span>
                      </>
                    )}
                  </div>

                  <span className="text-amber-200/90 font-bold">
                    تنبيه {selectedDayGuidance.dayNameAr}:{' '}
                    {settings.enabledDays[selectedDayGuidance.dayIndex] ? 'مفعّل ✓' : 'معطّل'}
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-black text-lg sm:text-2xl text-white">
                    {selectedDayGuidance.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 leading-relaxed">
                    {selectedDayGuidance.shortSummary}
                  </p>
                </div>

                <div className="rounded-2xl bg-black/25 p-3.5 sm:p-4 border border-white/10 space-y-2">
                  <span className="text-xs font-black text-amber-300 block mb-1">
                    الأعمال والمستحبات المأثورة:
                  </span>
                  <ul className="space-y-1.5 pr-1">
                    {selectedDayGuidance.recommendedActs.map((act, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs sm:text-sm text-white/95 leading-relaxed"
                      >
                        <span className="text-amber-400 text-sm leading-none shrink-0 mt-0.5">
                          ✦
                        </span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="text-xs font-bold text-amber-200">
                    الدعاء المخصص: {selectedDayGuidance.primaryDuaTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSection(
                        selectedDayGuidance.linkedSection,
                        selectedDayGuidance.linkedEntryId
                      );
                    }}
                    className="min-h-[44px] px-6 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-display font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
                  >
                    <span>{selectedDayGuidance.linkedLabel}</span>
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-600 font-medium">
            يبدأ التنبيه اليومي تلقائياً بعد ١٢:٠٠ صباحاً مع تجدد كل يوم هجري وميلادي.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 font-display font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
