import React, { useState } from 'react';
import { WifiOff, X } from 'lucide-react';
import { useOnlineStatus } from '../utils/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  if (isOnline || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[76px] md:bottom-4 right-3 left-3 sm:left-auto sm:right-6 sm:max-w-md z-50 p-3.5 rounded-[6px] bg-[#0F3D2E] text-[#FAF6EC] border border-[#B8924A] shadow-xl flex items-center justify-between gap-3 text-right"
    >
      <div className="flex items-center gap-3 min-w-0">
        <WifiOff className="w-5 h-5 text-[#D9B96A] shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <span className="font-display font-bold text-xs sm:text-sm text-[#FAF6EC] block">
            العمل دون اتصال بالإنترنت
          </span>
          <p className="text-[11px] sm:text-xs text-[#F3ECDA]/85 font-medium leading-relaxed truncate">
            الأدعية والمناجاة والقصص والمحطات محفوظة وتعمل بالكامل دون اتصال.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="إخفاء التنبيه"
        className="p-1.5 rounded-[4px] hover:bg-[#1F6B50] text-[#D9B96A] hover:text-[#FAF6EC] cursor-pointer shrink-0 transition-colors"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
};
