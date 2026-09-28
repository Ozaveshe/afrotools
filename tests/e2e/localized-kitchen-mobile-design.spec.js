const fs = require('node:fs');
const { test, expect } = require('@playwright/test');

const locales = {
  fr: { kitchen: '/fr/tools/afrocuisine/', land: '/fr/tools/taille-terrain/', headers: ['Ingrédient', 'Quantité adaptée', 'Unité'] },
  sw: { kitchen: '/sw/zana/jikoni/', land: '/sw/zana/ukubwa-wa-ardhi/', headers: ['Kiungo', 'Kiasi', 'Kipimo'] },
};

async function openLocal(page, baseURL, route, width, theme) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: 850 });
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await page.addInitScript(selectedTheme => {
    localStorage.setItem('aft_theme', selectedTheme);
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } });
  }, theme);
  await page.route('**/*', route => {
    const request = route.request();
    return new URL(request.url()).origin === new URL(baseURL).origin && request.method() === 'GET' ? route.continue() : route.abort();
  });
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await expect(page.locator('afro-navbar')).toBeVisible();
  return errors;
}

async function usableFocus(locator) {
  await expect(locator).toBeFocused();
  await expect.poll(() => locator.evaluate(node => {
    const r = node.getBoundingClientRect();
    const host = document.querySelector('afro-navbar');
    const nav = host && (host.shadowRoot && host.shadowRoot.querySelector('nav') || host);
    const header = nav.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    const style = getComputedStyle(node);
    return r.top >= header.bottom && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth && (hit === node || node.contains(hit)) && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
  })).toBe(true);
}

async function tableGeometry(page) {
  return page.locator('[data-ua-table]').evaluate(table => {
    const box = n => { const r = n.getBoundingClientRect(); return { top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width }; };
    return {
      display: getComputedStyle(table).display,
      bounds: box(table),
      activeTag:document.activeElement.tagName,
      scrollBehavior:getComputedStyle(document.documentElement).scrollBehavior,
      overflowAnchor:getComputedStyle(document.documentElement).overflowAnchor,
      wrapper: { overflow:getComputedStyle(table.parentElement).overflow, scrollHeight:table.parentElement.scrollHeight, clientHeight:table.parentElement.clientHeight, tabindex:table.parentElement.getAttribute('tabindex') },
      rows: [...table.tBodies[0].rows].map(row => ({ bounds:box(row), cells:[...row.cells].map(cell=>{
        const range = document.createRange(); range.selectNodeContents(cell);
        return { text:cell.textContent, display:getComputedStyle(cell).display, bounds:box(cell), textBounds:[...range.getClientRects()].map(r=>({top:r.top,bottom:r.bottom,left:r.left,right:r.right})), scrollWidth:cell.scrollWidth, clientWidth:cell.clientWidth };
      }) })),
      overflow: Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth),
    };
  });
}

async function contrast(page) {
  return page.evaluate(() => {
    const rgb = c => c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
    const lum = c => { const v=rgb(c); return .2126*v[0]+.7152*v[1]+.0722*v[2]; };
    return ['[data-ua-table] th','[data-ua-table] td','label[for="ua-targetServings"]','[data-ua-status]','.ua-privacy p'].map(selector=>{
      const n=document.querySelector(selector); const s=getComputedStyle(n); let parent=n;
      while(parent && getComputedStyle(parent).backgroundColor==='rgba(0, 0, 0, 0)') parent=parent.parentElement;
      const background=getComputedStyle(parent).backgroundColor; const values=[lum(s.color),lum(background)].sort((a,b)=>b-a);
      return { selector,color:s.color,background,ratio:(values[0]+.05)/(values[1]+.05) };
    });
  });
}

async function stickyHeaders(page) {
  return page.locator('[data-ua-table] th').evaluateAll(headers => {
    const host=document.querySelector('afro-navbar');
    const nav=host.shadowRoot && host.shadowRoot.querySelector('nav') || host;
    const navBottom=nav.getBoundingClientRect().bottom;
    return headers.map(th=>{
      const r=th.getBoundingClientRect();
      const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      const range=document.createRange();range.selectNodeContents(th);
      return { text:th.textContent,top:r.top,bottom:r.bottom,left:r.left,right:r.right,navBottom,hit:hit && hit.closest('th')===th,textBounds:[...range.getClientRects()].map(b=>({top:b.top,bottom:b.bottom,left:b.left,right:b.right})) };
    });
  });
}

