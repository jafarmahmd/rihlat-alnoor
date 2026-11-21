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
  ensureNotificationPermissionIfMissing,
  getNotificationHistory,
  getNotificationPermissionAsync,
  getPendingNativeNotificationCount,
  isNativeMobile,
  requestNotificationPermission,
  sendSpiritualNotification,
} from '../utils/notificationManager';
import { DigitalLibrarySection } from '../types/game';
import { MinaretAdhanIcon } from './IslamicOrnaments';

interface SpiritualNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdhanSettings?: () => void;
  onOpenSection: (
    section: DigitalLibrarySection | 'library' | 'tasbih' | 'duas' | 'munajat',
    entryId?: string
  ) => void;
}

export const SpiritualNotificationsModal: React.FC<SpiritualNotificationsModalProps> = ({
  isOpen,
  onClose,
  onOpenAdhanSettings,
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
    if (patch.enabled === true && permission !== 'granted') {
      void ensureNotificationPermissionIfMissing().then((granted) => {
        if (granted) setPermission('granted');
      });
    }
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
    if (nativePlatform) {
      const p = await getNotificationPermissionAsync();
      setPermission(p);
      const count = await getPendingNativeNotificationCount();
      setNativeAlarmCount(count);
    }
    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } else if (permission !== 'granted') {
      const granted = await requestNotificationPermission();
      setPermission(granted ? 'granted' : 'denied');
      if (granted) {
        await sendSpiritualNotification(guidance, { isTest: true });
        if (nativePlatform) {
          const count = await getPendingNativeNotificationCount();
          setNativeAlarmCount(count);
        }
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#081A14]/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="إعدادات إشعارات المستحبات والأدعية اليومية"
    >
      <div className="relative w-full max-w-2xl max-h-[94vh] flex flex-col bg-[#FAF6EC] paper-grain rounded-[6px] border border-[#B8924A]/70 shadow-2xl overflow-hidden text-right text-[#11271F]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-[#0F3D2E] text-[#FAF6EC] border-b border-[#B8924A]/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <BellRing className="w-6 h-6 text-[#D9B96A] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-medium text-[#D9B96A] block truncate">
                تنبيه تلقائي في بداية كل يوم (بعد ١٢:٠٠ ص)
              </span>
              <h2 className="font-display text-lg sm:text-xl text-[#FAF6EC] truncate">
                نظام إشعارات المستحبات والأدعية
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="min-w-[44px] min-h-[44px] rounded-[4px] border border-[#B8924A]/40 bg-[#081A14]/45 hover:bg-[#1F6B50] flex items-center justify-center text-[#FAF6EC] cursor-pointer transition-colors shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2.5 bg-[#F3ECDA] border-b border-[#B8924A]/35 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`min-h-[40px] px-4 py-1.5 rounded-[4px] font-medium text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-colors border ${
              activeTab === 'schedule'
                ? 'bg-[#0F3D2E] text-[#FAF6EC] border-[#B8924A]'
                : 'bg-[#FAF6EC] text-[#11271F] border-[#B8924A]/35 hover:border-[#B8924A]'
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
            className={`min-h-[40px] px-4 py-1.5 rounded-[4px] font-medium text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-colors border ${
              activeTab === 'history'
                ? 'bg-[#0F3D2E] text-[#FAF6EC] border-[#B8924A]'
                : 'bg-[#FAF6EC] text-[#11271F] border-[#B8924A]/35 hover:border-[#B8924A]'
            }`}
          >
            <History className="w-4 h-4" aria-hidden="true" />
            <span className="tabular-nums">سجل التنبيهات ({history.length})</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {activeTab === 'history' ? (
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-[6px] bg-[#F3ECDA]/70 border border-[#B8924A]/35">
                  <Bell className="w-7 h-7 text-[#425B51] mx-auto mb-2" aria-hidden="true" />
                  <p className="font-arabic font-bold text-sm text-[#11271F]">
                    لا توجد تنبيهات مسجلة في السجل بعد.
                  </p>
                  <p className="text-xs text-[#425B51] mt-1">
                    سيظهر هنا سجل كل تنبيه يصلك مع دخول اليوم الجديد بعد الساعة 12:00 صباحاً.
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-[6px] bg-[#FAF6EC] border border-[#B8924A]/45 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#425B51]">
                      <span className="font-medium text-[#1F6B50]">
                        {item.guidance.dayNameAr} · {item.hijriFormatted}
                      </span>
                      <span className="tabular-nums">
                        {new Date(item.sentAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <h4 className="font-arabic font-bold text-base text-[#11271F]">
                      {item.guidance.title}
                    </h4>
                    {item.occasionToday && (
                      <p className="text-xs font-medium text-[#B8924A]">
                        مناسبة اليوم: {item.occasionToday.title}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSection(item.guidance.linkedSection, item.guidance.linkedEntryId);
                      }}
                      className="btn-manuscript min-h-[38px] px-4 py-1.5 text-xs inline-flex items-center gap-1.5"
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
              <div className="p-4 rounded-[6px] bg-[#F3ECDA]/80 border border-[#B8924A]/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
                <div className="flex items-start gap-2.5 text-right">
                  <Bell className="w-5 h-5 text-[#1F6B50] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="font-arabic font-bold text-sm sm:text-base text-[#11271F]">
                      {nativePlatform
                        ? 'إشعارات النظام المحلية (تعمل خارج التطبيق وبدون إنترنت)'
                        : 'إذن إشعارات الجهاز والتنبيه الفوري'}
                    </h3>
                    <p className="text-xs text-[#425B51] mt-0.5 leading-relaxed">
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
                      className="btn-emerald flex-1 sm:flex-initial min-h-[44px] px-4 py-2 text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <BellRing className="w-4 h-4" aria-hidden="true" />
                      <span>تفعيل إذن الجهاز</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1F6B50] px-2.5 py-2 whitespace-nowrap">
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>مفعّلة</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleSendTest}
                    className="btn-gilded flex-1 sm:flex-initial min-h-[44px] px-4 py-2 text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{testSent ? 'تم الإرسال!' : 'تجربة الإشعار'}</span>
                  </button>
                </div>
              </div>

              {/* Master Controls & Midnight Time Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-[6px] bg-[#FAF6EC] border border-[#B8924A]/45 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-arabic font-bold text-sm text-[#11271F] block">
                      تفعيل التنبيهات اليومية
                    </span>
                    <span className="text-xs text-[#425B51]">
                      تذكير يومي بمستحبات الأسبوع
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    dir="ltr"
                    aria-checked={settings.enabled}
                    onClick={() => updateSettings({ enabled: !settings.enabled })}
                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-200 border ${
                      settings.enabled
                        ? 'bg-[#1F6B50] border-[#0F3D2E]'
                        : 'bg-[#E5DEC9] border-[#B8924A]/50'
                    }`}
                  >
                    <span
                      className={`inline-block h-5.5 w-5.5 transform rounded-full bg-[#FAF6EC] shadow-sm transition-transform duration-200 ${
                        settings.enabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 rounded-[6px] bg-[#FAF6EC] border border-[#B8924A]/45 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#1F6B50] shrink-0" aria-hidden="true" />
                      <span className="font-arabic font-bold text-sm text-[#11271F]">
                        وقت الإشعار اليومي
                      </span>
                    </div>
                    <span className="text-xs font-medium text-[#1F6B50] tabular-nums">
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
                      className="flex-1 min-h-[44px] px-3 rounded-[4px] border border-[#B8924A]/45 bg-[#F3ECDA]/70 font-medium text-xs text-[#11271F] focus:outline-none focus:border-[#0F3D2E]"
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
                      className="min-h-[44px] px-2.5 rounded-[4px] border border-[#B8924A]/45 bg-[#FAF6EC] font-medium text-xs text-[#11271F] focus:outline-none focus:border-[#0F3D2E]"
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
                  className={`min-h-[48px] p-3 rounded-[4px] border text-right flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    settings.includeHijriOccasions
                      ? 'bg-[#F3ECDA] border-[#B8924A] text-[#11271F]'
                      : 'bg-[#FAF6EC] border-[#B8924A]/30 text-[#425B51]'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <Calendar className="w-4 h-4 text-[#B8924A] shrink-0" aria-hidden="true" />
                    <span>دمج مناسبات التقويم الهجري</span>
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      settings.includeHijriOccasions ? 'text-[#1F6B50]' : 'text-[#425B51]/70'
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
                  className={`min-h-[48px] p-3 rounded-[4px] border text-right flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    settings.inAppToastEnabled
                      ? 'bg-[#F3ECDA] border-[#B8924A] text-[#11271F]'
                      : 'bg-[#FAF6EC] border-[#B8924A]/30 text-[#425B51]'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <BellRing className="w-4 h-4 text-[#1F6B50] shrink-0" aria-hidden="true" />
                    <span>بطاقة تنبيه داخل التطبيق</span>
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      settings.inAppToastEnabled ? 'text-[#1F6B50]' : 'text-[#425B51]/70'
                    }`}
                  >
                    {settings.inAppToastEnabled ? 'مفعّل' : 'متوقف'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                  className={`min-h-[48px] p-3 rounded-[4px] border text-right flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    settings.soundEnabled
                      ? 'bg-[#F3ECDA] border-[#B8924A] text-[#11271F]'
                      : 'bg-[#FAF6EC] border-[#B8924A]/30 text-[#425B51]'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <Volume2 className="w-4 h-4 text-[#1F6B50] shrink-0" aria-hidden="true" />
                    <span>نغمة لطيفة للتنبيه</span>
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      settings.soundEnabled ? 'text-[#1F6B50]' : 'text-[#425B51]/70'
                    }`}
                  >
                    {settings.soundEnabled ? 'مفعّل' : 'صامت'}
                  </span>
                </button>
              </div>

              {/* Adhan, Prayer Alerts & Salat al-Layl Quick Gateway */}
              <div className="p-4 rounded-[6px] bg-[#0F3D2E] text-[#FAF6EC] border border-[#B8924A]/65 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <MinaretAdhanIcon className="w-5 h-5 text-[#D9B96A] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-display font-bold text-sm sm:text-base text-[#FAF6EC] block">
                      الأذان ومواقيت الصلاة وتذكير صلاة الليل
                    </span>
                    <span className="text-xs text-[#DFECE6]/85 block mt-0.5 leading-relaxed">
                      تحكّم كامل بكل صلاة، اختيار المؤذن، التنبيه قبل الصلاة، تذكير صلاة الليل (١٠ م - ١٢ ص)، والجدولة لمدة ١٤ يوماً بدون إنترنت.
                    </span>
                  </div>
                </div>
                {onOpenAdhanSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdhanSettings();
                    }}
                    className="btn-gilded min-h-[42px] px-4 py-2 text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>فتح إعدادات الأذان</span>
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Days Selection Strip (Responsive for 360px+ Mobile) */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 px-1">
                  <span className="font-arabic font-bold text-sm text-[#11271F]">
                    أيام الأسبوع لتلقي التنبيه وتصفح المستحبات:
                  </span>
                  <span className="text-xs text-[#425B51]">
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
                        className={`relative rounded-[4px] border p-2 text-center transition-colors flex flex-col items-center justify-between gap-1.5 ${
                          isSelected
                            ? 'border-[#0F3D2E] bg-[#F3ECDA]'
                            : 'border-[#B8924A]/35 bg-[#FAF6EC] hover:border-[#B8924A]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setActivePreviewDay(day.dayIndex)}
                          className="w-full pt-1 cursor-pointer focus-visible:outline-none"
                        >
                          {(isThursday || isFriday) && (
                            <span className="block text-[10px] font-medium text-[#B8924A] mb-0.5 whitespace-nowrap">
                              {isThursday ? 'كميل' : 'الندبة'}
                            </span>
                          )}
                          <span className="font-arabic font-bold text-xs sm:text-sm block text-[#11271F] whitespace-nowrap">
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
                          className={`min-w-[40px] min-h-[32px] px-2 rounded-[4px] inline-flex items-center justify-center text-xs font-bold cursor-pointer transition-colors border ${
                            isDayEnabled
                              ? 'bg-[#0F3D2E] text-[#D9B96A] border-[#B8924A]/60'
                              : 'bg-[#F3ECDA] text-[#425B51] border-[#B8924A]/30'
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
              <div className="rounded-[6px] p-4 sm:p-6 bg-[#0F3D2E] text-[#FAF6EC] border border-[#B8924A]/60 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-medium text-[#D9B96A]">
                    <span>{selectedDayGuidance.badge}</span>
                    {isToday && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#F3ECDA]">اليوم الحالي</span>
                      </>
                    )}
                  </div>

                  <span className="text-[#D9B96A]/90 font-medium">
                    تنبيه {selectedDayGuidance.dayNameAr}:{' '}
                    {settings.enabledDays[selectedDayGuidance.dayIndex] ? 'مفعّل ✓' : 'معطّل'}
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-lg sm:text-2xl text-[#FAF6EC]">
                    {selectedDayGuidance.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#F3ECDA]/85 mt-1 leading-relaxed">
                    {selectedDayGuidance.shortSummary}
                  </p>
                </div>

                <div className="rounded-[4px] bg-[#081A14]/55 p-3.5 sm:p-4 border border-[#B8924A]/30 space-y-2">
                  <span className="text-xs font-medium text-[#D9B96A] block mb-1">
                    الأعمال والمستحبات المأثورة:
                  </span>
                  <ul className="space-y-1.5 pr-1">
                    {selectedDayGuidance.recommendedActs.map((act, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs sm:text-sm text-[#FAF6EC]/95 leading-relaxed"
                      >
                        <span className="text-[#D9B96A] shrink-0" aria-hidden="true">
                          •
                        </span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="text-xs font-medium text-[#D9B96A]">
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
                    className="btn-gilded min-h-[44px] px-6 py-2 text-xs sm:text-sm inline-flex items-center gap-2"
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
        <div className="p-3.5 sm:p-4 bg-[#F3ECDA] border-t border-[#B8924A]/35 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-[#425B51] font-medium">
            يبدأ التنبيه اليومي تلقائياً بعد ١٢:٠٠ صباحاً مع تجدد كل يوم هجري وميلادي.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-manuscript min-h-[42px] px-6 py-2 text-xs sm:text-sm"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
