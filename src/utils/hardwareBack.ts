import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

export type HardwareBackHandler = () => boolean;

const backHandlerStack: HardwareBackHandler[] = [];

/**
 * Registers a back button handler in LIFO order.
 * Returning `true` from the handler consumes the hardware back press.
 */
export function registerHardwareBackHandler(
  handler: HardwareBackHandler
): () => void {
  backHandlerStack.push(handler);
  return () => {
    const idx = backHandlerStack.lastIndexOf(handler);
    if (idx !== -1) {
      backHandlerStack.splice(idx, 1);
    }
  };
}

/**
 * Attaches Android hardware back button listener via @capacitor/app.
 * Runs active screen/modal handlers from top of stack down before running fallback.
 */
export function initAndroidBackButton(fallbackHandler: () => void): () => void {
  let removed = false;
  let listenerHandle: { remove: () => Promise<void> } | null = null;

  try {
    void CapacitorApp.addListener('backButton', () => {
      for (let i = backHandlerStack.length - 1; i >= 0; i--) {
        try {
          if (backHandlerStack[i]()) {
            return;
          }
        } catch {
          // Continue to next handler if one throws
        }
      }
      fallbackHandler();
    }).then((handle) => {
      if (removed) {
        void handle.remove();
      } else {
        listenerHandle = handle;
      }
    });
  } catch {
    // Ignore on environments where Capacitor bridge isn't available
  }

  return () => {
    removed = true;
    if (listenerHandle) {
      void listenerHandle.remove();
      listenerHandle = null;
    }
  };
}

export function exitAndroidAppIfNative(): void {
  if (Capacitor.isNativePlatform()) {
    try {
      void CapacitorApp.exitApp();
    } catch {
      // Ignore if unsupported
    }
  }
}
