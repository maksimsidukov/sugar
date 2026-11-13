import { describe, expect, it } from 'vitest';
import type { Measurement } from './domain/measurement';
import { addMeasurementToState, createDefaultState, removeMeasurementFromState, updateMeasurementInState } from './app-state';

function item(id: string, measuredAt: number): Measurement {
  return { id, type: 'fasting', value: 5.5, measuredAt };
}

describe('AppState', () => {
  it('по умолчанию открывает обзор и последние 14 дней', () => {
    const now = new Date(2026, 10, 12, 15).getTime();
    expect(createDefaultState([], now)).toEqual({
      measurements: [],
      activeTab: 'dashboard',
      filter: { all: false, ranges: [{ start: '2026-10-30', end: '2026-11-12' }] },
    });
  });

  it('добавляет запись в общее состояние в порядке убывания', () => {
    const state = createDefaultState([item('old', 100)]);
    const next = addMeasurementToState(state, item('new', 200));
    expect(next.measurements.map(({ id }) => id)).toEqual(['new', 'old']);
    expect(state.measurements.map(({ id }) => id)).toEqual(['old']);
    expect(next.filter).toBe(state.filter);
  });

  it('удаляет только выбранную запись из общего состояния', () => {
    const state = createDefaultState([item('one', 100), item('two', 200)]);
    const next = removeMeasurementFromState(state, 'one');
    expect(next.measurements.map(({ id }) => id)).toEqual(['two']);
  });

  it('обновляет запись и пересортировывает по новой дате', () => {
    const state = createDefaultState([item('one', 100), item('two', 200)]);
    const next = updateMeasurementInState(state, { ...item('one', 300), value: 8.1 });
    expect(next.measurements.map(({ id }) => id)).toEqual(['one', 'two']);
    expect(next.measurements[0]?.value).toBe(8.1);
    expect(state.measurements.map(({ id }) => id)).toEqual(['two', 'one']);
  });
});
