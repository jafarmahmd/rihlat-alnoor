import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import {
  LocalNotifications,
  LocalNotificationSchema,
} from '@capacitor/local-notifications';
import {
  DaySpiritualGuidance,
  WEEKLY_SPIRITUAL_GUIDANCE,
  getTodaySpiritualGuidance,
  loadNotificationSettings,
  saveNotificationSettings,
} from '../data/spiritualNotifications';
import {
  getOccasionsForHijriDay,
  getTodayHijriDate,
  loadHijriOffset,
} from '../data/hijriCalendar';
import {
  computeLocalAdhanPrayerTimes,
  formatHHMMArabic12h,
  loadPrayerLocationPreference,
  toArabicNums,
} from './prayerTimes';
import {
  PRAYER_ALERT_KEYS,
  PRAYER_LABELS_AR,
  clampSalatAlLaylTime,
  loadAdhanSettings,
} from '../data/adhanSettings';
import { syncAdhanAndPrayerAlarms } from './adhanScheduler';
import {
  AdhanSchedulerPlugin,
  isCustomAdhanPluginAvailable,
} from '../plugins/adhanNativePlugin';
import { syncNativeAdhanStateFromPlugin } from './adhanAudioPlayer';
import { DigitalLibrarySection, HijriOccasion } from '../types/game';
import { playCorrectSound } from './sound';

export interface DispatchedNotificationPayload {
  id: string;
  guidance: DaySpiritualGuidance;
  hijriFormatted: string;
  occasionToday: HijriOccasion | null;
  sentAt: number;
  isTest?: boolean;
}

const LOG_STORAGE_KEY = 'rihlat_alnoor_notification_history_v1';
const AUTO_PROMPTED_KEY = 'rihlat_alnoor_notif_auto_prompted_v1';
const PRAYER_NOTIFIED_KEY = 'rihlat_alnoor_prayer_notified_v1';
const IN_APP_EVENT = 'rihlat:spiritual-notification';
const OPEN_ENTRY_EVENT = 'rihlat:open-spiritual-entry';
const NATIVE_CHANNEL_ID = 'spiritual_daily_reminders';
const WEEKLY_BASE_ID = 1000;
const HIJRI_BASE_ID = 2000;
const DAILY_BASE_ID = 3000;
const PRAYER_BASE_ID = 4000;
const TEST_NATIVE_ID = 9901;

const PRAYER_NAMES_AR: Record<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', string> = {
  fajr: 'صلاة الفجر',
  dhuhr: 'صلاة الظهر',
  asr: 'صلاة العصر',
  maghrib: 'صلاة المغرب',
  isha: 'صلاة العشاء',
};

