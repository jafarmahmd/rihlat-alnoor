import { Capacitor } from '@capacitor/core';
import {
  LocalNotifications,
  LocalNotificationSchema,
} from '@capacitor/local-notifications';
import {
  MUEZZIN_ENTRIES,
  getAdhanChannelIdForMuezzin,
  getMuezzinByRawName,
} from '../config/muezzins';
import {
  AdhanScheduleMeta,
  AdhanSettings,
  PRAYER_ALERT_KEYS,
  PRAYER_LABELS_AR,
  PrayerAlertKey,
  clampSalatAlLaylTime,
  loadAdhanScheduleMeta,
  loadAdhanSettings,
  saveAdhanScheduleMeta,
} from '../data/adhanSettings';
import {
  AdhanDiagnosticsResult,
  AdhanSchedulerPlugin,
  NativeAdhanAlarmItem,
  isCustomAdhanPluginAvailable,
} from '../plugins/adhanNativePlugin';
import {
  playGentleReminderChime,
  playLocalMuezzinPreview,
  stopAnyAdhanPlayback,
  syncNativeAdhanStateFromPlugin,
} from './adhanAudioPlayer';
import {
  computeLocalAdhanPrayerTimes,
  formatHHMMArabic12h,
  loadPrayerLocationPreference,
  toArabicNums,
} from './prayerTimes';

const ADHAN_LOCAL_NOTIF_BASE_ID = 5000;
const ADHAN_LOCAL_NOTIF_MAX_ID = 5999;
const SILENT_CHANNEL_ID = 'adhan_silent_alerts';
const LAYL_GENTLE_CHANNEL_ID = 'salat_allayl_reminders';
const SCHEDULE_DAYS_AHEAD = 14;
const SCHEDULE_META_ENGINE_KEY_PREFIX = 'adhan_';

export interface CombinedAdhanDiagnostics {
  isNativeAndroid: boolean;
  nativePluginAvailable: boolean;
  notificationsGranted: boolean;
  exactAlarmsGranted: boolean;
  batteryOptimizationIgnored: boolean;
  dndPolicyAccessGranted: boolean;
  locationMode: 'gps' | 'city';
  locationLabel: string;
  lastScheduledAt: number | null;
  scheduledCount: number;
  engine: AdhanScheduleMeta['engine'];
  missingRawFiles: string[];
  androidSdkInt: number;
}

function getActiveMuezzinRawNames(settings: AdhanSettings): string[] {
  const set = new Set<string>();
  for (const key of PRAYER_ALERT_KEYS) {
    const cfg = settings.prayers[key];
    if (cfg.enabled && cfg.alertMode === 'adhan') {
      set.add(getMuezzinByRawName(cfg.muezzinRawName).rawName);
    }
  }
  if (settings.salatAlLayl.enabled && settings.salatAlLayl.soundType === 'adhan') {
    set.add(getMuezzinByRawName(settings.salatAlLayl.muezzinRawName).rawName);
  }
  if (set.size === 0) {
    set.add(MUEZZIN_ENTRIES[0].rawName);
  }
  return Array.from(set);
}

/**
 * ينشئ قناة إشعارات مستقلة لكل مؤذن نشط (adhan_<rawName>)
 * ويحذف القنوات القديمة غير المستخدمة، وينشئ قناتي الإشعار الصامت وصلاة الليل.
 */
