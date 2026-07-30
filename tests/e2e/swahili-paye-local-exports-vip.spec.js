const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');

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
    const aiPayloads = [];
    let acceptNextConfirm = false;
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'confirm' && acceptNextConfirm) {
        acceptNextConfirm = false;
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });
    page.on('request', (request) => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        mutations.push(`${request.method()} ${request.url()}`);
      }
    });
    await page.route('**/.netlify/functions/ai-advisor', async (route) => {
      const request = route.request();
      aiPayloads.push(request.postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reply: 'Uchambuzi wa Kiswahili wa majaribio.',
          text: 'Uchambuzi wa Kiswahili wa majaribio.',
          response: 'Uchambuzi wa Kiswahili wa majaribio.',
          analysis: 'Uchambuzi wa Kiswahili wa majaribio.',
        }),
      });
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
    await expect(page.locator('body')).toContainText(
      /(?:Chanzo|Vyanzo|Mamlaka|Sheria|Thibitisha|Imethibitishwa|DGI|IRPF|TRA|URA)/,
    );
    await expect(page.locator('body')).toContainText(/20(?:25|26)/);

    const gross = page.locator('#grossSalary');
    await expect(gross).toBeVisible();
    await gross.focus();
    await expect(gross).toBeFocused();
    const calculate = page.locator('button.calc-btn[onclick*="calculate"]').first();
    await expect(calculate).toBeVisible();

    await gross.fill('0');
    await calculate.click();
    expect(await page.evaluate(() => window.RESULT == null)).toBe(true);

    const max = Number(await gross.getAttribute('max'));
    const sample = Number.isFinite(max) && max > 0
      ? Math.max(1, Math.round(max * 0.2))
      : 100000;
    await gross.fill(String(sample));

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
    const popupPromise = page.waitForEvent('popup');
    await pdfAction.click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    const reportProof = await page.evaluate(() => {
      const html = window.__afroLastBlobText || '';
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      return {
        htmlLength: html.length,
        lang: parsed.documentElement.lang,
        title: parsed.title,
        text: (parsed.body.textContent || '').replace(/\s+/g, ' ').trim(),
        sections: (parsed.body.textContent.match(/Sehemu(?: ya)? \d/g) || []).length,
      };
    });
    expect(reportProof.htmlLength).toBeGreaterThan(1200);
    expect(reportProof.lang).toBe('sw');
    expect(reportProof.title).toMatch(/(?:PAYE|IRPF|ITS|IUTS|Kodi)/);
    expect(reportProof.text).toMatch(
      /(?:Kwa taarifa|Makadirio|Kwa madhumuni|Taarifa za habari|Si ushauri)/,
    );
    expect(reportProof.text).toMatch(
      /(?:Msingi wa Kisheria|Sheria|Mamlaka|Vyanzo|Thibitisha na)/i,
    );
    expect(reportProof.sections).toBeGreaterThanOrEqual(2);
    expect(reportProof.text).not.toMatch(
      /Africa's Everything Platform|Planning estimate|Legal Basis|Generated on|Monthly Income|Annual Income/i,
    );
    const pdfBuffer = await popup.pdf({ format: 'A4', printBackground: true });
    expect(pdfBuffer.subarray(0, 5).toString()).toBe('%PDF-');
    const parsedPdf = await pdfParse(pdfBuffer);
    expect(parsedPdf.text).toMatch(/(?:Mshahara|PAYE|IRPF|ITS|IUTS|Kodi)/);
    expect(parsedPdf.text).toMatch(/(?:Kwa taarifa|Makadirio|Kwa madhumuni|Taarifa za habari|Si ushauri)/);
    await expect.poll(() => popup.evaluate(() => Boolean(window.__afroPrintCalled))).toBe(true);
    await popup.close();

    const aiAction = page.locator('#aiBtn');
    await expect(aiAction).toBeEnabled();
    await aiAction.click();
    expect(aiPayloads).toHaveLength(0);
    acceptNextConfirm = true;
    await aiAction.click();
    await expect.poll(() => aiPayloads.length).toBe(1);
    expect(JSON.stringify(aiPayloads[0])).toContain('Kiswahili');
    await expect(page.locator('#aiResp')).toContainText('Uchambuzi wa Kiswahili');

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.setViewportSize({ width: 375, height: 760 });
    const overflow375 = await page.evaluate(() => (
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    ));
    expect(overflow375).toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 640, height: 760 });
    await page.addStyleTag({ content: 'html{font-size:200%!important}' });
    const overflowAt200Percent = await page.evaluate(() => (
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    ));
    expect(overflowAt200Percent).toBeLessThanOrEqual(1);

    expect(mutations).toHaveLength(1);
    expect(mutations[0]).toMatch(
      /^POST http:\/\/127\.0\.0\.1:\d+\/\.netlify\/functions\/ai-advisor$/,
    );
    expect(errors).toEqual([]);
  });
}
