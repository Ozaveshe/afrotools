const { test, expect } = require('@playwright/test');
const fs = require('fs');

const route = '/sw/zana/urithi-wa-faraid/';
test.describe.configure({ mode: 'serial' });

async function settle(page) {
  await page.evaluate(() => document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))));
  await expect.poll(() => page.evaluate(() => Boolean(window.AfroTools && window.AfroTools.darkMode)), { timeout: 15000 }).toBe(true);
}

async function open(page, width = 375) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await settle(page);
}

async function theme(page, mode) {
  if (mode === 'light' || mode === 'dark') {
    await page.evaluate(value => window.AfroTools.darkMode.set(value), mode);
    await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
    await expect.poll(() => page.evaluate(() => window.AfroTools.darkMode.get())).toBe(mode);
  } else {
    const scheme = mode === 'system-dark' ? 'dark' : 'light';
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    await page.evaluate(() => localStorage.removeItem('aft_theme'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await settle(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
    await expect.poll(() => page.evaluate(() => window.AfroTools.darkMode.get())).toBe('auto');
  }
  await page.evaluate(() => document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))));
}

async function computedAudit(page) {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1; canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const ignored = 'script,style,noscript,template,afro-navbar,afro-footer,#afro-theme-fallback-toggle,[aria-hidden="true"]';
    const parse = value => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillStyle = String(value || 'transparent'); ctx.fillRect(0, 0, 1, 1); const p = ctx.getImageData(0, 0, 1, 1).data; return [p[0], p[1], p[2], p[3] / 255]; };
    const composite = (fg, bg) => { const a = fg[3] + bg[3] * (1 - fg[3]); return a ? [(fg[0] * fg[3] + bg[0] * bg[3] * (1 - fg[3])) / a, (fg[1] * fg[3] + bg[1] * bg[3] * (1 - fg[3])) / a, (fg[2] * fg[3] + bg[2] * bg[3] * (1 - fg[3])) / a, a] : [0, 0, 0, 0]; };
    const lum = color => color.slice(0, 3).map(channel => { const v = channel / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, channel, i) => sum + channel * [.2126, .7152, .0722][i], 0);
    const contrast = (a, b) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
    const visible = element => { if (!element || element.closest(ignored)) return false; if (typeof element.checkVisibility === 'function' && !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false; const style = getComputedStyle(element); const rect = element.getBoundingClientRect(); return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0; };
    const background = element => { const layers = []; for (let current = element; current; current = current.parentElement) layers.push(parse(getComputedStyle(current).backgroundColor)); let out = parse(getComputedStyle(document.documentElement).colorScheme.includes('dark') ? '#07111f' : '#fff'); for (let i = layers.length - 1; i >= 0; i -= 1) out = composite(layers[i], out); return out; };
    const failures = []; let minText = Infinity; let minBoundary = Infinity; let textCount = 0; let boundaryCount = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode(node) { return node.textContent.trim() && visible(node.parentElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
    while (walker.nextNode()) { const element = walker.currentNode.parentElement; const style = getComputedStyle(element); const ratio = contrast(composite(parse(style.color), background(element)), background(element)); const size = parseFloat(style.fontSize); const large = size >= 24 || (size >= 18.66 && parseInt(style.fontWeight, 10) >= 700); const minimum = large ? 3 : 4.5; minText = Math.min(minText, ratio); textCount += 1; if (ratio + .005 < minimum) failures.push(`text ${element.tagName} ${element.getAttribute('href') || element.id || element.textContent.trim().slice(0,30)} ${ratio.toFixed(2)}`); }
    document.querySelectorAll('input,select,button,a[href]').forEach(element => {
      if (!visible(element)) return;
      const style = getComputedStyle(element); const adjacent = background(element.parentElement || element); const own = background(element); const border = composite(parse(style.borderColor), adjacent); const boundary = Math.max(contrast(border, adjacent), contrast(own, adjacent));
      const inlineLink = element.tagName === 'A' && style.textDecorationLine.includes('underline') && contrast(own, adjacent) < 1.05;
      if (!inlineLink) { minBoundary = Math.min(minBoundary, boundary); boundaryCount += 1; if (boundary + .005 < 3) failures.push(`${element.id || element.tagName} boundary ${boundary.toFixed(2)} border=${style.borderColor} own=${style.backgroundColor}`); }
      const textless = element.matches('input[type="checkbox"],input[type="radio"]');
      if (!textless) { const textRatio = contrast(composite(parse(style.color), own), own); if (textRatio + .005 < 4.5) failures.push(`${element.id || element.getAttribute('href') || element.tagName} control-text ${textRatio.toFixed(2)}`); }
      const rect = element.getBoundingClientRect(); if (!inlineLink && (rect.width < 24 || rect.height < 24)) failures.push(`${element.id || element.tagName} target ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}`);
    });
    return { failures, minText: Number(minText.toFixed(2)), minBoundary: Number(minBoundary.toFixed(2)), textCount, boundaryCount };
  });
}

