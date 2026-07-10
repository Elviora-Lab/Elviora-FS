import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx,mdx}',
    './src/components/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
    './src/design-system/**/*.{ts,tsx}',
    './src/shared/**/*.{ts,tsx}',
    './src/providers/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '3rem',
        '2xl': '4rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'hsl(var(--success) / <alpha-value>)',
          foreground: 'hsl(var(--success-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        // Brand tokens — cosmetics palette
        brand: {
          ivory: 'hsl(var(--brand-ivory) / <alpha-value>)',
          pearl: 'hsl(var(--brand-pearl) / <alpha-value>)',
          champagne: 'hsl(var(--brand-champagne) / <alpha-value>)',
          gold: 'hsl(var(--brand-gold) / <alpha-value>)',
          rosegold: 'hsl(var(--brand-rosegold) / <alpha-value>)',
          blush: 'hsl(var(--brand-blush) / <alpha-value>)',
          rose: 'hsl(var(--brand-rose) / <alpha-value>)',
          mauve: 'hsl(var(--brand-mauve) / <alpha-value>)',
          plum: 'hsl(var(--brand-plum) / <alpha-value>)',
          beige: 'hsl(var(--brand-beige) / <alpha-value>)',
          nude: 'hsl(var(--brand-nude) / <alpha-value>)',
          charcoal: 'hsl(var(--brand-charcoal) / <alpha-value>)',
          noir: 'hsl(var(--brand-noir) / <alpha-value>)',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-serif)', 'Cormorant Garamond', 'serif'],
      },
      fontSize: {
        'display-2xl': [
          'clamp(3.5rem, 7vw, 6rem)',
          { lineHeight: '1.05', letterSpacing: '-0.02em' },
        ],
        'display-xl': [
          'clamp(2.75rem, 5vw, 4.5rem)',
          { lineHeight: '1.08', letterSpacing: '-0.02em' },
        ],
        'display-lg': [
          'clamp(2.25rem, 4vw, 3.5rem)',
          { lineHeight: '1.1', letterSpacing: '-0.015em' },
        ],
        'display-md': [
          'clamp(1.875rem, 3vw, 2.5rem)',
          { lineHeight: '1.15', letterSpacing: '-0.01em' },
        ],
        'display-sm': ['clamp(1.5rem, 2vw, 2rem)', { lineHeight: '1.2' }],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        soft: '0 2px 12px -2px rgb(0 0 0 / 0.06)',
        card: '0 4px 20px -4px rgb(0 0 0 / 0.08)',
        elevated: '0 10px 40px -10px rgb(0 0 0 / 0.15)',
        luxe: '0 20px 60px -20px hsl(var(--brand-gold) / 0.25)',
        // Soft rose-gold halo — for hover states and featured surfaces.
        glow: '0 0 44px -10px hsl(var(--brand-rosegold) / 0.45)',
      },
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 1, 0.36, 1)',
        luxe: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        shimmer: 'shimmer 1.6s infinite',
        marquee: 'marquee 30s linear infinite',
      },
      backgroundImage: {
        'gradient-gold':
          'linear-gradient(135deg, hsl(var(--brand-champagne)) 0%, hsl(var(--brand-rosegold)) 55%, hsl(var(--brand-gold)) 100%)',
        'gradient-pearl':
          'linear-gradient(180deg, hsl(var(--brand-pearl)) 0%, hsl(var(--brand-ivory)) 100%)',
        // Cosmetic accents: a blush-to-champagne wash and a deep plum-noir.
        'gradient-blush':
          'linear-gradient(135deg, hsl(var(--brand-blush)) 0%, hsl(var(--brand-champagne)) 100%)',
        'gradient-noir':
          'linear-gradient(160deg, hsl(var(--brand-plum)) 0%, hsl(var(--brand-noir)) 100%)',
      },
    },
  },
  plugins: [animate],
};

export default config;
