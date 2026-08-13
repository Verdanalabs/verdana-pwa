import { computeOffsetKg, factorFor, formatOffsetKg } from '@/src/shared/lib/carbon';
import { DEFAULT_FACTORS, rowsToFactors } from '@/src/shared/services/co2-factors';

describe('computeOffsetKg', () => {
  // The PRD acceptance criterion: 10 kg of organic waste reads +6.50 kg CO2e.
  it('meets the 10 kg organic acceptance criterion', () => {
    const offset = computeOffsetKg(10, DEFAULT_FACTORS.organic);
    expect(offset).toBe(6.5);
    expect(formatOffsetKg(offset)).toBe('6.50');
  });

  it.each([
    [12.5, DEFAULT_FACTORS.pet, 22.5],
    [3.33, DEFAULT_FACTORS.cardboard, 4.33],
    [0.25, DEFAULT_FACTORS.mix, 0.45],
  ])('computes %p kg at factor %p as %p', (kg, factor, want) => {
    expect(computeOffsetKg(kg, factor)).toBe(want);
  });

  it.each([
    [0, 0.65],
    [-10, 0.65],
    [10, 0],
    [10, -1],
    [NaN, 0.65],
    [10, NaN],
  ])('never returns a negative or bogus claim for (%p, %p)', (kg, factor) => {
    expect(computeOffsetKg(kg, factor)).toBe(0);
  });
});

describe('formatOffsetKg', () => {
  it('always shows two decimals', () => {
    expect(formatOffsetKg(6.5)).toBe('6.50');
    expect(formatOffsetKg(10)).toBe('10.00');
    expect(formatOffsetKg(0)).toBe('0.00');
  });

  it('clamps a negative to zero rather than printing a negative offset', () => {
    expect(formatOffsetKg(-1)).toBe('0.00');
  });
});

describe('factorFor', () => {
  it('matches the uppercase material codes the app uses', () => {
    expect(factorFor(DEFAULT_FACTORS, 'ORGANIC')).toBe(0.65);
    expect(factorFor(DEFAULT_FACTORS, 'organic')).toBe(0.65);
  });

  it('returns null for a material with no published factor', () => {
    expect(factorFor(DEFAULT_FACTORS, 'PVC')).toBeNull();
    expect(factorFor(DEFAULT_FACTORS, null)).toBeNull();
    expect(factorFor(DEFAULT_FACTORS, '')).toBeNull();
  });
});

describe('rowsToFactors', () => {
  it('lowercases keys so API and app casing agree', () => {
    const factors = rowsToFactors([
      { material: 'ORGANIC', kg_co2e_per_kg: 0.65, updated_at: '2026-01-01T00:00:00Z' },
      { material: 'pet', kg_co2e_per_kg: 2.1, updated_at: '2026-01-01T00:00:00Z' },
    ]);
    expect(factors).toEqual({ organic: 0.65, pet: 2.1 });
  });

  it('drops malformed rows rather than poisoning the table', () => {
    const factors = rowsToFactors([
      { material: 'pet', kg_co2e_per_kg: 2.1, updated_at: '2026-01-01T00:00:00Z' },
      { material: 'bad', kg_co2e_per_kg: -1, updated_at: '2026-01-01T00:00:00Z' },
      { material: 'worse', kg_co2e_per_kg: 'x' as unknown as number, updated_at: '2026-01-01T00:00:00Z' },
    ]);
    expect(factors).toEqual({ pet: 2.1 });
  });
});

// The bundled table is the offline fallback and must not drift from the
// migration, otherwise an offline operator sees a figure the mint contradicts.
describe('DEFAULT_FACTORS', () => {
  it('matches migrations 000033 and 000036', () => {
    expect(DEFAULT_FACTORS).toEqual({
      organic: 0.65,
      // One conservative factor across every polymer, per 000036.
      pet: 1.80,
      hdpe: 1.80,
      ldpe: 1.80,
      pp: 1.80,
      mix: 1.80,
      cardboard: 1.30,
      metal: 1.10,
      glass: 0.25,
    });
  });
});
