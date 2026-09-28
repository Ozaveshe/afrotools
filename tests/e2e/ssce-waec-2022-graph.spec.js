const {test,expect}=require('@playwright/test');
const id='waec-2022-mathematics-p2-q6';
for(const [locale,route,captionWord] of [
 ['en','/tools/ssce-practice/','Original redraw'],
 ['fr','/fr/tools/pratique-waec-neco/','Graphique original'],
 ['sw','/sw/zana/mazoezi-waec-neco/','Grafu asilia']
])test(`WAEC 2022 Q6 ${locale}: local graph, concealed solution and saved mobile state`,async({page,context},info)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await context.route('https://**',request=>request.abort());
 const saved={version:1,bankId:'ssce-written-v1',entries:{[id]:{answer:'Synthetic prior graph answer',checks:[true,false,true,false]},'written-m1':{answer:'45; unrelated prior answer',checks:[false,true]}}};
 await page.addInitScript(value=>{if(!localStorage.getItem('afrotools.ssceWritten.v1'))localStorage.setItem('afrotools.ssceWritten.v1',JSON.stringify(value));localStorage.setItem('aft_theme','dark');localStorage.setItem('afrotools_cookie_consent','declined');},saved);
 await page.setViewportSize({width:320,height:800});await page.goto(route+'#written='+id);
 const editor=page.locator('#written-editor'),svg=editor.locator('.written-diagram-waec-graph'),details=editor.locator('.written-explanation');
 await expect(svg).toBeVisible();await expect(svg).toHaveAttribute('role','img');await expect(svg).toHaveAttribute('preserveAspectRatio','xMidYMid meet');
 await expect(editor.locator('figcaption')).toContainText(captionWord);await expect(details).not.toHaveAttribute('open','');
 await expect(editor.locator('.written-prompt')).not.toContainText('Open the linked');await expect(editor.locator('img')).toHaveCount(0);
 const plot=await svg.evaluate(node=>({
  label:node.getAttribute('aria-label'),texts:[...node.querySelectorAll('text')].map(e=>e.textContent),
  curve:node.querySelector('.written-curve').getAttribute('d'),line:node.querySelector('.written-guide-line').getAttribute('d'),
  points:[...node.querySelectorAll('circle')].map(e=>[Number(e.getAttribute('cx')),Number(e.getAttribute('cy'))]),
  major:[...node.querySelectorAll('.written-grid[stroke-opacity="1"]')].map(e=>e.getAttribute('d')),
  font:parseFloat(getComputedStyle(node.querySelector('text')).fontSize)*node.getBoundingClientRect().width/360
 }));
 const visibleCopy=await editor.evaluate(node=>{const copy=node.cloneNode(true);copy.querySelector('.written-explanation').remove();return copy.textContent;});
 expect(plot.label+' '+plot.texts.join(' ')+' '+visibleCopy).not.toMatch(/m\s*=\s*[−-]1|n\s*=\s*2|r\s*=\s*8|y\s*=\s*[−-]x²|gradient\s*4|−2\s*<\s*x\s*<\s*4/i);
 const points=[...plot.curve.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)].map(m=>[(Number(m[1])-48)/18-8,(70-Number(m[2]))/3.6]);
 for(const [x,y] of [[-2,0],[0,8],[1,9],[3,5],[4,0]]){const p=points.find(p=>Math.abs(p[0]-x)<1e-8);expect(p).toBeTruthy();expect(p[1]).toBeCloseTo(y,8);}
 const actualPoints=plot.points.map(([x,y])=>[(x-48)/18-8,(70-y)/3.6]);expect(actualPoints[0][0]).toBe(-5);expect(actualPoints[0][1]).toBeCloseTo(-27,8);expect(actualPoints[1][0]).toBe(3);expect(actualPoints[1][1]).toBeCloseTo(5,8);
 const endpoints=[...plot.line.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)].map(m=>[(Number(m[1])-48)/18-8,(70-Number(m[2]))/3.6]);
 for(const [x,y] of endpoints)expect(y).toBeCloseTo(4*x-7,8);
 const vertical=plot.major.filter(d=>d.includes('V')).map(d=>Number(d.match(/^M([\d.-]+)/)[1]));
 const horizontal=plot.major.filter(d=>d.includes('H')).map(d=>Number(d.match(/^M48 ([\d.-]+)/)[1]));
 expect(vertical[1]-vertical[0]).toBeCloseTo(36,8);expect(Math.abs(horizontal[1]-horizontal[0])).toBeCloseTo(36,8);
 expect(plot.font).toBeGreaterThanOrEqual(11);expect(plot.texts).toEqual(expect.arrayContaining(['P','Q','x','y','-8','8','-70','10']));
 await expect(editor.locator('textarea')).toHaveValue(saved.entries[id].answer);
 expect(await editor.locator('input[type="checkbox"]').evaluateAll(nodes=>nodes.map(n=>n.checked))).toEqual(saved.entries[id].checks);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
 await svg.scrollIntoViewIfNeeded();await svg.screenshot({path:info.outputPath('waec-q6-'+locale+'-320.png')});
 await context.setOffline(true);await page.locator('#written-task').selectOption('waec-2022-mathematics-p2-q1b');await page.locator('#written-task').selectOption(id);
 await expect(editor.locator('.written-diagram-waec-graph')).toBeVisible();await expect(editor.locator('.written-explanation')).not.toHaveAttribute('open','');
 await editor.locator('summary').focus();await page.keyboard.press('Enter');await expect(editor.locator('.written-explanation')).toHaveAttribute('open','');await expect(editor.locator('.written-explanation')).toContainText('m = −1, n = 2, r = 8');
 await editor.locator('textarea').fill('Synthetic updated graph reasoning');await editor.locator('.practice-actions button').first().click();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('afrotools.ssceWritten.v1')));expect(stored.entries['written-m1']).toEqual(saved.entries['written-m1']);expect(stored.entries[id].checks).toEqual(saved.entries[id].checks);
 await context.setOffline(false);await page.reload();await expect(editor.locator('textarea')).toHaveValue('Synthetic updated graph reasoning');await expect(editor.locator('.written-explanation')).not.toHaveAttribute('open','');expect(errors).toEqual([]);
});
