export const theme = {
  colors: {
    bg: '#111316',
    card: '#1A1D22',
    card2: '#171A1F',
    surface: '#22262D',
    text: '#EAECEF',
    muted: '#9AA3AE',
    accentBlue: '#3B5BFF',
    accentGreen: '#3CFF8F',
    accentPurple: '#8B5CF6',
    accentOrange: '#F97316',
    border: '#2A2F36',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#EAB308',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 18,
    xl: 24,
    xxl: 28,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
  },
};

export type Theme = typeof theme;
