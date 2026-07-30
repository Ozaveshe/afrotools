const fs = require('fs');
const { test, expect } = require('@playwright/test');

const apps = [
  { name:'swahili', route:'/fr/tools/traducteur-swahili/', input:'#sourceText', submit:'#swForm button[type="submit"]', output:'#swOutput', value:'Merci', oracle:/asante/i, direction:'#direction', reverse:[['fromSw','asante',/merci/i]], copy:'#copySw', download:'#downloadSw', save:'#saveSw', storage:'afrotools:traducteur-swahili-fr:last' },
  { name:'yoruba', route:'/fr/tools/traducteur-yoruba/', input:'#sourceText', submit:'#yorubaForm button[type="submit"]', output:'#result', value:'Merci', oracle:/Ẹ ṣéun/, direction:'#direction', reverse:[['yo-fr','Ẹ ṣéun',/merci/i]], copy:'#copyBtn', download:'#downloadBtn', save:'#saveBtn', storage:'afrotools:traducteur-yoruba-fr:last' },
  { name:'haoussa', route:'/fr/tools/traducteur-haoussa/', input:'#inputText', submit:'#translateBtn', output:'#outputText', value:'Bonjour', oracle:/Sannu/i, direction:'#direction', reverse:[['ha-fr','Sannu',/bonjour/i]], copy:'#copyBtn', download:'#downloadBtn', save:'#saveBtn', storage:'afrotools_traducteur_haoussa_fr_v1' },
  { name:'igbo', route:'/fr/tools/traducteur-igbo/', input:'#inputText', submit:'#translateBtn', output:'#outputText', value:'Merci', oracle:/Daalụ/, direction:'#direction', reverse:[['ig-fr','Daalụ',/merci/i]], copy:'#copyBtn', download:'#downloadBtn', save:'#saveBtn', storage:'afrotools_traducteur_igbo_fr_v1' },
  { name:'amharique', route:'/fr/tools/traducteur-amharique/', input:'#inputText', submit:'#translateBtn', output:'#outputText', value:'Merci', oracle:/አመሰግናለሁ/, direction:'#direction', reverse:[['am-fr','አመሰግናለሁ',/merci/i]], copy:'#copyBtn', download:'#downloadBtn', save:'#saveBtn', storage:'afrotools_traducteur_amharique_fr_v1' },
  { name:'zoulou', route:'/fr/tools/traducteur-zoulou/', input:'#query', submit:'#zuForm button[type="submit"]', output:'#results', value:'bonjour', oracle:/Sawubona/i, copy:'#copyBtn', download:'#downloadBtn', save:'#saveBtn', storage:'afrotools:fr:zulu-phrasebook' },
  { name:'chiffres arabes', route:'/fr/tools/chiffres-arabes/', input:'#inputText', submit:'#convertForm button[type="submit"]', output:'#outputText', value:'2026', oracle:/٢٠٢٦/, direction:'#mode', reverse:[['to-extended','2026',/۲۰۲۶/],['to-western','٢٠٢٦',/2026/],['normalize','۲۰۲۶',/2026/]], copy:'#copyBtn', download:'#downloadBtn', save:'#saveBtn', storage:'afrotools:chiffres-arabes-fr:last' },
  { name:'translittération', route:'/fr/tools/translitteration/', input:'#inputText', submit:'#transForm button[type="submit"]', output:'#outputText', value:'سلام', oracle:/slam|salām|salam/i, direction:'#mode', reverse:[['latin-arabic','salam',/[سص].*[ل].*[ا].*[م]/],['latin-tifinagh','azul',/[ⴰ-⵿]/],['ethiopic-latin','ሰላም',/[a-z]/i]], copy:'#copyBtn', download:'#downloadBtn', save:'#saveBtn', storage:'afrotools:translitteration-fr:last' },
  { name:'pidgin', route:'/fr/tools/traducteur-pidgin/', input:'#sourceText', submit:'#pidginForm button[type="submit"]', output:'#pidginOutput', value:'Combien ça coûte ?', oracle:/how much e be/i, direction:'#direction', reverse:[['fromPidgin','how much e be',/combien/i]], copy:'#copyPidgin', download:'#downloadPidgin', save:'#savePidgin', storage:'afrotools:traducteur-pidgin-fr:last' },
  { name:'français africain', route:'/fr/tools/francais-africain/', input:'#search', submit:'#africanFrenchForm button[type="submit"]', output:'#africanFrenchResults', value:'puce', oracle:/Carte SIM/i, copy:'#copyAfricanFrench', download:'#downloadAfricanFrench', save:'#saveAfricanFrench', storage:'afrotools:francais-africain-fr:last', reset:'#africanFrenchForm #clearBtn' },
  { name:'prénoms africains', route:'/fr/tools/signification-prenoms-africains/', input:'#query', submit:'#nameForm button[type="submit"]', output:'#nameList', value:'Ayo', oracle:/Ayo/, copy:'#copyNames', download:'#downloadNames', save:'#saveNames', storage:'afrotools:signification-prenoms-africains-fr:last' }
];

function luminance([r,g,b]) {
  const values = [r,g,b].map((value) => {
    const channel = value / 255;
    return channel <= .03928 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
  });
  return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
}
function contrast(foreground, background) {
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a,b) + .05) / (Math.min(a,b) + .05);
}