export function isNativeMobile(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function isNotificationSupported(): boolean {
  if (isNativeMobile()) return true;
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (isNativeMobile()) return 'default';
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function getNotificationPermissionAsync(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (isNativeMobile()) {
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') return 'granted';
      if (status.display === 'denied') return 'denied';
      return 'default';
    } catch {
      return 'default';
    }
  }
  return getNotificationPermission();
}

async function ensureNativeChannel(): Promise<void> {
  if (!isNativeMobile()) return;
  try {
    if (Capacitor.getPlatform() === 'android') {
      const adhanSettings = loadAdhanSettings();
      await LocalNotifications.createChannel({
        id: NATIVE_CHANNEL_ID,
        name: 'مستحبات الأيام والأدعية',
        description: 'تنبيهات يومية بعد منتصف الليل لمستحبات الأسبوع ودعاء كميل والندبة والمناسبات الهجرية',
        importance: adhanSettings.allowNotificationsDuringAdhan ? 5 : 4,
        visibility: 1,
        vibration: true,
        lights: true,
        lightColor: '#059669',
      });
    }
  } catch (err) {
    console.warn('Could not create Android notification channel:', err);
  }
}

export async function getPendingNativeNotificationCount(): Promise<number> {
  if (!isNativeMobile()) return 0;
  try {
    const pending = await LocalNotifications.getPending();
    return pending.notifications.filter(
      (n) =>
        (n.id >= WEEKLY_BASE_ID && n.id <= WEEKLY_BASE_ID + 6) ||
        (n.id >= HIJRI_BASE_ID && n.id <= HIJRI_BASE_ID + 35) ||
        (n.id >= DAILY_BASE_ID && n.id <= DAILY_BASE_ID + 35) ||
        (n.id >= PRAYER_BASE_ID && n.id <= PRAYER_BASE_ID + 30)
    ).length;
  } catch {
    return 0;
  }
}

/**
 * Schedules real OS-level Local Notifications (Android AlarmManager / iOS UNUserNotificationCenter)
 * so daily after-midnight reminders & Hijri occasions appear directly in the phone notification bar
 * even when the app is completely closed & offline.
 */
export async function syncNativeDailyNotifications(): Promise<number> {
  if (!isNativeMobile()) return 0;

  let dailyScheduled = 0;

  try {
    const settings = loadNotificationSettings();
    const pending = await LocalNotifications.getPending();
    const existingIds = pending.notifications
      .map((n) => n.id)
      .filter(
        (id) =>
          (id >= WEEKLY_BASE_ID && id <= WEEKLY_BASE_ID + 6) ||
          (id >= HIJRI_BASE_ID && id <= HIJRI_BASE_ID + 35) ||
          (id >= DAILY_BASE_ID && id <= DAILY_BASE_ID + 35) ||
          (id >= PRAYER_BASE_ID && id <= PRAYER_BASE_ID + 30)
      );

    if (existingIds.length > 0) {
      await LocalNotifications.cancel({
        notifications: existingIds.map((id) => ({ id })),
      });
    }

    if (settings.enabled) {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display === 'granted') {
        await ensureNativeChannel();

        const [rawH, rawM] = settings.reminderTime.split(':').map(Number);
        const targetH = Number.isFinite(rawH) ? rawH : 0;
        const targetM = Number.isFinite(rawM) ? rawM : 5;
        const isAndroid = Capacitor.getPlatform() === 'android';
        const hijriOffset = loadHijriOffset();
        const now = new Date();
        const nowMs = now.getTime();

        const toSchedule: LocalNotificationSchema[] = [];

        for (let offsetDays = 0; offsetDays <= 30; offsetDays++) {
          const targetDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + offsetDays,
            targetH,
            targetM,
            0,
            0
          );

          if (targetDate.getTime() <= nowMs + 15000) continue;

          const dayIdx = targetDate.getDay();
          if (!settings.enabledDays[dayIdx]) continue;

          const dayGuidance =
            WEEKLY_SPIRITUAL_GUIDANCE[dayIdx] || WEEKLY_SPIRITUAL_GUIDANCE[4];
          const hijriInfo = getTodayHijriDate(targetDate, hijriOffset);
          const occasions = settings.includeHijriOccasions
            ? getOccasionsForHijriDay(hijriInfo.month, hijriInfo.day)
            : [];
          const occ = occasions.length > 0 ? occasions[0] : null;

          const actsSummary = dayGuidance.recommendedActs.slice(0, 2).join(' • ');
          const title = occ
            ? `🌟 ${dayGuidance.dayNameAr}: ${occ.title}`
            : `🌙 ${dayGuidance.title}`;
          const body = occ
            ? `📅 ${hijriInfo.formattedArabic}\n🤲 ${occ.shortDua}\n✨ ${actsSummary}`
            : `📅 ${hijriInfo.formattedArabic}\n✨ ${actsSummary}\n📖 ${dayGuidance.primaryDuaTitle}`;
          const largeBody = occ
            ? `📅 ${hijriInfo.formattedArabic}\n${occ.shortStory}\n\n🤲 الدعاء: ${occ.shortDua}\n\n${dayGuidance.recommendedActs
                .map((a) => `✦ ${a}`)
                .join('\n')}`
            : `${dayGuidance.shortSummary}\n\n${dayGuidance.recommendedActs
                .map((a) => `✦ ${a}`)
                .join('\n')}\n\n📖 ${dayGuidance.primaryDuaTitle}`;

          toSchedule.push({
            id: DAILY_BASE_ID + offsetDays,
            title,
            body,
            largeBody,
            summaryText: occ ? hijriInfo.monthName : dayGuidance.badge,
            channelId: isAndroid ? NATIVE_CHANNEL_ID : undefined,
            autoCancel: true,
            foreground: true,
            isExactNotification: false,
            schedule: {
              at: targetDate,
              allowWhileIdle: true,
            },
            extra: {
              dayIndex: dayIdx,
              section: occ?.linkedSection || dayGuidance.linkedSection,
              entryId: occ?.linkedEntryId || dayGuidance.linkedEntryId || '',
            },
          });
        }

        if (toSchedule.length > 0) {
          await LocalNotifications.schedule({ notifications: toSchedule });
          dailyScheduled = toSchedule.length;
        }
      }
    }
  } catch (err) {
    console.warn('Could not sync native local notifications:', err);
  }

  try {
    const adhanMeta = await syncAdhanAndPrayerAlarms();
    return dailyScheduled + adhanMeta.scheduledCount;
  } catch (err) {
    console.warn('Could not sync Adhan alarms:', err);
    return dailyScheduled;
  }
}

