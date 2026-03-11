/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{ts,tsx}', './index.html'],
    theme: {
        extend: {
            colors: {
                aw: {
                    dark: '#0a0e17',
                    darker: '#060a12',
                    accent: '#f59e0b',
                    blue: '#3b82f6',
                    cyan: '#06b6d4',
                    red: '#ef4444',
                    panel: 'rgba(10, 14, 23, 0.85)',
                    border: 'rgba(245, 158, 11, 0.2)',
                },
            },
            fontFamily: {
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Orbitron', 'sans-serif'],
            },
            animation: {
                'scan': 'scan 4s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 3s ease-in-out infinite',
                'jet-flyby': 'jetFlyby 12s linear infinite',
                'contrail': 'contrail 12s linear infinite',
            },
            keyframes: {
                scan: {
                    '0%, 100%': { transform: 'translateY(-100%)' },
                    '50%': { transform: 'translateY(100%)' },
                },
                glow: {
                    '0%': { opacity: '0.4', filter: 'brightness(1)' },
                    '100%': { opacity: '1', filter: 'brightness(1.3)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                jetFlyby: {
                    '0%': { transform: 'translateX(-20%) translateY(10%) scale(0.3)', opacity: '0' },
                    '10%': { opacity: '1' },
                    '50%': { transform: 'translateX(50%) translateY(-5%) scale(1)' },
                    '90%': { opacity: '1' },
                    '100%': { transform: 'translateX(120%) translateY(-15%) scale(0.3)', opacity: '0' },
                },
                contrail: {
                    '0%': { width: '0%', opacity: '0' },
                    '20%': { opacity: '0.6' },
                    '80%': { opacity: '0.3' },
                    '100%': { width: '100%', opacity: '0' },
                },
            },
        },
    },
    plugins: [],
}
