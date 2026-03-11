/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                aw: {
                    bg: '#0a0e17',
                    surface: '#111827',
                    border: '#1f2937',
                    primary: '#3b82f6',
                    secondary: '#6366f1',
                    accent: '#22d3ee',
                    success: '#22c55e',
                    warning: '#eab308',
                    danger: '#ef4444',
                    text: '#f9fafb',
                    muted: '#9ca3af',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
        },
    },
    plugins: [],
}
