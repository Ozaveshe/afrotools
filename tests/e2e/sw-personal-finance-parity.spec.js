const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');

test.describe.configure({ mode: 'serial' });

const APPS = [
  {
    id: '50-30-20-budget', route: '/sw/zana/bajeti-50-30-20/', edit: 'Mapato halisi ya mwezi', invalid: 'Mapato halisi ya mwezi', invalidValue: '0',
    visible: ['600,000', '300,000', '180,000', '120,000'],
    txt: ['Mapato=600000', 'Mahitaji50=300000', 'Matakwa30=180000', 'Akiba20=120000', 'Haijagawiwa=50000'],
    json(result) { expect(result).toMatchObject({ income: 600000, idealNeeds: 300000, idealWants: 180000, idealSavings: 120000, unallocated: 50000 }); }
  },
  {
    id: 'album-budget', route: '/sw/zana/bajeti-ya-albamu/', edit: 'Bei ya studio kwa saa', invalid: 'Idadi ya nyimbo', invalidValue: '0',
    visible: ['665,000', '355,000', '200,000', '110,000', '133,000', '665,000'],
    txt: ['Nyimbo=5', 'Utayarishaji=355000', 'MaudhuiYaKuona=200000', 'Utangazaji=110000', 'Jumla=665000', 'AkibaYaTahadhari10=66500', 'UsikilizajiWaKufidiaGharama=665000'],
    json(result) { expect(result).toMatchObject({ tracks: 5, recordingCost: 200000, mixingCost: 75000, production: 355000, visuals: 200000, marketing: 110000, total: 665000, costPerTrack: 133000, contingency10: 66500, contingency20: 133000, breakEvenStreams: 665000 }); }
  },
  {
    id: 'film-budget', route: '/sw/zana/bajeti-ya-filamu/', edit: 'Bajeti ya jumla', invalid: 'Uuzaji na uwasilishaji (%)', invalidFocus: 'Ubunifu na uongozi (%)', invalidValue: '0',
    visible: ['10,000,000', '500,000', '2,000,000', '5,000,000', '11,000,000'],
    txt: ['Jumla=10000000', 'KwaSiku=500000', 'UbunifuNaUongozi=2000000', 'Uzalishaji=5000000', 'BaadaYaKurekodi=2000000', 'UuzajiNaUwasilishaji=1000000', 'Inayohitajika=11000000', 'Pengo=5000000'],
    json(result) { expect(result).toMatchObject({ total: 10000000, shootDays: 20, perDay: 500000, aboveLine: 2000000, production: 5000000, post: 2000000, marketing: 1000000, contingency: 1000000, required: 11000000, gap: 5000000, surplus: 0 }); }
  },
  {
    id: 'security-emergency-fund', route: '/sw/zana/mfuko-wa-dharura-wa-usalama/', edit: 'Matumizi muhimu ya mwezi', invalid: 'Matumizi muhimu ya mwezi', invalidValue: '0',
    visible: ['850,000', '350,000', '1,600,000', '650,000', '13 miezi'],
    txt: ['Lengo=850000', 'Hatua1=350000', 'Hatua2=850000', 'Hatua3=1600000', 'Pengo=650000', 'MieziKufikiaLengo=13'],
    json(result) { expect(result).toMatchObject({ target: 850000, tier1: 350000, tier2: 850000, tier3: 1600000, gap: 650000, monthsToGoal: 13 }); }
  },
  {
    id: 'side-hustle-ranker', route: '/sw/zana/orodha-ya-side-hustle/', edit: 'Saa zinazopatikana kwa wiki', invalid: 'Saa zinazopatikana kwa wiki', invalidValue: '0', checkbox: 'Uandishi',
    visible: ['Uandishi wa kujitegemea na maudhui', '100/100 ulinganifu', 'Usimamizi wa mitandao ya kijamii'],
    txt: ['1=freelance_writing|100', '2=social_media_mgmt|100', '3=financial_consulting|40', '4=graphics_design|40', '5=beauty_hair|40'],
    json(result) { expect(result.top5.map((item) => [item.hustle.id, item.fit.score])).toEqual([['freelance_writing',100],['social_media_mgmt',100],['financial_consulting',40],['graphics_design',40],['beauty_hair',40]]); }
  }
];

async function downloadText(page, name) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name }).click();
  const download = await pending;
  const file = await download.path();
  expect(file).toBeTruthy();
  return { file, text: fs.readFileSync(file, 'utf8') };
}

async function assertNoOverflow(page, label) {
  const geometry = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const nodes = [];
    function collect(root) {
      for (const node of root.querySelectorAll('*')) {
        nodes.push(node);
        if (node.shadowRoot) collect(node.shadowRoot);
      }
    }
    collect(document.body);
    const offenders = nodes.filter((node) => {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || node.hidden) return false;
      const rect = node.getBoundingClientRect();
      if (style.position === 'absolute' && rect.right < 0) return false;
      return rect.width > 1 && (rect.left < -1 || rect.right > width + 1);
    }).slice(0, 10).map((node) => ({ tag: node.tagName, className: node.className, text: (node.textContent || '').trim().slice(0, 60), rect: node.getBoundingClientRect().toJSON() }));
    const wide = nodes.filter((node) => node.getBoundingClientRect().width > 1 && node.scrollWidth > node.clientWidth + 1).slice(0, 10).map((node) => ({ tag: node.tagName, className: node.className, scrollWidth: node.scrollWidth, clientWidth: node.clientWidth }));
    return { document: document.documentElement.scrollWidth - width, body: document.body.scrollWidth - width, offenders, wide };
  });
  expect(geometry, label).toEqual({ document: 0, body: 0, offenders: [], wide: [] });
}

