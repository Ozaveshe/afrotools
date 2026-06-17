const { test, expect } = require('@playwright/test');

const NOW = '2026-05-19T00:00:00.000Z';
const LOCAL_HOSTS = new Set(['127.0.0.1:4173', 'localhost:4173']);
const FATAL_PATTERNS = [
  /\bUncaught\b/i,
  /\bReferenceError\b/i,
  /\bTypeError\b/i,
  /\bSyntaxError\b/i,
  /\bfatal\b/i
];

function installFatalConsoleGuard(page) {
  const fatal = [];
  page.on('console', function (message) {
    const text = message.text();
    if (message.type() === 'error' && FATAL_PATTERNS.some(function (pattern) { return pattern.test(text); })) {
      fatal.push(text);
    }
  });
  page.on('pageerror', function (error) {
    fatal.push(error && error.message ? error.message : String(error));
  });
  return fatal;
}

async function installSmokeNetwork(page) {
  await page.route('**/*', async function (route) {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === '/api/scholarships') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          scholarships: [
            {
              id: 'smoke-chevening',
              slug: 'smoke-chevening',
              name: 'Chevening Smoke Scholarship',
              title: 'Chevening Smoke Scholarship',
              provider: 'Chevening',
              application_url: 'https://www.chevening.org/scholarships/',
              info_url: 'https://www.chevening.org/scholarships/',
              source_url: 'https://www.chevening.org/scholarships/',
              official_url: 'https://www.chevening.org/scholarships/',
              source_type: 'official_page',
              confidence_mode: 'live',
              status: 'open',
              levels: ['masters'],
              study_levels: ['masters'],
              destinations: ['uk'],
              destination_countries: ['GB'],
              fields: ['any'],
              funding: 'full',
              funding_type: 'full',
              description: 'Deterministic smoke fixture for the Scholarship Finder browser test.',
              summary: 'Deterministic smoke fixture for the Scholarship Finder browser test.',
              deadline_text: 'Check official page',
              last_seen_at: NOW,
              last_verified_at: NOW
            }
          ],
          meta: {
            mode: 'live',
            label: 'Live feed',
            message: 'Live scholarship feed refreshed for browser smoke.',
            count: 1,
            claimSafeLabel: '1 Scholarship',
            isDegraded: false,
            isLimited: true
          },
          summary: {
            total: 1,
            live: 1,
            curated: 0,
            cached: 0,
            fallback: 0,
            open: 1,
            upcoming: 0,
            unclear: 0,
            closed: 0,
            officialLink: 1,
            withDeadlineDate: 0,
            claimSafeLabel: '1 Scholarship',
            isLimited: true
          }
        })
      });
      return;
    }

    if (url.pathname === '/api/data-freshness') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          ok: true,
          checked_at: NOW,
          categories: {
            fuel: { status: 'ok', count: 54, latest_at: NOW },
            scholarships: { status: 'limited', count: 1, latest_at: NOW }
          },
          watchdog: { ok: true, checked_at: NOW, stale: [], degraded: [], failures: [], warnings: [] }
        })
      });
      return;
    }

    if (url.pathname === '/api/fuel') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          updated: NOW,
          countries: [
            {
              code: 'NG',
              petrol: { usd: 0.42, price: 680, unit: 'liter', change_pct: 0 },
              diesel: { usd: 1.05, price: 1680, unit: 'liter', change_pct: 0 },
              lpg: { usd: 0.85, price: 1360, unit: 'kg', change_pct: 0 }
            },
            {
              code: 'KE',
              petrol: { usd: 1.3, price: 170, unit: 'liter', change_pct: 0 },
              diesel: { usd: 1.2, price: 155, unit: 'liter', change_pct: 0 },
              lpg: { usd: 1.02, price: 135, unit: 'kg', change_pct: 0 }
            }
          ]
        })
      });
      return;
    }

    if (url.pathname === '/data/forex/latest.json') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ base: 'USD', updated: NOW, rates: { NGN: 1600, KES: 130, GHS: 15 } })
      });
      return;
    }

    if (!LOCAL_HOSTS.has(url.host)) {
      await route.fulfill({
        status: 204,
        contentType: 'text/plain; charset=utf-8',
        body: ''
      });
      return;
    }

    await route.continue();
  });
}

test('Scholarship Finder loads with deterministic API feed', async ({ page }) => {
  const fatal = installFatalConsoleGuard(page);
  await installSmokeNetwork(page);

  await page.goto('/tools/scholarship-finder/', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: /Find scholarships open to African students/i })).toBeVisible();
  await expect(page.locator('#scholarshipGrid')).toBeVisible();
  await expect.poll(function () { return page.locator('#scholarshipGrid article').count(); }).toBeGreaterThan(0);
  await expect(page.locator('#feedStatus')).toContainText(/scholarship|feed|source|loaded|cached|fallback/i, { timeout: 10000 });
  expect(fatal).toEqual([]);
});

test('data freshness API route loads as JSON', async ({ page }) => {
  const fatal = installFatalConsoleGuard(page);
  await installSmokeNetwork(page);

  await page.goto('/api/data-freshness', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('body')).toContainText('"ok":true');
  await expect(page.locator('body')).toContainText('"fuel"');
  expect(fatal).toEqual([]);
});

test('high-risk fuel live-data page loads without fatal browser errors', async ({ page }) => {
  const fatal = installFatalConsoleGuard(page);
  await installSmokeNetwork(page);

  await page.goto('/tools/fuel-tracker/', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: /African fuel prices, generator costs, and country comparisons/i })).toBeVisible();
  await expect(page.locator('#selected-country-meta')).toContainText(/Updated|Prices vary/i, { timeout: 12000 });
  await expect.poll(function () { return page.locator('#price-table-body tr').count(); }).toBeGreaterThan(0);
  expect(fatal).toEqual([]);
});
