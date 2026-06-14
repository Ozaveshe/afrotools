const { test, expect } = require("@playwright/test");

async function quietExternals(page) {
  await page.route("https://www.googletagmanager.com/**", function (route) {
    return route.fulfill({ contentType: "application/javascript; charset=utf-8", body: "" });
  });
  await page.route("https://www.google-analytics.com/**", function (route) {
    return route.fulfill({ contentType: "application/javascript; charset=utf-8", body: "" });
  });
  await page.route("https://fonts.googleapis.com/**", function (route) {
    return route.fulfill({ contentType: "text/css; charset=utf-8", body: "" });
  });
  await page.route("https://fonts.gstatic.com/**", function (route) {
    return route.abort();
  });
}

function captureErrors(page) {
  const errors = [];
  page.on("pageerror", function (error) {
    errors.push("pageerror: " + error.message);
  });
  page.on("console", function (message) {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/favicon|manifest|Failed to load resource|googletagmanager|google-analytics|fonts/i.test(text)) return;
    errors.push("console: " + text);
  });
  return errors;
}

async function gotoFloorPlanner(page, viewport) {
  await quietExternals(page);
  await page.setViewportSize(viewport);
  await page.goto("/engineering/floor-planner/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#fpWorkspace")).toBeVisible();
  await expect(page.locator("#fpCanvas")).toBeVisible();
}

