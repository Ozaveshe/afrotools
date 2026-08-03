const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');
const manifest = require('../../data/localization/sw-mining-parity-manifest.json');

const definitions = {
  'diamond-valuation': { action:/Estimate value/i, english:'#o-retail', expected:'retail', outputs:['retail','wholesale','insurance','resale'], invalid:async p=>p.locator('#base').fill('') },
  'oil-well-production': { action:/Estimate production/i, english:'#o-q', expected:'q', outputs:['q','annual','net'], invalid:async p=>p.locator('#pe').fill('2000') },
  'oil-gas-revenue': { action:/Calculate split/i, english:'#o-govpct', expected:'governmentPct', outputs:['contractorNet','governmentTake','governmentPct'], invalid:async p=>{await p.locator('#vol').fill('');await p.locator('#price').fill('');await p.locator('#gross').fill('');} },
  'mining-license-fee': { action:/Calculate licence cost/i, english:'#o-total', expected:'total', outputs:['oneOffTotal','annualComputed','total'], invalid:async p=>p.locator('#annual').fill('') },
  'mining-royalty': { action:/Calculate royalty/i, english:'#mr-out-net', expected:'net', outputs:['royalty','rate','net'], invalid:async p=>p.locator('#rate').fill('') },
  'artisanal-mining-income': { action:/Calculate income/i, english:'#o-net', expected:'netPerMiner', outputs:['netPerMiner','annualPerMiner','gap'], invalid:async p=>p.locator('#team').fill('0') }
};

function numeric(text) { return Number.parseFloat(String(text).replace(/[\u00a0\u202f,]/g,'').replace(/[^\d.+-]/g,'')); }
function close(actual,expected,label,tolerance=.007) { expect(Math.abs(actual-expected),label).toBeLessThanOrEqual(Math.max(.02,Math.abs(expected)*tolerance)); }

async function localOnly(page,writes,errors) {
  await page.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));
  await page.route(/^https?:\/\//,async route=>{const url=new URL(route.request().url());if(url.hostname==='127.0.0.1')await route.continue();else await route.abort();});
  page.on('request',request=>{const url=new URL(request.url());if(url.hostname==='127.0.0.1'&&request.method()!=='GET')writes.push(`${request.method()} ${url.pathname}`);});
  page.on('console',message=>{if(message.type()==='error'&&!/Failed to load resource: net::ERR_FAILED/.test(message.text()))errors.push(message.text());});
  page.on('pageerror',error=>errors.push(error.message));
}

async function fill(page,app,sw) {
  const inputs=app.oracle.inputs;
  if(app.id==='mining-license-fee') {
    await page.locator('#country').selectOption(inputs.country);
    await page.locator('#licence').selectOption(inputs.licence);
  }
  if(app.id==='mining-royalty') {
    await page.locator(sw?'#country':'#mr-country').selectOption(inputs.country);
    await page.locator(sw?'#mineral':'#mr-mineral').selectOption(inputs.mineral);
  }
  for(const [name,value] of Object.entries(inputs)) {
    if(value===null||['country','licence','mineral'].includes(name)) continue;
    const selector=!sw&&app.id==='mining-royalty'?`#mr-${name}`:`#${name}`;
    const control=page.locator(selector); if(!await control.count()) continue;
    if(await control.evaluate(node=>node.tagName)==='SELECT') {
      const option=await control.locator('option').evaluateAll((options,target)=>(options.find(item=>Number(item.value)===Number(target))||{}).value||String(target),value);
      await control.selectOption(option);
    } else await control.fill(String(value));
  }
}

async function evidence(page,date='2026-07-15') {
  await page.getByLabel('Jina la chanzo au hati').fill('MINING-SW-SRC-42');
  await page.getByLabel('Tarehe ya kuthibitisha').fill(date);
  await page.getByLabel('Kiwango cha kujiamini').selectOption('wastani');
}

