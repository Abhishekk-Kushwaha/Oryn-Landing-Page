import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeTheme } from './lib/theme';

const ORYN_CACHE_PREFIX = 'oryn-';

async function clearOrynServiceWorkerState() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if (!('caches' in window)) return;

  const cacheKeys = await caches.keys();
  await Promise.all(
    cacheKeys
      .filter((key) => key.startsWith(ORYN_CACHE_PREFIX))
      .map((key) => caches.delete(key)),
  );
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (import.meta.env.DEV) {
      void clearOrynServiceWorkerState().catch((error) => {
        console.error('Service worker cleanup failed:', error);
      });
      return;
    }

    navigator.serviceWorker
      .register(`/sw.js?v=${encodeURIComponent(__APP_VERSION__)}`)
      .then((registration) => registration.update())
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });
  });
}

initializeTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
