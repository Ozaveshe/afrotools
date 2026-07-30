const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const path = require("node:path");

const JSZip = require(path.join(process.cwd(), "assets/vendor/jszip/jszip.min.js"));

const OWNERS = [
  { id: "creator-carousel", slug: "createur-de-carrousel", extra: "zip", visualCount: 5 },
  { id: "creator-club", slug: "club-des-createurs", extra: "csv" },
  { id: "creator-course", slug: "cours-pour-createurs" },
  { id: "creator-page", slug: "page-createur", extra: "html" },
  { id: "creator-research", slug: "recherche-de-contenu-pour-createur" },
  { id: "creator-thumb", slug: "miniature-pour-createur", extra: "png", visualCount: 1 },
];

function routes(owner, locale) {
  if (locale === "fr") {
    return {
      launcher: `/fr/tools/${owner.slug}/`,
      app: `/fr/tools/${owner.slug}/app`,
      canonical: `https://afrotools.com/fr/tools/${owner.slug}/`,
      alternate: `https://afrotools.com/tools/${owner.id}/`,
    };
  }
  return {
    launcher: `/tools/${owner.id}/`,
    app: `/tools/${owner.id}/app`,
    canonical: `https://afrotools.com/tools/${owner.id}/`,
    alternate: `https://afrotools.com/fr/tools/${owner.slug}/`,
  };
}

async function noOverflow(page, width) {
  await page.setViewportSize({ width, height: 900 });
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  )).toBe(true);
}

async function downloadAt(page, index) {
  const pending = page.waitForEvent("download");
  await page.locator("#creatorFinalExports button").nth(index).click();
  const download = await pending;
  return {
    name: download.suggestedFilename(),
    buffer: await fs.readFile(await download.path()),
  };
}

function pngDimensions(buffer) {
  expect(buffer.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

for (const owner of OWNERS) {
  test(`${owner.id} closes English and French native product parity`, async ({ page }) => {
    test.setTimeout(180000);
    const externalRequests = [];
    const pageErrors = [];
    const consoleErrors = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (!["127.0.0.1", "localhost"].includes(url.hostname)) externalRequests.push(request.url());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await page.addInitScript(() => {
      localStorage.setItem("afrotools_cookie_consent", "declined");
      localStorage.setItem("aft_theme", "light");
    });

    const jsonResults = {};
    for (const locale of ["en", "fr"]) {
      const route = routes(owner, locale);
      await page.goto(route.launcher);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", route.canonical);
      await expect(page.locator(`link[hreflang="${locale === "fr" ? "en" : "fr"}"]`))
        .toHaveAttribute("href", route.alternate);
      await expect(page.locator('meta[name="geo.region"]')).toHaveAttribute("content", "002");
      await expect(page.locator('meta[property="og:image"]'))
        .toHaveAttribute("content", `https://afrotools.com/assets/img/tools/${owner.id}.webp`);
      await expect(page.locator("iframe")).toHaveCount(0);
      await noOverflow(page, 320);
      await noOverflow(page, 375);

      externalRequests.length = 0;
      await page.goto(route.app);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
      await expect(page.locator("#creatorFinalFields label")).toHaveCount(
        await page.locator("#creatorFinalFields input, #creatorFinalFields textarea, #creatorFinalFields select").count()
      );
      await page.locator("#creatorFinalForm button[type=submit]").focus();
      await expect(page.locator("#creatorFinalForm button[type=submit]")).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("#creatorFinalOutput")).toBeVisible();
      await expect(page.locator("#creatorFinalStatus")).not.toBeEmpty();
      if (owner.visualCount) {
        await expect(page.locator(".cf-canvas")).toHaveCount(owner.visualCount);
      }

      const jsonDownload = await downloadAt(page, 0);
      expect(jsonDownload.name).toBe(`${owner.id}.json`);
      jsonResults[locale] = JSON.parse(jsonDownload.buffer.toString("utf8"));
      expect(jsonResults[locale].owner).toBe(owner.id);

      const textDownload = await downloadAt(page, 1);
      expect(textDownload.name).toBe(`${owner.id}.txt`);
      expect(textDownload.buffer.toString("utf8")).toContain(owner.id);

      await noOverflow(page, 320);
      await noOverflow(page, 375);
      await page.setViewportSize({ width: 640, height: 900 });
      await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
      await expect.poll(() => page.evaluate(() =>
        document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
      )).toBe(true);
      await page.evaluate(() => {
        document.documentElement.style.zoom = "";
        document.documentElement.setAttribute("data-theme", "dark");
      });
      const dark = await page.locator(".cf-page").evaluate((element) => getComputedStyle(element).backgroundColor);
      await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
      const light = await page.locator(".cf-page").evaluate((element) => getComputedStyle(element).backgroundColor);
      expect(dark).not.toBe(light);
    }

    expect(jsonResults.en.owner).toBe(jsonResults.fr.owner);
    const frenchRoute = routes(owner, "fr");
    await page.goto(frenchRoute.app);
    await page.locator("#creatorFinalForm button[type=submit]").click();
    if (owner.extra) {
      const extra = await downloadAt(page, 2);
      if (owner.extra === "csv") {
        expect(extra.name).toBe("creator-club.csv");
        expect(extra.buffer.toString("utf8")).toContain("grossMonthly");
      } else if (owner.extra === "html") {
        expect(extra.name).toBe("creator-page.html");
        const html = extra.buffer.toString("utf8");
        expect(html).toContain("<!doctype html>");
        expect(html).toContain("https://example.com");
        expect(html).not.toContain("<script");
      } else if (owner.extra === "png") {
        expect(extra.name).toBe("creator-thumbnail-1280x720.png");
        expect(pngDimensions(extra.buffer)).toEqual({ width: 1280, height: 720 });
      } else if (owner.extra === "zip") {
        expect(extra.name).toBe("creator-carousel-slides.zip");
        const zip = await JSZip.loadAsync(extra.buffer);
        const entries = Object.values(zip.files).filter((entry) => !entry.dir && entry.name.endsWith(".png"));
        expect(entries).toHaveLength(5);
        expect(pngDimensions(await entries[0].async("nodebuffer"))).toEqual({ width: 1080, height: 1350 });
      }
    }

    expect(externalRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}