export async function requestNativeNotificationPermissionOnce(): Promise<boolean> {
  if (!isNativeMobile() || typeof window === 'undefined') return false;
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'granted') {
      await ensureNativeChannel();
      await syncNativeDailyNotifications();
      return true;
    }
    if (window.localStorage.getItem(AUTO_PROMPTED_KEY) === '1') {
      return false;
    }
    window.localStorage.setItem(AUTO_PROMPTED_KEY, '1');
    const req = await LocalNotifications.requestPermissions();
    const granted = req.display === 'granted';
    if (granted) {
      await ensureNativeChannel();
      await syncNativeDailyNotifications();
    }
    return granted;
  } catch {
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (isNativeMobile()) {
    try {
      let granted = false;
      if (isCustomAdhanPluginAvailable()) {
        const res = await AdhanSchedulerPlugin.requestNotificationPermission();
        granted = Boolean(res.granted);
      }
      if (!granted) {
        const result = await LocalNotifications.requestPermissions();
        granted = result.display === 'granted';
      }
      if (granted) {
        await ensureNativeChannel();
        await syncNativeDailyNotifications();
      }
      return granted;
    } catch {
      return false;
    }
  }

  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch {
    return false;
  }
}

/**
 * يفحص إذن الإشعارات، وإذا كان غير مضاف/غير ممنوح يطلبه فوراً
 * لتمكين وصول التنبيهات حتى في وقت الأذان.
 */
export async function ensureNotificationPermissionIfMissing(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if (isNativeMobile()) {
    try {
      const current = await getNotificationPermissionAsync();
      if (current === 'granted') {
        await ensureNativeChannel();
        return true;
      }
      return await requestNotificationPermission();
    } catch {
      return false;
    }
  }

  if (!isNotificationSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'default') {
    return await requestNotificationPermission();
  }
  return false;
}

export function getNotificationHistory(): DispatchedNotificationPayload[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendNotificationHistory(payload: DispatchedNotificationPayload): void {
  if (typeof window === 'undefined') return;
  try {
    const prev = getNotificationHistory();
    const next = [payload, ...prev].slice(0, 14);
    window.localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota errors
  }
}

export function dispatchOpenSpiritualEntry(
  section: DigitalLibrarySection | 'library' | 'tasbih' | 'duas' | 'munajat',
  entryId?: string
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(OPEN_ENTRY_EVENT, {
      detail: { section, entryId },
    })
  );
}

export function subscribeToOpenSpiritualEntry(
  handler: (detail: {
    section: DigitalLibrarySection | 'library' | 'tasbih' | 'duas' | 'munajat';
    entryId?: string;
  }) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (e: Event) => {
    const custom = e as CustomEvent<{
      section: DigitalLibrarySection | 'library' | 'tasbih' | 'duas' | 'munajat';
      entryId?: string;
    }>;
    if (custom.detail) {
      handler(custom.detail);
    }
  };
  window.addEventListener(OPEN_ENTRY_EVENT, listener);
  return () => window.removeEventListener(OPEN_ENTRY_EVENT, listener);
}

