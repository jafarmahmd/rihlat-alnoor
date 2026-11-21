import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, BellRing, Calendar, CheckCircle2, X } from 'lucide-react';
import {
  DispatchedNotificationPayload,
  dispatchOpenSpiritualEntry,
} from '../utils/notificationManager';

interface SpiritualNotificationToastProps {
  notification: DispatchedNotificationPayload | null;
  onDismiss: () => void;
  onOpenSettings?: () => void;
}

export const SpiritualNotificationToast: React.FC<SpiritualNotificationToastProps> = ({
  notification,
  onDismiss,
  onOpenSettings,
}) => {
  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          role="status"
          aria-live="polite"
          className="fixed top-3 left-3 right-3 sm:left-6 sm:right-auto sm:w-[440px] z-[60] rounded-[6px] bg-[#0F3D2E] text-[#FAF6EC] border border-[#B8924A]/70 border-t-2 border-t-[#D9B96A] shadow-[0_14px_34px_rgba(8,26,20,0.45)] p-4 sm:p-5 text-right"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <BellRing className="w-5 h-5 text-[#D9B96A] shrink-0 mt-0.5" aria-hidden="true" />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-[#D9B96A]">
                  <span>
                    {notification.isTest
                      ? 'تجربة التنبيه اليومي'
                      : `تنبيه بداية اليوم · ${notification.guidance.badge}`}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-[#F3ECDA]/85">
                    <Calendar className="w-3 h-3 text-[#B8924A]" aria-hidden="true" />
                    {notification.hijriFormatted}
                  </span>
                </div>

                <h3 className="font-display text-base sm:text-lg text-[#FAF6EC] mt-1 leading-snug">
                  {notification.guidance.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              aria-label="إغلاق الإشعار"
              className="min-w-[36px] min-h-[36px] rounded-[4px] border border-[#B8924A]/40 bg-[#081A14]/45 hover:bg-[#1F6B50] flex items-center justify-center text-[#FAF6EC] cursor-pointer shrink-0 transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {notification.occasionToday && (
            <div className="mt-2.5 px-3 py-2 rounded-[4px] bg-[#1F6B50]/45 border border-[#B8924A]/45 text-xs text-[#F3EBD6] font-medium">
              مناسبة اليوم الهجرية: {notification.occasionToday.title}
            </div>
          )}

          <div className="mt-3 space-y-1.5">
            {notification.guidance.recommendedActs.slice(0, 3).map((act, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs text-[#F3ECDA]/90 leading-relaxed"
              >
                <CheckCircle2
                  className="w-3.5 h-3.5 text-[#D9B96A] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{act}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-[#B8924A]/25 flex items-center justify-between gap-2">
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onDismiss();
                  onOpenSettings();
                }}
                className="min-h-[40px] px-3.5 py-1.5 rounded-[4px] border border-[#B8924A]/45 bg-[#081A14]/40 hover:bg-[#1F6B50] text-[#F3ECDA] font-medium text-xs cursor-pointer transition-colors"
              >
                الإعدادات
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                dispatchOpenSpiritualEntry(
                  notification.guidance.linkedSection,
                  notification.guidance.linkedEntryId
                );
                onDismiss();
              }}
              className="btn-gilded min-h-[40px] px-4 py-1.5 text-xs sm:text-sm inline-flex items-center gap-1.5 mr-auto"
            >
              <span>{notification.guidance.linkedLabel}</span>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
