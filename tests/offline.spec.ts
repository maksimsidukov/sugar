import { expect, test } from '@playwright/test';

test('production PWA открывается офлайн с сохранёнными записями', async ({ page, context }) => {
  await page.goto('/');
  await page.getByTestId('dashboard-add').click();
  await page.getByLabel('Значение, ммоль/л').fill('5,9');
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page.getByTestId('latest-value')).toHaveText('5,9');

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await expect(page.getByTestId('latest-value')).toHaveText('5,9');

  await context.setOffline(true);
  await page.close();
  const offlinePage = await context.newPage();
  await offlinePage.goto('/');
  await expect(offlinePage.getByTestId('latest-value')).toHaveText('5,9');
  await expect(offlinePage.getByRole('heading', { name: 'Сахар', exact: true })).toBeVisible();
});

test('manifest и assets опубликованы под /sugar/', async ({ page, request }) => {
  const response = await page.goto('/');
  expect(response?.url()).toContain('/sugar/');
  const manifest = await request.get('/sugar/manifest.webmanifest');
  expect(manifest.ok()).toBe(true);
  const body = await manifest.json();
  expect(body.name).toBe('Сахар — дневник глюкозы');
  expect(body.start_url).toBe('/sugar/');
  expect(body.scope).toBe('/sugar/');
  expect(body.display).toBe('standalone');
});
