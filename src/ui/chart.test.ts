// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import type { Measurement } from '../domain/measurement';
import { renderGlucoseChart } from './chart';

function item(id: string, type: Measurement['type'], value: number, measuredAt: number): Measurement {
  return { id, type, value, measuredAt };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('SVG-график', () => {
  it('рисует фактические точки, легенду и общий tooltip по фокусу дня', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const day = new Date(2026, 10, 12, 8).getTime();
    renderGlucoseChart(container, [
      item('one', 'fasting', 5.6, day),
      item('two', 'after-1h', 7.2, day + 60 * 60 * 1000),
      item('three', 'fasting', 5.8, day + 2 * 60 * 60 * 1000),
    ], 350);

    expect(container.querySelectorAll('svg')).toHaveLength(1);
    expect(container.querySelectorAll('[data-chart-point]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-legend-item]')).toHaveLength(3);
    expect(container.querySelector('[data-series-type="fasting"]')?.getAttribute('stroke')).toBe('#2a78d6');

    const hit = container.querySelector<SVGGElement>('[data-chart-day]')!;
    hit.dispatchEvent(new Event('focus'));
    const tooltip = container.querySelector('[data-chart-tooltip]')!;
    expect(tooltip.getAttribute('hidden')).toBeNull();
    expect(tooltip.textContent).toContain('5,6');
    expect(tooltip.textContent).toContain('7,2');
    expect(tooltip.textContent).toContain('1 ч после еды');

    hit.dispatchEvent(new Event('blur'));
    expect(tooltip.hasAttribute('hidden')).toBe(true);
  });
});
