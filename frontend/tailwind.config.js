/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Lotus Design Language System Colors
      colors: {
        // Primary Palette
        'lotus-green': {
          DEFAULT: '#2D5F3F',
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#2D5F3F', // Primary
          600: '#234A32',
          700: '#1B3925',
          800: '#132819',
          900: '#0B1B0C',
        },
        'nile-blue': {
          DEFAULT: '#4A90A4',
          50: '#F0F8FA',
          100: '#E1F1F5',
          200: '#C3E3EB',
          300: '#A5D5E1',
          400: '#87C7D7',
          500: '#4A90A4', // Secondary
          600: '#3B7383',
          700: '#2C5662',
          800: '#1D3941',
          900: '#0E1C20',
        },
        'cairo-sand': {
          DEFAULT: '#F7F3E9',
          50: '#FEFDFB',
          100: '#F7F3E9', // Background
          200: '#F0E7D3',
          300: '#E8DBBD',
          400: '#E1CFA7',
          500: '#D9C391',
          600: '#AE9C74',
          700: '#827557',
          800: '#574E3A',
          900: '#2B271D',
        },
        // Semantic Colors
        'plant-healthy': '#4CAF50',
        'needs-attention': '#FFC107',
        'critical-care': '#F44336',
      },
      // Typography Scale
      fontSize: {
        'display': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'h1': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'h2': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'caption': ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },
      // Spacing Scale (8px base)
      spacing: {
        '2xs': '2px',
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
      },
      // Border Radius
      borderRadius: {
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'full': '9999px',
      },
      // Font Family
      fontFamily: {
        'system': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Cairo', 'Noto Sans Arabic', 'sans-serif'],
        'arabic': ['Cairo', 'Noto Sans Arabic', 'sans-serif'],
      },
      // Gradient Colors
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #2D5F3F 0%, #4A90A4 100%)',
        'sand-gradient': 'linear-gradient(180deg, #FFFFFF 0%, #F7F3E9 100%)',
        'morning-mist': 'linear-gradient(180deg, #F7F3E9 0%, #E8F5E9 100%)',
      },
      // Box Shadow
      boxShadow: {
        'plant-card': '0 4px 12px rgba(0,0,0,0.08)',
        'fab': '0 8px 24px rgba(45, 95, 63, 0.3)',
      },
      // Animation
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}