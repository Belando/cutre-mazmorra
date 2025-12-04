import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'; // <-- 1. Importa esto

// 2. Añade estas dos líneas para definir __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 3. Ahora esta línea funcionará perfectamente
      '@': path.resolve(__dirname, './src'),
    },
  },
})