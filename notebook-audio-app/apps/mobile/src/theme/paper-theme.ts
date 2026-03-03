import { MD3DarkTheme } from 'react-native-paper';
import { theme } from '.';

export const paperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: theme.colors.accentBlue,
    secondary: theme.colors.accentGreen,
    background: theme.colors.bg,
    surface: theme.colors.card,
    onSurface: theme.colors.text,
    onSurfaceVariant: theme.colors.muted,
    outline: theme.colors.border,
    error: theme.colors.error,
  },
  roundness: theme.borderRadius.md,
};
