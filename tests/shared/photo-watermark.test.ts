import { bytesToHex, watermarkLines } from '@/src/shared/lib/photo-watermark';

// Canvas drawing needs a real browser, so what is asserted here is the part that
// carries meaning: the exact evidence lines burned into the photo, and the hex
// encoding of the hash that has to match what core-api recomputes from R2.

describe('watermarkLines', () => {
  const meta = {
    timestampIso: '2026-08-09T04:30:00.000Z',
    latitude: -3.2241,
    longitude: 104.6482,
    weightKg: 10,
    category: 'organic',
    operatorId: '99999999-8888-7777-6666-555555555555',
    stationLabel: 'PVP Cempaka Putih',
  };

  it('stamps timestamp, coordinates, weight, category, operator and station', () => {
    expect(watermarkLines(meta)).toEqual([
      '2026-08-09T04:30:00.000Z',
      '-3.22410, 104.64820',
      '10.00 kg  ·  ORGANIC',
      'OP 99999999  ·  PVP Cempaka Putih',
    ]);
  });

  it('shows the weight to two decimals so it matches the submitted figure', () => {
    expect(watermarkLines({ ...meta, weightKg: 6.5 })[2]).toBe('6.50 kg  ·  ORGANIC');
  });

  it('drops the station when the operator has no active site', () => {
    const lines = watermarkLines({ ...meta, stationLabel: undefined });
    expect(lines[3]).toBe('OP 99999999');
  });

  it('renders coordinates at five decimals, roughly one metre', () => {
    const lines = watermarkLines({ ...meta, latitude: 0.1, longitude: -0.2 });
    expect(lines[1]).toBe('0.10000, -0.20000');
  });
});

describe('bytesToHex', () => {
  it('produces lowercase, zero-padded hex — the form the API validates', () => {
    const buffer = new Uint8Array([0, 15, 16, 255]).buffer;
    expect(bytesToHex(buffer)).toBe('000f10ff');
  });
});
