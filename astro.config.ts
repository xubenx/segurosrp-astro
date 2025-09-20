import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  // URL base del sitio para el sitemap
  site: 'https://segurosrp.com/',
  output: 'server',

  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
    isr: false,
  }),

  integrations: [
    tailwind({
      // Habilitar estilos base de Tailwind
      applyBaseStyles: true,
    })
  ],

  vite: {
    ssr: {
      external: ['nodemailer', 'firebase/app', 'firebase/firestore', 'node-telegram-bot-api']
    },
    build: {
      // Asegurar que el CSS se inline correctamente
      cssCodeSplit: false,
    }
  },

  // Configuración específica para build
  build: {
    inlineStylesheets: 'always',
  }
});