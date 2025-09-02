/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'rp-blue': '#00305C',
        'rp-light-blue': '#1A75CF',
        'rp-orange': '#FF6600',
        'rp-gray': '#F5F5F5',
        'rp-white': '#FFFFFF',
        'rp-black': '#000000',
      },
    },
  },
  plugins: [],
}
