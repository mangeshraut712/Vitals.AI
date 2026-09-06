import { expect, test } from '@playwright/test';

test('homepage and health agent smoke', async ({ page }) => {
  const home = await page.goto('./', { waitUntil: 'domcontentloaded' });
  expect(home, 'homepage missing response').not.toBeNull();
  expect(home?.ok(), 'homepage non-2xx').toBeTruthy();
  await expect(page.locator('body')).toBeVisible();
  expect(await page.locator('main').count()).toBeGreaterThan(0);
  await expect(page.getByText('Application error')).toHaveCount(0);

  const agent = await page.goto('./tools/agent/', { waitUntil: 'domcontentloaded' });
  expect(agent, 'agent page missing response').not.toBeNull();
  expect(agent?.ok(), 'agent page non-2xx').toBeTruthy();

  await expect(page.getByTestId('agent-page')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Health Agent', exact: true })).toBeVisible();
  await expect(page.getByTestId('agent-empty-state')).toBeVisible();
  await expect(page.getByTestId('agent-tool-catalog')).toContainText('Biomarker lookup');
  await expect(page.getByTestId('agent-input')).toBeVisible();

  await page.getByTestId('agent-prompt-crp-lookup').click();
  await expect(page.getByTestId('agent-tool-result').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('agent-empty-state')).toHaveCount(0);
});
