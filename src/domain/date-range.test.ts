import { describe, expect, it } from 'vitest';
import type { Measurement } from './measurement';
import {
  describeFilter,
  filterMeasurements,
  isValidRange,
  rangeEndingToday,
  toLocalDateKey,
} from './date-range';

function item(id: string, year: number, month: number, day: number, hour = 12): Measurement {
  return {
    id,
    type: 'fasting',
    value: 5.5,
    measuredAt: new Date(year, month - 1, day, hour, 0, 0, 0).getTime(),
  };
}

describe('toLocalDateKey', () => {
  it.each([
    [new Date(2026, 10, 12, 0, 0, 0, 0).getTime(), '2026-11-12'],
    [new Date(2026, 10, 12, 23, 59, 59, 999).getTime(), '2026-11-12'],
    [new Date(2026, 2, 8, 23, 30).getTime(), '2026-03-08'],
    [new Date(2026, 9, 25, 0, 30).getTime(), '2026-10-25'],
  ])('сохраняет локальный календарный день для %s', (timestamp, expected) => {
    expect(toLocalDateKey(timestamp)).toBe(expected);
  });
});

describe('rangeEndingToday', () => {
  const now = new Date(2026, 10, 12, 15, 20).getTime();

  it('строит 14-дневный диапазон, включая сегодня', () => {
    expect(rangeEndingToday(14, now)).toEqual({ start: '2026-10-30', end: '2026-11-12' });
  });

  it('строит диапазон на один день', () => {
    expect(rangeEndingToday(1, now)).toEqual({ start: '2026-11-12', end: '2026-11-12' });
  });

  it('отклоняет неположительную длину', () => {
    expect(() => rangeEndingToday(0, now)).toThrow(RangeError);
  });
});

describe('isValidRange', () => {
  it.each([
    [{ start: '2026-11-01', end: '2026-11-12' }, true],
    [{ start: '2026-11-12', end: '2026-11-12' }, true],
    [{ start: '2026-11-13', end: '2026-11-12' }, false],
    [{ start: '2026-02-30', end: '2026-03-01' }, false],
    [{ start: '30.11.2026', end: '2026-12-01' }, false],
  ])('проверяет диапазон %j', (range, expected) => {
    expect(isValidRange(range)).toBe(expected);
  });
});

describe('filterMeasurements', () => {
  const items = [
    item('before', 2026, 10, 29, 23),
    item('start', 2026, 10, 30, 0),
    item('same-type-morning', 2026, 11, 1, 8),
    item('same-type-evening', 2026, 11, 1, 20),
    item('end', 2026, 11, 12, 23),
    item('after', 2026, 11, 13, 0),
  ];

  it('включает обе границы и все записи одного дня', () => {
    const result = filterMeasurements(items, {
      all: false,
      ranges: [{ start: '2026-10-30', end: '2026-11-12' }],
    });
    expect(result.map(({ id }) => id)).toEqual([
      'start',
      'same-type-morning',
      'same-type-evening',
      'end',
    ]);
  });

  it('объединяет пересекающиеся диапазоны без дублей', () => {
    const result = filterMeasurements(items, {
      all: false,
      ranges: [
        { start: '2026-10-30', end: '2026-11-02' },
        { start: '2026-11-01', end: '2026-11-12' },
      ],
    });
    expect(result).toHaveLength(4);
    expect(new Set(result).size).toBe(4);
  });

  it('возвращает все записи для all и ничего без диапазонов', () => {
    expect(filterMeasurements(items, { all: true, ranges: [] })).toEqual(items);
    expect(filterMeasurements(items, { all: false, ranges: [] })).toEqual([]);
  });
});

describe('describeFilter', () => {
  it('описывает всё время, один период и несколько периодов', () => {
    expect(describeFilter({ all: true, ranges: [] })).toBe('Всё время');
    expect(describeFilter({ all: false, ranges: [{ start: '2026-11-01', end: '2026-11-12' }] })).toBe('01.11.2026 — 12.11.2026');
    expect(describeFilter({ all: false, ranges: [
      { start: '2026-11-01', end: '2026-11-02' },
      { start: '2026-11-10', end: '2026-11-12' },
    ] })).toBe('2 периода');
    expect(describeFilter({ all: false, ranges: [] })).toBe('Нет выбранных дат');
  });
});
