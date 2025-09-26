/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'grok-yellow': '#fbbf24',
        'grok-dark': '#111827',
        'grok-gray': '#1f2937',
        'grok-green': '#10b981',
        'grok-red': '#ef4444',
        'grok-blue': '#3b82f6',
        'grok-purple': '#8b5cf6'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out'
      },
      boxShadow: {
        'glow': '0 0 20px rgba(251, 191, 36, 0.3)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.3)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'grok-gradient': 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}