const { test, expect } = require('@playwright/test');

const oauthUser = {
  id: 'oauth-user-1',
  email: 'oauth@afrotools.test',
  name: 'OAuth User',
  country: 'NG',
  tier: 'pro',
  subscription_tier: 'pro',
  createdAt: '2026-01-01T00:00:00.000Z',
};

async function stubOAuthCallback(page) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());

    if (url.hostname === 'www.googletagmanager.com') {
      await route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: '' });
      return;
    }

    if (url.hostname === 'fonts.googleapis.com') {
      await route.fulfill({ contentType: 'text/css; charset=utf-8', body: '' });
      return;
    }

    if (url.hostname === 'fonts.gstatic.com') {
      await route.abort();
      return;
    }

    if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('/supabase-js@2/')) {
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

    if (url.hostname === '127.0.0.1' && url.pathname === '/api/auth/session') {
      const authHeader = route.request().headers().authorization || '';
      if (authHeader === 'Bearer oauth-browser-token') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json; charset=utf-8',
          body: JSON.stringify({ authenticated: true, user: oauthUser }),
        });
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 180));
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ authenticated: false, user: null }),
      });
      return;
    }

    if (url.hostname === '127.0.0.1' && url.pathname.endsWith('.js')) {
      if (url.pathname === '/assets/js/auth-cookie-upgrade.js') {
        await route.continue();
        return;
      }

      if (url.pathname === '/assets/js/data/african-countries.js') {
        await route.fulfill({
          contentType: 'application/javascript; charset=utf-8',
          body: "window.AFRICAN_COUNTRIES = [{ code: 'NG', name: 'Nigeria', flag: 'NG' }];",
        });
        return;
      }

      if (url.pathname === '/assets/js/afro-auth.js') {
        await route.fulfill({
          contentType: 'application/javascript; charset=utf-8',
          body: `
            (function(window) {
              var user = ${JSON.stringify(oauthUser)};
              function readUser() {
                try { return JSON.parse(localStorage.getItem('afro_auth_v2') || 'null'); } catch(e) { return null; }
              }
              window.AfroAuth = {
                onReady: function(cb) { setTimeout(cb, 0); },
                isLoggedIn: function() {
                  var current = readUser();
                  return !!(current && current.id && current.email);
                },
                getUser: readUser,
                getSessionToken: function() { return localStorage.getItem('afro_session_v3') || null; },
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
              setTimeout(function() {
                localStorage.setItem('afro_auth_v2', JSON.stringify(user));
                localStorage.setItem('afro_session_v3', 'oauth-browser-token');
                window.dispatchEvent(new CustomEvent('afro-auth-change', {
                  detail: { user: user, authenticated: true, reason: 'oauth-callback' }
                }));
              }, 80);
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
        body: stubs[url.pathname] || '',
      });
      return;
    }

    await route.continue();
  });
}

test('dashboard OAuth callback waits for browser token before clearing session state', async ({ page }) => {
  await stubOAuthCallback(page);
  await page.goto('/dashboard/?auth=callback#access_token=fake-oauth-token', { waitUntil: 'commit' });

  await expect(page.locator('html')).toHaveAttribute('data-dashboard-auth-state', 'signedIn', { timeout: 15000 });
  await expect(page.locator('#dashboardSection')).toBeVisible();
  await expect(page.locator('#profileEmail')).toHaveText('oauth@afrotools.test');
  await expect(page).toHaveURL('http://127.0.0.1:4173/dashboard/');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afro_session_v3'))).toBe('oauth-browser-token');
});
