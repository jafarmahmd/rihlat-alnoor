import React, { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  BatteryCharging,
  BellRing,
  CheckCircle2,
  LocateFixed,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  AdhanSchedulerPlugin,
  isCustomAdhanPluginAvailable,
} from '../plugins/adhanNativePlugin';
import {
  getComprehensiveLocationDiagnostics,
  detectAndSaveGpsLocation,
} from '../utils/gpsLocation';
import {
  requestNativeNotificationPermissionOnce,
  getNotificationPermissionAsync,
} from '../utils/notificationManager';
import { CornerOrnaments } from './IslamicOrnaments';

const PERMISSIONS_WIZARD_SEEN_KEY = 'rihlat_alnoor_permissions_wizard_v1';

interface AndroidPermissionsWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  forceShow?: boolean;
}

export function hasSeenPermissionsWizard(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(PERMISSIONS_WIZARD_SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

export function markPermissionsWizardSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PERMISSIONS_WIZARD_SEEN_KEY, '1');
  } catch {
    // Ignore quota errors
  }
}

export const AndroidPermissionsWizardModal: React.FC<
  AndroidPermissionsWizardModalProps
> = ({ isOpen, onClose, forceShow }) => {
  const [notifGranted, setNotifGranted] = useState<boolean>(true);
  const [gpsGranted, setGpsGranted] = useState<boolean>(true);
  const [batteryExempt, setBatteryExempt] = useState<boolean>(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const checkAllStatuses = useCallback(async () => {
    const isAndroid =
      Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
    if (!isAndroid) {
      setNotifGranted(true);
      setGpsGranted(true);
      setBatteryExempt(true);
      return;
    }

    try {
      const notifStatus = await getNotificationPermissionAsync();
      setNotifGranted(notifStatus === 'granted');

      const locDiag = await getComprehensiveLocationDiagnostics();
      setGpsGranted(locDiag.permissionGranted);

      if (isCustomAdhanPluginAvailable()) {
        const diag = await AdhanSchedulerPlugin.getDiagnostics({
          expectedRawNames: [],
        });
        setBatteryExempt(Boolean(diag.batteryOptimizationIgnored));
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void checkAllStatuses();
    }
  }, [isOpen, checkAllStatuses]);

  if (!isOpen) return null;

  const handleClose = () => {
    markPermissionsWizardSeen();
    onClose();
  };

  const handleRequestNotifications = async () => {
    setLoadingAction('notif');
    try {
      await requestNativeNotificationPermissionOnce();
    } catch {
      // Ignore
    }
    await checkAllStatuses();
    setLoadingAction(null);
  };

  const handleRequestGps = async () => {
    setLoadingAction('gps');
    try {
      await detectAndSaveGpsLocation();
    } catch {
      // Ignore
    }
    await checkAllStatuses();
    setLoadingAction(null);
  };

  const handleRequestBattery = async () => {
    setLoadingAction('battery');
    try {
      if (isCustomAdhanPluginAvailable()) {
        await AdhanSchedulerPlugin.requestBatteryOptimizationExemption();
      }
    } catch {
      // Ignore
    }
    window.setTimeout(() => {
      void checkAllStatuses();
      setLoadingAction(null);
    }, 1500);
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#081A14]/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="إعدادات الأذان والصلاحيات الأساسية"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto manuscript-folio rounded-[6px] p-6 sm:p-7 space-y-5 shadow-2xl text-[#11271F]"
      >
        <CornerOrnaments />

        <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#B8924A]/35">
          <div>
            <h3 className="font-calligraphy font-bold text-xl sm:text-2xl text-[#0F3D2E]">
              إعدادات الصلاحيات والتشغيل الخلفي
            </h3>
            <p className="text-xs text-[#425B51] mt-0.5">
              فعّل هذه الخيارات بضغطة واحدة من نظام الأندرويد مباشرة لضمان وصول الأذان كاملاً
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="إغلاق"
            className="w-8 h-8 rounded-[6px] border border-[#B8924A]/40 text-[#425B51] hover:bg-[#F3ECDA] flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3">
          {/* 1. Notifications */}
          <div className="rounded-[5px] bg-[#FAF6EC] border border-[#B8924A]/40 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <BellRing
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  notifGranted ? 'text-[#1F6B50]' : 'text-[#B8924A]'
                }`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <h4 className="font-display font-bold text-sm text-[#0F3D2E]">
                  ١. السماح بالإشعارات
                </h4>
                <p className="text-[11px] text-[#425B51] leading-snug">
                  لتنبيهات مواقيت الصلاة والمستحبات وأذان الخلفية.
                </p>
              </div>
            </div>

            {notifGranted ? (
              <span className="text-xs font-bold text-[#1F6B50] inline-flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>مفعّل</span>
              </span>
            ) : (
              <button
                type="button"
                disabled={loadingAction === 'notif'}
                onClick={() => void handleRequestNotifications()}
                className="min-h-[38px] px-3.5 btn-emerald text-xs font-bold shrink-0 cursor-pointer disabled:opacity-60"
              >
                {loadingAction === 'notif' ? 'جارٍ الطلب...' : 'السماح'}
              </button>
            )}
          </div>

          {/* 2. GPS Location */}
          <div className="rounded-[5px] bg-[#FAF6EC] border border-[#B8924A]/40 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <LocateFixed
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  gpsGranted ? 'text-[#1F6B50]' : 'text-[#B8924A]'
                }`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <h4 className="font-display font-bold text-sm text-[#0F3D2E]">
                  ٢. السماح بنظام الجي بي إس (GPS)
                </h4>
                <p className="text-[11px] text-[#425B51] leading-snug">
                  لتحديد محافظتك ومدينتك وحساب مواقيت الصلاة واتجاه القبلة بدقة.
                </p>
              </div>
            </div>

            {gpsGranted ? (
              <span className="text-xs font-bold text-[#1F6B50] inline-flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>مفعّل</span>
              </span>
            ) : (
              <button
                type="button"
                disabled={loadingAction === 'gps'}
                onClick={() => void handleRequestGps()}
                className="min-h-[38px] px-3.5 btn-emerald text-xs font-bold shrink-0 cursor-pointer disabled:opacity-60"
              >
                {loadingAction === 'gps' ? 'جارٍ التحديد...' : 'السماح'}
              </button>
            )}
          </div>

          {/* 3. Battery Exemption & Background Execution */}
          <div className="rounded-[5px] bg-[#FAF6EC] border border-[#B8924A]/40 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <BatteryCharging
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  batteryExempt ? 'text-[#1F6B50]' : 'text-[#B8924A]'
                }`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <h4 className="font-display font-bold text-sm text-[#0F3D2E]">
                  ٣. التشغيل في الخلفية (استثناء البطارية)
                </h4>
                <p className="text-[11px] text-[#425B51] leading-snug">
                  لمنع نظام الهاتف (مثل HiOS و Xiaomi) من كتم الأذان عند إغلاق التطبيق.
                </p>
              </div>
            </div>

            {batteryExempt ? (
              <span className="text-xs font-bold text-[#1F6B50] inline-flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>مستثنى</span>
              </span>
            ) : (
              <button
                type="button"
                disabled={loadingAction === 'battery'}
                onClick={() => void handleRequestBattery()}
                className="min-h-[38px] px-3.5 btn-emerald text-xs font-bold shrink-0 cursor-pointer disabled:opacity-60"
              >
                {loadingAction === 'battery' ? 'جارٍ الطلب...' : 'تفعيل'}
              </button>
            )}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="w-full min-h-[44px] btn-manuscript text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>إتمام ومتابعة إلى التطبيق</span>
          </button>
        </div>
      </div>
    </div>
  );
};
