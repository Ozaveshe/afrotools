const { test, expect } = require('@playwright/test');

const workflows = [
  ['home-security-cost', ['country', 'homeType', 'riskLevel', 'securityLevel'], 'copyHomeSecurityEstimate', 'printHomeSecurityEstimate'],
  ['data-breach-cost', ['country', 'records', 'basePerRecord', 'sensitivity', 'orgSize', 'detection'], 'copyBreachEstimate', 'printBreachEstimate'],
  ['cybersecurity-assessment', null, 'copyAssessment', 'printAssessment'],
  ['fire-safety-checklist', null, 'copyFireSummary', 'printFireSummary']
];
for (const [route, ids, copy, print] of workflows) {
  test(`${route}: edits invalidate results and block stale copy/print`, async ({ page }) => {
    await page.goto(`/tools/${route}/`);
    const rows = await page.evaluate(({ ids, copy, print }) => {
      const fields = ids || [...document.querySelectorAll('.en-card input, .en-card select')].filter(x => x.id && !x.disabled).map(x => x.id);
      if (!fields.length) throw new Error('No workflow controls found');
      let copies = 0, prints = 0;
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { copies++; } } });
      window.print = () => { prints++; };
      return fields.map(id => {
        calculate();
        if (!document.querySelector('#results.on')) throw new Error('Initial calculation failed: ' + id);
        const field = document.getElementById(id), c = copies, p = prints;
        field.dispatchEvent(new Event('change', { bubbles: true }));
        window[copy](); window[print]();
        return { id, active: !!document.querySelector('#results.on'), copies: copies - c, prints: prints - p };
      });
    }, { ids, copy, print });
    if (route === 'cybersecurity-assessment') expect(rows).toHaveLength(25);
    if (ids) expect(rows).toHaveLength(ids.length);
    for (const row of rows) expect(row, row.id).toMatchObject({ active: false, copies: 0, prints: 0 });
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('#results')).not.toBeVisible();
  });
}

for (const [route, defaults, invalid] of [
  ['data-breach-cost', { records: '10000', basePerRecord: '165' }, { records: ['', '0', '-1', '1.5', '100000001'], basePerRecord: ['', '0', '-1', '10001'] }],
  ['fire-safety-checklist', { area: '500', floors: '2', occupants: '30' }, { area: ['', '0', '-1', '9.99', '1000001'], floors: ['', '0', '-1', '1.5', '301'], occupants: ['', '0', '-1', '1.5', '1000001'] }]
]) {
  test(`${route}: invalid numeric input clears output and focuses the field`, async ({ page }) => {
    await page.goto(`/tools/${route}/`);
    const rows = await page.evaluate(({ defaults, invalid }) => {
      const rows = [];
      for (const [id, values] of Object.entries(invalid)) for (const value of values) {
        for (const [key, initial] of Object.entries(defaults)) document.getElementById(key).value = initial;
        calculate(); document.getElementById(id).value = value; calculate();
        rows.push({ id, value, active: !!document.querySelector('#results.on'), invalid: document.getElementById(id).getAttribute('aria-invalid'), focus: document.activeElement.id });
      }
      return rows;
    }, { defaults, invalid });
    for (const row of rows) expect(row, JSON.stringify(row)).toMatchObject({ active: false, invalid: 'true', focus: row.id });
  });
}

test('home: all 216 option combinations disclose the annualized basis', async ({ page }) => {
  await page.goto('/tools/home-security-cost/');
  const rows = await page.evaluate(() => {
    const ids = ['country', 'homeType', 'riskLevel', 'securityLevel'];
    const options = ids.map(id => [...document.getElementById(id).options].map(o => o.value));
    const rows = [];
    for (const country of options[0]) for (const homeType of options[1]) for (const riskLevel of options[2]) for (const securityLevel of options[3]) {
      for (const [id, value] of Object.entries({ country, homeType, riskLevel, securityLevel })) document.getElementById(id).value = value;
      calculate(); rows.push(homeSecuritySummary());
    }
    return rows;
  });
  expect(rows).toHaveLength(216);
  for (const row of rows) { expect(row).toContain('setup / 5 + monthly running cost x 12'); expect(row).not.toMatch(/NaN|Infinity/); }
});

