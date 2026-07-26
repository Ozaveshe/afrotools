const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

test.describe.configure({ mode: 'serial' });

async function captureVisual(page, name) {
  if (!process.env.LANE_C_VISUAL_CAPTURE) return;
  await page.screenshot({ path: path.join(process.env.LANE_C_VISUAL_CAPTURE, `${name}.png`), fullPage: false });
}

async function expectResponsiveAndNamed(page, route) {
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.style.fontSize = '200%';
    });
    if (width === 375) await captureVisual(page, `${route.split('/').filter(Boolean).pop()}-mobile-dark`);
    await expect(page.locator('h1')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow, `${route} should not overflow at ${width}px with 200% text`).toBe(false);
    const unnamed = await page.locator('main button, main input, main select, main textarea').evaluateAll(nodes => nodes.filter(node => {
      if (node.disabled || node.hidden || node.type === 'hidden' || node.closest('[hidden]')) return false;
      if (node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent.trim()) return false;
      if (node.id && document.querySelector(`label[for="${node.id}"]`)) return false;
      if (node.closest('label')) return false;
      return true;
    }).length);
    expect(unnamed).toBe(0);
    const focusIndicator = await page.evaluate(() => {
      const control = [...document.querySelectorAll('main button:not([disabled]), main input:not([disabled]), main select:not([disabled]), main textarea:not([disabled])')]
        .find(node => !node.hidden && node.getClientRects().length > 0 && !node.closest('[hidden]'));
      if (!control) return null;
      control.focus();
      const style = getComputedStyle(control);
      return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) };
    });
    expect(focusIndicator, `${route} should expose a focusable route control`).not.toBeNull();
    expect(focusIndicator.style, `${route} should show a visible focus outline`).not.toBe('none');
    expect(focusIndicator.width, `${route} focus outline should be at least 2px`).toBeGreaterThanOrEqual(2);
  }
}

