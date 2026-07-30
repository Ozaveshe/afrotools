const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const manifest = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'reports/fr-engineering-construction-parity-manifest.json'),
  'utf8'
));
const missing = {
  afrodraft: '/fr/ingenierie/afrodraft/',
  'afroplan-floor-planner': '/fr/ingenierie/planificateur-etage/',
  'scaffolding-calc': '/fr/tools/calculateur-echafaudage/',
  'window-door-sizing': '/fr/tools/dimensionnement-fenetres-portes/',
  'plumbing-material': '/fr/tools/materiaux-plomberie/'
};
const owners = manifest.routes.map((row) => ({ ...row, french: row.french || missing[row.id] }));

async function downloadBuffer(page, locator) {
  await expect(locator).toBeVisible();
  const pending = page.waitForEvent('download', { timeout: 10_000 });
  await locator.click();
  const download = await pending;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return { buffer: Buffer.concat(chunks), name: download.suggestedFilename() };
}

async function runPrimary(page) {
  const button = page.getByRole('button', { name: /Calculer|Estimer|Générer/i }).first();
  if (await button.count() && await button.isVisible()) await button.click();
}

test('French Engineering export surfaces download parseable local files', async ({ page }) => {
  test.setTimeout(1_200_000);
  await page.route(/^https?:\/\//, async (route) => {
    const hostname = new URL(route.request().url()).hostname;
    if (hostname === '127.0.0.1') await route.continue();
    else await route.fulfill({ status: 204, body: '' });
  });

  await page.goto('/fr/ingenierie/afrodraft/app.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  const svgPending = page.waitForEvent('download', { timeout: 10_000 });
  await page.locator('#btn-export-svg').evaluate((button) => button.click());
  const svgDownload = await svgPending;
  const svgStream = await svgDownload.createReadStream();
  const svgChunks = [];
  for await (const chunk of svgStream) svgChunks.push(chunk);
  const svg = { buffer: Buffer.concat(svgChunks), name: svgDownload.suggestedFilename() };
  expect(svg.name).toMatch(/\.svg$/i);
  expect(svg.buffer.toString('utf8')).toMatch(/<svg[\s>]/i);

  await page.goto('/fr/ingenierie/planificateur-etage/', { waitUntil: 'domcontentloaded' });
  await page.locator('.fp-project-drawer > summary').click();
  const template = page.locator('[data-safe-template],[data-mvp-template]').first();
  await expect(template).toBeVisible();
  await template.click();
  await page.locator('#fpExportBoqData').click();
  await expect(page.locator('#fpDownloadBoqJson')).toBeVisible();
  const floorPlanJson = await downloadBuffer(page, page.locator('#fpDownloadBoqJson'));
  const floorPlan = JSON.parse(floorPlanJson.buffer.toString('utf8'));
  expect(floorPlan.schema).toBe('afrotools-floor-planner-boq-v2');
  expect(Array.isArray(floorPlan.boq.items)).toBe(true);

  for (const item of [
    ['/fr/tools/calculateur-solaire/', /Télécharger(?: le)? CSV/i, /csv/i],
    ['/fr/tools/charge-electrique/', /Télécharger(?: le)? CSV/i, /csv/i],
    ['/fr/tools/dimensionnement-generateur/', '#generatorSizingCsvBtn', /csv/i],
    ['/fr/tools/generateur-boq/', /Exporter?(?: le)? CSV/i, /csv/i]
  ]) {
    await page.goto(item[0], { waitUntil: 'domcontentloaded' });
    await runPrimary(page);
    const locator = typeof item[1] === 'string'
      ? page.locator(item[1])
      : page.getByRole('button', { name: item[1] }).first();
    const file = await downloadBuffer(page, locator);
    expect(file.name).toMatch(/\.csv$/i);
    const csv = file.buffer.toString('utf8');
    expect(csv).toMatch(/[,;\n]/);
    expect(csv.length).toBeGreaterThan(40);
  }

  for (const item of [
    ['/fr/tools/plan-etage/', /Télécharger le rapport PDF/i],
    ['/fr/tools/calculateur-armature/', /Télécharger(?: le)? PDF BBS/i]
  ]) {
    await page.goto(item[0], { waitUntil: 'domcontentloaded' });
    await runPrimary(page);
    const file = await downloadBuffer(page, page.getByRole('button', { name: item[1] }).first());
    expect(file.name).toMatch(/\.pdf$/i);
    expect(file.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(file.buffer.length).toBeGreaterThan(1_000);
  }

  for (const route of [
    '/fr/tools/estimateur-du-cout-de-preparation-d-un-terrain/',
    '/fr/tools/estimateur-du-cout-de-construction-routiere/',
    '/fr/tools/calculateur-echafaudage/',
    '/fr/tools/dimensionnement-fenetres-portes/',
    '/fr/tools/materiaux-plomberie/'
  ]) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await runPrimary(page);
    const file = await downloadBuffer(page, page.getByRole('button', { name: /Télécharger le TXT/i }).first());
    expect(file.name).toMatch(/\.txt$/i);
    const text = file.buffer.toString('utf8');
    expect(text.length).toBeGreaterThan(120);
    expect(text).not.toMatch(/\b(?:NaN|Infinity|undefined)\b/);
  }

  for (const owner of owners) {
    await page.goto(owner.french, { waitUntil: 'domcontentloaded' });
    const file = await downloadBuffer(
      page,
      page.locator(`[data-fr-engineering-export="${owner.id}"]`)
    );
    expect(file.name).toBe(`${owner.id}-etat-local.json`);
    const payload = JSON.parse(file.buffer.toString('utf8'));
    expect(payload).toMatchObject({
      schema: 'afrotools-fr-engineering-local-export-v1',
      owner: owner.id,
      source: owner.english,
      route: owner.french,
      privacy: 'local-first'
    });
    expect(payload.inputs).toEqual(expect.any(Object));
    expect(payload.result).toEqual(expect.any(String));
  }
});
