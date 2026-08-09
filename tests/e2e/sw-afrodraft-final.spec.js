const { test, expect } = require('@playwright/test');
const pdf = require('pdf-parse');

const ROUTE = '/sw/zana/afrodraft-cad/app';

async function downloadFrom(page, action) {
  const pending = page.waitForEvent('download', { timeout: 15_000 });
  await action();
  const download = await pending;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return { name: download.suggestedFilename(), buffer: Buffer.concat(chunks) };
}

async function openReady(page, requests) {
  await page.route(/^https?:\/\//, async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1') return route.continue();
    requests.push(route.request().url());
    return route.fulfill({ status: 204, body: '' });
  });
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#loading')).toHaveClass(/hidden/, { timeout: 15_000 });
  await expect.poll(() => page.evaluate(() => Boolean(window.app?._workspaceShell))).toBe(true);
}

async function seedDrawing(page) {
  return page.evaluate(async () => {
    const { LineEntity, CircleEntity, PolylineEntity } = await import('/engineering/afrodraft/src/core/Entity.js');
    const { engine, layerManager, renderer } = window.app;
    layerManager.addLayer({ name: 'Kuta', color: { r: 20, g: 120, b: 220, index: 5 } });
    layerManager.setCurrentLayer('Kuta');
    engine.currentLayer = 'Kuta';
    const line = engine.addEntity(new LineEntity({ layer: 'Kuta', start: { x: 10, y: 20 }, end: { x: 210, y: 20 } }));
    const circle = engine.addEntity(new CircleEntity({ layer: 'Kuta', center: { x: 80, y: 80 }, radius: 25 }));
    const room = engine.addEntity(new PolylineEntity({ layer: 'Kuta', vertices: [
      { x: 10, y: 20 }, { x: 210, y: 20 }, { x: 210, y: 140 }, { x: 10, y: 140 }
    ], closed: true }));
    renderer.dirty = true;
    return { ids: [line, circle, room], count: engine.entities.size, currentLayer: engine.currentLayer };
  });
}

