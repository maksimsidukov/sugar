import type { AppState } from '../app-state';
import { describeFilter, filterMeasurements, toLocalDateKey } from '../domain/date-range';
import { formatGlucose, MEASUREMENT_TYPES, type Measurement, type MeasurementType } from '../domain/measurement';
import { sortMeasurements, summarize } from '../domain/stats';
import { renderGlucoseChart } from './chart';
import { formatLongDay, formatTime } from './format';
import { icon } from './icons';

export type HistoryView = 'chart' | 'table';

export function renderHistory(
  container: HTMLElement,
  state: AppState,
  view: HistoryView = 'chart',
): void {
  const items = sortMeasurements(filterMeasurements(state.measurements, state.filter), 'desc');
  const summary = summarize(items);
  const days = [...new Set(items.map((item) => toLocalDateKey(item.measuredAt)))];

  container.innerHTML = `
    <header class="page-header history-header">
      <div><p class="eyebrow">Ваши данные</p><h1>История</h1></div>
      <button class="icon-button header-action" type="button" data-export-report aria-label="Скачать XLSX">${icon('download', 22)}</button>
    </header>
    <button class="filter-button" type="button" data-open-filter>
      <span class="filter-button__icon">${icon('calendar', 20)}</span>
      <span><small>Период</small><strong>${describeFilter(state.filter)}</strong></span>
      ${icon('chevron', 18)}
    </button>

    <section class="section-block history-summary" aria-labelledby="history-summary-title">
      <div class="section-heading">
        <h2 id="history-summary-title">Сводка</h2>
        <span class="count-pill">${summary.total} изм.</span>
      </div>
      <div class="stats-grid">
        ${(Object.keys(MEASUREMENT_TYPES) as MeasurementType[]).map((type) => `
          <article class="stat-card">
            <span class="series-dot series-dot--${type}"></span>
            <strong>${summary.byType[type].average === null ? '—' : formatGlucose(summary.byType[type].average!)}</strong>
            <span class="stat-card__unit">ммоль/л · ${summary.byType[type].count} изм.</span>
            <p>${MEASUREMENT_TYPES[type].label}</p>
          </article>
        `).join('')}
      </div>
    </section>

    ${items.length > 0 ? `
      <section class="section-block chart-section" aria-labelledby="dynamics-title">
        <div class="section-heading chart-heading">
          <h2 id="dynamics-title">Динамика</h2>
          <div class="view-switch" aria-label="Представление данных">
            <button type="button" data-view-chart aria-pressed="${view === 'chart'}" class="${view === 'chart' ? 'active' : ''}">${icon('chart', 18)}<span class="sr-only">График</span></button>
            <button type="button" data-view-table aria-pressed="${view === 'table'}" class="${view === 'table' ? 'active' : ''}">${icon('table', 18)}<span class="sr-only">Таблица</span></button>
          </div>
        </div>
        <div class="chart-card" data-chart-container>
          ${view === 'table' ? renderTable(items) : ''}
        </div>
      </section>
      <section class="section-block" aria-label="Записи по дням">
        <div class="section-heading"><h2>Записи</h2></div>
        <div data-history-list>
          ${days.map((day) => renderDay(day, items.filter((item) => toLocalDateKey(item.measuredAt) === day))).join('')}
        </div>
      </section>
    ` : `
      <section class="empty-state">
        <div class="empty-state__icon">${icon(state.measurements.length === 0 ? 'drop' : 'calendar', 32)}</div>
        <h2>${state.measurements.length === 0 ? 'Пока нет измерений' : 'В этом периоде нет измерений'}</h2>
        <p>${state.measurements.length === 0 ? 'Добавьте первую запись, чтобы увидеть историю и динамику.' : 'Попробуйте выбрать другой период или добавьте новое измерение.'}</p>
        <button class="${state.measurements.length === 0 ? 'primary-button' : 'secondary-button'}" type="button" ${state.measurements.length === 0 ? 'data-action="add"' : 'data-open-filter'}>
          ${state.measurements.length === 0 ? 'Добавить измерение' : 'Изменить период'}
        </button>
      </section>
    `}
  `;

  if (items.length > 0 && view === 'chart') {
    renderGlucoseChart(container.querySelector('[data-chart-container]')!, items);
  }
}

function renderTable(items: Measurement[]): string {
  return `
    <div class="chart-table-wrap">
      <table class="chart-table" data-chart-table>
        <caption>Отфильтрованные измерения глюкозы</caption>
        <thead><tr><th>Дата</th><th>Время</th><th>Тип</th><th>ммоль/л</th></tr></thead>
        <tbody>
          ${items.map((item) => `
            <tr>
              <td>${formatLongDay(item.measuredAt)}</td>
              <td>${formatTime(item.measuredAt)}</td>
              <td><span class="series-dot series-dot--${item.type}"></span>${MEASUREMENT_TYPES[item.type].label}</td>
              <td>${formatGlucose(item.value)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderDay(day: string, items: Measurement[]): string {
  return `
    <section class="history-day">
      <h3>${formatLongDay(items[0]!.measuredAt)}</h3>
      <div class="measurement-list">
        ${items.map((item) => `
          <article class="measurement-row" data-history-item data-day="${day}">
            <span class="measurement-row__line measurement-row__line--${item.type}" aria-hidden="true"></span>
            <div class="measurement-row__main">
              <strong>${MEASUREMENT_TYPES[item.type].label}</strong>
              <span>${formatTime(item.measuredAt)}</span>
            </div>
            <div class="measurement-row__value">${formatGlucose(item.value)}<small>ммоль/л</small></div>
            <button class="icon-button icon-button--muted" type="button" data-delete-id="${item.id}" aria-label="Удалить измерение ${formatGlucose(item.value)}">${icon('trash', 19)}</button>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}
