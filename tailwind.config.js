/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './ui-runtime/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{ts,tsx}',
    './contexts/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './contexts/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './services/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'coya-primary': 'var(--coya-primary)',
        'coya-primary-light': 'var(--coya-primary-light)',
        'coya-primary-dark': 'var(--coya-primary-dark)',
        'coya-primary-muted': 'var(--coya-primary-muted)',
        'coya-bg': 'var(--coya-bg)',
        'coya-card': 'var(--coya-card-bg)',
        'coya-text': 'var(--coya-text)',
        'coya-text-muted': 'var(--coya-text-muted)',
        'coya-border': 'var(--coya-border)',
        'coya-green': 'var(--coya-green)',
        'coya-emeraude': 'var(--coya-emeraude)',
        'coya-institutional': 'var(--coya-institutional)',
        'coya-institutional-secondary': 'var(--coya-institutional-secondary)',
        'coya-institutional-accent': 'var(--coya-institutional-accent)',
      },
      boxShadow: {
        coya: 'var(--coya-shadow)',

        'coya-lg': 'var(--coya-shadow-lg)',
      },
      borderRadius: {
        coya: 'var(--coya-radius)',
        'coya-lg': 'var(--coya-radius-lg)',
      },
      fontFamily: {
        coya: 'var(--coya-font)',
      },
    },
  },
  plugins: [],
};
