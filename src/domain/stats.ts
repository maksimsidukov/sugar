import { MEASUREMENT_TYPES, type Measurement, type MeasurementType } from './measurement';

export interface TypeSummary {
  count: number;
  average: number | null;
}

export interface MeasurementsSummary {
  total: number;
  byType: Record<MeasurementType, TypeSummary>;
}

export function sortMeasurements(
  items: Measurement[],
  direction: 'asc' | 'desc',
): Measurement[] {
  const sign = direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => (a.measuredAt - b.measuredAt) * sign);
}

export function summarize(items: Measurement[]): MeasurementsSummary {
  const byType = Object.fromEntries(
    Object.keys(MEASUREMENT_TYPES).map((type) => [type, { count: 0, totalValue: 0 }]),
  ) as Record<MeasurementType, { count: number; totalValue: number }>;

  for (const item of items) {
    byType[item.type].count += 1;
    byType[item.type].totalValue += item.value;
  }

  return {
    total: items.length,
    byType: Object.fromEntries(
      Object.entries(byType).map(([type, summary]) => [type, {
        count: summary.count,
        average: summary.count === 0
          ? null
          : Math.round((summary.totalValue / summary.count) * 10) / 10,
      }]),
    ) as Record<MeasurementType, TypeSummary>,
  };
}
