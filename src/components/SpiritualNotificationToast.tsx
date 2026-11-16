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
          initial={{ opacity: 0, y: -24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          role="status"
          aria-live="polite"
          className="fixed top-3 left-3 right-3 sm:left-6 sm:right-auto sm:w-[440px] z-[60] rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white border-2 border-amber-400/70 shadow-2xl p-4 sm:p-5 text-right"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-300/50 flex items-center justify-center text-amber-300 shrink-0">
                <BellRing className="w-5 h-5" aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-amber-300">
                  <span>
                    {notification.isTest
                      ? 'تجربة التنبيه اليومي'
                      : `تنبيه بداية اليوم · ${notification.guidance.badge}`}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-emerald-200">
                    <Calendar className="w-3 h-3" aria-hidden="true" />
                    {notification.hijriFormatted}
                  </span>
                </div>

                <h3 className="font-display font-black text-sm sm:text-base text-white mt-1 leading-snug">
                  {notification.guidance.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              aria-label="إغلاق الإشعار"
              className="min-w-[36px] min-h-[36px] rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 cursor-pointer shrink-0 transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {notification.occasionToday && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-400/15 border border-amber-300/35 text-xs text-amber-100 font-bold">
              مناسبة اليوم الهجرية: {notification.occasionToday.title}
            </div>
          )}

          <div className="mt-3 space-y-1.5">
            {notification.guidance.recommendedActs.slice(0, 3).map((act, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs text-emerald-100 leading-relaxed"
              >
                <CheckCircle2
                  className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{act}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between gap-2">
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onDismiss();
                  onOpenSettings();
                }}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 font-display font-bold text-xs cursor-pointer transition-colors"
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
              className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-display font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md cursor-pointer transition-colors mr-auto"
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