async function downloadBuffer(page,name) {
  const pending=page.waitForEvent('download'); await page.getByRole('button',{name}).click(); const item=await pending; const stream=await item.createReadStream(); const chunks=[]; for await(const chunk of stream)chunks.push(chunk); return Buffer.concat(chunks);
}

async function assertControlContrast(page,route) {
  const modes=[
    {name:'light',theme:'light',scheme:'light'},
    {name:'dark',theme:'dark',scheme:'dark'},
    {name:'system-light',theme:null,scheme:'light'},
    {name:'system-dark',theme:null,scheme:'dark'}
  ];
  const measurements={};
  for(const mode of modes) {
    await page.emulateMedia({colorScheme:mode.scheme,reducedMotion:'reduce'});
    await page.evaluate(theme=>{delete document.documentElement.dataset.themeChoice;if(theme)document.documentElement.dataset.theme=theme;else delete document.documentElement.dataset.theme;},mode.theme);
    const selectors=await page.locator('.sw-mining-field input:not([type="hidden"]), .sw-mining-field select, .sw-mining-field textarea').evaluateAll(nodes=>nodes.filter(node=>node.offsetParent!==null).map(node=>'#'+CSS.escape(node.id)));
    expect(selectors.length,`${route} ${mode.name} visible controls`).toBeGreaterThan(0);
    let boundaryMin=Infinity,textMin=Infinity,focusMin=Infinity;
    for(const selector of selectors) {
      const control=page.locator(selector);
      const normal=await control.evaluate(node=>{
        function rgb(value){const values=value.match(/[\d.]+/g);if(!values||values.length<3)throw new Error('Unparseable color: '+value);return values.slice(0,3).map(Number);}
        function channel(value){value/=255;return value<=.04045?value/12.92:Math.pow((value+.055)/1.055,2.4);}
        function luminance(value){const values=rgb(value);return .2126*channel(values[0])+.7152*channel(values[1])+.0722*channel(values[2]);}
        function ratio(left,right){const a=luminance(left),b=luminance(right);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
        const style=getComputedStyle(node);const card=getComputedStyle(node.closest('.sw-mining-card'));const controlBg=style.backgroundColor;const cardBg=card.backgroundColor;
        return{boundary:Math.min(ratio(style.borderTopColor,controlBg),ratio(style.borderTopColor,cardBg)),text:ratio(style.color,controlBg),colors:{border:style.borderTopColor,configuredBorder:style.getPropertyValue('--sw-control-border').trim(),text:style.color,background:controlBg,surface:cardBg}};
      });
      expect(normal.boundary,`${route} ${mode.name} ${selector} boundary ${JSON.stringify(normal.colors)}`).toBeGreaterThanOrEqual(3);
      expect(normal.text,`${route} ${mode.name} ${selector} text ${JSON.stringify(normal.colors)}`).toBeGreaterThanOrEqual(4.5);
      await control.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
      const focused=await control.evaluate(node=>{
        function rgb(value){return value.match(/[\d.]+/g).slice(0,3).map(Number);}function channel(value){value/=255;return value<=.04045?value/12.92:Math.pow((value+.055)/1.055,2.4);}function luminance(value){const v=rgb(value);return .2126*channel(v[0])+.7152*channel(v[1])+.0722*channel(v[2]);}function ratio(left,right){const a=luminance(left),b=luminance(right);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);}const style=getComputedStyle(node),card=getComputedStyle(node.closest('.sw-mining-card'));return{focusVisible:node.matches(':focus-visible'),outlineWidth:parseFloat(style.outlineWidth)||0,focus:Math.min(ratio(style.outlineColor,style.backgroundColor),ratio(style.outlineColor,card.backgroundColor)),colors:{outline:style.outlineColor,background:style.backgroundColor,surface:card.backgroundColor}};
      });
      expect(focused.focusVisible,`${route} ${mode.name} ${selector} keyboard focus-visible`).toBe(true);
      expect(focused.outlineWidth,`${route} ${mode.name} ${selector} focus width`).toBeGreaterThanOrEqual(2);
      expect(focused.focus,`${route} ${mode.name} ${selector} focus ${JSON.stringify(focused.colors)}`).toBeGreaterThanOrEqual(3);
      boundaryMin=Math.min(boundaryMin,normal.boundary);textMin=Math.min(textMin,normal.text);focusMin=Math.min(focusMin,focused.focus);
    }
    measurements[mode.name]={controls:selectors.length,boundaryMin:Number(boundaryMin.toFixed(3)),textMin:Number(textMin.toFixed(3)),focusMin:Number(focusMin.toFixed(3))};
  }
  console.log(`SW_MINING_CONTROL_CONTRAST ${route} ${JSON.stringify(measurements)}`);
  return measurements;
}

