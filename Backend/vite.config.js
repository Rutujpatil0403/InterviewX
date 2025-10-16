import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          [
            'babel-plugin-styled-components',
            {
              displayName: true,
              fileName: false
            }
          ]
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 3000
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['styled-components', 'framer-motion', 'lucide-react'],
          charts: ['recharts'],
          router: ['react-router-dom'],
          forms: ['react-hook-form'],
          utils: ['axios', 'date-fns', 'js-cookie']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
