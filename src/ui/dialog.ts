export function openDialog(dialog: HTMLDialogElement): void {
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  document.body.append(dialog);
  document.body.classList.add('dialog-open');

  dialog.addEventListener('close', () => {
    dialog.remove();
    if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open');
    opener?.focus();
  }, { once: true });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog(dialog);
  });

  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

export function closeDialog(dialog: HTMLDialogElement): void {
  if (!dialog.hasAttribute('open')) return;
  if (typeof dialog.close === 'function') dialog.close();
  else {
    dialog.removeAttribute('open');
    dialog.dispatchEvent(new Event('close'));
  }
}
