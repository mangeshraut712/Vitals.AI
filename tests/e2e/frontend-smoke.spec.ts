import { expect, test, type Page } from '@playwright/test';

const CORE_ROUTES = [
  '/',
  '/dashboard',
  '/experience',
  '/biomarkers',
  '/body-comp',
  '/lifestyle',
  '/goals',
  '/data-sources',
  '/future',
  '/vitals',
  '/devices',
  '/plans/diet',
  '/plans/exercise',
  '/tools/guides',
  '/tools/disclaimers',
  '/tools/agent',
] as const;

const runtimeErrorIndicators = ['Application error', 'Unhandled Runtime Error'] as const;

async function expectHealthyPage(route: string, page: Page) {
  const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
  expect(response, `missing response for ${route}`).not.toBeNull();
  expect(response?.ok(), `non-2xx response for ${route}`).toBeTruthy();

  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).toBeVisible();
  expect(await page.locator('main').count(), `missing <main> for ${route}`).toBeGreaterThan(0);

  for (const message of runtimeErrorIndicators) {
    await expect(page.getByText(message)).toHaveCount(0);
  }
}

test.describe('Core route health', () => {
  for (const route of CORE_ROUTES) {
    test(`renders ${route}`, async ({ page }) => {
      await expectHealthyPage(route, page);
    });
  }
});

test('floating chat widget opens and closes on desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'desktop-only interaction');

  await expectHealthyPage('/experience', page);

  const openButton = page.getByLabel('Open AI assistant');
  await expect(openButton).toBeVisible();
  await openButton.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByText('Health AI Assistant')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('floating dock appears on desktop and hides on plan pages', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'desktop-only interaction');

  await expectHealthyPage('/experience', page);
  await expect(page.getByLabel('Home')).toBeVisible();
  await expect(page.getByLabel('Dashboard')).toBeVisible();
  await expect(page.getByLabel('Goals')).toBeVisible();
  await expect(page.getByLabel('Data')).toBeVisible();
  await expect(page.getByLabel('Experience')).toBeVisible();

  await expectHealthyPage('/plans/diet', page);
  await expect(page.getByLabel('Dashboard')).toHaveCount(0);
});

test('mobile nav menu opens and routes correctly', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-pixel', 'mobile-only interaction');

  await expectHealthyPage('/experience', page);

  const openMenuButton = page.getByLabel('Open navigation menu');
  await expect(openMenuButton).toBeVisible();
  await openMenuButton.click();
  await expect(page.getByLabel('Close navigation menu')).toBeVisible();

  const mobilePanel = page.locator('#mobile-navigation-menu');
  await expect(mobilePanel).toBeVisible();

  await mobilePanel.getByRole('link', { name: 'Goals' }).click();
  await expect(page).toHaveURL(/\/goals$/);
});

test('desktop and mobile nav variants are not visible together', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await expectHealthyPage('/experience', page);

  await expect(page.getByRole('link', { name: 'Home' }).first()).toBeVisible();
  await expect(page.getByLabel('Open navigation menu')).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  await expect(page.getByLabel('Open navigation menu')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Home' }).first()).toBeHidden();
});
