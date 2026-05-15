import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/]react/,
              priority: 20,
            },
            {
              name: 'vendor',
              test: /node_modules/,
              priority: 10,
            }
          ]
        }
      }
    }
  }  
})