async function focusAudit(page) {
  const count = await page.evaluate(() => {
    const ignored = 'afro-navbar,afro-footer,#afro-theme-fallback-toggle,[aria-hidden="true"]';
    const elements = Array.from(document.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled)')).filter(element => !element.closest(ignored) && element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }));
    elements.forEach((element, index) => element.dataset.faraidFocus = String(index)); return elements.length;
  });
  let minimum = Infinity; const failures = [];
  for (let index = 0; index < count; index += 1) {
    const control = page.locator(`[data-faraid-focus="${index}"]`); await control.scrollIntoViewIfNeeded(); await control.focus(); await expect(control).toBeFocused();
    const result = await control.evaluate(element => {
      const canvas = document.createElement('canvas'); canvas.width = 1; canvas.height = 1; const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const parse = value => { ctx.clearRect(0,0,1,1); ctx.fillStyle='rgba(0,0,0,0)'; ctx.fillStyle=String(value||'transparent'); ctx.fillRect(0,0,1,1); const p=ctx.getImageData(0,0,1,1).data; return [p[0],p[1],p[2],p[3]/255]; };
      const comp=(fg,bg)=>{const a=fg[3]+bg[3]*(1-fg[3]);return a?[(fg[0]*fg[3]+bg[0]*bg[3]*(1-fg[3]))/a,(fg[1]*fg[3]+bg[1]*bg[3]*(1-fg[3]))/a,(fg[2]*fg[3]+bg[2]*bg[3]*(1-fg[3]))/a,a]:[0,0,0,0];};
      const bg=target=>{const layers=[];for(let current=target;current;current=current.parentElement)layers.push(parse(getComputedStyle(current).backgroundColor));let out=parse(getComputedStyle(document.documentElement).colorScheme.includes('dark')?'#07111f':'#fff');for(let i=layers.length-1;i>=0;i-=1)out=comp(layers[i],out);return out;};
      const lum=c=>c.slice(0,3).map(x=>{const v=x/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0); const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
      const style=getComputedStyle(element), adjacent=bg(element.parentElement||element); return { contrast:ratio(comp(parse(style.outlineColor),adjacent),adjacent), width:parseFloat(style.outlineWidth), offset:parseFloat(style.outlineOffset), outlineStyle:style.outlineStyle, element:element.id||element.getAttribute('href')||element.tagName };
    });
    minimum = Math.min(minimum, result.contrast); if (result.contrast + .005 < 3 || result.width < 2 || result.offset < 2 || result.outlineStyle === 'none') failures.push(result);
  }
  return { failures, minimum: Number(minimum.toFixed(2)), count };
}

test('native workflow validates, gates stale exports, copies, downloads, prints, stores locally and works offline', async ({ page, context }) => {
  test.setTimeout(120000);
  const pageErrors = []; const consoleErrors = []; const posts = [];
  page.on('pageerror', error => pageErrors.push(error.message)); page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('request', request => { if (request.method() !== 'GET' && request.method() !== 'HEAD') posts.push({ method: request.method(), url: request.url(), data: request.postData() }); });
  await page.addInitScript(() => { window.print = () => { window.__faraidPrinted = true; }; });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']); await open(page);
  await expect(page.locator('#faraid-form input,#faraid-form select')).toHaveCount(14);
  expect(await page.locator('#faraid-form input,#faraid-form select').evaluateAll(nodes => nodes.every(node => node.labels && node.labels.length === 1))).toBe(true);
  await expect.poll(() => page.locator('[data-faraid-export]').evaluateAll(nodes => nodes.every(node => node.disabled))).toBe(true);
  await page.getByRole('button', { name: 'Hesabu mafungu' }).click();
  await expect(page.locator('#faraid-net')).not.toHaveText('—'); await expect(page.locator('#faraid-share-rows tr')).toHaveCount(5); await expect.poll(() => page.locator('[data-faraid-export]').evaluateAll(nodes => nodes.every(node => !node.disabled))).toBe(true);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('afrotools-sw-faraid-draft-v1'))); expect(stored.result.netEstate).toBe(10000000);
  await page.getByLabel('Mali ghafi').fill('13000000'); await expect.poll(() => page.locator('[data-faraid-export]').evaluateAll(nodes => nodes.every(node => node.disabled))).toBe(true); await expect(page.locator('#faraid-status')).toContainText('Thamani zimebadilika');
  await page.getByLabel('Mali ghafi').fill('-1'); await page.getByRole('button', { name: 'Hesabu mafungu' }).click(); await expect(page.locator('#error-estate')).toContainText('sifuri au zaidi'); await expect.poll(() => page.locator('[data-faraid-export]').evaluateAll(nodes => nodes.every(node => node.disabled))).toBe(true);
  await page.getByLabel('Mali ghafi').fill('12000000'); await page.getByRole('button', { name: 'Hesabu mafungu' }).click();
  await page.getByRole('button', { name: 'Nakili matokeo' }).click(); await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('Matokeo ya Kikokotoo cha Urithi wa Faraid');
  const downloadPromise = page.waitForEvent('download'); await page.getByRole('button', { name: 'Pakua CSV' }).click(); const download = await downloadPromise; expect(download.suggestedFilename()).toBe('afrotools-urithi-wa-faraid.csv'); const csv = fs.readFileSync(await download.path(), 'utf8'); expect(csv).toContain('Mali halisi'); expect(csv).toContain('10000000');
  await page.getByRole('button', { name: 'Chapisha' }).click(); expect(await page.evaluate(() => window.__faraidPrinted)).toBe(true);
  await context.setOffline(true); await page.getByLabel('Madeni na dhima zilizothibitishwa').fill('1000000'); await page.getByRole('button', { name: 'Hesabu mafungu' }).click(); await expect(page.locator('#faraid-net')).not.toHaveText('—'); await context.setOffline(false);
  expect(posts).toEqual([]); expect(pageErrors).toEqual([]); expect(consoleErrors).toEqual([]);
});

