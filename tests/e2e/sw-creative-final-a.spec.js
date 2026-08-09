const { test, expect } = require("@playwright/test"),
  fs = require("node:fs"),
  pdf = require("pdf-parse");
const generic = [
  ["creator-carousel", "/sw/zana/carousel-ya-mitandao/", ["json", "html"]],
  ["creator-desk", "/sw/zana/dawati-la-mtayarishi/", ["json", "csv"]],
  ["creator-hashtags", "/sw/zana/hashtag-za-maudhui/", ["json", "txt"]],
  ["creator-hooks", "/sw/zana/hook-za-video/", ["json", "txt"]],
  ["creator-invoice", "/sw/zana/ankara-ya-mtayarishi/", ["json", "txt"]],
  ["creator-kit", "/sw/zana/media-kit-ya-mtayarishi/", ["json", "txt"]],
  ["creator-mail", "/sw/zana/barua-ya-mtayarishi/", ["html", "json", "txt"]],
  ["creator-mind", "/sw/zana/mawazo-ya-mtayarishi/", ["json", "txt"]],
  ["creator-money", "/sw/zana/mapato-ya-mtayarishi/", ["json", "txt"]],
  ["creator-page", "/sw/zana/ukurasa-wa-mtayarishi/", ["html", "json"]],
  ["creator-polish", "/sw/zana/boresha-maudhui-ya-mtayarishi/", ["json", "txt"]],
];
async function grab(page, kind) {
  const waiting = page.waitForEvent("download");
  await page.locator(`[data-export="${kind}"]`).click();
  const item = await waiting;
  return {
    name: item.suggestedFilename(),
    buffer: fs.readFileSync(await item.path()),
  };
}
async function noOverflow(page, width) {
  await page.setViewportSize({ width, height: 900 });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
    )
    .toBe(true);
}
test("eleven deterministic creator owners run, reject invalid state and reopen exports", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error" && !/favicon/i.test(msg.text()))
      errors.push(msg.text());
  });
  for (const [id, route, kinds] of generic) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("lang", "sw");
    await expect(page.locator("iframe")).toHaveCount(0);
    expect(
      await page
        .locator("main input, main select, main textarea")
        .evaluateAll((nodes) => nodes.every((node) => node.labels.length > 0)),
    ).toBe(true);
    const firstControl = page.locator("main input, main select, main textarea").first();
    await firstControl.focus();
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => document.activeElement !== document.body),
    ).toBe(true);
    await page.locator("main form").getByRole("button", { name: "Tengeneza matokeo" }).click();
    await expect(page.locator("[data-results]")).toBeVisible();
    for (const kind of kinds) {
      const item = await grab(page, kind);
      const text = item.buffer.toString("utf8");
      if (kind === "json") {
        expect(JSON.parse(text)).toBeTruthy();
      } else if (kind === "html") {
        expect(text).toMatch(/<!doctype html>/i);
        expect(text).toMatch(/<html lang="sw">/i);
      } else if (kind === "csv") {
        expect(text).toContain('"project","client","status"');
        expect(text.trim().split(/\r?\n/).length).toBeGreaterThan(1);
      } else {
        expect(text.trim().length).toBeGreaterThan(20);
        expect(text).not.toContain("[object Object]");
      }
    }
    const required = page.locator("input[required], textarea[required]").first();
    await required.fill("");
    await page.locator("main form").getByRole("button", { name: "Tengeneza matokeo" }).click();
    await expect(page.locator("[data-status]")).toContainText(/Kagua/);
    await page.locator("[data-reset]").click();
    await expect(page.locator("[data-exports]")).toBeHidden();
    await noOverflow(page, 320);
    await noOverflow(page, 375);
    await page.setViewportSize({ width: 640, height: 900 });
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth + 1,
        ),
      )
      .toBe(true);
    await page.evaluate(() => {
      document.documentElement.style.zoom = "";
      document.documentElement.setAttribute("data-theme", "dark");
    });
    const dark = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.evaluate(() =>
      document.documentElement.setAttribute("data-theme", "light"),
    );
    const light = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(dark).not.toBe(light);
    expect(await page.locator("h1").count()).toBeGreaterThan(0);
    expect(id).toBeTruthy();
  }
  expect(errors).toEqual([]);
});
test("invoice PDF reopens with Swahili document text", async ({ page }) => {
  await page.goto("/sw/zana/ankara-ya-mtayarishi/");
  await page.locator("main form").getByRole("button", { name: "Tengeneza matokeo" }).click();
  const file = await grab(page, "pdf");
  expect(file.buffer.subarray(0, 4).toString()).toBe("%PDF");
  const parsed = await pdf(file.buffer);
  expect(parsed.text).toContain("ANKARA INV-042");
  expect(parsed.text).toContain("Jumla");
});
test("creator kit AI sends nothing before explicit consent and retains local fallback", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/.netlify/functions/ai-advisor", (route) => {
    requests += 1;
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ reply: "Pendekezo salama la mfano." }),
    });
  });
  await page.goto("/sw/zana/media-kit-ya-mtayarishi/");
  await page.locator("[data-ai-run]").click();
  expect(requests).toBe(0);
  await expect(page.locator("[data-status]")).toContainText("ukubali wazi");
  await page.locator("[data-ai-consent]").check();
  await page.locator("[data-ai-run]").click();
  await expect.poll(() => requests).toBe(1);
  await expect(page.locator("[data-results]")).toContainText(
    "Pendekezo salama",
  );
});
test("AfroStream proves live freshness, local filters, fallback and parseable exports", async ({
  page,
}) => {
  await page.route("**/api/afrostream/creators", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: [
          {
            name: "Amina Studio",
            country: "Kenya",
            categories: "Education",
            subscribers: 12000,
            afro_score: 88,
            slug: "amina",
            updated_at: "2026-08-08T10:00:00Z",
          },
        ],
      }),
    }),
  );
  await page.route("**/api/afrostream/streams", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: [] }),
    }),
  );
  await page.route("**/api/afrostream/news", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: [] }),
    }),
  );
  await page.goto("/sw/zana/afrostream/");
  await expect(page.locator("[data-status]")).toContainText("data ya API");
  await expect(page.locator("[data-freshness]")).toContainText("2026-08-08");
  await page.locator("[data-search]").fill("Amina");
  const json = await grab(page, "json");
  const parsed = JSON.parse(json.buffer.toString("utf8"));
  expect(parsed.creators).toHaveLength(1);
  expect(parsed.creators[0].name).toBe("Amina Studio");
  const csv = await grab(page, "csv");
  expect(csv.buffer.toString("utf8")).toContain('"Amina Studio"');
  await page.unrouteAll({ behavior: "wait" });
  await page.route("**/api/afrostream/**", (route) =>
    route.fulfill({ status: 503, body: "{}" }),
  );
  await page.goto("/sw/zana/afrostream/");
  await expect(page.locator("[data-status]")).toContainText(
    "snapshot ya kumbukumbu",
  );
  await expect(page.locator("[data-freshness]")).toContainText(
    "fallback iliyohifadhiwa",
  );
  await expect(page.locator("[data-freshness]")).toContainText("unverified");
});
test("creator clip records and reopens a deterministic synthetic WebM stream", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/sw/zana/kukata-video-za-mtayarishi/");
  await page.locator("[data-synthetic]").click();
  await expect(page.locator("[data-exports]")).toBeVisible({ timeout: 20000 });
  const video = await grab(page, "webm");
  expect(video.buffer.length).toBeGreaterThan(1000);
  expect(Array.from(video.buffer.subarray(0, 4))).toEqual([
    0x1a, 0x45, 0xdf, 0xa3,
  ]);
  const meta = await grab(page, "json");
  const parsed = JSON.parse(meta.buffer.toString("utf8"));
  expect(parsed.mimeType).toContain("video/webm");
  expect(parsed.durationSeconds).toBe(1);
  await noOverflow(page, 320);
});
