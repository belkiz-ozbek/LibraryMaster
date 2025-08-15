import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, '../shared'),
    },
  },
  optimizeDeps: {
    include: [
      'wouter', 
      '@tanstack/react-query', 
      'lucide-react', 
      'framer-motion', 
      'date-fns', 
      'react-dom-confetti', 
      'recharts', 
      '@radix-ui/react-slot', 
      '@radix-ui/react-label',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-select',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-toggle',
      '@radix-ui/react-separator',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-toast',
      '@radix-ui/react-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-menubar',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-switch',
      '@radix-ui/react-accordion',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-popover',
      '@radix-ui/react-tabs',
      '@radix-ui/react-slider',
      '@radix-ui/react-progress',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-alert-dialog',
      'class-variance-authority',
      'clsx',
      'lottie-react'
    ],
  },
  server: {
    proxy: {
      '/api': process.env.VITE_API_URL || 'http://localhost:3000',
    },
  },
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
    rollupOptions: {
      external: [],
    },
  },
}); 