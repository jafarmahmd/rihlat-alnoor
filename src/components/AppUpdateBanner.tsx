import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDownToLine, ExternalLink, RefreshCw, X } from 'lucide-react';
import { AppUpdateInfo, applyAppUpdateAndReload } from '../utils/appUpdateChecker';
import { AstrolabeIcon } from './IslamicOrnaments';

interface AppUpdateBannerProps {
  update: AppUpdateInfo | null;
  onDismiss: () => void;
}

export const AppUpdateBanner: React.FC<AppUpdateBannerProps> = ({
  update,
  onDismiss,
}) => {
  const [applying, setApplying] = useState(false);

  const handleApplyUpdate = async () => {
    if (!update || applying) return;
    setApplying(true);
    try {
      await applyAppUpdateAndReload(update);
      onDismiss();
    } finally {
      setApplying(false);
    }
  };

  return (
    <AnimatePresence>
      {update && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          dir="rtl"
          role="dialog"
          aria-modal="false"
          aria-labelledby="app-update-banner-title"
          className="fixed bottom-[76px] md:bottom-4 inset-x-3 sm:inset-x-auto sm:left-6 sm:w-[410px] z-[60] rounded-[6px] bg-[#FAF6EC] paper-grain border border-[#B8924A] shadow-2xl shadow-[#0F3D2E]/25 overflow-hidden text-right"
        >
          <div className="bg-[#0F3D2E] px-4 py-3 text-[#FAF6EC] border-b border-[#B8924A]/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <AstrolabeIcon className="w-5 h-5 text-[#D9B96A] shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#D9B96A]">
                  إصدار جديد متوفر
                </p>
                <h3
                  id="app-update-banner-title"
                  className="font-display font-bold text-sm sm:text-base text-[#FAF6EC] truncate"
                >
                  {update.releaseTitle}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              aria-label="إغلاق إشعار التحديث"
              className="min-w-[34px] min-h-[34px] rounded-[4px] bg-[#1F6B50]/45 hover:bg-[#1F6B50] text-[#FAF6EC] flex items-center justify-center cursor-pointer transition-colors shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 text-xs font-bold bg-[#F3ECDA] border border-[#B8924A]/40 rounded-[4px] px-3 py-2 text-[#11271F]">
              <span>إصدارك الحالي: v{update.currentVersion}</span>
              <span className="text-[#0F3D2E]">
                الإصدار الجديد: v{update.latestVersion}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#425B51] leading-relaxed line-clamp-3">
              {update.releaseNotes}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleApplyUpdate}
                disabled={applying}
                className="flex-1 min-h-[42px] px-4 py-2 btn-gilded text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {applying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowDownToLine className="w-4 h-4" aria-hidden="true" />
                )}
                <span>
                  {applying
                    ? 'جارٍ التحديث...'
                    : update.isNativeApk
                      ? update.hasApkAsset
                        ? 'تحديث وتنزيل APK'
                        : 'تحديث من صفحة الإصدار'
                      : 'تحديث التطبيق الآن'}
                </span>
              </button>

              {update.isNativeApk && update.hasApkAsset && (
                <a
                  href={update.releasePageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[42px] px-3.5 py-2 btn-manuscript text-xs flex items-center justify-center gap-1.5"
                >
                  <span>التفاصيل</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}

              <button
                type="button"
                onClick={onDismiss}
                className="min-h-[42px] px-3.5 py-2 btn-manuscript text-xs cursor-pointer"
              >
                لاحقاً
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