async function a11yThemeReflow(page,route) {
  const access=await page.evaluate(()=>{const controls=[...document.querySelectorAll('input:not([type=hidden]),select,button,a[href]')].filter(n=>n.offsetParent!==null);const sized=controls.filter(c=>!(c.matches('input[type=checkbox],input[type=file]')));return{unnamed:controls.filter(c=>!((c.labels&&c.labels.length)||c.getAttribute('aria-label')||c.getAttribute('aria-labelledby')||c.textContent.trim()||c.title)).map(c=>c.id),small:sized.filter(c=>{const b=c.getBoundingClientRect();return b.width<44||b.height<44;}).map(c=>c.id||c.textContent.trim())};});
  expect(access.unnamed,`${route} names`).toEqual([]); expect(access.small,`${route} tap targets`).toEqual([]);
  const colors=[]; for(const theme of ['light','dark']) colors.push(await page.evaluate(t=>{document.documentElement.dataset.theme=t;const s=getComputedStyle(document.querySelector('.sw-mining-card'));return s.backgroundColor+'|'+s.color;},theme)); expect(colors[0],`${route} themes`).not.toBe(colors[1]);
  for(const theme of ['light','dark']) { const ratios=await page.evaluate(t=>{document.documentElement.dataset.theme=t;function c(v){v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);}function l(s){const n=s.match(/[\d.]+/g).slice(0,3).map(Number);return .2126*c(n[0])+.7152*c(n[1])+.0722*c(n[2]);}return[...document.querySelectorAll('.sw-mining-stat span')].map(n=>{const f=l(getComputedStyle(n).color),b=l(getComputedStyle(n.closest('.sw-mining-stat')).backgroundColor);return(Math.max(f,b)+.05)/(Math.min(f,b)+.05);});},theme); ratios.forEach(r=>expect(r,`${route} ${theme} contrast`).toBeGreaterThanOrEqual(4.75)); }
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'}); const auto=await page.evaluate(()=>{delete document.documentElement.dataset.theme;document.documentElement.dataset.themeChoice='auto';return getComputedStyle(document.body).getPropertyValue('--mine').trim();}); expect(auto).toBe('#fdba74');
  for(const width of [320,375]) { await page.setViewportSize({width,height:850}); const check=await page.evaluate(w=>{document.documentElement.style.fontSize='200%';return{overflow:document.documentElement.scrollWidth-w,clipped:[...document.querySelectorAll('input,select,button,a[href],label[for]')].filter(n=>n.offsetParent!==null).filter(n=>{const b=n.getBoundingClientRect();return b.left < -2||b.right>innerWidth+2;}).length};},width); expect(check.overflow,`${route} ${width}px 200%`).toBeLessThanOrEqual(2);expect(check.clipped).toBe(0); }
}

