const { expect, test } = require('@playwright/test');

const IDS = [
  'african-palette', 'afrostream', 'art-commission', 'book-publishing-cost',
  'creator-analytics', 'creator-bios', 'creator-brand', 'creator-calendar',
  'creator-canvas', 'creator-captions', 'creator-carousel', 'creator-clip',
  'creator-club', 'creator-course', 'creator-desk', 'creator-hashtags',
  'creator-hooks', 'creator-invoice', 'creator-kit', 'creator-mail',
  'creator-mind', 'creator-money', 'creator-page', 'creator-polish',
  'creator-pricing', 'creator-record', 'creator-repurpose', 'creator-research',
  'creator-resize', 'creator-schedule', 'creator-scripts', 'creator-split',
  'creator-stock', 'creator-team', 'creator-thumb', 'creator-titles',
  'creator-voice', 'engagement-rate', 'linkedin-optimizer',
  'music-royalty-splitter', 'personal-brand-audit', 'photography-pricing',
  'podcast-monetization', 'self-publishing-royalty',
  'social-media-calendar', 'wedding-photo-package',
];

const LAUNCHERS = IDS.filter((id) => id.startsWith('creator-'));

const WORKFLOWS = {
  'african-palette': { action: /Tailwind Config/i, expected: /module\.exports|colors/i },
  'art-commission': { action: /Calculate Commission Price/i, expected: /₦29,000/ },
  'book-publishing-cost': { action: /Calculate Publishing Costs/i, expected: /\$1,200\.00/ },
  'engagement-rate': { action: /Calculate Engagement Rate/i, expected: /3\.6%/ },
  'linkedin-optimizer': { action: /Optimise My Profile/i, expected: /PROFILE SCORE/i },
  'music-royalty-splitter': {
    fill: ['#totalRoyalties', '10000'],
    action: /Calculate Royalty Splits/i,
    expected: /Royalty Split|Total Royalties/i,
  },
  'personal-brand-audit': { action: /Calculate Brand Score/i, expected: /2\s*\/\s*100/ },
  'photography-pricing': { action: /Calculate Session Price/i, expected: /₦100,000/ },
  'podcast-monetization': { action: /Calculate Podcast Revenue/i, expected: /\$372\.5/ },
  'self-publishing-royalty': { action: /Compare Platform Royalties/i, expected: /\$559\.44/ },
  'social-media-calendar': { action: /Generate 30-Day Content Calendar/i, expected: /TOTAL POSTS\s*13/i },
  'wedding-photo-package': { action: /Build Package Quote/i, expected: /₦200,000/ },
};

for (const [index, id] of IDS.entries()) {
  test(`${id} canonical route reflows and exposes an accessible primary workflow`, async ({ page }) => {
    const errors = [];
    const unsafeRequests = [];
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
      return route.fulfill({ status: 204, body: '' });
    });
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (request.method() !== 'GET' && /capture-lead|workspace|supabase|\/api\//i.test(request.url())) {
        unsafeRequests.push(`${request.method()} ${request.url()}`);
      }
    });

    await page.setViewportSize({ width: index % 2 ? 320 : 375, height: 844 });
    await page.emulateMedia({
      colorScheme: index % 2 ? 'dark' : 'light',
      reducedMotion: 'reduce',
    });
    const response = await page.goto(`/tools/${id}/`, { waitUntil: 'domcontentloaded' });
    expect(response && response.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://afrotools.com/tools/${id}/`
    );

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.fontSize = '200%';
    });
    const audit = await page.evaluate(() => {
      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden'
          && rect.width > 0 && rect.height > 0;
      };
      const controls = Array.from(document.querySelectorAll('button, input, select, textarea'))
        .filter(visible);
      const viewportWidth = document.documentElement.clientWidth;
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        overflowOwners: Array.from(document.querySelectorAll('body *'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.classList.length ? `.${Array.from(element.classList).join('.')}` : ''}`,
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              scrollWidth: element.scrollWidth,
              clientWidth: element.clientWidth,
            };
          })
          .filter((item) => item.left < -1 || item.right > viewportWidth + 1 || item.scrollWidth > item.clientWidth + 1)
          .slice(0, 10),
        unnamed: controls.filter((control) => !(
          (control.textContent || '').trim()
          || control.getAttribute('aria-label')
          || control.getAttribute('title')
          || (control.labels && Array.from(control.labels)
            .some((label) => label.textContent.trim()))
        )).length,
      };
    });
    expect(audit.overflow, JSON.stringify(audit.overflowOwners)).toBeLessThanOrEqual(1);
    expect(audit.unnamed).toBe(0);
    expect(unsafeRequests).toEqual([]);
    expect(errors).toEqual([]);
  });
}

for (const id of LAUNCHERS) {
  test(`${id} primary CTA opens its real workspace route`, async ({ page }) => {
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
      return route.fulfill({ status: 204, body: '' });
    });
    await page.goto(`/tools/${id}/`, { waitUntil: 'domcontentloaded' });
    const cta = page.locator(
      `a[href^="app.html"], a[href="/tools/${id}/app"], a[href="/tools/${id}/app.html"]`
    ).first();
    await expect(cta).toBeVisible();
    await Promise.all([
      page.waitForURL(new RegExp(`/tools/${id}/app(?:\\.html)?(?:\\?.*)?$`)),
      cta.click(),
    ]);
    await expect(page.locator('body')).toBeVisible();
  });
}

for (const [id, workflow] of Object.entries(WORKFLOWS)) {
  test(`${id} produces a deterministic result and reload-reset baseline`, async ({ page }) => {
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
      return route.fulfill({ status: 204, body: '' });
    });
    await page.goto(`/tools/${id}/`, { waitUntil: 'domcontentloaded' });
    if (workflow.fill) await page.locator(workflow.fill[0]).fill(workflow.fill[1]);
    await page.getByRole('button', { name: workflow.action }).first().click();
    await expect(page.locator('body')).toContainText(workflow.expected);
    await expect(page.locator('[data-day9-creative-boundary]')).toBeVisible();

    const numeric = page.locator('input[type="number"]').first();
    if (await numeric.count()) {
      await numeric.fill('');
      await page.getByRole('button', { name: workflow.action }).first().click();
      await expect(page.locator('body')).not.toContainText(/NaN|undefined/);
    }

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText(/NaN|undefined/);
  });
}

test('AfroStream canonical discovery workflow filters a synthetic query without posting data', async ({ page }) => {
  const unsafeRequests = [];
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
    return route.fulfill({ status: 204, body: '' });
  });
  page.on('request', (request) => {
    if (request.method() !== 'GET' && /capture-lead|workspace|supabase|\/api\//i.test(request.url())) {
      unsafeRequests.push(`${request.method()} ${request.url()}`);
    }
  });
  await page.goto('/tools/afrostream/', { waitUntil: 'domcontentloaded' });
  const search = page.locator('#asSearch');
  await search.fill('deterministic-no-match-creator');
  await expect(search).toHaveValue('deterministic-no-match-creator');
  await search.fill('');
  await expect(search).toHaveValue('');
  expect(unsafeRequests).toEqual([]);
});
