// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DateFilter } from '../domain/date-range';
import { openFilterSheet } from './filter-sheet';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('фильтр периодов', () => {
  it('применяет пресет «Всё время»', () => {
    const onApply = vi.fn();
    openFilterSheet({ all: false, ranges: [{ start: '2026-11-01', end: '2026-11-12' }] }, onApply);
    document.querySelector<HTMLButtonElement>('[data-preset="all"]')!.click();
    expect(onApply).toHaveBeenCalledWith({ all: true, ranges: [] });
    expect(document.querySelector('dialog')).toBeNull();
  });

  it('добавляет, удаляет и применяет несколько периодов', () => {
    let applied: DateFilter | undefined;
    openFilterSheet({ all: true, ranges: [] }, (filter) => { applied = filter; });
    const start = document.querySelector<HTMLInputElement>('#filter-start')!;
    const end = document.querySelector<HTMLInputElement>('#filter-end')!;

    start.value = '2026-10-01';
    end.value = '2026-10-05';
    document.querySelector<HTMLButtonElement>('[data-add-range]')!.click();
    start.value = '2026-11-01';
    end.value = '2026-11-03';
    document.querySelector<HTMLButtonElement>('[data-add-range]')!.click();
    expect(document.querySelectorAll('[data-range-chip]')).toHaveLength(2);

    document.querySelector<HTMLButtonElement>('[data-remove-range="0"]')!.click();
    expect(document.querySelectorAll('[data-range-chip]')).toHaveLength(1);
    document.querySelector<HTMLButtonElement>('[data-apply-filter]')!.click();
    expect(applied).toEqual({ all: false, ranges: [{ start: '2026-11-01', end: '2026-11-03' }] });
  });

  it('не принимает перевёрнутый диапазон', () => {
    const onApply = vi.fn();
    openFilterSheet({ all: false, ranges: [] }, onApply);
    document.querySelector<HTMLInputElement>('#filter-start')!.value = '2026-11-05';
    document.querySelector<HTMLInputElement>('#filter-end')!.value = '2026-11-01';
    document.querySelector<HTMLButtonElement>('[data-add-range]')!.click();
    expect(document.body.textContent).toContain('Начало периода должно быть не позже его конца');
    expect(onApply).not.toHaveBeenCalled();
  });
});
