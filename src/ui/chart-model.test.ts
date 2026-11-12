import { describe, expect, it } from 'vitest';
import type { Measurement, MeasurementType } from '../domain/measurement';
import { buildChartModel } from './chart-model';

function item(id: string, type: MeasurementType, value: number, timestamp: number): Measurement {
  return { id, type, value, measuredAt: timestamp };
}

const morning = new Date(2026, 10, 12, 8).getTime();
const evening = new Date(2026, 10, 12, 20).getTime();
const nextDay = new Date(2026, 10, 13, 9).getTime();

describe('buildChartModel', () => {
  it('сохраняет хронологию и повторные измерения одного типа в день', () => {
    const model = buildChartModel([
      item('evening', 'fasting', 6.1, evening),
      item('next', 'fasting', 5.8, nextDay),
      item('morning', 'fasting', 5.5, morning),
    ], 350);

    expect(model.points.map(({ id }) => id)).toEqual(['morning', 'evening', 'next']);
    expect(model.days.map(({ key }) => key)).toEqual(['2026-11-12', '2026-11-13']);
    expect(model.series[0]?.points).toHaveLength(3);
    expect(model.points[0]!.x).toBeLessThan(model.points[1]!.x);
    expect(model.points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true);
  });

  it('возвращает безопасную пустую модель', () => {
    const model = buildChartModel([], 350);
    expect(model.days).toEqual([]);
    expect(model.points).toEqual([]);
    expect(model.yTicks.length).toBeGreaterThan(0);
    expect(model.yMin).toBeLessThan(model.yMax);
    expect(model.yTicks.every(Number.isFinite)).toBe(true);
  });

  it('строит диапазон оси даже при одинаковых значениях', () => {
    const model = buildChartModel([
      item('one', 'after-1h', 5.6, morning),
      item('two', 'after-1h', 5.6, evening),
    ], 350);
    expect(model.yMin).toBeLessThan(model.yMax);
    expect(model.yTicks).toContain(5.5);
    expect(model.points[0]!.y).toBe(model.points[1]!.y);
    expect(model.yTicks.every(Number.isFinite)).toBe(true);
  });

  it('сохраняет постоянные цвета и пустые отсутствующие серии', () => {
    const model = buildChartModel([item('one', 'after-2h', 6.8, morning)], 350);
    expect(model.series.map(({ type }) => type)).toEqual(['fasting', 'after-1h', 'after-2h']);
    expect(model.series.map(({ color }) => color)).toEqual(['#2a78d6', '#eb6834', '#1baf7a']);
    expect(model.series[0]?.points).toEqual([]);
    expect(model.series[2]?.points).toHaveLength(1);
  });

  it('добавляет горизонтальную прокрутку длинного периода', () => {
    const items = Array.from({ length: 30 }, (_, index) =>
      item(`${index}`, 'fasting', 5.5, new Date(2026, 9, index + 1, 8).getTime()),
    );
    const model = buildChartModel(items, 350);
    expect(model.days).toHaveLength(30);
    expect(model.width).toBeGreaterThan(350);
    expect(model.days[0]!.hitWidth).toBeGreaterThanOrEqual(44);
  });
});