test('fire: fractional area and all 17 gap amounts use the native engine', async ({ page }) => {
  await page.goto('/tools/fire-safety-checklist/');
  const rows = await page.evaluate(() => {
    const rows = [];
    for (const area of [10, 200, 200.5, 201, 1000000]) for (const floors of [1, 300]) for (const occupants of [1, 1000000]) {
      for (let i = 1; i <= 17; i++) document.getElementById('c' + i).checked = false;
      for (const [id, value] of Object.entries({ area, floors, occupants })) document.getElementById(id).value = value;
      calculate();
      const expected = AfroToolsSecurityFire.calculate({ country: document.getElementById('country').value, propType: document.getElementById('propType').value, area, floors, occupants, checks: [] });
      rows.push({ actual: document.getElementById('costToComply').textContent, expected: expected.currency + fmt(expected.remediation), gaps: expected.failed.length });
    }
    return rows;
  });
  expect(rows).toHaveLength(20);
  for (const row of rows) { expect(row.actual).toBe(row.expected); expect(row.gaps).toBe(17); }
  await expect(page.locator('#metrics')).toContainText('excludes existing systems');
});

test('cyber: evidence labels reflect all 32 combinations without claiming compliance', async ({ page }) => {
  await page.goto('/tools/cybersecurity-assessment/');
  const result = await page.evaluate(() => {
    const ids = ['privacy_policy', 'backup', 'mfa', 'encryption', 'incident_plan'];
    const rows = [];
    for (let mask = 0; mask < 32; mask++) {
      ids.forEach((id, i) => { document.getElementById(id).checked = !!(mask & (1 << i)); });
      calculate();
      const text = document.getElementById('complianceStatus').textContent;
      rows.push({ selected: ids.filter(id => document.getElementById(id).checked).length, ticks: (text.match(/✅/g) || []).length, labels: (text.match(/marked present/g) || []).length, qualified: text.includes('does not determine legal compliance') });
    }
    const countries = [...document.getElementById('country').options].map(o => o.value).map(value => {
      document.getElementById('country').value = value; calculate();
      return { value, text: document.getElementById('complianceStatus').textContent, score: document.getElementById('overallScore').textContent };
    });
    return { rows, countries };
  });
  expect(result.rows).toHaveLength(32);
  for (const row of result.rows) { expect(row.ticks).toBe(row.selected); expect(row.labels).toBe(5); expect(row.qualified).toBe(true); }
  expect(result.countries).toHaveLength(5);
  expect(new Set(result.countries.map(x => x.score)).size).toBe(1);
  for (const row of result.countries) expect(row.text).toContain('Authority context to verify:');
});

test('cyber: 110 control and incident scenarios preserve the transparent score', async ({ page }) => {
  await page.goto('/tools/cybersecurity-assessment/');
  const rows = await page.evaluate(() => {
    const fields = [...document.querySelectorAll('.en-card input[type=checkbox]')];
    const incidents = ['none', 'minor', 'major'];
    const rows = [];
    for (let i = 0; i < 110; i++) {
      const selected = i % 21;
      fields.forEach((field, j) => { field.checked = j < selected; });
      const incident = incidents[i % 3]; document.getElementById('incidents').value = incident;
      calculate();
      rows.push({ actual: document.getElementById('overallScore').textContent, expected: Math.max(0, selected * 5 - ({ none: 0, minor: 5, major: 15 }[incident])) + '/100' });
    }
    return rows;
  });
  expect(rows).toHaveLength(110);
  for (const row of rows) expect(row.actual).toBe(row.expected);
});

