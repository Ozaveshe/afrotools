const { test, expect } = require('@playwright/test');

const COUNTRIES = [
  'angola',
  'botswana',
  'burkina-faso',
  'burundi',
  'cameroon',
  'central-african-republic',
  'chad',
  'cote-divoire',
  'egypt',
  'equatorial-guinea',
  'eswatini',
  'ethiopia',
  'gabon',
  'guinea',
  'lesotho',
  'malawi',
  'mali',
  'mauritius',
  'niger',
  'rwanda',
  'senegal',
  'seychelles',
  'tanzania',
  'uganda',
  'zambia',
  'zimbabwe',
];

for (const country of COUNTRIES) {
  test(`${country} PAYE calculates and exports locally at mobile width`, async ({ page, context }) => {
    const errors = [];
    const mutations = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('request', (request) => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        mutations.push(`${request.method()} ${request.url()}`);
      }
    });
    await context.addInitScript(() => {
      const NativeBlob = window.Blob;
      window.Blob = class AfroProofBlob extends NativeBlob {
        constructor(parts, options) {
          super(parts, options);
          window.__afroLastBlobText = (parts || []).map((part) => String(part)).join('');
        }
      };
      window.print = () => {
        window.__afroPrintCalled = true;
      };
    });
    await page.setViewportSize({ width: 320, height: 760 });
    await page.goto(`/sw/${country}/kikokotoo-kodi-mshahara/`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://afrotools.com/sw/${country}/kikokotoo-kodi-mshahara/`,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/afrotools\.com\/assets\/img\//);
    await expect(page.locator('#pdfEmail, form[name="pdf-leads"]')).toHaveCount(0);

    const gross = page.locator('#grossSalary');
    await expect(gross).toBeVisible();
    await gross.focus();
    await expect(gross).toBeFocused();
    const max = Number(await gross.getAttribute('max'));
    const sample = Number.isFinite(max) && max > 0
      ? Math.max(1, Math.round(max * 0.2))
      : 100000;
    await gross.fill(String(sample));

    const calculate = page.locator('button.calc-btn[onclick*="calculate"]').first();
    await expect(calculate).toBeVisible();
    await calculate.click();
    await expect(page.locator('#resultsCard, .results-card').first()).toBeVisible();
    const numericOutputs = await page.evaluate(() => (
      Object.values(window.RESULT || {}).filter((value) => Number.isFinite(value))
    ));
    expect(numericOutputs.length).toBeGreaterThanOrEqual(3);

    const overflow = await page.evaluate(() => ({
      root: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      body: document.body.scrollWidth - document.body.clientWidth,
      offenders: Array.from(document.querySelectorAll('body *'))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            id: element.id || '',
            className: typeof element.className === 'string' ? element.className : '',
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            scrollWidth: element.scrollWidth,
          };
        })
        .filter((item) => item.right > window.innerWidth + 1 || item.left < -1 || item.scrollWidth > item.width + 1)
        .sort((a, b) => Math.max(b.right - window.innerWidth, b.scrollWidth - b.width) - Math.max(a.right - window.innerWidth, a.scrollWidth - a.width))
        .slice(0, 8),
    }));
    expect(overflow.root, JSON.stringify(overflow)).toBeLessThanOrEqual(1);
    expect(overflow.body, JSON.stringify(overflow)).toBeLessThanOrEqual(1);

    const pdfAction = page.locator('button[onclick="generatePdf()"][data-no-gate="true"]').first();
    await expect(pdfAction).toBeVisible();
    if (country === 'equatorial-guinea') {
      await pdfAction.click();
      await expect.poll(() => page.evaluate(() => Boolean(window.__afroPrintCalled))).toBe(true);
    } else {
      const popupPromise = page.waitForEvent('popup');
      await pdfAction.click();
      const popup = await popupPromise;
      await expect.poll(() => page.evaluate(() => (window.__afroLastBlobText || '').length)).toBeGreaterThan(120);
      await expect.poll(() => page.evaluate(() => window.__afroLastBlobText || '')).toContain('<html');
      await popup.close();
    }

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    expect(mutations).toEqual([]);
    expect(errors).toEqual([]);
  });
}
