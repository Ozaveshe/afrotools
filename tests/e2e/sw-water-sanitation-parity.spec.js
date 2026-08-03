'use strict';

const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const manifest = require('../../data/localization/sw-water-sanitation-parity-manifest.json');

const definitions = {
  'septic-tank': {
    englishButton: /Calculate Septic Tank/i,
    englishInputs: { '#st-country':'TZ','#st-people':'8','#st-btype':'residential','#st-toilets':'3','#st-soil':'loam','#st-material':'concrete','#st-soak':'yes' },
    englishResult:'#st-results',
    fields: { country:'TZ',people:'8',buildingType:'residential',toilets:'3',soil:'loam',material:'concrete',includeSoakaway:'yes' },
    boundary: { country:'KE',people:'1',buildingType:'office',toilets:'1',soil:'sandy',material:'plastic',includeSoakaway:'no' },
    boundaryRaw: { volume:2,total:70000,chambers:2 },
    invalidField:'people',
    primaryOutputs:['volume','total','chambers'],
    copyTotals:{ 'Jumla':3694000 },
    breakdownRows:7
  },
  'plumbing-material': {
    englishButton: /Calculate Materials & Cost/i,
    englishInputs: { '#pm-country':'TZ','#pm-type':'3bed','#pm-pipe':'ppr','#pm-baths':'3','#pm-tank':'yes','#pm-tank-size':'2000','#pm-labour':'yes' },
    englishResult:'#pm-results',
    fields: { country:'TZ',buildingType:'3bed',pipeType:'ppr',bathrooms:'3',includeTank:'yes',tankSize:'2000',includeLabour:'yes' },
    boundary: { country:'KE',buildingType:'1bed',pipeType:'upvc',bathrooms:'1',includeTank:'no',tankSize:'500',includeLabour:'no' },
    boundaryRaw: { materialTotal:44100,labourCost:0,total:44100,perBathroom:44100 },
    invalidField:'bathrooms',
    primaryOutputs:['materialTotal','labourCost','total','perBathroom'],
    copyTotals:{ 'Vifaa':4561000,'Kazi':780000,'Jumla':5341000 },
    breakdownRows:8
  }
};

function close(actual, expected, label) {
  const tolerance = Math.max(1e-9, Math.abs(expected) * 1e-12);
  expect(Math.abs(actual - expected), label).toBeLessThanOrEqual(tolerance);
}

function currencyNumber(value) {
  const matches = String(value).match(/[\d,.]+/g);
  if (!matches) return NaN;
  return Number(matches[matches.length - 1].replace(/,/g, ''));
}

function parseCopy(text) {
  const result = { lines:{}, bom:{} };
  for (const line of text.split(/\r?\n/)) {
    const bom = line.match(/^- ([^:]+): ([\d,.]+) ([^;]+); (.+)$/);
    if (bom) {
      result.bom[bom[1]] = { qty:Number(bom[2].replace(/,/g,'')), unit:bom[3], total:currencyNumber(bom[4]) };
      continue;
    }
    const entry = line.match(/^([^:]+):\s*(.+)$/);
    if (entry) result.lines[entry[1]] = entry[2];
  }
  return result;
}

function rgbChannels(value) {
  const values = String(value).match(/[\d.]+/g);
  if (!values || values.length < 3) throw new Error(`Unsupported colour ${value}`);
  return values.slice(0,3).map(Number);
}

