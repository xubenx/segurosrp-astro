import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

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
    }),
    sitemap({
      // Configuración del sitemap
      filter: (page) => {
        // Excluir páginas API y páginas de prueba
        return !page.includes('/api/') && 
               !page.includes('/ssr') && 
               !page.includes('/sitemap.xml');
      },
      customPages: [
        // Páginas personalizadas si las hay
      ],
      serialize(item) {
        // Personalizar cada entrada del sitemap
        if (item.url.endsWith('/')) {
          item.url = item.url.slice(0, -1);
        }
        return item;
      }
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