const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function formHandler(outcome) {
  const root = path.resolve(__dirname, '../..');
  const sandbox = {
    exports: {}, Buffer, URLSearchParams, AbortController, setTimeout, clearTimeout, console: { warn() {} },
    process: { env: { SUPABASE_AUTH_URL: 'https://synthetic.example.invalid', SUPABASE_ANON_KEY_AUTH: 'synthetic-anon' } },
    require(name) {
      if (name === './utils/cors') return require('../../netlify/functions/utils/cors');
      if (name === './_shared/signup-email-consent') return require('../../netlify/functions/_shared/signup-email-consent');
      if (name === './_shared/email-marketing-config') return { getMarketingSupabaseConfig: () => ({ url: 'https://synthetic.example.invalid', serviceKey: '' }) };
      if (name === './_shared/lifecycle-email') return { sendLifecycleEmail: () => { throw new Error('Owned form fixture must never send email'); } };
      throw new Error('Unexpected form dependency: ' + name);
    },
    fetch: async url => {
      expect(new URL(url).hostname).toBe('synthetic.example.invalid');
      expect(new URL(url).pathname).toBe('/auth/v1/signup');
      return { status: outcome === 'error' ? 400 : 200, json: async () => outcome === 'error'
        ? { msg: 'User already registered: owned-private-provider@example.invalid <script>unsafe</script>' }
        : { user: { id: 'owned-form-fixture', email: 'owned@example.invalid', user_metadata: { name: 'Owned form' } } } };
    },
  };
  // Actual maintained server owner, with a synthetic provider boundary. This
  // does not prove an installed Function or real GoTrue/SMTP/session behavior.
  vm.runInNewContext(fs.readFileSync(path.join(root, 'netlify/functions/auth-session.js'), 'utf8'), sandbox);
  return sandbox.exports.handler;
}

// Synthetic provider responses only. No real Auth account, session or email.
async function isolate(page) {
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
    if (url.pathname === '/api/auth/session') return route.fulfill({ status: 200, contentType: 'application/json', body: '{"authenticated":false,"user":null}' });
    if (url.pathname === '/api/email/lifecycle') throw new Error('Withheld synthetic signup must never request a welcome email');
    return route.continue();
  });
  await page.addInitScript(() => {
    window.__ownedSignupPayloads = [];
    window.supabase = { createClient: () => ({ auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signUp: async payload => { window.__ownedSignupPayloads.push(payload); return { error: { message: 'Owned signup withheld' } }; },
    } }) };
  });
}
async function fillAuth(page) {
  await page.locator('#signupName').fill('Owned consent visitor');
  await page.locator('#signupEmail').fill('owned@example.invalid');
  await page.locator('#signupPassword').fill('synthetic-password');
}

test('signup defaults off and keyboard choices reach the maintained SDK explicitly', async ({ page }) => {
  await isolate(page);
  await page.goto('/auth/?mode=signup');
  await fillAuth(page);
  const digest = page.locator('#signupEmailDigest'), weekly = page.locator('#signupEmailWeekly');
  await expect(digest).not.toBeChecked();
  await expect(weekly).not.toBeChecked();
  await expect(weekly).toBeDisabled();
  await page.locator('#signupForm button[type=submit]').click();
  await expect(page.locator('#authStatus')).toHaveText('Owned signup withheld');
  expect(await page.evaluate(() => window.__ownedSignupPayloads[0].options.data)).toMatchObject({ email_digest_enabled: false, email_weekly_enabled: false });
  await digest.focus(); await page.keyboard.press('Space');
  await expect(weekly).toBeEnabled();
  await weekly.focus(); await page.keyboard.press('Space');
  await page.locator('#signupForm button[type=submit]').click();
  await expect.poll(() => page.evaluate(() => window.__ownedSignupPayloads.length)).toBe(2);
  expect(await page.evaluate(() => window.__ownedSignupPayloads[1].options.data)).toMatchObject({ email_digest_enabled: true, email_weekly_enabled: true });
  await digest.uncheck();
  await expect(weekly).not.toBeChecked(); await expect(weekly).toBeDisabled();
});

test('signup modal offers unchecked choices and forwards the fifth argument', async ({ page }) => {
  await isolate(page);
  await page.goto('/auth/?mode=signup');
  await page.addScriptTag({ url: '/assets/js/components/auth-modal.js' });
  await page.evaluate(() => window.AfroAuth.openSignup());
  await page.locator('#amName').fill('Owned modal visitor');
  await page.locator('#amEmail').fill('owned@example.invalid');
  await page.locator('#amPassword').fill('synthetic-password');
  await expect(page.locator('#amEmailDigest')).not.toBeChecked();
  await expect(page.locator('#amEmailWeekly')).toBeDisabled();
  await page.locator('#amSubmit').click();
  await expect(page.locator('#amError')).toHaveText('Owned signup withheld');
  expect(await page.evaluate(() => window.__ownedSignupPayloads[0].options.data)).toMatchObject({ email_digest_enabled: false, email_weekly_enabled: false });
  await page.locator('#amEmailDigest').focus(); await page.keyboard.press('Space');
  await page.locator('#amEmailWeekly').check();
  await page.locator('#amSubmit').click();
  await expect.poll(() => page.evaluate(() => window.__ownedSignupPayloads.length)).toBe(2);
  expect(await page.evaluate(() => window.__ownedSignupPayloads[1].options.data)).toMatchObject({ email_digest_enabled: true, email_weekly_enabled: true });
});