export async function syncAndroidAdhanNotificationChannels(
  settings: AdhanSettings
): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return;
  }

  try {
    const activeRawNames = getActiveMuezzinRawNames(settings);
    const activeChannelIds = new Set(
      activeRawNames.map((r) => getAdhanChannelIdForMuezzin(r))
    );

    const existing = await LocalNotifications.listChannels().catch(() => ({
      channels: [],
    }));

    for (const ch of existing.channels || []) {
      if (
        ch.id.startsWith(SCHEDULE_META_ENGINE_KEY_PREFIX) &&
        ch.id !== SILENT_CHANNEL_ID &&
        ch.id !== 'adhan_playback_service' &&
        !activeChannelIds.has(ch.id)
      ) {
        await LocalNotifications.deleteChannel({ id: ch.id }).catch(() => {});
      }
    }

    for (const rawName of activeRawNames) {
      const m = getMuezzinByRawName(rawName);
      const channelId = getAdhanChannelIdForMuezzin(rawName);
      await LocalNotifications.createChannel({
        id: channelId,
        name: `أذان ${m.displayName}`,
        description: `تنبيهات مواقيت الصلاة بصوت المؤذن ${m.displayName}`,
        importance: 5,
        visibility: 1,
        sound: m.rawName,
        vibration: true,
        lights: true,
        lightColor: '#B8924A',
      }).catch(() => {});
    }

    await LocalNotifications.createChannel({
      id: SILENT_CHANNEL_ID,
      name: 'تنبيهات الصلاة الصامتة والتذكير القبلي',
      description: 'إشعارات مواقيت الصلاة الصامتة والتنبيه قبل دخول الوقت',
      importance: settings.allowNotificationsDuringAdhan ? 4 : 3,
      visibility: 1,
      vibration: false,
      lights: true,
      lightColor: '#1F6B50',
    }).catch(() => {});

    await LocalNotifications.createChannel({
      id: LAYL_GENTLE_CHANNEL_ID,
      name: 'تذكير صلاة الليل',
      description: 'تذكير ليلي هادئ بصلاة الليل والوتر',
      importance: 4,
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: '#D9B96A',
    }).catch(() => {});
  } catch (err) {
    console.warn('Failed to sync Android Adhan notification channels:', err);
  }
}

export function build14DayAdhanAlarmPlan(now: Date = new Date()): {
  alarms: NativeAdhanAlarmItem[];
  settings: AdhanSettings;
} {
  const settings = loadAdhanSettings();
  const loc = loadPrayerLocationPreference();
  const nowMs = now.getTime();
  const alarms: NativeAdhanAlarmItem[] = [];
  let seqId = ADHAN_LOCAL_NOTIF_BASE_ID;

  for (let dOffset = 0; dOffset < SCHEDULE_DAYS_AHEAD; dOffset++) {
    const dayDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + dOffset,
      12,
      0,
      0,
      0
    );
    const dayPrayers = computeLocalAdhanPrayerTimes(
      loc.lat,
      loc.lng,
      loc.cityLabel,
      dayDate,
      settings
    );

    for (const pKey of PRAYER_ALERT_KEYS) {
      const cfg = settings.prayers[pKey];
      if (!cfg.enabled) continue;

      const prayerDate = dayPrayers.dateObjects[pKey];
      const prayerTimeMs = prayerDate.getTime();
      const prayerLabel = PRAYER_LABELS_AR[pKey];
      const formattedTime = formatHHMMArabic12h(dayPrayers.timings[pKey]);
      const muezzin = getMuezzinByRawName(cfg.muezzinRawName);

      // 1) تنبيه قبل الصلاة
      if (cfg.preReminderMinutes > 0) {
        const preMs = prayerTimeMs - cfg.preReminderMinutes * 60 * 1000;
        if (preMs > nowMs + 10_000) {
          alarms.push({
            id: seqId++,
            triggerAtMs: preMs,
            title: `اقترب موعد صلاة ${prayerLabel}`,
            body: `يتبقى ${toArabicNums(cfg.preReminderMinutes)} دقيقة على أذان ${prayerLabel} (${formattedTime}) · ${loc.cityLabel}`,
            prayerKey: `pre_${pKey}`,
            mode: 'silent',
            rawName: '',
            channelId: SILENT_CHANNEL_ID,
            allowNotificationsDuringAdhan: settings.allowNotificationsDuringAdhan,
          });
        }
      }

      // 2) أذان / إشعار دخول وقت الصلاة
      if (prayerTimeMs > nowMs + 10_000) {
        const isSilent = cfg.alertMode === 'silent';
        alarms.push({
          id: seqId++,
          triggerAtMs: prayerTimeMs,
          title: `حان الآن موعد صلاة ${prayerLabel}`,
          body: isSilent
            ? `${loc.cityLabel} · الوقت: ${formattedTime} (إشعار صامت)`
            : `${loc.cityLabel} · ${formattedTime} · بصوت ${muezzin.displayName}`,
          prayerKey: pKey,
          mode: isSilent ? 'silent' : 'adhan',
          rawName: isSilent ? '' : muezzin.rawName,
          channelId: isSilent
            ? SILENT_CHANNEL_ID
            : getAdhanChannelIdForMuezzin(muezzin.rawName),
          allowNotificationsDuringAdhan: settings.allowNotificationsDuringAdhan,
        });
      }
    }

    // 3) تذكير صلاة الليل (ضمن النطاق 22:00 - 00:00)
    if (settings.salatAlLayl.enabled) {
      const clampedTime = clampSalatAlLaylTime(settings.salatAlLayl.timeHHMM);
      const [lh, lm] = clampedTime.split(':').map(Number);
      const targetDayOffset = lh === 0 ? dOffset + 1 : dOffset;
      const laylDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + targetDayOffset,
        lh,
        lm || 0,
        0,
        0
      );

      if (laylDate.getTime() > nowMs + 10_000) {
        const soundType = settings.salatAlLayl.soundType;
        const laylMuezzin = getMuezzinByRawName(
          settings.salatAlLayl.muezzinRawName
        );
        const channelId =
          soundType === 'adhan'
            ? getAdhanChannelIdForMuezzin(laylMuezzin.rawName)
            : soundType === 'gentle'
            ? LAYL_GENTLE_CHANNEL_ID
            : SILENT_CHANNEL_ID;

        alarms.push({
          id: seqId++,
          triggerAtMs: laylDate.getTime(),
          title: 'تذكير صلاة الليل المباركة',
          body: `قم للتهجد ومناجاة الله تعالى · الوقت: ${formatHHMMArabic12h(
            clampedTime
          )}`,
          prayerKey: 'salat_allayl',
          mode: soundType,
          rawName: soundType === 'adhan' ? laylMuezzin.rawName : '',
          channelId,
          allowNotificationsDuringAdhan: settings.allowNotificationsDuringAdhan,
        });
      }
    }
  }

  return { alarms, settings };
}

