import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDownToLine, ExternalLink, Sparkles, X } from 'lucide-react';
import { AppUpdateInfo } from '../utils/appUpdateChecker';

interface AppUpdateBannerProps {
  update: AppUpdateInfo | null;
  onDismiss: () => void;
}

export const AppUpdateBanner: React.FC<AppUpdateBannerProps> = ({
  update,
  onDismiss,
}) => {
  return (
    <AnimatePresence>
      {update && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          dir="rtl"
          role="dialog"
          aria-modal="false"
          aria-labelledby="app-update-banner-title"
          className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:left-6 sm:w-[410px] z-[60] rounded-2xl sm:rounded-3xl bg-[#FDFCF9] border border-[#C9B990] shadow-2xl shadow-[#0E392E]/25 overflow-hidden text-right"
        >
          <div className="bg-gradient-to-l from-[#0E392E] to-[#175445] px-4 py-3 text-white flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-[#EFE2BE] text-[#0E392E] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#E9D8AA]">
                  تحديث جديد متوفر الآن
                </p>
                <h3
                  id="app-update-banner-title"
                  className="font-display font-bold text-sm sm:text-base text-white truncate"
                >
                  {update.releaseTitle}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              aria-label="إغلاق إشعار التحديث"
              className="min-w-[36px] min-h-[36px] rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 text-xs font-bold bg-[#F4F1E8] border border-[#E2DBC8] rounded-xl px-3 py-2 text-[#143D32]">
              <span>إصدارك الحالي: v{update.currentVersion}</span>
              <span className="text-[#145344]">
                الإصدار الجديد: v{update.latestVersion}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed line-clamp-3">
              {update.releaseNotes}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <a
                href={update.apkDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#145344] hover:bg-[#0F4236] text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowDownToLine className="w-4 h-4 text-[#E5D3A3]" aria-hidden="true" />
                <span>
                  {update.hasApkAsset
                    ? 'تنزيل التحديث (APK)'
                    : 'فتح صفحة التحديث'}
                </span>
              </a>

              {update.hasApkAsset && (
                <a
                  href={update.releasePageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F4F1E8] hover:bg-[#EAE4D5] text-[#143D32] border border-[#E0D9C6] font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>التفاصيل</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}

              <button
                type="button"
                onClick={onDismiss}
                className="min-h-[44px] px-4 py-2 rounded-xl text-stone-600 hover:bg-[#F4F1E8] font-display font-bold text-xs cursor-pointer transition-colors"
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
