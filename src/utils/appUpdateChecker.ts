import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export const GITHUB_REPO_OWNER = 'jafarmahmd';
export const GITHUB_REPO_NAME = 'rihlat-alnoor';
export const GITHUB_RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`;
export const GITHUB_RELEASES_PAGE = `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`;

const DISMISSED_UPDATE_KEY = 'rihlat_alnoor_dismissed_update_v1';
const LAST_CHECK_KEY = 'rihlat_alnoor_last_update_check_v1';
const NOTIFIED_UPDATE_KEY = 'rihlat_alnoor_notified_update_v1';
const UPDATE_NOTIFICATION_ID = 9801;
const CHECK_THROTTLE_MS = 10 * 60 * 1000;

export interface AppUpdateInfo {
  currentVersion: string;
  latestVersion: string;
  tagName: string;
  releaseTitle: string;
  releaseNotes: string;
  apkDownloadUrl: string;
  releasePageUrl: string;
  publishedAt: string | null;
  hasApkAsset: boolean;
}

export interface UpdateCheckResult {
  status: 'update-available' | 'up-to-date' | 'no-release' | 'offline' | 'error';
  currentVersion: string;
  update?: AppUpdateInfo;
  message: string;
}

export function getCurrentAppVersion(): string {
  const raw =
    (import.meta.env.VITE_APP_VERSION as string | undefined)?.trim() || '1.0.0';
  return raw.replace(/^v/i, '');
}

export function getCurrentBuildNumber(): number {
  const raw = Number(
    (import.meta.env.VITE_APP_BUILD as string | undefined) || '0'
  );
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
}

export function isAndroidNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function parseVersionParts(versionStr: string): number[] {
  const cleaned = versionStr
    .trim()
    .replace(/^v/i, '')
    .split('-')[0];
  return cleaned
    .split('.')
    .map((part) => {
      const n = Number(part.replace(/[^\d]/g, ''));
      return Number.isFinite(n) ? n : 0;
    });
}

export function compareVersions(a: string, b: string): number {
  const pa = parseVersionParts(a);
  const pb = parseVersionParts(b);
  const maxLen = Math.max(pa.length, pb.length, 3);
  for (let i = 0; i < maxLen; i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

export function getDismissedUpdateTag(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(DISMISSED_UPDATE_KEY);
  } catch {
    return null;
  }
}

export function dismissUpdateTag(tagName: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DISMISSED_UPDATE_KEY, tagName);
  } catch {
    // Ignore storage error
  }
}

function shouldRunAutoCheck(force: boolean): boolean {
  if (force || typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(LAST_CHECK_KEY);
    if (!raw) return true;
    const last = Number(raw);
    if (!Number.isFinite(last)) return true;
    return Date.now() - last >= CHECK_THROTTLE_MS;
  } catch {
    return true;
  }
}

function markCheckTimestamp(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
  } catch {
    // Ignore storage error
  }
}

async function notifyNativeUpdateOnce(update: AppUpdateInfo): Promise<void> {
  if (!isAndroidNativeApp() || typeof window === 'undefined') return;
  try {
    const alreadyNotified = window.localStorage.getItem(NOTIFIED_UPDATE_KEY);
    if (alreadyNotified === update.tagName) return;

    const perms = await LocalNotifications.checkPermissions();
    if (perms.display !== 'granted') return;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: UPDATE_NOTIFICATION_ID,
          title: `تحديث جديد متوفر: رحلة النور v${update.latestVersion}`,
          body: 'اضغط لفتح التطبيق وتنزيل النسخة المحدّثة مباشرة.',
          autoCancel: true,
          foreground: true,
          isExactNotification: false,
          channelId:
            Capacitor.getPlatform() === 'android'
              ? 'spiritual_daily_reminders'
              : undefined,
        },
      ],
    });
    window.localStorage.setItem(NOTIFIED_UPDATE_KEY, update.tagName);
  } catch {
    // Do not block UI if local notification scheduling fails
  }
}

interface GitHubReleaseAsset {
  name?: string;
  browser_download_url?: string;
}

interface GitHubLatestReleaseResponse {
  tag_name?: string;
  name?: string;
  body?: string;
  html_url?: string;
  published_at?: string;
  draft?: boolean;
  prerelease?: boolean;
  assets?: GitHubReleaseAsset[];
}

export async function checkForAppUpdate(options?: {
  force?: boolean;
  respectDismissed?: boolean;
}): Promise<UpdateCheckResult> {
  const currentVersion = getCurrentAppVersion();
  const force = Boolean(options?.force);
  const respectDismissed = options?.respectDismissed ?? !force;

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      status: 'offline',
      currentVersion,
      message: 'لا يوجد اتصال بالإنترنت حالياً لفحص التحديثات.',
    };
  }

  if (!shouldRunAutoCheck(force)) {
    return {
      status: 'up-to-date',
      currentVersion,
      message: `تستخدم حالياً الإصدار v${currentVersion}.`,
    };
  }

  try {
    const res = await fetch(GITHUB_RELEASES_API, {
      method: 'GET',
      cache: 'no-store',
    });

    markCheckTimestamp();

    if (res.status === 404) {
      return {
        status: 'no-release',
        currentVersion,
        message: 'لم يتم نشر إصدار موقّع (Release) على GitHub بعد.',
      };
    }

    if (!res.ok) {
      return {
        status: 'error',
        currentVersion,
        message: 'تعذّر التحقق من التحديثات حالياً، حاول لاحقاً.',
      };
    }

    const data = (await res.json()) as GitHubLatestReleaseResponse;
    if (!data?.tag_name || data.draft) {
      return {
        status: 'no-release',
        currentVersion,
        message: 'لا توجد إصدارات منشورة حالياً.',
      };
    }

    const latestVersion = data.tag_name.replace(/^v/i, '').trim();
    const isNewer = compareVersions(latestVersion, currentVersion) > 0;

    if (!isNewer) {
      return {
        status: 'up-to-date',
        currentVersion,
        message: `تطبيقك محدّث إلى آخر إصدار (v${currentVersion}).`,
      };
    }

    if (respectDismissed && getDismissedUpdateTag() === data.tag_name) {
      return {
        status: 'up-to-date',
        currentVersion,
        message: `تم تأجيل التحديث v${latestVersion} مؤقتاً.`,
      };
    }

    const assets = Array.isArray(data.assets) ? data.assets : [];
    const apkAsset =
      assets.find(
        (a) =>
          typeof a.name === 'string' &&
          a.name.toLowerCase().endsWith('.apk') &&
          typeof a.browser_download_url === 'string'
      ) || null;

    const update: AppUpdateInfo = {
      currentVersion,
      latestVersion,
      tagName: data.tag_name,
      releaseTitle: data.name?.trim() || `رحلة النور ${data.tag_name}`,
      releaseNotes:
        data.body?.trim() ||
        'يتضمن هذا التحديث تحسينات جديدة ومزايا إضافية لتجربة أكثر سلاسة وجمالاً.',
      apkDownloadUrl:
        apkAsset?.browser_download_url || data.html_url || GITHUB_RELEASES_PAGE,
      releasePageUrl: data.html_url || GITHUB_RELEASES_PAGE,
      publishedAt: data.published_at || null,
      hasApkAsset: Boolean(apkAsset?.browser_download_url),
    };

    if (isAndroidNativeApp()) {
      void notifyNativeUpdateOnce(update);
    }

    return {
      status: 'update-available',
      currentVersion,
      update,
      message: `يتوفر تحديث جديد: الإصدار v${latestVersion}`,
    };
  } catch {
    return {
      status: 'error',
      currentVersion,
      message: 'تعذّر الاتصال بخادم التحديثات، تأكد من اتصال الإنترنت.',
    };
  }
}