for(const app of manifest.apps) {
  const d=definitions[app.id];
  test(`${app.id}: English owner oracle, native workflow, exports and UI proof`,async({page})=>{
    const writes=[],errors=[]; await localOnly(page,writes,errors);
    await page.goto(app.englishRoute,{waitUntil:'domcontentloaded'}); await fill(page,app,false); await page.getByRole('button',{name:d.action}).click(); const en=page.locator(d.english);await expect(en).toBeVisible();close(numeric(await en.innerText()),app.oracle.expected[d.expected],`${app.id} English owner`);
    await page.goto(app.swRoute,{waitUntil:'domcontentloaded'}); await expect(page.locator('html')).toHaveAttribute('lang','sw'); const art=page.locator('.sw-mining-art');await expect(art).toBeVisible();expect(await art.evaluate(img=>({complete:img.complete,width:img.naturalWidth,height:img.naturalHeight})),`${app.id} artwork`).toMatchObject({complete:true,width:1200,height:1200}); await fill(page,app,true);
    const submit=page.getByRole('button',{name:'Kokotoa makadirio'}); await submit.press('Enter'); await expect(page.getByLabel('Jina la chanzo au hati')).toBeFocused(); await expect(page.locator('#result')).toBeHidden(); await evidence(page); await submit.press('Enter'); await expect(page.locator('#result')).toBeVisible();await expect(page.locator('#result')).toBeFocused();
    for(const key of d.outputs) { const raw=Number(await page.locator(`[data-output="${key}"]`).getAttribute('data-raw'));close(raw,app.oracle.expected[key],`${app.id}.${key}`,1e-10); }
    await expect(page.locator('#result')).not.toContainText(/NaN|Infinity|undefined/);await expect(page.locator('#source-summary')).toContainText('MINING-SW-SRC-42');await expect(page.locator('#source-summary')).toContainText('ya karibuni');
    const jsonBuffer=await downloadBuffer(page,'Pakua JSON');const exported=JSON.parse(jsonBuffer.toString('utf8'));expect(exported.toolId).toBe(app.id);expect(exported.planningOnly).toBe(true);expect(exported.evidence.sourceName).toBe('MINING-SW-SRC-42');
    const csv=(await downloadBuffer(page,'Pakua CSV')).toString('utf8');expect(csv).toContain('toolId,'+app.id);expect(csv).toContain('sourceName,MINING-SW-SRC-42');
    const pdf=await downloadBuffer(page,'Pakua PDF');expect(pdf.subarray(0,5).toString()).toBe('%PDF-');const parsed=await pdfParse(pdf);expect(parsed.text).toContain('AfroTools');expect(parsed.text).toContain('MINING-SW-SRC-42');expect(parsed.text).toContain('2026-07-15');
    await page.locator('#import-json').setInputFiles({name:'ripoti.json',mimeType:'application/json',buffer:jsonBuffer});await expect(page.locator('#result')).toBeVisible();for(const key of d.outputs)close(Number(await page.locator(`[data-output="${key}"]`).getAttribute('data-raw')),app.oracle.expected[key],`${app.id} reopened ${key}`,1e-10);
    await expect(page.locator('#ai-link')).toHaveAttribute('aria-disabled','true');await page.locator('#ai-consent').check();await expect(page.locator('#ai-link')).toHaveAttribute('aria-disabled','false');await expect(page.locator('#ai-link')).toHaveAttribute('href',`/sw/ai/?tool=${app.id}`);
    await assertControlContrast(page,app.swRoute);
    await a11yThemeReflow(page,app.swRoute);await page.evaluate(()=>{document.documentElement.style.fontSize='';document.documentElement.dataset.theme='light';});
    await page.locator('#sourceDate').fill('2025-01-01');await submit.click();await expect(page.locator('#result')).toHaveClass(/is-stale/);await expect(page.locator('#status')).toContainText(/kilichopitwa na wakati/i);
    await d.invalid(page);await expect(page.locator('#result')).toBeHidden();for(const id of ['#export-json','#export-csv','#export-pdf'])await expect(page.locator(id)).toBeDisabled();await submit.click();await expect(page.locator('#result')).toBeHidden();
    expect(writes,`${app.id} network writes`).toEqual([]);expect(errors,`${app.id} console/page errors`).toEqual([]);
  });
}
