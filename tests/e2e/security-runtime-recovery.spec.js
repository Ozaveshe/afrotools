const { test, expect } = require('@playwright/test');
const routes = ['cctv-cost', 'cybersecurity-assessment', 'data-breach-cost', 'fire-safety-checklist', 'home-security-cost', 'password-strength', 'phishing-quiz'];

async function clipboardFallback(page, outcome) {
  await page.evaluate(outcome => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Synthetic clipboard denial')) } });
    document.execCommand = () => { if (outcome === 'throw') throw new Error('Synthetic fallback denial'); return outcome === 'true'; };
  }, outcome);
}

for (const route of routes) for (const outcome of ['false', 'throw', 'true']) {
  test(`${route}: safe brief reports ${outcome} clipboard fallback truthfully`, async ({ page }) => {
    await page.goto(`/tools/${route}/`);
    const copy = page.locator('[data-sec-action="copy"]');
    await expect(copy).toBeVisible();
    const before = await page.locator('textarea').count();
    await clipboardFallback(page, outcome);
    await copy.click();
    await expect(page.locator('[data-sec-status]')).toContainText(outcome === 'true' ? 'Copied safe brief' : 'Copy was blocked');
    await expect(copy).toBeFocused();
    await expect(page.locator('textarea')).toHaveCount(before);
  });
}

for (const width of [390, 1280]) {
  test(`password: zero score, clear/retype, meter boundaries and redacted exports at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('/tools/password-strength/');
    const input = page.locator('#pwInput');
    await input.fill('123456');
    await expect(page.locator('#results')).toHaveClass(/on/);
    await expect(page.locator('#scoreDisplay')).toHaveText('0/100');
    await input.fill('');
    await expect(page.locator('#results')).not.toHaveClass(/on/);
    // Stub only the score to test rendering bands independently of heuristic quality.
    for (const score of [0, 19, 20, 39, 40, 59, 60, 79, 80, 100]) {
      await page.evaluate(score => { window.scorePassword = () => score; }, score);
      await input.fill(`Synthetic-Fixture-${score}`);
      const band = Math.min(4, Math.floor(score / 20));
      await expect(page.locator('#strengthBar')).toHaveClass(`strength-fill ${['strength-very-weak', 'strength-weak', 'strength-fair', 'strength-strong', 'strength-very-strong'][band]}`);
      expect(await page.locator('#strengthBar').evaluate(el => el.style.width)).toBe('');
      await expect(page.locator('#strengthLabel')).toHaveText(`${['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][band]} (${score}/100)`);
    }
    const syntheticInput = 'Synthetic-Only-Secret-42';
    await input.fill(syntheticInput); await page.locator('#pwToggle').click();
    await expect(input).toHaveAttribute('type', 'text');
    await page.locator('[data-sec-action="refresh"]').click();
    const brief = await page.locator('[data-sec-output]').innerText();
    expect(brief).toContain('redacted'); expect(brief).not.toContain(syntheticInput);
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: text => { window.copiedBrief = text; return Promise.resolve(); } } }));
    await page.locator('[data-sec-action="copy"]').click();
    expect(await page.evaluate(() => window.copiedBrief)).toBe(brief);
    await page.locator('[data-sec-action="save"]').click();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('afrotools:security-brief:password-strength')));
    expect(stored.brief).toBe(brief);
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-sec-action="download"]').click();
    const download = await downloadPromise;
    const stream = await download.createReadStream(); const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    expect(Buffer.concat(chunks).toString('utf8')).toBe(brief);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
  });

  test(`CCTV: invalid counts, fresh estimates and print suppression at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tools/cctv-cost/');
    await page.locator('#cameraType').selectOption('ip'); await page.locator('#recorder').selectOption('nvr');
    const calculate = () => page.locator('[onclick="calculate()"]').click();
    for (const value of ['1', '64']) {
      await page.locator('#cameras').fill(value); await calculate();
      await expect(page.locator('#results')).toHaveClass(/on/);
    }
    for (const value of ['', '0', '-1', '1.5', '65']) {
      await page.locator('#cameras').fill(value); await calculate();
      await expect(page.locator('#results')).not.toHaveClass(/on/);
      await expect(page.locator('#cameras')).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('#cameras')).toBeFocused();
    }
    await page.locator('#cameras').fill('4'); await calculate();
    await page.locator('#recorder').selectOption('cloud'); await calculate();
    if (width === 1280) await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    const parsed = await require('pdf-parse')(Uint8Array.from(pdf));
    expect(parsed.text).toContain('Total Setup Cost');
    expect(parsed.text).toContain('Cloud storage');
    expect(parsed.text).toContain('Professional Install');
    await page.emulateMedia({ media: 'print' }); await expect(page.locator('#results')).toBeVisible();
    await page.emulateMedia({ media: 'screen' });
    for (const id of ['country', 'cameras', 'cameraType', 'recorder', 'storage', 'installation', 'monitoring']) {
      await calculate();
      await page.locator(`#${id}`).dispatchEvent('change');
      await expect(page.locator('#results')).not.toHaveClass(/on/);
      await page.evaluate(() => { window.printCalls = 0; window.print = () => window.printCalls++; printEstimate(); copyEstimate(); });
      expect(await page.evaluate(() => window.printCalls)).toBe(0);
      await expect(page.locator('#calcStatus')).toContainText('Calculate an estimate before copying');
      await page.emulateMedia({ media: 'print' }); await expect(page.locator('#results')).toBeHidden();
      await page.emulateMedia({ media: 'screen' });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}

