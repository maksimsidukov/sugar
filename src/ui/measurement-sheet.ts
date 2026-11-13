import {
  formatGlucose,
  MEASUREMENT_TYPES,
  parseGlucoseInput,
  parseMeasurementDateTime,
  toDateInputValue,
  toTimeInputValue,
  type Measurement,
  type MeasurementInput,
  type MeasurementType,
} from '../domain/measurement';
import { closeDialog, openDialog } from './dialog';
import { icon } from './icons';

export function openMeasurementSheet(
  onSave: (input: MeasurementInput) => Promise<void>,
  measurement?: Measurement,
): void {
  const isEdit = measurement !== undefined;
  const dialog = document.createElement('dialog');
  dialog.className = 'sheet measurement-sheet';
  dialog.setAttribute('aria-label', isEdit ? 'Редактирование измерения' : 'Новое измерение');
  dialog.innerHTML = `
    <div class="sheet__handle" aria-hidden="true"></div>
    <div class="sheet__header">
      <div>
        <p class="eyebrow">${isEdit ? 'Изменить запись' : 'Быстрая запись'}</p>
        <h2>${isEdit ? 'Редактирование' : 'Новое измерение'}</h2>
      </div>
      <button class="icon-button" type="button" data-close-measurement aria-label="Закрыть">${icon('close')}</button>
    </div>
    <form class="measurement-form" aria-label="${isEdit ? 'Форма редактирования измерения' : 'Форма нового измерения'}" novalidate>
      <fieldset class="measurement-types">
        <legend>Когда измерили</legend>
        ${Object.entries(MEASUREMENT_TYPES).map(([type, meta], index) => `
          <label class="type-option type-option--${type}">
            <input type="radio" name="measurement-type" value="${type}" ${(measurement ? measurement.type === type : index === 0) ? 'checked' : ''} />
            <span class="type-option__mark" aria-hidden="true"></span>
            <span class="type-option__label">${meta.label}</span>
            <span class="type-option__check">${icon('check', 18)}</span>
          </label>
        `).join('')}
      </fieldset>
      <label class="value-label" for="glucose-value">Значение, ммоль/л</label>
      <div class="value-input-wrap">
        <input id="glucose-value" name="glucose" type="text" inputmode="decimal" autocomplete="off" placeholder="5,6" maxlength="4" ${measurement ? `value="${formatGlucose(measurement.value)}"` : ''} aria-describedby="glucose-hint glucose-error" />
        <span>ммоль/л</span>
      </div>
      <p id="glucose-hint" class="field-hint">Например, 6 или 5,6 — целое или один знак после запятой</p>
      <p id="glucose-error" class="field-error" aria-live="polite"></p>
      <fieldset class="measurement-datetime">
        <legend>Дата и время измерения</legend>
        <label class="datetime-field">
          <span>Дата</span>
          <input id="measurement-date" name="measurement-date" type="date" required aria-describedby="datetime-error" />
        </label>
        <label class="datetime-field">
          <span>Время</span>
          <input id="measurement-time" name="measurement-time" type="time" required aria-describedby="datetime-error" />
        </label>
      </fieldset>
      <p id="datetime-error" class="field-error" aria-live="polite"></p>
      <button class="primary-button primary-button--large" type="submit" data-save-measurement>Сохранить</button>
    </form>
  `;

  const form = dialog.querySelector<HTMLFormElement>('form')!;
  const input = dialog.querySelector<HTMLInputElement>('#glucose-value')!;
  const error = dialog.querySelector<HTMLParagraphElement>('#glucose-error')!;
  const dateInput = dialog.querySelector<HTMLInputElement>('#measurement-date')!;
  const timeInput = dialog.querySelector<HTMLInputElement>('#measurement-time')!;
  const datetimeError = dialog.querySelector<HTMLParagraphElement>('#datetime-error')!;
  const submit = dialog.querySelector<HTMLButtonElement>('[data-save-measurement]')!;
  let saving = false;

  const initialTimestamp = measurement ? measurement.measuredAt : Date.now();
  dateInput.value = toDateInputValue(initialTimestamp);
  timeInput.value = toTimeInputValue(initialTimestamp);

  dialog.querySelector('[data-close-measurement]')!.addEventListener('click', () => closeDialog(dialog));
  input.addEventListener('input', () => {
    error.textContent = '';
    input.removeAttribute('aria-invalid');
  });
  for (const field of [dateInput, timeInput]) {
    field.addEventListener('input', () => {
      datetimeError.textContent = '';
      dateInput.removeAttribute('aria-invalid');
      timeInput.removeAttribute('aria-invalid');
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (saving) return;

    const value = parseGlucoseInput(input.value);
    if (value === null) {
      error.textContent = 'Введите число от 0,1 до 99,9 — целое или с одним знаком после запятой';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }

    const measuredAt = parseMeasurementDateTime(dateInput.value, timeInput.value);
    if (measuredAt === null) {
      datetimeError.textContent = 'Укажите корректные дату и время измерения';
      dateInput.setAttribute('aria-invalid', 'true');
      timeInput.setAttribute('aria-invalid', 'true');
      dateInput.focus();
      return;
    }

    saving = true;
    submit.disabled = true;
    submit.textContent = 'Сохраняем…';
    const type = new FormData(form).get('measurement-type') as MeasurementType;

    void onSave({ type, value, measuredAt })
      .then(() => closeDialog(dialog))
      .catch(() => {
        error.textContent = 'Не удалось сохранить. Проверьте доступ к хранилищу и попробуйте ещё раз.';
        saving = false;
        submit.disabled = false;
        submit.textContent = 'Сохранить';
      });
  });

  openDialog(dialog);
  input.focus();
}
