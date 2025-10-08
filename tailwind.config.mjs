/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    './public/**/*.html'
  ],
  theme: {
    extend: {
      colors: {
        'rp-blue': '#00305C',
        'rp-light-blue': '#1A75CF',
        'rp-orange': '#E55A00',
        'rp-gray': '#F5F5F5',
        'rp-white': '#FFFFFF',
        'rp-black': '#000000',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
