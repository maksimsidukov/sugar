import { formatGlucose, MEASUREMENT_TYPES } from '../domain/measurement';
import { buildChartModel, type ChartDay } from './chart-model';
import { formatLongDay, formatTime } from './format';

export function renderGlucoseChart(
  container: HTMLElement,
  items: Parameters<typeof buildChartModel>[0],
  width?: number,
): void {
  const model = buildChartModel(items, width ?? (container.clientWidth || 340));
  container.classList.add('glucose-chart');
  container.innerHTML = `
    <div class="chart-legend" aria-label="Легенда">
      ${model.series.map((series) => `
        <span data-legend-item>
          <span class="legend-line" style="--legend-color:${series.color}"></span>
          ${MEASUREMENT_TYPES[series.type].label}
        </span>
      `).join('')}
    </div>
    <div class="chart-scroll" data-chart-scroll>
      <svg width="${model.width}" height="${model.height}" viewBox="0 0 ${model.width} ${model.height}" role="img" aria-label="Измерения глюкозы по дням. Значения также доступны в таблице.">
        <g class="chart-grid" aria-hidden="true">
          ${model.yTicks.map((tick) => {
            const y = model.plotTop + ((model.yMax - tick) / (model.yMax - model.yMin)) * (model.plotBottom - model.plotTop);
            return `<line x1="40" x2="${model.width - 18}" y1="${y}" y2="${y}" /><text x="32" y="${y + 4}" text-anchor="end">${String(tick).replace('.', ',')}</text>`;
          }).join('')}
        </g>
        <g class="chart-series" aria-hidden="true">
          ${model.series.map((series) => `
            ${series.points.length > 1 ? `<path data-series-type="${series.type}" stroke="${series.color}" d="${series.points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')}" />` : `<path data-series-type="${series.type}" stroke="${series.color}" d="" />`}
            ${series.points.map((point) => `<circle data-chart-point data-type="${point.type}" cx="${point.x}" cy="${point.y}" r="4" fill="${series.color}" />`).join('')}
          `).join('')}
        </g>
        <line class="chart-crosshair" data-crosshair y1="${model.plotTop}" y2="${model.plotBottom}" hidden />
        <g class="chart-days">
          ${model.days.map((day, index) => `
            <g data-chart-day data-day-index="${index}" tabindex="0" role="button">
              <rect x="${day.hitX}" y="${model.plotTop}" width="${day.hitWidth}" height="${model.plotBottom - model.plotTop}" />
              <text x="${day.x}" y="240" text-anchor="middle" aria-hidden="true">${day.label}</text>
            </g>
          `).join('')}
        </g>
      </svg>
    </div>
    <div class="chart-tooltip" data-chart-tooltip hidden aria-live="polite"></div>
  `;

  const crosshair = container.querySelector<SVGLineElement>('[data-crosshair]')!;
  const tooltip = container.querySelector<HTMLElement>('[data-chart-tooltip]')!;
  const scroll = container.querySelector<HTMLElement>('[data-chart-scroll]')!;
  const hits = [...container.querySelectorAll<SVGGElement>('[data-chart-day]')];

  function hideDay(): void {
    crosshair.setAttribute('hidden', '');
    tooltip.setAttribute('hidden', '');
  }

  function showDay(day: ChartDay): void {
    crosshair.setAttribute('x1', String(day.x));
    crosshair.setAttribute('x2', String(day.x));
    crosshair.removeAttribute('hidden');
    tooltip.replaceChildren();

    const title = document.createElement('strong');
    title.className = 'chart-tooltip__title';
    title.textContent = formatLongDay(day.items[0]!.measuredAt);
    tooltip.append(title);

    for (const item of day.items) {
      const row = document.createElement('div');
      row.className = 'chart-tooltip__row';
      const key = document.createElement('span');
      key.className = `series-dot series-dot--${item.type}`;
      const value = document.createElement('b');
      value.textContent = `${formatGlucose(item.value)} ммоль/л`;
      const label = document.createElement('span');
      label.textContent = `${MEASUREMENT_TYPES[item.type].label}, ${formatTime(item.measuredAt)}`;
      row.append(key, value, label);
      tooltip.append(row);
    }
    tooltip.removeAttribute('hidden');
  }

  hits.forEach((hit, index) => {
    const day = model.days[index]!;
    hit.setAttribute('aria-label', `${formatLongDay(day.items[0]!.measuredAt)}. ${day.items.map((item) => `${MEASUREMENT_TYPES[item.type].label}: ${formatGlucose(item.value)}`).join(', ')}`);
    hit.addEventListener('focus', () => showDay(day));
    hit.addEventListener('blur', hideDay);
    hit.addEventListener('pointerdown', () => showDay(day));
    hit.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'mouse') showDay(day);
    });
    hit.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse' && document.activeElement !== hit) hideDay();
    });
    hit.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const nextIndex = Math.max(0, Math.min(hits.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)));
      hits[nextIndex]?.focus();
    });
  });

  requestAnimationFrame(() => {
    scroll.scrollLeft = scroll.scrollWidth;
  });
}
