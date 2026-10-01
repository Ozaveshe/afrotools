const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");

async function quietExternalNoise(page) {
  await page.route("**/*", async function (route) {
    const url = new URL(route.request().url());
    if (url.hostname === "www.googletagmanager.com") {
      return route.fulfill({ contentType: "application/javascript; charset=utf-8", body: "" });
    }
    if (url.hostname === "fonts.googleapis.com") {
      return route.fulfill({ contentType: "text/css; charset=utf-8", body: "" });
    }
    if (url.hostname === "fonts.gstatic.com") return route.abort();
    if (!["127.0.0.1", "localhost"].includes(url.hostname)) return route.abort();
    return route.continue();
  });
}

function installConsoleGuard(page) {
  const errors = [];
  page.on("console", function (message) {
    if (message.type() !== "error") return;
    if (/Failed to load resource|ERR_FAILED|CORS|supabase/i.test(message.text())) return;
    errors.push(message.text());
  });
  page.on("pageerror", function (error) {
    errors.push(error.message);
  });
  return errors;
}

test('single meal swaps respect filters, locks survive regeneration and checked shopping items recover locally', async ({ page }, testInfo) => {
  await quietExternalNoise(page);
  await page.goto('/tools/afrokitchen/');
  await page.locator('#ak-plan-days').selectOption('3');
  await page.locator('#ak-plan-generate').click();
  await expect(page.locator('.ak-plan-day')).toHaveCount(3);
  const before = await page.locator('.ak-plan-day h4 a').evaluateAll(links => links.map(link => link.getAttribute('href')));
  await page.locator('[data-ak-lock="0"]').press('Enter');
  await expect(page.locator('[data-ak-lock="0"]')).toBeFocused();
  await expect(page.locator('[data-ak-swap="0"]')).toBeDisabled();
  await page.locator('[data-ak-swap="1"]').press('Enter');
  await expect(page.locator('#ak-plan-status')).toContainText('Day 2 replaced');
  const swapped = await page.locator('.ak-plan-day h4 a').evaluateAll(links => links.map(link => link.getAttribute('href')));
  expect(swapped[0]).toBe(before[0]);
  expect(swapped[1]).not.toBe(before[1]);
  expect(swapped[2]).toBe(before[2]);
  await expect(page.locator('[data-ak-swap="1"]')).toBeFocused();
  await page.locator('#ak-plan-regenerate').click();
  await expect(page.locator('.ak-plan-day h4 a').first()).toHaveAttribute('href', before[0]);
  await expect(page.locator('[data-ak-lock="0"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-ak-shopping]').first().check();
  const checkedKey = await page.locator('[data-ak-shopping]').first().getAttribute('data-ak-shopping');
  await page.locator('#ak-plan-save').click();
  await page.reload();
  await expect(page.locator('#ak-plan-status')).toContainText('Saved plan restored');
  await expect(page.locator('[data-ak-lock="0"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-ak-shopping]').first()).toHaveAttribute('data-ak-shopping', checkedKey);
  await expect(page.locator('[data-ak-shopping]').first()).toBeChecked();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ak_saved_plan_v1')));
  expect(saved.lockedSlugs).toHaveLength(1);
  expect(saved.checked[checkedKey]).toBe(true);
  const downloadWait = page.waitForEvent('download');
  await page.locator('#ak-plan-export').click();
  const download = await downloadWait;
  expect(await fs.readFile(await download.path(), 'utf8')).toContain('- [x] ');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.locator('.ak-plan-day').first().screenshot({ path: testInfo.outputPath('editable-meal-mobile.png') });
  await page.locator('#ak-plan-country').selectOption('LS');
  await page.locator('#ak-plan-generate').click();
  await expect(page.locator('.ak-plan-day')).toHaveCount(1);
  const onlyMeal = await page.locator('.ak-plan-day h4').innerText();
  await page.locator('[data-ak-swap="0"]').click();
  await expect(page.locator('#ak-plan-status')).toContainText('No different meal matches these filters');
  await expect(page.locator('.ak-plan-day h4')).toHaveText(onlyMeal);
});

test('nutrition reference clearly states its unknown basis and stays constant when portions change', async ({ page }) => {
  await quietExternalNoise(page);
  await page.goto('/tools/afrokitchen/recipes/amiwo-bj/');
  await expect(page.locator('#ak-static-nutrition')).toContainText('basis not recorded');
  const calories = await page.locator('#ak-static-nutrition strong').first().innerText();
  await page.evaluate(() => window.AKStaticRecipePage.adjustServings(1));
  await expect(page.locator('#ak-static-nutrition strong').first()).toHaveText(calories);
  await expect(page.locator('#ak-static-nutrition')).toContainText('not recalculated');
});

test("AfroKitchen default plan uses meals and labels a short filtered plan honestly", async ({ page }) => {
  await quietExternalNoise(page);
  await page.goto("/tools/afrokitchen/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#ak-plan-time")).toHaveValue("45");
  await page.locator("#ak-plan-generate").click();
  await expect(page.locator(".ak-plan-day")).toHaveCount(7, { timeout: 30000 });
  const plan = await page.locator(".ak-plan-day").evaluateAll(cards => cards.map(card => ({
    category: card.querySelector(".ak-plan-day-badges span:nth-child(2)")?.textContent.trim().toLowerCase(),
    slug: card.querySelector("h4 a")?.pathname.split("/").filter(Boolean).pop()
  })));
  const mealCategories = ["main", "stew", "soup", "seafood", "grill", "rice"];
  expect(plan.every(recipe => mealCategories.includes(recipe.category))).toBe(true);
  const starchLed = ["papa-le-moroho-ls", "sishwala-emasi-sz", "ugali-na-sukuma-wiki", "kondowole"];
  expect(plan.filter(recipe => starchLed.includes(recipe.slug)).length).toBeLessThanOrEqual(2);

  await page.locator("#ak-plan-country").selectOption("LS");
  await page.locator("#ak-plan-generate").click();
  await expect(page.locator(".ak-plan-day")).toHaveCount(1);
  await expect(page.locator("#ak-plan-result h3").first()).toHaveText("Partial 7-day plan");
  await expect(page.locator(".ak-plan-warning")).toContainText("Widen filters to fill every day");
  await expect(page.locator("#ak-plan-status")).toContainText("1 existing recipe.");
  await expect(page.locator("#ak-plan-generate")).toHaveAttribute("data-state", "partial");
  await expect(page.locator("#ak-plan-generate")).toContainText("Partial plan");
});

