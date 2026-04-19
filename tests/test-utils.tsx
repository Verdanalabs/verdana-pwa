import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/src/shared/theme/theme-context';

function TestProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

export function renderWithProviders(ui: ReactElement) {
  return render(ui, { wrapper: TestProviders });
}
