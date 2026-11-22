import { Capacitor, PluginListenerHandle, registerPlugin } from '@capacitor/core';

export interface NativeAdhanAlarmItem {
  id: number;
  triggerAtMs: number;
  title: string;
  body: string;
  prayerKey: string;
  mode: 'adhan' | 'gentle' | 'silent';
  rawName: string;
  channelId: string;
  allowNotificationsDuringAdhan?: boolean;
  playAdhanInSilentMode?: boolean;
  audioUsage?: 'alarm' | 'notification';
}

export interface AdhanDiagnosticsResult {
  nativePluginAvailable: boolean;
  notificationsGranted: boolean;
  exactAlarmsGranted: boolean;
  batteryOptimizationIgnored: boolean;
  dndPolicyAccessGranted?: boolean;
  isPlaying: boolean;
  activeLabel: string;
  scheduledCount: number;
  lastScheduledAt: number;
  missingRawFiles: string[];
  androidSdkInt: number;
}

export interface AdhanStateChangedEvent {
  isPlaying: boolean;
  title?: string;
  muezzinRawName?: string;
}

export interface AdhanSchedulerPluginInterface {
  scheduleAlarms(options: {
    alarms: NativeAdhanAlarmItem[];
    expectedRawNames: string[];
    allowNotificationsDuringAdhan?: boolean;
    playAdhanInSilentMode?: boolean;
    audioUsage?: 'alarm' | 'notification';
  }): Promise<{
    scheduledCount: number;
    exactAlarmsGranted: boolean;
    missingRawFiles: string[];
  }>;
  scheduleTestAlarm?(options: NativeAdhanAlarmItem): Promise<{
    scheduled: boolean;
    exactAlarmsGranted: boolean;
  }>;
  cancelAllAlarms(): Promise<void>;
  playTestAdhan(options: {
    title: string;
    body: string;
    rawName: string;
    mode: 'adhan' | 'gentle' | 'silent';
    channelId: string;
    allowNotificationsDuringAdhan?: boolean;
    playAdhanInSilentMode?: boolean;
    audioUsage?: 'alarm' | 'notification';
  }): Promise<{ started: boolean; usedFallbackSound: boolean }>;
  stopAdhan(): Promise<void>;
  getDiagnostics(options: {
    expectedRawNames: string[];
  }): Promise<AdhanDiagnosticsResult>;
  requestNotificationPermission(): Promise<{ granted: boolean }>;
  openExactAlarmSettings(): Promise<{ opened: boolean }>;
  requestBatteryOptimizationExemption(): Promise<{ opened: boolean }>;
  openAppNotificationSettings(): Promise<{ opened: boolean }>;
  openNotificationPolicySettings?: () => Promise<{ opened: boolean }>;
  addListener(
    eventName: 'adhanStateChanged',
    listenerFunc: (event: AdhanStateChangedEvent) => void
  ): Promise<PluginListenerHandle>;
}

export const AdhanSchedulerPlugin =
  registerPlugin<AdhanSchedulerPluginInterface>('AdhanScheduler');

export function isCustomAdhanPluginAvailable(): boolean {
  try {
    return (
      Capacitor.isNativePlatform() &&
      Capacitor.getPlatform() === 'android' &&
      Capacitor.isPluginAvailable('AdhanScheduler')
    );
  } catch {
    return false;
  }
}
