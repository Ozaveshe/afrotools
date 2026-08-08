'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');

const AXE_PATH = require.resolve('axe-core/axe.min.js');
const SYNTHETIC_PRIVATE = 'HA03-RAW-PRIVATE-7319';

const apps = [
  {
    id: 'waec-calculator', route: '/ha/kayan-aiki/kalkuleta-waec/', app: 'waec', first: '#waecSystem', exportToken: 'Tsarin WAEC',
    invalid: async (page) => {
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('#ha03Error')).toContainText('Cika aƙalla');
      await expect(page.locator('#waecEnglish')).toBeFocused();
    },
    valid: async (page) => {
      await page.locator('#waecName1').fill(SYNTHETIC_PRIVATE);
      await page.locator('#waecEnglish').selectOption('A1');
      await page.locator('#waecMath').selectOption('B2');
      await page.locator('#waecScience').selectOption('B3');
      await page.locator('#waecSocial').selectOption('C4');
      await page.locator('#waecGrade1').selectOption('C5');
      await page.locator('button[type="submit"]').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#ha03Result')).toContainText('15');
      return [SYNTHETIC_PRIVATE];
    }
  },
  {
    id: 'jamb-aggregate', route: '/ha/kayan-aiki/jimillar-jamb/', app: 'jamb', first: '#jambUtme', exportToken: 'JAMB',
    invalid: async (page) => {
      await page.locator('#jambUtme').fill('401');
      await page.locator('#jambPostUtme').fill('70');
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('#ha03Error')).toContainText('0 zuwa 400');
      await expect(page.locator('#jambUtme')).toBeFocused();
    },
    valid: async (page) => {
      await page.locator('#jambUtme').fill('300');
      await page.locator('#jambPostUtme').fill('70');
      await page.locator('#jambUtmeWeight').fill('60');
      await page.locator('#jambPostWeight').fill('40');
      await page.locator('#jambBenchmark').fill('65');
      await page.locator('button[type="submit"]').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#ha03Result')).toContainText('73%');
      return ['300', '65'];
    }
  },
  {
    id: 'gpa-calculator', route: '/ha/kayan-aiki/kalkuleta-gpa/', app: 'gpa', first: '#gpaTemplate', exportToken: 'GPA/CGPA',
    invalid: async (page) => {
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('#ha03Error')).toContainText('Cika aƙalla kwas ɗaya');
      await expect(page.locator('#gpaValue1')).toBeFocused();
    },
    valid: async (page) => {
      await page.locator('#gpaName1').fill(SYNTHETIC_PRIVATE);
      await page.locator('#gpaCredit1').fill('3');
      await page.locator('#gpaValue1').fill('4');
      await page.locator('#gpaName2').fill('Synthetic course B');
      await page.locator('#gpaCredit2').fill('2');
      await page.locator('#gpaValue2').fill('3');
      await page.locator('button[type="submit"]').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#ha03Result')).toContainText('3.6');
      return [SYNTHETIC_PRIVATE];
    }
  },
  {
    id: 'school-fees', route: '/ha/kayan-aiki/kudin-makaranta/', app: 'school-fees', first: '#feesSchool', exportToken: 'kuɗin makaranta',
    invalid: async (page) => {
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('#ha03Error')).toContainText('Aƙalla kuɗin karatu ko ƙarin caji');
      await expect(page.locator('#feesTuition')).toBeFocused();
    },
    valid: async (page) => {
      await page.locator('#feesSchool').fill(SYNTHETIC_PRIVATE);
      await page.locator('#feesTuition').fill('120000');
      await page.locator('#feesExtras').fill('30000');
      await page.locator('#feesSupport').fill('50000');
      await page.locator('#feesRhythm').selectOption('3');
      await page.locator('button[type="submit"]').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#ha03Result')).toContainText('150,000');
      return [SYNTHETIC_PRIVATE, '120000'];
    }
  },
  {
    id: 'scholarship-finder', route: '/ha/kayan-aiki/neman-tallafin-karatu/', app: 'scholarships', first: '#scholarshipLevel', exportToken: 'tallafin karatu',
    mock: async (page) => {
      await page.route('**/api/scholarships', async (route) => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          mode: 'live',
          lastCheckedAt: '2026-08-01T10:00:00.000Z',
          scholarships: [
            { name: 'Synthetic STEM Scholarship', provider: 'Synthetic Provider A', levels: ['masters'], destinations: ['uk'], fields: ['stem'], min_gpa_4: 3, min_ielts: 6.5, deadline_date: '2027-12-01', info_url: 'https://example.org/synthetic-a' },
            { name: 'Synthetic Global Scholarship', provider: 'Synthetic Provider B', levels: ['masters'], destinations: ['global'], fields: ['any'], min_gpa_4: 2.5, deadline_date: null, info_url: 'https://example.org/synthetic-b' }
          ]
        })
      }));
    },
    invalid: async (page) => {
      await expect(page.locator('button[type="submit"]')).toBeEnabled();
      await page.locator('#scholarshipGpa').fill('5');
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('#ha03Error')).toContainText('iyakar tsarin');
      await expect(page.locator('#scholarshipGpa')).toBeFocused();
    },
    valid: async (page) => {
      await page.locator('#scholarshipGpa').fill('3.5');
      await page.locator('#scholarshipIelts').fill('7');
      await page.locator('#scholarshipDestination').selectOption('uk');
      await page.locator('#scholarshipField').selectOption('stem');
      await page.locator('button[type="submit"]').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#scholarshipResults')).toContainText('Synthetic STEM Scholarship');
      await expect(page.locator('#ha03Result')).toContainText('Bayanan kai-tsaye');
      await expect(page.locator('#ha03Result')).toContainText('2026');
      return ['3.5'];
    }
  },
  {
    id: 'nysc-allowance', route: '/ha/kayan-aiki/alawus-na-nysc/', app: 'nysc', first: '#nyscPlanMonths', exportToken: 'NYSC',
    invalid: async (page) => {
      await page.locator('#nyscPlanMonths').fill('13');
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('#ha03Error')).toContainText('watanni');
      await expect(page.locator('#nyscPlanMonths')).toBeFocused();
    },
    valid: async (page) => {
      await page.locator('#nyscPlanMonths').fill('12');
      await page.locator('#nyscHousing').fill('20000');
      await page.locator('#nyscFood').fill('25000');
      await page.locator('#nyscTransport').fill('10000');
      await page.locator('#nyscData').fill('5000');
      await page.locator('button[type="submit"]').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#ha03Result')).toContainText('Jimillar kuɗin shiga');
      return ['77000', '25000'];
    }
  },
  {
    id: 'student-budget', route: '/ha/kayan-aiki/kasafin-dalibi/', app: 'student-budget', first: '#budgetCurrency', exportToken: 'Kasafin ɗalibi',
    invalid: async (page) => {
      await page.locator('#budgetCurrency').fill('XX');
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('#ha03Error')).toContainText('haruffa uku');
      await expect(page.locator('#budgetCurrency')).toBeFocused();
    },
    valid: async (page) => {
      await page.locator('#budgetCurrency').fill('NGN');
      await page.locator('#budgetMonthlyIncome').fill('50000');
      await page.locator('#budgetPeriodFunding').fill('100000');
      await page.locator('#budgetHousing').fill('20000');
      await page.locator('#budgetFood').fill('15000');
      await page.locator('#budgetTuition').fill('90000');
      await page.locator('button[type="submit"]').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#ha03Result')).toContainText('Jimillar abin da ake da shi');
      return ['100000', '90000'];
    }
  },
  {
    id: 'hausa-translator', route: '/ha/kayan-aiki/fassarar-hausa/', app: 'translator', first: '#translatorQuery', exportToken: 'Kundin jimloli',
    invalid: async (page) => {
      await page.locator('#translatorQuery').fill(SYNTHETIC_PRIVATE);
      await expect(page.locator('#ha03Result')).toContainText('Ba a samu');
    },
    valid: async (page) => {
      await page.locator('#translatorQuery').fill('thank you');
      await page.locator('button[type="submit"]').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#phraseResults')).toContainText('Na gode');
      return [SYNTHETIC_PRIVATE, 'thank you'];
    }
  }
];

