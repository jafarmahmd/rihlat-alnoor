import React from 'react';
import { BatteryCharging, ShieldCheck, X } from 'lucide-react';
import {
  AdhanSchedulerPlugin,
  isCustomAdhanPluginAvailable,
} from '../plugins/adhanNativePlugin';
import { openDeviceAutostartSettings } from '../utils/gpsLocation';
import { CornerOrnaments } from './IslamicOrnaments';

export const OEM_BATTERY_MODAL_SEEN_KEY =
  'rihlat_alnoor_oem_battery_autostart_v1';

interface OemBatteryAutostartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function hasSeenOemBatteryModal(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(OEM_BATTERY_MODAL_SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

export function markOemBatteryModalSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(OEM_BATTERY_MODAL_SEEN_KEY, '1');
  } catch {
    // Ignore quota errors
  }
}

export const OemBatteryAutostartModal: React.FC<
  OemBatteryAutostartModalProps
> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    markOemBatteryModalSeen();
    onClose();
  };

  const handleBatteryExemption = async () => {
    if (isCustomAdhanPluginAvailable()) {
      await AdhanSchedulerPlugin.requestBatteryOptimizationExemption();
    }
    markOemBatteryModalSeen();
  };

  const handleAutostart = async () => {
    await openDeviceAutostartSettings();
    markOemBatteryModalSeen();
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#081A14]/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="إعدادات تشغيل الأذان في الخلفية"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md manuscript-folio rounded-[6px] p-6 sm:p-7 space-y-4 shadow-2xl"
      >
        <CornerOrnaments />

        <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#B8924A]/35">
          <div className="flex items-center gap-2.5">
            <BatteryCharging
              className="w-5 h-5 text-[#1F6B50] shrink-0"
              aria-hidden="true"
            />
            <h3 className="font-display font-bold text-base sm:text-lg text-[#0F3D2E]">
              لضمان صدح الأذان والتطبيق مغلق
            </h3>
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

        <p className="text-xs sm:text-sm text-[#11271F] leading-relaxed">
          بعض أنظمة الأندرويد (مثل <strong className="text-[#0F3D2E]">HiOS و Xiaomi و Huawei</strong>) تغلق منبهات التطبيقات في الخلفية لتوفير الطاقة. لنعمل بأقصى موثوقية عند إغلاق التطبيق تماماً، يُنصح بتفعيل الخطوتين التاليتين مرة واحدة فقط:
        </p>

        <div className="rounded-[5px] bg-[#F3ECDA]/75 border border-[#B8924A]/40 p-3 space-y-2 text-xs text-[#425B51] leading-relaxed">
          <p>
            <strong className="text-[#0F3D2E]">١. استثناء توفير البطارية:</strong>{' '}
            اختر «عدم التحسين / لا قيود» لتطبيق رحلة النور.
          </p>
          <p>
            <strong className="text-[#0F3D2E]">٢. التشغيل التلقائي (Autostart):</strong>{' '}
            فعّل «التشغيل التلقائي / السماح بالتشغيل في الخلفية» من إعدادات الهاتف.
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => void handleBatteryExemption()}
            className="w-full min-h-[44px] px-4 py-2 btn-emerald text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <BatteryCharging className="w-4 h-4 text-[#D9B96A]" aria-hidden="true" />
            <span>استثناء من توفير البطارية</span>
          </button>

          <button
            type="button"
            onClick={() => void handleAutostart()}
            className="w-full min-h-[44px] px-4 py-2 btn-manuscript text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#1F6B50]" aria-hidden="true" />
            <span>فتح إعدادات التشغيل التلقائي</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="w-full min-h-[38px] text-xs font-bold text-[#7A5E2A] hover:underline cursor-pointer"
          >
            متابعة الآن
          </button>
        </div>
      </div>
    </div>
  );
};
