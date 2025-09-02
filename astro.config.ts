import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'server',

  adapter: vercel({
    imageService: true,
    webAnalytics: {
      enabled: true,
    },
  }),

  integrations: [tailwind()],

  vite: {
    ssr: {
      external: ['nodemailer', 'firebase/app', 'firebase/firestore']
    },
    build: {
      rollupOptions: {
        external: ['nodemailer']
      }
    }
  }
});