test("AfroKitchen weekly planner generates plans, exports shopping list, handles empty state, and fits mobile", async ({ page }) => {
  test.setTimeout(120000);
  await quietExternalNoise(page);
  await page.addInitScript(function () {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async function (text) {
          window.__akCopiedText = text;
        }
      }
    });
  });
  const consoleErrors = installConsoleGuard(page);

  await page.goto("/tools/afrokitchen/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#cook-this-week")).toBeVisible();
  await expect(page.locator("#ak-plan-result")).toContainText("generate a 3-day or 7-day plan");

  await page.locator("#ak-plan-days").selectOption("3");
  await page.locator("#ak-plan-time").selectOption("999");
  await page.locator("#ak-plan-servings").fill("5");
  await page.locator("#ak-plan-generate").click();
  await expect(page.locator("#ak-plan-result")).toContainText("3-day plan ready", { timeout: 30000 });
  await expect(page.locator(".ak-plan-day")).toHaveCount(3);
  await expect(page.locator(".ak-plan-shopping")).toContainText("Grouped shopping list");
  await expect(page.locator(".ak-plan-shopping")).toContainText("Day 1:");
  const initialPlan = await page.locator(".ak-plan-day h4 a").evaluateAll(links => links.map(link => link.getAttribute("href")));
  await page.locator("#ak-plan-regenerate").click();
  await expect(page.locator(".ak-plan-day")).toHaveCount(3);
  const regeneratedPlan = await page.locator(".ak-plan-day h4 a").evaluateAll(links => links.map(link => link.getAttribute("href")));
  expect(regeneratedPlan).not.toEqual(initialPlan);

  await page.locator("#ak-plan-save").click();
  await expect(page.locator("#ak-plan-status")).toContainText("saved on this device");
  const savedPlan = await page.evaluate(() => JSON.parse(localStorage.getItem("ak_saved_plan_v1")));
  expect(savedPlan.slugs).toHaveLength(3);
  expect(savedPlan).not.toHaveProperty("ingredients");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#ak-plan-status")).toContainText("Saved plan restored", { timeout: 30000 });
  const restoredPlan = await page.locator(".ak-plan-day h4 a").evaluateAll(links => links.map(link => link.getAttribute("href")));
  expect(restoredPlan).toEqual(regeneratedPlan);
  const firstPlannedRecipe = await page.locator(".ak-plan-day h4").first().innerText();

  await page.locator("#ak-plan-copy").click();
  await expect(page.locator("#ak-plan-status")).toContainText("Shopping list copied");
  const copiedText = await page.evaluate(function () { return window.__akCopiedText || ""; });
  expect(copiedText).toContain("Shopping list");
  expect(copiedText).toContain(firstPlannedRecipe);

  const download = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#ak-plan-export").click()
  ]).then(function (values) { return values[0]; });
  expect(download.suggestedFilename()).toBe("afrokitchen-3-day-plan.txt");
  await page.locator("#ak-plan-clear").click();
  expect(await page.evaluate(() => localStorage.getItem("ak_saved_plan_v1"))).toBeNull();
  await page.evaluate(function (plan) {
    plan.inputs.servings = '<img src=x onerror=alert(1)>';
    localStorage.setItem('ak_saved_plan_v1', JSON.stringify(plan));
  }, savedPlan);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#ak-plan-restore')).toBeHidden();
  await expect(page.locator('#ak-plan-result')).toContainText('No complete plan yet');
  await page.evaluate(() => localStorage.removeItem('ak_saved_plan_v1'));

  await page.locator("#ak-plan-days").selectOption("7");
  await page.locator("#ak-plan-time").selectOption("999");
  await page.locator("#ak-plan-diet").selectOption("");
  await page.locator("#ak-plan-country").selectOption("");
  await page.locator("#ak-plan-occasion").selectOption("");
  await page.locator("#ak-plan-generate").click();
  await expect(page.locator("#ak-plan-result")).toContainText("7-day plan ready", { timeout: 30000 });
  await expect(page.locator(".ak-plan-day")).toHaveCount(7);

  await page.locator("#ak-plan-time").selectOption("30");
  await page.locator("#ak-plan-diet").selectOption("vegan");
  await page.locator("#ak-plan-country").selectOption("SS");
  await page.locator("#ak-plan-occasion").selectOption("street-food");
  await page.locator("#ak-plan-generate").click();
  await expect(page.locator("#ak-plan-status")).toContainText("No complete plan generated", { timeout: 30000 });
  await expect(page.locator("#ak-plan-result")).toContainText("No meal recipes match", { timeout: 30000 });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#ak-plan-days").selectOption("3");
  await page.locator("#ak-plan-time").selectOption("999");
  await page.locator("#ak-plan-diet").selectOption("");
  await page.locator("#ak-plan-country").selectOption("");
  await page.locator("#ak-plan-occasion").selectOption("");
  await page.locator("#ak-plan-generate").click();
  await expect(page.locator("#ak-plan-result")).toContainText("3-day plan ready", { timeout: 30000 });
  const overflow = await page.evaluate(function () {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const darkBackgrounds = await page.evaluate(function () {
    return [".ak-planner-card", ".ak-method-card", ".ak-recipe-card-meta-text"].map(function (selector) {
      return getComputedStyle(document.querySelector(selector)).backgroundColor;
    });
  });
  darkBackgrounds.forEach(function (color) {
    expect(Number(color.match(/\d+/)[0])).toBeLessThan(100);
  });
  const kickerContrast = await page.locator("#cook-this-week .ak-section-kicker").evaluate(function (kicker) {
    const card = kicker.closest(".ak-planner-card");
    function luminance(color) {
      const channels = color.match(/\d+/g).slice(0, 3).map(Number).map(value => {
        const unit = value / 255;
        return unit <= 0.04045 ? unit / 12.92 : Math.pow((unit + 0.055) / 1.055, 2.4);
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    }
    const text = luminance(getComputedStyle(kicker).color);
    const background = luminance(getComputedStyle(card).backgroundColor);
    return (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05);
  });
  expect(kickerContrast).toBeGreaterThanOrEqual(4.5);
  expect(consoleErrors).toEqual([]);
});

const shoppingFixtureIngredients = [
  { name: "vanilla beans", amount: 1, unit: "whole", group_name: "Sauce" },
  { name: "alligator pepper", amount: 1.5, unit: "tsp", group_name: "Spice" },
  { name: "lobster tails", amount: 2, unit: "whole", group_name: "Seafood" },
  { name: "onion", amount: 2, unit: "large", group_name: "Base" },
  { name: "onion", amount: 2, unit: "large", group_name: "Stew" },
  { name: "water", amount: 8, unit: "cups", group_name: "Liquid" },
  { name: "water", amount: 7.5, unit: "cups", group_name: "Liquid" }
];

test("AfroKitchen hides Show more after all search results are visible", async ({ page }) => {
  await quietExternalNoise(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tools/afrokitchen/", { waitUntil: "domcontentloaded" });
  await page.locator("#search-input").fill("jollof");
  await expect(page.locator("#results-summary")).toContainText(/Showing \d+ of \d+ recipes? for "jollof"/, { timeout: 30000 });
  await expect(page.locator("#recipes-more-wrap")).toHaveAttribute("hidden", "");
  await expect(page.locator("#recipes-more")).toBeHidden();
});

for (const width of [320, 390]) {
  for (const theme of ["light", "dark"]) {
    test(`AfroKitchen shopping quantities and categories at ${width}px in ${theme} mode`, async ({ page }) => {
      test.setTimeout(120000);
      await quietExternalNoise(page);
      await page.route("**/engines/afrokitchen-engine.js*", async function (route) {
        const response = await route.fetch();
        const recipes = shoppingFixtureIngredients.map(function (ingredient, index) {
          return {
            id: 9000 + index,
            slug: `shopping-fixture-${index + 1}`,
            name: `Shopping fixture ${index + 1}`,
            country_code: "NG",
            country_name: "Nigeria",
            category: "main",
            difficulty: "easy",
            default_servings: 6,
            prep_time_minutes: 10,
            cook_time_minutes: 15,
            ingredients: [ingredient]
          };
        });
        const body = await response.text() + "\nAfroKitchenEngine.fetchRecipes = async function () { return " + JSON.stringify(recipes) + "; };";
        await route.fulfill({ response, body });
      });
      await page.addInitScript(function (selectedTheme) {
        localStorage.setItem("aft_theme", selectedTheme);
        localStorage.setItem("afrotools_cookie_consent", "declined");
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: { writeText: async function (text) { window.__akCopiedText = text; } }
        });
      }, theme);
      const consoleErrors = installConsoleGuard(page);
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/tools/afrokitchen/", { waitUntil: "domcontentloaded" });
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.locator("#ak-plan-days").selectOption("7");
      await page.locator("#ak-plan-time").selectOption("999");
      await page.locator("#ak-plan-servings").fill("4");
      await page.locator("#ak-plan-generate").click();
      await expect(page.locator("#ak-plan-result")).toContainText("7-day plan ready", { timeout: 30000 });
      const groups = await page.locator(".ak-plan-shopping-group").evaluateAll(function (nodes) {
        return nodes.map(function (node) {
          return {
            name: node.querySelector("h4 span").textContent,
            lines: Array.from(node.querySelectorAll("li"), function (line) { return line.textContent; })
          };
        });
      });
      const linesFor = function (name) { return (groups.find(function (group) { return group.name === name; }) || { lines: [] }).lines.join("\n"); };
      expect(linesFor("Spices")).toContain("vanilla beans");
      expect(linesFor("Spices")).toContain("alligator pepper");
      expect(linesFor("Protein")).toContain("lobster tails");
      expect(linesFor("Vegetables")).toContain("3 large onions");
      expect(linesFor("Liquids")).toContain("10½ cups water");
      expect(linesFor("Grains")).not.toContain("vanilla beans");
      expect(linesFor("Vegetables")).not.toContain("alligator pepper");
      expect(linesFor("Pantry")).not.toContain("lobster tails");
      await page.locator("#ak-plan-copy").click();
      await expect(page.locator("#ak-plan-status")).toContainText("Shopping list copied");
      const copiedText = await page.evaluate(function () { return window.__akCopiedText; });
      expect(copiedText).toContain("3 large onions");
      expect(copiedText).toContain("10½ cups water");
      groups.forEach(function (group) {
        expect(copiedText).toContain(group.name + ":");
        group.lines.forEach(function (line) { expect(copiedText).toContain("- [ ] " + line); });
      });
      const download = await Promise.all([
        page.waitForEvent("download"),
        page.locator("#ak-plan-export").click()
      ]).then(function (values) { return values[0]; });
      expect(await fs.readFile(await download.path(), "utf8")).toContain(copiedText);
      expect(await page.evaluate(function () { return document.documentElement.scrollWidth - document.documentElement.clientWidth; })).toBeLessThanOrEqual(1);
      expect(consoleErrors).toEqual([]);
    });
  }
}

test("AfroKitchen saves a side as an idea and guides the visitor to a meal", async ({ page }) => {
  await quietExternalNoise(page);
  await page.goto("/tools/afrokitchen/recipes/gozo-cf/", { waitUntil: "domcontentloaded" });
  const saveIdea = page.locator("[data-ak-add-meal-plan]");
  await expect(saveIdea).toContainText("Save recipe idea");
  await saveIdea.click();
  await expect(page.locator("#ak-static-action-status")).toContainText("Add a main dish");
  const browse = page.locator("#ak-static-action-status a");
  await expect(browse).toHaveAttribute("href", "/tools/afrokitchen/#browse-panel");
  await expect(browse).toContainText("More filters to choose Main");
  await browse.click();
  await expect(page.locator("#ak-picked-recipes")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("#ak-plan-from-picks")).toBeDisabled();
  await expect(page.locator("#ak-picked-status")).toContainText("Add a main dish");
  await expect(page.locator("#ak-picked-status a")).toHaveAttribute("href", "#browse-panel");
  await expect(page.locator("#ak-picked-status a")).toContainText("More filters to choose Main");
});

test("AfroKitchen only requests known local recipe image paths", async ({ page }) => {
  await quietExternalNoise(page);
  const missingResponses = [];
  page.on("response", response => {
    if (response.status() === 404 && response.url().includes("/assets/img/kitchen/")) missingResponses.push(response.url());
  });
  await page.goto("/tools/afrokitchen/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#recipes-grid .ak-recipe-card").first()).toBeVisible();
  const imagePaths = await page.evaluate(async () => {
    const legacySlugs = [
      "ugali-sukuma-wiki", "ethiopian-doro-wat", "south-african-bobotie",
      "senegalese-thieboudienne", "egyptian-koshari", "moroccan-chicken-tagine", "ghanaian-waakye"
    ];
    const catalog = await fetch("/tools/afrokitchen/recipe-index.json").then(response => response.json());
    const known = window.AfroKitchenImageManifest;
    return {
      count: known.size,
      recipeCount: catalog.recipes.length,
      unknown: catalog.recipes.concat(legacySlugs).flatMap(recipe => window.AfroKitchenImages.getCandidatePaths(recipe))
        .filter(path => path.startsWith("/assets/img/kitchen/") && !known.has(path))
    };
  });
  expect(imagePaths.count).toBeGreaterThan(300);
  expect(imagePaths.recipeCount).toBe(410);
  expect(imagePaths.unknown).toEqual([]);
  expect(missingResponses).toEqual([]);
});

