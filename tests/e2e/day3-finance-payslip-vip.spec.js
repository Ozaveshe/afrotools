const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const routes = [
  {
    name: "en",
    path: "/tools/payslip-generator/",
    lang: "en",
    button: "Generate payslip draft",
    pdf: "Download private PDF",
    json: "Download JSON backup",
    canonical: "https://afrotools.com/tools/payslip-generator/",
    width: 320,
  },
  {
    name: "fr",
    path: "/fr/tools/generateur-fiche-paie/",
    lang: "fr",
    button: "Générer le brouillon",
    pdf: "Télécharger le PDF privé",
    json: "Télécharger la sauvegarde JSON",
    canonical: "https://afrotools.com/fr/tools/generateur-fiche-paie/",
    width: 360,
  },
  {
    name: "sw",
    path: "/sw/zana/kizalishaji-payslip/",
    lang: "sw",
    button: "Tengeneza rasimu",
    pdf: "Pakua PDF binafsi",
    json: "Pakua nakala ya JSON",
    canonical: "https://afrotools.com/sw/zana/kizalishaji-payslip/",
    width: 375,
  },
  {
    name: "ha",
    path: "/ha/kayan-aiki/takardar-albashi/",
    lang: "ha",
    button: "Ƙirƙiri daftarin albashi",
    pdf: "Sauke PDF mai sirri",
    json: "Sauke ajiyar JSON",
    canonical: "https://afrotools.com/ha/kayan-aiki/takardar-albashi/",
    width: 375,
    unicode:
      "Mayar da alkaluman payroll da aka tantance zuwa daftari mai tsabta",
  },
];
for (const route of routes)
  test(`${route.name} payslip is local, reconciled and parser-ready`, async ({
    page,
  }) => {
    const errors = [],
      nonGet = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("request", (r) => {
      if (r.method() !== "GET") nonGet.push(`${r.method()} ${r.url()}`);
    });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.setViewportSize({ width: route.width, height: 812 });
    await page.goto(route.path, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", route.lang);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      route.canonical,
    );
    expect(await page.locator('link[rel="alternate"]').count()).toBe(5);
    const visibleText = await page.locator("body").innerText();
    expect(visibleText).not.toMatch(/Ã.|Â.|â(?:€™|€”|€œ|€|™|—)|Æ(?:˜|™)|É—/u);
    if (route.unicode) expect(visibleText).toContain(route.unicode);
    expect(
      await page.evaluate(
        () =>
          Array.from(document.querySelectorAll("input,select,textarea")).filter(
            (control) =>
              !control.labels?.length &&
              !control.getAttribute("aria-label") &&
              !control.getAttribute("aria-labelledby"),
          ).length,
      ),
    ).toBe(0);
    await expect(page.locator("#status")).toHaveAttribute("aria-live", "polite");
    await page.locator("#confirmed").focus();
    const focus = await page
      .locator("#confirmed")
      .evaluate((node) => getComputedStyle(node));
    expect(focus.outlineStyle).toBe("solid");
    expect(parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(3);
    await page.evaluate(() => {
      if (!document.querySelector("afro-site-assistant"))
        document.body.appendChild(
          document.createElement("afro-site-assistant"),
        );
    });
    await expect(page.locator("afro-site-assistant")).toBeHidden();
    await page.locator("#employer").fill("Synthetic Works Ltd");
    await page.locator("#employee").fill("Sample Employee");
    await page.locator("#employeeId").fill("TEST-001");
    await page.locator("#role").fill("Test Analyst");
    await page.locator("#period").fill("July 2026");
    await page.locator("#currency").selectOption("USD");
    await page.locator("#basic").fill("100000");
    await page.locator("#housing").fill("20000");
    await page.locator("#transport").fill("10000");
    await page.locator("#overtime").fill("5000");
    await page.locator("#bonus").fill("3000");
    await page.locator("#otherEarnings").fill("2000");
    await page.locator("#reimbursement").fill("4000");
    await page.locator("#paye").fill("12000");
    await page.locator("#pension").fill("8000");
    await page.locator("#social").fill("3000");
    await page.locator("#loan").fill("2000");
    await page.locator("#otherDeductions").fill("1000");
    await page.locator("#employerContribution").fill("6000");
    await page.getByRole("button", { name: route.button }).click();
    await expect(page.locator("#status")).toHaveClass(/error/);
    await page.locator("#confirmed").check();
    await page.getByRole("button", { name: route.button }).click();
    await expect(page.locator("#outEmployer")).toHaveText(
      "Synthetic Works Ltd",
    );
    await expect(page.locator("#netResult")).toContainText(/118.?000/);
    await expect(page.locator("#grossResult")).toContainText(/140.?000/);
    await expect(page.locator("#deductionResult")).toContainText(/26.?000/);
    await expect(page.locator("#costResult")).toContainText(/150.?000/);
    const pdfWait = page.waitForEvent("download");
    await page.getByRole("button", { name: route.pdf }).click();
    const pdf = await pdfWait;
    const parsed = await pdfParse(fs.readFileSync(await pdf.path()));
    expect(parsed.text).toContain("AfroTools");
    expect(parsed.text).toContain("Synthetic Works Ltd");
    expect(parsed.text).toContain("Sample Employee");
    expect(parsed.text).toMatch(/118.?000/);
    const jsonWait = page.waitForEvent("download");
    await page.getByRole("button", { name: route.json }).click();
    const json = await jsonWait;
    const backup = JSON.parse(fs.readFileSync(await json.path(), "utf8"));
    expect(backup.format).toBe("afrotools-payslip-draft-v1");
    expect(backup.payslip.netPay).toBe(118000);
    expect(backup.payslip.employee).toBe("Sample Employee");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    expect(
      await page.evaluate(() =>
        Object.keys(localStorage).filter((k) =>
          /payslip|payroll|employee/i.test(k),
        ),
      ),
    ).toEqual([]);
    const html = await page.locator("html").evaluate((n) => n.outerHTML);
    expect(html).not.toMatch(
      /type=["']file|auto-email-gate|save-result|save-to-vault|payslip-engine|fetch\(|XMLHttpRequest|cdnjs|lazy-analytics|gtag\(|AI advisor|Batch Generate|tax optimizer/i,
    );
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `test-results/payslip-${route.name}-${route.width}-dark.png`,
      fullPage: true,
    });
  });

test("deductions above pay are blocked without exposing identity", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/tools/payslip-generator/");
  await page.locator("#basic").fill("100");
  await page.locator("#paye").fill("200");
  await page.locator("#confirmed").check();
  await page.getByRole("button", { name: "Generate payslip draft" }).click();
  await expect(page.locator("#status")).toContainText("cannot exceed");
  await expect(page.locator("#previewCard")).toBeHidden();
});
