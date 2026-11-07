const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function worksheet() {
  const html = fs.readFileSync('scripts/templates/ethiopia-water-bill.html', 'utf8');
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes("var latest = ''"));
  assert.ok(script, 'exercise actual maintained page controller');
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { value: '', textContent: '', style: {}, listeners: {}, classList: { add() {}, remove() {} }, addEventListener(event, fn) { this.listeners[event] = fn; } });
    return elements.get(id);
  };
  const downloads = [], pending = new Map();
  const context = { window: {}, Blob, setTimeout: fn => fn(), URL: {
    createObjectURL(blob) { const url = 'blob:synthetic-' + pending.size; pending.set(url, blob); return url; },
    revokeObjectURL() {}
  }, document: {
    getElementById: element,
    createElement(tag) { assert.equal(tag, 'a'); return { click() { downloads.push({ name: this.download, blob: pending.get(this.href) }); } }; }
  } };
  vm.runInNewContext(fs.readFileSync('engines/src/water-bill-engine.js', 'utf8'), context);
  vm.runInNewContext(script, context);
  function click(id) { element(id).listeners.click.call(element(id)); }
  return { async calculate(input) {
    for (const [id, value] of Object.entries(input)) element(id).value = String(value);
    click('calcBtn'); click('downloadWater');
    const download = downloads.at(-1);
    return { text: download && await download.blob.text(), name: download && download.name, error: element('waterError').textContent, bill: element('rBill').textContent, daily: element('rDaily').textContent };
  }, invalidate() { element('monthlyUsage').listeners.input(); click('downloadWater'); }, count: () => downloads.length };
}

for (const fixture of [
  { usage: 0, billable: 3, charge: '66.51', daily: '0.0' },
  { usage: 2, billable: 3, charge: '66.51', daily: '66.7' },
  { usage: 15, billable: 15, charge: '532.12', daily: '500.0' }
]) test(`Addis TXT preserves actual ${fixture.usage}m³ against billable minimum and dated provenance`, async () => {
  const page = worksheet();
  const r = await page.calculate({ tariffMode: 'addis-149-year5', customerType: 'domestic', monthlyUsage: fixture.usage, customFee: 0 });
  assert.equal(r.error, '');
  assert.equal(r.name, 'ethiopia-water-estimate.txt');
  assert.equal(r.bill, 'ETB ' + fixture.charge);
  assert.equal(r.daily, fixture.daily + ' L');
  assert.ok(r.text.includes(`Actual monthly consumption: ${fixture.usage} m³`));
  assert.ok(r.text.includes(`Billable usage: ${fixture.billable} m³`));
  assert.ok(r.text.includes(`Daily consumption: ${fixture.daily} L (assumes a 30-day month; uses actual consumption, not the billable minimum)`));
  assert.match(r.text, /8 July 2026 to 7 July 2027/);
  assert.match(r.text, /Source: https:\/\/www\.aajs\.gov\.et\/uploads\/Publication\/149-2015-2024-09-25-66f40296e8daa\.pdf/);
  assert.match(r.text, /later adjustments and current provider implementation are not confirmed/);
  assert.match(r.text, /not added automatically/);
  assert.doesNotMatch(r.text, /account number|customer name|address|phone|email/i);
  page.invalidate(); assert.equal(page.count(), 1, 'input changes invalidate the downloadable estimate');
});

test('non-domestic export retains whole-volume arithmetic plus entered charges', async () => {
  const r = await worksheet().calculate({ tariffMode: 'addis-149-year5', customerType: 'non-domestic', monthlyUsage: 15, customFee: 20 });
  assert.equal(r.bill, 'ETB 1101.05');
  assert.match(r.text, /Customer class: non-domestic/);
  assert.match(r.text, /15 m³ × ETB 72\.07 = ETB 1081\.05/);
  assert.match(r.text, /Other charges: ETB 20\.00/);
  assert.match(r.text, /Actual monthly consumption: 15 m³/);
});

test('custom-rate download stays an entered-rate worksheet without official tariff attribution', async () => {
  const r = await worksheet().calculate({ tariffMode: 'custom', monthlyUsage: 15, householdSize: 4, customRate: 12.5, customFee: 7.25 });
  assert.equal(r.bill, 'ETB 194.75');
  assert.match(r.text, /15 m³ × ETB 12.5 \+ ETB 7.25/);
  assert.match(r.text, /30-day month/);
  assert.match(r.text, /not a verified provider tariff/);
  assert.doesNotMatch(r.text, /Regulation 149|aajs\.gov/);
});

test('invalid input produces no TXT download', async () => {
  const page = worksheet();
  const r = await page.calculate({ tariffMode: 'addis-149-year5', customerType: 'domestic', monthlyUsage: -1, customFee: 0 });
  assert.match(r.error, /nonnegative/);
  assert.equal(page.count(), 0);
});
