import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './styles/local-fonts.css';
import './index.css';
import {
  clearOutdatedAppCaches,
  getCurrentAppVersion,
  isAndroidNativeApp,
  syncInstalledVersionState,
  triggerSingleSafeReload,
} from './utils/appUpdateChecker';
import {
  applyAppAppearanceToDocument,
  loadAppAppearanceSettings,
} from './utils/appAppearance';

applyAppAppearanceToDocument(loadAppAppearanceSettings());
syncInstalledVersionState();

if (!isAndroidNativeApp() && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      void (async () => {
        await clearOutdatedAppCaches();
        await updateSW(true);
        triggerSingleSafeReload(getCurrentAppVersion());
      })();
    },
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        void registration.update().catch(() => undefined);
      }
    },
  });
}

createRoot(document.getElementById('root')!).render(<App />);
