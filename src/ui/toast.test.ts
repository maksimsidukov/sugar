// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { showUpdateToast } from './toast';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('обновление PWA', () => {
  it('предлагает действие и запускает обновление по кнопке', () => {
    const update = vi.fn();
    showUpdateToast(update);
    const button = document.querySelector<HTMLButtonElement>('[data-update-pwa]')!;
    expect(document.querySelector('[role="status"]')?.textContent).toContain('Доступна новая версия');
    button.click();
    expect(update).toHaveBeenCalledOnce();
    expect(document.querySelector('[data-toast]')).toBeNull();
  });
});