async function rect(page, selector) {
  return page.locator(selector).evaluate(function (element) {
    const box = element.getBoundingClientRect();
    return {
      top: box.top,
      right: box.right,
      bottom: box.bottom,
      left: box.left,
      width: box.width,
      height: box.height
    };
  });
}

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(function () {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(2);
}

test("SEO metadata, schema, guide content, related links, and template thumbnail labels are present", async ({ page }) => {
  const errors = captureErrors(page);
  await gotoFloorPlanner(page, { width: 1366, height: 768 });

  await expect(page).toHaveTitle(/Free Floor Planner Africa .* House Plan Estimator .* Construction BOQ Calculator/);
  await expect(page.locator("link[rel='canonical']")).toHaveAttribute("href", "https://afrotools.com/engineering/floor-planner/");
  await expect(page.locator("meta[name='description']")).toHaveAttribute("content", /Free floor planner for Africa/i);
  await expect(page.locator("meta[property='og:image']")).toHaveAttribute("content", /afroplan-floor-planner\.webp$/);
  await expect(page.locator("meta[name='twitter:card']")).toHaveAttribute("content", "summary_large_image");

  const schemaTypes = await page.evaluate(function () {
    return Array.from(document.querySelectorAll("script[type='application/ld+json']")).map(function (script) {
      return JSON.parse(script.textContent || "{}")["@type"];
    });
  });
  expect(schemaTypes).toEqual(expect.arrayContaining(["WebPage", "SoftwareApplication", "BreadcrumbList", "HowTo", "FAQPage"]));

  const seoSection = page.locator(".fp-seo-section");
  await seoSection.scrollIntoViewIfNeeded();
  await expect(seoSection.getByRole("heading", { name: "Plan a room, house, shop, or small building in minutes" })).toBeVisible();
  await expect(seoSection).toContainText("Popular templates");
  await expect(seoSection).toContainText("Construction estimate");
  await expect(seoSection).toContainText("Floor planner questions");
  await expect(seoSection.getByRole("link", { name: "Construction cost calculator" })).toHaveAttribute("href", "/tools/floor-plan/");
  await expect(seoSection.getByRole("link", { name: "Cement and block calculator" })).toHaveAttribute("href", "/tools/building-materials/");
  await expect(seoSection.getByRole("link", { name: "Paint calculator" })).toHaveAttribute("href", "/tools/paint-calculator/");
  await expect(seoSection.getByRole("link", { name: "Roofing calculator" })).toHaveAttribute("href", "/tools/roof-calculator/");
  await expect(seoSection.getByRole("link", { name: "Land and area calculator" })).toHaveAttribute("href", "/tools/land-size/");

  await page.locator("#fpOpenTemplateGallery").click();
  const modal = page.locator("#fpTemplatesModal");
  await expect(modal).toBeVisible();
  await expect(modal.locator(".fp-template-thumb[role='img']")).toHaveCount(7);
  await expect(modal.locator(".fp-template-thumb[aria-label*='Single room self-contained']")).toBeVisible();
  expect(errors).toEqual([]);
});

test("visual polish exposes major action icons, stat chips, and button hierarchy", async ({ page }) => {
  const errors = captureErrors(page);
  await gotoFloorPlanner(page, { width: 1440, height: 900 });

  await expect(page.locator(".fp-quick-card .fp-major-icon")).toHaveCount(4);
  await expect(page.locator(".fp-workspace-toolset .fp-tool-top svg")).toHaveCount(8);
  await expect(page.locator("#fpStartPlanning")).toHaveClass(/fp-btn-primary/);
  await expect(page.locator("#fpOpenTemplateGallery")).toHaveClass(/fp-btn-secondary/);
  await expect(page.locator("#fpCopyPlanningSummary")).toHaveClass(/fp-act-btn-tertiary/);
  await expect(page.locator("#fpExportPackPdf")).toHaveClass(/fp-act-btn-primary/);

  await page.locator("#fpToolSetup").evaluate(function (details) { details.open = true; });
  const statLabels = await page.locator("#fpLiveSummary span").evaluateAll(function (nodes) {
    return nodes.map(function (node) {
      return (node.childNodes[0] && node.childNodes[0].textContent || "").trim();
    });
  });
  expect(statLabels).toEqual(["Rooms", "Area", "Wall length", "Openings", "Estimate"]);

  await page.evaluate(function () {
    document.documentElement.setAttribute("data-theme", "dark");
  });
  const darkWorkspaceBg = await page.locator("#fpWorkspace").evaluate(function (element) {
    return window.getComputedStyle(element).backgroundColor;
  });
  expect(darkWorkspaceBg).not.toBe("rgba(0, 0, 0, 0)");
  expect(errors).toEqual([]);
});

test("1366x768 laptop can scroll to planner and use Fit, zoom, and PNG export", async ({ page }) => {
  const errors = captureErrors(page);
  await gotoFloorPlanner(page, { width: 1366, height: 768 });

  await expect.poll(function () {
    return page.evaluate(function () { return document.documentElement.scrollHeight > window.innerHeight; });
  }).toBeTruthy();

  await page.locator("#fpWorkspace").scrollIntoViewIfNeeded();
  await page.locator(".fp-project-drawer summary").click();
  await page.getByRole("button", { name: /load 4m x 3m fixture/i }).click();
  await page.locator("#fpZoomFit").click();
  await page.locator("#fpZoomIn").click();
  await expect(page.locator("#fpZoomLevel")).not.toHaveText("100%");
  await page.locator("#fpZoomOut").click();

  const download = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#fpExportPlanPng").click()
  ]).then(function (events) { return events[0]; });
  expect(download.suggestedFilename()).toMatch(/\.png$/);

  const canvasBox = await rect(page, "#fpCanvasWrap");
  const footerBox = await rect(page, ".fp-action-bar");
  expect(canvasBox.height).toBeGreaterThanOrEqual(560);
  expect(footerBox.top).toBeGreaterThanOrEqual(canvasBox.bottom - 1);
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("visible planner workflow is consumer-first and assumptions stay collapsed", async ({ page }) => {
  const errors = captureErrors(page);
  await gotoFloorPlanner(page, { width: 1366, height: 768 });

  const hero = page.locator(".fp-consumer-hero");
  await expect(hero.getByRole("heading", { name: "Free Floor Planner for African Homes & Small Buildings" })).toBeVisible();
  await expect(hero).toContainText("Sketch rooms, add doors and windows, estimate materials, and export a builder-ready pack.");
  await expect(hero).toContainText("Works in your browser. No CAD experience needed.");
  await expect(hero.getByRole("button", { name: "Start planning" })).toBeVisible();
  await expect(hero.getByRole("button", { name: "Load template" })).toBeVisible();
  await expect(hero).toContainText("Start from template");
  await expect(hero).toContainText("Add measured room");
  await expect(hero).toContainText("Estimate materials");
  await expect(hero).toContainText("Export PDF/PNG/BOQ");
  await expect(hero).not.toContainText(/Sources & verification|Professional check|beta dashboard/i);

  const assumptions = page.locator("#fpAssumptionsPanel");
  await expect(assumptions).not.toHaveAttribute("open", "");
  await expect(page.getByText("Assumptions, accuracy and professional checks")).toBeVisible();
  await page.locator(".fp-quick-card", { hasText: "Estimate materials" }).click();
  await page.evaluate(function () {
    document.getElementById("fpToolSetup").open = true;
  });
  await page.locator("#fpViewAssumptions").click();
  await expect(page.locator("#fpEstimateAssumptions")).toHaveAttribute("open", "");
  await expect(assumptions).not.toHaveAttribute("open", "");
  await expect(assumptions).toContainText("This is a planning estimate, not an architectural or permit drawing.");
  await expect(assumptions).toContainText("Material estimates use editable local assumptions.");
  expect(errors).toEqual([]);
});

test("template gallery is compact, searchable, filterable, and loads an editable plan", async ({ page }) => {
  const errors = captureErrors(page);
  await gotoFloorPlanner(page, { width: 1366, height: 768 });

  await page.locator("#fpOpenTemplateGallery").click();
  const modal = page.locator("#fpTemplatesModal");
  await expect(modal).toBeVisible();
  await expect(modal.getByRole("heading", { name: "African floor plan templates" })).toBeVisible();
  await expect(modal.getByRole("button", { name: "Start blank" })).toBeVisible();
  await expect(modal.getByText("Single room self-contained")).toBeVisible();
  await expect(modal.getByText("2-bedroom bungalow")).toBeVisible();
  await expect(modal.getByText("Rental rooms compound")).toBeVisible();
  await expect(modal.getByText("12 templates available")).toBeVisible();
  await expect(modal.locator(".fp-template-card")).toHaveCount(7);

  await modal.getByRole("button", { name: "Shop" }).click();
  await expect(modal.getByText("Small shop/kiosk")).toBeVisible();
  await expect(modal.getByText("Salon/barbershop")).toBeVisible();
  await expect(modal.getByText("Small restaurant/cafe")).toBeVisible();
  await expect(modal.getByText("Classroom")).toBeHidden();

  await modal.getByRole("button", { name: "All" }).click();
  await modal.getByLabel("Search templates").fill("clinic");
  await expect(modal.getByText("Clinic reception")).toBeVisible();
  await expect(modal.getByText("Small shop/kiosk")).toBeHidden();
  await modal.locator(".fp-template-card", { hasText: "Clinic reception" }).getByRole("button", { name: "Load template" }).click();
  await expect(modal).toBeHidden();
  await expect.poll(function () {
    return page.evaluate(function () {
      return window.FPCanvas && FPCanvas.getObjects ? FPCanvas.getObjects().filter(function (object) { return object.type === "room"; }).length : 0;
    });
  }).toBeGreaterThanOrEqual(5);
  await expect(page.locator("#fpCanvas")).toBeFocused();
  await expect(page.locator("#fpWorkspace")).toBeInViewport();

  expect(errors).toEqual([]);
});

test("every curated consumer template loads editable canvas objects", async ({ page }) => {
  const errors = captureErrors(page);
  await gotoFloorPlanner(page, { width: 1366, height: 768 });

  await expect.poll(function () {
    return page.evaluate(function () {
      return Boolean(window.FPConsumerTemplates && window.FPCanvas && FPCanvas.getObjects);
    });
  }).toBeTruthy();

  const results = await page.evaluate(function () {
    return window.FPConsumerTemplates.templates.map(function (template) {
      var result = window.FPConsumerTemplates.load(template.key, {
        silent: true,
        skipConfirm: true,
        skipScroll: true
      });
      var objects = window.FPCanvas.getObjects();
      return {
        key: template.key,
        title: template.title,
        loaded: result.loaded,
        count: objects.length,
        rooms: objects.filter(function (object) { return object.type === "room"; }).length,
        editable: objects.every(function (object) { return Boolean(object.id); })
      };
    });
  });

  expect(results).toHaveLength(12);
  for (const result of results) {
    expect(result.loaded, result.title).toBeTruthy();
    expect(result.count, result.title).toBeGreaterThan(0);
    expect(result.rooms, result.title).toBeGreaterThan(0);
    expect(result.editable, result.title).toBeTruthy();
  }
  expect(errors).toEqual([]);
});

test("measured room builder adds, validates, lists, edits, duplicates, deletes, and arranges rooms", async ({ page }) => {
  const errors = captureErrors(page);
  await gotoFloorPlanner(page, { width: 1366, height: 768 });

  await page.locator(".fp-project-drawer summary").click();
  await page.getByRole("button", { name: /load 4m x 3m fixture/i }).click();
  await page.locator("#fpToolSetup").evaluate(function (details) { details.open = true; });

  await page.locator("[data-fp-room-preset='Bedroom']").click();
  await expect(page.locator("#fpRoomType")).toHaveValue("Bedroom");
  await page.locator("#fpRoomWidth").fill("4");
  await page.locator("#fpRoomDepth").fill("3");
  await expect(page.locator("#fpRoomValidation")).toContainText("Looks ready");
  await page.getByRole("button", { name: "Add room" }).click();
  await expect(page.locator("[data-fp-room-rename]").last()).toHaveValue("Bedroom");
  await expect(page.locator("#fpRoomBuilderStatus")).toContainText("2 rooms on canvas");
  await expect(page.locator("#fpLiveSummary")).toContainText("Rooms");

  await page.locator("[data-fp-room-rename]").last().fill("Main bedroom");
  await expect.poll(function () {
    return page.evaluate(function () {
      return FPCanvas.getObjects("room").some(function (room) { return room.name === "Main bedroom"; });
    });
  }).toBeTruthy();

  await page.locator("[data-fp-room-duplicate]").last().click();
  await expect.poll(function () {
    return page.evaluate(function () { return FPCanvas.getObjects("room").length; });
  }).toBeGreaterThanOrEqual(3);

  await page.locator("#fpAutoArrangeRooms").click();
  await expect(page.locator("[data-fp-room-rename]").last()).toHaveValue("Main bedroom copy");

  await page.locator("[data-fp-room-delete]").last().click();
  await expect.poll(function () {
    return page.evaluate(function () {
      return FPCanvas.getObjects("room").filter(function (room) { return /copy/i.test(room.name || ""); }).length;
    });
  }).toBe(0);

  await page.locator("#fpRoomWidth").fill("0");
  await expect(page.locator("#fpRoomValidation")).toContainText("Width must be greater than 0");
  await page.locator("#fpRoomWidth").fill("4");
  await page.locator("#fpUnits").selectOption("ft");
  await expect(page.locator(".fp-room-unit-label").first()).toHaveText("(ft)");
  await expect.poll(function () {
    return page.locator("#fpRoomWidth").inputValue().then(function (value) { return parseFloat(value); });
  }).toBeGreaterThan(12);

  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("consumer estimate updates live and exports builder pack, PNG, BOQ, and summary", async ({ page }) => {
  const errors = captureErrors(page);
  await gotoFloorPlanner(page, { width: 1366, height: 768 });
  await page.locator("#fpWorkspace").scrollIntoViewIfNeeded();
  await page.locator(".fp-project-drawer summary").click();
  await page.getByRole("button", { name: /load 4m x 3m fixture/i }).click();
  await page.locator("#fpToolSetup > summary").click();

  await expect(page.locator("#fpEstimateCard")).toContainText("Planning total");
  await expect(page.locator("#fpEstimateCard")).toContainText("Planning estimate");
  await expect(page.locator("#fpEstimateCard")).not.toContainText(/source|verification|static fallback/i);
  const initialTotal = await page.locator("#fpPlanningTotal").textContent();

  await page.locator("#fpViewAssumptions").click();
  await expect(page.locator("#fpEstimateAssumptions")).toHaveAttribute("open", "");
  await page.locator("#fpWallHeight").fill("4.0");
  await page.locator("#fpWallHeight").dispatchEvent("input");
  await expect.poll(function () {
    return page.locator("#fpPlanningTotal").textContent();
  }).not.toBe(initialTotal);

  const rateInput = page.locator("[data-fp-rate-key='cement']");
  await rateInput.fill("9100");
  await rateInput.dispatchEvent("input");
  await expect.poll(function () {
    return page.evaluate(function () {
      return JSON.parse(localStorage.getItem("afrotools_floor_planner_rates_NG") || "{}").cement;
    });
  }).toBe(9100);
  await page.locator("#fpResetRates").click();
  await expect.poll(function () {
    return page.evaluate(function () {
      return JSON.parse(localStorage.getItem("afrotools_floor_planner_rates_NG") || "{}").cement;
    });
  }).toBeUndefined();

  await page.locator("#fpOpenEstimateBoq").click();
  await expect(page.locator("#fpCostModal")).toBeVisible();
  const boqText = page.locator("#fpCostContent");
  await expect(boqText).toContainText("Concrete blocks");
  await expect(boqText).toContainText("Cement");
  await expect(boqText).toContainText("Sharp sand");
  await expect(boqText).toContainText("Plaster/render allowance");
  await expect(boqText).toContainText("Roofing sheets");
  await expect(boqText).toContainText("Paint");
  await expect(boqText).toContainText("Floor tiles or floor finish");
  await expect(boqText).toContainText("Doors");
  await expect(boqText).toContainText("Windows");
  await expect(boqText).toContainText("Rates vary by city, supplier, design, structure, and finish quality.");

  const csvDownload = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#fpDownloadBoqCsv").click()
  ]).then(function (events) { return events[0]; });
  expect(csvDownload.suggestedFilename()).toMatch(/boq\.csv$/);

  const jsonDownload = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#fpDownloadBoqJson").click()
  ]).then(function (events) { return events[0]; });
  expect(jsonDownload.suggestedFilename()).toMatch(/boq\.json$/);

  await page.locator("[data-close='fpCostModal']").click();
  const pngDownload = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#fpExportPlanPng").click()
  ]).then(function (events) { return events[0]; });
  expect(pngDownload.suggestedFilename()).toMatch(/plan\.png$/);

  const pdfOrPrintPromise = Promise.race([
    page.waitForEvent("download").then(function (download) { return download.suggestedFilename(); }),
    page.waitForEvent("popup").then(function () { return "print-popup"; })
  ]);
  await page.locator("#fpExportPackPdf").click();
  const pdfOrPrint = await pdfOrPrintPromise;
  expect(pdfOrPrint).toMatch(/builder-pack\.pdf|builder-pack\.html|print-popup/);

  await page.locator("#fpCopyPlanningSummary").click();
  await expect(page.locator("#fpExportProofStatus")).toContainText("Summary copied");
  await expect.poll(function () {
    return page.evaluate(function () {
      return (window.dataLayer || []).filter(function (entry) {
        return /floor_planner_.*_(attempt|success|failure)/.test(entry.event || "");
      }).length;
    });
  }).toBeGreaterThan(0);

  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("describe to plan creates editable rooms without network AI and keeps replace confirmation", async ({ page }) => {
  const errors = captureErrors(page);
  let aiRequests = 0;
  await page.route("**/.netlify/functions/ai-advisor", function (route) {
    aiRequests += 1;
    return route.fulfill({ status: 500, body: "AI endpoint should not be used" });
  });
  await gotoFloorPlanner(page, { width: 1366, height: 768 });
  await page.locator("#fpToolSetup").evaluate(function (details) { details.open = true; });

  await expect(page.locator("#fpDescribeTitle")).toContainText("Describe to plan");
  await expect(page.locator("#fpDescribeTitle")).toContainText("Beta");
  await page.locator("#fpDescribeInput").fill("2 bedroom bungalow with parlour, kitchen, 2 bathrooms and veranda");
  await expect(page.locator("#fpDescribeStatus")).toContainText("Ready to create");
  await page.locator("#fpDescribeGenerate").click();

  await expect.poll(function () {
    return page.evaluate(function () {
      return window.FPCanvas && FPCanvas.getObjects ? {
        rooms: FPCanvas.getObjects("room").length,
        walls: FPCanvas.getObjects("wall").length,
        doors: FPCanvas.getObjects("door").length,
        windows: FPCanvas.getObjects("window").length,
        generated: FPCanvas.getObjects("room").every(function (room) { return Boolean(room.id); })
      } : null;
    });
  }).toMatchObject({ rooms: 7, doors: 7, windows: 7, generated: true });
  expect(aiRequests).toBe(0);
  await expect(page.locator("#fpDescribeStatus")).toContainText("editable rooms created");
  await expect(page.locator("#fpEstimateCard")).toContainText("Planning total");

  await page.locator("[data-fp-room-rename]").first().fill("Family parlour");
  await expect.poll(function () {
    return page.evaluate(function () {
      return FPCanvas.getObjects("room").some(function (room) { return room.name === "Family parlour"; });
    });
  }).toBeTruthy();

  page.once("dialog", function (dialog) {
    expect(dialog.message()).toContain("replaces the current canvas");
    dialog.dismiss();
  });
  await page.locator("#fpDescribeInput").fill("Small shop with store and counter");
  await page.locator("#fpDescribeGenerate").click();
  await expect.poll(function () {
    return page.evaluate(function () { return FPCanvas.getObjects("room").length; });
  }).toBe(7);

  page.once("dialog", function (dialog) {
    dialog.accept();
  });
  await page.locator("#fpDescribeGenerate").click();
  await expect.poll(function () {
    return page.evaluate(function () {
      return {
        rooms: FPCanvas.getObjects("room").length,
        shopCounter: FPCanvas.getObjects("furniture").some(function (item) { return /shop counter/i.test(item.label || ""); })
      };
    });
  }).toMatchObject({ rooms: 2, shopCounter: true });

  const pngDownload = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#fpExportPlanPng").click()
  ]).then(function (events) { return events[0]; });
  expect(pngDownload.suggestedFilename()).toMatch(/plan\.png$/);
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("object library shows visual categories, places items, snaps openings, and edits dimensions", async ({ page }) => {
  const errors = captureErrors(page);
  await gotoFloorPlanner(page, { width: 1366, height: 768 });
  await page.locator("#fpWorkspace").scrollIntoViewIfNeeded();

  await page.locator(".fp-workspace-topbar [data-tool='furniture']").click();
  await expect(page.locator("#fpFurniturePanel")).toBeVisible();
  await expect(page.locator("#fpFurnitureList")).toContainText("Doors");
  await expect(page.locator("#fpFurnitureList")).toContainText("Windows");
  await expect(page.locator("#fpFurnitureList")).toContainText("Living room");
  await expect(page.locator("#fpFurnitureList")).toContainText("Outdoor/veranda");
  await expect(page.locator("[data-fp-object-key='sofa']")).toBeVisible();
  await expect(page.locator("[data-fp-object-key='waterTank']")).toBeVisible();

  await page.locator("[data-fp-object-key='sofa']").click();
  await expect.poll(function () {
    return page.evaluate(function () { return FPCanvas.getObjects("furniture").length; });
  }).toBe(1);
  await expect(page.locator("#fpPropsContent")).toContainText("Sofa");
  await expect(page.locator("#fpPropsContent")).toContainText("Width:");
  await expect(page.locator("#fpPropsContent")).toContainText("Depth:");

  await page.locator("[data-fp-object-key='single']").click();
  await expect.poll(function () {
    return page.evaluate(function () { return FPCanvas.getObjects("door").length; });
  }).toBe(0);

  await page.locator(".fp-project-drawer summary").click();
  await page.getByRole("button", { name: /load 4m x 3m fixture/i }).click();
  await page.locator(".fp-workspace-topbar [data-tool='furniture']").click();
  await page.locator("[data-fp-object-key='single']").click();
  await expect.poll(function () {
    return page.evaluate(function () { return FPCanvas.getObjects("door").filter(function (door) { return door.snappedToWall; }).length; });
  }).toBeGreaterThanOrEqual(1);
  await expect(page.locator("#fpPropsContent")).toContainText("Wall snap:");
  await expect(page.locator("#fpPropsContent")).toContainText("On wall");

  const widthInput = page.locator("[data-fp-object-dimension][data-prop='width']");
  await widthInput.fill("1.20");
  await widthInput.dispatchEvent("change");
  await expect.poll(function () {
    return page.evaluate(function () {
      var selected = FPCanvas.selectedIds[0];
      var object = FPCanvas.getObject(selected);
      return object && object.width;
    });
  }).toBeCloseTo(1.2, 1);

  await page.locator("[data-fp-object-rotate]").click();
  await page.locator("[data-fp-object-duplicate]").click();
  await expect.poll(function () {
    return page.evaluate(function () { return FPCanvas.getObjects("door").length; });
  }).toBeGreaterThanOrEqual(2);
  await page.locator("[data-fp-object-delete]").click();
  await expect(page.locator("#fpPropsContent")).toContainText("Plan Summary");
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("3D preview renders placed rooms and real furniture shapes", async ({ page }) => {
  const errors = captureErrors(page);
  await gotoFloorPlanner(page, { width: 1366, height: 768 });
  await page.locator("#fpWorkspace").scrollIntoViewIfNeeded();

  await page.evaluate(function () {
    FPCanvas.clearAll();
    [
      { type: "wall", x1: 0, y1: 0, x2: 5, y2: 0, thickness: 0.15, material: "block" },
      { type: "wall", x1: 5, y1: 0, x2: 5, y2: 3.5, thickness: 0.15, material: "block" },
      { type: "wall", x1: 5, y1: 3.5, x2: 0, y2: 3.5, thickness: 0.15, material: "block" },
      { type: "wall", x1: 0, y1: 3.5, x2: 0, y2: 0, thickness: 0.15, material: "block" },
      { type: "room", name: "Living room", points: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 3.5 }, { x: 0, y: 3.5 }], area: 17.5 },
      { type: "door", x: 1.1, y: 0, width: 0.9, angle: 0, subtype: "single" },
      { type: "window", x: 4.1, y: 3.5, width: 1.2, angle: 0, subtype: "double" },
      { type: "furniture", label: "Sofa", subtype: "sofa", x: 1.6, y: 1.2, w: 1.8, h: 0.8, rotation: 0 },
      { type: "furniture", label: "Double bed", subtype: "bedDouble", x: 3.6, y: 2.4, w: 1.4, h: 2, rotation: 0 },
      { type: "furniture", label: "Dining table", subtype: "diningTable", x: 3.7, y: 1.1, w: 1.4, h: 0.9, rotation: 0 }
    ].forEach(function (object) {
      FPCanvas.addObject(object);
    });
    FPCanvas.fitAll();
    FPCanvas.render();
    FPCanvas.emit("objectsChanged");
  });

  await page.locator("#fpOpen3D").click();
  await expect(page.locator("#fp3dModal")).toBeVisible();
  await expect(page.locator("#fp3dStatus")).toContainText("3D preview ready", { timeout: 20000 });
  await expect(page.locator("#fp3dLegend")).toContainText("Sofa");
  await expect(page.locator("#fp3dLegend")).toContainText("Double bed");
  await expect(page.locator("#fp3dLegend")).toContainText("Dining table");
  await expect(page.locator("#fp3dViewport canvas")).toBeVisible();

  const canvasProof = await page.locator("#fp3dViewport canvas").evaluate(function (canvas) {
    var gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return { width: canvas.width, height: canvas.height, colored: 0, dataUrlLength: 0 };
    var pixels = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    var colored = 0;
    for (var index = 0; index < pixels.length; index += 388) {
      var alpha = pixels[index + 3];
      var r = pixels[index];
      var g = pixels[index + 1];
      var b = pixels[index + 2];
      if (alpha && (Math.abs(r - 17) + Math.abs(g - 24) + Math.abs(b - 39) > 18)) colored += 1;
    }
    return {
      width: canvas.width,
      height: canvas.height,
      colored: colored,
      dataUrlLength: canvas.toDataURL("image/png").length
    };
  });
  expect(canvasProof.width).toBeGreaterThan(300);
  expect(canvasProof.height).toBeGreaterThan(240);
  expect(canvasProof.colored).toBeGreaterThan(20);
  expect(canvasProof.dataUrlLength).toBeGreaterThan(10000);

  await page.locator("#fp3dFit").click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#fp3dModal")).toBeHidden();
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("canvas quality controls support snapping, exact wall length, handles, and warnings", async ({ page }) => {
  const errors = captureErrors(page);
  await gotoFloorPlanner(page, { width: 1366, height: 768 });
  await page.locator("#fpWorkspace").scrollIntoViewIfNeeded();

  await expect(page.locator(".fp-canvas-grid-overlay")).toBeVisible();
  await expect(page.locator("#fpCanvasCoordinate")).toContainText("X");
  await expect(page.locator(".fp-canvas-mode-controls #fpSnapToggle")).toBeVisible();
  await expect(page.locator(".fp-canvas-mode-controls #fpPanMode")).toBeVisible();
  await expect(page.locator("#fpSnapToggle")).toHaveAttribute("aria-pressed", "true");
  await page.locator("#fpSnapToggle").click();
  await expect(page.locator("#fpSnapToggle")).toHaveAttribute("aria-pressed", "false");
  await page.locator("#fpSnapToggle").click();
  await expect(page.locator("#fpSnapToggle")).toHaveAttribute("aria-pressed", "true");
  await page.locator("#fpPanMode").click();
  await expect(page.locator("#fpPanMode")).toHaveAttribute("aria-pressed", "true");

  const ids = await page.evaluate(function () {
    FPCanvas.clearAll();
    const wall = FPCanvas.addObject({ type: "wall", x1: 0, y1: 0, x2: 4, y2: 0, thickness: 0.15, material: "block" });
    FPCanvas.addObject({ type: "room", name: "Room A", points: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }, { x: 0, y: 3 }], area: 12, color: "rgba(37,99,235,.06)" });
    FPCanvas.addObject({ type: "room", name: "Room B", points: [{ x: 1, y: 1 }, { x: 5, y: 1 }, { x: 5, y: 4 }, { x: 1, y: 4 }], area: 12, color: "rgba(16,185,129,.06)" });
    const sofa = FPCanvas.addObject({ type: "furniture", label: "Sofa", subtype: "sofa", x: 2, y: 1, w: 1.8, h: 0.8, rotation: 0 });
    FPCanvas.render();
    FPCanvas.emit("objectsChanged");
    FPCanvas.select([wall.id]);
    return { wallId: wall.id, sofaId: sofa.id };
  });

  await expect(page.locator("#fpCollisionWarning")).toContainText("rooms overlap");
  await expect(page.locator("[data-fp-selection-handle='start']")).toBeVisible();
  await expect(page.locator("[data-fp-selection-handle='end']")).toBeVisible();
  await page.locator("#fpExactWallLength").fill("5.5");
  await page.locator("#fpExactWallLength").dispatchEvent("change");
  await expect.poll(function () {
    return page.evaluate(function (wallId) {
      const wall = FPCanvas.getObject(wallId);
      return Math.sqrt(Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2));
    }, ids.wallId);
  }).toBeCloseTo(5.5, 1);

  await expect(page.locator("[data-fp-readable-label='room']").filter({ hasText: "Room A" })).toBeVisible();
  await expect(page.locator("[data-fp-readable-label='room']").filter({ hasText: "Room B" })).toBeVisible();
  await expect(page.locator("[data-fp-readable-label='furniture']").filter({ hasText: "Sofa" })).toBeVisible();
  const readableLabelsOverlap = await page.evaluate(function () {
    const labels = Array.from(document.querySelectorAll("[data-fp-readable-label]")).map(function (node) {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    });
    return labels.some(function (a, index) {
      return labels.slice(index + 1).some(function (b) {
        const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        return width > 2 && height > 2;
      });
    });
  });
  expect(readableLabelsOverlap).toBe(false);

  await page.evaluate(function (sofaId) {
    FPCanvas.select([sofaId]);
    FPCanvas.emit("selectionChanged", [sofaId]);
  }, ids.sofaId);
  await expect(page.locator(".fp-selection-box")).toBeVisible();
  await expect(page.locator("[data-fp-selection-handle='rotate']")).toBeVisible();
  const before = await page.evaluate(function (sofaId) {
    const sofa = FPCanvas.getObject(sofaId);
    return { w: sofa.w, h: sofa.h, rotation: sofa.rotation || 0 };
  }, ids.sofaId);
  const handle = page.locator("[data-fp-selection-handle='se']");
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 90, box.y + 50);
  await page.mouse.up();
  await expect.poll(function () {
    return page.evaluate(function (sofaId) {
      const sofa = FPCanvas.getObject(sofaId);
      return sofa.w;
    }, ids.sofaId);
  }).toBeGreaterThan(before.w);
  await page.locator("[data-fp-selection-handle='rotate']").click();
  await expect.poll(function () {
    return page.evaluate(function (sofaId) {
      return FPCanvas.getObject(sofaId).rotation || 0;
    }, ids.sofaId);
  }).toBeGreaterThan(before.rotation);

  await page.locator("#fpFitPlanTop").click();
  await expect(page.locator("#fpCanvas")).toBeVisible();
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("1366x768 laptop sees compact hero and the planner starts in the first viewport", async ({ page }) => {
  const errors = captureErrors(page);
  await gotoFloorPlanner(page, { width: 1366, height: 768 });

  const heroBox = await rect(page, ".fp-consumer-hero");
  const quickActionsBox = await rect(page, ".fp-quick-actions");
  const projectSetupBox = await rect(page, ".fp-project-setup");
  const setupBox = await rect(page, ".fp-command-center");
  const workspaceBox = await rect(page, "#fpWorkspace");
  expect(heroBox.height).toBeLessThan(240);
  expect(quickActionsBox.height).toBeLessThan(80);
  expect(projectSetupBox.height).toBeLessThan(56);
  expect(setupBox.height).toBeLessThan(70);
  expect(workspaceBox.top).toBeLessThan(768);
  await expect(page.locator("#fpProjectCountry")).toBeVisible();
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("1440x900 desktop keeps canvas and properties panel visible together", async ({ page }) => {
  const errors = captureErrors(page);
  await gotoFloorPlanner(page, { width: 1440, height: 900 });
  await page.locator("#fpWorkspace").scrollIntoViewIfNeeded();

  const canvasBox = await rect(page, "#fpCanvasWrap");
  const propsBox = await rect(page, "#fpProps");
  const workspaceBox = await rect(page, "#fpWorkspace");

  expect(canvasBox.width).toBeGreaterThan(800);
  expect(canvasBox.height).toBeGreaterThanOrEqual(640);
  expect(propsBox.width).toBeGreaterThanOrEqual(240);
  expect(propsBox.height).toBeGreaterThan(500);
  expect(propsBox.left).toBeGreaterThan(canvasBox.right - 1);
  expect(workspaceBox.bottom).toBeGreaterThan(propsBox.bottom - 1);
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("workspace toolbar exposes tools, shortcuts, fit/reset, and full screen mode", async ({ page }) => {
  const errors = captureErrors(page);
  await gotoFloorPlanner(page, { width: 1366, height: 768 });
  await page.locator("#fpWorkspace").scrollIntoViewIfNeeded();

  const topbar = page.locator(".fp-workspace-topbar");
  await expect(topbar.getByRole("button", { name: /select tool/i })).toBeVisible();
  await expect(topbar.getByRole("button", { name: /wall tool/i })).toBeVisible();
  await expect(topbar.getByRole("button", { name: /door tool/i })).toBeVisible();
  await expect(topbar.getByRole("button", { name: /window tool/i })).toBeVisible();
  await expect(topbar.getByRole("button", { name: /furniture tool/i })).toBeVisible();
  await expect(topbar.getByRole("button", { name: /measure tool/i })).toBeVisible();
  await expect(topbar.getByRole("button", { name: /label tool/i })).toBeVisible();
  await expect(topbar.getByRole("button", { name: /erase tool/i })).toBeVisible();
  await expect(page.locator(".fp-workspace-actions #fpSnapToggle")).toHaveCount(0);
  await expect(page.locator(".fp-workspace-actions #fpPanMode")).toHaveCount(0);
  const topToolOrder = await topbar.locator(".fp-workspace-toolset [data-tool]").evaluateAll(function (buttons) {
    return buttons.map(function (button) { return button.getAttribute("data-tool"); });
  });
  expect(topToolOrder).toEqual(["select", "wall", "door", "window", "furniture", "measure", "label", "erase"]);
  const topActionOrder = await topbar.locator(".fp-workspace-actions > button").evaluateAll(function (buttons) {
    return buttons.slice(0, 3).map(function (button) { return (button.textContent || "").trim(); });
  });
  expect(topActionOrder).toEqual(["Undo", "Redo", "Save"]);

  await page.keyboard.press("w");
  await expect(topbar.getByRole("button", { name: /wall tool/i })).toHaveClass(/active/);
  await expect(page.locator("#fpWorkspaceStatus")).toHaveText("Tool: Wall");
  await page.keyboard.press("v");
  await expect(topbar.getByRole("button", { name: /select tool/i })).toHaveClass(/active/);

  await page.locator("#fpResetView").click();
  await page.locator("#fpFitPlanTop").click();
  await expect(page.locator("#fpCanvas")).toBeVisible();

  await page.locator("#fpFocusPlanner").click();
  await expect(page.locator("body")).toHaveClass(/fp-focus-mode/);
  await expect(page.locator("#fpCanvas")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("body")).not.toHaveClass(/fp-focus-mode/);

  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("390x844 mobile has page scroll, usable tools, and no footer overlap on canvas", async ({ page }) => {
  const errors = captureErrors(page);
  await gotoFloorPlanner(page, { width: 390, height: 844 });

  await page.evaluate(function () {
    FPCanvas.clearAll();
    FPCanvas.addObject({ type: "door", x: 0, y: 0, width: 0.9, angle: 0, subtype: "single" });
    FPCanvas.fitAll();
    FPCanvas.render();
  });
  await expect(page.locator("#fpZoomLevel")).not.toContainText("-");
  await expect(page.locator(".fp-toast", { hasText: "Floor planner recovered" })).toHaveCount(0);

  await page.evaluate(function () {
    FPActionSafety.toast("Floor planner recovered", "Example status", "error");
  });
  const toastBorderWidth = await page.locator(".fp-toast.error").last().evaluate(function (element) {
    return parseFloat(getComputedStyle(element).borderLeftWidth);
  });
  expect(toastBorderWidth).toBeLessThanOrEqual(1);
  await page.locator(".fp-toast.error").last().evaluate(function (element) {
    element.remove();
  });

  const beforeWheel = await page.evaluate(function () { return window.scrollY; });
  const canvasBox = await rect(page, "#fpCanvas");
  await page.mouse.move(canvasBox.left + canvasBox.width / 2, canvasBox.top + canvasBox.height / 2);
  await page.mouse.wheel(0, 420);
  await expect.poll(function () {
    return page.evaluate(function () { return window.scrollY; });
  }).toBeGreaterThan(beforeWheel);

  await page.locator("#fpMobileFab").click();
  await expect(page.locator("#fpMobileTools")).toBeVisible();
  await expect(page.locator("#fpMobileToolsGrid [data-tool='wall']")).toBeVisible();

  const fabBox = await rect(page, "#fpMobileFab");
  const canvasWrapBox = await rect(page, "#fpCanvasWrap");
  const footerBox = await rect(page, ".fp-action-bar");
  expect(fabBox.left).toBeLessThan(80);
  expect(canvasWrapBox.height).toBeGreaterThanOrEqual(560);
  expect(footerBox.top).toBeGreaterThanOrEqual(canvasWrapBox.bottom - 1);
  await expect(page.locator(".fp-mobile-onboarding")).toContainText("Tap a tool, then tap the canvas to place it.");
  await page.locator("#fpMoreActions").click();
  await expect(page.locator("#fpActionMenu")).toHaveClass(/is-open/);
  await expect(page.locator("#fpExportPlanPng")).toBeVisible();
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("mobile widths can create a room, see estimate, open exports, and avoid horizontal overflow", async ({ page }) => {
  const errors = captureErrors(page);
  const widths = [360, 390, 430, 768];

  for (const width of widths) {
    await gotoFloorPlanner(page, { width: width, height: width === 768 ? 1024 : 844 });
    await page.evaluate(function () {
      if (window.FPCanvas) {
        FPCanvas.clearAll();
        FPCanvas.emit && FPCanvas.emit("objectsChanged");
      }
    });
    await expect(page.locator("#fpWorkspace")).toBeInViewport();
    await expect(page.locator("#fpToolSetup")).not.toHaveAttribute("open", "");
    await page.locator("#fpToolSetup").evaluate(function (details) { details.open = true; });
    await page.locator("#fpRoomBuilder").scrollIntoViewIfNeeded();
    await page.locator("#fpRoomWidth").fill("3.6");
    await page.locator("#fpRoomDepth").fill("3");
    await page.getByRole("button", { name: "Add room" }).click();
    await expect.poll(function () {
      return page.evaluate(function () {
        return {
          rooms: FPCanvas.getObjects("room").length,
          doors: FPCanvas.getObjects("door").length,
          windows: FPCanvas.getObjects("window").length
        };
      });
    }).toMatchObject({ rooms: 1, doors: 1, windows: 1 });

    await expect(page.locator("#fpEstimateCard")).toContainText("Planning total");
    await page.locator("#fpWorkspace").scrollIntoViewIfNeeded();
    await page.locator("#fpMobileFab").click();
    await expect(page.locator("#fpMobileTools")).toBeVisible();
    await expect(page.locator("#fpMobileTools")).toContainText("Tap a tool, then tap the canvas to place it.");
    await page.locator("#fpMobileToolsGrid [data-tool='door']").click();
    await expect(page.locator("#fpWorkspaceStatus")).toHaveText("Tool: Door");
    await page.locator("#fpMoreActions").click();
    await expect(page.locator("#fpActionMenu")).toHaveClass(/is-open/);
    await expect(page.locator("#fpOpenEstimateBoq")).toBeVisible();
    await expect(page.locator("#fpExportPackPdf")).toBeVisible();
    await expect(page.locator("#fpExportPlanPng")).toBeVisible();
    await assertNoHorizontalOverflow(page);
  }

  expect(errors).toEqual([]);
});

test("768x1024 tablet collapses properties into a drawer and reopens it", async ({ page }) => {
  const errors = captureErrors(page);
  await gotoFloorPlanner(page, { width: 768, height: 1024 });

  await expect(page.locator("#fpProps")).not.toHaveClass(/is-open/);
  const hiddenTransform = await page.locator("#fpProps").evaluate(function (element) {
    return getComputedStyle(element).transform;
  });
  expect(hiddenTransform).not.toBe("none");

  await page.locator("#fpToggleProps").click();
  await expect(page.locator("#fpProps")).toHaveClass(/is-open/);
  await expect(page.locator("#fpPropsContent")).toBeVisible();
  const openBox = await rect(page, "#fpProps");
  expect(openBox.height).toBeGreaterThan(120);
  expect(openBox.top).toBeLessThan(1024);
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});