export function subscribeToInAppNotification(
  handler: (payload: DispatchedNotificationPayload) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (e: Event) => {
    const custom = e as CustomEvent<DispatchedNotificationPayload>;
    if (custom.detail) {
      handler(custom.detail);
    }
  };
  window.addEventListener(IN_APP_EVENT, listener);
  return () => window.removeEventListener(IN_APP_EVENT, listener);
}

export async function sendSpiritualNotification(
  guidance: DaySpiritualGuidance,
  options?: { isTest?: boolean; skipInAppToast?: boolean }
): Promise<boolean> {
  const settings = loadNotificationSettings();
  const now = new Date();
  const hijriToday = getTodayHijriDate(now, loadHijriOffset());
  const occasions = settings.includeHijriOccasions
    ? getOccasionsForHijriDay(hijriToday.month, hijriToday.day)
    : [];
  const occasionToday = occasions.length > 0 ? occasions[0] : null;

  const payload: DispatchedNotificationPayload = {
    id: `${guidance.dayIndex}-${Date.now()}`,
    guidance,
    hijriFormatted: hijriToday.formattedArabic,
    occasionToday,
    sentAt: Date.now(),
    isTest: options?.isTest,
  };

  if (!options?.isTest) {
    appendNotificationHistory(payload);
  }

  // In-app toast delivery (works everywhere)
  if (typeof window !== 'undefined' && !options?.skipInAppToast && settings.inAppToastEnabled) {
    window.dispatchEvent(new CustomEvent(IN_APP_EVENT, { detail: payload }));
    if (settings.soundEnabled) {
      playCorrectSound(false);
    }
  }

  const titlePrefix = options?.isTest ? '🔔 تجربة إشعار: ' : '🌙 ';
  const title = occasionToday
    ? `${titlePrefix}${guidance.dayNameAr}: ${occasionToday.title}`
    : `${titlePrefix}${guidance.title}`;

  const bodyLines = [
    `📅 ${hijriToday.formattedArabic}`,
    `✨ ${guidance.recommendedActs.slice(0, 2).join(' • ')}`,
    `📖 الدعاء المخصص: ${guidance.primaryDuaTitle}`,
  ];
  const body = bodyLines.join('\n');

  // Native Capacitor OS Notification Bar Delivery (posts immediately to Android notification shade)
  if (isNativeMobile()) {
    try {
      let perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted' && options?.isTest) {
        perm = await LocalNotifications.requestPermissions();
      }
      if (perm.display === 'granted') {
        await ensureNativeChannel();
        await LocalNotifications.schedule({
          notifications: [
            {
              id: options?.isTest ? TEST_NATIVE_ID : 9000 + guidance.dayIndex,
              title,
              body,
              largeBody: `${guidance.shortSummary}\n\n${guidance.recommendedActs
                .map((a) => `✦ ${a}`)
                .join('\n')}`,
              summaryText: guidance.badge,
              channelId:
                Capacitor.getPlatform() === 'android' ? NATIVE_CHANNEL_ID : undefined,
              autoCancel: true,
              foreground: true,
              isExactNotification: false,
              extra: {
                dayIndex: guidance.dayIndex,
                section: guidance.linkedSection,
                entryId: guidance.linkedEntryId || '',
              },
            },
          ],
        });
        return true;
      }
    } catch (err) {
      console.warn('Could not send native local notification:', err);
    }
    return settings.inAppToastEnabled;
  }

  // Web / PWA Notification Delivery
  if (!isNotificationSupported()) {
    return settings.inAppToastEnabled;
  }

  let permission = Notification.permission;
  if (permission === 'default' && options?.isTest) {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    return settings.inAppToastEnabled;
  }

  const icon = '/pwa-192x192.png';

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          body,
          icon,
          badge: '/pwa-192x192.png',
          dir: 'rtl',
          lang: 'ar',
          tag: `spiritual-reminder-${guidance.dayIndex}`,
          data: {
            section: guidance.linkedSection,
            entryId: guidance.linkedEntryId,
          },
        });
        return true;
      }
    }

    const n = new Notification(title, {
      body,
      icon,
      dir: 'rtl',
      lang: 'ar',
      tag: `spiritual-reminder-${guidance.dayIndex}`,
    });

    n.onclick = () => {
      window.focus();
      dispatchOpenSpiritualEntry(guidance.linkedSection, guidance.linkedEntryId);
      n.close();
    };

    return true;
  } catch (err) {
    console.warn('Could not dispatch system notification:', err);
    return settings.inAppToastEnabled;
  }
}

