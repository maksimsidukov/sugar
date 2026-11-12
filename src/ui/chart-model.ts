import { toLocalDateKey } from '../domain/date-range';
import { MEASUREMENT_TYPES, type Measurement, type MeasurementType } from '../domain/measurement';
import { sortMeasurements } from '../domain/stats';

const LEFT = 40;
const RIGHT = 18;
const TOP = 16;
const HEIGHT = 252;
const PLOT_BOTTOM = 214;
const MIN_DAY_WIDTH = 52;

export interface ChartPoint extends Measurement {
  x: number;
  y: number;
  day: string;
}

export interface ChartDay {
  key: string;
  label: string;
  x: number;
  hitX: number;
  hitWidth: number;
  items: Measurement[];
}

export interface ChartSeries {
  type: MeasurementType;
  color: string;
  points: ChartPoint[];
}

export interface ChartModel {
  width: number;
  height: number;
  plotTop: number;
  plotBottom: number;
  yMin: number;
  yMax: number;
  yTicks: number[];
  days: ChartDay[];
  points: ChartPoint[];
  series: ChartSeries[];
}

export function buildChartModel(items: Measurement[], containerWidth: number): ChartModel {
  const sorted = sortMeasurements(items, 'asc');
  const values = sorted.map((item) => item.value);
  const { yMin, yMax, yTicks } = buildScale(values);
  const dayKeys = [...new Set(sorted.map((item) => toLocalDateKey(item.measuredAt)))];
  const width = Math.max(containerWidth, LEFT + RIGHT + dayKeys.length * MIN_DAY_WIDTH);
  const dayWidth = dayKeys.length === 0 ? MIN_DAY_WIDTH : (width - LEFT - RIGHT) / dayKeys.length;

  const days = dayKeys.map((key, index): ChartDay => {
    const hitX = LEFT + index * dayWidth;
    return {
      key,
      label: `${key.slice(8, 10)}.${key.slice(5, 7)}`,
      x: hitX + dayWidth / 2,
      hitX,
      hitWidth: dayWidth,
      items: sorted.filter((item) => toLocalDateKey(item.measuredAt) === key),
    };
  });

  const dayIndexes = new Map(dayKeys.map((key, index) => [key, index]));
  const points = sorted.map((item): ChartPoint => {
    const day = toLocalDateKey(item.measuredAt);
    const dayIndex = dayIndexes.get(day)!;
    const date = new Date(item.measuredAt);
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
    const fraction = (item.measuredAt - start) / (end - start);
    const inset = Math.min(9, dayWidth / 5);

    return {
      ...item,
      day,
      x: LEFT + dayIndex * dayWidth + inset + fraction * (dayWidth - inset * 2),
      y: TOP + ((yMax - item.value) / (yMax - yMin)) * (PLOT_BOTTOM - TOP),
    };
  });

  return {
    width,
    height: HEIGHT,
    plotTop: TOP,
    plotBottom: PLOT_BOTTOM,
    yMin,
    yMax,
    yTicks,
    days,
    points,
    series: (Object.keys(MEASUREMENT_TYPES) as MeasurementType[]).map((type) => ({
      type,
      color: MEASUREMENT_TYPES[type].color,
      points: points.filter((point) => point.type === type),
    })),
  };
}

function buildScale(values: number[]): { yMin: number; yMax: number; yTicks: number[] } {
  if (values.length === 0) {
    return { yMin: 0, yMax: 10, yTicks: [0, 2, 4, 6, 8, 10] };
  }

  let minimum = Math.min(...values);
  let maximum = Math.max(...values);
  if (maximum - minimum < 4) {
    const center = (maximum + minimum) / 2;
    minimum = Math.max(0, center - 2);
    maximum = center + 2;
  }

  const step = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20]
    .find((candidate) => candidate >= (maximum - minimum) / 8) ?? 20;
  const yMin = Math.floor(minimum / step) * step;
  const yMax = Math.ceil(maximum / step) * step;
  const yTicks = Array.from(
    { length: Math.round((yMax - yMin) / step) + 1 },
    (_, index) => Number((yMin + index * step).toFixed(1)),
  );
  return { yMin, yMax, yTicks };
}
