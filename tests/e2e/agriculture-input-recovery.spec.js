const { test, expect } = require('@playwright/test');
const fr = require('../../data/localization/fr-agriculture-parity-manifest.json');
const sw = require('../../data/localization/sw-agriculture-parity-manifest.json');
const families = ['irrigation', 'seed-rate', 'fertilizer', 'crop-yield'];
const routes = families.map(f => ({ name: `en ${f}`, url: `/agriculture/${f}/nigeria.html`, area: '#inpFarm', result: '#resultsPanel', state: f === 'irrigation' ? 'visible' : 'on' }));
for (const [lang, manifest, key] of [['fr', fr, 'french'], ['sw', sw, 'swahili']]) {
  for (const family of families) {
    const row = manifest.rows.find(r => r.family === family && r.country?.code === 'NG');
    routes.push({ name: `${lang} ${family}`, url: row[key].route, area: '#farmSize', result: '#resultPanel' });
  }
}
for (const [slug, area] of [['noma/ban-ruwa-najeriya', 'inpFarm'], ['noma/yawan-iri-najeriya', 'inpFarm'], ['noma/amfanin-gona-najeriya', 'inpFarm'], ['noma/taki-najeriya', 'inpFarm'], ['kayan-aiki/ribar-gona', 'inpFarm'], ['kayan-aiki/sarrafa-rogo', 'inpRawTonnes']]) {
  routes.push({ name: `ha ${slug}`, url: `/ha/${slug}/`, area: `#${area}`, result: '#resultsPanel', state: 'on' });
}
for (const route of routes) for (const width of [390, 1280]) {
  test(`${route.name}: invalid input and fresh-result recovery at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(route.url);
    const area = page.locator(route.area), result = page.locator(route.result);
    await expect(area).toBeVisible();
    const calculate = async () => {
      if (route.state) await page.locator('[onclick="calculate()"]:visible').click();
      else await page.locator('form button[type="submit"]').click();
    };
    const visible = () => result.evaluate((el, state) => state ? el.classList.contains(state) : !el.hidden, route.state);
    await area.fill('1'); await calculate();
    await expect.poll(visible).toBe(true);
    for (const value of ['', '0', '-1']) {
      await area.fill(value);
      await expect.poll(visible).toBe(false);
      await calculate();
      await expect.poll(visible).toBe(false);
    }
    await area.fill('2'); await calculate();
    await expect.poll(visible).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
  });
}

async function downloadBytes(page, selector) {
  const pending = page.waitForEvent('download');
  await page.locator(selector).click();
  const stream = await (await pending).createReadStream(), chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

for (const slug of ['eso-irugbin', 'iwon-ajile']) {
  test(`Yoruba ${slug}: shared engine still accepts an entered farm size`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/yo/awon-ise/${slug}/`);
    await page.locator('#inpFarm').fill('2');
    await page.locator('#calcBtn').click();
    await expect(page.locator('#resultsPanel')).toHaveClass(/on/);
    expect(errors).toEqual([]);
  });
}

for (const route of routes.filter(r => /^(fr|sw) (irrigation|fertilizer)$/.test(r.name))) {
  test(`${route.name}: disclosures survive JSON, text, CSV and readable PDF exports`, async ({ page }) => {
    await page.goto(route.url);
    await page.locator(route.area).fill('2');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator(route.result)).toBeVisible();
    const modelNote = route.name.endsWith('fertilizer') ? await page.locator('#fertModelNote').textContent() : null;
    const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f\s]/g, '').replace(/[’‘]/g, "'").replace(/[—–]/g, '-');
    for (const action of ['json', 'txt', 'csv', 'pdf']) {
      const bytes = await downloadBytes(page, `[data-action="${action}"]`);
      let text = bytes.toString('utf8');
      if (action === 'json') expect(() => JSON.parse(text)).not.toThrow();
      if (action === 'pdf') {
        expect(bytes.subarray(0, 4).toString()).toBe('%PDF');
        // PDF.js needs owned typed-array data; a Node Buffer has different slice semantics.
        const parsed = await require('pdf-parse')(Uint8Array.from(bytes));
        text = parsed.text;
        expect(parsed.numpages).toBeGreaterThan(0);
        expect(text).not.toContain('&amp;');
      }
      if (route.name.endsWith('irrigation')) {
        expect(text).toContain('USD');
        expect(text).toContain('0.05');
      } else {
        expect(modelNote.length).toBeGreaterThan(100);
        expect(normalize(text)).toContain(normalize(modelNote));
      }
    }
  });
}