async function setInvalid(page, app) {
  const field = page.getByLabel(app.invalid);
  if (await field.evaluate((node) => node.tagName === 'SELECT')) {
    await field.evaluate((node, value) => { node.value = value; node.dispatchEvent(new Event('change', { bubbles: true })); }, app.invalidValue);
  } else await field.fill(app.invalidValue);
}

async function expectExportsDisabled(page, disabled) {
  await expect.poll(() => page.locator('[data-export]').evaluateAll((buttons) => buttons.map((button) => button.disabled))).toEqual([disabled, disabled, disabled]);
}

function contrastRatio(foreground, background) {
  function luminance(color) {
    const numbers = color.match(/[\d.]+/g).map(Number);
    const channels = /^color\(srgb/i.test(color) ? numbers.slice(0, 3).map((channel) => channel * 255) : numbers.slice(0, 3);
    const linear = channels.map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  }
  const first = luminance(foreground), second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

async function assertComputedContrast(page, option, expectedTheme) {
  const themeSelect = page.getByLabel('Chagua mwonekano');
  await themeSelect.selectOption(option);
  await expect(page.locator('html')).toHaveAttribute('data-theme', expectedTheme);
  await page.waitForTimeout(350);
  const calculate = page.getByRole('button', { name: 'Kokotoa' });
  await page.keyboard.press('Tab');
  await calculate.focus();
  const colors = await calculate.evaluate((button) => {
    const buttonStyle = getComputedStyle(button);
    const cardStyle = getComputedStyle(button.closest('.swpf-card'));
    const controlStyle = getComputedStyle(document.querySelector('.swpf-field input, .swpf-field select'));
    return {
      buttonText: buttonStyle.color,
      buttonBackground: buttonStyle.backgroundColor,
      controlBorder: controlStyle.borderTopColor,
      controlBackground: controlStyle.backgroundColor,
      focus: buttonStyle.outlineColor,
      focusBackground: cardStyle.backgroundColor
    };
  });
  expect(contrastRatio(colors.buttonText, colors.buttonBackground), `${option} primary button text`).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(colors.controlBorder, colors.controlBackground), `${option} control border`).toBeGreaterThanOrEqual(3);
  expect(contrastRatio(colors.focus, colors.focusBackground), `${option} focus indicator ${JSON.stringify(colors)}`).toBeGreaterThanOrEqual(3);
  await themeSelect.focus();
  const themeColors = await themeSelect.evaluate((select) => {
    const selectStyle = getComputedStyle(select);
    const panelStyle = getComputedStyle(select.closest('.swpf-card'));
    return {
      border: selectStyle.borderTopColor,
      background: panelStyle.backgroundColor,
      focus: selectStyle.outlineColor,
      focusStyle: selectStyle.outlineStyle,
      focusWidth: parseFloat(selectStyle.outlineWidth)
    };
  });
  expect(contrastRatio(themeColors.border, themeColors.background), `${option} theme selector boundary ${JSON.stringify(themeColors)}`).toBeGreaterThanOrEqual(3);
  expect(themeColors.focusStyle, `${option} theme selector focus style`).not.toBe('none');
  expect(themeColors.focusWidth, `${option} theme selector focus width`).toBeGreaterThanOrEqual(2);
  expect(contrastRatio(themeColors.focus, themeColors.background), `${option} theme selector focus contrast ${JSON.stringify(themeColors)}`).toBeGreaterThanOrEqual(3);
}

for (const app of APPS) {
  test(`${app.id}: exact workflow, stale/invalid gates, parsed exports and physical UX proof`, async ({ page, request }) => {
    const errors = [];
    const failures = [];
    const dataSends = [];
    await page.addInitScript(() => { window.__printCalls = 0; window.print = () => { window.__printCalls += 1; }; });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', (response) => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
    page.on('request', (req) => {
      if (req.method() !== 'GET' || ['xhr','fetch'].includes(req.resourceType())) dataSends.push({ method: req.method(), type: req.resourceType(), url: req.url(), body: req.postData() });
    });

    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(app.route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('header img')).toHaveJSProperty('complete', true);
    expect(await page.locator('header img').evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
    await assertNoOverflow(page, `${app.id} at 320px`);
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await assertNoOverflow(page, `${app.id} at 320px and 200%`);
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await page.setViewportSize({ width: 375, height: 812 });
    await assertNoOverflow(page, `${app.id} at 375px`);

    const unnamed = await page.locator('[data-sw-personal-finance] input:not([type="hidden"]), [data-sw-personal-finance] select, [data-sw-personal-finance] button, [data-sw-personal-finance] a[href]').evaluateAll((nodes) => nodes.filter((node) => {
      const visible = getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden';
      return visible && !(node.labels && node.labels.length) && !node.getAttribute('aria-label') && !node.textContent.trim();
    }).map((node) => node.outerHTML));
    expect(unnamed).toEqual([]);
    const importInput = page.locator('[data-import]');
    await expect(importInput).toHaveAttribute('tabindex', '-1');
    expect(await importInput.evaluate((node) => node.tabIndex)).toBe(-1);
    await expect(page.getByRole('button', { name: 'Fungua JSON' })).toBeVisible();
    const calculate = page.getByRole('button', { name: 'Kokotoa' });
    await calculate.focus();
    expect(await calculate.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe('none');

    if (app.id === 'album-budget') {
      await page.getByLabel('Aina ya mradi wa muziki').selectOption('album');
      await expect(page.getByLabel('Idadi ya nyimbo')).toHaveValue('12');
      await page.getByLabel('Aina ya mradi wa muziki').selectOption('single');
      await expect(page.getByLabel('Idadi ya nyimbo')).toHaveValue('1');
      await page.getByLabel('Aina ya mradi wa muziki').selectOption('ep');
      await expect(page.getByLabel('Idadi ya nyimbo')).toHaveValue('5');
    }
    if (app.checkbox) {
      await page.getByText(app.checkbox, { exact: true }).click();
      await page.getByLabel('Saa zinazopatikana kwa wiki').selectOption('10');
      await page.getByLabel('Kiwango cha mtaji').selectOption('1');
    }
    await calculate.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-result]')).toBeVisible();
    for (const value of app.visible) await expect(page.locator('[data-result]')).toContainText(value);
    await expectExportsDisabled(page, false);
    expect(dataSends.filter((entry) => !(entry.method === 'GET' && new URL(entry.url).pathname === '/assets/js/components/navbar-data.json'))).toEqual([]);

    const jsonDownload = await downloadText(page, 'Pakua JSON inayofunguka tena');
    const payload = JSON.parse(jsonDownload.text);
    expect(payload).toMatchObject({ schemaVersion: 1, appId: app.id });
    expect(payload.inputs).toBeTruthy();
    app.json(payload.result);
    const txtDownload = await downloadText(page, 'Pakua TXT');
    for (const line of app.txt) expect(txtDownload.text).toContain(line);
    expect(txtDownload.text).toContain('Makadirio ya kupanga pekee');

    await page.getByRole('button', { name: 'Chapisha / hifadhi PDF' }).click();
    await expect.poll(() => page.evaluate(() => window.__printCalls)).toBe(1);
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    const parsed = await pdfParse(pdf);
    expect(parsed.text).toContain(app.visible[0]);

    await page.getByLabel(app.edit).evaluate((node) => {
      if (node.tagName === 'SELECT') { node.selectedIndex = (node.selectedIndex + 1) % node.options.length; node.dispatchEvent(new Event('change', { bubbles: true })); }
      else { node.value = String(Number(node.value || 0) + 1); node.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await expect(page.locator('[data-result]')).toBeHidden();
    await expect(page.locator('[data-result]')).toBeEmpty();
    await expectExportsDisabled(page, true);
    await expect(page.locator('[data-status]')).toContainText('Mabadiliko yamefuta matokeo');

    await page.locator('[data-import]').setInputFiles({ name: `${app.id}.json`, mimeType: 'application/json', buffer: Buffer.from(jsonDownload.text) });
    await expect(page.locator('[data-status]')).toContainText('JSON imefunguliwa ndani ya kifaa');
    await expect(page.locator('[data-result]')).toBeHidden();
    await expectExportsDisabled(page, true);
    await calculate.click();
    await expect(page.locator('[data-result]')).toContainText(app.visible[0]);

    await setInvalid(page, app);
    await expect(page.locator('[data-result]')).toBeHidden();
    await expectExportsDisabled(page, true);
    await calculate.click();
    await expect(page.locator('[data-status]')).toHaveClass(/is-error/);
    await expect(page.locator('[data-result]')).toBeEmpty();
    await expectExportsDisabled(page, true);
    await expect(page.getByLabel(app.invalidFocus || app.invalid)).toBeFocused();

    await assertComputedContrast(page, 'light', 'light');
    await page.emulateMedia({ colorScheme: 'light' });
    await assertComputedContrast(page, 'system', 'light');
    await assertComputedContrast(page, 'dark', 'dark');
    await page.emulateMedia({ colorScheme: 'dark' });
    await assertComputedContrast(page, 'system', 'dark');

    await expect(page.locator('[data-shared-ai-handoff]')).toHaveAttribute('href', '/sw/ai/');
    expect((await request.get('/sw/ai/')).status()).toBe(200);
    expect(errors).toEqual([]);
    expect(failures).toEqual([]);
    expect(dataSends.filter((entry) => !(entry.method === 'GET' && new URL(entry.url).pathname === '/assets/js/components/navbar-data.json'))).toEqual([]);
  });
}
