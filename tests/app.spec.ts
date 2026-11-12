import { expect, test } from '@playwright/test';

test('добавляет измерение с запятой и сохраняет его после перезагрузки', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Пока нет измерений')).toBeVisible();

  await page.getByTestId('dashboard-add').click();
  const dialog = page.getByRole('dialog', { name: 'Новое измерение' });
  await expect(dialog).toBeVisible();
  await page.getByRole('radio', { name: '1 ч после еды' }).check();
  await page.getByLabel('Значение, ммоль/л').fill('6,4');
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click();

  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('status')).toContainText('Измерение сохранено');
  await expect(page.getByTestId('latest-value')).toHaveText('6,4');
  await expect(page.getByTestId('latest-type')).toHaveText('1 ч после еды');

  await page.reload();
  await expect(page.getByTestId('latest-value')).toHaveText('6,4');
  await expect(page.getByTestId('latest-type')).toHaveText('1 ч после еды');
});

test('показывает ошибку ввода и не создаёт дубль при повторном submit', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('dashboard-add').click();
  await page.getByLabel('Значение, ммоль/л').fill('6');
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page.getByText('Введите число с одним знаком после запятой')).toBeVisible();

  await page.getByLabel('Значение, ммоль/л').fill('5,8');
  const form = page.getByRole('form', { name: 'Форма нового измерения' });
  await form.evaluate((element: HTMLFormElement) => {
    element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await expect(page.getByTestId('latest-value')).toHaveText('5,8');
  await expect(page.getByTestId('recent-measurement')).toHaveCount(1);
});

test('строит график, объединяет периоды без дублей и скачивает XLSX', async ({ page }) => {
  await page.goto('/');
  for (const [type, value] of [['Натощак', '5,6'], ['1 ч после еды', '7,2']] as const) {
    await page.getByTestId('dashboard-add').click();
    await page.getByRole('radio', { name: type, exact: true }).check();
    await page.getByLabel('Значение, ммоль/л').fill(value);
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Новое измерение' })).not.toBeVisible();
  }

  await page.getByRole('button', { name: 'История', exact: true }).click();
  await expect(page.locator('[data-history-item]')).toHaveCount(2);
  await expect(page.locator('[data-chart-container] svg')).toBeVisible();
  await expect(page.locator('[data-chart-point]')).toHaveCount(2);
  await page.getByRole('button', { name: 'Таблица', exact: true }).click();
  await expect(page.locator('[data-chart-table] tbody tr')).toHaveCount(2);

  const today = await page.evaluate(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
  await page.locator('[data-open-filter]').first().click();
  for (let index = 0; index < 2; index += 1) {
    await page.locator('#filter-start').fill(today);
    await page.locator('#filter-end').fill(today);
    await page.locator('[data-add-range]').click();
  }
  await expect(page.locator('[data-range-chip]')).toHaveCount(2);
  await page.locator('[data-apply-filter]').click();
  await expect(page.locator('[data-history-item]')).toHaveCount(2);
  await expect(page.locator('[data-chart-table] tbody tr')).toHaveCount(2);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Скачать XLSX', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^sugar-report-\d{4}-\d{2}-\d{2}\.xlsx$/);
});

test('удаляет запись только после подтверждения', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('dashboard-add').click();
  await page.getByLabel('Значение, ммоль/л').fill('5,7');
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page.getByTestId('latest-value')).toHaveText('5,7');

  await page.getByRole('button', { name: 'Удалить измерение 5,7' }).click();
  await page.getByRole('button', { name: 'Отмена', exact: true }).click();
  await expect(page.getByTestId('latest-value')).toHaveText('5,7');

  await page.getByRole('button', { name: 'Удалить измерение 5,7' }).click();
  await page.getByRole('dialog', { name: 'Удалить измерение?' }).getByRole('button', { name: 'Удалить', exact: true }).click();
  await expect(page.getByText('Пока нет измерений')).toBeVisible();
});
