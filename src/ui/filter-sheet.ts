import { describeFilter, isValidRange, rangeEndingToday, type DateFilter, type DateRange } from '../domain/date-range';
import { closeDialog, openDialog } from './dialog';
import { icon } from './icons';

export function openFilterSheet(current: DateFilter, onApply: (filter: DateFilter) => void): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'sheet filter-sheet';
  dialog.setAttribute('aria-label', 'Фильтр по датам');
  let ranges = current.ranges.map((range) => ({ ...range }));

  dialog.innerHTML = `
    <div class="sheet__handle" aria-hidden="true"></div>
    <div class="sheet__header">
      <div><p class="eyebrow">История и отчёт</p><h2>Период</h2></div>
      <button class="icon-button" type="button" data-close-filter aria-label="Закрыть">${icon('close')}</button>
    </div>
    <div class="filter-presets" aria-label="Быстрый выбор">
      ${[
        ['today', 'Сегодня'],
        ['14', '14 дней'],
        ['30', '30 дней'],
        ['90', '90 дней'],
        ['all', 'Всё время'],
      ].map(([value, label]) => `<button type="button" data-preset="${value}">${label}${icon('chevron', 16)}</button>`).join('')}
    </div>
    <div class="custom-range">
      <h3>Добавить свой период</h3>
      <div class="date-inputs">
        <label>С<input id="filter-start" type="date" /></label>
        <label>По<input id="filter-end" type="date" /></label>
      </div>
      <p class="field-error" data-filter-error aria-live="polite"></p>
      <button class="secondary-button secondary-button--full" type="button" data-add-range>${icon('plus', 18)} Добавить период</button>
    </div>
    <div class="selected-ranges">
      <div class="selected-ranges__heading"><h3>Выбранные периоды</h3><button class="text-button" type="button" data-reset-filter>Сбросить</button></div>
      <div class="range-chips" data-range-chips></div>
    </div>
    <button class="primary-button primary-button--large primary-button--full" type="button" data-apply-filter>Применить</button>
  `;

  const startInput = dialog.querySelector<HTMLInputElement>('#filter-start')!;
  const endInput = dialog.querySelector<HTMLInputElement>('#filter-end')!;
  const error = dialog.querySelector<HTMLElement>('[data-filter-error]')!;
  const chips = dialog.querySelector<HTMLElement>('[data-range-chips]')!;
  const initialRange = ranges.at(-1) ?? rangeEndingToday(14);
  startInput.value = initialRange.start;
  endInput.value = initialRange.end;

  function renderRanges(): void {
    chips.innerHTML = ranges.length === 0
      ? '<p class="ranges-empty">Добавьте один или несколько периодов</p>'
      : ranges.map((range, index) => `
        <span class="range-chip" data-range-chip>
          ${describeFilter({ all: false, ranges: [range] })}
          <button type="button" data-remove-range="${index}" aria-label="Удалить период ${index + 1}">${icon('close', 15)}</button>
        </span>
      `).join('');
  }

  function apply(filter: DateFilter): void {
    onApply(filter);
    closeDialog(dialog);
  }

  dialog.querySelector('[data-close-filter]')!.addEventListener('click', () => closeDialog(dialog));
  dialog.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      const preset = button.dataset.preset;
      if (preset === 'all') apply({ all: true, ranges: [] });
      else apply({ all: false, ranges: [rangeEndingToday(preset === 'today' ? 1 : Number(preset))] });
    });
  });

  dialog.querySelector('[data-add-range]')!.addEventListener('click', () => {
    const range: DateRange = { start: startInput.value, end: endInput.value };
    if (!isValidRange(range)) {
      error.textContent = 'Начало периода должно быть не позже его конца';
      return;
    }
    error.textContent = '';
    ranges.push(range);
    renderRanges();
  });

  chips.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-remove-range]');
    if (!button) return;
    ranges.splice(Number(button.dataset.removeRange), 1);
    renderRanges();
  });

  dialog.querySelector('[data-reset-filter]')!.addEventListener('click', () => {
    ranges = [rangeEndingToday(14)];
    error.textContent = '';
    renderRanges();
  });

  dialog.querySelector('[data-apply-filter]')!.addEventListener('click', () => {
    if (ranges.length === 0) {
      error.textContent = 'Добавьте хотя бы один период';
      return;
    }
    apply({ all: false, ranges });
  });

  renderRanges();
  openDialog(dialog);
}