function contrastRatio(first, second) {
  const luminance = value => {
    const linear = rgbChannels(value).map(channel => {
      const normal = channel / 255;
      return normal <= 0.03928 ? normal / 12.92 : ((normal + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a,b) + 0.05) / (Math.min(a,b) + 0.05);
}

async function fill(page, values) {
  for (const [id, value] of Object.entries(values)) {
    const control = page.locator(`#${id}`);
    if (await control.evaluate(node => node.tagName === 'SELECT')) await control.selectOption(value);
    else await control.fill(value);
  }
}

async function fillEnglish(page, values) {
  for (const [selector, value] of Object.entries(values)) {
    const control = page.locator(selector);
    if (await control.evaluate(node => node.tagName === 'SELECT')) await control.selectOption(value);
    else await control.fill(value);
  }
}

async function rawOutput(page, key) {
  return Number(await page.locator(`[data-output="${key}"]`).getAttribute('data-raw'));
}

async function assertReport(page, expected) {
  for (const [key, value] of Object.entries(expected)) close(await rawOutput(page,key), value, key);
}

async function downloadText(page, kind) {
  const pending = page.waitForEvent('download');
  await page.locator(`[data-water-export="${kind}"]`).click();
  const download = await pending;
  const file = await download.path();
  return { file, text:fs.readFileSync(file,'utf8'), name:download.suggestedFilename() };
}

async function setTheme(page, mode) {
  const dark = mode.endsWith('dark');
  await page.emulateMedia({ colorScheme:dark?'dark':'light', reducedMotion:'reduce' });
  await page.evaluate(({ mode }) => {
    const html = document.documentElement;
    if (mode.startsWith('system')) {
      html.removeAttribute('data-theme');
      html.setAttribute('data-theme-choice','auto');
    } else {
      html.removeAttribute('data-theme-choice');
      html.setAttribute('data-theme',mode);
    }
  }, { mode });
}

async function controlContrast(page) {
  const ids=await page.locator('.sw-water-field input,.sw-water-field select,.sw-water-field textarea').evaluateAll(controls=>controls.map(control=>control.id));
  const results=[];
  for(const id of ids){
    const control=page.locator(`#${id}`);
    await control.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(control,`${id} keyboard focus`).toBeFocused();
    const metric=await control.evaluate(element=>{
      const style=getComputedStyle(element),surface=getComputedStyle(element.closest('.sw-water-card')).backgroundColor;
      return {id:element.id,border:style.borderTopColor,controlSurface:style.backgroundColor,surface,textColor:style.color,outlineColor:style.outlineColor,outline:style.outlineStyle,width:style.outlineWidth,offset:style.outlineOffset,focusVisible:element.matches(':focus-visible')};
    });
    results.push({...metric,boundary:Math.min(contrastRatio(metric.border,metric.controlSurface),contrastRatio(metric.border,metric.surface)),text:contrastRatio(metric.textColor,metric.controlSurface),focus:contrastRatio(metric.outlineColor,metric.surface)});
  }
  return results;
}

async function normalTextContrast(page) {
  return page.locator('.sw-water-shell').evaluate(shell => {
    const rgb = value => {
      const values=String(value).match(/[\d.]+/g);
      return values&&values.slice(0,3).map(Number);
    };
    const ratio = (a,b) => {
      const lum=value=>{const channels=rgb(value).map(channel=>{const n=channel/255;return n<=.03928?n/12.92:((n+.055)/1.055)**2.4;});return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];};
      const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
    };
    const opaqueBackground = element => {
      for (let node=element;node;node=node.parentElement) {
        const value=getComputedStyle(node).backgroundColor,channels=String(value).match(/[\d.]+/g);
        if (channels && Number(channels[3] == null ? 1 : channels[3]) >= .95) return value;
      }
      return 'rgb(255,255,255)';
    };
    const seen=new Set(),pairs=[];
    const walker=document.createTreeWalker(shell,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()) {
      const text=walker.currentNode.nodeValue.trim();
      const element=walker.currentNode.parentElement;
      if (!text || !element || seen.has(element) || !element.getClientRects().length || element.closest('[hidden],button:disabled,[aria-disabled="true"],.sw-water-hero')) continue;
      seen.add(element);
      const style=getComputedStyle(element),font=parseFloat(style.fontSize),weight=parseInt(style.fontWeight,10)||400;
      const large=font>=24||(font>=18.66&&weight>=700);
      if (!large) pairs.push({ label:text.slice(0,48),ratio:ratio(style.color,opaqueBackground(element)),required:4.5,foreground:style.color,background:opaqueBackground(element) });
    }
    const hero=getComputedStyle(shell.querySelector('.sw-water-hero'));
    const stops=hero.backgroundImage.match(/rgba?\([^)]*\)/g)||['rgb(3,105,161)','rgb(12,74,110)'];
    shell.querySelectorAll('.sw-water-hero h1,.sw-water-hero p').forEach(element=>{
      const style=getComputedStyle(element),color=style.color,font=parseFloat(style.fontSize),weight=parseInt(style.fontWeight,10)||400;
      const large=font>=24||(font>=18.66&&weight>=700);
      pairs.push({label:element.textContent.trim().slice(0,48),ratio:Math.min(...stops.map(stop=>ratio(color,stop))),required:large?3:4.5,font,weight,foreground:color,background:stops.join('|')});
    });
    return pairs;
  });
}

async function assertReflowAndA11y(page, appId, width, resizeText) {
  await page.setViewportSize({ width, height:900 });
  await page.evaluate(resize => { document.documentElement.style.fontSize=resize?'200%':''; }, resizeText);
  const metrics = await page.evaluate(() => {
    const unnamed=Array.from(document.querySelectorAll('.sw-water-shell input,.sw-water-shell select,.sw-water-shell button,.sw-water-shell a')).filter(element=>{
      if (!element.getClientRects().length) return false;
      const labelledBy=element.getAttribute('aria-labelledby');
      const label=element.id&&document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      const wrapped=element.closest('label');
      return !element.getAttribute('aria-label')&&!labelledBy&&!label&&!wrapped&&!element.textContent.trim();
    }).map(element=>element.id||element.outerHTML.slice(0,80));
    const clipped=Array.from(document.querySelectorAll('.sw-water-shell input,.sw-water-shell select,.sw-water-shell button,.sw-water-shell a')).filter(element=>{
      if (!element.getClientRects().length) return false;
      const box=element.getBoundingClientRect();return box.left < -.5||box.right > innerWidth+.5;
    }).map(element=>element.id||element.textContent.trim().slice(0,30));
    const smallTargets=Array.from(document.querySelectorAll('.sw-water-shell input,.sw-water-shell select,.sw-water-shell button,.sw-water-shell a')).filter(element=>{
      if (!element.getClientRects().length||element.matches('[aria-disabled="true"]')) return false;
      const target=element.matches('input[type="checkbox"]')&&element.closest('label')?element.closest('label'):element;
      const box=target.getBoundingClientRect();return box.width<44||box.height<44;
    }).map(element=>element.id||element.textContent.trim().slice(0,30));
    const viewport=document.documentElement.clientWidth;
    const overflowers=Array.from(document.querySelectorAll('body *')).filter(element=>{
      if (!element.getClientRects().length) return false;
      const box=element.getBoundingClientRect();
      return box.left < -1||box.right > viewport+1;
    }).map(element=>{const box=element.getBoundingClientRect();return {tag:element.tagName.toLowerCase(),id:element.id,className:String(element.className||''),left:Number(box.left.toFixed(2)),right:Number(box.right.toFixed(2)),width:Number(box.width.toFixed(2)),scrollWidth:element.scrollWidth,clientWidth:element.clientWidth,text:(element.textContent||'').trim().replace(/\s+/g,' ').slice(0,80)};});
    return { overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,overflowers,unnamed,clipped,smallTargets };
  });
  expect(metrics.overflow, `${width}px overflow: ${JSON.stringify(metrics.overflowers)}`).toBeLessThanOrEqual(1);
  expect(metrics.overflowers, `${width}px overflowing elements`).toEqual([]);
  expect(metrics.unnamed).toEqual([]);
  expect(metrics.clipped).toEqual([]);
  if (!resizeText) expect(metrics.smallTargets).toEqual([]);
  console.log(`SW_WATER_REFLOW ${appId} width=${width}px rootText=${resizeText?'200%':'100%'} overflow=${metrics.overflow} overflowers=${metrics.overflowers.length}`);
}

for (const app of manifest.apps) {
  const definition = definitions[app.id];
  test(`${app.id}: owner oracle, native workflow, parsed exports, stale clearing and WCAG proof`, async ({ page, context }) => {
    const consoleErrors=[];const pageErrors=[];const writes=[];const failed=[];const badResources=[];
    page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
    page.on('pageerror',error=>pageErrors.push(error.message));
    page.on('request',request=>{if(!['GET','HEAD','OPTIONS'].includes(request.method()))writes.push({method:request.method(),url:request.url()});});
    page.on('requestfailed',request=>{if(request.url().startsWith('http://127.0.0.1:4431'))failed.push(request.url());});
    page.on('response',response=>{if(response.url().startsWith('http://127.0.0.1:4431')&&response.status()>=400)badResources.push({url:response.url(),status:response.status()});});

    await page.goto(app.englishRoute,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(globalName=>window.AfroTools&&window.AfroTools[globalName],app.engineGlobal);
    const englishRaw=await page.evaluate(({ globalName,inputs })=>window.AfroTools[globalName].calculate(inputs),{globalName:app.engineGlobal,inputs:app.oracle.inputs});
    expect(englishRaw.ok).toBe(true);
    for(const [key,value] of Object.entries(app.oracle.expected))close(englishRaw[key],value,`English ${app.id}.${key}`);
    await fillEnglish(page,definition.englishInputs);
    await page.getByRole('button',{name:definition.englishButton}).click();
    await expect(page.locator(definition.englishResult)).toHaveClass(/on/);

    await page.goto(app.swRoute,{waitUntil:'networkidle'});
    await expect(page.locator('html')).toHaveAttribute('lang','sw');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',`https://afrotools.com${app.swRoute}`);
    const schemas=await page.locator('script[type="application/ld+json"]').evaluateAll(nodes=>nodes.map(node=>JSON.parse(node.textContent)['@type']).sort());
    expect(schemas).toEqual(['BreadcrumbList','FAQPage','WebApplication']);
    const artwork=await page.locator('.sw-water-art').evaluate(image=>({complete:image.complete,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,width:image.getAttribute('width'),height:image.getAttribute('height')}));
    expect(artwork).toEqual({complete:true,naturalWidth:app.imageWidth,naturalHeight:app.imageHeight,width:String(app.imageWidth),height:String(app.imageHeight)});
    await expect(page.locator('.sw-water-evidence')).toContainText('2026-07-30');
    await expect(page.locator('.sw-water-evidence')).toContainText('Si uhakiki wa bei');
    await expect(page.locator('.sw-water-evidence')).toContainText('Dhana tuli za kupanga');
    await expect(page.locator('.sw-water-evidence')).toContainText('Chini kwa ununuzi');

    const storageBefore=await page.evaluate(()=>({local:Object.keys(localStorage).sort(),session:Object.keys(sessionStorage).sort()}));
    await fill(page,definition.fields);
    await page.getByRole('button',{name:/Kokotoa/}).focus();
    await page.getByRole('button',{name:/Kokotoa/}).press('Enter');
    await expect(page.locator('#water-result')).toBeVisible();
    await expect(page.locator('#water-result')).toBeFocused();
    for(const [key,value] of Object.entries(app.oracle.expected)){
      const raw=await page.locator(`[data-raw][data-output="${key}"]`).count()?await rawOutput(page,key):null;
      if(raw!=null)close(raw,value,`Swahili ${app.id}.${key}`);
    }
    expect(await page.locator('#water-breakdown tr').count()).toBe(definition.breakdownRows);
    const resultText=await page.locator('#water-result').innerText();
    expect(resultText).not.toMatch(/\b(?:NaN|Infinity|undefined)\b/);
    if(app.id==='plumbing-material'){
      for(const label of ['Bomba','Viungio, mikunjo na vali','Vifaa vya bafuni','Bomba la muunganisho wa pampu/kisima','Tanki la juu','Kazi ya fundi bomba'])await expect(page.locator('#water-breakdown')).toContainText(label);
      expect(resultText).not.toMatch(/\b(?:metres|pcs|sets|unit|days)\b/i);
    }

    await context.grantPermissions(['clipboard-read','clipboard-write'],{origin:'http://127.0.0.1:4431'});
    await page.locator('[data-water-export="copy"]').click();
    const copied=await page.evaluate(()=>navigator.clipboard.readText());
    const parsedCopy=parseCopy(copied);
    for(const [label,value] of Object.entries(definition.copyTotals))close(currencyNumber(parsedCopy.lines[label]),value,`${app.id} copied ${label}`);
    if(app.id==='plumbing-material'){
      expect(Object.keys(parsedCopy.bom)).toHaveLength(6);
      expect(parsedCopy.bom.Bomba).toEqual({qty:240,unit:'m',total:1560000});
      expect(parsedCopy.bom['Kazi ya fundi bomba']).toEqual({qty:13,unit:'siku',total:780000});
      expect(copied).not.toMatch(/\b(?:metres|pcs|sets|unit|days)\b/i);
    }
    await page.evaluate(()=>{
      Object.defineProperty(navigator,'clipboard',{value:undefined,configurable:true});
      window.__fallbackCopied='';
      document.execCommand=command=>{if(command==='copy'){const area=document.querySelector('textarea[aria-hidden="true"]');window.__fallbackCopied=area&&area.value;return true;}return false;};
    });
    await page.locator('[data-water-export="copy"]').click();
    const fallbackCopy=await page.evaluate(()=>window.__fallbackCopied);
    expect(parseCopy(fallbackCopy)).toEqual(parsedCopy);

    const jsonDownload=await downloadText(page,'json');
    const payload=JSON.parse(jsonDownload.text);
    expect(payload.toolId).toBe(app.id);
    expect(payload.inputs).toEqual(app.oracle.inputs);
    for(const [key,value] of Object.entries(app.oracle.expected))close(payload.result[key],value,`${app.id} JSON ${key}`);
    if(app.id==='plumbing-material')expect(payload.result.bom.map(item=>item.unit)).toEqual(['metres','pcs','sets','metres','unit','days']);
    const txtDownload=await downloadText(page,'txt');
    const parsedTxt=parseCopy(txtDownload.text);
    for(const [label,value] of Object.entries(definition.copyTotals))close(currencyNumber(parsedTxt.lines[label]),value,`${app.id} TXT ${label}`);
    if(app.id==='plumbing-material'){
      expect(Object.keys(parsedTxt.bom)).toHaveLength(6);
      expect(txtDownload.text).not.toMatch(/\b(?:metres|pcs|sets|unit|days)\b/i);
    }

    await page.locator(`#${definition.invalidField}`).fill('0');
    await expect(page.locator('#water-result')).toBeHidden();
    for(const kind of ['copy','json','txt'])await expect(page.locator(`[data-water-export="${kind}"]`)).toBeDisabled();
    await page.locator('#import-json').setInputFiles(jsonDownload.file);
    await expect(page.locator('#water-result')).toBeVisible();
    await assertReport(page,Object.fromEntries(definition.primaryOutputs.map(key=>[key,app.oracle.expected[key]])));
    expect(await page.locator('#water-breakdown tr').count()).toBe(definition.breakdownRows);

    await fill(page,definition.boundary);
    await page.getByRole('button',{name:/Kokotoa/}).click();
    await assertReport(page,definition.boundaryRaw);
    expect((await page.locator('#water-result').innerText())).not.toMatch(/\b(?:NaN|Infinity|undefined)\b/);
    await page.locator(`#${definition.invalidField}`).fill('0');
    await expect(page.locator('#water-result')).toBeHidden();
    for(const kind of ['copy','json','txt'])await expect(page.locator(`[data-water-export="${kind}"]`)).toBeDisabled();
    await page.getByRole('button',{name:/Kokotoa/}).click();
    await expect(page.locator('#water-error')).toBeVisible();
    await expect(page.locator('#water-result')).toBeHidden();

    const ai=page.locator('#ai-link');
    await expect(ai).toHaveAttribute('aria-disabled','true');
    await expect(ai).toHaveAttribute('href',`/sw/ai/?tool=${app.id}`);
    await page.locator('#ai-consent').check();
    await expect(ai).toHaveAttribute('aria-disabled','false');
    await expect(ai).toHaveAttribute('tabindex','0');

    const minima={boundary:Infinity,focus:Infinity,controlText:Infinity,normalText:Infinity,largeText:Infinity};
    for(const mode of ['light','dark','system-light','system-dark']){
      await setTheme(page,mode);
      for(const metric of await controlContrast(page)){
        minima.boundary=Math.min(minima.boundary,metric.boundary);minima.focus=Math.min(minima.focus,metric.focus);minima.controlText=Math.min(minima.controlText,metric.text);
        expect(metric.boundary,`${app.id} ${mode} ${metric.id} boundary`).toBeGreaterThanOrEqual(3);
        expect(metric.focus,`${app.id} ${mode} ${metric.id} focus`).toBeGreaterThanOrEqual(3);
        expect(metric.text,`${app.id} ${mode} ${metric.id} text`).toBeGreaterThanOrEqual(4.5);
        expect(metric.focusVisible,`${app.id} ${mode} ${metric.id} :focus-visible`).toBe(true);
        expect(metric.outline).not.toBe('none');
        expect(parseFloat(metric.width)).toBeGreaterThanOrEqual(3);
        expect(parseFloat(metric.offset)).toBeGreaterThanOrEqual(2);
      }
      for(const metric of await normalTextContrast(page)){
        if(metric.required===4.5)minima.normalText=Math.min(minima.normalText,metric.ratio);else minima.largeText=Math.min(minima.largeText,metric.ratio);
        expect(metric.ratio,`${app.id} ${mode} text "${metric.label}" ${metric.font||''}px/${metric.weight||''} ${metric.foreground} on ${metric.background}`).toBeGreaterThanOrEqual(metric.required);
      }
    }
    console.log(`SW_WATER_CONTRAST ${app.id} boundary=${minima.boundary.toFixed(3)} focus=${minima.focus.toFixed(3)} controlText=${minima.controlText.toFixed(3)} normalText=${minima.normalText.toFixed(3)} largeText=${minima.largeText.toFixed(3)}`);

    await page.evaluate(()=>{document.documentElement.removeAttribute('data-theme-choice');document.documentElement.setAttribute('data-theme','light');});
    for (const width of [320,375]) {
      await assertReflowAndA11y(page,app.id,width,false);
      await assertReflowAndA11y(page,app.id,width,true);
    }
    await page.evaluate(()=>{document.documentElement.style.fontSize='';});
    const storageAfter=await page.evaluate(()=>({local:Object.keys(localStorage).sort(),session:Object.keys(sessionStorage).sort()}));
    expect(storageAfter).toEqual(storageBefore);
    expect(writes).toEqual([]);
    expect(failed).toEqual([]);
    expect(badResources).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}
