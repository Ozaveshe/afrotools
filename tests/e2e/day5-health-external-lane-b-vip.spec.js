const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

test.describe.configure({ mode: 'serial' });

const artifactDir = path.resolve(process.cwd(), 'artifacts/day5-health-external-lane-b/screenshots');
fs.mkdirSync(artifactDir, { recursive: true });

const apps = [
  {
    slug: 'diabetes-risk', route: '/tools/diabetes-risk/', heading: /Prediabetes screening conversation tool/,
    fill: async (page) => {
      await page.getByLabel('Age in years').fill('65');
      await page.getByLabel('Sex used by the source score').selectOption('female');
      await page.getByLabel('Height (cm)').fill('160');
      await page.getByLabel('Weight (kg)').fill('110');
      await page.getByLabel(/lower BMI threshold for Asian American adults/).check();
      await page.getByLabel('Previously diagnosed with gestational diabetes').check();
      await page.getByLabel('Parent or sibling has diabetes').check();
      await page.getByLabel('Previously diagnosed with high blood pressure').check();
      await page.getByLabel('Not physically active').check();
      await page.getByLabel('Previous abnormal glucose result').check();
      await page.getByRole('button', { name: 'Calculate screening score' }).click();
      await expect(page.getByText('10/10')).toBeVisible();
      await expect(page.getByText('Do not rely on the score alone')).toBeVisible();
      await expect(page.getByText(/previous abnormal glucose result needs follow-up/i)).toBeVisible();
    }
  },
  {
    slug: 'bmi-measurement', route: '/health/bmi-calculator/', heading: /How stable is this BMI measurement/,
    fill: async (page) => {
      await page.getByLabel('First height reading (cm)').fill('180');
      await page.getByLabel('Second height reading (cm, optional)').fill('179');
      await page.getByLabel('First weight reading (kg)').fill('80');
      await page.getByLabel('Second weight reading (kg, optional)').fill('82');
      await page.getByLabel('Were repeat readings taken under similar conditions?').selectOption('yes');
      await page.getByRole('button', { name: 'Check measurement' }).click();
      await expect(page.getByText('25.1', { exact: true })).toBeVisible();
      await expect(page.getByText('Observed BMI interval: 24.7–25.6')).toBeVisible();
      await expect(page.getByText(/does not prove device accuracy/i)).toBeVisible();
    }
  },
  {
    slug: 'bmi-calculator', route: '/tools/bmi-calculator/', heading: /Adult BMI calculator/,
    fill: async (page) => {
      await page.getByLabel('Who is this calculation for?').selectOption('adult');
      await page.getByLabel('Units').selectOption('imperial');
      await page.getByLabel('Height (feet)').fill('5');
      await page.getByLabel('Additional inches').fill('10');
      await page.getByLabel('Weight (lb)').fill('180');
      await page.getByRole('button', { name: 'Calculate BMI' }).click();
      await expect(page.getByText('25.8', { exact: true })).toBeVisible();
      await expect(page.getByText(/703 × 180 ÷ \(70.0 × 70.0\)/)).toBeVisible();
      await expect(page.getByText(/81.65 kg and 177.8 cm/)).toBeVisible();
    }
  },
  {
    slug: 'waist-hip-ratio', route: '/tools/waist-hip-ratio/', heading: /Waist-to-hip ratio/,
    fill: async (page) => {
      await page.getByLabel('Measurement context').selectOption('adult');
      await page.getByLabel('Units').selectOption('cm');
      await page.getByLabel('First waist circumference').fill('84');
      await page.getByLabel('Second waist circumference (optional)').fill('86');
      await page.getByLabel('First hip circumference').fill('100');
      await page.getByLabel('Second hip circumference (optional)').fill('100');
      await page.getByLabel('Optional population reference').selectOption('women');
      await page.getByRole('button', { name: 'Calculate ratio' }).click();
      await expect(page.getByText('0.850', { exact: true })).toBeVisible();
      await expect(page.getByText('Observed ratio interval: 0.840–0.860')).toBeVisible();
      await expect(page.getByText(/crosses the selected 0.85 reference/i)).toBeVisible();
    }
  },
  {
    slug: 'water-intake', route: '/tools/water-intake/', heading: /Fluid intake log/,
    fill: async (page) => {
      await page.getByLabel('Drink 1 time (optional)').fill('08:00');
      await page.getByLabel('Drink 1 type').selectOption('water');
      await page.getByLabel('Drink 1 volume (mL)').fill('1200');
      await page.getByLabel('Drink 2 time (optional)').fill('12:30');
      await page.getByLabel('Drink 2 type').selectOption('tea-coffee');
      await page.getByLabel('Drink 2 volume (mL)').fill('300');
      await page.getByLabel('Target supplied by your clinician (mL, optional)').fill('1800');
      await page.getByLabel('I confirm this optional target came from a qualified clinician').check();
      await page.getByRole('button', { name: 'Total logged fluids' }).click();
      await expect(page.getByText('1,500 mL', { exact: true })).toBeVisible();
      await expect(page.getByText('Plain water: 1,200 mL')).toBeVisible();
      await expect(page.getByText('Tea or coffee: 300 mL')).toBeVisible();
      await expect(page.getByText(/arithmetic only/i)).toBeVisible();
    }
  },
  {
    slug: 'malaria-risk', route: '/tools/malaria-risk/', heading: /Malaria exposure and testing checklist/,
    fill: async (page) => {
      await page.getByLabel('Recent stay in or travel through a place where malaria may occur').selectOption('yes');
      await page.getByLabel('Most recent malaria test for these symptoms').selectOption('none');
      await page.getByLabel('When did current symptoms start?').selectOption('today');
      await page.getByLabel('Fever or feeling feverish').check();
      await page.getByRole('button', { name: 'Review testing urgency' }).click();
      await expect(page.getByText('Prompt same-day malaria testing')).toBeVisible();
      await expect(page.getByText(/If testing is not readily available/)).toBeVisible();
    }
  },
  {
    slug: 'cholera-risk', route: '/tools/cholera-risk/', heading: /Cholera urgency checklist/,
    fill: async (page) => {
      await page.getByLabel('When did watery diarrhoea start?').selectOption('today');
      await page.getByLabel('Current ability to drink').selectOption('sips');
      await page.getByLabel('Sudden acute watery diarrhoea').check();
      await page.getByLabel('Very frequent or large-volume watery stools').check();
      await page.getByRole('button', { name: 'Review urgency' }).click();
      await expect(page.getByText('Urgent medical care now', { exact: true })).toBeVisible();
      await expect(page.getByText(/use packaged oral rehydration solution exactly as its label/i)).toBeVisible();
    }
  },
  {
    slug: 'ebola-checklist', route: '/tools/ebola-checklist/', heading: /Ebola exposure checklist/,
    fill: async (page) => {
      await page.getByLabel('Time since last possible exposure').selectOption('within21');
      await page.getByLabel('Affected-area or outbreak context').selectOption('unknown');
      await page.getByLabel('Direct contact with blood or body fluids of a person sick with or deceased from suspected or confirmed Ebola').check();
      await page.getByLabel('When did current symptoms start?').selectOption('today');
      await page.getByLabel('Fever or feeling feverish').check();
      await page.getByRole('button', { name: 'Review public-health action' }).click();
      await expect(page.getByText('Immediate separation and public-health contact', { exact: true })).toBeVisible();
      await expect(page.locator('#result').getByText(/follow their testing, isolation and transport instructions/i)).toBeVisible();
    }
  },
  {
    slug: 'water-quality', route: '/tools/water-quality/', heading: /Drinking-water test result worksheet/,
    fill: async (page) => {
      await page.getByLabel('Testing status').selectOption('competent');
      await page.getByLabel('What sample does the report describe?').selectOption('drinking');
      await page.getByLabel('Current official local water advisory').selectOption('none');
      await page.getByLabel('Sample collection date (optional)').fill('2026-07-20');
      await page.getByLabel('E. coli report result (100 mL sample)').selectOption('not-detected');
      await page.getByLabel('Arsenic (µg/L, optional)').fill('9');
      await page.getByLabel('Fluoride (mg/L, optional)').fill('1.2');
      await page.getByLabel('Turbidity (NTU, optional)').fill('0.8');
      await page.getByRole('button', { name: 'Review entered results' }).click();
      await expect(page.getByText('No entered reference exceedance — safety remains unverified')).toBeVisible();
      await expect(page.locator('#result').getByText(/selected entries do not certify the water as safe/i)).toBeVisible();
    }
  },
  {
    slug: 'hiv-treatment-cost', route: '/tools/hiv-treatment-cost/', heading: /HIV care cost worksheet/,
    fill: async (page) => {
      await page.getByLabel('Currency label').fill('KES');
      await page.getByLabel('Displayed decimal places').selectOption('2');
      await page.getByLabel('Clinic/consultation amount').fill('1000');
      await page.getByLabel('Clinic amount cadence').selectOption('monthly');
      await page.getByLabel('Laboratory/monitoring amount').fill('500');
      await page.getByLabel('Laboratory amount cadence').selectOption('quarterly');
      await page.getByLabel('Transport and access amount').fill('300');
      await page.getByLabel('Transport amount cadence').selectOption('monthly');
      await page.getByLabel('Other care amount').fill('200');
      await page.getByLabel('Other amount cadence').selectOption('once');
      await page.getByLabel('Confirmed assistance amount').fill('750');
      await page.getByLabel('Assistance amount cadence').selectOption('annual');
      await page.getByRole('button', { name: 'Calculate 12-month budget' }).click();
      await expect(page.getByText('KES 1420.83 monthly average')).toBeVisible();
      await expect(page.getByText(/Net 12-month total:.*KES 17050.00/)).toBeVisible();
    }
  },
  {
    slug: 'tb-tracker', route: '/tools/tb-tracker/', heading: /TB clinic date tracker/,
    fill: async (page) => {
      await page.getByLabel('Planning date').fill('2026-07-26');
      await page.getByLabel('Next clinic appointment (optional)').fill('2026-07-24');
      await page.getByLabel('Appointment logistical status').selectOption('completed');
      await page.getByLabel('Sample collection due (optional)').fill('2026-08-02');
      await page.getByLabel('Sample logistical status').selectOption('scheduled');
      await page.getByLabel('Result follow-up due (optional)').fill('2026-08-01');
      await page.getByLabel('Result follow-up logistical status').selectOption('scheduled');
      await page.getByLabel('The sample and result dates refer to the same clinic episode').check();
      await page.getByRole('button', { name: 'Review dates' }).click();
      await expect(page.getByText('One or more date entries need clinic confirmation')).toBeVisible();
      await expect(page.getByText(/result follow-up is earlier than sample collection/i)).toBeVisible();
      await expect(page.getByText(/logistical record only/i)).toBeVisible();
    }
  },
  {
    slug: 'hep-b-screening', route: '/tools/hep-b-screening/', heading: /Hepatitis B: testing, diagnosis and vaccination/,
    fill: async (page) => {
      await page.getByLabel('Why are you preparing?').selectOption('pregnancy');
      await page.getByLabel('Age context').selectOption('adult');
      await page.getByLabel('Possible exposure timing').selectOption('none');
      await page.getByLabel('Testing record').selectOption('none');
      await page.getByLabel('Qualified diagnosis status').selectOption('none');
      await page.getByLabel('Vaccination record').selectOption('unknown');
      await page.getByRole('button', { name: 'Build pathway questions' }).click();
      await expect(page.getByRole('heading', { name: '1. Testing pathway' })).toBeVisible();
      await expect(page.getByRole('heading', { name: '2. Diagnosis pathway' })).toBeVisible();
      await expect(page.getByRole('heading', { name: '3. Vaccination pathway' })).toBeVisible();
      await expect(page.locator('#result').getByText(/HBsAg screening during this pregnancy/i)).toBeVisible();
    }
  }
];