/**
 * يجدول أذان الأيام الـ 14 القادمة وتنبيهات قبل الصلاة وصلاة الليل دفعة واحدة.
 */
export async function syncAdhanAndPrayerAlarms(): Promise<AdhanScheduleMeta> {
  const { alarms, settings } = build14DayAdhanAlarmPlan();
  const expectedRawNames = MUEZZIN_ENTRIES.map((m) => m.rawName);
  const nowTs = Date.now();

  if (!Capacitor.isNativePlatform()) {
    const meta: AdhanScheduleMeta = {
      lastScheduledAt: nowTs,
      scheduledCount: alarms.length,
      missingRawFiles: [],
      engine: 'web',
    };
    saveAdhanScheduleMeta(meta);
    return meta;
  }

  await syncAndroidAdhanNotificationChannels(settings);

  // إلغاء إشعارات الأذان السابقة المجدولة عبر LocalNotifications لمنع التكرار
  try {
    const pending = await LocalNotifications.getPending();
    const adhanIds = pending.notifications
      .map((n) => n.id)
      .filter(
        (id) =>
          id >= ADHAN_LOCAL_NOTIF_BASE_ID && id <= ADHAN_LOCAL_NOTIF_MAX_ID
      );
    if (adhanIds.length > 0) {
      await LocalNotifications.cancel({
        notifications: adhanIds.map((id) => ({ id })),
      });
    }
  } catch {
    // Ignore cleanup errors
  }

  // المحرك الأساسي الموصى به على أندرويد: AlarmManager + BroadcastReceiver + ForegroundService (MediaPlayer)
  if (isCustomAdhanPluginAvailable()) {
    try {
      const res = await AdhanSchedulerPlugin.scheduleAlarms({
        alarms,
        expectedRawNames,
        allowNotificationsDuringAdhan: settings.allowNotificationsDuringAdhan,
      });

      const meta: AdhanScheduleMeta = {
        lastScheduledAt: nowTs,
        scheduledCount: res.scheduledCount,
        missingRawFiles: Array.isArray(res.missingRawFiles)
          ? res.missingRawFiles
          : [],
        engine: 'native-foreground',
      };
      saveAdhanScheduleMeta(meta);
      return meta;
    } catch (err) {
      console.warn('Native AdhanScheduler failed, falling back to LocalNotifications:', err);
    }
  }

  // البديل التلقائي عبر @capacitor/local-notifications (تعمل لكل الـ 14 يوماً كذلك)
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'granted' && alarms.length > 0) {
      const schemas: LocalNotificationSchema[] = alarms
        .slice(0, 220)
        .map((alarm) => ({
          id: alarm.id,
          title: alarm.title,
          body: alarm.body,
          channelId:
            Capacitor.getPlatform() === 'android' ? alarm.channelId : undefined,
          sound:
            alarm.mode === 'adhan' && alarm.rawName ? alarm.rawName : undefined,
          autoCancel: true,
          foreground: true,
          isExactNotification: true,
          schedule: {
            at: new Date(alarm.triggerAtMs),
            allowWhileIdle: true,
          },
          extra: {
            prayerKey: alarm.prayerKey,
            mode: alarm.mode,
            rawName: alarm.rawName,
          },
        }));

      await LocalNotifications.schedule({ notifications: schemas });

      const meta: AdhanScheduleMeta = {
        lastScheduledAt: nowTs,
        scheduledCount: schemas.length,
        missingRawFiles: [],
        engine: 'local-notifications',
      };
      saveAdhanScheduleMeta(meta);
      return meta;
    }
  } catch (err) {
    console.warn('LocalNotifications fallback scheduling failed:', err);
  }

  const fallbackMeta: AdhanScheduleMeta = {
    lastScheduledAt: nowTs,
    scheduledCount: 0,
    missingRawFiles: [],
    engine: 'local-notifications',
  };
  saveAdhanScheduleMeta(fallbackMeta);
  return fallbackMeta;
}

