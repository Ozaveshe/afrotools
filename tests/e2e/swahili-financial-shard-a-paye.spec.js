const fs = require("node:fs");
const pdfParse = require("pdf-parse");
const { test, expect } = require("@playwright/test");

const cases = [
  {
    id: "bj-paye",
    route: "/sw/benin/kikokotoo-kodi-mshahara/",
    gross: "500000",
    result: "XOF 410,500",
    pdfText: /mshahara Benin/i,
  },
  {
    id: "cv-paye",
    route: "/sw/cape-verde/kikokotoo-kodi-mshahara/",
    gross: "100000",
    result: "CVE 81,225",
    pdfText: /IRPS Cabo Verde/i,
  },
  {
    id: "dj-paye",
    route: "/sw/djibouti/kikokotoo-kodi-mshahara/",
    gross: "200000",
    result: "DJF 162,300",
    pdfText: /Mshahara Jibuti/i,
  },
  {
    id: "gm-paye",
    route: "/sw/gambia/kikokotoo-kodi-mshahara/",
    gross: "50000",
    result: "GMD 36,166.67",
    pdfText: /PAYE Gambia/i,
  },
];

for (const [index, item] of cases.entries()) {
  test(`${item.id}: Swahili formula, PDF parse, privacy and 200% reflow`, async ({ page }) => {
    const requests = [];
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      requests.push(`${request.method()} ${request.url()} ${request.postData() || ""}`);
    });
    await page.route(/google-analytics\.com|googlesyndication\.com/, (route) => route.abort());
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.setViewportSize({ width: index % 2 ? 320 : 375, height: 812 });
    await page.goto(item.route, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });

    await expect(page.locator("html")).toHaveAttribute("lang", "sw");
    await page.locator("#grossSalary").fill(item.gross);
    await page.locator("#calculateBtn").click();
    await expect(page.locator("#netMonthly")).toHaveText(item.result);
    await expect(page.locator("#resultsCard")).toHaveClass(/\bon\b/);

    const downloadPromise = page.waitForEvent("download");
    await page.locator("#pdfBtn").click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    const parsed = await pdfParse(fs.readFileSync(downloadPath));
    expect(parsed.numpages).toBeGreaterThanOrEqual(1);
    expect(parsed.text).toMatch(item.pdfText);

    const overflow = await page.evaluate(() => ({
      delta: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      offenders: Array.from(document.querySelectorAll("body *")).map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, id: element.id, left: rect.left, right: rect.right };
      }).filter((entry) => entry.right > document.documentElement.clientWidth + 1 || entry.left < -1)
        .filter((entry) => !/^(?:fh-skip|erv-skip)$/.test(entry.id)),
    }));
    expect(overflow.delta, JSON.stringify(overflow.offenders.slice(0, 8))).toBeLessThanOrEqual(1);
    expect(overflow.offenders).toEqual([]);

    await page.locator("#grossSalary").fill("0");
    await page.locator("#calculateBtn").click();
    await expect(page.locator("#resultsCard")).not.toHaveClass(/\bon\b/);
    await page.locator("#main-content #clearBtn").click();
    await expect(page.locator("#grossSalary")).toHaveValue("");
    await expect(page.locator("#grossSalary")).toBeFocused();

    const requestText = requests.join("\n");
    expect(requestText).not.toContain(item.gross);
    expect(requests.filter((request) => /^POST http:\/\/127\.0\.0\.1:43181/.test(request))).toEqual([]);
    expect(errors.filter((message) => !/ERR_FAILED|Failed to load resource/i.test(message))).toEqual([]);
  });
}
