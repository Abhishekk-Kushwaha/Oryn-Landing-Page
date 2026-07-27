import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const appVersion =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  new Date().toISOString();

function getManualChunk(id: string) {
  if (!id.includes('node_modules')) return undefined;

  if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
    return 'vendor-react';
  }

  if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
    return 'vendor-charts';
  }

  if (id.includes('node_modules/motion')) {
    return 'vendor-motion';
  }

  if (id.includes('node_modules/@dnd-kit')) {
    return 'vendor-dnd';
  }

  if (id.includes('node_modules/lucide-react')) {
    return 'vendor-icons';
  }

  if (id.includes('node_modules/date-fns')) {
    return 'vendor-date';
  }

  return undefined;
}

export default defineConfig(({mode}) => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: getManualChunk,
        },
      },
    },
  };
});
