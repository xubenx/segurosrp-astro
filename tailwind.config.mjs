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
        'rp-orange': '#fe8f34',
        'rp-gray': '#F5F5F5',
        'rp-white': '#FFFFFF',
        'rp-black': '#000000',
      },
      fontFamily: {
        'sans': ['Texta', 'Jost', 'system-ui', '-apple-system', 'sans-serif'],
        'heading': ['Raleway', 'system-ui', '-apple-system', 'sans-serif'],
        'body': ['Texta', 'Jost', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontWeight: {
        'extrabold': '800',
        'semibold': '600',
        'light': '300',
      },
    },
  },
  plugins: [],
}
