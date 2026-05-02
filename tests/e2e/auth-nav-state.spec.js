const { test, expect } = require('@playwright/test');

async function stubExternalAuthScripts(page) {
  await page.route('https://www.googletagmanager.com/**', async (route) => {
    await route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: '' });
  });

  await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript; charset=utf-8',
      body: `
        window.supabase = {
          createClient: function() {
            return {
              auth: {
                getSession: function() { return Promise.resolve({ data: { session: null } }); },
                onAuthStateChange: function() { return { data: { subscription: { unsubscribe: function() {} } } }; },
                signOut: function() { return Promise.resolve({}); }
              }
            };
          }
        };
      `,
    });
  });
}

async function stubAfroPointsProfile(page, options = {}) {
  const delay = options.delay || 0;
  await page.route('**/.netlify/functions/afropoints-profile', async (route) => {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    await route.fulfill({
      status: options.status || 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(options.body || { current_balance: 22, current_streak: 3 }),
    });
  });
}

async function stubSessionUser(page, user) {
  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(user ? { authenticated: true, user } : { authenticated: false, user: null }),
    });
  });
}

function seedAuthStorage({ user, token }) {
  localStorage.setItem('afro_auth_v2', JSON.stringify(user));
  if (token) localStorage.setItem('afro_session_v3', token);
}

test('stale browser auth clears navbar avatar and AfroPoints badge when server session rejects it', async ({ page }) => {
  await stubExternalAuthScripts(page);
  await stubAfroPointsProfile(page, { delay: 150 });
  await page.addInitScript(seedAuthStorage, {
    user: {
      id: 'stale-user',
      email: 'stale@afrotools.test',
      name: 'Stale User',
    },
    token: 'expired-browser-token',
  });

  await page.goto('/auth/?mode=login&next=/dashboard/', { waitUntil: 'domcontentloaded' });

  await expect.poll(() => page.evaluate(() => ({
    user: localStorage.getItem('afro_auth_v2'),
    token: localStorage.getItem('afro_session_v3'),
  }))).toEqual({ user: null, token: null });
  await expect(page.locator('afro-navbar').locator('.ap-nav-badge')).toHaveCount(0);
  await expect(page.locator('afro-navbar').locator('.btn-login')).toContainText(/sign in/i);
});

test('dashboard signed-out event removes an already-rendered AfroPoints navbar badge', async ({ page }) => {
  await stubExternalAuthScripts(page);
  await stubAfroPointsProfile(page);
  await page.addInitScript(seedAuthStorage, {
    user: {
      id: 'test-user-1',
      email: 'tester@afrotools.com',
      name: 'Test User',
    },
    token: 'valid-browser-token',
  });

  await page.goto('/auth/?mode=login&next=/dashboard/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('afro-navbar').locator('.ap-nav-badge')).toHaveCount(1);
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('dashboard-auth-state-change', {
      detail: { state: 'signedOut', previousState: 'signedIn' },
    }));
  });
  await expect(page.locator('afro-navbar').locator('.ap-nav-badge')).toHaveCount(0);
  await expect(page.locator('afro-navbar').locator('.btn-login')).toContainText(/sign in/i);
  await expect(page.locator('afro-navbar').locator('.btn-login')).not.toContainText(/test user/i);
});

test('signed-out navbar shows Pro access without stale account UI', async ({ page }) => {
  await stubExternalAuthScripts(page);
  await stubSessionUser(page, null);

  await page.goto('/auth/?mode=login&next=/dashboard/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('afro-navbar').locator('.btn-pro')).toHaveText('Pro');
  await expect(page.locator('afro-navbar').locator('.btn-pro')).toHaveAttribute('href', '/pro/');
  await expect(page.locator('afro-navbar').locator('.ap-nav-badge')).toHaveCount(0);
  await expect(page.locator('afro-navbar').locator('.btn-login')).toContainText(/sign in/i);
});

test('signed-in free users see an Upgrade Pro navbar entry', async ({ page }) => {
  const user = {
    id: 'free-user',
    email: 'free@afrotools.test',
    name: 'Free User',
    tier: 'free',
  };
  await stubExternalAuthScripts(page);
  await stubSessionUser(page, user);
  await stubAfroPointsProfile(page);
  await page.addInitScript(seedAuthStorage, { user, token: 'valid-browser-token' });

  await page.goto('/auth/?mode=login&next=/dashboard/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('afro-navbar').locator('.btn-pro')).toHaveText(/upgrade pro/i);
  await expect(page.locator('afro-navbar').locator('.btn-pro')).toHaveAttribute('href', '/pro/');
  await expect(page.locator('afro-navbar').locator('.btn-login')).toContainText(/free/i);
});

test('signed-in Pro users get a direct Pro Workspace navbar entry', async ({ page }) => {
  const user = {
    id: 'pro-user',
    email: 'pro@afrotools.test',
    name: 'Pro User',
    tier: 'pro',
  };
  await stubExternalAuthScripts(page);
  await stubSessionUser(page, user);
  await stubAfroPointsProfile(page);
  await page.addInitScript(seedAuthStorage, { user, token: 'valid-browser-token' });

  await page.goto('/auth/?mode=login&next=/dashboard/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('afro-navbar').locator('.btn-pro')).toHaveText(/pro workspace/i);
  await expect(page.locator('afro-navbar').locator('.btn-pro')).toHaveAttribute('href', '/pro/workspace/');
  await expect(page.locator('afro-navbar').locator('.btn-login')).toContainText(/pro/i);
});