async function successfulResultFocus(page) {
  await expect(page.locator('[data-ua-result]')).toBeFocused();
  await expect.poll(()=>page.locator('[data-ua-result] header').evaluate(header=>{
    const host=document.querySelector('afro-navbar');
    const nav=host.shadowRoot && host.shadowRoot.querySelector('nav') || host;
    return [...header.querySelectorAll('p,h2')].every(n=>{
      const r=n.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return r.top>=nav.getBoundingClientRect().bottom && r.bottom<=innerHeight && (hit===n || n.contains(hit));
    });
  })).toBe(true);
  return page.locator('[data-ua-result]').evaluate(section=>({focused:document.activeElement===section,top:section.getBoundingClientRect().top,titleTop:section.querySelector('h2').getBoundingClientRect().top,titleBottom:section.querySelector('h2').getBoundingClientRect().bottom}));
}

for (const [locale, routes] of Object.entries(locales)) {
  for (const width of [320,390]) for (const theme of ['light','dark']) {
    test(`localized Kitchen native ingredient rows ${locale} ${width}px ${theme}`, async ({ page,baseURL },testInfo) => {
      const errors=await openLocal(page,baseURL,routes.kitchen,width,theme);
      const target=page.locator('#ua-targetServings');
      await expect(page.locator('#ua-recipe option')).toHaveCount(8);
      await target.focus();
      await page.keyboard.press('Tab');
      await usableFocus(page.locator('#ua-originalServings'));
      await page.keyboard.press('Tab');
      await usableFocus(page.locator('.ua-primary'));
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-ua-table] tbody tr')).toHaveCount(15);
      const resultFocus=await successfulResultFocus(page);
      expect(await page.locator('[data-ua-table] th').allTextContents()).toEqual(routes.headers);
      const geometry=await tableGeometry(page);
      expect(geometry.display).toBe('table');
      expect(geometry.overflow).toBe(0);
      expect(geometry.wrapper.overflow).toBe('visible');
      expect(geometry.wrapper.tabindex).toBeNull();
      expect(geometry.wrapper.scrollHeight).toBe(geometry.wrapper.clientHeight);
      expect(geometry.rows[0].cells.map(c=>c.text)).toEqual(['long-grain parboiled rice','6','cups']);
      expect(geometry.rows.at(-1).cells.map(c=>c.text)).toEqual(['butter','2','tablespoon']);
      const stock=geometry.rows.find(row=>row.cells[0].text==='chicken stock or water');
      expect(stock.cells[1].text.replace(/\s/g,'')).toBe(locale==='fr'?'1500':'1,500');
      expect(stock.cells[2].text).toBe('ml');
      for (const row of geometry.rows) {
        expect(row.cells).toHaveLength(3);
        for (const [i,cell] of row.cells.entries()) {
          expect(cell.display).toBe('table-cell');
          expect(Math.abs(cell.bounds.top-row.bounds.top)).toBeLessThan(1);
          expect(cell.bounds.left).toBeGreaterThanOrEqual(geometry.bounds.left-1);
          expect(cell.bounds.right).toBeLessThanOrEqual(geometry.bounds.right+1);
          if(i) expect(cell.bounds.left).toBeGreaterThanOrEqual(row.cells[i-1].bounds.right-1);
          expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth+1);
          if(i===2 && ['teaspoon','tablespoon'].includes(cell.text)) expect(cell.textBounds).toHaveLength(1);
          for(const rect of cell.textBounds) {
            expect(rect.left).toBeGreaterThanOrEqual(cell.bounds.left-1);
            expect(rect.right).toBeLessThanOrEqual(cell.bounds.right+1);
            expect(rect.bottom).toBeLessThanOrEqual(row.bounds.bottom+1);
          }
        }
      }
      const colors=await contrast(page);
      for(const color of colors) expect(color.ratio, color.selector).toBeGreaterThanOrEqual(4.5);
      const recipeMeta=page.locator('.ua-recipe-meta');
      let metadata=[];
      if(await recipeMeta.count()) {
        expect(await recipeMeta.locator(':scope > *').allTextContents()).toEqual(['Nigerian Jollof Rice','Jòlóf Rice','Nigeria · West Africa']);
        metadata=await recipeMeta.locator(':scope > *').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{text:n.textContent,top:r.top,bottom:r.bottom,left:r.left,right:r.right};}));
        for(let i=1;i<metadata.length;i++) expect(metadata[i].top).toBeGreaterThanOrEqual(metadata[i-1].bottom+3);
        await recipeMeta.evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));
        await expect.poll(()=>recipeMeta.evaluate(n=>{const r=n.getBoundingClientRect();return r.top>=56 && r.bottom<=innerHeight;})).toBe(true);
        await page.screenshot({path:testInfo.outputPath('recipe-metadata.png')});
      }
      const boundaries=await page.locator('.ua-context,.ua-privacy').evaluateAll(nodes=>nodes.map(n=>{
        const s=getComputedStyle(n);return {left:s.borderLeftWidth,right:s.borderRightWidth,leftColor:s.borderLeftColor,rightColor:s.borderRightColor,text:n.textContent};
      }));
      for(const boundary of boundaries) {
        expect(boundary.left).toBe('1px'); expect(boundary.left).toBe(boundary.right); expect(boundary.leftColor).toBe(boundary.rightColor); expect(boundary.text.trim()).not.toBe('');
      }
      await page.locator('[data-ua-table]').evaluate(n=>n.scrollIntoView({block:'start',behavior:'instant'}));
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const initialTableTop=await page.locator('[data-ua-table]').evaluate(n=>n.getBoundingClientRect().top);
      await page.mouse.move(width/2,400);
      await page.mouse.wheel(0,initialTableTop-64);
      await expect.poll(()=>page.locator('[data-ua-table]').evaluate(n=>Math.abs(n.getBoundingClientRect().top-64)<1)).toBe(true);
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      await page.screenshot({path:testInfo.outputPath('native-table-first-rows.png')});
      const headers=[];
      for(const distance of [180,180]) {
        const beforeScroll=await page.evaluate(()=>scrollY);
        await page.mouse.wheel(0,distance);
        await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(beforeScroll);
        await expect.poll(async()=>{
          const result=await stickyHeaders(page);return result.every(h=>Math.abs(h.top-h.navBottom)<1 && h.hit);
        }).toBe(true);
        const current=await stickyHeaders(page);
        expect(current[1].textBounds.length).toBeLessThanOrEqual(locale==='fr'?2:1);
        for(const header of current) for(const rect of header.textBounds) {
          expect(rect.left).toBeGreaterThanOrEqual(header.left-1);
          expect(rect.right).toBeLessThanOrEqual(header.right+1);
          expect(rect.top).toBeGreaterThanOrEqual(header.top-1);
          expect(rect.bottom).toBeLessThanOrEqual(header.bottom+1);
        }
        headers.push(current);
      }
      await page.screenshot({path:testInfo.outputPath('native-table-sticky-headers.png')});
      await page.locator('[data-ua-export="txt"]').evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));
      await page.locator('[data-ua-export="txt"]').focus();
      await usableFocus(page.locator('[data-ua-export="txt"]'));
      const pending=page.waitForEvent('download');
      await page.keyboard.press('Enter');
      const download=await pending;
      expect(await download.failure()).toBeNull();
      const text=fs.readFileSync(await download.path(),'utf8');
      expect(text).toContain('long-grain parboiled rice: 6 cups');
      await target.fill('0');
      await page.locator('.ua-primary').click();
      await usableFocus(target);
      await expect(page.locator('[data-ua-table] tbody tr')).toHaveCount(0);
      const meta=page.locator('.ua-recipe-meta');
      if(await meta.count()) { await expect(meta).toBeEmpty(); await expect(meta).toBeHidden(); }
      await page.locator('[data-ua-reset]').click();
      await usableFocus(page.locator('#ua-recipe'));
      await expect(page.locator('[data-ua-result]')).toBeHidden();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBe(0);
      expect(errors).toEqual([]);
      fs.writeFileSync(testInfo.outputPath('native-rows-and-headers.json'),JSON.stringify({ locale,width,theme,resultFocus,geometry,metadata,headers,colors,boundaries },null,2));
    });
  }

  test(`localized non-Kitchen layout remains unchanged ${locale}`,async({page,baseURL})=>{
    const errors=await openLocal(page,baseURL,routes.land,320,'dark');
    await page.locator('[data-ua-field="mode"]').selectOption('area');
    await page.locator('[data-ua-field="unit"]').selectOption('sqm');
    await page.locator('[data-ua-field="area"]').fill('100');
    await page.locator('.ua-primary').click();
    await expect(page.locator('[data-ua-table] tbody tr')).not.toHaveCount(0);
    expect(await page.locator('[data-ua-table]').evaluate(n=>getComputedStyle(n).display)).toBe('block');
    expect(await page.locator('[data-ua-table] th').first().evaluate(n=>getComputedStyle(n).position)).toBe('static');
    for(const node of await page.locator('.ua-context,.ua-privacy').all()) {
      const widths=await node.evaluate(n=>({left:parseFloat(getComputedStyle(n).borderLeftWidth),right:parseFloat(getComputedStyle(n).borderRightWidth)}));
      expect(widths.left).toBeGreaterThan(widths.right);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBe(0);
    expect(errors).toEqual([]);
  });
}
