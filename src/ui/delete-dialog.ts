import type { Measurement } from '../domain/measurement';
import { formatGlucose, MEASUREMENT_TYPES } from '../domain/measurement';
import { closeDialog, openDialog } from './dialog';
import { icon } from './icons';

export function openDeleteDialog(
  measurement: Measurement,
  onDelete: () => Promise<void>,
): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'sheet confirm-sheet';
  dialog.setAttribute('aria-label', 'Удалить измерение?');
  dialog.innerHTML = `
    <div class="sheet__handle" aria-hidden="true"></div>
    <div class="confirm-icon">${icon('trash', 26)}</div>
    <h2>Удалить измерение?</h2>
    <p class="confirm-copy"></p>
    <p class="field-error" data-delete-error aria-live="polite"></p>
    <div class="confirm-actions">
      <button class="secondary-button" type="button" data-cancel-delete>Отмена</button>
      <button class="danger-button" type="button" data-confirm-delete>Удалить</button>
    </div>
  `;
  dialog.querySelector('.confirm-copy')!.textContent =
    `${MEASUREMENT_TYPES[measurement.type].label}: ${formatGlucose(measurement.value)} ммоль/л. Действие нельзя отменить.`;

  dialog.querySelector('[data-cancel-delete]')!.addEventListener('click', () => closeDialog(dialog));
  const confirm = dialog.querySelector<HTMLButtonElement>('[data-confirm-delete]')!;
  confirm.addEventListener('click', () => {
    confirm.disabled = true;
    confirm.textContent = 'Удаляем…';
    void onDelete()
      .then(() => closeDialog(dialog))
      .catch(() => {
        dialog.querySelector('[data-delete-error]')!.textContent = 'Не удалось удалить запись. Попробуйте ещё раз.';
        confirm.disabled = false;
        confirm.textContent = 'Удалить';
      });
  });

  openDialog(dialog);
}
