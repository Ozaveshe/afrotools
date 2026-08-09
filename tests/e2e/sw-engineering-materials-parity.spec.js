const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {SW_ENGINEERING_MATERIALS_APPS}=require('../../scripts/lib/sw-engineering-materials-contract.js');

function audit(page){const e={errors:[],network:[]};page.on('pageerror',x=>e.errors.push(x.message));page.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED/.test(m.text()))e.errors.push(m.text());});page.on('request',r=>{if(['fetch','xhr','beacon'].includes(r.resourceType()))e.network.push(r.url());});return e;}
async function artifact(page,selector){const [d]=await Promise.all([page.waitForEvent('download'),page.locator(selector).click()]);const file=await d.path();return{file,buffer:fs.readFileSync(file)};}
async function noOverflow(page,width,scale){await page.setViewportSize({width,height:820});await page.evaluate(s=>document.documentElement.style.fontSize=s,scale);await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}

for(const app of SW_ENGINEERING_MATERIALS_APPS){
 test(`sw:${app.id} calculates, reflows, resets and parses all local exports`,async({page})=>{
  const e=audit(page);await page.route(/^https?:\/\/(?!127\.0\.0\.1:4201)/,r=>r.abort());await page.goto(app.swRoute);
  await expect(page.locator('html')).toHaveAttribute('lang','sw');await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',`https://afrotools.com${app.swRoute}`);await expect(page.locator('iframe')).toHaveCount(0);
  await noOverflow(page,320,'100%');await noOverflow(page,375,'100%');await noOverflow(page,640,'200%');await page.evaluate(()=>document.documentElement.style.fontSize='');
  await page.getByRole('button',{name:'Kokotoa',exact:true}).click();await expect(page.locator('#swemResult')).toBeVisible();
  const json=await artifact(page,'[data-export="json"]'),record=JSON.parse(json.buffer.toString('utf8'));expect(record.toolId).toBe(app.id);expect(record.locale).toBe('sw');
  await page.locator('#importJson').setInputFiles({name:`${app.id}.json`,mimeType:'application/json',buffer:json.buffer});await expect(page.locator('#swemStatus')).toContainText(/imefunguliwa/);
  expect((await artifact(page,'[data-export="csv"]')).buffer.toString('utf8')).toContain('kipimo');expect((await artifact(page,'[data-export="txt"]')).buffer.toString('utf8')).toContain('Faragha:');
  const pdf=await artifact(page,'[data-export="pdf"]');expect(pdf.buffer.subarray(0,4).toString()).toBe('%PDF');const parsed=JSON.parse(execFileSync(process.execPath,[path.resolve(__dirname,'../support/parse-pdf-download.js'),pdf.file],{encoding:'utf8'}));expect(parsed.numpages).toBeGreaterThan(0);
  const first=page.locator('#swemForm input[type="number"]').first();await first.fill('0');await page.getByRole('button',{name:'Kokotoa',exact:true}).click();await expect(page.locator('#swemResult')).toBeHidden();await page.getByRole('button',{name:'Weka upya',exact:true}).click();await expect(page.locator('#swemStatus')).toContainText('imerejeshwa');
  await page.locator('[data-theme-toggle]').click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.keyboard.press('Tab');await expect(page.locator(':focus')).toBeVisible();expect(e.network).toEqual([]);expect(e.errors).toEqual([]);
 });
}

const english=[
 {id:'concrete-calc',route:'/tools/concrete-mix/',prepare:async p=>{await p.locator('#shape').selectOption('direct');await p.locator('#directVol').fill('3');},button:'Calculate Materials',result:'#results'},
 {id:'tiles-calc',route:'/tools/tiles-calc/',prepare:async()=>{},button:'Calculate Tiles Needed',result:'#resultCard'},
 {id:'water-tank',route:'/tools/water-tank/',prepare:async()=>{},button:'Calculate Tank Size',result:'#resultCard'},
 {id:'rebar-calc',route:'/tools/rebar-calculator/',prepare:async()=>{},button:'Calculate Weight & Cost',result:'#results'}
];
for(const app of english)test(`en:${app.id} still calculates through the shared engine`,async({page})=>{const e=audit(page);await page.route(/^https?:\/\/(?!127\.0\.0\.1:4201)/,r=>r.abort());await page.goto(app.route);await app.prepare(page);await page.getByRole('button',{name:app.button,exact:true}).click();await expect(page.locator(app.result)).toBeVisible();expect(e.errors).toEqual([]);});
