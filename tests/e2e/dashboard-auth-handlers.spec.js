const { test, expect } = require('@playwright/test');

async function stubExternalAuth(page, options = {}) {
  const logoutHits = options.logoutHits || { count: 0 };
  let serverSessionCleared = false;

  await page.route('**/*', async route => {
    const url = new URL(route.request().url());

    if (url.hostname === 'www.googletagmanager.com') {
      return route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: '' });
    }

    if (url.hostname === 'fonts.googleapis.com') {
      return route.fulfill({ contentType: 'text/css; charset=utf-8', body: '' });
    }

    if (url.hostname === 'fonts.gstatic.com') {
      return route.abort();
    }

    if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('/supabase-js@2/')) {
      return route.fulfill({
        contentType: 'application/javascript; charset=utf-8',
        body: `
          window.__resetRequests = window.__resetRequests || [];
          window.supabase = {
            createClient: function() {
              return {
                auth: {
                  getSession: function() { return Promise.resolve({ data: { session: null } }); },
                  onAuthStateChange: function() { return { data: { subscription: { unsubscribe: function() {} } } }; },
                  signOut: function() { return Promise.resolve({}); },
                  resetPasswordForEmail: function(email, options) {
                    window.__resetRequests.push({ email: email, options: options || {} });
                    return Promise.resolve({ data: {}, error: null });
                  },
                  signInWithOAuth: function() { return Promise.resolve({ data: { url: '/dashboard/?auth=callback' }, error: null }); }
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
    }

    if (url.pathname === '/assets/js/afro-auth.js') {
      return route.fulfill({
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
                return window.supabase && window.supabase.createClient ? window.supabase.createClient('', '') : null;
              },
              logout: function() {
                localStorage.removeItem('afro_auth_v2');
                localStorage.removeItem('afro_session_v3');
                window.dispatchEvent(new CustomEvent('afro-auth-change', { detail: { user: null } }));
                return Promise.resolve({ ok: true });
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
    }

    if (url.pathname === '/api/auth/session' && options.sessionUser) {
      return route.fulfill({
        status: serverSessionCleared ? 401 : 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(serverSessionCleared ? { authenticated: false, user: null } : { authenticated: true, user: options.sessionUser }),
      });
    }

    if (url.pathname === '/api/auth/logout') {
      logoutHits.count += 1;
      if (options.logoutGate && options.logoutGate.promise) {
        await options.logoutGate.promise;
      } else {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      serverSessionCleared = true;
      return route.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: JSON.stringify({ ok: true }) });
    }

    return route.continue();
  });

  return logoutHits;
}

test('dashboard signed-out auth links route to sign in, signup, and reset password', async ({ page }) => {
  await stubExternalAuth(page);
  await page.goto('/dashboard/', { waitUntil: 'commit' });

  await expect(page.locator('html')).toHaveAttribute('data-dashboard-auth-state', 'signedOut', { timeout: 15000 });
  await expect(page.getByRole('link', { name: /sign in to get started/i })).toHaveAttribute('href', '/auth/?mode=login&next=/dashboard/');
  await expect(page.getByRole('link', { name: /create a free account/i })).toHaveAttribute('href', '/auth/?mode=signup&next=/dashboard/');
  await expect(page.getByRole('link', { name: /forgot password/i })).toHaveAttribute('href', '/auth/?mode=reset&next=/dashboard/');

  await page.getByRole('link', { name: /forgot password/i }).click();
  await expect(page).toHaveURL(/\/auth\/\?mode=reset&next=%2Fdashboard%2F/);
  await expect(page.locator('#resetForm')).toBeVisible();

  await page.locator('#resetEmail').fill('reset@afrotools.test');
  await page.locator('#resetForm').getByRole('button', { name: /send reset link/i }).click();
  await expect(page.locator('#authStatus')).toHaveText(/password reset email sent/i);
  await expect
    .poll(() => page.evaluate(() => window.__resetRequests || []))
    .toEqual([
      {
        email: 'reset@afrotools.test',
        options: { redirectTo: 'http://127.0.0.1:4173/auth/?mode=login&next=%2Fdashboard%2F' },
      },
    ]);
});

test('dashboard sign out waits for the cookie-session logout endpoint', async ({ page }) => {
  const logoutHits = { count: 0 };
  const logoutGate = {};
  logoutGate.promise = new Promise(resolve => {
    logoutGate.release = resolve;
  });
  await stubExternalAuth(page, {
    logoutHits,
    logoutGate,
    sessionUser: {
      id: 'test-user-1',
      email: 'tester@afrotools.com',
      name: 'Test User',
      country: 'NG',
      tier: 'free',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  });

  await page.goto('/dashboard/', { waitUntil: 'commit' });
  await expect(page.locator('html')).toHaveAttribute('data-dashboard-auth-state', 'signedIn', { timeout: 15000 });
  await expect(page.locator('#dashboardSection')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.AfroAuth && window.AfroAuth._cookiePatched)).toBe(true);

  await page.evaluate(() => document.getElementById('logoutBtn').click());
  await expect(page.locator('#logoutBtn')).toHaveText(/signing out/i);
  await expect.poll(() => logoutHits.count).toBe(1);
  await expect(page.locator('html')).toHaveAttribute('data-dashboard-auth-state', 'signedIn');
  await expect(page.locator('#dashboardSection')).toBeVisible();
  logoutGate.release();
  await expect(page.locator('html')).toHaveAttribute('data-dashboard-auth-state', 'signedOut', { timeout: 15000 });
  await expect(page.locator('#authSection')).toBeVisible();
  await expect(page.locator('#dashboardSection')).toBeHidden();
  expect(logoutHits.count).toBe(1);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afro_auth_v2'))).toBeNull();
});
