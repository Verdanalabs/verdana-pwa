import React from 'react';
import { Text } from 'react-native';
import { screen } from '@testing-library/react-native';
import { NoticeCard } from '@/src/shared/ui/NoticeCard';
import { renderWithProviders } from '../test-utils';
import { LightColors, DarkColors } from '@/src/shared/theme/tokens';
import type { Tone } from '@/src/shared/theme/tokens';

const TONES: Tone[] = ['neutral', 'info', 'warning', 'success', 'danger', 'accent'];

function contrast(fg: string, bg: string) {
  const lum = (hex: string) => {
    const h = hex.replace('#', '');
    const [r, g, b] = [0, 2, 4].map((i) => {
      const v = parseInt(h.slice(i, i + 2), 16) / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = lum(fg);
  const b = lum(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe('NoticeCard', () => {
  it('renders a plain string message', () => {
    renderWithProviders(<NoticeCard tone="danger">Weight exceeds the limit.</NoticeCard>);
    expect(screen.getByText('Weight exceeds the limit.')).toBeTruthy();
  });

  it('renders composed children and a footer', () => {
    renderWithProviders(
      <NoticeCard tone="warning" footer={<Text>Try again</Text>}>
        <Text>Emission factor unavailable</Text>
      </NoticeCard>,
    );
    expect(screen.getByText('Emission factor unavailable')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
  });

  it.each(TONES)('renders the %s tone', (tone) => {
    renderWithProviders(<NoticeCard tone={tone}>Message</NoticeCard>);
    expect(screen.getByText('Message')).toBeTruthy();
  });

  // The reason this component exists. A ten percent wash of the tone over a
  // surface lightens the ground in dark mode, leaving danger text at 3.89:1.
  // The tone pairs are the sanctioned alternative, so they must clear AA in
  // both themes or the component is no better than what it replaced.
  it.each(TONES)('keeps the %s pair above AA in both themes', (tone) => {
    for (const [name, theme] of [['light', LightColors], ['dark', DarkColors]] as const) {
      const fg = theme.toneFg[tone];
      const bg = theme.toneBg[tone];
      const ratio = contrast(fg, bg);
      // Named so a failure reports which theme and which colours, not just a number.
      expect(`${name} ${tone} ${fg} on ${bg}: ${ratio.toFixed(2)}:1`).toBe(
        `${name} ${tone} ${fg} on ${bg}: ${Math.max(ratio, 4.5).toFixed(2)}:1`,
      );
    }
  });
});
