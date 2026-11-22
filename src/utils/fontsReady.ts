import { useEffect, useState } from 'react';

let fontsResolved = false;

export function isDocumentFontsReady(): boolean {
  if (fontsResolved) return true;
  if (typeof document === 'undefined' || !('fonts' in document)) {
    fontsResolved = true;
    return true;
  }
  if (document.fonts.status === 'loaded') {
    fontsResolved = true;
    return true;
  }
  return false;
}

export function useFontsReady(): boolean {
  const [ready, setReady] = useState<boolean>(() => isDocumentFontsReady());

  useEffect(() => {
    if (ready) return;
    if (typeof document === 'undefined' || !('fonts' in document)) {
      fontsResolved = true;
      setReady(true);
      return;
    }

    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      fontsResolved = true;
      setReady(true);
    });

    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled) {
        fontsResolved = true;
        setReady(true);
      }
    }, 800);

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
    };
  }, [ready]);

  return ready;
}