export function getTodayIsoLocal(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export function checkAndTriggerDailyNotification(): boolean {
  if (typeof window === 'undefined') return false;

  const settings = loadNotificationSettings();
  const adhanSettings = loadAdhanSettings();
  const now = new Date();
  const dayIndex = now.getDay();
  const todayIso = getTodayIsoLocal(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let triggeredAny = false;

  // 1) التنبيه اليومي للمستحبات (يعمل بشكل مستقل ولا يعطّل تنبيهات الصلاة والأذان)
  if (
    settings.enabled &&
    settings.enabledDays[dayIndex] &&
    settings.lastNotifiedDate !== todayIso
  ) {
    const [rawH, rawM] = settings.reminderTime.split(':').map(Number);
    const targetH = Number.isFinite(rawH) ? rawH : 0;
    const targetM = Number.isFinite(rawM) ? rawM : 5;
    const targetMinutes = targetH * 60 + targetM;

    if (currentMinutes >= targetMinutes) {
      const guidance = getTodaySpiritualGuidance(now);
      saveNotificationSettings({
        ...settings,
        lastNotifiedDate: todayIso,
      });
      void sendSpiritualNotification(guidance);
      triggeredAny = true;
    }
  }

  // 2) تنبيهات دخول وقت الصلاة، التنبيه القبلي، وصلاة الليل (في الواجهة / المتصفح)
  const locPref = loadPrayerLocationPreference();
  const pData = computeLocalAdhanPrayerTimes(
    locPref.lat,
    locPref.lng,
    locPref.cityLabel,
    now,
    adhanSettings
  );

  let alreadyNotifiedMap: Record<string, string> = {};
  try {
    const raw = window.localStorage.getItem(PRAYER_NOTIFIED_KEY);
    if (raw) alreadyNotifiedMap = JSON.parse(raw) || {};
  } catch {
    alreadyNotifiedMap = {};
  }

  const persistNotifiedMap = () => {
    try {
      window.localStorage.setItem(
        PRAYER_NOTIFIED_KEY,
        JSON.stringify(alreadyNotifiedMap)
      );
    } catch {
      // Ignore quota errors
    }
  };

  for (const key of PRAYER_ALERT_KEYS) {
    const cfg = adhanSettings.prayers[key];
    if (!cfg?.enabled) continue;
    const [ph, pm] = pData.timings[key].split(':').map(Number);
    const pMin = (ph || 0) * 60 + (pm || 0);

    // التنبيه قبل الصلاة (مسموح به كذلك حتى في وقت الأذان عندما يكون الخيار مفعّلاً)
    if (cfg.preReminderMinutes > 0 && !isNativeMobile()) {
      const preMin = pMin - cfg.preReminderMinutes;
      if (preMin >= 0 && currentMinutes >= preMin && currentMinutes <= preMin + 2) {
        const preKey = `pre_${key}`;
        const preStamp = `${todayIso}:${preKey}`;
        if (alreadyNotifiedMap[preKey] !== preStamp) {
          alreadyNotifiedMap[preKey] = preStamp;
          persistNotifiedMap();
          if (isNotificationSupported() && Notification.permission === 'granted') {
            try {
              new Notification(`اقترب موعد صلاة ${PRAYER_LABELS_AR[key]}`, {
                body: `يتبقى ${toArabicNums(cfg.preReminderMinutes)} دقيقة على أذان ${
                  PRAYER_LABELS_AR[key]
                } (${formatHHMMArabic12h(pData.timings[key])}) · ${locPref.cityLabel}`,
                icon: '/pwa-192x192.png',
                dir: 'rtl',
                lang: 'ar',
                tag: `pre-prayer-${preStamp}`,
              });
            } catch {
              // Ignore notification error
            }
          }
          triggeredAny = true;
        }
      }
    }

    // تنبيه وقت الأذان الفعلي
    if (currentMinutes >= pMin && currentMinutes <= pMin + 2) {
      const stamp = `${todayIso}:${key}`;
      if (alreadyNotifiedMap[key] !== stamp) {
        alreadyNotifiedMap[key] = stamp;
        persistNotifiedMap();

        if (
          !isNativeMobile() &&
          isNotificationSupported() &&
          Notification.permission === 'granted'
        ) {
          try {
            new Notification(`حان الآن موعد ${PRAYER_NAMES_AR[key]}`, {
              body: `${locPref.cityLabel} · الوقت: ${formatHHMMArabic12h(
                pData.timings[key]
              )}`,
              icon: '/pwa-192x192.png',
              dir: 'rtl',
              lang: 'ar',
              tag: `prayer-${stamp}`,
            });
          } catch {
            // Ignore notification error
          }
        }
        if (cfg.alertMode !== 'silent' && (settings.soundEnabled || adhanSettings.allowNotificationsDuringAdhan)) {
          playCorrectSound(false);
        }
        triggeredAny = true;
      }
    }
  }

  if (adhanSettings.salatAlLayl.enabled && !isNativeMobile()) {
    const laylTime = clampSalatAlLaylTime(adhanSettings.salatAlLayl.timeHHMM);
    const [lh, lm] = laylTime.split(':').map(Number);
    const laylMin = (lh || 0) * 60 + (lm || 0);
    if (currentMinutes >= laylMin && currentMinutes <= laylMin + 2) {
      const stamp = `${todayIso}:layl`;
      if (alreadyNotifiedMap['salat_allayl'] !== stamp) {
        alreadyNotifiedMap['salat_allayl'] = stamp;
        persistNotifiedMap();
        if (isNotificationSupported() && Notification.permission === 'granted') {
          try {
            new Notification('تذكير صلاة الليل المباركة', {
              body: `حان وقت التهجد ومناجاة الله تعالى (${formatHHMMArabic12h(laylTime)})`,
              icon: '/pwa-192x192.png',
              dir: 'rtl',
              lang: 'ar',
              tag: `layl-${stamp}`,
            });
          } catch {
            // Ignore notification error
          }
        }
        if (adhanSettings.salatAlLayl.soundType !== 'silent') {
          playCorrectSound(false);
        }
        triggeredAny = true;
      }
    }
  }

  return triggeredAny;
}

/**
 * Starts the unified notification engine:
 * - On Native (Capacitor Android/iOS): schedules exact OS alarms for offline/closed-app delivery & listens for notification taps.
 * - On Web / PWA: schedules exact midnight rollover timeout + interval + resume checks.
 */
export function startDailyNotificationScheduler(): () => void {
  if (typeof window === 'undefined') return () => {};

  let exactTimer: number | null = null;
  const nativeHandles: PluginListenerHandle[] = [];

  if (isNativeMobile()) {
    void syncNativeDailyNotifications();

    if (isCustomAdhanPluginAvailable()) {
      void AdhanSchedulerPlugin.addListener('adhanStateChanged', (ev) => {
        syncNativeAdhanStateFromPlugin(
          Boolean(ev?.isPlaying),
          ev?.title,
          ev?.muezzinRawName
        );
      }).then((handle) => nativeHandles.push(handle));
    }

    void LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
      const extra = event.notification?.extra as
        | {
            section?: DigitalLibrarySection | 'library' | 'tasbih' | 'duas' | 'munajat';
            entryId?: string;
          }
        | undefined;
      if (extra?.section) {
        dispatchOpenSpiritualEntry(extra.section, extra.entryId || undefined);
      }
    }).then((handle) => nativeHandles.push(handle));

    void LocalNotifications.addListener('localNotificationReceived', (notification) => {
      const extra = notification?.extra as { dayIndex?: number } | undefined;
      if (typeof extra?.dayIndex === 'number') {
        const guidance =
          WEEKLY_SPIRITUAL_GUIDANCE[extra.dayIndex] || getTodaySpiritualGuidance();
        const hijriToday = getTodayHijriDate(new Date(), loadHijriOffset());
        const occasions = getOccasionsForHijriDay(hijriToday.month, hijriToday.day);
        appendNotificationHistory({
          id: `native-${notification.id}-${Date.now()}`,
          guidance,
          hijriFormatted: hijriToday.formattedArabic,
          occasionToday: occasions.length > 0 ? occasions[0] : null,
          sentAt: Date.now(),
        });
      }
    }).then((handle) => nativeHandles.push(handle));
  } else {
    void syncAdhanAndPrayerAlarms();
  }

  const scheduleNextExactTrigger = () => {
    if (exactTimer !== null) {
      window.clearTimeout(exactTimer);
      exactTimer = null;
    }

    const settings = loadNotificationSettings();
    if (!settings.enabled) return;

    const [rawH, rawM] = settings.reminderTime.split(':').map(Number);
    const targetH = Number.isFinite(rawH) ? rawH : 0;
    const targetM = Number.isFinite(rawM) ? rawM : 5;

    const now = new Date();
    const target = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      targetH,
      targetM,
      1,
      0
    );

    const todayIso = getTodayIsoLocal(now);
    if (target.getTime() <= now.getTime()) {
      if (settings.lastNotifiedDate !== todayIso && settings.enabledDays[now.getDay()]) {
        checkAndTriggerDailyNotification();
      }
      target.setDate(target.getDate() + 1);
    }

    const delayMs = Math.min(target.getTime() - now.getTime(), 24 * 60 * 60 * 1000);
    if (delayMs > 0) {
      exactTimer = window.setTimeout(() => {
        checkAndTriggerDailyNotification();
        scheduleNextExactTrigger();
      }, delayMs);
    }
  };

  checkAndTriggerDailyNotification();
  scheduleNextExactTrigger();

  const intervalId = window.setInterval(() => {
    checkAndTriggerDailyNotification();
  }, 30000);

  const handleResume = () => {
    if (document.visibilityState === 'visible') {
      checkAndTriggerDailyNotification();
      scheduleNextExactTrigger();
      if (isNativeMobile()) {
        void syncAdhanAndPrayerAlarms();
      }
    }
  };

  const handleFocus = () => {
    checkAndTriggerDailyNotification();
  };

  const handleSettingsUpdated = () => {
    if (isNativeMobile()) {
      void syncNativeDailyNotifications();
    } else {
      void syncAdhanAndPrayerAlarms();
    }
    checkAndTriggerDailyNotification();
    scheduleNextExactTrigger();
  };

  const handleAdhanOrLocationUpdated = () => {
    void syncAdhanAndPrayerAlarms();
  };

  const handleHijriUpdated = () => {
    if (isNativeMobile()) {
      void syncNativeDailyNotifications();
    }
  };

  window.addEventListener('visibilitychange', handleResume);
  window.addEventListener('focus', handleFocus);
  window.addEventListener('rihlat:notification-settings-updated', handleSettingsUpdated);
  window.addEventListener('rihlat:adhan-settings-updated', handleAdhanOrLocationUpdated);
  window.addEventListener('rihlat:prayer-location-updated', handleAdhanOrLocationUpdated);
  window.addEventListener('rihlat:hijri-offset-updated', handleHijriUpdated);

  return () => {
    if (exactTimer !== null) window.clearTimeout(exactTimer);
    window.clearInterval(intervalId);
    window.removeEventListener('visibilitychange', handleResume);
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('rihlat:notification-settings-updated', handleSettingsUpdated);
    window.removeEventListener('rihlat:adhan-settings-updated', handleAdhanOrLocationUpdated);
    window.removeEventListener('rihlat:prayer-location-updated', handleAdhanOrLocationUpdated);
    window.removeEventListener('rihlat:hijri-offset-updated', handleHijriUpdated);
    nativeHandles.forEach((h) => {
      void h.remove();
    });
  };
}

export function getGuidanceForDay(dayIndex: number): DaySpiritualGuidance {
  return WEEKLY_SPIRITUAL_GUIDANCE[dayIndex] || WEEKLY_SPIRITUAL_GUIDANCE[4];
}
