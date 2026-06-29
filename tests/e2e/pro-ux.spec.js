const { test, expect } = require("@playwright/test");

async function stubSupabaseSdk(page) {
  await page.route("https://www.googletagmanager.com/**", async (route) => {
    await route.fulfill({ contentType: "application/javascript; charset=utf-8", body: "" });
  });

  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js", async (route) => {
    await route.fulfill({
      contentType: "application/javascript; charset=utf-8",
      body: `
        window.supabase = {
          createClient: function() {
            return {
              auth: {
                getSession: function() { return Promise.resolve({ data: { session: null } }); },
                getUser: function() { return Promise.resolve({ data: { user: null } }); },
                onAuthStateChange: function() { return { data: { subscription: { unsubscribe: function() {} } } }; },
                signOut: function() { return Promise.resolve({}); }
              },
              from: function() {
                return {
                  select: function() { return this; },
                  eq: function() { return this; },
                  single: function() { return Promise.resolve({ data: null, error: null }); }
                };
              }
            };
          }
        };
      `
    });
  });
}

async function stubProfile(page, profile) {
  await page.route("**/api/profile", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ profile })
    });
  });

  await page.route("**/api/auth/session", async (route) => {
    const auth = route.request().headers().authorization || "";
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify(auth.startsWith("Bearer ") ? { authenticated: true, user: profile } : { authenticated: false })
    });
  });
}

function seedAuth({ user, token }) {
  localStorage.setItem("afro_auth_v2", JSON.stringify(user));
  localStorage.setItem("afro_session_v3", token);
}

test("Pro page signed-out state explains account-bound checkout without test-account copy", async ({ page }) => {
  await stubSupabaseSdk(page);
  await page.goto("/pro/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#pro-account-status")).toContainText(/account needed/i);
  await expect(page.locator("#pro-account-status")).toContainText(/sign in or create/i);
  await expect(page.locator("#pro-account-status")).not.toContainText(/momohozaveshe|test account|testing account/i);
  await expect(page.locator('#pro-account-status a[href="/auth/?mode=signup&intent=pro-checkout&next=/pro/"]')).toHaveText(/create account/i);
});

test("Pro page free account state points users to plan selection", async ({ page }) => {
  const profile = { id: "free-user", email: "free@afrotools.test", name: "Free User", tier: "free" };
  await stubSupabaseSdk(page);
  await stubProfile(page, profile);
  await page.addInitScript(seedAuth, { user: profile, token: "free-token" });
  await page.goto("/pro/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#pro-account-status")).toContainText(/free account/i);
  await expect(page.locator("#pro-account-status")).toContainText(/choose a plan/i);
  await expect(page.locator('#pro-account-status a[href="#pricing"]')).toHaveText(/choose a plan/i);
});

test("Pro page active Pro state offers direct workspace access", async ({ page }) => {
  const user = { id: "pro-user", email: "pro@afrotools.test", name: "Pro User", tier: "pro" };
  const profile = { ...user, subscription_tier: "pro", subscription_expires_at: "2027-05-02T00:00:00.000Z" };
  await stubSupabaseSdk(page);
  await stubProfile(page, profile);
  await page.addInitScript(seedAuth, { user, token: "pro-token" });
  await page.goto("/pro/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#pro-account-status")).toContainText(/pro active/i);
  await expect(page.locator("#pro-account-status")).toContainText(/pro access is active/i);
  await expect(page.locator('#pro-account-status a[href="/pro/workspace/"]')).toHaveText(/open pro workspace/i);
});

test("Pro page presents sellable products without generic generated filler", async ({ page }) => {
  await stubSupabaseSdk(page);
  await page.goto("/pro/", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: /^AfroTools Pro$/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /What a Pro customer is buying/i })).toBeVisible();
  await expect(page.getByText(/Payroll month-close workspace/i)).toBeVisible();
  await expect(page.getByText(/Local previews and waitlist modules/i)).toBeVisible();
  await expect(page.getByText(/Does not file statutory returns, remit tax, or disburse salaries/i)).toBeVisible();
  await expect(page.getByText(/AfroTools Pro \(All Tools\)/i)).toHaveCount(0);
  await expect(page.getByText(/Create summary/i)).toHaveCount(0);
});
