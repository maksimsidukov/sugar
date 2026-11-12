import { describe, expect, it } from 'vitest';
import type { Measurement, MeasurementType } from './measurement';
import { sortMeasurements, summarize } from './stats';

function item(id: string, type: MeasurementType, value: number, measuredAt: number): Measurement {
  return { id, type, value, measuredAt };
}

describe('sortMeasurements', () => {
  const items = [
    item('later', 'fasting', 5.4, 300),
    item('first-tie', 'after-1h', 6.1, 200),
    item('earlier', 'after-2h', 5.9, 100),
    item('second-tie', 'fasting', 5.2, 200),
  ];

  it('сортирует по возрастанию и убыванию, не меняя источник', () => {
    expect(sortMeasurements(items, 'asc').map(({ id }) => id)).toEqual(['earlier', 'first-tie', 'second-tie', 'later']);
    expect(sortMeasurements(items, 'desc').map(({ id }) => id)).toEqual(['later', 'first-tie', 'second-tie', 'earlier']);
    expect(items[0]?.id).toBe('later');
  });

  it('сохраняет исходный порядок при одинаковом timestamp', () => {
    const result = sortMeasurements(items, 'asc');
    expect(result.slice(1, 3).map(({ id }) => id)).toEqual(['first-tie', 'second-tie']);
  });
});

describe('summarize', () => {
  it('считает количество и среднее отдельно для каждого типа', () => {
    const result = summarize([
      item('1', 'fasting', 5.5, 100),
      item('2', 'fasting', 5.6, 200),
      item('3', 'after-1h', 7.8, 300),
      item('4', 'fasting', 5.5, 400),
    ]);

    expect(result.total).toBe(4);
    expect(result.byType.fasting).toEqual({ count: 3, average: 5.5 });
    expect(result.byType['after-1h']).toEqual({ count: 1, average: 7.8 });
    expect(result.byType['after-2h']).toEqual({ count: 0, average: null });
  });

  it('возвращает пустую статистику без NaN', () => {
    expect(summarize([])).toEqual({
      total: 0,
      byType: {
        fasting: { count: 0, average: null },
        'after-1h': { count: 0, average: null },
        'after-2h': { count: 0, average: null },
      },
    });
  });
});
