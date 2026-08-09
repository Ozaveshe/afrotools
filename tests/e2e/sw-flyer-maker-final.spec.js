const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");

const SW = "/sw/zana/kitengeneza-flyer/";
const EN = "/tools/flyer-maker/";
const pngPixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNk+M9QzwAEYBxVSFUAAN0ABfWI2oQAAAAASUVORK5CYII=", "base64");

async function downloadBytes(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function imageDimensions(bytes, format) {
  if (format === "png") {
    expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (format === "jpg") {
    expect(bytes[0]).toBe(0xff);
    expect(bytes[1]).toBe(0xd8);
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1];
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
      }
      if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
      offset += 2 + bytes.readUInt16BE(offset + 2);
    }
    throw new Error("JPEG SOF marker not found");
  }
  expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
  expect(bytes.subarray(8, 12).toString("ascii")).toBe("WEBP");
  const kind = bytes.subarray(12, 16).toString("ascii");
  if (kind === "VP8X") return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
  if (kind === "VP8 ") return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  if (kind === "VP8L") {
    const bits = bytes.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
  }
  throw new Error(`Unsupported WebP chunk ${kind}`);
}

async function expectDecodedInBrowser(page, bytes, mime) {
  const dataUrl = `data:${mime};base64,${bytes.toString("base64")}`;
  const decoded = await page.evaluate(async (src) => {
    const image = new Image();
    image.src = src;
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  }, dataUrl);
  expect(decoded.width).toBeGreaterThan(0);
  expect(decoded.height).toBeGreaterThan(0);
  return decoded;
}

test.beforeEach(async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    localStorage.removeItem("afro_flyer_studio_state_v2");
    localStorage.removeItem("afro_flyer_brand_v1");
    localStorage.removeItem("afro_flyer_history_v1");
  });
});

