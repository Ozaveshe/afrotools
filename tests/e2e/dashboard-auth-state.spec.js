const { test, expect } = require('@playwright/test');

test.describe.configure({ mode: 'serial' });

const sessionCookie = (value) => ({
  name: 'afrotools_test_session',
  value,
  url: 'http://127.0.0.1:4173/',
});

async function stubDashboardDependencies(page) {
  await page.route('**/*', async (route) => {
    const requestUrl = new URL(route.request().url());

    if (requestUrl.hostname === 'www.googletagmanager.com') {
      await route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: '' });
      return;
    }

    if (requestUrl.hostname === 'cdn.jsdelivr.net' && requestUrl.pathname.includes('/supabase-js@2/')) {
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
              },
              from: function() {
                return {
                  select: function() { return this; },
                  eq: function() { return this; },
                  single: function() { return Promise.resolve({ data: null, error: null }); },
                  upsert: function() { return { select: function() { return { single: function() { return Promise.resolve({ data: null, error: null }); } }; } }; }
                };
              }
            };
          }
        };
      `,
      });
      return;
    }

    if (requestUrl.hostname === '127.0.0.1' && requestUrl.pathname.endsWith('.js')) {
      if (requestUrl.pathname === '/assets/js/data/african-countries.js') {
        await route.fulfill({
          contentType: 'application/javascript; charset=utf-8',
          body: `window.AFRICAN_COUNTRIES = [{ code: 'NG', name: 'Nigeria', flag: 'NG' }];`,
        });
        return;
      }

      if (requestUrl.pathname === '/assets/js/afro-auth.js') {
        await route.fulfill({
          contentType: 'application/javascript; charset=utf-8',
          body: `
            (function(window) {
              function readUser() {
                try { return JSON.parse(localStorage.getItem('afro_auth_v2') || 'null'); } catch(e) { return null; }
              }
              window.AfroAuth = {
                onReady: function(cb) { setTimeout(cb, 0); },
                isLoggedIn: function() { var user = readUser(); return !!(user && user.id && user.email); },
                getUser: readUser,
                getSessionToken: function() { return null; },
                getSupabase: function() {
                  return {
                    from: function() {
                      return {
                        select: function() { return this; },
                        eq: function() { return this; },
                        single: function() { return Promise.resolve({ data: null, error: null }); },
                        upsert: function() { return { select: function() { return { single: function() { return Promise.resolve({ data: null, error: null }); } }; } }; }
                      };
                    }
                  };
                },
                logout: function() {
                  localStorage.removeItem('afro_auth_v2');
                  window.dispatchEvent(new CustomEvent('afro-auth-change', { detail: { user: null } }));
                }
              };
              window.AfroData = {
                getFavorites: function() { return []; },
                getRecentTools: function() { return []; },
                getAllSaved: function() { return {}; },
                getUsageStats: function() { return { totalUses: 0, toolCounts: {}, categoryCounts: {} }; }
              };
            })(window);
          `,
        });
        return;
      }

      const stubs = {
        '/assets/js/components/tool-registry.min.js': 'window.AFRO_TOOLS = [];',
        '/dashboard/dashboard-app.js': 'window.DashboardApp = { init: function() {} };',
        '/dashboard/afropoints-lane-account.js': 'window.DashboardAfroPointsLane = { refresh: function() {} };',
      };
      await route.fulfill({
        contentType: 'application/javascript; charset=utf-8',
        body: stubs[requestUrl.pathname] || '',
      });
      return;
    }

    await route.continue();
  });
}

test('dashboard no-session state shows sign-in CTAs and hides account UI', async ({ page }) => {
  await stubDashboardDependencies(page);
  await page.goto('/dashboard/', { waitUntil: 'commit' });

  await expect(page.locator('html')).toHaveAttribute('data-dashboard-auth-state', 'signedOut', { timeout: 15000 });
  await expect(page.getByRole('heading', { name: /sign in to your dashboard/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /sign in to get started/i })).toHaveAttribute('href', '/auth/?mode=login&next=/dashboard/');
  await expect(page.getByRole('link', { name: /create a free account/i })).toHaveAttribute('href', '/auth/?mode=signup&next=/dashboard/');
  await expect(page.locator('#dashboardSection')).toBeHidden();
  const accountUiHidden = await page.evaluate(() => {
    const dashboard = document.querySelector('#dashboardSection');
    const profileEditor = document.querySelector('#profileEditor');
    const emailField = document.querySelector('#editEmail');
    return !!(dashboard && dashboard.hidden && profileEditor && emailField && profileEditor.closest('#dashboardSection') === dashboard && emailField.closest('#dashboardSection') === dashboard);
  });
  expect(accountUiHidden).toBe(true);
});

test('dashboard valid session reveals authenticated profile UI', async ({ page, context }) => {
  await context.addCookies([sessionCookie('valid')]);
  await stubDashboardDependencies(page);

  await page.goto('/dashboard/', { waitUntil: 'commit' });

  await expect(page.locator('html')).toHaveAttribute('data-dashboard-auth-state', 'signedIn', { timeout: 15000 });
  await expect(page.locator('#dashboardSection')).toBeVisible();
  await expect(page.locator('#authSection')).toBeHidden();
  await expect(page.locator('#profileEmail')).toHaveText('tester@afrotools.com');

  await page.locator('#editProfileBtn').click();
  await expect(page.locator('#profileEditor')).toBeVisible();
  await expect(page.locator('#editEmail')).toHaveValue('tester@afrotools.com');

  const events = await page.evaluate(() => (window.dataLayer || []).filter((item) => Array.isArray(item) && item[0] === 'event' && item[1] === 'dashboard_auth_state'));
  expect(events.length).toBeGreaterThan(0);
  for (const event of events) {
    const payload = event[2] || {};
    expect(JSON.stringify(payload)).not.toContain('tester@afrotools.com');
    expect(JSON.stringify(payload)).not.toContain('Test User');
  }
});

test('dashboard expired session shows explicit session error and keeps account UI hidden', async ({ page, context }) => {
  await context.addCookies([sessionCookie('expired')]);
  await stubDashboardDependencies(page);

  await page.goto('/dashboard/', { waitUntil: 'commit' });

  await expect(page.locator('html')).toHaveAttribute('data-dashboard-auth-state', 'sessionError', { timeout: 15000 });
  await expect(page.getByRole('heading', { name: /sign in to your dashboard/i })).toBeVisible();
  await expect(page.locator('#authStateError')).toContainText(/expired|sign in again|could not be verified/i);
  await expect(page.getByRole('link', { name: /sign in to get started/i })).toBeVisible();
  await expect(page.locator('#dashboardSection')).toBeHidden();
  const accountUiHidden = await page.evaluate(() => {
    const dashboard = document.querySelector('#dashboardSection');
    const profileEditor = document.querySelector('#profileEditor');
    const passwordField = document.querySelector('#editCurrentPassword');
    return !!(dashboard && dashboard.hidden && profileEditor && passwordField && profileEditor.closest('#dashboardSection') === dashboard && passwordField.closest('#dashboardSection') === dashboard);
  });
  expect(accountUiHidden).toBe(true);
});
