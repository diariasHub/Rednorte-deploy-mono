import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '');
        return path.resolve(__dirname, 'src/assets', filename);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Proxy para desarrollo local: replica el comportamiento del reverse proxy de Nginx
  // Proxy para desarrollo local: replica el comportamiento del reverse proxy de Nginx
  server: {
    proxy: {
      '/proxy/reservas': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/reservas/, ''),
      },
      '/proxy/pacientes': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/pacientes/, ''),
      },
      '/proxy/urgencias': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/urgencias/, ''),
      },
      
      // 👇 REGLA GENÉRICA PARA LA API 👇
      // Esto atrapará /api/v1/history, /api/v1/appointments, /api/v1/encounters, etc.
      '/api/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // No usamos rewrite porque el Gateway espera la ruta completa /api/v1/...
      },
      // 👇 NUEVA REGLA PARA LA AGENDA 👇
      '/agendas': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Tampoco usamos rewrite porque tu Gateway ya espera la ruta con /agendas/...
      },
      // 👇 NUEVA REGLA PARA FHIR 👇
      '/fhir': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
    },
  },
});