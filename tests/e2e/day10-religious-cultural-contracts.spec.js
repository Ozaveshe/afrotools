const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const TEST_ORIGIN = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';

test.describe.configure({ mode: 'serial' });

async function open(page, route) {
  await page.route('**/*', async (requestRoute) => {
    const url = new URL(requestRoute.request().url());
    if (url.origin === TEST_ORIGIN) return requestRoute.continue();
    return requestRoute.abort();
  });
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1').first()).toBeVisible();
}

async function setValue(page, selector, value) {
  const control = page.locator(selector);
  if (await control.isVisible()) {
    await control.fill(String(value));
    return;
  }
  await control.evaluate((element, nextValue) => {
    element.value = String(nextValue);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

test('tithe planner uses only the user-selected rate and clears stale output', async ({ page }) => {
  await open(page, '/tools/tithe-calculator/');
  await setValue(page, '#gp-reference', 1000);
  await setValue(page, '#gp-rate', 10);
  await setValue(page, '#gp-offering', 50);
  await setValue(page, '#gp-pledge', 120);
  await setValue(page, '#gp-periods', 6);
  await setValue(page, '#gp-essentials', 400);
  await page.locator('#gp-form').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#gp-total')).toContainText(/170/);
  await expect(page.locator('#gp-remaining')).toContainText(/430/);
  await setValue(page, '#gp-reference', '');
  await expect(page.locator('#gp-status')).toContainText(/changed|enter|amount/i);
});

test('lobola calculator treats entered family expectation as an editable planning line', async ({ page }) => {
  await open(page, '/tools/lobola-calculator/');
  await setValue(page, '#familyExpectation', 1000);
  await setValue(page, '#giftValue', 100);
  await setValue(page, '#ceremonyCost', 50);
  await setValue(page, '#giftBuffer', 10);
  await page.getByRole('button', { name: 'Build my family plan' }).click();
  await expect(page.locator('#rTotal')).toContainText(/1[,.]265/);
  await expect(page.locator('.disclaimer')).toContainText('not an official tariff');
});

test('lobola negotiation checklist creates a synthetic family brief and resets it', async ({ page }) => {
  await open(page, '/tools/lobola-negotiation-checklist/');
  await setValue(page, '#familyA', 'Synthetic family A');
  await setValue(page, '#pending', 'Confirm blankets and travel');
  await page.locator('#buildSummary').click();
  await expect(page.locator('#summaryOutput')).toContainText('Synthetic family A');
  await page.locator('#resetForm').click();
  await expect(page.locator('#summaryOutput')).toContainText('Fill the checklist');
});

test('lobola gift list totals editable rows without creating an official list', async ({ page }) => {
  await open(page, '/tools/lobola-gift-list/');
  await page.locator('.lg-row input[type="number"]').first().fill('123');
  await expect(page.locator('#summaryOutput')).toContainText(/123/);
  await expect(page.locator('#summaryOutput')).toContainText('not an official requirement');
});

test('proverb finder filters locally and keeps attribution caveat visible', async ({ page }) => {
  await open(page, '/tools/african-proverbs/');
  await page.locator('#filterCulture').selectOption({ index: 1 });
  await page.getByRole('button', { name: /Filter Results/ }).click();
  await expect(page.locator('#proverbsGrid')).not.toHaveText('');
  await expect(page.locator('body')).toContainText('authenticated quotations');
});

test('zakat calculator independently applies nisab and 2.5 percent arithmetic', async ({ page }) => {
  await open(page, '/tools/zakat-calculator/');
  for (const id of ['savings', 'goldGrams', 'silverGrams', 'inventory', 'investments', 'receivables', 'debts']) {
    await setValue(page, `#${id}`, 0);
  }
  await setValue(page, '#cash', 1000000);
  await setValue(page, '#silverPrice', 1000);
  await page.locator('#zakatForm').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#nisabOut')).toContainText(/595[,.]000/);
  await expect(page.locator('#zakatOut')).toContainText(/25[,.]000/);
});

test('prayer planner exposes method, city and local-mosque boundary', async ({ page }) => {
  await open(page, '/tools/prayer-times/');
  await page.locator('.rs-form [name="city"]').selectOption('Nairobi');
  await expect(page.locator('.rs-output')).toContainText('05:18');
  await expect(page.locator('.rs-output')).toContainText('local mosque');
});

test('Ramadan draft applies the entered suhoor buffer and moon-sighting boundary', async ({ page }) => {
  await open(page, '/tools/ramadan-timetable/');
  await setValue(page, '.rs-form [name="suhoorBuffer"]', 10);
  await expect(page.locator('.rs-output')).toContainText('Suhoor stop 05:00');
  await expect(page.locator('.rs-output')).toContainText('moon sighting');
});

test('Faraid limited model allocates a simple spouse and children fixture', async ({ page }) => {
  await open(page, '/tools/faraid-inheritance/');
  await setValue(page, '#estate', 1200000);
  for (const id of ['debts', 'funeral', 'bequest', 'brothers', 'sisters']) await setValue(page, `#${id}`, 0);
  await page.locator('#spouse').selectOption('wife');
  await setValue(page, '#sons', 1);
  await setValue(page, '#daughters', 1);
  await page.locator('#father').uncheck();
  await page.locator('#mother').uncheck();
  await page.locator('#faraidForm').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#netOut')).toContainText(/1[,.]200[,.]000/);
  await expect(page.locator('#shareRows')).toContainText(/700[,.]000/);
  await expect(page.locator('#shareRows')).toContainText(/350[,.]000/);
});

test('Hajj budget applies package, daily spend and contingency', async ({ page }) => {
  await open(page, '/tools/hajj-budget/');
  await expect(page.locator('.rs-output')).toContainText(/\$8[,.]002/);
  await expect(page.locator('.rs-output')).toContainText(/official operator/i);
});

test('Islamic finance calculator renders the entered asset and total obligation', async ({ page }) => {
  await open(page, '/tools/islamic-finance/');
  await setValue(page, '#assetPrice', 1000);
  await setValue(page, '#deposit', 200);
  await setValue(page, '#financedAmount', 800);
  await setValue(page, '#profitMargin', 10);
  await setValue(page, '#termMonths', 10);
  await setValue(page, '#fees', 0);
  await page.locator('#financeForm').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#ifStatus')).toContainText(/updated|calculated|quote/i);
  await expect(page.locator('#monthlyPayment')).toContainText(/88\.00/);
  await expect(page.locator('#totalPayable')).toContainText(/1[,.]080/);
});

test('wedding budget responds to a synthetic guest fixture and reset', async ({ page }) => {
  await open(page, '/tools/wedding-budget/');
  await setValue(page, '#guests', 100);
  await setValue(page, '#foodPerGuest', 1000);
  await page.locator('#weddingForm').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#summaryBox')).toContainText(/100/);
  await page.locator('#resetForm').click();
  await expect(page.locator('#guests')).toHaveValue('250');
});

test('naming ceremony planner calculates and resets editable local quotes', async ({ page }) => {
  await open(page, '/tools/naming-ceremony/');
  await setValue(page, '#guestCount', 10);
  await setValue(page, '#foodPerGuest', 100);
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#summaryOutput')).toHaveValue(/10/);
  await page.locator('#resetBtn').click();
  await expect(page.locator('#guestCount')).toHaveValue('60');
});

test('funeral planner separates attendee food arithmetic from fixed costs', async ({ page }) => {
  await open(page, '/tools/funeral-cost/');
  await setValue(page, '#guests', 10);
  await setValue(page, '#foodPerGuest', 100);
  await page.locator('#funeral-form').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#summaryOutput')).toContainText(/1[,.]000/);
  await expect(page.locator('body')).toContainText('not legal');
});

test('baby-name planning layer refuses to authenticate a name', async ({ page }) => {
  await open(page, '/tools/baby-name-generator/');
  await expect(page.locator('.rs-output')).toContainText('does not invent or authenticate a name');
  await expect(page.locator('.rs-output')).toContainText('Family review needed');
});

test('traditional calendar labels calculated dates as estimates', async ({ page }) => {
  await open(page, '/tools/traditional-calendar/');
  await setValue(page, '.rs-form [name="date"]', '2026-04-27');
  await expect(page.locator('.rs-output')).toContainText('Estimated market day');
  await expect(page.locator('.rs-output')).toContainText('local');
});

test('age and Akan day-name fixture uses the birth weekday', async ({ page }) => {
  await open(page, '/tools/age-calculator-african/');
  await setValue(page, '.rs-form [name="birthDate"]', '2000-01-01');
  await expect(page.locator('.rs-output')).toContainText('Saturday');
  await expect(page.locator('.rs-output')).toContainText('Ama');
});

test('festival planner returns only a planning list with organiser confirmation', async ({ page }) => {
  await open(page, '/tools/festival-calendar/');
  await expect(page.locator('.rs-output')).toContainText('Confirm exact dates locally');
  await expect(page.locator('.rs-output')).toContainText('Ask before filming');
});

test('Aso-Ebi calculator applies fabric, tailoring, accessories and discount', async ({ page }) => {
  await open(page, '/tools/aso-ebi-cost/');
  for (const [name, value] of [['people', 2], ['fabricYards', 3], ['fabricPrice', 100], ['tailoring', 50], ['accessories', 25], ['discount', 10]]) {
    await setValue(page, `.rs-form [name="${name}"]`, value);
  }
  await expect(page.locator('.rs-output')).toContainText(/675/);
});

test('traditional attire planner calculates local quotes and resets', async ({ page }) => {
  await open(page, '/tools/traditional-attire/');
  await setValue(page, '#quantity', 2);
  await setValue(page, '#fabricCost', 100);
  await setValue(page, '#tailoringCost', 50);
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#summaryOutput')).toHaveValue(/2/);
  await page.locator('#resetBtn').click();
  await expect(page.locator('#quantity')).toHaveValue('1');
});

test('halal checklist never turns its score into certification', async ({ page }) => {
  await open(page, '/tools/halal-compliance/');
  await page.locator('#r2').check();
  await page.getByRole('button', { name: 'Build readiness checklist' }).click();
  await expect(page.locator('#scoreSummary')).toContainText(/not.*certification|does not determine halal status/i);
  await expect(page.locator('#pathwayText')).toContainText('No timeline or certification outcome');
});

test('Islamic calendar converts a fixed date and states the tabular boundary', async ({ page }) => {
  await open(page, '/tools/islamic-calendar/');
  await setValue(page, '#gDay', 1);
  await page.locator('#gMonth').selectOption('1');
  await setValue(page, '#gYear', 2026);
  await page.getByRole('button', { name: /Convert to Hijri/ }).click();
  await expect(page.locator('#resGregorian')).toContainText('1 January 2026');
  await expect(page.locator('#countdownMetrics')).toContainText('Tabular estimate');
  await expect(page.locator('#sigDatesList')).toContainText('No official observance dates');
});

test('shared Religious apps clear stale output and restore examples', async ({ page }) => {
  await open(page, '/tools/aso-ebi-cost/');
  const people = page.locator('.rs-form [name="people"]');
  await people.fill('');
  await expect(page.locator('.rs-output')).toContainText('previous result has been cleared');
  await page.getByRole('button', { name: 'Reset example' }).click();
  await expect(people).toHaveValue('25');
  await expect(page.locator('.rs-output')).toContainText('Total outfit budget');
});

const pdfCases = [
  ['african-proverbs', 'proverb'],
  ['prayer-times', 'Prayer'],
  ['ramadan-timetable', 'Ramadan'],
  ['hajj-budget', 'Hajj'],
  ['baby-name-generator', 'name'],
  ['traditional-calendar', 'calendar'],
  ['age-calculator-african', 'Age'],
  ['festival-calendar', 'festival'],
  ['aso-ebi-cost', 'Aso'],
  ['halal-compliance', 'Halal'],
  ['islamic-calendar', 'calendar'],
];

for (const [slug, expectedText] of pdfCases) {
  test(`${slug} PDF pack downloads and reopens`, async ({ page }) => {
    await open(page, `/tools/${slug}/`);
    await page.addScriptTag({
      path: path.resolve(__dirname, '../../assets/vendor/jspdf/jspdf.umd.min.js'),
    });
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-rs-action="pdf"]').click();
    const download = await downloadPromise;
    const downloadedPath = await download.path();
    expect(downloadedPath).toBeTruthy();
    const parsed = await pdfParse(fs.readFileSync(downloadedPath));
    expect(parsed.text).toContain('AfroTools Religious & Cultural pack');
    expect(parsed.text.toLowerCase()).toContain(expectedText.toLowerCase());
  });
}

test('tithe-calculator PDF downloads and reopens', async ({ page }) => {
  await open(page, '/tools/tithe-calculator/');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#gp-pdf').click();
  const download = await downloadPromise;
  const parsed = await pdfParse(fs.readFileSync(await download.path()));
  expect(parsed.text).toContain('Private Giving Plan');
  expect(parsed.text).toContain('User-chosen percentage');
});

const localExportCases = [
  ['zakat-calculator', '#exportBtn', 'Zakat'],
  ['faraid-inheritance', '#exportBtn', 'Gross estate'],
  ['islamic-finance', '#exportCsv', 'Murabaha cost-plus sale'],
  ['wedding-budget', '#downloadSummary', 'Wedding budget'],
  ['naming-ceremony', '#exportBtn', 'savings_target'],
  ['funeral-cost', '#download-summary', 'Funeral cost'],
  ['traditional-attire', '#exportBtn', 'weekly_savings_needed'],
];

for (const [slug, selector, expectedText] of localExportCases) {
  test(`${slug} local export downloads and reopens`, async ({ page }) => {
    await open(page, `/tools/${slug}/`);
    const downloadPromise = page.waitForEvent('download');
    await page.locator(selector).click();
    const download = await downloadPromise;
    const exportedText = fs.readFileSync(await download.path(), 'utf8');
    expect(exportedText.toLowerCase()).toContain(expectedText.toLowerCase());
  });
}