for (const route of routes.filter(r => /ha (noma\/yawan-iri|kayan-aiki)/.test(r.name))) {
  test(`${route.name}: reports require fresh results and include late inputs`, async ({ page }) => {
    await page.goto(route.url);
    const downloads = [];
    page.on('download', d => downloads.push(d));
    const button = '[data-agri-download]';
    await page.locator(button).click();
    await expect(page.locator('[data-agri-status]')).not.toBeEmpty();
    expect(downloads).toHaveLength(0);
    await page.locator(route.area).fill('1');
    if (route.name.endsWith('ribar-gona')) await page.locator('#inpLoanRate').fill('17.5');
    await page.locator('[onclick="calculate()"]:visible').click();
    const first = (await downloadBytes(page, button)).toString('utf8');
    expect(first).toContain('Bayanan da aka shigar:');
    expect(first).toContain('Sakamako:');
    expect(first).not.toContain('Generated locally in this browser');
    if (route.name.endsWith('ribar-gona')) expect(first).toContain('17.5');
    await page.locator(route.area).fill('2');
    await page.locator(button).click();
    expect(downloads).toHaveLength(1);
    await page.locator('[onclick="calculate()"]:visible').click();
    const second = (await downloadBytes(page, button)).toString('utf8');
    expect(second).not.toEqual(first);
    expect(downloads).toHaveLength(2);
  });
}

// Retain every original locale/input/export assertion above; add the two English profit families.
for (const route of [
  { family:'farm-profit', area:'#inpFarm', error:'#profitAreaError', result:'#resultsPanel', valid:'2', belowMinimum:'0.01', resultValue:'#rNetProfit', expected:'₦748,952' },
  { family:'fish-farming', area:'#inpArea', error:'#fishAreaError', result:'#resultsWrap', valid:'200', belowMinimum:'0.5', resultValue:'#profitAmount', expected:'₦6.6M' }
]) for (const width of [390,1280]) {
  test(`English ${route.family}: area validation and real-result recovery at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900});
    await page.emulateMedia({colorScheme:width===390?'dark':'light'});
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`/agriculture/${route.family}/nigeria.html`);
    const area=page.locator(route.area), result=page.locator(route.result), error=page.locator(route.error);
    const calculate=()=>page.locator('[onclick="calculate()"]:visible').click();
    await expect(area).toBeVisible();
    await area.fill(route.valid); await calculate();
    await expect(result).toBeVisible();
    await expect(page.locator(route.resultValue)).toHaveText(route.expected);
    for (const value of ['', '0', '-1',route.belowMinimum]) {
      await area.fill(value);
      await expect(result).toBeHidden();
      await calculate();
      await expect(result).toBeHidden();
      await expect(error).toBeVisible(); await expect(error).toBeInViewport(); await expect(error).not.toBeEmpty();
      const colors=await error.evaluate(el=>({foreground:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor}));
      const luminance=rgb=>{
        const values=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)});
        return .2126*values[0]+.7152*values[1]+.0722*values[2];
      };
      const foreground=luminance(colors.foreground),background=luminance(colors.background);
      expect((Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05)).toBeGreaterThanOrEqual(4.5);
      await expect(area).toHaveAttribute('aria-invalid','true');
      await expect(area).toHaveAttribute('aria-describedby',route.error.slice(1));
      await expect(area).toBeFocused();
      await area.fill(route.valid); await calculate();
      await expect(result).toBeVisible();
      await expect(page.locator(route.resultValue)).toHaveText(route.expected);
      await expect(error).toBeEmpty();
      await expect(area).not.toHaveAttribute('aria-invalid','true');
    }
    if (route.family==='fish-farming') {
      await page.getByRole('combobox',{name:'Production System',exact:true}).selectOption('tarpaulin_tank');
      await expect(result).toBeHidden();
      await expect(page.locator('#areaUnit')).toHaveText('(litres)');
      await area.fill('0'); await calculate();
      await expect(error).toContainText('litre'); await expect(result).toBeHidden();
      await area.fill('5000'); await calculate();
      await expect(result).toBeVisible(); await expect(error).toBeEmpty();
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    expect(errors).toEqual([]);
  });
}
