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
  if (!/^\d{1,2}([,.]\d)?$/.test(normalized)) return null;

  const value = Number(normalized.replace(',', '.'));
  return Number.isFinite(value) && value >= 0.1 && value <= 99.9 ? value : null;
}

export function formatGlucose(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_INPUT_PATTERN = /^(\d{2}):(\d{2})$/;

export function toDateInputValue(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function toTimeInputValue(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function parseMeasurementDateTime(dateValue: string, timeValue: string): number | null {
  const dateMatch = DATE_INPUT_PATTERN.exec(dateValue);
  const timeMatch = TIME_INPUT_PATTERN.exec(timeValue);
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hours > 23 || minutes > 59) return null;

  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date.getTime();
}
