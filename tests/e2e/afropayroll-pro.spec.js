const { test, expect } = require("@playwright/test");

const DESKTOP = { name: "desktop", width: 1366, height: 900 };
const MOBILE = { name: "mobile", width: 390, height: 844 };
const VIEWPORTS = [DESKTOP, MOBILE];

const PUBLIC_ROUTES = [
  { label: "public hub", path: "/tools/afropayroll-os/", marker: "Start payroll run" },
  { label: "guided flow", path: "/tools/afropayroll-os/flow.html", marker: "#apo-start-btn" },
];

const ROUTES = [
  { label: "dashboard", path: "/pro/apps/payroll/", button: "#syncDraftBtn" },
  { label: "workspace", path: "/tools/afropayroll-os/workspace.html", button: "#addRowBtn" },
  { label: "employee portal", path: "/tools/afropayroll-os/employee.html", button: "#loadPortalBtn" },
  { label: "support console", path: "/tools/afropayroll-os/support.html", button: "#apsDownloadJson" },
];

const REQUIRED_LABELS = [
  /Save run to account/i,
  /Saved-to-account Pro/i,
  /Saved payroll runs/i,
  /Employee records/i,
  /Import payroll(?: data)?|Import file/i,
  /Approval history/i,
  /Review pack/i,
  /Payroll source freshness/i,
  /Minimum wage/i,
  /Social security/i,
  /Payment file draft/i,
  /Accounting journal/i,
  /Secure invite link/i,
];

const INTERNAL_WORDING = [
  /Supabase actions/i,
  /account-backed/i,
  /\bshell\b/i,
  /token route/i,
  /service[- ]role/i,
  /internal tool/i,
];

function fakeRun(overrides = {}) {
  return {
    id: "run_qa_may_2026",
    run_id: "run_qa_may_2026",
    title: "May 2026 payroll",
    company_name: "QA Payroll Sandbox Ltd",
    status: "draft",
    approval_status: "not_requested",
    row_count: 2,
    warning_count: 0,
    needs_review_count: 0,
    pay_period_start: "2026-05-01",
    pay_period_end: "2026-05-31",
    pay_date: "2026-05-25",
    currency_code: "NGN",
    total_gross: 125000,
    total_net: 101000,
    ...overrides,
  };
}

function fakeEmployee(overrides = {}) {
  return {
    id: "emp_qa_001",
    employee_code: "QA-EMP-001",
    full_name: "QA Test Employee",
    preferred_name: "QA",
    email: "qa.employee@example.com",
    phone: "+234000000000",
    country: "NG",
    currency: "NGN",
    department: "Operations",
    role_title: "Payroll tester",
    status: "active",
    tax_id: "QA-TAX-001",
    socialSecurityId: "QA-PEN-001",
    bankAccountOrMobile: "QA-ROUTE-001",
    payslip_email: "qa.employee@example.com",
    ...overrides,
  };
}

function dashboardPayload(scenario) {
  const runByScenario = {
    empty: [],
    saved: [fakeRun()],
    pending: [fakeRun({ status: "review", approval_status: "pending", warning_count: 1 })],
    exported: [fakeRun({ status: "exported", approval_status: "approved" })],
  };
  return {
    ok: true,
    clients: [{
      id: "client_qa_001",
      name: "QA Payroll Sandbox Ltd",
      companyName: "QA Payroll Sandbox Ltd",
      country: "NG",
      defaultCurrency: "NGN",
      payrollContact: "payroll.qa@example.com",
      reviewerEmail: "approver.qa@example.com",
      payFrequency: "monthly",
      defaultPayDay: "25",
      workingDaysPerMonth: "22",
    }],
    runs: runByScenario[scenario] || runByScenario.empty,
    employees: scenario === "empty" ? [] : [fakeEmployee()],
    audit: [],
  };
}

function fakeWorkspaceState() {
  return {
    companyName: "QA Payroll Sandbox Ltd",
    payPeriod: "2026-05",
    payDate: "2026-05-25",
    defaultCountry: "NG",
    languageLane: "en",
    runStatus: "draft",
    cloudRunId: "run_qa_may_2026",
    rows: [{
      id: "row_qa_001",
      employeeCode: "QA-EMP-001",
      name: "QA Test Employee",
      country: "NG",
      currency: "NGN",
      gross: 125000,
      allowances: 0,
      overtime: 0,
      unpaidDays: 0,
      customDeductions: 0,
    }],
    client: {
      name: "QA Payroll Sandbox Ltd",
      defaultCurrency: "NGN",
      payrollContact: "payroll.qa@example.com",
      reviewerEmail: "approver.qa@example.com",
      payFrequency: "monthly",
      defaultPayDay: "25",
      workingDaysPerMonth: "22",
      setupSavedMode: "account",
    },
  };
}

