import type { AppState } from '../app-state';
import { filterMeasurements, rangeEndingToday } from '../domain/date-range';
import { formatGlucose, MEASUREMENT_TYPES, type MeasurementType } from '../domain/measurement';
import { summarize } from '../domain/stats';
import { formatMeasurementDate, formatTime } from './format';
import { icon } from './icons';

export function renderDashboard(container: HTMLElement, state: AppState): void {
  const latest = state.measurements[0];
  const weekItems = filterMeasurements(state.measurements, {
    all: false,
    ranges: [rangeEndingToday(7)],
  });
  const week = summarize(weekItems);

  container.innerHTML = `
    <header class="app-header">
      <div class="brand-mark">${icon('drop', 28)}</div>
      <div>
        <h1>Сахар</h1>
        <p>Дневник глюкозы</p>
      </div>
    </header>

    <section class="hero-card ${latest ? 'hero-card--filled' : ''}">
      <div class="hero-card__glow" aria-hidden="true"></div>
      <p class="hero-card__eyebrow">${latest ? 'Последнее измерение' : 'Ваш дневник начинается здесь'}</p>
      ${latest ? `
        <div class="hero-reading">
          <strong data-testid="latest-value">${formatGlucose(latest.value)}</strong>
          <span>ммоль/л</span>
        </div>
        <div class="hero-meta">
          <span class="measurement-badge measurement-badge--${latest.type}">
            <span class="series-dot series-dot--${latest.type}"></span>
            <span data-testid="latest-type">${MEASUREMENT_TYPES[latest.type].label}</span>
          </span>
          <span>${formatMeasurementDate(latest.measuredAt)}</span>
        </div>
      ` : `
        <div class="empty-illustration" aria-hidden="true">${icon('drop', 42)}</div>
        <h2>Пока нет измерений</h2>
        <p class="hero-empty-copy">Добавьте первое значение — это займёт всего несколько секунд.</p>
      `}
      <button class="primary-button primary-button--large hero-add" type="button" data-testid="dashboard-add">
        ${icon('plus', 22)} Добавить измерение
      </button>
    </section>

    <section class="section-block" aria-labelledby="week-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Короткая сводка</p>
          <h2 id="week-title">Последние 7 дней</h2>
        </div>
        <span class="count-pill">${week.total} изм.</span>
      </div>
      <div class="stats-grid">
        ${(Object.keys(MEASUREMENT_TYPES) as MeasurementType[]).map((type) => `
          <article class="stat-card">
            <span class="series-dot series-dot--${type}"></span>
            <strong>${week.byType[type].average === null ? '—' : formatGlucose(week.byType[type].average!)}</strong>
            <span class="stat-card__unit">ммоль/л</span>
            <p>${MEASUREMENT_TYPES[type].label}</p>
          </article>
        `).join('')}
      </div>
    </section>

    ${state.measurements.length > 0 ? `
      <section class="section-block" aria-labelledby="recent-title">
        <div class="section-heading">
          <h2 id="recent-title">Недавние записи</h2>
          <button class="text-button" type="button" data-tab="history">Все ${icon('chevron', 16)}</button>
        </div>
        <div class="measurement-list">
          ${state.measurements.slice(0, 4).map((item) => `
            <article class="measurement-row" data-testid="recent-measurement">
              <span class="measurement-row__line measurement-row__line--${item.type}" aria-hidden="true"></span>
              <div class="measurement-row__main">
                <strong>${MEASUREMENT_TYPES[item.type].label}</strong>
                <span>${formatMeasurementDate(item.measuredAt)}</span>
              </div>
              <div class="measurement-row__value">${formatGlucose(item.value)}<small>ммоль/л</small></div>
              <button class="icon-button icon-button--muted" type="button" data-delete-id="${item.id}" aria-label="Удалить измерение ${formatGlucose(item.value)}">${icon('trash', 19)}</button>
            </article>
          `).join('')}
        </div>
      </section>
    ` : ''}

    <details class="install-card">
      <summary>
        <span class="install-card__icon">${icon('share', 22)}</span>
        <span><strong>Установить на iPhone</strong><small>Всегда под рукой, работает офлайн</small></span>
        ${icon('chevron', 18)}
      </summary>
      <p>Откройте сайт в Safari, нажмите <strong>«Поделиться»</strong>, затем <strong>«На экран “Домой”»</strong>.</p>
    </details>

    <div class="privacy-note">
      ${icon('shield', 20)}
      <p><strong>Только на вашем устройстве.</strong><br />Записи не отправляются на сервер.</p>
    </div>
  `;
}
