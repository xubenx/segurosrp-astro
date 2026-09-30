import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  // URL base del sitio para el sitemap
  site: 'https://segurosrp.com/',
  output: 'server',

  // En Vercel la función ve el host como localhost. Sin esto, el POST del
  // login se rechaza: "Cross-site POST form submissions are forbidden".
  security: {
    allowedDomains: [
      { hostname: 'segurosrp.com' },
      { hostname: 'www.segurosrp.com' },
      { hostname: '**.vercel.app' },
    ],
  },

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
      external: ['nodemailer', 'firebase/app', 'firebase/firestore', 'firebase-admin', 'node-telegram-bot-api', 'telegram']
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