for (const app of apps) {
  test(`${app.name}: complete local workflow and accessibility contract`, async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const consoleErrors = [], failedAssets = [], actionRequests = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('response', (response) => {
      if (response.status() >= 400 && /\.(?:js|css|woff2?|webp|svg)(?:\?|$)/i.test(response.url())) failedAssets.push(`${response.status()} ${response.url()}`);
    });
    page.on('request', (request) => actionRequests.push(`${request.method()} ${request.resourceType()} ${request.url()}`));

    await page.setViewportSize({ width:375, height:900 });
    await page.goto(app.route, { waitUntil:'networkidle' });
    actionRequests.length = 0;
    await expect(page.locator('html')).toHaveAttribute('lang','fr');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator(app.input)).toHaveAccessibleName(/\S+/);
    for (const button of await page.locator('main button:visible').all()) await expect(button).toHaveAccessibleName(/\S+/);

    await page.locator(app.input).fill(app.value);
    await page.locator(app.submit).focus();
    await expect(page.locator(app.submit)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator(app.output)).toContainText(app.oracle);
    const visibleStatus = page.locator('[role="status"]:visible,[aria-live="polite"]:visible').first();
    await expect(visibleStatus).toBeVisible();

    await page.locator(app.copy).click();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toMatch(app.oracle);
    expect(clipboard).not.toContain('\uFFFD');

    const downloadPromise = page.waitForEvent('download');
    await page.locator(app.download).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.txt$/i);
    const file = await download.path();
    const bytes = fs.readFileSync(file);
    const reopened = new TextDecoder('utf-8', { fatal:true }).decode(bytes);
    expect(reopened).toMatch(app.oracle);
    expect(reopened).not.toContain('\uFFFD');

    await page.locator(app.save).click();
    const saved = await page.evaluate((key) => localStorage.getItem(key), app.storage);
    expect(saved, `${app.name} save key`).toBeTruthy();
    expect(JSON.stringify(JSON.parse(saved))).toMatch(app.oracle);
    const leaked = await page.evaluate(({ key, sentinel }) => Object.keys(localStorage)
      .filter((candidate) => candidate !== key)
      .map((candidate) => localStorage.getItem(candidate) || '')
      .filter((value) => value.includes(sentinel)), { key:app.storage, sentinel:app.value });
    expect(leaked, `${app.name} stores input only in its declared local record`).toEqual([]);

    for (const [mode, value, oracle] of app.reverse || []) {
      await page.locator(app.direction).selectOption(mode);
      await page.locator(app.input).fill(value);
      await page.locator(app.submit).click();
      await expect(page.locator(app.output)).toContainText(oracle);
    }
    if (app.reset) {
      await page.locator(app.reset).click();
      await expect(page.locator(app.input)).toHaveValue('');
    }
    const privateActionRequests = actionRequests.filter((request) =>
      /\bdocument\b/i.test(request) ||
      (/\b(?:fetch|xhr|beacon)\b/i.test(request) &&
        !/google-analytics\.com|googlesyndication\.com\/measurement\//i.test(request))
    );
    expect(privateActionRequests, `${app.name} core actions remain local`).toEqual([]);
    const rawNeedles = [app.value.toLowerCase(), encodeURIComponent(app.value).toLowerCase()];
    expect(
      actionRequests.filter((request) => rawNeedles.some((needle) => request.toLowerCase().includes(needle))),
      `${app.name} input is absent from analytics and network URLs`
    ).toEqual([]);

    for (const width of [320,375]) {
      await page.setViewportSize({ width, height:900 });
      expect(await page.evaluate(() => document.querySelector('main').scrollWidth - document.querySelector('main').clientWidth), `${app.name} overflow at ${width}px`).toBeLessThanOrEqual(1);
    }
    await page.evaluate(() => { document.documentElement.style.fontSize='200%'; });
    expect(await page.evaluate(() => document.querySelector('main').scrollWidth - document.querySelector('main').clientWidth), `${app.name} 200% text overflow`).toBeLessThanOrEqual(4);
    await page.evaluate(() => { document.documentElement.style.fontSize=''; });

    for (const theme of ['light','dark']) {
      await page.evaluate((choice) => localStorage.setItem('aft_theme', choice), theme);
      await page.reload({ waitUntil:'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const colors = await page.locator('main').evaluate((element) => {
        function rgb(value) { return (value.match(/\d+(?:\.\d+)?/g) || []).slice(0,3).map(Number); }
        const style = getComputedStyle(element);
        return { fg:rgb(style.color), bg:rgb(style.backgroundColor) };
      });
      if (colors.bg.length === 3 && colors.bg.some((value) => value !== 0)) expect(contrast(colors.fg,colors.bg)).toBeGreaterThanOrEqual(4.5);
    }
    await page.evaluate(() => localStorage.removeItem('aft_theme'));
    await page.emulateMedia({ colorScheme:'dark', reducedMotion:'reduce' });
    await page.reload({ waitUntil:'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme-choice','auto');

    expect(consoleErrors, `${app.name} console errors`).toEqual([]);
    expect(failedAssets, `${app.name} failed assets`).toEqual([]);
  });
}
