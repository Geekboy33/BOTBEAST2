import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy para pruebas locales (redirige todas las peticiones a FastAPI)
      "/api": "http://localhost:8000",
      "/ws": {
        target: "ws://localhost:8000",
        ws: true
      },
      "/metrics": "http://localhost:8000"
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar React y dependencias principales
          'react-vendor': ['react', 'react-dom'],
          // Separar librerías de gráficos
          'charts': ['recharts'],
          // Separar componentes del dashboard
          'dashboard': [
            './src/components/MasterDashboard.tsx',
            './src/components/BinanceDashboard.tsx',
            './src/components/APIConfiguration.tsx'
          ]
        }
      }
    },
    // Aumentar el límite de warning de bundle size
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'recharts']
  }
});

