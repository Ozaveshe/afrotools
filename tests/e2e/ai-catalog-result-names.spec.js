const { test, expect } = require('@playwright/test');

async function privateLocal(page, baseURL, theme = 'dark') {
  await page.addInitScript(theme => {
    localStorage.setItem('aft_theme', theme);
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    localStorage.removeItem('afrotools.aiAdvisorConsent');
    localStorage.removeItem('afrotools_ai_advisor_consent');
  }, theme);
  const observations = {router: [], provider: [], errors: []};
  page.on('pageerror', error => observations.errors.push(error.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (/openai\.com|anthropic\.com|ai-advisor/.test(url.href)) observations.provider.push(url.pathname);
    if (url.origin === new URL(baseURL).origin) return route.continue();
    if (url.hostname === 'fonts.googleapis.com') return route.fulfill({contentType:'text/css', body:''});
    if (url.hostname === 'www.googletagmanager.com') return route.fulfill({contentType:'application/javascript', body:''});
    return route.abort();
  });
  return observations;
}

for (const theme of ['light', 'dark']) {
  test('homepage local recovery preserves canonical Nigeria VAT name in ' + theme, async ({page, baseURL}, testInfo) => {
    await page.setViewportSize({width:390, height:844});
    const observations = await privateLocal(page, baseURL, theme);
    await page.route('**/.netlify/functions/ai-route-intent', route => {
      observations.router.push(route.request().postDataJSON());
      return route.fulfill({status:502, contentType:'application/json', body:'{"error":"Synthetic router unavailable"}'});
    });
    await page.goto('/', {waitUntil:'domcontentloaded'});
    await page.locator('#hero-search-input').fill('Find a Nigeria VAT calculator');
    await page.locator('#hero-search-btn').click();
    await expect(page).toHaveURL(/\/ai\/\?source=homepage_input$/);
    const result = page.locator('[data-workflow-card][data-tool-id="ng-vat"]');
    await expect(result.locator('h3')).toHaveText('Nigeria VAT Calculator');
    await expect(result).not.toContainText('Ng Vat');
    await expect(result.locator('[data-open-tool]')).toHaveAttribute('href', '/nigeria/ng-vat?source=ask&prefill=1');
    await expect(page.locator('#aiModelStatus')).toContainText('browser match');
    expect(observations.router.every(body => body.consentToModel === false)).toBe(true);
    expect(observations.provider).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await result.screenshot({path:testInfo.outputPath('canonical-result-name.png')});
    await result.locator('[data-open-tool]').click();
    await expect(page).toHaveURL(/\/nigeria\/ng-vat\/?\?source=ask&prefill=1$/);
    await expect(page.locator('h1').first()).toHaveText('Know the VAT.Keep the invoice clear.');
    await expect(page.locator('#calculator')).toBeVisible();
  });
}

test('server result uses matching canonical tool-call title safely', async ({page, baseURL}) => {
  const observations = await privateLocal(page, baseURL);
  await page.route('**/.netlify/functions/ai-route-intent', route => route.fulfill({
    contentType:'application/json',
    body:JSON.stringify({ok:true, source:'deterministic', decision:{
      selectedToolId:'ng-vat', selectedRoute:'/nigeria/ng-vat', confidence:0.91,
      extractedInputs:{country:'Nigeria'}, missingInputs:[], safetyDomain:'tax',
      privacyMode:'browser_local', canPrefill:false
    }, toolCall:{type:'existing_tool_call', toolId:'ng-vat', title:'Nigeria VAT Calculator',
      route:'/nigeria/ng-vat', canPrefill:false, privacyMode:'browser_local', safetyDomain:'tax'}})
  }));
  await page.goto('/ai/', {waitUntil:'domcontentloaded'});
  await page.locator('#aiCommandInput').fill('Find a Nigeria VAT calculator');
  await page.locator('#aiCommandForm button[type="submit"]').click();
  const result = page.locator('[data-workflow-card][data-tool-id="ng-vat"]');
  await expect(result.locator('h3')).toHaveText('Nigeria VAT Calculator');
  await expect(result.locator('[data-open-tool]')).toHaveAttribute('href', '/nigeria/ng-vat?source=ask&prefill=1');
  expect(observations.provider).toEqual([]);
});

test('a nonmanual Ghana country tool preserves its catalog name', async ({page, baseURL}) => {
  const observations = await privateLocal(page, baseURL);
  await page.route('**/.netlify/functions/ai-route-intent', route => route.fulfill({
    contentType:'application/json',
    body:JSON.stringify({ok:true, source:'deterministic', decision:{
      selectedToolId:'gh-vat', selectedRoute:'/ghana/gh-vat', confidence:0.91,
      extractedInputs:{country:'Ghana'}, missingInputs:[], safetyDomain:'tax',
      privacyMode:'browser_local', canPrefill:false
    }, toolCall:{type:'existing_tool_call', toolId:'gh-vat', title:'Ghana VAT Calculator',
      route:'/ghana/gh-vat', canPrefill:false, privacyMode:'browser_local', safetyDomain:'tax'}})
  }));
  await page.goto('/ai/', {waitUntil:'domcontentloaded'});
  await page.locator('#aiCommandInput').fill('Find a Ghana VAT calculator');
  await page.locator('#aiCommandForm button[type="submit"]').click();
  const result = page.locator('[data-workflow-card][data-tool-id="gh-vat"]');
  await expect(result.locator('h3')).toHaveText('Ghana VAT Calculator');
  await expect(result.locator('[data-open-tool]')).toHaveAttribute('href', '/ghana/gh-vat?source=ask&prefill=1');
  expect(observations.provider).toEqual([]);
});

for (const metadata of [
  {toolId:'ng-vat', title:'<img src=x onerror="window.__titleExecuted=true">'},
  {toolId:'unrelated-tool', title:'Wrong Tool'}
]) {
  test('canonical metadata ignores unsafe or mismatched supplied title ' + metadata.toolId, async ({page, baseURL}) => {
    const observations = await privateLocal(page, baseURL);
    await page.route('**/.netlify/functions/ai-route-intent', route => route.fulfill({
      contentType:'application/json',
      body:JSON.stringify({ok:true, source:'deterministic', decision:{
        selectedToolId:'ng-vat', selectedRoute:'/nigeria/ng-vat', confidence:0.91,
        extractedInputs:{country:'Nigeria'}, missingInputs:[], safetyDomain:'tax',
        privacyMode:'browser_local', canPrefill:false
      }, toolCall:{type:'existing_tool_call', ...metadata, route:'/nigeria/ng-vat',
        canPrefill:false, privacyMode:'browser_local', safetyDomain:'tax'}})
    }));
    await page.goto('/ai/', {waitUntil:'domcontentloaded'});
    await page.locator('#aiCommandInput').fill('Find a Nigeria VAT calculator');
    await page.waitForFunction(() => Array.isArray(window.AFROTOOLS_TOOL_DIRECTORY));
    await page.locator('#aiCommandForm button[type="submit"]').click();
    const result = page.locator('[data-workflow-card][data-tool-id="ng-vat"]');
    await expect(result.locator('h3')).toHaveText('Nigeria VAT Calculator');
    await expect(result.locator('h3 img')).toHaveCount(0);
    expect(await page.evaluate(() => window.__titleExecuted === true)).toBe(false);
    expect(observations.provider).toEqual([]);
  });
}


