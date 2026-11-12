import type { Measurement } from './measurement';

export type LocalDate = string;

export interface DateRange {
  start: LocalDate;
  end: LocalDate;
}

export interface DateFilter {
  all: boolean;
  ranges: DateRange[];
}

export function toLocalDateKey(timestamp: number): LocalDate {
  const date = new Date(timestamp);
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function rangeEndingToday(days: number, now = Date.now()): DateRange {
  if (!Number.isInteger(days) || days < 1) {
    throw new RangeError('Длина периода должна быть положительным целым числом');
  }

  const start = new Date(now);
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);
  return { start: toLocalDateKey(start.getTime()), end: toLocalDateKey(now) };
}

export function isValidRange(range: DateRange): boolean {
  if (!isLocalDate(range.start) || !isLocalDate(range.end)) return false;
  return range.start <= range.end;
}

function isLocalDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day, 12);
  return toLocalDateKey(date.getTime()) === value;
}

export function filterMeasurements(items: Measurement[], filter: DateFilter): Measurement[] {
  if (filter.all) return [...items];
  if (filter.ranges.length === 0) return [];

  return items.filter((item) => {
    const date = toLocalDateKey(item.measuredAt);
    return filter.ranges.some((range) =>
      isValidRange(range) && date >= range.start && date <= range.end,
    );
  });
}

export function describeFilter(filter: DateFilter): string {
  if (filter.all) return 'Всё время';
  if (filter.ranges.length === 0) return 'Нет выбранных дат';
  if (filter.ranges.length > 1) {
    const count = filter.ranges.length;
    const lastTwo = count % 100;
    const last = count % 10;
    const suffix = lastTwo >= 11 && lastTwo <= 14
      ? 'периодов'
      : last === 1
        ? 'период'
        : last >= 2 && last <= 4
          ? 'периода'
          : 'периодов';
    return `${count} ${suffix}`;
  }

  const range = filter.ranges[0]!;
  const start = formatLocalDate(range.start);
  return range.start === range.end ? start : `${start} — ${formatLocalDate(range.end)}`;
}

function formatLocalDate(value: LocalDate): string {
  const [year, month, day] = value.split('-');
  return `${day}.${month}.${year}`;
}