test('Swahili AfroDraft keeps the full shared CAD model and reopens ADRAFT and DXF', async ({ page }) => {
  test.setTimeout(90_000);
  const requests = [];
  const errors = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(error.message));
  await openReady(page, requests);

  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('#cmd-prompt')).toHaveText('Amri:');
  await expect(page.locator('.panel-title')).toHaveText('Mkaguzi');
  await expect(page.locator('#btn-new')).toHaveAttribute('title', /Mchoro Mpya|Mchoro mpya/i);

  const seeded = await seedDrawing(page);
  expect(seeded).toEqual(expect.objectContaining({ count: 3, currentLayer: 'Kuta' }));
  const ownerReceipt = await page.evaluate(async () => {
    const workflow = window.app._workspaceShell.fileWorkflow;
    const { DrawingFile } = await import('/engineering/afrodraft/src/core/DrawingFile.js');
    return {
      sameEngine: workflow.engine === window.app.engine,
      appCount: window.app.engine.entities.size,
      workflowCount: workflow.engine.entities.size,
      serializedCount: JSON.parse(DrawingFile.serialize(workflow.engine)).entities.length
    };
  });
  expect(ownerReceipt).toEqual({ sameEngine: true, appCount: 3, workflowCount: 3, serializedCount: 3 });

  await page.evaluate(() => { window.showSaveFilePicker = undefined; });
  const project = await downloadFrom(page, () => page.evaluate(() => window.app._workspaceShell.fileWorkflow.saveAsProject(false)));
  expect(project.name).toMatch(/\.adraft$/i);
  const projectJson = JSON.parse(project.buffer.toString('utf8'));
  expect(projectJson.version).toBe('6.0');
  expect(projectJson.entities).toHaveLength(3);
  expect(projectJson.layers.some((layer) => layer.name === 'Kuta')).toBe(true);

  const reopenedProject = await page.evaluate(async (text) => {
    const workflow = window.app._workspaceShell.fileWorkflow;
    workflow.createNewProject({ force: true });
    await workflow.openPickedFile(new File([text], 'jaribio.adraft', { type: 'application/json' }));
    return {
      count: window.app.engine.entities.size,
      layer: window.app.engine.getEntity(1)?.layer,
      file: workflow.getState().fileName
    };
  }, project.buffer.toString('utf8'));
  expect(reopenedProject).toEqual({ count: 3, layer: 'Kuta', file: 'jaribio.adraft' });

  const dxf = await downloadFrom(page, () => page.evaluate(() => window.app._workspaceShell.fileWorkflow.exportDxf()));
  expect(dxf.name).toMatch(/\.dxf$/i);
  expect(dxf.buffer.toString('utf8')).toMatch(/SECTION[\s\S]*ENTITIES[\s\S]*(?:LINE|CIRCLE|LWPOLYLINE)/);

  const reopenedDxf = await page.evaluate(async (text) => {
    const workflow = window.app._workspaceShell.fileWorkflow;
    workflow.createNewProject({ force: true });
    await workflow.openPickedFile(new File([text], 'jaribio.dxf', { type: 'application/dxf' }));
    return { count: window.app.engine.entities.size, format: workflow.getState().fileFormat };
  }, dxf.buffer.toString('utf8'));
  expect(reopenedDxf.count).toBeGreaterThanOrEqual(3);
  expect(reopenedDxf.format).toBe('dxf');

  const invalid = await page.evaluate(async () => {
    const before = window.app.engine.entities.size;
    let message = '';
    try {
      await window.app._workspaceShell.fileWorkflow.openPickedFile(
        new File(['not a drawing'], 'broken.txt', { type: 'text/plain' })
      );
    } catch (error) { message = error.message; }
    const unchanged = window.app.engine.entities.size === before;
    const reset = window.app._workspaceShell.fileWorkflow.createNewProject({ force: true });
    return { message, unchanged, reset, remaining: window.app.engine.entities.size };
  });
  expect(invalid.message).toMatch(/ADRAFT, JSON, DXF, DWG/);
  expect(invalid).toEqual(expect.objectContaining({ unchanged: true, reset: true, remaining: 0 }));
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test('Swahili AfroDraft exports and reopens SVG, PNG and plotted PDF', async ({ page }) => {
  test.setTimeout(120_000);
  const requests = [];
  const errors = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(error.message));
  await openReady(page, requests);
  await seedDrawing(page);

  const svg = await downloadFrom(page, () => page.locator('#btn-export-svg').evaluate((button) => button.click()));
  expect(svg.name).toMatch(/\.svg$/i);
  const svgReceipt = await page.evaluate((markup) => {
    const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
    return {
      root: parsed.documentElement.localName,
      errors: parsed.querySelectorAll('parsererror').length,
      geometry: parsed.querySelectorAll('line,circle,polyline,polygon,path').length,
      width: parsed.documentElement.getAttribute('width'),
      height: parsed.documentElement.getAttribute('height')
    };
  }, svg.buffer.toString('utf8'));
  expect(svgReceipt.root).toBe('svg');
  expect(svgReceipt.errors).toBe(0);
  expect(svgReceipt.geometry).toBeGreaterThanOrEqual(3);
  expect(Number.parseFloat(svgReceipt.width)).toBeGreaterThan(0);
  expect(Number.parseFloat(svgReceipt.height)).toBeGreaterThan(0);

  const png = await downloadFrom(page, () => page.locator('#btn-export-png').evaluate((button) => button.click()));
  expect(png.name).toMatch(/\.png$/i);
  expect(png.buffer.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(png.buffer.readUInt32BE(16)).toBeGreaterThan(0);
  expect(png.buffer.readUInt32BE(20)).toBeGreaterThan(0);

  await page.locator('#btn-print').evaluate((button) => button.click());
  await expect(page.locator('#plt-print')).toBeVisible();
  const pdfFile = await downloadFrom(page, () => page.locator('#plt-print').click());
  expect(pdfFile.name).toMatch(/\.pdf$/i);
  expect(pdfFile.buffer.subarray(0, 5).toString()).toBe('%PDF-');
  const parsedPdf = await pdf(pdfFile.buffer);
  expect(parsedPdf.numpages).toBe(1);

  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test('Swahili AfroDraft reflows, themes, focuses controls and exposes correct SEO', async ({ page }) => {
  test.setTimeout(90_000);
  const requests = [];
  await openReady(page, requests);

  for (const [width, rootSize] of [[320, 16], [375, 16], [375, 32]]) {
    await page.setViewportSize({ width, height: 812 });
    await page.evaluate((size) => document.documentElement.style.setProperty('font-size', `${size}px`, 'important'), rootSize);
    await page.waitForTimeout(100);
    const receipt = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      canvasWidth: document.querySelector('#canvas-wrap')?.getBoundingClientRect().width || 0
    }));
    expect(receipt.overflow).toBeLessThanOrEqual(1);
    expect(receipt.canvasWidth).toBeGreaterThan(40);
  }

  await page.evaluate(() => window.app._applyTheme('light'));
  await expect(page.locator('body')).toHaveClass(/theme-light/);
  await expect(page.locator('#theme-css')).toHaveAttribute('href', /\/engineering\/afrodraft\/assets\/css\/themes\/light\.css/);
  await page.evaluate(() => window.app._applyTheme('dark'));
  await expect(page.locator('body')).toHaveClass(/theme-dark/);

  await page.locator('#cmd-input').focus();
  await expect(page.locator('#cmd-input')).toBeFocused();
  await page.keyboard.press('Tab');
  const unnamed = await page.evaluate(() => [...document.querySelectorAll('button,input,select,textarea')].filter((control) => {
    const rect = control.getBoundingClientRect();
    if (!rect.width || !rect.height || getComputedStyle(control).visibility === 'hidden') return false;
    return !(control.getAttribute('aria-label') || control.getAttribute('title') || control.textContent.trim() || control.labels?.length);
  }).map((control) => control.id || control.outerHTML.slice(0, 80)));
  expect(unnamed).toEqual([]);

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/afrodraft-cad/app');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/engineering/afrodraft/app');
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute('href', 'https://afrotools.com/fr/ingenierie/afrodraft/app');
  await expect(page.locator('link[hreflang="sw"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/afrodraft-cad/app');
  expect(await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.some((node) => JSON.parse(node.textContent).inLanguage === 'sw'))).toBe(true);
  const residualEnglish = await page.evaluate(() => {
    const visible = document.body.innerText;
    return [...new Set(visible.match(/\b(?:New drawing|Open drawing|Save as|Recent drawings|Properties|Command|Quick actions|Drawing setup|Selection tools|Saved views|Layer states|Session recovery|No selection|Start fresh|Keep this revision|Jump back in|Export DXF|Share with CAD|No matching commands)\b/gi) || [])];
  });
  expect(residualEnglish).toEqual([]);
  expect(requests).toEqual([]);
});