for (const app of apps) {
  test(`${app.id}: native Hausa app acceptance receipt`, async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    const networkPayloads = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()} ${request.failure() && request.failure().errorText}`));
    page.on('request', (request) => networkPayloads.push(`${request.method()} ${request.url()} ${request.postData() || ''}`));
    if (app.mock) await app.mock(page);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(app.route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'ha');
    await expect(page.locator('body')).toHaveAttribute('data-ha03-app', app.app);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-ha03-theme]')).toBeVisible();
    await expect(page.locator('[data-ha03-reset]')).toHaveText(app.app === 'translator' ? 'Goge bincike' : 'Goge fom');
    const artwork = page.locator('.ha03-hero img');
    await expect(artwork).toBeVisible();
    expect(await artwork.evaluate((image) => ({ complete: image.complete, width: image.naturalWidth, height: image.naturalHeight }))).toEqual(expect.objectContaining({ complete: true }));
    expect((await artwork.evaluate((image) => image.naturalWidth))).toBeGreaterThanOrEqual(600);

    await test.step('invalid input and focus', async () => {
      await app.invalid(page);
    });

    await test.step('reset and keyboard-valid flow', async () => {
      await page.locator('[data-ha03-reset]').click();
      await expect(page.locator(app.first)).toBeFocused();
      const privateTokens = await app.valid(page);
      await expect(page.locator('#ha03Error')).toHaveText('');
      await expect(page.locator('body')).not.toContainText(/\bShare\b|\bGrade\b|Core\/compulsory|\(English Language\)|grade point|Weighted percentage|Weighted score|\baverage\b|Arts da Humanities|\bPercentage\b|reviewed feed|Budget arithmetic|\bentitlement\b|\barrears\b|income streams|service year|\bprofile\b|ranar ƙage|\bBuffer\b|Positive balance|\baffordability\b|\bdeadlines\b|\btuition\b|\bextras\b|\buniform\b|\blevies\b|\boverall\b|\bState\b|\bapp\b/i);
      const downloadPromise = page.waitForEvent('download');
      await page.locator('[data-ha03-export]').click();
      const download = await downloadPromise;
      const downloadPath = await download.path();
      const content = fs.readFileSync(downloadPath, 'utf8');
      expect(content.charCodeAt(0)).toBe(0xfeff);
      expect(content).toContain(app.exportToken);
      expect(content.length).toBeGreaterThan(80);
      for (const token of privateTokens) {
        expect(networkPayloads.join('\n')).not.toContain(token);
        expect(page.url()).not.toContain(encodeURIComponent(token));
      }
    });

    await test.step('320px, 375px, and 200% reflow', async () => {
      for (const width of [320, 375]) {
        await page.setViewportSize({ width, height: 720 });
        await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      }
      await page.setViewportSize({ width: 320, height: 720 });
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      const overflow = await page.evaluate(() => Array.from(document.querySelectorAll('body *')).filter((element) => {
        const box = element.getBoundingClientRect();
        return box.right > window.innerWidth + 1 || box.left < -1;
      }).slice(0, 12).map((element) => ({
        tag: element.tagName,
        id: element.id,
        className: typeof element.className === 'string' ? element.className : '',
        text: (element.textContent || '').trim().slice(0, 80),
        right: Math.round(element.getBoundingClientRect().right),
        width: Math.round(element.getBoundingClientRect().width)
      })));
      expect(overflow).toEqual([]);
      await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    });

    await test.step('manual and system dark mode', async () => {
      const initialBackground = await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
      await page.locator('[data-ha03-theme]').click();
      await expect(page.locator('[data-ha03-theme]')).toHaveAttribute('aria-pressed', 'true');
      expect(await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(initialBackground);
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.locator('[data-ha03-theme]')).toHaveAttribute('aria-pressed', 'true');
      expect(await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe('rgb(255, 255, 255)');
    });

    await test.step('serious and critical accessibility scan', async () => {
      await page.addScriptTag({ path: AXE_PATH });
      const violations = await page.evaluate(async () => {
        const result = await window.axe.run(document, { resultTypes: ['violations'] });
        return result.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));
      });
      expect(violations).toEqual([]);
    });

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
}
