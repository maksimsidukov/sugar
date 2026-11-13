import { describe, expect, it } from 'vitest';
import { formatGlucose, parseGlucoseInput, parseMeasurementDateTime, toDateInputValue, toTimeInputValue } from './measurement';

describe('parseGlucoseInput', () => {
  it.each([
    ['5,6', 5.6],
    [' 12,0 ', 12],
    ['7.8', 7.8],
    ['5', 5],
    ['12', 12],
    ['5,67', 5.67],
    ['0,01', 0.01],
    ['0,1', 0.1],
    ['99,9', 99.9],
    ['99,99', 99.99],
  ])('принимает %s как %f', (raw, expected) => {
    expect(parseGlucoseInput(raw)).toBe(expected);
  });

  it.each([
    '',
    ' ',
    '5,',
    ',6',
    '5,678',
    '1,2,3',
    '1.2.3',
    'abc',
    'NaN',
    'Infinity',
    '-5,0',
    '0',
    '0,0',
    '0,00',
    '100',
    '100,0',
  ])('отклоняет некорректное значение %s', (raw) => {
    expect(parseGlucoseInput(raw)).toBeNull();
  });
});

describe('formatGlucose', () => {
  it('использует запятую и убирает лишний второй знак после неё', () => {
    expect(formatGlucose(5.6)).toBe('5,6');
    expect(formatGlucose(5.67)).toBe('5,67');
    expect(formatGlucose(12)).toBe('12,0');
  });
});

describe('toDateInputValue / toTimeInputValue', () => {
  it('форматирует локальные дату и время для input', () => {
    const timestamp = new Date(2026, 10, 13, 9, 5).getTime();
    expect(toDateInputValue(timestamp)).toBe('2026-11-13');
    expect(toTimeInputValue(timestamp)).toBe('09:05');
  });
});

describe('parseMeasurementDateTime', () => {
  it('собирает timestamp из даты и времени', () => {
    expect(parseMeasurementDateTime('2026-11-13', '09:05')).toBe(new Date(2026, 10, 13, 9, 5).getTime());
  });

  it('является обратной к toDateInputValue/toTimeInputValue', () => {
    const timestamp = new Date(2026, 0, 2, 23, 59).getTime();
    expect(parseMeasurementDateTime(toDateInputValue(timestamp), toTimeInputValue(timestamp))).toBe(timestamp);
  });

  it.each([
    ['', ''],
    ['13.11.2026', '09:05'],
    ['2026-11-13', ''],
    ['', '09:05'],
    ['2026-11-13', '9:5'],
    ['2026-13-13', '09:05'],
    ['2026-11-32', '09:05'],
    ['2026-02-30', '09:05'],
    ['2026-11-13', '24:00'],
    ['2026-11-13', '12:60'],
  ])('отклоняет некорректные дату/время %s %s', (date, time) => {
    expect(parseMeasurementDateTime(date, time)).toBeNull();
  });
});
