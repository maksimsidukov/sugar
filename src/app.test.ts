// @vitest-environment jsdom

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMeasurementRepository, type MeasurementRepository } from './data/db';
import { startApp } from './app';

let repository: MeasurementRepository;

function element<T extends HTMLElement = HTMLElement>(selector: string): T {
  const result = document.querySelector<T>(selector);
  if (!result) throw new Error(`Элемент не найден: ${selector}`);
  return result;
}

function submitForm() {
  element<HTMLFormElement>('form[aria-label="Форма нового измерения"]').dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true }),
  );
}

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  repository = createMeasurementRepository(`sugar-ui-${crypto.randomUUID()}`);
});

afterEach(() => {
  repository.close();
  vi.restoreAllMocks();
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
  document.body.innerHTML = '';
});

describe('мобильное приложение', () => {
  it('показывает пустой обзор и сохраняет измерение с запятой', async () => {
    await startApp(element('#app'), repository);
    expect(document.body.textContent).toContain('Пока нет измерений');

    element('[data-testid="dashboard-add"]').click();
    expect(element('dialog[aria-label="Новое измерение"]').hasAttribute('open')).toBe(true);
    element<HTMLInputElement>('#glucose-value').value = '6,4';
    element<HTMLInputElement>('input[name="measurement-type"][value="after-1h"]').checked = true;
    submitForm();

    await vi.waitFor(() => expect(element('[data-testid="latest-value"]').textContent).toBe('6,4'));
    expect(element('[data-testid="latest-type"]').textContent).toBe('1 ч после еды');
    expect(document.querySelector('dialog[aria-label="Новое измерение"]')).toBeNull();
    expect(element('[role="status"]').textContent).toContain('Измерение сохранено');
  });

  it('показывает ошибку формата и блокирует повторный submit', async () => {
    await startApp(element('#app'), repository);
    element('[data-testid="dashboard-add"]').click();
    element<HTMLInputElement>('#glucose-value').value = '6,78';
    submitForm();
    expect(document.body.textContent).toContain('Введите число от 0,1 до 99,9');

    element<HTMLInputElement>('#glucose-value').value = '5,8';
    submitForm();
    submitForm();
    await vi.waitFor(() => expect(element('[data-testid="latest-value"]').textContent).toBe('5,8'));
    expect(document.querySelectorAll('[data-testid="recent-measurement"]')).toHaveLength(1);
  });

  it('удаляет запись только после подтверждения', async () => {
    await startApp(element('#app'), repository);
    element('[data-testid="dashboard-add"]').click();
    element<HTMLInputElement>('#glucose-value').value = '5,7';
    submitForm();
    await vi.waitFor(() => expect(element('[data-testid="latest-value"]').textContent).toBe('5,7'));

    element('[data-delete-id]').click();
    element('[data-cancel-delete]').click();
    expect(element('[data-testid="latest-value"]').textContent).toBe('5,7');

    element('[data-delete-id]').click();
    element('[data-confirm-delete]').click();
    await vi.waitFor(() => expect(document.body.textContent).toContain('Пока нет измерений'));
  });

  it('редактирует запись из истории в той же шторке', async () => {
    const saved = await repository.saveMeasurement({ type: 'fasting', value: 5.6, measuredAt: new Date(2026, 10, 10, 8, 30).getTime() });
    await startApp(element('#app'), repository);

    element('button[data-tab="history"]').click();
    element(`[data-edit-id="${saved.id}"]`).click();

    const dialog = element<HTMLDialogElement>('dialog[aria-label="Редактирование измерения"]');
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(element<HTMLInputElement>('#glucose-value').value).toBe('5,6');
    expect(element<HTMLInputElement>('input[name="measurement-type"]:checked').value).toBe('fasting');
    expect(element<HTMLInputElement>('#measurement-date').value).toBe('2026-11-10');
    expect(element<HTMLInputElement>('#measurement-time').value).toBe('08:30');

    element<HTMLInputElement>('#glucose-value').value = '6,1';
    element<HTMLInputElement>('input[name="measurement-type"][value="after-2h"]').checked = true;
    element<HTMLInputElement>('#measurement-time').value = '21:15';
    element<HTMLFormElement>('form[aria-label="Форма редактирования измерения"]').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );

    await vi.waitFor(() => {
      expect(document.querySelector('dialog[aria-label="Редактирование измерения"]')).toBeNull();
    });
    expect(element('[role="status"]').textContent).toContain('Изменения сохранены');

    const rows = document.querySelectorAll('[data-history-item]');
    expect(rows).toHaveLength(1);
    expect(rows[0]!.textContent).toContain('2 ч после еды');
    expect(rows[0]!.textContent).toContain('6,1');
    expect(rows[0]!.textContent).toContain('21:15');

    const stored = await repository.listMeasurements();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ id: saved.id, type: 'after-2h', value: 6.1 });
    expect(stored[0]!.measuredAt).toBe(new Date(2026, 10, 10, 21, 15).getTime());
  });

  it('показывает историю, таблицу и применяет общий фильтр ко всем данным', async () => {
    await repository.saveMeasurement({ type: 'fasting', value: 5.6, measuredAt: Date.now() });
    await repository.saveMeasurement({ type: 'after-1h', value: 7.2, measuredAt: Date.now() - 60 * 86_400_000 });
    await startApp(element('#app'), repository);

    element('button[data-tab="history"]').click();
    expect(document.querySelectorAll('[data-history-item]')).toHaveLength(1);
    expect(document.querySelector('[data-chart-container] svg')).not.toBeNull();

    element('[data-view-table]').click();
    expect(document.querySelector('[data-chart-table]')).not.toBeNull();
    expect(document.querySelector('[data-chart-container] svg')).toBeNull();

    element('[data-open-filter]').click();
    element('[data-preset="all"]').click();
    expect(document.querySelectorAll('[data-history-item]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-chart-table] tbody tr')).toHaveLength(2);
  });

  it('различает пустой дневник и пустой выбранный период', async () => {
    await repository.saveMeasurement({ type: 'fasting', value: 5.6, measuredAt: Date.now() - 60 * 86_400_000 });
    await startApp(element('#app'), repository);
    element('button[data-tab="history"]').click();
    expect(document.body.textContent).toContain('В этом периоде нет измерений');
    expect(document.querySelector('[data-chart-container]')).toBeNull();
  });

  it('скачивает XLSX для текущего периода', async () => {
    await repository.saveMeasurement({ type: 'fasting', value: 5.6, measuredAt: Date.now() });
    const createObjectURL = vi.fn((blob: Blob) => {
      void blob;
      return 'blob:sugar-report';
    });
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await startApp(element('#app'), repository);
    element('button[data-tab="history"]').click();
    element('[data-export-report]').click();

    await vi.waitFor(() => expect(createObjectURL).toHaveBeenCalledOnce());
    const blob = createObjectURL.mock.calls[0]![0];
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(anchorClick).toHaveBeenCalledOnce();
    expect(element('[role="status"]').textContent).toContain('Отчёт XLSX сохранён');
    await vi.waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:sugar-report'), { timeout: 1500 });
  });

  it('позволяет повторить загрузку после ошибки хранилища', async () => {
    vi.spyOn(repository, 'listMeasurements')
      .mockRejectedValueOnce(new Error('blocked'))
      .mockResolvedValueOnce([]);

    await startApp(element('#app'), repository);
    expect(document.body.textContent).toContain('Не удалось открыть дневник');
    element('[data-retry]').click();

    await vi.waitFor(() => expect(document.body.textContent).toContain('Пока нет измерений'));
  });
});
