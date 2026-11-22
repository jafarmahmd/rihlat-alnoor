import React, { useState, useEffect } from 'react';
import { Bell, MapPin, BatteryCharging, CheckCircle, ExternalLink, Sparkles, X } from 'lucide-react';
import { requestNativeNotificationPermissionOnce } from '../utils/notificationManager';
import {
  detectAndSaveGpsLocation,
  openAppLocationPermissionSettings,
  openDeviceAutostartSettings,
} from '../utils/gpsLocation';

interface PermissionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const FIRST_OPEN_PERMS_KEY = 'rihlat_alnoor_first_open_perms_seen_v1';

export function hasSeenPermissionManager(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(FIRST_OPEN_PERMS_KEY) === '1';
  } catch {
    return true;
  }
}

export function markPermissionManagerSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FIRST_OPEN_PERMS_KEY, '1');
  } catch {
    // Ignore storage errors
  }
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const [notifGranted, setNotifGranted] = useState(false);
  const [gpsGranted, setGpsGranted] = useState(false);
  const [batteryGranted, setBatteryGranted] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotifGranted(true);
      }
    }
  }, []);

  if (!isOpen) return null;

  const handleRequestNotifications = async () => {
    setLoadingStep('notif');
    try {
      const granted = await requestNativeNotificationPermissionOnce();
      setNotifGranted(granted);
    } catch {
      // Ignore
    } finally {
      setLoadingStep(null);
    }
  };

  const handleRequestGps = async () => {
    setLoadingStep('gps');
    try {
      const res = await detectAndSaveGpsLocation();
      setGpsGranted(res.ok);
    } catch {
      // Ignore
    } finally {
      setLoadingStep(null);
    }
  };

  const handleOpenBatterySettings = async () => {
    setLoadingStep('battery');
    try {
      await openDeviceAutostartSettings();
      setBatteryGranted(true);
    } catch {
      // Ignore
    } finally {
      setLoadingStep(null);
    }
  };

  const handleFinish = () => {
    markPermissionManagerSeen();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#081A14]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="perm-manager-title"
    >
      <div
        style={{ borderRadius: 'var(--radius-card)' }}
        className="w-full max-w-lg manuscript-folio p-5 sm:p-6 shadow-2xl relative border border-[#D9B96A]/60 animate-in fade-in zoom-in-95 duration-300 my-auto"
      >
        <button
          type="button"
          onClick={handleFinish}
          aria-label="تخطي"
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-[#F3ECDA] hover:bg-[#E7D8B0] border border-[#B8924A]/45 text-[#0F3D2E] flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="text-center mb-6 pt-2">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#0F3D2E] border border-[#D9B96A] text-[#D9B96A] flex items-center justify-center shadow-lg">
            <Sparkles className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2
            id="perm-manager-title"
            className="font-calligraphy font-bold text-2xl sm:text-3xl text-[#0F3D2E]"
          >
            أهلاً بك في رحلة النور
          </h2>
          <p className="text-xs sm:text-sm text-[#425B51] mt-1.5 leading-relaxed">
            لضمان عمل أوقات الصلاة، الأذان التلقائي، وتحديد القبلة بدقة دون انقطاع، يرجى تفعيل الأذونات الضرورية أدناه بخطوات سهلة:
          </p>
        </div>

        <div className="space-y-3.5 mb-6">
          {/* 1) Notifications Permission */}
          <div className="p-3.5 sm:p-4 rounded-[10px] bg-[#FAF6EC] border border-[#B8924A]/40 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#F3ECDA] border border-[#B8924A]/50 text-[#0F3D2E] flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-[#B8924A]" aria-hidden="true" />
              </div>
              <div className="min-w-0 text-right">
                <h3 className="font-display font-bold text-xs sm:text-sm text-[#0F3D2E]">
                  الإشعارات والتنبيهات
                </h3>
                <p className="text-[11px] text-[#425B51] truncate">
                  {notifGranted ? 'مفعّلة بنجاح' : 'لتنبيهك بأوقات الصلاة والأدعية'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {notifGranted ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] bg-[#1F6B50]/15 text-[#1F6B50] font-bold text-xs">
                  <CheckCircle className="w-4 h-4" />
                  <span>مفعل</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestNotifications}
                  disabled={loadingStep === 'notif'}
                  className="btn-emerald px-3.5 py-1.5 text-xs cursor-pointer"
                >
                  {loadingStep === 'notif' ? 'جاري التفعيل...' : 'تفعيل'}
                </button>
              )}
            </div>
          </div>

          {/* 2) Location Permission */}
          <div className="p-3.5 sm:p-4 rounded-[10px] bg-[#FAF6EC] border border-[#B8924A]/40 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#F3ECDA] border border-[#B8924A]/50 text-[#0F3D2E] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#B8924A]" aria-hidden="true" />
              </div>
              <div className="min-w-0 text-right">
                <h3 className="font-display font-bold text-xs sm:text-sm text-[#0F3D2E]">
                  الموقع الجغرافي (GPS)
                </h3>
                <p className="text-[11px] text-[#425B51] truncate">
                  {gpsGranted ? 'تم تحديد موقعك بدقة' : 'لحساب أواقـت الصلاة واتجاه القبلة'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {gpsGranted ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] bg-[#1F6B50]/15 text-[#1F6B50] font-bold text-xs">
                  <CheckCircle className="w-4 h-4" />
                  <span>مفعل</span>
                </span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleRequestGps}
                    disabled={loadingStep === 'gps'}
                    className="btn-emerald px-3.5 py-1.5 text-xs cursor-pointer"
                  >
                    {loadingStep === 'gps' ? 'جاري التحديد...' : 'تحديد'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void openAppLocationPermissionSettings()}
                    title="فتح إعدادات الأذونات"
                    className="p-1.5 rounded-[6px] border border-[#B8924A]/40 text-[#0F3D2E] hover:bg-[#F3ECDA] cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 3) Battery Optimization Exemption */}
          <div className="p-3.5 sm:p-4 rounded-[10px] bg-[#FAF6EC] border border-[#B8924A]/40 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#F3ECDA] border border-[#B8924A]/50 text-[#0F3D2E] flex items-center justify-center shrink-0">
                <BatteryCharging className="w-5 h-5 text-[#B8924A]" aria-hidden="true" />
              </div>
              <div className="min-w-0 text-right">
                <h3 className="font-display font-bold text-xs sm:text-sm text-[#0F3D2E]">
                  التشغيل في الخلفية (البطارية)
                </h3>
                <p className="text-[11px] text-[#425B51] truncate">
                  {batteryGranted ? 'مستثنى من توفير البطارية' : 'ضمان عمل الأذان عند غلق التطبيق'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {batteryGranted ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] bg-[#1F6B50]/15 text-[#1F6B50] font-bold text-xs">
                  <CheckCircle className="w-4 h-4" />
                  <span>مفعل</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenBatterySettings}
                  disabled={loadingStep === 'battery'}
                  className="btn-manuscript px-3.5 py-1.5 text-xs text-[#0F3D2E] font-bold cursor-pointer"
                >
                  {loadingStep === 'battery' ? 'جاري الفتح...' : 'إعدادات النظام'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#B8924A]/30 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleFinish}
            className="w-full min-h-[46px] btn-emerald text-sm sm:text-base font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>متابعة إلى رحلة النور</span>
          </button>
        </div>
      </div>
    </div>
  );
};