test('four theme modes pass full computed text, boundary and keyboard focus traversal', async ({ page }) => {
  test.setTimeout(240000); await open(page); const receipt = [];
  for (const mode of ['system-light','system-dark','light','dark']) {
    await theme(page, mode); const computed = await computedAudit(page); const focus = await focusAudit(page);
    expect(computed.failures, `${mode}: ${JSON.stringify(computed)}`).toEqual([]); expect(focus.failures, `${mode}: ${JSON.stringify(focus)}`).toEqual([]);
    receipt.push({ theme: mode, textMinimum: computed.minText, boundaryMinimum: computed.minBoundary, focusMinimum: focus.minimum, textNodes: computed.textCount, boundaries: computed.boundaryCount, focusables: focus.count });
  }
  console.log(`SW_FARAID_A11Y_RECEIPT ${JSON.stringify(receipt)}`);
});

for (const [width, zoom] of [[320,100],[375,100],[375,200]]) {
  test(`native Faraid reflows at ${width}px and ${zoom}% text`, async ({ page }) => {
    await open(page, width); await page.evaluate(percent => { document.documentElement.style.fontSize = `${percent}%`; return document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); }, zoom);
    const result = await page.evaluate(() => { const visible = element => element.checkVisibility({ checkOpacity:true, checkVisibilityCSS:true }); const offenders = Array.from(document.querySelectorAll('main *,header *')).filter(element => visible(element)).flatMap(element => { const rect=element.getBoundingClientRect(); return rect.left < -1 || rect.right > innerWidth + 1 ? [`${element.tagName}.${element.className} ${rect.left.toFixed(1)}..${rect.right.toFixed(1)}`] : []; }); const main=document.querySelector('main'); return { bodyOverflow:document.body.scrollWidth-document.body.clientWidth, mainOverflow:main.scrollWidth-main.clientWidth, offenders }; });
    expect(result.bodyOverflow, JSON.stringify(result)).toBeLessThanOrEqual(1); expect(result.mainOverflow, JSON.stringify(result)).toBeLessThanOrEqual(1); expect(result.offenders, JSON.stringify(result)).toEqual([]); console.log(`SW_FARAID_REFLOW_RECEIPT ${JSON.stringify({ width, zoom, ...result })}`);
  });
}
