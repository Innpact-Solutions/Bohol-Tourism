
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  import tailwindcss from '@tailwindcss/vite';
  import path from 'path';
import { execSync } from 'child_process';

// Auto-version from git commit count — increments on every commit, works locally and in CI
let commitCount = '0';
try {
  commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();
} catch {}
const APP_VERSION = `v0.${commitCount}`;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'vaul@1.1.2': 'vaul',
        'sonner@2.0.3': 'sonner',
        'recharts@2.15.2': 'recharts',
        'react-resizable-panels@2.1.7': 'react-resizable-panels',
        'react-hook-form@7.55.0': 'react-hook-form',
        'react-day-picker@8.10.1': 'react-day-picker',
        'next-themes@0.4.6': 'next-themes',
        'maplibre-gl@5.15.0': 'maplibre-gl',
        'lucide-react@0.487.0': 'lucide-react',
        'input-otp@1.4.2': 'input-otp',
        'figma:asset/b3dbf4bb1f6cbe2bf4e744f225812a8a2d5559b9.png': path.resolve(__dirname, './src/assets/b3dbf4bb1f6cbe2bf4e744f225812a8a2d5559b9.png'),
        'figma:asset/8653321df4847c5ff5813f7d21dc2de3aa03da09.png': path.resolve(__dirname, './src/assets/8653321df4847c5ff5813f7d21dc2de3aa03da09.png'),
        'figma:asset/675d206072795155b568af95dfafe18a05d798b5.png': path.resolve(__dirname, './src/assets/675d206072795155b568af95dfafe18a05d798b5.png'),
        'figma:asset/39e5f727867207694ca664f2c1e37d6974bebf95.png': path.resolve(__dirname, './src/assets/39e5f727867207694ca664f2c1e37d6974bebf95.png'),
        'figma:asset/28a68ce6f762781887d81ef25d37ca6723765991.png': path.resolve(__dirname, './src/assets/28a68ce6f762781887d81ef25d37ca6723765991.png'),
        'figma:asset/067ddfa2e72bc87374b143c2af0e56ab8881d1d4.png': path.resolve(__dirname, './src/assets/067ddfa2e72bc87374b143c2af0e56ab8881d1d4.png'),
        'embla-carousel-react@8.6.0': 'embla-carousel-react',
        'cmdk@1.1.1': 'cmdk',
        'class-variance-authority@0.7.1': 'class-variance-authority',
        '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
        '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
        '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
        '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
        '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
        '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
        '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
        '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
        '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
        '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
        '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
        '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
        '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
        '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
        '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
        '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
        '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
        '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
        '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
        '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
        '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
        '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
        '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
        '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
        '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(APP_VERSION),
    },
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    server: {
      port: 3000,
      open: true,
      host: true,
      allowedHosts: 'all',
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
        '/health': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  });