export async function triggerPrayerAdhanTestNow(options: {
  prayerKey?: PrayerAlertKey | 'salat_allayl';
  rawName?: string;
  mode?: 'adhan' | 'gentle' | 'silent';
  title?: string;
  body?: string;
}): Promise<{ ok: boolean; usedFallbackSound: boolean }> {
  const settings = loadAdhanSettings();
  const loc = loadPrayerLocationPreference();
  const pKey = options.prayerKey;

  let mode: 'adhan' | 'gentle' | 'silent' = options.mode || 'adhan';
  let rawName = options.rawName || settings.prayers.fajr.muezzinRawName;

  if (pKey && pKey !== 'salat_allayl') {
    const cfg = settings.prayers[pKey];
    mode = options.mode || cfg.alertMode;
    rawName = options.rawName || cfg.muezzinRawName;
  } else if (pKey === 'salat_allayl') {
    mode = options.mode || settings.salatAlLayl.soundType;
    rawName = options.rawName || settings.salatAlLayl.muezzinRawName;
  }

  const muezzin = getMuezzinByRawName(rawName);
  const title =
    options.title ||
    (pKey === 'salat_allayl'
      ? 'تجربة تذكير صلاة الليل'
      : pKey
      ? `تجربة أذان صلاة ${PRAYER_LABELS_AR[pKey]}`
      : `تجربة الأذان · ${muezzin.displayName}`);
  const body =
    options.body ||
    (mode === 'silent'
      ? `${loc.cityLabel} · إشعار صامت للتأكد من وصول التنبيه`
      : mode === 'gentle'
      ? `${loc.cityLabel} · نغمة هادئة لتذكير صلاة الليل`
      : `${loc.cityLabel} · بصوت ${muezzin.displayName} (اضغط لإيقاف الأذان)`);

  if (isCustomAdhanPluginAvailable()) {
    try {
      const res = await AdhanSchedulerPlugin.playTestAdhan({
        title,
        body,
        rawName: muezzin.rawName,
        mode,
        channelId:
          mode === 'adhan'
            ? getAdhanChannelIdForMuezzin(muezzin.rawName)
            : mode === 'gentle'
            ? LAYL_GENTLE_CHANNEL_ID
            : SILENT_CHANNEL_ID,
        allowNotificationsDuringAdhan: settings.allowNotificationsDuringAdhan,
      });
      if (mode !== 'silent') {
        syncNativeAdhanStateFromPlugin(true, title, muezzin.rawName);
      }
      return { ok: res.started, usedFallbackSound: res.usedFallbackSound };
    } catch {
      // Fall through to WebView audio + local notification
    }
  }

  // Fallback on Web or if native service plugin is unavailable
  if (mode === 'adhan') {
    await playLocalMuezzinPreview(muezzin.rawName, title);
  } else if (mode === 'gentle') {
    playGentleReminderChime();
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display === 'granted') {
        await syncAndroidAdhanNotificationChannels(settings);
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 5998,
              title,
              body,
              channelId:
                mode === 'adhan'
                  ? getAdhanChannelIdForMuezzin(muezzin.rawName)
                  : mode === 'gentle'
                  ? LAYL_GENTLE_CHANNEL_ID
                  : SILENT_CHANNEL_ID,
              autoCancel: true,
              foreground: true,
            },
          ],
        });
      }
    } catch {
      // Ignore notification test error
    }
  } else if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    try {
      const n = new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        dir: 'rtl',
        lang: 'ar',
      });
      n.onclick = () => {
        void stopAnyAdhanPlayback();
        n.close();
      };
    } catch {
      // Ignore browser Notification restriction
    }
  }

  return { ok: true, usedFallbackSound: false };
}