test("Swahili flyer studio has native complete controls, local assets, recovery and consent boundary", async ({ page }) => {
  const errors = [];
  const posts = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => { if (request.method() !== "GET") posts.push({ url: request.url(), body: request.postData() || "" }); });
  await page.goto(SW);
  await expect(page.locator("#flyerStatus")).toHaveText("Tayari");
  await expect(page.locator("[data-flyer-template]")).toHaveCount(8);
  await expect(page.locator("[data-flyer-palette]")).toHaveCount(6);
  await expect(page.locator("#flyerSize option")).toHaveCount(5);
  await expect(page.locator("#flyerLayout option")).toHaveCount(6);
  await expect(page.locator("#flyerFont option")).toHaveCount(4);

  await page.locator("#flyerPrompt").fill("Tengeneza flyer ya ibada Ijumaa saa 3 usiku katika Kanisa la Jiji, Arusha. Kiingilio bure, WhatsApp +255 712 345 678.");
  await page.locator("#flyerGenerateLocal").click();
  await expect(page.locator("#flyerStatus")).toHaveText("Rasimu imetengenezwa kwenye kifaa");
  await expect(page.locator("#flyerType")).toHaveValue("church");
  await expect(page.locator("#flyerHeadline")).toHaveValue(/IBADA/);
  await expect(page.locator("#flyerContact")).toHaveValue(/255 712 345 678/);
  expect(posts).toHaveLength(0);

  await page.locator("#flyerGenerateAi").click();
  await expect(page.locator("#flyerStatus")).toHaveText("Weka tiki ya idhini kabla ya kutumia AI");
  expect(posts).toHaveLength(0);

  for (const [id, name] of [["flyerBackgroundInput", "mandhari.png"], ["flyerLogoInput", "nembo.png"], ["flyerQrInput", "qr.png"]]) {
    await page.locator(`#${id}`).setInputFiles({ name, mimeType: "image/png", buffer: pngPixel });
  }
  await expect(page.locator("#flyerBackgroundName")).toHaveText("mandhari.png");
  await expect(page.locator("#flyerLogoName")).toHaveText("nembo.png");
  await expect(page.locator("#flyerQrName")).toHaveText("qr.png");
  expect(posts).toHaveLength(0);

  await page.locator("#flyerOrganizer").fill("Chapa Yetu");
  await page.locator("#flyerContact").fill("+255 700 111 222");
  await page.locator("#flyerPrimary").fill("#123456");
  await page.locator("#flyerSaveBrand").click();
  await expect(page.locator("#flyerStatus")).toHaveText("Seti ya chapa imehifadhiwa");
  await page.locator("#flyerReset").click();
  await page.locator("#flyerLoadBrand").click();
  await expect(page.locator("#flyerStatus")).toHaveText("Seti ya chapa imepakiwa");
  await expect(page.locator("#flyerOrganizer")).toHaveValue("Chapa Yetu");
  await expect(page.locator("#flyerPrimary")).toHaveValue("#123456");
  await expect(page.locator("#flyerLogoName")).toHaveText("nembo.png");

  await page.locator("#flyerCopyCaption").click();
  await expect(page.locator("#flyerStatus")).toHaveText("Maelezo yamenakiliwa");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("+255 700 111 222");
  await page.locator("#flyerCopyBrief").click();
  const brief = await page.evaluate(() => navigator.clipboard.readText());
  expect(brief).toContain("Muhtasari wa kukabidhi flyer");
  expect(brief).toContain("Mratibu: Chapa Yetu");

  await page.locator("#flyerCopyLink").click();
  const designLink = await page.evaluate(() => navigator.clipboard.readText());
  expect(designLink).toContain("#design=");
  expect(designLink).not.toContain("data:image");
  const reopened = await page.context().newPage();
  await reopened.goto(designLink);
  await expect(reopened.locator("#flyerStatus")).toHaveText("Tayari");
  await expect(reopened.locator("#flyerOrganizer")).toHaveValue("Chapa Yetu");
  expect(await reopened.evaluate(() => window.AfroTools.flyerStudio.getState().logoSrc)).toBe("");
  await reopened.close();

  await page.evaluate(() => {
    window.__flyerAiRequest = null;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (url, options = {}) => {
      if (String(url).includes("/.netlify/functions/ai-advisor")) {
        window.__flyerAiRequest = { url: String(url), method: options.method, headers: options.headers, body: options.body };
        return new Response(JSON.stringify({ reply: JSON.stringify({ template: "market", headline: "OFA YA WIKI", venue: "Soko Kuu", cta: "Nunua sasa" }) }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return originalFetch(url, options);
    };
  });
  await page.locator("#flyerPrompt").fill("Tengeneza flyer ya ofa ya wiki katika Soko Kuu");
  await page.locator("#flyerAiConsent").check();
  await page.locator("#flyerGenerateAi").click();
  await expect(page.locator("#flyerStatus")).toHaveText("Rasimu ya AI imetumika");
  expect(posts).toHaveLength(0);
  const aiRequest = await page.evaluate(() => window.__flyerAiRequest);
  expect(aiRequest.url).toContain("/.netlify/functions/ai-advisor");
  expect(aiRequest.method).toBe("POST");
  expect(aiRequest.headers["X-AfroTools-AI-Consent"]).toBe("accepted");
  expect(aiRequest.body).toContain("Tengeneza flyer ya ofa");
  expect(aiRequest.body).not.toContain("data:image");
  expect(errors).toEqual([]);
});

test("all advertised raster exports parse, reopen and preserve exact dimensions", async ({ page }) => {
  await page.goto(SW);
  await expect(page.locator("#flyerStatus")).toHaveText("Tayari");
  const cases = [
    ["instagram", "image/png", "png", 1080, 1350],
    ["square", "image/jpeg", "jpg", 1080, 1080],
    ["story", "image/webp", "webp", 1080, 1920],
    ["a4", "image/png", "png", 2480, 3508],
    ["letter", "image/jpeg", "jpg", 2550, 3300],
  ];
  for (const [size, mime, extension, width, height] of cases) {
    await page.locator("#flyerSize").selectOption(size);
    await page.locator("#flyerFormat").selectOption(mime);
    const [download] = await Promise.all([page.waitForEvent("download"), page.locator("#flyerDownload").click()]);
    expect(download.suggestedFilename()).toMatch(new RegExp(`\\.${extension}$`));
    const bytes = await downloadBytes(download);
    expect(imageDimensions(bytes, extension)).toEqual({ width, height });
    expect(await expectDecodedInBrowser(page, bytes, mime)).toEqual({ width, height });
    await download.delete();
  }

  await page.locator("#flyerFormat").selectOption("image/png");
  const downloads = [];
  page.on("download", (download) => downloads.push(download));
  await page.locator("#flyerExportVariants").click();
  await expect(page.locator("#flyerStatus")).toHaveText("Saizi tatu zimehamishwa");
  await expect.poll(() => downloads.length).toBe(3);
  const expected = [[1080, 1350], [1080, 1080], [1080, 1920]];
  for (let index = 0; index < downloads.length; index += 1) {
    const bytes = await downloadBytes(downloads[index]);
    expect(imageDimensions(bytes, "png")).toEqual({ width: expected[index][0], height: expected[index][1] });
    await downloads[index].delete();
  }
  await expect(page.locator("#flyerHistory .flyer-history-item")).toHaveCount(6);
});

test("English owner regresses cleanly and Swahili reflows, themes and focuses", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(EN);
  await expect(page.locator("#flyerStatus")).toHaveText("Ready");
  await expect(page.locator("[data-flyer-template]")).toHaveCount(8);
  await page.locator("#flyerPrompt").fill("Create a market sale flyer for Saturday at City Hall");
  await page.locator("#flyerGenerateLocal").click();
  await expect(page.locator("#flyerStatus")).toHaveText("Local draft generated");
  await expect(page.locator("#flyerType")).toHaveValue("sale");

  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(SW);
    await expect(page.locator("#flyerStatus")).toHaveText("Tayari");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  const overflow = await page.evaluate(() => [...document.querySelectorAll("body *")].filter((node) => {
    const rect = node.getBoundingClientRect();
    return rect.right > document.documentElement.clientWidth + 1 || rect.left < -1;
  }).map((node) => ({ tag: node.tagName, id: node.id, className: String(node.className || ""), right: Math.round(node.getBoundingClientRect().right) })).slice(0, 20));
  expect(overflow).toEqual([]);
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; document.documentElement.dataset.theme = "dark"; });
  await expect(page.locator("#flyerCanvas")).toBeVisible();
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.activeElement && document.activeElement !== document.body);
  expect(focused).toBe(true);
  expect(errors).toEqual([]);
});
