import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',

  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),

  integrations: [
    tailwind({
      // Habilitar estilos base de Tailwind
      applyBaseStyles: true,
    })
  ],

  vite: {
    ssr: {
      external: ['nodemailer', 'firebase/app', 'firebase/firestore']
    }
  },
});