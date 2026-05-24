export const typography = {
  fontFamily: {
    serif: 'var(--font-serif)',
    sans: 'var(--font-sans)',
  },
  scale: {
    'display-2xl': { size: '6rem', leading: '1.05', tracking: '-0.02em' },
    'display-xl': { size: '4.5rem', leading: '1.08', tracking: '-0.02em' },
    'display-lg': { size: '3.5rem', leading: '1.1', tracking: '-0.015em' },
    'display-md': { size: '2.5rem', leading: '1.15', tracking: '-0.01em' },
    'display-sm': { size: '2rem', leading: '1.2', tracking: '0' },
    body: { size: '1rem', leading: '1.6', tracking: '0' },
    caption: { size: '0.75rem', leading: '1.5', tracking: '0.08em' },
  },
  weight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;