for (const country of ['NG', 'KE', 'ZA', 'GH', 'EG', 'TZ']) {
  test(`CCTV ${country}: cloud cost breakdown and DIY/pro comparison reconcile`, async ({ page }) => {
    await page.goto('/tools/cctv-cost/');
    await page.locator('#country').selectOption(country); await page.locator('#cameraType').selectOption('ip');
    for (const recorder of ['nvr', 'cloud']) for (const installation of ['diy', 'professional']) {
      await page.locator('#recorder').selectOption(recorder); await page.locator('#installation').selectOption(installation);
      await page.locator('[onclick="calculate()"]').click();
      await expect(page.locator('#results')).toHaveClass(/on/);
      const values = await page.evaluate(() => {
        const number = text => Number(text.replace(/[^\d.-]/g, ''));
        const rows = Array.from(document.querySelectorAll('#compareTable tr')).map(row => Array.from(row.cells).map(cell => cell.textContent));
        return { setup: number(document.querySelector('#hardwareCost').textContent), fiveYear: number(document.querySelector('#fiveYear').textContent), breakdown: Array.from(document.querySelectorAll('#breakdownTable tr')).reduce((sum, row) => sum + number(row.lastElementChild.textContent), 0), rows: rows.map(row => row.slice(1, 4).map(number)) };
      });
      expect(values.breakdown).toBe(values.fiveYear);
      expect(values.rows[1][0]).toBeGreaterThan(values.rows[0][0]);
      expect(values.rows[1][2] - values.rows[0][2]).toBe(values.rows[1][0] - values.rows[0][0]);
      expect(values.setup).toBe(values.rows[installation === 'diy' ? 0 : 1][0]);
      await expect(page.locator('.en-results-hero-label')).toHaveText('Total Setup Cost');
      if (recorder === 'cloud') await expect(page.locator('#breakdownTable')).toContainText('Cloud storage');
    }
  });
}

for (const correct of [false, true]) {
  test(`phishing: ${correct ? '10/10' : '0/10'} journey, fallback outcomes and print freshness`, async ({ page }) => {
    await page.goto('/tools/phishing-quiz/');
    await page.emulateMedia({ media: 'print' }); await expect(page.locator('#resultsScreen')).toBeHidden();
    await page.emulateMedia({ media: 'screen' }); await page.locator('[onclick="startQuiz()"]').click();
    for (let i = 0; i < 10; i++) {
      const choice = await page.evaluate(correct => { const q = shuffled[currentQ]; return { id: q.id, answer: correct ? q.answer : (q.answer + 1) % q.options.length }; }, correct);
      await page.locator(`#opt${choice.id}_${choice.answer}`).click();
      await expect(page.locator(`#opt${choice.id}_${choice.answer}`)).toBeDisabled();
      await page.locator(i === 9 ? '#finishBtn' : '#nextBtn').click();
    }
    await expect(page.locator('#finalScore')).toHaveText(correct ? '10/10' : '0/10');
    for (const outcome of ['false', 'throw', 'true']) {
      await clipboardFallback(page, outcome);
      const copy = page.locator('[onclick="copyQuizSummary()"]'); await copy.click();
      await expect(page.locator('#quizExportStatus')).toContainText(outcome === 'true' ? 'Training summary copied' : 'Copy was blocked');
      await expect(copy).toBeFocused();
    }
    await page.emulateMedia({ media: 'print' }); await expect(page.locator('#resultsScreen')).toBeVisible();
    await page.emulateMedia({ media: 'screen' }); await page.locator('[onclick="restartQuiz()"]').click();
    await page.emulateMedia({ media: 'print' }); await expect(page.locator('#resultsScreen')).toBeHidden();
  });
}
