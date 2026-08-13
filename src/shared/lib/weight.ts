/**
 * Weight parsing for every screen that takes a kilogram figure.
 *
 * Each weight input used to inline its own parser and they disagreed: the batch
 * details step accepted 0 and had no ceiling, the co-sign screen rejected 0 but
 * still had no ceiling, and the processing screens skipped validation entirely.
 * The number entered here becomes a carbon claim on a minted token, so the rules
 * are worth stating once.
 */

/**
 * 1000 kg. Collection runs at handcart and pickup-truck scale, so this never
 * blocks a real batch — it catches the extra digit that turns 100 into 1000.
 * Mirrors maxWeightGrams in core-api; the server rejects anything above it.
 */
export const MAX_WEIGHT_KG = 1000;

export const MAX_WEIGHT_DECIMALS = 2;

export type WeightRejection =
  | 'empty'
  | 'invalid'
  | 'zero'
  | 'negative'
  | 'too_heavy'
  | 'too_many_decimals';

export type ParsedWeight =
  | { ok: true; kg: number }
  | { ok: false; reason: WeightRejection };

/**
 * Constrains what the field will accept as it is typed: digits, one separator,
 * and at most two decimals. Indonesian keyboards produce a comma, so it is kept
 * visible in the field and only normalised when the value is parsed.
 */
export function sanitizeWeightInput(text: string): string {
  let out = '';
  let separatorSeen = false;
  let decimals = 0;

  for (const ch of text) {
    if (ch >= '0' && ch <= '9') {
      if (separatorSeen) {
        if (decimals >= MAX_WEIGHT_DECIMALS) continue;
        decimals += 1;
      }
      out += ch;
      continue;
    }
    if ((ch === '.' || ch === ',') && !separatorSeen && out.length > 0) {
      separatorSeen = true;
      out += ch;
    }
  }

  return out;
}

export function parseWeightKg(text: string): ParsedWeight {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: 'empty' };

  const normalized = trimmed.replace(',', '.');
  if (!/^-?\d*\.?\d*$/.test(normalized) || normalized === '.' || normalized === '-') {
    return { ok: false, reason: 'invalid' };
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) return { ok: false, reason: 'invalid' };
  if (value < 0) return { ok: false, reason: 'negative' };
  if (value === 0) return { ok: false, reason: 'zero' };
  if (value > MAX_WEIGHT_KG) return { ok: false, reason: 'too_heavy' };

  const decimals = normalized.split('.')[1]?.length ?? 0;
  if (decimals > MAX_WEIGHT_DECIMALS) return { ok: false, reason: 'too_many_decimals' };

  return { ok: true, kg: value };
}

const REJECTION_COPY: Record<WeightRejection, string> = {
  empty: 'Enter the weight in kilograms.',
  invalid: 'Use a number, for example 12.5.',
  zero: 'Weight must be greater than 0 kg.',
  negative: 'Weight cannot be negative.',
  too_heavy: `Weight cannot exceed ${MAX_WEIGHT_KG} kg. Check for an extra digit.`,
  too_many_decimals: `Use at most ${MAX_WEIGHT_DECIMALS} decimal places.`,
};

export function weightErrorMessage(reason: WeightRejection): string {
  return REJECTION_COPY[reason];
}

/** Grams is the unit the API and database speak. */
export function weightKgToGrams(kg: number): number {
  return Math.round(kg * 1000);
}
