const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');
const CONTRACT = require('../../data/localization/sw-paye-26-parity.json');

const ENTRIES = CONTRACT.entries;

for (const entry of ENTRIES) {
  const country = entry.countrySlug;
  test(`${country} PAYE calculates and exports locally at mobile width`, async ({ page, context }) => {
    const errors = [];
    const mutations = [];
    const aiPayloads = [];
    const failedLocalResources = [];
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
    page.on('requestfailed', (request) => {
      if (/^http:\/\/127\.0\.0\.1:\d+\//.test(request.url())) {
        failedLocalResources.push(`${request.url()} ${request.failure()?.errorText || ''}`.trim());
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
    await expect(gross).toHaveAccessibleName(/.+/);
    await gross.focus();
    await expect(gross).toBeFocused();
    const calculate = page.locator('button.calc-btn[onclick*="calculate"]').first();
    await expect(calculate).toBeVisible();

    await gross.fill('0');
    await calculate.click();
    expect(await page.evaluate(() => window.RESULT == null)).toBe(true);

    await gross.fill(String(entry.input));

    await calculate.click();
    await expect(page.locator('#resultsCard, .results-card').first()).toBeVisible();
    const numericOutputs = await page.evaluate(() => (
      Object.values(window.RESULT || {}).filter((value) => Number.isFinite(value))
    ));
    expect(numericOutputs.length).toBeGreaterThanOrEqual(3);
    const expected = entry.englishParity ? entry.expected : entry.observedSwahili;
    for (const [label, resultField] of Object.entries(entry.fields)) {
      if (!(label in expected)) continue;
      const actual = await page.evaluate((fieldNames) => {
        for (const field of fieldNames.split('|')) {
          if (Number.isFinite(window.RESULT?.[field])) return window.RESULT[field];
        }
        return undefined;
      }, resultField);
      expect(actual, `${entry.englishId} ${label} (${resultField})`).toBeCloseTo(expected[label], 5);
    }
    await expect(page.locator('body')).not.toContainText(
      /My Mshahara Halisi|Tax Before Rebate|Tax Rebate|PAYE analysis|IUTS analysis|IRPP analysis|ITS analysis|Family parts|Family status|Dependent children|chargeable income estimate|Gross → Net|Net → Gross|Monthly Take-Home Pay|Annual Take-Home Pay| per mabanda|divorced|widowed/i,
    );
    const unnamedControls = await page.locator(
      '#inputCard input:not([type="hidden"]), #inputCard select, #inputCard textarea, #inputCard button',
    ).evaluateAll((controls) => controls.filter((control) => {
      if (control.hidden || control.disabled) return false;
      const text = (control.textContent || '').trim();
      const aria = control.getAttribute('aria-label') || control.getAttribute('aria-labelledby');
      const id = control.id;
      const label = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
      return !text && !aria && !label && !control.getAttribute('title');
    }).map((control) => `${control.tagName.toLowerCase()}#${control.id || ''}`));
    expect(unnamedControls).toEqual([]);

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
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem('afrotools-theme');
    });
    await page.emulateMedia({ colorScheme: 'dark' });
    expect(await page.evaluate(() => ({
      darkPreference: matchMedia('(prefers-color-scheme: dark)').matches,
      background: getComputedStyle(document.body).backgroundColor,
    }))).toEqual(expect.objectContaining({
      darkPreference: true,
      background: expect.stringMatching(/^(?:rgb|rgba)\(/),
    }));

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
    expect(failedLocalResources).toEqual([]);
    expect(errors).toEqual([]);
  });
}
