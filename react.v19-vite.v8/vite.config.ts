import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    origin: 'http://localhost:5173',
    port: 5173,
    // proxy: {
    //   '^(?!/index.html|/api|/assets|/src).*': {
    //     target: 'http://localhost:5173',
    //     rewrite: () => '/index.html',
    //   },
    // },    
  },  
})
