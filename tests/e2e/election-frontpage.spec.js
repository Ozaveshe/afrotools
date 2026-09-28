const { test, expect } = require('@playwright/test');

const news = require('../../data/government/election-news.json');
const tracker = require('../../data/government/africa-election-tracker.json');
const lead = news.articles[0];
const headline = lead.localizations.en.headline;
const articleRoute = '/tools/africa-election-tracker/news/' + lead.slug + '/';

for (const width of [1280, 390, 320]) {
  test(`election desk leads with a reviewed story at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    const response = await page.goto('/tools/africa-election-tracker/');
    expect(response.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1, name: 'Africa Election Tracker' })).toBeVisible();
    const title = page.getByRole('heading', { level: 2, name: headline });
    await expect(title).toBeVisible();
    expect((await title.boundingBox()).y).toBeLessThan(550);
    await expect(title.getByRole('link')).toHaveAttribute('href', articleRoute);
    await expect(page.locator('.et-story-source a')).toHaveAttribute('href', lead.officialSources[0].url);
    await expect(page.locator('.et-secondary-brief')).toHaveCount(2);
    await expect(page.locator('.et-secondary-brief a').nth(0)).toHaveAttribute('href', '/tools/africa-election-tracker/news/cabo-verde-presidential-candidacies-september-2026/');
    await expect(page.locator('.et-secondary-brief a').nth(1)).toHaveAttribute('href', '/tools/africa-election-tracker/news/south-africa-local-election-special-votes-september-2026/');
    await expect(page.locator('#calendarRailList .et-rail-item')).toHaveCount(3);
    await expect(page.locator('.et-issue-nav a').first()).toHaveText('Latest');
    await expect(page.locator('.et-country-file')).toHaveCount(new Set(tracker.elections.map((record) => record.countryCode)).size);
    await expect(page.locator('.et-country-records a[href^="#election-"]')).toHaveCount(tracker.elections.length);
    expect(await page.locator('#calendar').evaluate((node) => node.compareDocumentPosition(document.querySelector('#findElection')) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
    await expect(page.locator('afro-related-tools, .gov-focus-panel')).toHaveCount(0);
    await expect(page.locator('#findElection')).not.toHaveAttribute('open');
    await page.locator('#findElection summary').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#findElection')).toHaveAttribute('open', '');

    await expect(page.locator('#searchInput')).toBeEnabled();
    await expect(page.locator('#upcomingOnly')).toBeChecked();
    await expect(page.locator('#election-ng-ekiti-governor-2026')).toHaveCount(0);
    await expect(page.locator('#election-cv-president-2026')).toBeVisible();
    const dossierLink = page.locator('.et-country-records a[href^="#election-"]').first();
    const targetId = (await dossierLink.getAttribute('href')).slice(1);
    await dossierLink.click();
    await expect(page).toHaveURL(new RegExp('#' + targetId + '$'));
    await expect(page.locator('#' + targetId)).toBeVisible();
    if (width <= 620) {
      await expect(page.locator('.et-issue-nav')).toBeHidden();
      const contents = page.locator('.et-mobile-contents');
      await expect(contents.locator('summary')).toBeVisible();
      await contents.locator('summary').focus();
      await expect(contents.locator('summary')).toHaveCSS('outline-color', 'rgb(232, 189, 122)');
      await page.keyboard.press('Enter');
      await expect(contents).toHaveAttribute('open', '');
      await expect(contents.locator('nav a')).toHaveCount(8);
      await expect(contents.locator('nav a').last()).toBeVisible();
      const targetHeights = await contents.evaluate((node) => ({
        summary: node.querySelector('summary').getBoundingClientRect().height,
        links: Array.from(node.querySelectorAll('nav a'), (link) => link.getBoundingClientRect().height)
      }));
      expect(targetHeights.summary).toBeGreaterThanOrEqual(44);
      expect(targetHeights.links.every((height) => height >= 44)).toBe(true);
    } else {
      await expect(page.locator('.et-issue-nav')).toBeVisible();
      await expect(page.locator('.et-mobile-contents')).toBeHidden();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });
}

test('reviewed headline and dated source remain readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const response = await page.goto('/tools/africa-election-tracker/');
  expect(response.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 2, name: headline })).toBeVisible();
  await expect(page.locator('.et-story-source')).toContainText('Published 27 September 2026; checked 27 September 2026');
  await expect(page.locator('.et-secondary-brief')).toHaveCount(2);
  await expect(page.locator('.et-country-records a[href^="#election-"]')).toHaveCount(tracker.elections.length);
  await expect(page.locator('#electionList .et-election-card')).toHaveCount(tracker.elections.length);
  const dossierLink = page.locator('.et-country-records a[href^="#election-"]').last();
  const targetId = (await dossierLink.getAttribute('href')).slice(1);
  await dossierLink.click();
  await expect(page.locator('#' + targetId)).toBeVisible();
  const contents = page.locator('.et-mobile-contents');
  await contents.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(contents).toHaveAttribute('open', '');
  await expect(contents.locator('nav a')).toHaveCount(8);
  const ledgerDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(tracker.generatedAt + 'T00:00:00Z'));
  await expect(page.locator('.et-calendar-rail')).toContainText(ledgerDate);
  await expect(page.locator('#searchInput')).toBeDisabled();
  await context.close();
});

test('the editorial lead survives an unavailable calendar JSON request', async ({ page }) => {
  await page.route('**/data/government/africa-election-tracker.json', (route) => route.fulfill({ status: 503, body: '{}' }));
  await page.goto('/tools/africa-election-tracker/');
  await expect(page.getByRole('heading', { level: 2, name: headline })).toBeVisible();
  await expect(page.locator('.et-story-source a')).toHaveAttribute('href', lead.officialSources[0].url);
  await expect(page.locator('#calendarRailList .et-rail-item')).toHaveCount(3);
  await expect(page.locator('#searchInput')).toBeDisabled();
});

test('newsroom article offers a keyboard bypass to its main content', async ({ page }) => {
  const response = await page.goto(articleRoute);
  expect(response.status()).toBe(200);
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  await expect(page.locator('main#main')).toContainText(headline);
});
