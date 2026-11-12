import { rangeEndingToday, type DateFilter } from './domain/date-range';
import type { Measurement } from './domain/measurement';
import { sortMeasurements } from './domain/stats';

export type AppTab = 'dashboard' | 'history';

export interface AppState {
  measurements: Measurement[];
  activeTab: AppTab;
  filter: DateFilter;
}

export function createDefaultState(measurements: Measurement[], now = Date.now()): AppState {
  return {
    measurements: sortMeasurements(measurements, 'desc'),
    activeTab: 'dashboard',
    filter: { all: false, ranges: [rangeEndingToday(14, now)] },
  };
}

export function addMeasurementToState(state: AppState, measurement: Measurement): AppState {
  return {
    ...state,
    measurements: sortMeasurements([...state.measurements, measurement], 'desc'),
  };
}

export function removeMeasurementFromState(state: AppState, id: string): AppState {
  return {
    ...state,
    measurements: state.measurements.filter((item) => item.id !== id),
  };
}
