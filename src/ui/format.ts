import { toLocalDateKey } from '../domain/date-range';

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
});

const dayFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
});

const fullDayFormatter = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export function formatTime(timestamp: number): string {
  return timeFormatter.format(timestamp);
}

export function formatDay(timestamp: number): string {
  const date = toLocalDateKey(timestamp);
  const today = toLocalDateKey(Date.now());
  const yesterdayDate = new Date();
  yesterdayDate.setHours(12, 0, 0, 0);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  if (date === today) return 'Сегодня';
  if (date === toLocalDateKey(yesterdayDate.getTime())) return 'Вчера';
  return dayFormatter.format(timestamp);
}

export function formatLongDay(timestamp: number): string {
  const formatted = fullDayFormatter.format(timestamp);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatMeasurementDate(timestamp: number): string {
  return `${formatDay(timestamp)} в ${formatTime(timestamp)}`;
}
