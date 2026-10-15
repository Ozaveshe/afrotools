const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');
const markers = Array.from({ length: 120 }, (_, i) => 'SYNTHLEGAL-' + String(i + 1).padStart(4, '0'));
const notes = markers.map(marker => marker + ' Full synthetic planning detail retained for printing; no real personal data or legal authority claim.').join('\n') +
  ' SYNTHLEGAL-FINAL-MARKER <img src=x onerror=window.syntheticInjection=true>';
test.setTimeout(120000);
function printedNotes(text) {
  // Native PDF extraction can wrap the marker after its hyphen and the literal
  // tag at its attribute separator. Join only these observed token boundaries.
  // Isolate the printed handoff so a partly visible input cannot supply a marker.
  const sections = [...text.matchAll(/(?:^|\r?\n)Notes:\r?\n([\s\S]*?)\r?\nNext action:/g)];
  expect(sections).toHaveLength(1);
  return sections[0][1]
    .replace(/SYNTHLEGAL-\r?\n([0-9]{4})\b/g, 'SYNTHLEGAL-$1')
    .replace(/<img src=x[ \t]*\r?\n[ \t]*onerror=window\.syntheticInjection=true>/g, '<img src=x onerror=window.syntheticInjection=true>');
}
function expectCompletePrintedNotes(text) {
  const printed = printedNotes(text);
  for (const marker of markers) expect(printed).toContain(marker);
  expect([...printed.matchAll(/\bSYNTHLEGAL-[0-9]{4}\b/g)].map(match => match[0])).toEqual(markers);
  expect(printed).toContain('SYNTHLEGAL-FINAL-MARKER');
  expect(printed).toContain('<img src=x onerror=window.syntheticInjection=true>');
  expect(text).toContain('Next action:');
}
test('PDF reader permits only documented wraps and rejects missing or duplicate content', () => {
  const fixture = 'Notes:\n' + notes + '\nNext action:\nKeep evidence';
  expectCompletePrintedNotes(fixture);
  const wrapped = fixture.replace('SYNTHLEGAL-0016', 'SYNTHLEGAL-\n0016')
    .replace('<img src=x onerror=', '<img src=x\nonerror=');
  expectCompletePrintedNotes(wrapped);
  expectCompletePrintedNotes(wrapped.replace(/\n/g, '\r\n'));
  for (const invalid of [
    fixture.replace('SYNTHLEGAL-0016', ''),
    fixture.replace('SYNTHLEGAL-0016', 'SYNTHLEGAL-0015'),
    fixture.replace('SYNTHLEGAL-0016', 'SYNTHLEGAL-00\n16'),
    fixture.replace('SYNTHLEGAL-FINAL-MARKER', ''),
    fixture.replace('<img src=x onerror=', '<img src=x onerrXr='),
    fixture.replace('Notes:\n', '')
  ]) expect(() => expectCompletePrintedNotes(invalid)).toThrow();
});
function watch(page) {
  const errors = [], contentRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (request.url().includes('SYNTHLEGAL') || (request.postData() || '').includes('SYNTHLEGAL')) contentRequests.push(request.method());
  });
  return { errors, contentRequests };
}
async function noPersistence(page) {
  expect(await page.evaluate(() => Object.keys(localStorage).some(key => (localStorage.getItem(key) || '').includes('SYNTHLEGAL')))).toBe(false);
  expect(await page.locator('[data-workflow-email]').inputValue()).toBe('');
  await expect(page.locator('[data-workflow-optin]')).not.toBeChecked();
  expect(await page.locator('[data-workflow-print-mirror]').count()).toBe(0);
  await expect(page.locator('.leg-workflow-copilot')).not.toHaveAttribute('data-workflow-print-ready');
  expect(await page.evaluate(() => window.syntheticInjection === true)).toBe(false);
}
for (const width of [390, 1280]) test('Native local print retains every long note marker at ' + width, async ({ page }, testInfo) => {
  const observed = watch(page);
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/tools/cross-border-data/');
  await page.locator('[data-workflow-field=note]').fill(notes);
  const handoff = await page.locator('[data-workflow-output]').inputValue();
  for (const marker of markers) expect(handoff).toContain(marker);
  // page.pdf enters the browser's native beforeprint/afterprint lifecycle.
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await testInfo.attach('long-local-print-' + width + '.pdf', { body: pdf, contentType: 'application/pdf' });
  const parsed = await pdfParse(pdf);
  expectCompletePrintedNotes(parsed.text);
  await noPersistence(page);
  expect(observed).toEqual({ errors: [], contentRequests: [] });
});
test('Keyboard print failure keeps copyable text, cleans the mirror and permits retry', async ({ page }) => {
  const observed = watch(page);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/tools/cross-border-data/');
  await page.locator('[data-workflow-field=note]').fill(notes);
  await page.evaluate(() => { window.print = () => { throw Error('synthetic print failure'); }; });
  const print = page.locator('[data-workflow-print]');
  await print.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-workflow-gate-status]')).toContainText('remains available to copy');
  expect(await page.locator('[data-workflow-output]').inputValue()).toContain('SYNTHLEGAL-FINAL-MARKER');
  await noPersistence(page);
  await page.evaluate(() => { window.print = () => {
    const mirror = document.querySelector('[data-workflow-print-mirror]');
    window.__syntheticPrintText = mirror.textContent;
    window.__syntheticPrintImages = mirror.querySelectorAll('img').length;
    window.__syntheticPrintMask = mirror.getAttribute('data-clarity-mask');
  }; });
  await print.focus();
  await page.keyboard.press('Enter');
  const text = await page.evaluate(() => window.__syntheticPrintText);
  for (const marker of markers) expect(text).toContain(marker);
  expect(text).toContain('SYNTHLEGAL-FINAL-MARKER');
  expect(await page.evaluate(() => window.__syntheticPrintImages)).toBe(0);
  expect(await page.evaluate(() => window.__syntheticPrintMask)).toBe('True');
  await expect(page.locator('[data-workflow-gate-status]')).toContainText('Printing stays local');
  await noPersistence(page);
  expect(observed).toEqual({ errors: [], contentRequests: [] });
});