async function assertNoOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    root: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth
  }));
  expect(Math.max(dimensions.body, dimensions.root), label).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function assertControlsAccessible(page) {
  const failures = await page.locator('input, select').evaluateAll((controls) => controls.flatMap((control) => {
    const rect = control.getBoundingClientRect();
    if (control.offsetParent === null || (rect.width === 0 && rect.height === 0)) return [];
    const style = getComputedStyle(control);
    const labels = control.labels ? control.labels.length : 0;
    const issues = [];
    if (!labels && !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby')) issues.push(`${control.id || control.name}: no label`);
    const hitRect = ['checkbox', 'radio'].includes(control.type) && control.closest('label')
      ? control.closest('label').getBoundingClientRect()
      : rect;
    if (hitRect.height < 44) issues.push(`${control.id || control.name}: ${hitRect.height}px effective hit area`);
    if (Number.parseFloat(style.fontSize) < 16) issues.push(`${control.id || control.name}: ${style.fontSize} font`);
    return issues;
  }));
  expect(failures).toEqual([]);
}

async function assertSurfaceContrast(page, label) {
  const failures = await page.evaluate(() => {
    const parse = (value) => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const luminance = (rgb) => {
      const channels = rgb.map((value) => {
        const normal = value / 255;
        return normal <= 0.04045 ? normal / 12.92 : Math.pow((normal + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const ratio = (a, b) => {
      const first = luminance(parse(a));
      const second = luminance(parse(b));
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    };
    const selectors = ['html', '.card', '.primary', '.pri', '.secondary', '.sec', '.alert', '.notice', '.urgent', '.tag', '.privacy'];
    return selectors.flatMap((selector) => {
      const element = [...document.querySelectorAll(selector)].find((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      if (!element) return [];
      const style = getComputedStyle(element);
      const value = ratio(style.color, style.backgroundColor);
      return value < 4.5 ? [`${selector}: ${value.toFixed(2)} (${style.color} on ${style.backgroundColor})`] : [];
    });
  });
  expect(failures, label).toEqual([]);
}

for (const app of apps) {
  test(`${app.slug}: desktop/mobile, interaction, local export, keyboard and dark-mode proof`, async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];
    const externalRequests = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (!['127.0.0.1', 'localhost'].includes(url.hostname)) externalRequests.push(request.url());
    });
    await page.addInitScript(() => { window.print = () => { window.__afrotoolsPrinted = true; }; });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(app.route, { waitUntil: 'domcontentloaded' });
    expect(await page.locator('html').getAttribute('data-theme')).toBe('dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    expect(await page.locator('html').getAttribute('data-theme')).toBe('light');
    await expect(page.getByRole('heading', { name: app.heading })).toBeVisible();
    await assertControlsAccessible(page);
    await assertSurfaceContrast(page, `${app.slug} light contrast`);
    await app.fill(page);
    await assertNoOverflow(page, `${app.slug} desktop`);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const download = await downloadPromise;
    const text = fs.readFileSync(await download.path(), 'utf8');
    expect(text).toMatch(/Inputs|Selections|User-entered monthly costs/);
    expect(text).toMatch(/Result|Pathways/);
    expect(text).toMatch(/Assumption/);
    expect(text).toMatch(/Warning/);
    await page.getByRole('button', { name: 'Print / save PDF' }).click();
    expect(await page.evaluate(() => window.__afrotoolsPrinted)).toBe(true);
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.length).toBeGreaterThan(5000);
    await page.screenshot({ path: path.join(artifactDir, `${app.slug}-desktop.png`), fullPage: true });

    await page.setViewportSize({ width: 320, height: 800 });
    await assertNoOverflow(page, `${app.slug} 320px`);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await assertNoOverflow(page, `${app.slug} 320px at 200% text`);
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });

    await page.setViewportSize({ width: 375, height: 812 });
    const lightBackground = await page.locator('html').evaluate((element) => getComputedStyle(element).backgroundColor);
    await page.getByRole('button', { name: 'Dark mode' }).click();
    expect(await page.locator('html').getAttribute('data-theme')).toBe('dark');
    const darkBackground = await page.locator('html').evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(darkBackground).not.toBe(lightBackground);
    await page.getByRole('button', { name: 'Light mode' }).click();
    expect(await page.locator('html').getAttribute('data-theme')).toBe('light');
    await page.getByRole('button', { name: 'Dark mode' }).click();
    expect(await page.locator('html').getAttribute('data-theme')).toBe('dark');
    await assertSurfaceContrast(page, `${app.slug} dark contrast`);
    await assertNoOverflow(page, `${app.slug} 375px dark mode`);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => {
      const active = document.activeElement;
      const style = getComputedStyle(active);
      return { tag: active.tagName, outline: style.outlineStyle, width: style.outlineWidth };
    });
    expect(focus.tag).not.toBe('BODY');
    expect(`${focus.outline} ${focus.width}`).not.toMatch(/^none 0px$/);
    await page.screenshot({ path: path.join(artifactDir, `${app.slug}-mobile-dark.png`), fullPage: true });

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    const unexpectedExternalRequests = externalRequests.filter((url) => {
      const host = new URL(url).hostname;
      return ![
        'www.googletagmanager.com',
        'www.google-analytics.com',
        'pagead2.googlesyndication.com',
      ].includes(host);
    });
    expect(unexpectedExternalRequests).toEqual([]);
  });
}
