import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { APP_CACHE_PREFIX, APP_VERSION } from '../config/appVersion';

export const GITHUB_REPO_OWNER = 'jafarmahmd';
export const GITHUB_REPO_NAME = 'rihlat-alnoor';
export const GITHUB_VERSION_JSON_URL = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/main/public/version.json`;
export const GITHUB_RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`;
export const GITHUB_RELEASES_PAGE = `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`;

const INSTALLED_VERSION_KEY = 'rihlat_alnoor_installed_version_v1';
const ACKNOWLEDGED_UPDATE_KEY = 'rihlat_alnoor_acknowledged_update_v1';
const DISMISSED_UPDATE_KEY = 'rihlat_alnoor_dismissed_update_v1';
const SHOWN_VERSIONS_KEY = 'rihlat_alnoor_shown_update_versions_v1';
const LAST_CHECK_KEY = 'rihlat_alnoor_last_update_check_v1';
const NOTIFIED_UPDATE_KEY = 'rihlat_alnoor_notified_update_v1';
const SESSION_RELOADED_VERSION_KEY = 'rihlat_alnoor_reloaded_version_v1';

const UPDATE_NOTIFICATION_ID = 9801;
const CHECK_THROTTLE_MS = 10 * 60 * 1000;

export interface SemVerTuple {
  major: number;
  minor: number;
  patch: number;
}

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
  isNativeApk: boolean;
}

export interface UpdateCheckResult {
  status: 'update-available' | 'up-to-date' | 'no-release' | 'offline' | 'error';
  currentVersion: string;
  update?: AppUpdateInfo;
  message: string;
}

/**
 * يعيد رقم الإصدار الحالي من المصدر الواحد الثابت (APP_VERSION) فقط.
 */
export function getCurrentAppVersion(): string {
  return APP_VERSION.trim().replace(/^v/i, '');
}

export function isAndroidNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function normalizeVersionString(versionStr: string): string {
  const { major, minor, patch } = parseSemver(versionStr);
  return `${major}.${minor}.${patch}`;
}

/**
 * تحليل صارم لرقم الإصدار بصيغة (major.minor.patch) كأرقام صحيحة.
 */