export async function getCombinedAdhanDiagnostics(): Promise<CombinedAdhanDiagnostics> {
  const meta = loadAdhanScheduleMeta();
  const loc = loadPrayerLocationPreference();
  const isNativeAndroid =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  if (!isNativeAndroid) {
    const webPerm =
      typeof window !== 'undefined' && 'Notification' in window
        ? Notification.permission === 'granted'
        : false;
    return {
      isNativeAndroid: false,
      nativePluginAvailable: false,
      notificationsGranted: webPerm,
      exactAlarmsGranted: false,
      batteryOptimizationIgnored: false,
      dndPolicyAccessGranted: false,
      locationMode: loc.mode,
      locationLabel: loc.cityLabel,
      lastScheduledAt: meta.lastScheduledAt,
      scheduledCount: meta.scheduledCount,
      engine: 'web',
      missingRawFiles: [],
      androidSdkInt: 0,
    };
  }

  if (isCustomAdhanPluginAvailable()) {
    try {
      const nativeDiag: AdhanDiagnosticsResult =
        await AdhanSchedulerPlugin.getDiagnostics({
          expectedRawNames: MUEZZIN_ENTRIES.map((m) => m.rawName),
        });
      return {
        isNativeAndroid: true,
        nativePluginAvailable: true,
        notificationsGranted: nativeDiag.notificationsGranted,
        exactAlarmsGranted: nativeDiag.exactAlarmsGranted,
        batteryOptimizationIgnored: nativeDiag.batteryOptimizationIgnored,
        dndPolicyAccessGranted: Boolean(nativeDiag.dndPolicyAccessGranted),
        locationMode: loc.mode,
        locationLabel: loc.cityLabel,
        lastScheduledAt:
          nativeDiag.lastScheduledAt > 0
            ? nativeDiag.lastScheduledAt
            : meta.lastScheduledAt,
        scheduledCount:
          nativeDiag.scheduledCount > 0
            ? nativeDiag.scheduledCount
            : meta.scheduledCount,
        engine: 'native-foreground',
        missingRawFiles: nativeDiag.missingRawFiles || [],
        androidSdkInt: nativeDiag.androidSdkInt || 0,
      };
    } catch {
      // Fallback below
    }
  }

  let notifGranted = false;
  try {
    const p = await LocalNotifications.checkPermissions();
    notifGranted = p.display === 'granted';
  } catch {
    notifGranted = false;
  }

  return {
    isNativeAndroid: true,
    nativePluginAvailable: false,
    notificationsGranted: notifGranted,
    exactAlarmsGranted: true,
    batteryOptimizationIgnored: false,
    dndPolicyAccessGranted: false,
    locationMode: loc.mode,
    locationLabel: loc.cityLabel,
    lastScheduledAt: meta.lastScheduledAt,
    scheduledCount: meta.scheduledCount,
    engine: meta.engine,
    missingRawFiles: meta.missingRawFiles,
    androidSdkInt: 0,
  };
}
