import colors from "tailwindcss/colors";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./pages/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        lg: '2rem',
      },
    },
    fontFamily: {
      sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'],
      mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
    },
    extend: {
      colors: {
        primary: colors.cyan,
        accent: colors.purple,
        neutral: colors.slate,
        success: colors.emerald,
        danger: colors.rose,
        black: '#000000',
      },
      borderRadius: {
        sm: '0.35rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        card: '0 8px 24px rgba(16,24,40,0.06)',
        soft: '0 6px 18px rgba(15,23,42,0.06)',
      },
      transitionProperty: {
        'common': 'background-color, color, border-color, box-shadow, transform',
      },
      gap: {
        '7': '1.75rem',
      }
    },
  },
  plugins: [],
};
