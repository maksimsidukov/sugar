let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function showToast(message: string, tone: 'success' | 'error' = 'success'): void {
  document.querySelector('[data-toast]')?.remove();
  if (toastTimer) clearTimeout(toastTimer);

  const toast = document.createElement('div');
  toast.className = `toast toast--${tone}`;
  toast.dataset.toast = '';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;
  document.body.append(toast);

  requestAnimationFrame(() => toast.classList.add('toast--visible'));
  toastTimer = setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 220);
  }, 3200);
}

export function showUpdateToast(onUpdate: () => void): void {
  document.querySelector('[data-toast]')?.remove();
  if (toastTimer) clearTimeout(toastTimer);

  const toast = document.createElement('div');
  toast.className = 'toast toast--visible toast--action';
  toast.dataset.toast = '';
  toast.setAttribute('role', 'status');
  const message = document.createElement('span');
  message.textContent = 'Доступна новая версия';
  const button = document.createElement('button');
  button.className = 'toast__action';
  button.dataset.updatePwa = '';
  button.textContent = 'Обновить';
  button.addEventListener('click', () => {
    toast.remove();
    onUpdate();
  });
  toast.append(message, button);
  document.body.append(toast);
}
