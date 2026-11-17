import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    // Vite 8 uses OXC/Rolldown — minify default is 'oxc'
    cssCodeSplit: true,
    rolldownOptions: {
      output: {
        // حذف console.* و debugger من كود الإنتاج — عبر خيار المصغّر الموثّق
        // في Rolldown (output.minify.compress بصيغة camelCase).
        // ملاحظة: build.oxcOptions ليس خياراً موثقاً في Vite 8 وكان يُتجاهل بصمت.
        minify: {
          compress: {
            dropConsole: true,
            dropDebugger: true,
          },
        },
        // تقسيم واضح للحزم لتسريع تحميل الصفحة
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react'
          }
          if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/react-router/')) {
            return 'router'
          }
          if (id.includes('node_modules/framer-motion/')) {
            return 'framer-motion'
          }
          if (id.includes('node_modules/howler/')) {
            return 'howler'
          }
          if (id.includes('node_modules/liquid-gl/')) {
            return 'liquidGL'
          }
        },
      },
    },
  },
})
