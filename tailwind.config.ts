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
                // Primary - Ion Blue
                primary: {
                    DEFAULT: '#4FC3F7',
                    50: '#E3F7FE',
                    100: '#C7EFFD',
                    200: '#90DFFB',
                    300: '#58CFF9',
                    400: '#4FC3F7',  // Main
                    500: '#1FB5F5',
                    600: '#0A9FE0',
                    700: '#0880B8',
                    800: '#066090',
                    900: '#044068',
                },

                // Neutral - Drift Silver
                drift: {
                    DEFAULT: '#DDE3EA',
                    50: '#F7F9FB',
                    100: '#EFF2F6',
                    200: '#DDE3EA',  // Main
                    300: '#CBD4DE',
                    400: '#B9C5D2',
                    500: '#A7B6C6',
                    600: '#8899AD',
                    700: '#6A7C94',
                    800: '#4C5F7B',
                    900: '#2E4262',
                },

                // Brand aliases for backward compatibility (optional, but good for transition)
                brand: {
                    primary: '#4FC3F7',
                    secondary: '#DDE3EA',
                },

                // Accent colors (complementary) - As per request
                accent: {
                    green: '#00E676',    // Success/Active
                    orange: '#FF9100',   // Warning/Expiring
                    red: '#FF1744',      // Error/Overdue
                }
            }
        }
    },
    plugins: [],
};
export default config;
