import { MEASUREMENT_TYPES, parseGlucoseInput, type MeasurementInput, type MeasurementType } from '../domain/measurement';
import { closeDialog, openDialog } from './dialog';
import { icon } from './icons';
import { formatMeasurementDate } from './format';

export function openMeasurementSheet(
  onSave: (input: MeasurementInput) => Promise<void>,
): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'sheet measurement-sheet';
  dialog.setAttribute('aria-label', 'Новое измерение');
  dialog.innerHTML = `
    <div class="sheet__handle" aria-hidden="true"></div>
    <div class="sheet__header">
      <div>
        <p class="eyebrow">Быстрая запись</p>
        <h2>Новое измерение</h2>
      </div>
      <button class="icon-button" type="button" data-close-measurement aria-label="Закрыть">${icon('close')}</button>
    </div>
    <form class="measurement-form" aria-label="Форма нового измерения" novalidate>
      <fieldset class="measurement-types">
        <legend>Когда измерили</legend>
        ${Object.entries(MEASUREMENT_TYPES).map(([type, meta], index) => `
          <label class="type-option type-option--${type}">
            <input type="radio" name="measurement-type" value="${type}" ${index === 0 ? 'checked' : ''} />
            <span class="type-option__mark" aria-hidden="true"></span>
            <span class="type-option__label">${meta.label}</span>
            <span class="type-option__check">${icon('check', 18)}</span>
          </label>
        `).join('')}
      </fieldset>
      <label class="value-label" for="glucose-value">Значение, ммоль/л</label>
      <div class="value-input-wrap">
        <input id="glucose-value" name="glucose" type="text" inputmode="decimal" autocomplete="off" placeholder="5,6" maxlength="4" aria-describedby="glucose-hint glucose-error" />
        <span>ммоль/л</span>
      </div>
      <p id="glucose-hint" class="field-hint">Например, 5,6 — один знак после запятой</p>
      <p id="glucose-error" class="field-error" aria-live="polite"></p>
      <div class="measurement-time">
        ${icon('calendar', 20)}
        <span>${formatMeasurementDate(Date.now())}</span>
      </div>
      <button class="primary-button primary-button--large" type="submit" data-save-measurement>Сохранить</button>
    </form>
  `;

  const form = dialog.querySelector<HTMLFormElement>('form')!;
  const input = dialog.querySelector<HTMLInputElement>('#glucose-value')!;
  const error = dialog.querySelector<HTMLParagraphElement>('#glucose-error')!;
  const submit = dialog.querySelector<HTMLButtonElement>('[data-save-measurement]')!;
  let saving = false;

  dialog.querySelector('[data-close-measurement]')!.addEventListener('click', () => closeDialog(dialog));
  input.addEventListener('input', () => {
    error.textContent = '';
    input.removeAttribute('aria-invalid');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (saving) return;

    const value = parseGlucoseInput(input.value);
    if (value === null) {
      error.textContent = 'Введите число с одним знаком после запятой (от 0,1 до 99,9)';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }

    saving = true;
    submit.disabled = true;
    submit.textContent = 'Сохраняем…';
    const type = new FormData(form).get('measurement-type') as MeasurementType;

    void onSave({ type, value, measuredAt: Date.now() })
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
