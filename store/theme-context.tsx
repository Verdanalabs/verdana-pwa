import { createContext, useContext, useState, type ReactNode } from 'react';
import { DarkColors, LightColors, type ThemeColors, type ThemeMode } from '@/constants/themes';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  toggle: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  colors: DarkColors,
  toggle: () => {},
  isDark: true,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  const toggle = () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const value: ThemeContextValue = {
    mode,
    colors: mode === 'dark' ? DarkColors : LightColors,
    toggle,
    isDark: mode === 'dark',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeColors(): ThemeColors {
  return useContext(ThemeContext).colors;
}