// Poll geometry from the Node test controller so disabled page JavaScript is
// never asked to schedule a retry timer. Keep normal pointer actionability.
async function settleNativeTarget(locator) {
  await expect(locator).toBeVisible();
  await locator.focus(); await expect(locator).toBeFocused();
  let previous = '', stable = 0;
  const observations = [];
  await expect.poll(async () => {
    const value = await locator.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height,
        scrollX, scrollY, fontStatus: document.fonts ? document.fonts.status : 'loaded' };
    });
    observations.push(value);
    const current = JSON.stringify(value);
    stable = current === previous ? stable + 1 : 0;
    previous = current;
    return value.width > 0 && value.height > 0 && value.fontStatus === 'loaded' && stable >= 3;
  }, { timeout: 7000, intervals: [100] }).toBe(true);
  await test.info().attach('native-no-js-settled-target', {
    body: Buffer.from(JSON.stringify(observations)), contentType: 'application/json',
  });
}

for (const enabled of [false, true]) test(`native no-JavaScript form carries ${enabled ? 'checked' : 'unchecked'} choices without account creation`, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: 'block' });
  const page = await context.newPage();
  const submissions = [], responses = [], handler = formHandler('confirmation');
  try {
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
      if (url.pathname === '/api/auth/signup') {
        submissions.push(route.request().postData());
        expect(route.request().headers().accept).toContain('text/html');
        const response = await handler({ httpMethod: 'POST', path: '/api/auth/signup', headers: route.request().headers(), body: route.request().postData() });
        responses.push(response);
        return route.fulfill({ status: response.statusCode, headers: response.headers, body: response.body });
      }
      return route.continue();
    });
    await page.goto(new URL('/auth/?mode=signup', baseURL).href);
    await fillAuth(page);
    if (enabled) {
      for (const id of ['#signupEmailDigest', '#signupEmailWeekly']) {
        const choice = page.locator(id);
        await settleNativeTarget(choice); await choice.check();
        await expect(choice).toBeChecked();
      }
    }
    await settleNativeTarget(page.locator('#signupForm button[type=submit]'));
    await page.locator('#signupForm button[type=submit]').click();
    await expect(page).toHaveURL(/\/auth\/\?mode=login&confirm=email&next=/);
    expect(submissions).toHaveLength(1);
    expect(responses[0].statusCode).toBe(303);
    expect(responses[0].multiValueHeaders).toBeUndefined();
    const form = new URLSearchParams(submissions[0]);
    expect(form.getAll('email_digest_enabled')).toEqual(enabled ? ['true'] : []);
    expect(form.getAll('email_weekly_enabled')).toEqual(enabled ? ['true'] : []);
  } finally { await context.close(); }
});

test('native no-JavaScript signup error displays safe feedback and a working retry link', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: 'block' });
  const page = await context.newPage(), handler = formHandler('error'), responses = [];
  try {
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
      if (url.pathname === '/api/auth/signup') {
        const response = await handler({ httpMethod: 'POST', path: '/api/auth/signup', headers: route.request().headers(), body: route.request().postData() });
        responses.push(response);
        return route.fulfill({ status: response.statusCode, headers: response.headers, body: response.body });
      }
      return route.continue();
    });
    await page.goto(new URL('/auth/?mode=signup', baseURL).href);
    await fillAuth(page);
    await settleNativeTarget(page.locator('#signupForm button[type=submit]'));
    await page.locator('#signupForm button[type=submit]').click();
    await expect(page.getByRole('heading', { name: 'We could not create your account' })).toBeVisible();
    expect(responses[0].statusCode).toBe(400);
    expect(responses[0].headers['Cache-Control']).toBe('no-store');
    expect(responses[0].multiValueHeaders).toBeUndefined();
    await expect(page.locator('body')).not.toContainText('owned-private-provider');
    await expect(page.locator('body')).not.toContainText('synthetic-password');
    await settleNativeTarget(page.getByRole('link', { name: 'Try creating your account again' }));
    await page.getByRole('link', { name: 'Try creating your account again' }).click();
    await expect(page.locator('#signupForm')).toBeVisible();
    await expect(page.locator('#signupEmail')).toHaveValue('');
  } finally { await context.close(); }
});
