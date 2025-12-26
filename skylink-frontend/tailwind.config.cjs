/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        admin: {
          bg: '#f8fafc',
          surface: '#ffffff',
          border: '#e5e7eb',
          text: '#111827',
          muted: '#6b7280',
          primary: '#2563eb',
          'primary-hover': '#1d4ed8',
          danger: '#dc2626',
          'danger-hover': '#b91c1c',
          purple: '#7c3aed',
          indigo: '#4f46e5',
        },
        cosmos: {
          bg: '#020617',
          surface: {
            DEFAULT: '#0f172a',
            elevated: '#1e293b',
            glass: 'rgba(15, 23, 42, 0.4)',
            'glass-light': 'rgba(30, 41, 59, 0.4)',
          },
          text: {
            primary: '#f8fafc',
            secondary: '#cbd5e1',
            muted: '#94a3b8',
          },
          border: 'rgba(255, 255, 255, 0.1)',
        },
      },
      borderRadius: {
        admin: '0.75rem',
        'admin-lg': '1rem',
      },
      boxShadow: {
        admin: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'admin-md': '0 4px 12px -4px rgb(0 0 0 / 0.12)',
        'cosmos-glow': '0 0 20px rgba(59, 130, 246, 0.2)',
        'cosmos-glow-lg': '0 0 40px rgba(59, 130, 246, 0.3)',
      },
      fontSize: {
        'admin-base': ['14px', { lineHeight: '20px' }],
        'admin-h1': ['30px', { lineHeight: '36px' }],
        'admin-h2': ['24px', { lineHeight: '32px' }],
        'admin-h3': ['18px', { lineHeight: '26px' }],
        'admin-tooltip': ['12px', { lineHeight: '16px' }],
      },
      spacing: {
        'admin-tooltip': '12px',
      },
      width: {
        'admin-tooltip': '280px',
      },
      backgroundImage: {
        'admin-gradient-primary': 'linear-gradient(to right, #2563eb, #4f46e5)',
        'admin-gradient-purple': 'linear-gradient(to right, #7c3aed, #4f46e5)',
        'admin-gradient-indigo': 'linear-gradient(to right, #4f46e5, #2563eb)',
      },
      backdropBlur: {
        'cosmos-xl': '20px',
      },
    },
  },
  plugins: [],
};