async function stubPayrollApp(page, options = {}) {
  const signedIn = options.signedIn !== false;
  const scenario = options.scenario || "empty";

  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await page.route("**/*googletagmanager.com/**", (route) => route.abort());
  await page.route("**/*google-analytics.com/**", (route) => route.abort());
  await page.route("**/assets/js/afro-auth.js*", (route) => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: `
      (function () {
        var signedIn = ${JSON.stringify(signedIn)};
        var user = signedIn ? { id: "qa-pro-user", email: "qa-payroll@example.com", tier: "pro", subscription_tier: "pro" } : null;
        window.AfroAuth = {
          onReady: function (cb) { setTimeout(function () { cb && cb(user); }, 0); },
          isLoggedIn: function () { return signedIn; },
          getUser: function () { return user; },
          getSessionToken: function () { return signedIn ? "qa-playwright-token" : ""; },
          getSupabase: function () { return null; }
        };
        window.dispatchEvent(new CustomEvent("afro-auth-change", { detail: { user: user } }));
      })();
    `,
  }));
  await page.route("**/assets/js/pro-gate.js*", (route) => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: `
      (function () {
        function unlock() {
          document.documentElement.setAttribute("data-pro-gate", "mock-pro");
          document.querySelectorAll(".pro-gated-content,[data-pro-required]").forEach(function (node) {
            node.hidden = false;
            node.style.display = "";
          });
        }
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", unlock);
        else unlock();
        window.AfroProGate = {
          refresh: unlock,
          check: function () { return Promise.resolve({ ok: true, active: true, tier: "pro" }); },
          getStatus: function () { return Promise.resolve({ ok: true, active: true, tier: "pro", plan: "Pro QA" }); }
        };
      })();
    `,
  }));
  await page.route("**/api/auth/session", (route) => route.fulfill({
    status: signedIn ? 200 : 401,
    contentType: "application/json",
    body: JSON.stringify(signedIn ? { ok: true, user: { email: "qa-payroll@example.com" } } : { error: "Sign in required" }),
  }));
  await page.route("**/api/afropayroll**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    let body = {};
    if (request.method() !== "GET") {
      try {
        body = JSON.parse(request.postData() || "{}");
      } catch (error) {
        body = {};
      }
    }
    const action = body.action || url.searchParams.get("action") || "";
    let status = 200;
    let payload = { ok: true, action };

    if (action === "dashboard") payload = dashboardPayload(scenario);
    if (action === "audit") {
      payload = {
        ok: true,
        events: [
          { action: "request_approval", summary: "Approval requested by QA payroll admin.", created_at: "2026-05-09T10:00:00Z" },
          { action: "record_export", summary: "Payment file draft and accounting journal recorded.", created_at: "2026-05-09T10:15:00Z" },
        ],
      };
    }
    if (action === "load") payload = { ok: true, workspaceState: fakeWorkspaceState() };
    if (action === "save_client") payload = { ok: true, client: { id: "client_qa_001" }, company: { id: "company_qa_001" }, workspaceState: fakeWorkspaceState() };
    if (action === "save_run") payload = { ok: true, run: fakeRun(), workspaceState: fakeWorkspaceState() };
    if (action === "list_employees") payload = { ok: true, employees: [fakeEmployee()] };
    if (action === "save_employee") payload = { ok: true, employee: fakeEmployee(body.employee || {}) };
    if (action === "employee_portal") {
      status = 404;
      payload = { error: "Secure invite link is invalid or expired." };
    }
    if (action === "employee_confirm_profile") payload = { ok: true, confirmed: true, employee: fakeEmployee(body.profile || {}) };

    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

async function gotoRoute(page, route, viewport, options = {}) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await stubPayrollApp(page, options);
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(250);
  return response;
}

async function visibleText(page) {
  return page.locator("body").innerText({ timeout: 10000 });
}

async function expectNoInternalWording(page, context) {
  const text = await visibleText(page);
  for (const phrase of INTERNAL_WORDING) {
    expect(text, `${context} leaked ${phrase}`).not.toMatch(phrase);
  }
}

async function expectNoHorizontalOverflow(page, context) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    return Math.max(root.scrollWidth, body ? body.scrollWidth : 0) - root.clientWidth;
  });
  expect(overflow, `${context} has horizontal body overflow`).toBeLessThanOrEqual(2);
}

