const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const fixture = require('../fixtures/cv-long-form');
const { inspectRasterPdf } = require('../support/cv-raster-pdf-bounds');
test.use({ trace: 'off', screenshot: 'off', video: 'off' });
for (const [locale, route] of [['en', '/tools/cv-builder/'], ['fr', '/fr/tools/generateur-cv/'], ['sw', '/sw/zana/mjenzi-cv/']]) {
  for (const width of [320, 390, 1280]) test(`Creative PDF preserves content and uses first-page space: ${locale} ${width}`, async ({ page, baseURL }, info) => {
    await page.route('**/*', r => new URL(r.request().url()).origin === new URL(baseURL).origin ? r.continue() : r.fulfill({ status: 204 }));
    await page.setViewportSize({ width, height: 844 });
    await page.goto(route);
    await page.waitForFunction(() => window.CVExportPdfQuality && window.CVApp);
    await page.evaluate(f => {
      Object.assign(CVApp.getState().data, f);
      CVApp.getState().template = 'creative-portfolio';
      CVApp.getState().country = 'NG';
      CVApp.renderAll();
      CVExportUpgrade.setOptions({ density: 'comfortable', avoidSplits: true, breakExp: false, breakEdu: false, breakProjects: false, breakRefs: false });
    }, fixture);
    expect(await page.locator('#cvpreview .cv-prod-creative>main').evaluate(el => getComputedStyle(el).paddingLeft)).toBe('26px');
    const capture = await page.evaluate(async () => {
      await loadPdfLibs();
      const canvas = await CVExportPdfQuality.renderPreviewCanvas(CVExportUpgrade.getOptions());
      return { width: canvas.width, height: canvas.height, blocks: canvas.cvAvoidBlocks };
    });
    const pending = page.waitForEvent('download');
    await page.evaluate(() => CVExportUpgrade.exportPdf());
    const file = info.outputPath(`${locale}-creative.pdf`);
    await (await pending).saveAs(file);
    const bounds = await inspectRasterPdf(fs.readFileSync(file));
    const pageCapacity = Math.floor(281 * capture.width / 198);
    expect(bounds).toHaveLength(Math.ceil(capture.height / pageCapacity));
    expect(bounds.every(box => box.insidePaper)).toBe(true);
    const heights = bounds.map(box => (box.yMax - box.yMin) * capture.width / (box.xMax - box.xMin));
    expect(heights[0] / pageCapacity).toBeGreaterThan(.7);
    expect(heights.reduce((sum, height) => sum + height, 0)).toBeCloseTo(capture.height, 0);
    let start = 0;
    for (const height of heights.slice(0, -1)) {
      const end = start + height;
      const crossings = capture.blocks.filter(block => block.bottom - block.top <= pageCapacity && block.top > start + 1 && block.top < end - .01 && block.bottom > end + .01);
      expect(crossings, 'page boundary geometry '+JSON.stringify({start,end,width:capture.width,height:capture.height,heights})).toEqual([]);
      start = end;
    }
    expect(capture.width).toBeGreaterThanOrEqual(1190);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    expect(await page.locator('#cvpreview').textContent()).toContain('FINALVISIBLEMARKER');
  });
}
