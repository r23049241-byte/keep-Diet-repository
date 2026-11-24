/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eefdf3', 100: '#d6f8e0', 200: '#b0f0c6', 300: '#7ce3a3',
          400: '#43cd78', 500: '#22b25c', 600: '#15904a', 700: '#13733d',
          800: '#135b34', 900: '#114a2d',
        },
        accent: {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
        },
        ink: {
          900: '#0f1b13', 800: '#1a2b20', 700: '#28402f', 600: '#3b5a47',
          500: '#5c7a66', 400: '#8ba896',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
