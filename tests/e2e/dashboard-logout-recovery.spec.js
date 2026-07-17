const { test, expect } = require('@playwright/test');

const TEST_USER = {
  id: 'logout-recovery-user',
  email: 'logout-recovery@afrotools.test',
  name: 'Logout Recovery',
  country: 'NG',
  tier: 'free',
  createdAt: '2026-01-01T00:00:00.000Z'
};

async function stubDashboardAuth(page) {
  let signedOut = false;

  await page.addInitScript(function(user) {
    localStorage.setItem('afro_auth_v2', JSON.stringify(user));
  }, TEST_USER);

  await page.route('**/*', async function(route) {
    const url = new URL(route.request().url());

    if (url.hostname === 'www.googletagmanager.com') {
      return route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: '' });
    }
    if (url.hostname === 'fonts.googleapis.com') {
      return route.fulfill({ contentType: 'text/css; charset=utf-8', body: '' });
    }
    if (url.hostname === 'fonts.gstatic.com') return route.abort();

    if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('/supabase-js@2/')) {
      return route.fulfill({
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
                    upsert: function() {
                      return { select: function() { return { single: function() { return Promise.resolve({ data: null, error: null }); } }; } };
                    }
                  };
                }
              };
            }
          };
        `
      });
    }

    if (url.pathname === '/assets/js/afro-auth.js') {
      return route.fulfill({
        contentType: 'application/javascript; charset=utf-8',
        body: `
          (function(window) {
            if (window._afroAuthLoaded) { return; }
            window._afroAuthLoaded = true;
            function readUser() {
              try { return JSON.parse(localStorage.getItem('afro_auth_v2') || 'null'); } catch(e) { return null; }
            }
            window.AfroAuth = {
              onReady: function(cb) { setTimeout(cb, 0); },
              isLoggedIn: function() { var user = readUser(); return !!(user && user.id && user.email); },
              getUser: readUser,
              getSessionToken: function() { return null; },
              getSupabase: function() { return window.supabase && window.supabase.createClient ? window.supabase.createClient('', '') : null; },
              logout: function() {
                localStorage.removeItem('afro_auth_v2');
                localStorage.removeItem('afro_session_v3');
                window.dispatchEvent(new CustomEvent('afro-auth-change', { detail: { user: null, authenticated: false } }));
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
        `
      });
    }

    if (url.pathname === '/api/auth/session') {
      return route.fulfill({
        status: signedOut ? 401 : 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(signedOut ? { authenticated: false, user: null } : { authenticated: true, user: TEST_USER })
      });
    }

    if (url.pathname === '/api/auth/logout') {
      signedOut = true;
      return route.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: JSON.stringify({ ok: true }) });
    }

    if (url.pathname.startsWith('/api/')) {
      return route.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: JSON.stringify({ ok: true, data: [] }) });
    }

    return route.continue();
  });
}

test('dashboard logout recovers if signed-in panels are already missing', async ({ page }) => {
  await stubDashboardAuth(page);
  await page.goto('/dashboard/', { waitUntil: 'commit' });

  await expect(page.locator('html')).toHaveAttribute('data-dashboard-auth-state', 'signedIn', { timeout: 15000 });
  await expect(page.locator('#dashboardSection')).toBeVisible();
  await expect(page.locator('#logoutBtn')).toHaveText(/sign out/i);
  await expect.poll(function() {
    return page.evaluate(function() {
      return Boolean(window.AfroAuth && window.AfroAuth._cookiePatched);
    });
  }).toBe(true);

  await page.evaluate(function() {
    const editor = document.getElementById('profileEditor');
    if (editor) editor.remove();
  });

  await page.locator('#logoutBtn').click();
  await expect(page.locator('html')).toHaveAttribute('data-dashboard-auth-state', 'signedOut', { timeout: 15000 });
  await expect(page.locator('#authSection')).toBeVisible();
  await expect.poll(function() {
    return page.locator('#logoutBtn').textContent().catch(function() { return ''; });
  }).not.toMatch(/signing out/i);
});