test("AfroKitchen search results stay close to filters and quick picks narrow recipes", async ({ page }) => {
  await quietExternalNoise(page);
  const consoleErrors = installConsoleGuard(page);
  await page.goto("/tools/afrokitchen/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#recipes-grid .ak-recipe-card").first()).toBeVisible();
  expect(await page.locator('#browse-panel').evaluate(panel => getComputedStyle(panel).opacity)).toBe('1');
  await expect(page.locator("#ak-more-filters")).toHaveAttribute("open", "");
  await expect(page.locator("#clear-recipe-filters")).toBeHidden();

  const gap = await page.evaluate(function () {
    const browse = document.getElementById("browse-panel").getBoundingClientRect();
    const results = document.getElementById("recipe-results").getBoundingClientRect();
    return results.top - browse.bottom;
  });
  expect(gap).toBeLessThan(100);

  await page.locator('[data-quick-filter="time"]').click();
  await expect(page.locator("#filter-time")).toHaveValue("45");
  await expect(page.locator("#results-summary")).toContainText("45 minutes or less");
  const times = await page.locator("#recipes-grid .ak-recipe-card-meta-item").filter({ hasText: "Time" }).allTextContents();
  expect(times.length).toBeGreaterThan(0);
  times.forEach(function (time) { expect(Number(time.match(/\d+/)[0])).toBeLessThanOrEqual(45); });

  await page.locator("#clear-recipe-filters").click();
  await expect(page.locator("#filter-time")).toHaveValue("");
  await page.locator('[data-quick-filter="vegetarian"]').click();
  await expect(page.locator("#filter-diet")).toHaveValue("vegetarian");
  await expect(page.locator("#results-summary")).toContainText("Vegetarian");

  await page.locator("#clear-recipe-filters").click();
  await page.locator("#search-input").fill("jollof");
  await expect(page.locator("#results-summary")).toContainText('"jollof"');
  await expect(page.locator("#recipes-grid .ak-recipe-card").first()).toContainText("Jollof");

  await page.setViewportSize({ width: 390, height: 844 });
  const firstCardLayout = await page.locator('#recipes-grid .ak-recipe-card').first().evaluate(card => ({
    columns: getComputedStyle(card.querySelector('.ak-recipe-card-meta')).gridTemplateColumns.split(' ').length,
    metaItems: card.querySelectorAll('.ak-recipe-card-meta-item').length
  }));
  expect(firstCardLayout.columns).toBe(2);
  expect(firstCardLayout.metaItems).toBeLessThanOrEqual(4);
  await expect(page.locator("#ak-more-filters")).not.toHaveAttribute("open", "");
  await page.locator("#clear-recipe-filters").click();
  await expect(page.locator("#clear-recipe-filters")).toBeHidden();
  await page.locator("#ak-more-filters summary").click();
  await expect(page.locator("#filter-country")).toBeVisible();
  await page.locator("#filter-country").selectOption("NG");
  await expect(page.locator("#results-summary")).toContainText("Nigeria");
  await page.locator("#ak-more-filters summary").click();
  await expect(page.locator("#filter-country")).toBeHidden();
  await expect(page.locator("#clear-recipe-filters")).toBeVisible();
  const overflow = await page.evaluate(function () {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
  await page.setViewportSize({ width: 320, height: 720 });
  const narrowHero = await page.evaluate(() => {
    const links = document.querySelectorAll('.ak-home-hero .ak-hero-quick-actions a');
    return {
      firstRight: links[0].getBoundingClientRect().right,
      secondLeft: links[1].getBoundingClientRect().left,
      browseTop: document.querySelector('#browse-panel').getBoundingClientRect().top + window.scrollY
    };
  });
  expect(narrowHero.firstRight).toBeLessThanOrEqual(narrowHero.secondLeft);
  expect(narrowHero.browseTop).toBeLessThan(600);
  const narrowOverflow = await page.evaluate(function () {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  expect(narrowOverflow).toBeLessThanOrEqual(1);
  expect(consoleErrors).toEqual([]);
});

test("AfroKitchen recipe picks open in the planner and lead a filtered weekly plan", async ({ page }) => {
  test.setTimeout(120000);
  await quietExternalNoise(page);
  const consoleErrors = installConsoleGuard(page);
  await page.goto("/tools/afrokitchen/recipes/jollof-rice-ng/", { waitUntil: "domcontentloaded" });
  await page.locator("[data-ak-add-meal-plan]").click();
  const planLink = page.getByRole("link", { name: "Build a plan from your picks" });
  await expect(planLink).toHaveAttribute("href", "/tools/afrokitchen/#cook-this-week");
  await page.evaluate(function () {
    localStorage.setItem("ak_meal_plan_v1", JSON.stringify([
      { slug: "jollof-rice-ng", name: '<img src=x onerror=alert(1)>', url: "https://example.invalid/" },
      { slug: "../../unknown", name: "Untrusted recipe", url: "https://example.invalid/" }
    ]));
  });
  await planLink.click();
  await expect(page.locator("#ak-picked-recipes")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("#ak-picked-list li")).toHaveCount(1);
  await expect(page.locator("#ak-picked-list a")).toHaveText("Jollof Rice");
  await expect(page.locator("#ak-picked-list a")).toHaveAttribute("href", "/tools/afrokitchen/recipes/jollof-rice-ng/");
  await expect(page.locator("#ak-picked-list img")).toHaveCount(0);
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  const pickedBackground = await page.locator("#ak-picked-recipes").evaluate(node => getComputedStyle(node).backgroundColor);
  expect(Number(pickedBackground.match(/\d+/)[0])).toBeLessThan(100);

  await page.locator("#ak-plan-days").selectOption("3");
  await page.locator("#ak-plan-time").selectOption("30");
  await expect(page.locator("#ak-plan-from-picks")).toBeDisabled();
  await expect(page.locator("#ak-picked-status")).toContainText("None of your picks match");
  await page.locator("#ak-plan-time").selectOption("999");
  await expect(page.locator("#ak-plan-from-picks")).toBeEnabled();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.locator("#ak-plan-from-picks").click();
  await expect(page.locator(".ak-plan-day")).toHaveCount(3, { timeout: 30000 });
  await expect(page.locator(".ak-plan-day h4 a").first()).toHaveText("Jollof Rice");
  await expect(page.locator("#ak-plan-status")).toContainText("including 1 of your picks");

  await page.locator('#ak-picked-list button').click();
  await expect(page.locator('#ak-picked-recipes')).toBeHidden();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ak_meal_plan_v1')))).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("AfroKitchen remembers and reverses a cooked recipe mark on this device", async ({ page }) => {
  await quietExternalNoise(page);
  const consoleErrors = installConsoleGuard(page);
  await page.goto("/tools/afrokitchen/recipes/jollof-rice-ng/", { waitUntil: "domcontentloaded" });
  const cookedButton = page.locator("[data-ak-mark-cooked]");
  await expect(cookedButton).toHaveAttribute("aria-pressed", "false");
  await cookedButton.click();
  await expect(cookedButton).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#ak-static-action-status")).toContainText("Marked as cooked on this device");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("ak_cooked_recipes_v1")))).toEqual([
    expect.objectContaining({ slug: "jollof-rice-ng", cooked_at: expect.any(String) })
  ]);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(cookedButton).toHaveAttribute("aria-pressed", "true");
  await cookedButton.click();
  await expect(cookedButton).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("ak_cooked_recipes_v1")))).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
