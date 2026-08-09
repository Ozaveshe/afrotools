const { test, expect } = require("@playwright/test"),
  fs = require("node:fs"),
  pdf = require("pdf-parse");
const generic = [
  ["creator-carousel", "/sw/zana/carousel-ya-mitandao/", ["json", "txt"]],
  ["creator-hooks", "/sw/zana/hook-za-video/", ["json", "txt"]],
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
  const layout = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    offenders: Array.from(document.querySelectorAll("body *"))
      .filter((node) => node.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .slice(0, 12)
      .map((node) => ({
        tag: node.tagName,
        id: node.id,
        className: String(node.className || ""),
        right: Math.round(node.getBoundingClientRect().right),
        width: Math.round(node.getBoundingClientRect().width),
      })),
  }));
  expect(layout.documentWidth, JSON.stringify(layout.offenders)).toBeLessThanOrEqual(
    layout.viewportWidth + 1,
  );
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
async function downloadById(page, id) {
  const waiting = page.waitForEvent("download");
  await page.locator(id).click();
  const item = await waiting;
  return fs.readFileSync(await item.path());
}
test("desk preserves full project state and parsed JSON/CSV", async ({ page }) => {
  await page.goto("/sw/zana/dawati-la-mtayarishi/");
  await page.locator('[name="status"]').selectOption("quoted");
  await page.locator('[name="currency"]').selectOption("EUR");
  await page.locator("main form button[type=submit]").click();
  await expect(page.locator("[data-output]")).toContainText("quoted");
  const json = JSON.parse((await downloadById(page, "[data-json]")).toString("utf8"));
  expect(json.projects[0]).toMatchObject({ status: "quoted", currency: "EUR" });
  const csv = (await downloadById(page, "[data-csv]")).toString("utf8");
  expect(csv).toContain('"quoted"');
  expect(csv).toContain('"EUR"');
  await noOverflow(page, 320);
});
test("hashtags preserves local mix/history/exports and gates optional AI", async ({ page }) => {
  let aiRequests = 0;
  await page.route("**/.netlify/functions/creator-hashtags/generate", route => { aiRequests += 1; route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({output:{sets:[]}})}); });
  await page.goto("/sw/zana/hashtag-za-maudhui/");
  await page.locator("#topicInput").fill("Picha za harusi mjini Dar es Salaam");
  await page.locator("#generateBtn").click();
  await expect(page.locator("#mixCard")).toBeVisible();
  await page.locator(".cht-tag").first().click();
  await expect(page.locator("#mixCount")).toContainText("1 /");
  expect(JSON.parse((await downloadById(page, "#downloadJson")).toString("utf8"))).toBeTruthy();
  expect((await downloadById(page, "#downloadTxt")).toString("utf8").length).toBeGreaterThan(20);
  await page.locator("#historyBtn").click();
  await expect(page.locator("#historyPanel")).toBeVisible();
  await page.locator("#historyClose").click();
  await page.locator("#generationMode").selectOption("ai");
  await page.locator("#generateBtn").click();
  expect(aiRequests).toBe(0);
  await page.locator("#aiConsent").check();
  await page.locator("#generateBtn").click();
  await expect.poll(() => aiRequests).toBe(1);
  await noOverflow(page, 320);
});
test("invoice preserves all fields, local draft/copy and parsed exports", async ({ page }) => {
  await page.goto("/sw/zana/ankara-ya-mtayarishi/");
  await page.locator("#ciIssuedDate").fill("2026-08-09");
  await page.locator("#ciDueDate").fill("2026-08-30");
  await page.locator("#ciIssuerEmail").fill("studio@example.test");
  await page.locator("#ciClientEmail").fill("client@example.test");
  await page.locator("#ciTaxLabel").fill("VAT");
  await page.locator("#ciTaxRate").fill("16");
  await page.locator("#ciDiscountValue").fill("5");
  await page.locator("#ciNotes").fill("Lipa ndani ya siku 21");
  await page.locator("#ciSave").click();
  await page.locator("#ciNotes").fill("");
  await page.locator("#ciLoad").click();
  await expect(page.locator("#ciNotes")).toHaveValue("Lipa ndani ya siku 21");
  await page.locator("main form button[type=submit]").click();
  await expect(page.locator("#ciPreview")).toBeVisible();
  await page.locator("#ciCopy").click();
  const json = JSON.parse((await downloadById(page, "#ciJson")).toString("utf8"));
  expect(json.issuer.email).toBe("studio@example.test");
  expect(json.items.length).toBeGreaterThan(0);
  expect((await downloadById(page, "#ciText")).toString("utf8")).toContain("INV-001");
  const pdfBuffer = await downloadById(page, "#ciPdf");
  expect(pdfBuffer.subarray(0, 4).toString()).toBe("%PDF");
  const parsed = await pdf(pdfBuffer);
  expect(parsed.text).toContain("INV-001");
  expect(parsed.text).toContain("Jumla");
  await noOverflow(page, 320);
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
            categories: '<img src=x onerror="window.__streamXss=1">',
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
  await expect(page.locator("[data-results]")).toContainText("Kenya");
  await expect(page.locator("[data-results]")).toContainText("<img src=x");
  expect(await page.evaluate(() => window.__streamXss || 0)).toBe(0);
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
test("carousel exports reopened 1080x1350 PNG slides in a ZIP", async ({ page }) => {
  await page.goto("/sw/zana/carousel-ya-mitandao/");
  await page.locator('input[name="background"]').fill("#102030");
  await page.locator('input[name="accent"]').fill("#f59e0b");
  await page.getByRole("button", { name: "Tengeneza matokeo" }).click();
  await expect(page.locator("canvas[data-slide]")).toHaveCount(5);
  const file = await grab(page, "zip");
  expect(file.buffer.subarray(0, 4).toString("binary")).toContain("PK");
  const reopened = await page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const zip = await window.JSZip.loadAsync(bytes);
    const names = Object.keys(zip.files).sort();
    const png = new Uint8Array(await zip.file(names[0]).async("arraybuffer"));
    const view = new DataView(png.buffer);
    return {
      names,
      signature: Array.from(png.slice(0, 8)),
      width: view.getUint32(16),
      height: view.getUint32(20),
    };
  }, file.buffer.toString("base64"));
  expect(reopened.names).toHaveLength(5);
  expect(reopened.signature).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(reopened.width).toBe(1080);
  expect(reopened.height).toBe(1350);
});
test("creator clip preserves the full editor and reopens its real WebM export", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/sw/zana/kukata-video-za-mtayarishi/");
  for (const id of [
    "saveProjectBtn",
    "loadProjectBtn",
    "genCaptionsBtn",
    "addCaptionBtn",
    "customFont",
    "addOverlayBtn",
    "brightnessSlider",
    "contrastSlider",
    "saturationSlider",
    "audioVolume",
  ]) await expect(page.locator(`#${id}`)).toHaveCount(1);
  const fixture = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 180;
    const context = canvas.getContext("2d");
    const stream = canvas.captureStream(15);
    const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
      .find((value) => MediaRecorder.isTypeSupported(value));
    const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
    const done = new Promise((resolve) => { recorder.onstop = resolve; });
    recorder.start(50);
    let frame = 0;
    const timer = setInterval(() => {
      context.fillStyle = frame++ % 2 ? "#0b67d1" : "#09223a";
      context.fillRect(0, 0, 320, 180);
    }, 50);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    clearInterval(timer);
    recorder.stop();
    await done;
    stream.getTracks().forEach((track) => track.stop());
    return Array.from(new Uint8Array(await new Blob(chunks, { type: mime }).arrayBuffer()));
  });
  await page.locator("#fileInput").setInputFiles({
    name: "fixture.webm",
    mimeType: "video/webm",
    buffer: Buffer.from(fixture),
  });
  await expect(page.locator("#editor")).toHaveClass(/active/);
  await page.locator("#addCaptionBtn").click();
  await page.locator(".ccl-caption-text-input").last().fill("Nukuu ya majaribio");
  await page.locator('[data-tab="overlays"]').click();
  await page.locator("#addOverlayBtn").click();
  await page.locator(".ccl-overlay-text-input").last().fill("AfroTools");
  await page.locator('[data-tab="resize"]').click();
  await page.locator('[data-ratio="1-1"]').click();
  await page.locator('[data-tab="filters"]').click();
  await page.locator('[data-filter="warm"]').click();
  await page.locator("#saveProjectBtn").click();
  await page.locator('[data-tab="export"]').click();
  const waiting = page.waitForEvent("download");
  await page.locator("#exportBtn").click();
  const item = await waiting;
  const video = { buffer: fs.readFileSync(await item.path()) };
  expect(video.buffer.length).toBeGreaterThan(1000);
  expect(Array.from(video.buffer.subarray(0, 4))).toEqual([
    0x1a, 0x45, 0xdf, 0xa3,
  ]);
  const duration = await page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const element = document.createElement("video");
    element.preload = "metadata";
    element.src = URL.createObjectURL(new Blob([bytes], { type: "video/webm" }));
    await new Promise((resolve, reject) => {
      element.onloadedmetadata = resolve;
      element.onerror = reject;
    });
    return element.duration;
  }, video.buffer.toString("base64"));
  expect(duration).toBeGreaterThan(0.5);
  await noOverflow(page, 320);
});
