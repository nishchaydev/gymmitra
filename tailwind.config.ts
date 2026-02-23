import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Primary Brand Colors
                primary: {
                    DEFAULT: '#0066FF', // Ion Blue
                    50: '#E6F0FF',
                    100: '#CCE0FF',
                    200: '#99C1FF',
                    300: '#66A3FF',
                    400: '#3384FF',
                    500: '#0066FF',
                    600: '#0052CC',
                    700: '#003D99',
                    800: '#002966',
                    900: '#001433',
                },
                midnight: {
                    DEFAULT: '#1E3A8A', // Midnight Navy
                    50: '#E8EBF3',
                    100: '#D1D8E7',
                    200: '#A3B1CF',
                    300: '#758AB7',
                    400: '#47639F',
                    500: '#1E3A8A',
                    600: '#182E6E',
                    700: '#122252',
                    800: '#0C1637',
                    900: '#060B1B',
                },
                ocean: {
                    DEFAULT: '#0D9488', // Ocean Teal
                    50: '#E7F4F3',
                    100: '#CFE9E7',
                    200: '#9FD3CF',
                    300: '#6FBDB7',
                    400: '#3FA79F',
                    500: '#0D9488',
                    600: '#0A766D',
                    700: '#085951',
                    800: '#053B36',
                    900: '#031E1B',
                },
                // Base Colors
                slate: {
                    DEFAULT: '#0F172A', // Deep Slate
                },
                drift: {
                    DEFAULT: '#E2E8F0', // Drift Silver
                    50: '#F8FAFC',
                    100: '#F1F5F9',
                    200: '#E2E8F0',
                    300: '#CBD5E1',
                    400: '#94A3B8',
                    500: '#64748B',
                    600: '#475569',
                    700: '#334155',
                    800: '#1E293B',
                    900: '#0F172A',
                    950: '#020617',
                },
                white: '#FFFFFF',
            },
            fontFamily: {
                display: ['var(--font-display)', 'system-ui', 'sans-serif'],
                sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
            },
            animation: {
                'bounce-slow': 'bounce 2s infinite',
            }
        }
    },
    plugins: [],
};
export default config;