test('breach: 180 option combinations remain finite and qualified', async ({ page }) => {
  await page.goto('/tools/data-breach-cost/');
  const rows = await page.evaluate(() => {
    const ids = ['country', 'sensitivity', 'orgSize', 'detection'];
    const options = ids.map(id => [...document.getElementById(id).options].map(o => o.value));
    const rows = [];
    for (const country of options[0]) for (const sensitivity of options[1]) for (const orgSize of options[2]) for (const detection of options[3]) {
      for (const [id, value] of Object.entries({ country, sensitivity, orgSize, detection })) document.getElementById(id).value = value;
      calculate(); rows.push({ active: !!document.querySelector('#results.on'), summary: breachSummary() });
    }
    return rows;
  });
  expect(rows).toHaveLength(180);
  for (const row of rows) { expect(row.active).toBe(true); expect(row.summary).not.toMatch(/NaN|Infinity/); expect(row.summary).toContain('regulatory fines are not estimated'); }
  await expect(page.locator('#country option[value=NG]')).toHaveText(/NDP Act 2023.*NDPC/);
});

test('fire: every gap and scaled line cost reconciles across 1824 scenarios', async ({ page }) => {
  await page.goto('/tools/fire-safety-checklist/');
  const count = await page.evaluate(() => {
    const countries = [...document.getElementById('country').options].map(o => o.value);
    const props = [...document.getElementById('propType').options].map(o => o.value);
    const checks = Array.from({ length: 17 }, (_, i) => 'c' + (i + 1));
    let count = 0;
    for (const country of countries) for (const propType of props) for (const area of [10, 200.5, 500, 1000000]) for (let pattern = -2; pattern < 17; pattern++) {
      for (const [id, value] of Object.entries({ country, propType, area, floors: 2, occupants: 30 })) document.getElementById(id).value = value;
      checks.forEach((id, i) => { document.getElementById(id).checked = pattern === -1 || pattern === i; });
      calculate();
      const selected = checks.filter(id => document.getElementById(id).checked);
      const expected = AfroToolsSecurityFire.calculate({ country, propType, area, floors: 2, occupants: 30, checks: selected });
      const rows = [...document.querySelectorAll('#actionContent tbody tr')];
      const failed = expected.failed.slice().sort((a, b) => b.points - a.points);
      if (rows.length !== failed.length) throw new Error('Missing gap row');
      rows.forEach((row, i) => {
        if (row.cells[2].textContent !== expected.currency + fmt(failed[i].cost * (Math.ceil(area / 200) * .5 + .5))) throw new Error('Line amount mismatch');
      });
      if (document.getElementById('costToComply').textContent !== expected.currency + fmt(expected.remediation)) throw new Error('Total mismatch');
      count++;
    }
    return count;
  });
  expect(count).toBe(1824);
});

for (const route of ['home-security-cost', 'data-breach-cost', 'cybersecurity-assessment', 'fire-safety-checklist', 'cctv-cost']) for (const width of [320, 390]) {
  test(`${route}: mobile results and printable PDF at ${width}px`, async ({ page }, testInfo) => {
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/tools/${route}/`);
    await page.evaluate(() => calculate());
    await expect(page.locator('#results')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ media: 'print', colorScheme });
      await expect(page.locator('#results')).toBeVisible();
      const pdf = await page.pdf({ path: testInfo.outputPath(`${route}-${colorScheme}.pdf`), format: 'A4', printBackground: true });
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    }
    expect(errors).toEqual([]);
  });
}

test('phishing: full explanations and advice survive mobile review and PDF export', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/tools/phishing-quiz/');
  await page.locator('[onclick="startQuiz()"]').click();
  for (let i = 0; i < 10; i++) {
    const choice = await page.evaluate(() => { const q = shuffled[currentQ]; return { id: q.id, answer: (q.answer + 1) % q.options.length }; });
    await page.locator(`#opt${choice.id}_${choice.answer}`).click();
    await page.locator(i === 9 ? '#finishBtn' : '#nextBtn').click();
  }
  const expected = await page.evaluate(() => shuffled.map(q => q.explanation));
  for (const explanation of expected) await expect(page.locator('#reviewContainer')).toContainText(explanation);
  await expect(page.locator('#gradeLabel')).toContainText('not a security rating');
  await expect(page.locator('#tipsContainer')).not.toBeEmpty();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ media: 'print', colorScheme });
    await expect(page.locator('#resultsScreen')).toBeVisible();
    const pdf = await page.pdf({ path: testInfo.outputPath(`phishing-${colorScheme}.pdf`), format: 'A4', printBackground: true });
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  }
});