export function parseSemver(versionStr: string): SemVerTuple {
  const cleaned = String(versionStr || '')
    .trim()
    .replace(/^v/i, '')
    .split('-')[0]
    .split('+')[0];

  const parts = cleaned.split('.').map((part) => {
    const digits = part.replace(/[^\d]/g, '');
    const n = digits ? Number.parseInt(digits, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  });

  return {
    major: parts[0] ?? 0,
    minor: parts[1] ?? 0,
    patch: parts[2] ?? 0,
  };
}

/**
 * مقارنة رقمية صحيحة (major.minor.patch):
 * تعيد 1 إذا كان a أكبر من b، و -1 إذا كان أصغر، و 0 إذا تساويا.
 * مثال: compareVersions("1.10.0", "1.9.0") === 1
 */
export function compareVersions(a: string, b: string): number {
  const va = parseSemver(a);
  const vb = parseSemver(b);
  if (va.major !== vb.major) return va.major > vb.major ? 1 : -1;
  if (va.minor !== vb.minor) return va.minor > vb.minor ? 1 : -1;
  if (va.patch !== vb.patch) return va.patch > vb.patch ? 1 : -1;
  return 0;
}

function withCacheBuster(url: string): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}t=${Date.now()}`;
}

function loadShownVersionsMap(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SHOWN_VERSIONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function markUpdateVersionShown(version: string): void {
  if (typeof window === 'undefined') return;
  try {
    const norm = normalizeVersionString(version);
    const map = loadShownVersionsMap();
    map[norm] = (map[norm] || 0) + 1;
    window.localStorage.setItem(SHOWN_VERSIONS_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage error
  }
}

export function hasShownUpdateForVersion(version: string): boolean {
  const norm = normalizeVersionString(version);
  const map = loadShownVersionsMap();
  return (map[norm] || 0) >= 1;
}

export function getAcknowledgedVersion(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = window.localStorage.getItem(ACKNOWLEDGED_UPDATE_KEY);
    return val ? normalizeVersionString(val) : null;
  } catch {
    return null;
  }
}

export function saveAcknowledgedVersion(version: string): void {
  if (typeof window === 'undefined') return;
  try {
    const norm = normalizeVersionString(version);
    window.localStorage.setItem(ACKNOWLEDGED_UPDATE_KEY, norm);
    window.localStorage.setItem(DISMISSED_UPDATE_KEY, `v${norm}`);
    markUpdateVersionShown(norm);
  } catch {
    // Ignore storage error
  }
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
    const norm = normalizeVersionString(tagName);
    window.localStorage.setItem(DISMISSED_UPDATE_KEY, `v${norm}`);
    markUpdateVersionShown(norm);
  } catch {
    // Ignore storage error
  }
}

/**
 * يزامن رقم الإصدار المثبت في localStorage مع APP_VERSION عند كل تشغيل،
 * ويمسح علامات التحديث المؤقتة للإصدارات السابقة فور نجاح التحديث.
 */
export function syncInstalledVersionState(): void {
  if (typeof window === 'undefined') return;
  const current = normalizeVersionString(getCurrentAppVersion());
  try {
    const previous = window.localStorage.getItem(INSTALLED_VERSION_KEY);
    if (previous !== current) {
      window.localStorage.setItem(INSTALLED_VERSION_KEY, current);

      const ack = getAcknowledgedVersion();
      if (ack && compareVersions(current, ack) >= 0) {
        window.localStorage.removeItem(ACKNOWLEDGED_UPDATE_KEY);
      }

      const dismissed = getDismissedUpdateTag();
      if (dismissed && compareVersions(current, dismissed) >= 0) {
        window.localStorage.removeItem(DISMISSED_UPDATE_KEY);
      }
    }
  } catch {
    // Ignore storage error
  }
}

export async function clearOutdatedAppCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  const currentCachePrefix = `${APP_CACHE_PREFIX}${getCurrentAppVersion()}`;
  try {
    const keys = await window.caches.keys();
    await Promise.all(
      keys.map((key) => {
        if (key === 'quran-surahs-api-cache') {
          return Promise.resolve(false);
        }
        if (key.startsWith(currentCachePrefix)) {
          return Promise.resolve(false);
        }
        return window.caches.delete(key);
      })
    );
  } catch {
    // Ignore cache clearing errors
  }
}

export async function clearAllAppCachesForUpdate(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const keys = await window.caches.keys();
    await Promise.all(
      keys.map((key) => {
        if (key === 'quran-surahs-api-cache') {
          return Promise.resolve(false);
        }
        return window.caches.delete(key);
      })
    );
  } catch {
    // Ignore cache clearing errors
  }
}

export async function activateWaitingServiceWorker(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return;
    await registration.update().catch(() => undefined);
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  } catch {
    // Ignore SW errors
  }
}

export function triggerSingleSafeReload(targetVersion: string): boolean {
  if (typeof window === 'undefined') return false;
  const norm = normalizeVersionString(targetVersion);
  try {
    const alreadyReloaded = window.sessionStorage.getItem(
      SESSION_RELOADED_VERSION_KEY
    );
    if (alreadyReloaded === norm) {
      return false;
    }
    window.sessionStorage.setItem(SESSION_RELOADED_VERSION_KEY, norm);
  } catch {
    // Continue even if sessionStorage is restricted
  }
  window.location.reload();
  return true;
}

/**
 * ينفذ خطوات التحديث عند ضغط المستخدم على زر «تحديث»:
 * 1) حفظ رقم الإصدار الجديد فوراً في localStorage
 * 2) مسح الكاش القديم وتنشيط Service Worker المنتظر
 * 3) إعادة التحميل مرة واحدة فقط (أو فتح رابط APK على الأندرويد)
 */
export async function applyAppUpdateAndReload(
  update: AppUpdateInfo
): Promise<void> {
  saveAcknowledgedVersion(update.latestVersion);
  await clearAllAppCachesForUpdate();
  await activateWaitingServiceWorker();

  if (update.isNativeApk && update.apkDownloadUrl) {
    const link = document.createElement('a');
    link.href = update.apkDownloadUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
    return;
  }

  triggerSingleSafeReload(update.latestVersion);
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

interface RemoteVersionJson {
  version?: string;
  notes?: string;
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
  assets?: GitHubReleaseAsset[];
}

async function fetchRemoteVersionInfo(isNative: boolean): Promise<{
  version: string;
  notes?: string;
} | null> {
  const targetUrl = isNative ? GITHUB_VERSION_JSON_URL : './version.json';
  const res = await fetch(withCacheBuster(targetUrl), {
    method: 'GET',
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as RemoteVersionJson;
  if (!data?.version || typeof data.version !== 'string') return null;
  return {
    version: normalizeVersionString(data.version),
    notes: typeof data.notes === 'string' ? data.notes.trim() : undefined,
  };
}

async function fetchNativeReleaseMetadata(): Promise<GitHubLatestReleaseResponse | null> {
  try {
    const res = await fetch(withCacheBuster(GITHUB_RELEASES_API), {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as GitHubLatestReleaseResponse;
    if (!data || data.draft) return null;
    return data;
  } catch {
    return null;
  }
}

export async function checkForAppUpdate(options?: {
  force?: boolean;
  respectDismissed?: boolean;
}): Promise<UpdateCheckResult> {
  const currentVersion = normalizeVersionString(getCurrentAppVersion());
  const force = Boolean(options?.force);
  const respectDismissed = options?.respectDismissed ?? !force;
  const isNative = isAndroidNativeApp();

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
      message: `تستخدم حالياً أحدث إصدار (v${currentVersion}).`,
    };
  }

  try {
    const remote = await fetchRemoteVersionInfo(isNative);
    markCheckTimestamp();

    if (!remote) {
      return {
        status: 'no-release',
        currentVersion,
        message: `أنت تستخدم الإصدار الحالي (v${currentVersion}).`,
      };
    }

    const latestVersion = remote.version;
    const isActuallyNewer = compareVersions(latestVersion, currentVersion) > 0;

    if (!isActuallyNewer) {
      return {
        status: 'up-to-date',
        currentVersion,
        message: `تطبيقك محدّث إلى آخر إصدار (v${currentVersion}).`,
      };
    }

    const tagName = `v${latestVersion}`;

    if (respectDismissed) {
      const ack = getAcknowledgedVersion();
      if (ack && compareVersions(latestVersion, ack) <= 0) {
        return {
          status: 'up-to-date',
          currentVersion,
          message: `تم تطبيق التحديث v${latestVersion} بالفعل.`,
        };
      }

      if (getDismissedUpdateTag() === tagName) {
        return {
          status: 'up-to-date',
          currentVersion,
          message: `تم تأجيل التحديث v${latestVersion} مؤقتاً.`,
        };
      }

      if (hasShownUpdateForVersion(latestVersion)) {
        return {
          status: 'up-to-date',
          currentVersion,
          message: `تم إشعارك بالإصدار v${latestVersion} مسبقاً.`,
        };
      }
    }

    let releaseTitle = `رحلة النور ${tagName}`;
    let releaseNotes =
      remote.notes ||
      'يتوفر إصدار جديد من التطبيق يتضمن تحسينات في الأداء واستقرار التجربة.';
    let apkDownloadUrl = GITHUB_RELEASES_PAGE;
    let releasePageUrl = GITHUB_RELEASES_PAGE;
    let publishedAt: string | null = null;
    let hasApkAsset = false;

    if (isNative) {
      const releaseMeta = await fetchNativeReleaseMetadata();
      if (releaseMeta) {
        const assets = Array.isArray(releaseMeta.assets)
          ? releaseMeta.assets
          : [];
        const apkAsset =
          assets.find(
            (a) =>
              typeof a.name === 'string' &&
              a.name.toLowerCase().endsWith('.apk') &&
              typeof a.browser_download_url === 'string'
          ) || null;
        if (releaseMeta.name?.trim()) releaseTitle = releaseMeta.name.trim();
        if (releaseMeta.body?.trim()) releaseNotes = releaseMeta.body.trim();
        if (releaseMeta.html_url) releasePageUrl = releaseMeta.html_url;
        if (releaseMeta.published_at) publishedAt = releaseMeta.published_at;
        if (apkAsset?.browser_download_url) {
          apkDownloadUrl = apkAsset.browser_download_url;
          hasApkAsset = true;
        }
      }
    }

    const update: AppUpdateInfo = {
      currentVersion,
      latestVersion,
      tagName,
      releaseTitle,
      releaseNotes,
      apkDownloadUrl,
      releasePageUrl,
      publishedAt,
      hasApkAsset,
      isNativeApk: isNative,
    };

    if (respectDismissed) {
      markUpdateVersionShown(latestVersion);
    }

    if (isNative) {
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
      message: 'تعذّر التحقق من التحديثات حالياً، تأكد من اتصال الإنترنت.',
    };
  }
}
