const { test, expect } = require('@playwright/test');

async function expectNoOverflow(page) {
  const overflow = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    offenders: Array.from(document.querySelectorAll('body *'))
      .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .slice(0, 8)
      .map((element) => `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.className ? `.${String(element.className).trim().replace(/\s+/g, '.')}` : ''}`)
  }));
  expect(overflow, `horizontal overflow: ${overflow.offenders.join(', ')}`).toMatchObject({
    documentWidth: overflow.viewportWidth
  });
}

test.describe('Day 7 Government & Civic serial workflow proof', () => {
  const verificationPlans = [
    {
      name: 'Birth and death records',
      route: '/tools/birth-death-cert/',
      country: 'KE',
      task: 'death',
      summary: 'Kenya - Death registration or certified copy',
      officialUrl: 'https://crs.ecitizen.go.ke/',
      boundary: 'not registration, certification, legal advice, or official acceptance'
    },
    {
      name: 'Marriage records',
      route: '/tools/marriage-cert/',
      country: 'ZA',
      task: 'foreign',
      summary: 'South Africa - Foreign marriage record recognition',
      officialUrl: 'https://www.gov.za/services/services-residents/relationships/getting-married',
      boundary: 'not legal recognition, registration, certification, or legal advice'
    },
    {
      name: 'Government scholarships',
      route: '/tools/gov-scholarship/',
      country: 'AU',
      task: 'international',
      summary: 'African Union calls - International study call',
      officialUrl: 'https://au.int/en/scholarships',
      boundary: 'No open-call, eligibility, funding, admission, selection, or award verdict'
    },
    {
      name: 'Social support',
      route: '/tools/social-welfare/',
      country: 'GH',
      task: 'child',
      summary: 'Ghana - Child or caregiver support',
      officialUrl: 'https://www.mogcsp.gov.gh/',
      boundary: 'No eligibility, benefit, priority, payment, or approval verdict'
    }
  ];

  verificationPlans.forEach((plan, index) => {
    test(`${plan.name} route executes its own official verification workflow`, async ({ page }) => {
      const writes = [];
      const errors = [];
      page.on('request', (request) => {
        if (request.method() !== 'GET') writes.push(request.postData() || '');
      });
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize({ width: index % 2 ? 375 : 320, height: 840 });
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
      await page.goto(plan.route, { waitUntil: 'domcontentloaded' });

      await page.locator('#gv-country').selectOption(plan.country);
      await page.locator('#gv-task').selectOption(plan.task);
      await page.locator('[name="gv-check"]').nth(0).check();
      await page.locator('[name="gv-check"]').nth(1).check();
      await page.getByRole('button', { name: 'Build verification brief' }).click();

      await expect(page.locator('#gv-gap-count')).toHaveText('2');
      await expect(page.locator('#gv-route-summary')).toContainText(`${plan.summary}. You marked 2 of 4`);
      await expect(page.locator('#gv-official-link')).toHaveAttribute('href', plan.officialUrl);
      await expect(page.locator('#gv-result')).toContainText(plan.boundary);

      await page.getByRole('button', { name: 'Reset' }).click();
      await expect(page.locator('#gv-result')).not.toHaveClass(/gv-on/);
      await expect(page.locator('#gv-country')).toBeFocused();
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      await expectNoOverflow(page);
      expect(writes.every((body) => body === '')).toBe(true);
      expect(errors).toEqual([]);
    });
  });

  test('Government hub routes one civic task without storing sensitive values', async ({ page }) => {
    const writes = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') writes.push({
        url: request.url(),
        body: request.postData() || ''
      });
    });
    await page.setViewportSize({ width: 320, height: 840 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/government/', { waitUntil: 'domcontentloaded' });

    await page.locator('[data-gov-route-country]').selectOption('KE');
    await page.locator('[data-gov-route-task]').selectOption('permit');
    await expect(page.locator('[data-gov-route-title]')).toHaveText('Kenya: Work permit or immigration cost');
    await expect(page.locator('[data-gov-route-open]')).toHaveAttribute('href', '/tools/work-permit-cost/');

    await page.getByRole('button', { name: 'Save route' }).click();
    await expect(page.locator('[data-gov-route-status]')).toContainText('Personal IDs');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('afro_government_route_plan_v1')));
    expect(saved).toMatchObject({
      countryCode: 'KE',
      taskId: 'permit',
      routeOnly: true,
      storesPersonalIds: false,
      storesApplicationNumbers: false
    });
    expect(JSON.stringify(writes)).not.toContain('KE');
    await expectNoOverflow(page);
  });

  test('Passport checklist prepares a route, rejects stale fee output, and resets', async ({ page }) => {
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().includes('ERR_NAME_NOT_RESOLVED')) errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.setViewportSize({ width: 375, height: 840 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/passport-checklist/', { waitUntil: 'domcontentloaded' });
    const country = page.getByLabel('Country', { exact: true });
    await country.selectOption('ZA');
    await page.getByRole('button', { name: 'Renewal' }).click();
    await page.getByRole('button', { name: 'Generate Checklist' }).click();

    await expect(page.locator('#resultCard')).toBeVisible();
    await expect(page.locator('#resultTitle')).toHaveText('ZA Passport — Renewal');
    await expect(page.locator('#resultGrid')).toContainText('Official check required');
    await expect(page.locator('#resultGrid')).toContainText('Department of Home Affairs');
    await expect(page.locator('#portalSection')).toContainText('does not verify a live fee');
    await expect(page.locator('#resultCard')).not.toContainText(/R400|6 weeks|3 weeks|KES 4,550/i);

    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#resultCard')).toBeHidden();
    await expect(country).toHaveValue('NG');
    await expect(country).toBeFocused();

    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expectNoOverflow(page);
    expect(errors).toEqual([]);
  });

  test('Visa route planner never invents an entry verdict and handles invalid/reset states', async ({ page }) => {
    const writes = [];
    const errors = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') writes.push({
        url: request.url(),
        body: request.postData() || ''
      });
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 320, height: 840 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/visa-checker/', { waitUntil: 'domcontentloaded' });

    await page.getByLabel('Passport country').selectOption('KE');
    await page.getByLabel('Destination country').selectOption('KE');
    await page.getByRole('button', { name: 'Prepare verification brief' }).click();
    await expect(page.getByRole('status')).toContainText('Choose different');
    await expect(page.locator('#result')).not.toHaveClass(/on/);
    await expect(page.getByLabel('Destination country')).toBeFocused();

    await page.getByLabel('Destination country').selectOption('ZA');
    await page.getByRole('button', { name: 'Prepare verification brief' }).click();
    await expect(page.locator('#route')).toHaveText('Kenya passport → South Africa');
    await expect(page.locator('#result')).toContainText('No live verdict');
    await expect(page.locator('#official-link')).toHaveAttribute('href', 'https://www.dha.gov.za/');
    await expect(page.locator('#result')).not.toContainText(/visa-free|visa on arrival|visa required|USD|days/i);

    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#result')).not.toHaveClass(/on/);
    await expect(page.getByLabel('Passport country')).toHaveValue('NG');
    await expect(page.getByLabel('Passport country')).toBeFocused();
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expectNoOverflow(page);
    expect(JSON.stringify(writes)).not.toMatch(/Kenya passport|South Africa|KE→ZA|KE-ZA/);
    expect(errors).toEqual([]);
  });

  test('National ID planner counts evidence gaps without collecting identity data', async ({ page }) => {
    const writes = [];
    const errors = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') writes.push({
        url: request.url(),
        body: request.postData() || ''
      });
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.setViewportSize({ width: 375, height: 840 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/national-id-guide/', { waitUntil: 'domcontentloaded' });

    await page.getByLabel('Country route').selectOption('GH');
    await page.getByLabel('Application route').selectOption('replace');
    await page.getByLabel('Birth or civil-status evidence').check();
    await page.getByLabel('Citizenship or lawful-status evidence').check();
    await page.getByLabel('Previous ID or application record').check();
    await page.getByRole('button', { name: 'Build evidence plan' }).click();

    await expect(page.locator('#gap-count')).toHaveText('2');
    await expect(page.locator('#route-summary')).toContainText('Ghana - Replacement. You marked 3 of 5');
    await expect(page.locator('#official-link')).toHaveAttribute('href', 'https://nia.gov.gh/');
    await expect(page.locator('#result')).toContainText('not eligibility or application approval');
    await expect(page.locator('#source-note')).toContainText('has not checked a live fee');

    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#result')).not.toHaveClass(/on/);
    await expect(page.getByLabel('Country route')).toHaveValue('NG');
    await expect(page.getByLabel('Country route')).toBeFocused();

    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expectNoOverflow(page);
    expect(JSON.stringify(writes)).not.toMatch(/Ghana|GH|Replacement|replace|civil|citizenship|previous/);
    expect(errors).toEqual([]);
  });

  test('Voter registration planner produces only an official verification checklist', async ({ page }) => {
    const writes = [];
    const errors = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') writes.push({ url: request.url(), body: request.postData() || '' });
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.setViewportSize({ width: 320, height: 840 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/voter-registration/', { waitUntil: 'domcontentloaded' });

    await page.getByLabel('Country route').selectOption('ZA');
    await page.getByLabel('What do you need to verify?').selectOption('update');
    await page.getByLabel('I am ready to confirm the current age rule').check();
    await page.getByLabel('I am ready to confirm accepted identity evidence').check();
    await page.getByRole('button', { name: 'Build verification brief' }).click();

    await expect(page.locator('#gap-count')).toHaveText('2');
    await expect(page.locator('#route-summary')).toContainText('South Africa - Polling place or details update. You marked 2 of 4');
    await expect(page.locator('#official-link')).toHaveAttribute('href', 'https://www.elections.org.za/pw/voter/voter-information');
    await expect(page.locator('#result')).toContainText('No eligibility or registration verdict');
    await expect(page.locator('#result')).not.toContainText(/eligible to vote|not eligible|next election|deadline is/i);

    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#result')).not.toHaveClass(/on/);
    await expect(page.getByLabel('Country route')).toHaveValue('NG');
    await expect(page.getByLabel('Country route')).toBeFocused();
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expectNoOverflow(page);
    expect(JSON.stringify(writes.map((write) => write.body))).not.toMatch(/South Africa|ZA|update|age|identity/);
    expect(errors).toEqual([]);
  });

  test('Election tracker exposes freshness, source filters, empty state, and reset', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 375, height: 840 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/africa-election-tracker/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#ledgerMeta')).toContainText(
      /Generated .* (?:within \d+-day review cadence|review overdue by \d+ days)/
    );
    await expect(page.locator('#metricRecords')).not.toHaveText('0');
    await page.locator('#sourceFilter').selectOption('official');
    await expect(page.locator('#electionList .et-pill-official').first()).toContainText('Official source');

    await page.locator('#searchInput').fill('route-that-does-not-exist');
    await expect(page.locator('#electionList')).toContainText(/No records match the current filters/i);
    await page.getByRole('button', { name: 'Reset filters' }).click();
    await expect(page.locator('#searchInput')).toHaveValue('');
    await expect(page.locator('#sourceFilter')).toHaveValue('all');
    await expect(page.locator('#searchInput')).toBeFocused();
    await expect(page.locator('#electionList article').first()).toBeVisible();

    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expectNoOverflow(page);
    expect(errors).toEqual([]);
  });

  test('Pension worksheet calculates only user-entered assumptions and validates/reset', async ({ page }) => {
    const writes = [];
    const errors = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') writes.push(request.postData() || '');
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 320, height: 840 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/national-pension/', { waitUntil: 'domcontentloaded' });

    await page.getByLabel('Official source route').selectOption('GH');
    await page.getByLabel('Monthly pensionable pay').fill('1000');
    await page.getByLabel('Employee contribution assumption (%)').fill('5');
    await page.getByLabel('Employer contribution assumption (%)').fill('5');
    await page.getByLabel('Current pension balance').fill('0');
    await page.getByLabel('Projection years').fill('1');
    await page.getByLabel('Annual net return assumption (%)').fill('0');
    await page.getByRole('button', { name: 'Calculate planning projection' }).click();

    await expect(page.locator('#projected-balance')).toContainText(/1,200/);
    await expect(page.locator('#monthly-total')).toContainText(/100/);
    await expect(page.locator('#growth-total')).toContainText(/0/);
    await expect(page.locator('#assumption-note')).toContainText('0.00% annual net return');
    await expect(page.locator('#official-link')).toHaveAttribute('href', 'https://www.ssnit.org.gh/');
    await expect(page.locator('#result')).toContainText('not a pension statement or benefit promise');

    await page.getByLabel('Monthly pensionable pay').fill('0');
    await page.getByRole('button', { name: 'Calculate planning projection' }).click();
    await expect(page.getByRole('status')).toContainText('Enter valid values');
    await expect(page.locator('#result')).not.toHaveClass(/on/);
    await expect(page.getByLabel('Monthly pensionable pay')).toBeFocused();

    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.getByLabel('Official source route')).toHaveValue('NG');
    await expect(page.getByLabel('Official source route')).toBeFocused();
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expectNoOverflow(page);
    expect(JSON.stringify(writes)).not.toMatch(/1000|Ghana|GH|employee|employer/);
    expect(errors).toEqual([]);
  });

  test('Land transfer worksheet totals user-entered quotes without inventing fees', async ({ page }) => {
    const writes = [];
    const errors = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') writes.push(request.postData() || '');
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 375, height: 840 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/land-registry-fees/', { waitUntil: 'domcontentloaded' });

    await page.getByLabel('Official source route').selectOption('KE');
    await page.getByLabel('Property value assumption').fill('1000000');
    await page.getByLabel('Transfer or stamp tax rate (%)').fill('2');
    await page.getByLabel('Registry or consent rate (%)').fill('1');
    await page.getByLabel('Professional-fee rate (%)').fill('0.5');
    await page.getByLabel('Fixed searches, filings, survey, and other quotes').fill('5000');
    await page.getByRole('button', { name: 'Calculate cost scenario' }).click();

    await expect(page.locator('#total-cost')).toContainText(/40,000/);
    await expect(page.locator('#cost-ratio')).toHaveText('4.00%');
    await expect(page.locator('#official-link')).toHaveAttribute('href', 'https://ardhisasa.lands.go.ke/');
    await expect(page.locator('#result')).toContainText('not a legal quote, tax assessment');

    await page.getByLabel('Property value assumption').fill('0');
    await page.getByRole('button', { name: 'Calculate cost scenario' }).click();
    await expect(page.getByRole('status')).toContainText('Enter a positive property value');
    await expect(page.locator('#result')).not.toHaveClass(/on/);
    await expect(page.getByLabel('Property value assumption')).toBeFocused();
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.getByLabel('Official source route')).toHaveValue('NG');
    await expect(page.getByLabel('Official source route')).toBeFocused();
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expectNoOverflow(page);
    expect(JSON.stringify(writes)).not.toMatch(/1000000|5000|Kenya|KE/);
    expect(errors).toEqual([]);
  });

  test('FOI draft validates, generates locally, and exports a parseable TXT', async ({ page }) => {
    const writes = [];
    const errors = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') writes.push(request.postData() || '');
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 320, height: 840 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/foi-template/', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Build request draft' }).click();
    await expect(page.getByRole('status')).toContainText('Enter the public body');
    await expect(page.locator('#foi-body')).toBeFocused();

    await page.locator('#foi-country').selectOption('KE');
    await page.locator('#foi-body').fill('Synthetic Transport Records Office');
    await page.locator('#foi-records').fill('Synthetic procurement register entries from January to March 2026, including contract identifiers and published award values.');
    await page.getByRole('button', { name: 'Build request draft' }).click();
    await expect(page.locator('#foi-draft')).toContainText('Synthetic procurement register entries');
    await expect(page.locator('#foi-draft')).toContainText('[Requester name]');
    await expect(page.locator('#foi-official')).toHaveAttribute('href', 'https://ombudsman.go.ke/node/267');
    await expect(page.locator('#foi-result')).not.toContainText(/within 21 days|guaranteed|must disclose/i);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    let text = '';
    for await (const chunk of stream) text += chunk.toString('utf8');
    expect(download.suggestedFilename()).toBe('public-information-request-draft.txt');
    expect(text).toContain('Synthetic Transport Records Office');
    expect(text).toContain('Please confirm receipt');
    expect(text).toContain('[Verified contact details]');

    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#foi-result')).not.toHaveClass(/gv-on/);
    await expect(page.locator('#foi-country')).toBeFocused();
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expectNoOverflow(page);
    expect(writes.every((body) => body === '')).toBe(true);
    expect(errors).toEqual([]);
  });

  test('Budget comparator calculates user-entered nominal and share changes only', async ({ page }) => {
    const writes = [];
    const errors = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') writes.push(request.postData() || '');
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 375, height: 840 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/budget-comparator/', { waitUntil: 'domcontentloaded' });

    await page.locator('#budget-country').selectOption('ZA');
    await page.locator('#budget-label').fill('Synthetic health line');
    await page.locator('#period-a').fill('Approved A');
    await page.locator('#total-a').fill('1000');
    await page.locator('#line-a').fill('100');
    await page.locator('#period-b').fill('Approved B');
    await page.locator('#total-b').fill('2000');
    await page.locator('#line-b').fill('150');
    await page.getByRole('button', { name: 'Compare budget line' }).click();
    await expect(page.locator('#budget-change')).toHaveText('+50.00% nominal line change');
    await expect(page.locator('#share-a')).toHaveText('10.00%');
    await expect(page.locator('#share-b')).toHaveText('7.50%');
    await expect(page.locator('#share-change')).toHaveText('-2.50 percentage points');
    await expect(page.locator('#budget-official')).toHaveAttribute('href', 'https://www.treasury.gov.za/documents/national%20budget/2026/default.aspx');

    await page.locator('#line-b').fill('2500');
    await page.getByRole('button', { name: 'Compare budget line' }).click();
    await expect(page.getByRole('status')).toContainText('do not exceed each total');
    await expect(page.locator('#budget-result')).not.toHaveClass(/gv-on/);
    await expect(page.locator('#total-a')).toBeFocused();
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#budget-country')).toBeFocused();
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expectNoOverflow(page);
    expect(writes.every((body) => body === '')).toBe(true);
    expect(errors).toEqual([]);
  });

  test('Kenya DPA planner reports evidence gaps without a compliance decision or export gate', async ({ page }) => {
    const writes = [];
    const errors = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') writes.push(request.postData() || '');
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 320, height: 840 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/kenya-dpa/', { waitUntil: 'domcontentloaded' });

    await page.locator('#gv-task').selectOption('breach');
    await page.locator('[name="gv-check"]').nth(0).check();
    await page.locator('[name="gv-check"]').nth(2).check();
    await page.getByRole('button', { name: 'Build evidence-gap brief' }).click();
    await expect(page.locator('#gv-gap-count')).toHaveText('3');
    await expect(page.locator('#gv-route-summary')).toContainText('Kenya - Potential incident or breach review. You marked 2 of 5');
    await expect(page.locator('#gv-official-link')).toHaveAttribute('href', 'https://www.odpc.go.ke/');
    await expect(page.locator('#gv-result')).toContainText('not legal advice, compliance certification');
    await expect(page.locator('body')).not.toContainText('Email checklist + unlock PDF');

    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#gv-result')).not.toHaveClass(/gv-on/);
    await expect(page.locator('#gv-country')).toBeFocused();
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expectNoOverflow(page);
    expect(writes.every((body) => body === '')).toBe(true);
    expect(errors).toEqual([]);
  });

  test('Work permit worksheet totals only entered quotes and exports a parseable TXT', async ({ page }) => {
    const writes = [];
    const errors = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') writes.push(request.postData() || '');
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 375, height: 840 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/work-permit-cost/', { waitUntil: 'domcontentloaded' });

    await page.locator('#permit-country').selectOption('GH');
    await expect(page.locator('#permit-currency')).toHaveValue('GHS');
    await page.locator('#main-applicants').fill('2');
    await page.locator('#dependants').fill('1');
    await page.locator('#official-main').fill('1000');
    await page.locator('#official-dependant').fill('500');
    await page.locator('#documents').fill('200');
    await page.locator('#professional').fill('300');
    await page.locator('#travel').fill('100');
    await page.locator('#other').fill('0');
    await page.locator('#contingency').fill('10');
    await page.getByRole('button', { name: 'Calculate permit-cost scenario' }).click();
    await expect(page.locator('#permit-total')).toHaveText('GHS 3,410.00');
    await expect(page.locator('#permit-main-total')).toHaveText('GHS 2,000.00');
    await expect(page.locator('#permit-contingency-total')).toHaveText('GHS 310.00');
    await expect(page.locator('#permit-official')).toHaveAttribute('href', 'https://gis.gov.gh/fees-and-charges/');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    let text = '';
    for await (const chunk of stream) text += chunk.toString('utf8');
    expect(download.suggestedFilename()).toBe('work-permit-cost-assumptions.txt');
    expect(text).toContain('Planning total: GHS 3,410.00');
    expect(text).toContain('User-entered budget only');

    await page.locator('#permit-currency').fill('G');
    await page.getByRole('button', { name: 'Calculate permit-cost scenario' }).click();
    await expect(page.getByRole('status')).toContainText('three-letter currency code');
    await expect(page.locator('#permit-result')).not.toHaveClass(/gv-on/);
    await expect(page.locator('#permit-currency')).toBeFocused();
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#permit-country')).toBeFocused();
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expectNoOverflow(page);
    expect(writes.every((body) => body === '')).toBe(true);
    expect(errors).toEqual([]);
  });

  test('Public Holidays adjunct exports only a user-confirmed parseable ICS entry', async ({ page }) => {
    const writes = [];
    const errors = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') writes.push(request.postData() || '');
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 320, height: 840 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/public-holidays/', { waitUntil: 'domcontentloaded' });

    await page.locator('#holiday-country').selectOption('NG');
    await page.locator('#holiday-name').fill('Synthetic Civic Day');
    await page.locator('#holiday-date').fill('2026-09-14');
    await page.getByRole('button', { name: 'Prepare calendar entry' }).click();
    await expect(page.getByRole('status')).toContainText('Confirm that you checked');
    await expect(page.locator('#holiday-confirmed')).toBeFocused();
    await page.locator('#holiday-confirmed').check();
    await page.getByRole('button', { name: 'Prepare calendar entry' }).click();
    await expect(page.locator('#holiday-preview')).toContainText('Synthetic Civic Day');
    await expect(page.locator('#holiday-official')).toHaveAttribute('href', 'https://interior.gov.ng/');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download ICS' }).click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    let ics = '';
    for await (const chunk of stream) ics += chunk.toString('utf8');
    expect(download.suggestedFilename()).toBe('user-confirmed-public-holiday.ics');
    expect(ics).toContain('BEGIN:VCALENDAR\r\n');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260914');
    expect(ics).toContain('DTEND;VALUE=DATE:20260915');
    expect(ics).toContain('SUMMARY:Synthetic Civic Day');
    expect(ics).toContain('X-AFROTOOLS-BOUNDARY:User-confirmed entry; not an official calendar');
    expect(ics.trim().endsWith('END:VCALENDAR')).toBe(true);

    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#holiday-result')).not.toHaveClass(/gv-on/);
    await expect(page.locator('#holiday-country')).toBeFocused();
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expectNoOverflow(page);
    expect(writes.every((body) => body === '')).toBe(true);
    expect(errors).toEqual([]);
  });
});
