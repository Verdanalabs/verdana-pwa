import {
  MAX_WEIGHT_KG,
  parseWeightKg,
  sanitizeWeightInput,
  weightErrorMessage,
  weightKgToGrams,
} from '@/src/shared/lib/weight';

describe('parseWeightKg', () => {
  it('accepts a plain weight', () => {
    expect(parseWeightKg('10')).toEqual({ ok: true, kg: 10 });
  });

  it('accepts an Indonesian decimal comma', () => {
    expect(parseWeightKg('6,5')).toEqual({ ok: true, kg: 6.5 });
  });

  it('accepts two decimal places', () => {
    expect(parseWeightKg('12.75')).toEqual({ ok: true, kg: 12.75 });
  });

  it('accepts exactly the cap', () => {
    expect(parseWeightKg(String(MAX_WEIGHT_KG))).toEqual({ ok: true, kg: MAX_WEIGHT_KG });
  });

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['abc', 'invalid'],
    ['.', 'invalid'],
    ['0', 'zero'],
    ['0.00', 'zero'],
    ['-1', 'negative'],
    ['1001', 'too_heavy'],
    ['1.234', 'too_many_decimals'],
  ] as const)('rejects %p as %p', (input, reason) => {
    expect(parseWeightKg(input)).toEqual({ ok: false, reason });
  });

  it('gives every rejection a message', () => {
    const reasons = ['empty', 'invalid', 'zero', 'negative', 'too_heavy', 'too_many_decimals'] as const;
    for (const reason of reasons) {
      expect(weightErrorMessage(reason)).toEqual(expect.any(String));
      expect(weightErrorMessage(reason).length).toBeGreaterThan(0);
    }
  });
});

describe('sanitizeWeightInput', () => {
  it('strips letters and symbols', () => {
    expect(sanitizeWeightInput('12a.5kg!')).toBe('12.5');
  });

  it('keeps only the first separator', () => {
    expect(sanitizeWeightInput('12.5.7')).toBe('12.57');
  });

  it('caps decimals at two as the operator types', () => {
    expect(sanitizeWeightInput('12.3456')).toBe('12.34');
  });

  it('drops a leading separator so "." never becomes a value', () => {
    expect(sanitizeWeightInput('.5')).toBe('5');
  });

  it('cannot produce a negative', () => {
    expect(sanitizeWeightInput('-10')).toBe('10');
  });

  it('preserves the comma the Indonesian keyboard emits', () => {
    expect(sanitizeWeightInput('6,5')).toBe('6,5');
  });
});

describe('weightKgToGrams', () => {
  it('converts to the integer grams the API speaks', () => {
    expect(weightKgToGrams(10)).toBe(10_000);
    expect(weightKgToGrams(12.5)).toBe(12_500);
    expect(weightKgToGrams(0.25)).toBe(250);
  });
});
