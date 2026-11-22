import { useEffect, useLayoutEffect, useRef } from 'react';

const SCROLL_Y_STORAGE_KEY = 'rihlat_alnoor_scroll_y_v1';

function readScrollMap(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SCROLL_Y_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function getSavedItemScrollY(itemId: string): number {
  if (!itemId) return 0;
  const val = readScrollMap()[itemId];
  return typeof val === 'number' && Number.isFinite(val) && val > 0 ? Math.round(val) : 0;
}

export function saveItemScrollY(itemId: string, scrollY: number): void {
  if (typeof window === 'undefined' || !itemId) return;
  try {
    const map = readScrollMap();
    const clamped = Math.max(0, Math.round(scrollY));
    if (clamped <= 2) {
      delete map[itemId];
    } else {
      map[itemId] = clamped;
    }
    window.localStorage.setItem(SCROLL_Y_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Persists and restores exact vertical scroll position (`window.scrollY`) for any
 * reading screen item (Surah / Dua / Ziyarat / Sahifa / Munajat) once content and
 * bundled fonts are ready — without animated jumps or reflow.
 */
export function useItemScrollPersistence(options: {
  itemId: string | null;
  ready: boolean;
}) {
  const { itemId, ready } = options;
  const restoredForKeyRef = useRef<string>('');
  const activeItemRef = useRef<string | null>(itemId);
  activeItemRef.current = itemId;

  useLayoutEffect(() => {
    if (!itemId || !ready || typeof window === 'undefined') return;
    if (restoredForKeyRef.current === itemId) return;
    restoredForKeyRef.current = itemId;

    const targetY = getSavedItemScrollY(itemId);
    window.scrollTo({ top: targetY, behavior: 'auto' });

    if (targetY > 0) {
      // Ensure layout reflects full scrollHeight if document height finishes settling on same frame
      requestAnimationFrame(() => {
        if (activeItemRef.current === itemId) {
          window.scrollTo({ top: targetY, behavior: 'auto' });
        }
      });
    }
  }, [itemId, ready]);

  useEffect(() => {
    if (!itemId) {
      restoredForKeyRef.current = '';
      return;
    }
    if (!ready || typeof window === 'undefined') return;

    let timer: number | null = null;
    const persistNow = () => {
      saveItemScrollY(itemId, window.scrollY);
    };

    const handleScroll = () => {
      if (timer !== null) {
        window.clearTimeout(timer);
      }
      timer = window.setTimeout(() => {
        timer = null;
        persistNow();
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timer !== null) {
        window.clearTimeout(timer);
      }
      persistNow();
    };
  }, [itemId, ready]);
}