async function expectScrollableTablesContained(page, context) {
  const broken = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".apw-table-wrap,.apo-table-wrap,.ape-table-wrap,.aps-table-wrap"))
      .filter((wrap) => {
        const table = wrap.querySelector("table");
        if (!table || table.scrollWidth <= wrap.clientWidth + 2) return false;
        const style = window.getComputedStyle(wrap);
        return !["auto", "scroll", "overlay"].includes(style.overflowX);
      })
      .map((wrap) => wrap.className || wrap.id || wrap.tagName);
  });
  expect(broken, `${context} has wide tables outside scroll containers`).toEqual([]);
}

test.describe("AfroPayroll Pro browser regression pack", () => {
  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      test(`${route.label} renders safely on ${viewport.name}`, async ({ page }) => {
        const target = route.path.includes("employee.html")
          ? route.path + "?token=bad-token"
          : route.path;
        const response = await gotoRoute(page, target, viewport, { signedIn: true, scenario: "saved" });
        expect(response && response.status(), `${route.label} route status`).toBeLessThan(400);
        await expect(page.locator(route.button)).toBeVisible();
        await expectNoInternalWording(page, `${route.label} ${viewport.name}`);
        await expectNoHorizontalOverflow(page, `${route.label} ${viewport.name}`);
        await expectScrollableTablesContained(page, `${route.label} ${viewport.name}`);
      });
    }
  }

  for (const viewport of VIEWPORTS) {
    for (const route of PUBLIC_ROUTES) {
      test(`${route.label} public route is reachable on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(250);
        expect(response && response.status(), `${route.label} route status`).toBeLessThan(400);
        if (route.marker.startsWith("#")) {
          await expect(page.locator(route.marker)).toBeVisible();
        } else {
          await expect(page.getByText(route.marker).first()).toBeVisible();
        }
        await expectNoHorizontalOverflow(page, `${route.label} ${viewport.name}`);
      });
    }
  }

  test("public payroll hub CTA and resume card explain save source", async ({ page }) => {
    await page.setViewportSize({ width: DESKTOP.width, height: DESKTOP.height });
    await page.addInitScript(() => {
      localStorage.setItem("apo_journey_new-hire", JSON.stringify({
        country: "NG",
        currentStep: 1,
        totalSteps: 7,
        carryData: { country: "NG", salary: "125000" },
        stepStatuses: ["done", "pending", "pending", "pending", "pending", "pending", "pending"],
        updatedAt: Date.now(),
      }));
    });
    const response = await page.goto("/tools/afropayroll-os/", { waitUntil: "domcontentloaded" });
    expect(response && response.status(), "public hub route status").toBeLessThan(400);
    await expect(page.getByRole("link", { name: /Start payroll run/i })).toHaveAttribute("href", "workspace.html");
    await expect(page.getByRole("link", { name: /Plan workflow/i })).toHaveAttribute("href", "flow.html");
    await expect(page.getByRole("link", { name: /Compare workflows/i })).toHaveAttribute("href", "#apo-journeys");
    await expect(page.locator("#apo-resume-wrap")).toBeVisible();
    await expect(page.locator("#apo-resume-source")).toHaveText(/Device progress/i);
    await expect(page.locator("#apo-resume-btn")).toHaveAttribute("href", /flow\.html\?journey=new-hire&resume=1/);
    await expect(page.locator("body")).toContainText(/Saved-to-account Pro/i);
    await expect(page.locator("body")).toContainText(/does not file returns/i);
    await expectNoHorizontalOverflow(page, "public hub with resume");
  });

  test("customer-facing payroll language stays present across the product", async ({ page }) => {
    const routeTexts = [];
    for (const route of ROUTES) {
      const target = route.path.includes("employee.html")
        ? route.path + "?token=bad-token"
        : route.path;
      await gotoRoute(page, target, DESKTOP, { signedIn: true, scenario: "saved" });
      routeTexts.push(await visibleText(page));
    }
    const combined = routeTexts.join("\n");
    for (const label of REQUIRED_LABELS) {
      expect(combined, `Missing customer-facing label ${label}`).toMatch(label);
    }
    for (const phrase of INTERNAL_WORDING) {
      expect(combined, `Leaked internal wording ${phrase}`).not.toMatch(phrase);
    }
  });

  for (const scenario of ["empty", "saved", "pending", "exported"]) {
    test(`dashboard handles mocked ${scenario} account state`, async ({ page }) => {
      await gotoRoute(page, "/pro/apps/payroll/", DESKTOP, { signedIn: true, scenario });
      await expect(page.locator("#runQueue")).toBeVisible();
      await expect(page.locator("#actionRunSelect")).toBeVisible();
      if (scenario === "empty") {
        await expect(page.locator("#actionStatus")).toContainText(/No saved payroll runs|payroll draft/i);
      } else {
        await expect(page.getByText("QA Payroll Sandbox Ltd").first()).toBeVisible();
        await page.locator("#actionRunSelect").selectOption("run_qa_may_2026");
        await page.locator("#auditActionBtn").click();
        await expect(page.locator("#auditList")).toContainText(/Approval requested|Payment file draft|accounting journal/i);
      }
      if (scenario === "pending") await expect(page.locator("body")).toContainText(/pending|review/i);
      if (scenario === "exported") await expect(page.locator("body")).toContainText(/exported/i);
    });
  }

  test("workspace supports local setup, employee records, run rows, import mapper, and approval gates", async ({ page }) => {
    await gotoRoute(page, "/tools/afropayroll-os/workspace.html", DESKTOP, { signedIn: false });
    await expect(page.locator("#saveStatusDeviceText")).toContainText(/autosave|device snapshot/i);
    await expect(page.locator("#saveStatusAccountText")).toContainText(/Sign in to Pro|salary inputs and snapshots stay on this device/i);
    await expect(page.locator("#saveStatusFilingText")).toContainText(/does not file returns with authorities/i);
    await expect(page.locator("#sourceFreshnessList")).toContainText(/PAYE/i);
    await expect(page.locator("#sourceFreshnessList")).toContainText(/Minimum wage/i);
    await expect(page.locator("#sourceFreshnessList")).toContainText(/Pension/i);
    await expect(page.locator("#sourceFreshnessList")).toContainText(/Leave/i);
    await expect(page.locator("#sourceFreshnessList")).toContainText(/Social security/i);
    await expect(page.locator("#sourceFreshnessList")).toContainText(/Payslip assumptions/i);
    await expect(page.locator("#sourceFreshnessStatus")).toContainText(/No rates are changed here|official source verification/i);

    await page.locator("#companyName").fill("Regression Payroll Sandbox");
    await page.locator("#setupCurrency").fill("NGN");
    await page.locator("#setupPayrollContact").fill("payroll.qa@example.com");
    await page.locator("#setupReviewerEmail").fill("approver.qa@example.com");
    await page.locator("#setupPayFrequency").selectOption("monthly");
    await page.locator("#setupPayDay").fill("25");
    await page.locator("#setupWorkingDays").fill("22");
    await page.locator("#saveSetupBtn").click();
    await expect(page.locator("#setupStatus")).toContainText(/Saved on this device|ready/i);
    await expect(page.locator("#saveStatusDeviceText")).toContainText(/autosave|device snapshot/i);

    await expect(page.locator("#approveRunBtn")).toBeDisabled();

    await page.locator("#employeeCode").fill("QA-EMP-001");
    await page.locator("#employeeName").fill("QA Test Employee");
    await page.locator("#employeeEmail").fill("qa.employee@example.com");
    await page.locator("#employeeCurrency").fill("NGN");
    await page.locator("#employeeTaxId").fill("QA-TAX-001");
    await page.locator("#employeeSocialId").fill("QA-PEN-001");
    await page.locator("#employeeBankName").fill("QA Bank");
    await page.locator("#employeeBankAccount").fill("QA-ROUTE-001");
    await page.locator("#employeePayslipEmail").fill("qa.employee@example.com");
    await page.locator("#employeeSaveBtn").click();
    await expect(page.locator("body")).toContainText("QA Test Employee");

    await page.locator("#addRowBtn").click();
    await expect(page.locator("#runRows tr").first()).toBeVisible();

    await page.locator("#importFile").setInputFiles({
      name: "qa-payroll-import.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("employee_code,full_name,country,currency,gross_pay\nQA-EMP-002,QA Import Employee,NG,NGN,95000\n"),
    });
    await page.locator("#importRowsBtn").click();
    await expect(page.locator("#importMapper")).toBeVisible();
    await expect(page.locator("#importMapperStatus")).toContainText(/browser|mapping|row/i);
  });

  test("employee portal invalid invite uses a safe error state", async ({ page }) => {
    await gotoRoute(page, "/tools/afropayroll-os/employee.html?token=bad-token", MOBILE, { signedIn: false });
    await expect(page.locator("#portalStatus")).toContainText(/secure invite link (is invalid or expired|is not valid or has been revoked)/i);
    await expect(page.locator("#metricPayslips")).toHaveText("0");
    await expectNoInternalWording(page, "employee portal invalid token");
  });
});
