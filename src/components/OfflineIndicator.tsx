import React, { useState } from 'react';
import { WifiOff, Wifi, CheckCircle2, X } from 'lucide-react';
import { useOnlineStatus } from '../utils/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  if (isOnline || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-3.5 sm:p-4 rounded-2xl bg-[#145344] text-[#F5EFE0] border border-[#3E7A69] shadow-lg backdrop-blur-md flex items-center justify-between gap-3 text-right"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#EAD9B0] shrink-0">
          <WifiOff className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <span className="font-display font-bold text-xs sm:text-sm text-white block">
            وضع بدون إنترنت (Offline Mode)
          </span>
          <p className="text-[11px] sm:text-xs text-[#DDECE6] font-medium leading-relaxed truncate">
            جميع الأدعية والمناجاة والمحطات والقصص مخزنة وتعمل بالكامل دون اتصال.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="إخفاء التنبيه"
        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer shrink-0"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
};