test('Pidgin: complete learning and phrasebook workflow stays session-only', async ({ page }) => {
  await page.goto('/tools/pidgin-translator/');

  const learnTab = page.getByRole('tab', { name: 'Learn' });
  await learnTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Translate' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(learnTab).toHaveAttribute('aria-selected', 'true');

  await expect(page.getByRole('button', { name: 'Study again' })).toBeDisabled();
  await expect(page.getByRole('button', { name: /I knew it/ })).toBeDisabled();
  await page.locator('#flashcard').click();
  await expect(page.locator('#flashcard')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('button', { name: /I knew it/ })).toBeEnabled();
  await page.getByRole('button', { name: /I knew it/ }).click();
  await expect(page.locator('#fcProgressText')).toHaveText('1 / 109 phrases');

  await page.getByRole('button', { name: 'Listed Pidgin to English' }).click();
  await expect(page.getByRole('button', { name: 'Listed Pidgin to English' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#fcPromptLabel')).toContainText('English prompt');

  await page.getByRole('tab', { name: 'Phrasebook' }).click();
  await page.getByLabel('Search English or listed Pidgin wording').fill('NO-SUCH-PHRASE-LANE-C');
  await expect(page.locator('#countBadge')).toHaveText('0 phrases');
  await expect(page.getByText('No entries match this search and category.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page.locator('#countBadge')).toHaveText('109 phrases');

  await page.getByRole('button', { name: 'Greetings' }).click();
  await expect(page.locator('#countBadge')).toHaveText('13 phrases');
  const filteredDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download visible TXT' }).click();
  const filteredDownload = await filteredDownloadPromise;
  expect(filteredDownload.suggestedFilename()).toBe('nigerian-pidgin-visible-13.txt');
  expect(fs.readFileSync(await filteredDownload.path(), 'utf8')).toContain('13 visible entries from 109 local rows');

  const storage = await page.evaluate(() => ({ local: JSON.stringify(localStorage), session: JSON.stringify(sessionStorage) }));
  expect(JSON.stringify(storage)).not.toContain('pidgin_learned');
});

test('Pidgin: measured phrasebook, local export, and session-only translation consent', async ({ page }) => {
  const posts = [];
  page.on('request', request => {
    if (request.method() === 'POST' && request.url().includes('/api/translate')) posts.push({ url: request.url(), body: request.postData() || '', headers: request.headers() });
  });
  await page.route('**/api/translate', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ translatedText: 'How far?', provider: 'test-provider' })
  }));
  await page.goto('/tools/pidgin-translator/');
  await captureVisual(page, 'pidgin-translator-desktop-light');
  await expect(page.getByRole('heading', { name: /Nigerian Pidgin Phrasebook/i })).toBeVisible();
  await page.getByRole('tab', { name: 'Phrasebook', exact: true }).click();
  await expect(page.locator('#countBadge')).toHaveText('109 phrases');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download visible TXT' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('nigerian-pidgin-phrasebook-109.txt');
  expect(fs.readFileSync(await download.path(), 'utf8')).toContain('109 visible entries from 109 local rows');

  await page.getByRole('tab', { name: 'Translate' }).click();
  await page.getByLabel('English text to send').fill('PRIVATE-LANE-C-TEXT');
  await expect(page.locator('#translateBtn')).toBeDisabled();
  expect(posts).toHaveLength(0);
  await page.getByLabel('I choose to send this text for external machine translation.').check();
  await page.locator('#translateBtn').click();
  await expect(page.locator('#tgtOutput')).toHaveText('How far?');
  expect(posts).toHaveLength(1);
  expect(posts[0].headers['x-afrotools-external-translation-consent']).toBe('accepted');
  const storage = await page.evaluate(() => ({ local: JSON.stringify(localStorage), session: JSON.stringify(sessionStorage), href: location.href }));
  expect(JSON.stringify(storage)).not.toContain('PRIVATE-LANE-C-TEXT');
  await page.getByRole('tab', { name: 'Phrasebook', exact: true }).click();
  await page.evaluate(() => { window.__printed = false; window.print = () => { window.__printed = true; }; });
  await page.getByRole('button', { name: 'Print visible list / Save PDF' }).click();
  expect(await page.evaluate(() => window.__printed)).toBe(true);
  await page.reload();
  await page.getByRole('tab', { name: 'Translate' }).click();
  await expect(page.locator('#translateBtn')).toBeDisabled();
  await expectResponsiveAndNamed(page, '/tools/pidgin-translator/');
});

test('French: complete phrasebook and general-French quiz workflow exposes its boundaries', async ({ page }) => {
  await page.goto('/tools/french-african/');
  expect(await page.locator('.quiz-card').evaluate(node => Boolean(node.closest('.container')))).toBe(true);

  await page.getByRole('button', { name: 'African French' }).click();
  await expect(page.getByRole('button', { name: 'African French' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#countBadge')).toHaveText('20 phrases');
  const filteredDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download visible TXT' }).click();
  const filteredDownload = await filteredDownloadPromise;
  expect(filteredDownload.suggestedFilename()).toBe('francophone-africa-visible-20.txt');
  const filteredText = fs.readFileSync(await filteredDownload.path(), 'utf8');
  expect(filteredText).toContain('20 visible entries from 95 local rows');
  expect(filteredText).toContain('Country and register: unknown / unverified');

  await page.getByLabel('Search English or French').fill('NO-SUCH-FRENCH-LANE-C');
  await expect(page.locator('#countBadge')).toHaveText('0 phrases');
  await expect(page.getByText('No entries match this search and category.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page.locator('#countBadge')).toHaveText('95 phrases');

  await page.getByRole('button', { name: 'French to English' }).click();
  await expect(page.getByRole('button', { name: 'French to English' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.quiz-q')).toContainText('paired English prompt');
  await page.locator('.quiz-opt').first().click();
  await expect(page.locator('.quiz-feedback')).not.toBeEmpty();
  await expect(page.locator('.quiz-opt').first()).toBeDisabled();
  await expect(page.getByRole('button', { name: /Next Question/ })).toBeVisible();
  await expect(page.locator('#quizScoreEl')).toHaveText(/Session score: [01]\/1/);

  const storage = await page.evaluate(() => ({ local: JSON.stringify(localStorage), session: JSON.stringify(sessionStorage) }));
  expect(JSON.stringify(storage)).not.toContain('quizScore');
});

test('French: measured and bounded rows, local export, and consented external translation', async ({ page }) => {
  const posts = [];
  page.on('request', request => { if (request.method() === 'POST' && request.url().includes('/api/translate')) posts.push(request); });
  await page.route('**/api/translate', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ translatedText: 'Bonjour', provider: 'test-provider' })
  }));
  await page.goto('/tools/french-african/');
  await captureVisual(page, 'french-african-desktop-light');
  await expect(page.locator('#countBadge')).toHaveText('95 phrases');
  await page.getByRole('button', { name: 'African French' }).click();
  await expect(page.locator('#countBadge')).toHaveText('20 phrases');
  await expect(page.locator('.phrase .scope').first()).toHaveText('Country and register: unknown / unverified');
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page.locator('#countBadge')).toHaveText('95 phrases');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download visible TXT' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('francophone-africa-phrasebook-95.txt');
  expect(fs.readFileSync(await download.path(), 'utf8')).toContain('Country and register provenance is missing');

  await page.getByLabel('Source text').fill('PRIVATE-FRENCH-TEXT');
  await expect(page.getByRole('button', { name: /Translate/ })).toBeDisabled();
  expect(posts).toHaveLength(0);
  await page.getByLabel('I choose to send this text for external machine translation.').check();
  await page.getByRole('button', { name: /Translate/ }).click();
  await expect(page.locator('#translateOutput')).toHaveText('Bonjour');
  expect(posts).toHaveLength(1);
  const storage = await page.evaluate(() => JSON.stringify({ localStorage, sessionStorage, href: location.href }));
  expect(storage).not.toContain('PRIVATE-FRENCH-TEXT');
  await page.evaluate(() => { window.__printed = false; window.print = () => { window.__printed = true; }; });
  await page.getByRole('button', { name: 'Print visible list / Save PDF' }).click();
  expect(await page.evaluate(() => window.__printed)).toBe(true);
  await page.reload();
  await expect(page.locator('#translateBtn')).toBeDisabled();
  await expectResponsiveAndNamed(page, '/tools/french-african/');
});

test('African names: search, browse, and session shortlist form a useful provenance workflow', async ({ page }) => {
  await page.goto('/tools/african-name-meaning/');

  const searchTab = page.getByRole('tab', { name: 'Search Records' });
  await searchTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Browse Candidates' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(searchTab).toHaveAttribute('aria-selected', 'true');

  await page.getByLabel('Name or listed-language label').fill('Amani');
  await page.getByRole('button', { name: 'Add to session shortlist' }).first().click();
  await expect(page.locator('#shortlistCount')).toHaveText('(1 of 6)');
  await expect(page.locator('#shortlistGrid')).toContainText('Amani');

  await page.getByLabel('Name or listed-language label').fill('Baraka');
  await page.getByRole('button', { name: 'Add to session shortlist' }).first().click();
  await expect(page.locator('#shortlistCount')).toHaveText('(2 of 6)');

  const shortlistDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download shortlist TXT' }).click();
  const shortlistDownload = await shortlistDownloadPromise;
  expect(shortlistDownload.suggestedFilename()).toBe('african-name-session-shortlist-2.txt');
  const shortlistText = fs.readFileSync(await shortlistDownload.path(), 'utf8');
  expect(shortlistText).toContain('Amani');
  expect(shortlistText).toContain('Baraka');
  expect(shortlistText).toContain('Meaning: unknown');
  expect(shortlistText).not.toContain('\tPeace\t');

  await page.getByRole('tab', { name: 'Browse Candidates' }).click();
  await page.getByLabel('Listed language (unverified)').last().selectOption('Ewe');
  await page.getByLabel('Sort records').selectOption('za');
  await expect(page.locator('#suggestCount')).toHaveText(/\d+ records match/);
  const browseNames = await page.locator('#suggestGrid .name').allTextContents();
  expect(browseNames.length).toBeGreaterThan(0);
  expect([...browseNames].sort((a, b) => b.localeCompare(a))).toEqual(browseNames);

  await page.getByRole('button', { name: 'Clear shortlist' }).click();
  await expect(page.locator('#shortlistCount')).toHaveText('(0 of 6)');
  await expect(page.getByRole('button', { name: 'Download shortlist TXT' })).toBeDisabled();
  const storage = await page.evaluate(() => ({ local: JSON.stringify(localStorage), session: JSON.stringify(sessionStorage) }));
  expect(JSON.stringify(storage)).not.toContain('Amani');
  expect(JSON.stringify(storage)).not.toContain('Baraka');
});

test('African names: 308 records expose provenance gaps and export no unsupported meaning', async ({ page }) => {
  const requestPayloads = [];
  page.on('request', request => requestPayloads.push(request.url() + ' ' + (request.postData() || '')));
  await page.goto('/tools/african-name-meaning/');
  await captureVisual(page, 'african-name-meaning-desktop-light');
  await expect(page.getByRole('heading', { name: /African Name Provenance Review/i })).toBeVisible();
  await page.getByLabel('Name or listed-language label').fill('Amani');
  await expect(page.locator('#nameCount')).toHaveText(/of 308 names/);
  await expect(page.locator('.name-card').first()).toContainText('Meaning source: missing');
  await expect(page.locator('.name-card').first()).toContainText('Country: unknown / unverified');
  await expect(page.locator('.name-card').first()).not.toContainText('Peace');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download visible TXT' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('african-name-visible-1-provenance-gaps.txt');
  const text = fs.readFileSync(await download.path(), 'utf8');
  expect(text).toContain('Meaning: unknown');
  expect(text).not.toContain('\tPeace\t');
  expect(requestPayloads.some(payload => payload.includes('Amani'))).toBe(false);
  await page.evaluate(() => { window.__printed = false; window.print = () => { window.__printed = true; }; });
  await page.getByRole('button', { name: 'Print visible records / Save PDF' }).click();
  expect(await page.evaluate(() => window.__printed)).toBe(true);
  const storage = await page.evaluate(() => JSON.stringify({ localStorage, sessionStorage, href: location.href }));
  expect(storage).not.toContain('Amani');
  await expectResponsiveAndNamed(page, '/tools/african-name-meaning/');
});
