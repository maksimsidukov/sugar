export const MEASUREMENT_TYPES = {
  fasting: { label: 'Натощак', color: '#2a78d6' },
  'after-1h': { label: '1 ч после еды', color: '#eb6834' },
  'after-2h': { label: '2 ч после еды', color: '#1baf7a' },
} as const;

export type MeasurementType = keyof typeof MEASUREMENT_TYPES;

export interface Measurement {
  id: string;
  type: MeasurementType;
  value: number;
  measuredAt: number;
}

export type MeasurementInput = Omit<Measurement, 'id'>;

export function parseGlucoseInput(raw: string): number | null {
  const normalized = raw.trim();
  if (!/^\d{1,2}[,.]\d$/.test(normalized)) return null;

  const value = Number(normalized.replace(',', '.'));
  return Number.isFinite(value) && value >= 0.1 && value <= 99.9 ? value : null;
}

export function formatGlucose(value: number): string {
  return value.toFixed(1).replace('.', ',');
}
