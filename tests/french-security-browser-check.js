"use strict";

const assert = require("assert");
const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const pdfParse = require("pdf-parse");
const { chromium } = require("playwright");
const HOME_SECURITY = require("../assets/js/engines/home-security-cost.js");

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:43217";
const APPS = [
  { id: "cctv-cost", route: "/fr/tools/cout-cctv/", submit: "Calculer le coût CCTV" },
  { id: "cybersecurity-assessment", route: "/fr/tools/evaluation-risque-cybersecurite/", submit: "Lancer l’évaluation" },
  { id: "data-breach-cost", route: "/fr/tools/cout-violation-donnees/", submit: "Estimer le coût" },
  { id: "fire-safety-checklist", route: "/fr/tools/checklist-securite-incendie/", submit: "Évaluer la préparation" },
  { id: "home-security-cost", route: "/fr/tools/cout-securite-maison/", submit: "Calculer les coûts" },
  { id: "password-strength", route: "/fr/tools/force-mot-de-passe/", submit: "Analyser" },
  { id: "phishing-quiz", route: "/fr/tools/quiz-phishing/" },
];

async function startOwnedServer() {
  if (process.env.PLAYWRIGHT_START_SERVER !== "1") return null;
  const target = new URL(BASE_URL);
  const server = spawn(process.execPath, ["tests/support/static-server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: target.port },
    stdio: "ignore",
    windowsHide: true,
  });
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Static server exited with ${server.exitCode}`);
    const ready = await new Promise((resolve) => {
      const request = http.get(`${BASE_URL}/fr/tools/cout-cctv/`, (response) => {
        response.resume();
        resolve(response.statusCode === 200);
      });
      request.on("error", () => resolve(false));
      request.setTimeout(500, () => {
        request.destroy();
        resolve(false);
      });
    });
    if (ready) return server;
    await new Promise((resolve) => setTimeout(resolve, 125));
  }
  server.kill();
  throw new Error(`Static server did not become ready at ${BASE_URL}`);
}

function watch(page) {
  const state = { consoleErrors: [], consoleMessages: [], pageErrors: [], dataRequests: [], allRequests: [], telemetryRequests: [] };
  page.on("console", (message) => {
    state.consoleMessages.push({ type: message.type(), text: message.text() });
    if (message.type() === "error") state.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => state.pageErrors.push(error.message));
  page.on("request", (request) => {
    const record = {
      method: request.method(),
      type: request.resourceType(),
      url: request.url(),
      body: request.postData() || "",
      headers: request.headers(),
    };
    state.allRequests.push(record);
    if (/^https:\/\/(?:www\.google-analytics\.com|pagead2\.googlesyndication\.com)\//.test(record.url)) {
      state.telemetryRequests.push(record);
      return;
    }
    if (["xhr", "fetch"].includes(request.resourceType()) || !["GET", "HEAD"].includes(request.method())) {
      state.dataRequests.push(record);
    }
  });
  return state;
}

async function assertClean(state, label) {
  assert.deepStrictEqual(state.consoleErrors, [], `${label}: console errors`);
  assert.deepStrictEqual(state.pageErrors, [], `${label}: page errors`);
  assert.deepStrictEqual(state.dataRequests, [], `${label}: data requests`);
}

async function assertPrintPdf(page, selector, label) {
  const expectedResultHeading = (await page.locator(".frs-result-hero span").first().textContent()).trim();
  await page.evaluate(() => {
    window.__frSecurityPrintCalled = false;
    window.print = () => { window.__frSecurityPrintCalled = true; };
  });
  await page.locator(selector).click();
  assert.strictEqual(await page.evaluate(() => window.__frSecurityPrintCalled), true, `${label}: print control`);
  await page.emulateMedia({ media: "print" });
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  assert.ok(pdf.length > 1000 && pdf.subarray(0, 4).toString() === "%PDF", `${label}: PDF artifact`);
  const parsed = await pdfParse(pdf);
  assert.ok(parsed.text.includes(expectedResultHeading), `${label}: parsed PDF contains the calculated result heading`);
  assert.ok(parsed.text.length > 200, `${label}: parsed PDF contains substantive text`);
}

async function assertContrast(page, appId, theme) {
  if (theme.startsWith("system-")) {
    await page.emulateMedia({ colorScheme: theme.slice("system-".length) });
    await page.locator("html").evaluate((node) => {
      node.removeAttribute("data-theme");
      node.setAttribute("data-theme-choice", "auto");
    });
  } else {
    await page.locator("html").evaluate((node, value) => node.setAttribute("data-theme", value), theme);
  }
  const failures = await page.evaluate(() => {
    function rgba(value) {
      const match = String(value).match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\)/);
      return match ? [Number(match[1]), Number(match[2]), Number(match[3]), match[4] == null ? 1 : Number(match[4])] : null;
    }
    function luminance(rgb) {
      const channels = rgb.slice(0, 3).map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    }
    function background(element) {
      let current = element;
      while (current) {
        const color = rgba(getComputedStyle(current).backgroundColor);
        if (color && color[3] > 0.98) return color;
        current = current.parentElement;
      }
      return [255, 255, 255, 1];
    }
    const selectors = ["body", ".frs-lead", ".frs-button", ".frs-button-secondary", ".frs-field > span", ".frs-notice", "[data-authoritative-sources] a", ".frs-metric span", ".frs-metric strong", ".frs-password-toggle", ".frs-password-suggestions strong", ".frs-password-suggestions .frs-help", ".frs-password-suggestions code", ".frs-scenario", ".frs-option"];
    return selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)).filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    }).slice(0, 12).map((element) => {
      const foreground = rgba(getComputedStyle(element).color);
      const bg = background(element);
      if (!foreground) return { selector, ratio: 0 };
      const light = Math.max(luminance(foreground), luminance(bg));
      const dark = Math.min(luminance(foreground), luminance(bg));
      return { selector, text: (element.textContent || "").trim().slice(0, 60), foreground: getComputedStyle(element).color, background: bg.slice(0, 3), ratio: (light + 0.05) / (dark + 0.05) };
    })).filter((result) => result.ratio < 4.5);
  });
  assert.deepStrictEqual(failures, [], `${appId}: ${theme} actual WCAG text contrast`);
}

async function assertNoClippedRectangles(page, label) {
  const clipped = await page.evaluate(() => {
    const output = [];
    function actuallyVisible(element) {
      let current=element;
      while(current){
        const style=getComputedStyle(current);
        if(current.hidden||style.display==="none"||style.visibility==="hidden"||Number(style.opacity)===0)return false;
        const parent=current.parentElement;
        current=parent||(current.getRootNode()&&current.getRootNode().host)||null;
      }
      return true;
    }
    const visit = (root, scope) => {
      root.querySelectorAll("*").forEach((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (actuallyVisible(element) && rect.width > 0 && rect.height > 0 &&
            (rect.right > window.innerWidth + 2 || rect.left < -2)) {
          output.push({
            scope,
            tag: element.tagName,
            className: typeof element.className === "string" ? element.className : "",
            text: (element.textContent || "").trim().slice(0, 70),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
          });
        }
        if(actuallyVisible(element))Array.from(element.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()).forEach((node) => {
          const range=document.createRange();
          range.selectNodeContents(node);
          Array.from(range.getClientRects()).forEach((textRect) => {
            if(textRect.width>0&&textRect.height>0&&(textRect.right>window.innerWidth+2||textRect.left<-2))output.push({scope,tag:"#text",text:node.textContent.trim().slice(0,70),left:Math.round(textRect.left),right:Math.round(textRect.right)});
          });
        });
        if(element.shadowRoot)visit(element.shadowRoot,`${scope} > ${element.tagName.toLowerCase()}#shadow`);
      });
    };
    visit(document, "document");
    return output.slice(0, 30);
  });
  assert.deepStrictEqual(clipped, [], `${label}: no visible clipped rectangles`);
}

async function assertHomeControlContract(page) {
  const actual = await page.locator('[data-fr-security-app="home-security-cost"] form').evaluate((form) => {
    return Array.from(form.querySelectorAll("select")).map((control) => ({
      id: control.id,
      defaultValue: control.value,
      values: Array.from(control.options, (option) => option.value),
    }));
  });
  assert.deepStrictEqual(actual, HOME_SECURITY.CONTROL_CONTRACT, "French Home Security DOM matches the exact English four-control contract");
  assert.strictEqual(
    await page.locator('[data-fr-security-app="home-security-cost"] form input:not([type="file"])').count(),
    0,
    "French Home Security cannot replace canonical selects with manual arithmetic inputs"
  );
}

async function assertHomeScenarioPrivacy(page, state, expectedRoute) {
  const url = new URL(page.url());
  assert.strictEqual(url.pathname, expectedRoute, "Home Security keeps the canonical route");
  assert.strictEqual(url.search, "", "Home Security puts no controls in the query string");
  assert.strictEqual(url.hash, "", "Home Security puts no controls in the URL fragment");
  assert.deepStrictEqual(
    state.allRequests.filter((request) => !["GET", "HEAD"].includes(request.method)),
    [],
    "Home Security makes no request by any mutating method"
  );
  const storageAndAnalytics = await page.evaluate(async () => {
    const entries = (storage) => Object.keys(storage).map((key) => [key, storage.getItem(key)]);
    return {
      localStorage: entries(window.localStorage),
      sessionStorage: entries(window.sessionStorage),
      cookie: document.cookie,
      dataLayer: Array.isArray(window.dataLayer) ? window.dataLayer : [],
      indexedDbNames: typeof indexedDB.databases === "function"
        ? (await indexedDB.databases()).map((database) => database.name || "")
        : [],
    };
  });
  const tokens = ["TZ", "mansion", "high", "premium"];
  const requestEvidence = JSON.stringify(state.allRequests);
  const consoleEvidence = JSON.stringify(state.consoleMessages);
  const analyticsEvidence = JSON.stringify({
    telemetryRequests: state.telemetryRequests,
    dataLayer: storageAndAnalytics.dataLayer,
  });
  const storageEvidence = JSON.stringify({
    localStorage: storageAndAnalytics.localStorage,
    sessionStorage: storageAndAnalytics.sessionStorage,
    cookie: storageAndAnalytics.cookie,
    indexedDbNames: storageAndAnalytics.indexedDbNames,
  });
  for (const token of tokens) {
    assert.ok(!requestEvidence.includes(token), `Home Security control ${token} absent from every request URL, body, and header`);
    assert.ok(!consoleEvidence.includes(token), `Home Security control ${token} absent from console output`);
    assert.ok(!analyticsEvidence.includes(token), `Home Security control ${token} absent from analytics`);
    assert.ok(!storageEvidence.includes(token), `Home Security control ${token} absent from browser storage`);
  }
}

async function checkBase(page, app, width, textScale) {
  await page.setViewportSize({ width, height: 900 });
  const state = watch(page);
  await page.goto(`${BASE_URL}${app.route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  const initialRootFont = await page.locator("html").evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
  assert.ok(Math.abs(initialRootFont - 16) < 0.1, `${app.id}: baseline root font is 16px, received ${initialRootFont}`);
  if (textScale === 2) {
    await page.locator("html").evaluate((node) => { node.style.fontSize = "32px"; });
    const enlargedRootFont = await page.locator("html").evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
    assert.ok(Math.abs(enlargedRootFont - 32) < 0.1, `${app.id}: root font enlarges 16px -> 32px, received ${enlargedRootFont}`);
  }
  assert.strictEqual(await page.locator("html").getAttribute("lang"), "fr", `${app.id}: locale`);
  assert.ok((await page.locator("link[rel=canonical]").getAttribute("href")).endsWith(app.route), `${app.id}: canonical`);
  assert.ok((await page.locator('link[rel=alternate][hreflang="en"]').getAttribute("href")).includes(`/tools/${app.id}/`), `${app.id}: English alternate`);
  assert.ok((await page.locator('meta[property="og:url"]').getAttribute("content")).endsWith(app.route), `${app.id}: OG URL`);
  assert.ok((await page.locator('meta[property="og:image"]').getAttribute("content")).endsWith(`/assets/img/tools/${app.id}.webp`), `${app.id}: artwork metadata`);
  assert.strictEqual(await page.locator(`img.frs-art[src$="/${app.id}.webp"]`).count(), 1, `${app.id}: artwork`);
  assert.strictEqual(await page.locator(`[data-fr-security-app="${app.id}"]`).count(), 1, `${app.id}: app mount`);
  if (app.id === "home-security-cost") await assertHomeControlContract(page);
  assert.strictEqual(await page.locator('a[href="/fr/all-tools/?category=security"]').count(), 1, `${app.id}: hub link`);
  assert.ok((await page.locator('script[type="application/ld+json"]').textContent()).includes('"SoftwareApplication"'), `${app.id}: schema`);
  const schemaGraph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  const schema = (Array.isArray(schemaGraph) ? schemaGraph : [schemaGraph]).find((entry) => entry["@type"] === "SoftwareApplication");
  assert.strictEqual(schema.areaServed?.name, "Afrique", `${app.id}: GEO areaServed`);
  assert.strictEqual(schema.audience?.geographicArea?.name, "Afrique", `${app.id}: GEO audience`);
  if (["data-breach-cost","cybersecurity-assessment","fire-safety-checklist","password-strength","phishing-quiz"].includes(app.id)) {
    assert.ok(await page.locator("[data-authoritative-sources] a[href^='https://']").count(), `${app.id}: authoritative source link`);
  } else {
    assert.ok(await page.locator("[data-authoritative-sources]").innerText(), `${app.id}: explicit source method`);
  }
  await assertNoClippedRectangles(page, `${app.id}: ${width}px/${textScale * 100}%`);
  await assertContrast(page, app.id, "dark");
  const dark = await page.locator("body").evaluate((node) => getComputedStyle(node).backgroundColor);
  await assertContrast(page, app.id, "light");
  const light = await page.locator("body").evaluate((node) => getComputedStyle(node).backgroundColor);
  assert.notStrictEqual(dark, light, `${app.id}: light/dark themes`);
  if (app.id === "home-security-cost") {
    await assertContrast(page, app.id, "system-dark");
    await assertContrast(page, app.id, "system-light");
  }
  await page.keyboard.press("Tab");
  assert.ok(await page.evaluate(() => document.activeElement && document.activeElement !== document.body), `${app.id}: keyboard focus`);
  const unlabeled = await page.locator("[data-fr-security-app] input:not([type=hidden]), [data-fr-security-app] select, [data-fr-security-app] textarea").evaluateAll((controls) =>
    controls.filter((control) => {
      const id = control.id;
      return !control.getAttribute("aria-label") &&
        !control.getAttribute("aria-labelledby") &&
        !(id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) &&
        !control.closest("label");
    }).map((control) => control.outerHTML));
  assert.deepStrictEqual(unlabeled, [], `${app.id}: unlabeled controls`);
  await assertClean(state, `${app.id} ${width}px/${textScale * 100}%`);
}

async function checkHub(browser) {
  const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
  const state = watch(page);
  await page.goto(`${BASE_URL}/fr/all-tools/?category=security`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.locator("#toolsGrid .tool-card").first().waitFor({ state: "visible" });
  const cards = page.locator("#toolsGrid .tool-card");
  assert.strictEqual(await cards.count(), 7, "French Security hub: card count");
  const hrefs = await cards.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")).sort());
  assert.deepStrictEqual(hrefs, APPS.map((app) => app.route).sort(), "French Security hub: exact routes");
  for (const app of APPS) {
    assert.strictEqual(await cards.locator(`img[src*="/${app.id}.webp"]`).count(), 1, `${app.id}: hub artwork`);
  }
  await page.keyboard.press("Tab");
  assert.ok(await page.evaluate(() => document.activeElement && document.activeElement !== document.body), "French Security hub: keyboard focus");
  await assertClean(state, "French Security hub");
  await page.close();
  console.log("PASS hub: 7 routes, artwork, keyboard, console, network");
}

async function checkWorkflow(browser, app) {
  const context = await browser.newContext({ viewport: { width: 375, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  const state = watch(page);
  await page.goto(`${BASE_URL}${app.route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  if (app.id === "password-strength") {
    const sentinel = "Secret-Synthetique-Ne-Jamais-Transmettre-2026!";
    await page.locator("#password").fill(sentinel);
    assert.strictEqual(await page.locator(".frs-results").getAttribute("data-visible"), "true");
    assert.strictEqual(await page.locator("[data-export], [data-copy], [data-print]").count(), 0, "password: no secret export controls");
    assert.ok(!(await page.locator("body").innerText()).includes(sentinel), "password: secret absent from rendered output");
    const generatedPassword = await page.locator("[data-generated-password]").textContent();
    const generatedPassphrase = await page.locator("[data-generated-passphrase]").textContent();
    assert.strictEqual(generatedPassword.length, 16, "password: generated credential length");
    assert.strictEqual(generatedPassphrase.split("-").length, 6, "password: generated six-word passphrase");
    assert.ok(6 * Math.log2(2048) >= 66, "password: generated passphrase has at least 66 bits of selection entropy");
    await page.locator("[data-regenerate]").click();
    assert.notStrictEqual(await page.locator("[data-generated-password]").textContent(), generatedPassword, "password: fresh credential generation");
    assert.notStrictEqual(await page.locator("[data-generated-passphrase]").textContent(), generatedPassphrase, "password: fresh passphrase generation");
    assert.ok(!state.allRequests.some((request) => request.url.includes(encodeURIComponent(sentinel)) || request.body.includes(sentinel)), "password: secret absent from every request");
    const passwordPdf=await page.pdf({format:"A4",printBackground:true});
    const parsedPasswordPdf=await pdfParse(passwordPdf);
    assert.ok(!parsedPasswordPdf.text.includes(sentinel), "password: tested secret absent from printed PDF");
    assert.ok(!parsedPasswordPdf.text.includes(generatedPassword), "password: generated password absent from printed PDF");
    assert.ok(!parsedPasswordPdf.text.includes(generatedPassphrase), "password: generated passphrase absent from printed PDF");
    await assertContrast(page, app.id, "dark");
    await assertContrast(page, app.id, "light");
  } else if (app.id === "phishing-quiz") {
    await page.getByRole("button", { name: "Commencer le quiz" }).click();
    for (const answer of [1, 1, 2, 1, 1, 1, 1, 1, 1, 1]) {
      await page.locator(`[data-answer="${answer}"]`).focus();
      await page.keyboard.press("Enter");
      assert.ok(await page.locator("[data-explanation]").isVisible(), "quiz: explanation");
      await page.locator("[data-next]").focus();
      await page.keyboard.press("Enter");
    }
    assert.strictEqual(await page.locator(".frs-result-value").textContent(), "10/10", "quiz: deterministic score");
    await assertContrast(page, app.id, "dark");
    await assertContrast(page, app.id, "light");
    await assertPrintPdf(page, "[data-quiz-print]", app.id);
  } else {
    if (app.id === "cctv-cost") {
      await page.locator("#cameraType").selectOption("analog");
      await page.locator("#recorder").selectOption("nvr");
      await page.getByRole("button", { name: app.submit }).click();
      assert.ok((await page.locator(".frs-status").textContent()).includes("DVR"), "CCTV: invalid recorder state");
      await page.locator("#recorder").selectOption("dvr");
    } else if (app.id === "data-breach-cost") {
      await page.locator("#country").selectOption("KE");
      await page.locator("#records").fill("0");
      await page.getByRole("button", { name: app.submit }).click();
      assert.ok((await page.locator(".frs-status").textContent()).includes("compris entre 1"), "breach: invalid records");
      await page.locator("#records").fill("10000");
    } else if (app.id === "fire-safety-checklist") {
      await page.locator("#country").selectOption("GH");
      await page.locator("#area").fill("0");
      await page.getByRole("button", { name: app.submit }).click();
      assert.ok((await page.locator(".frs-status").textContent()).includes("surface"), "fire: invalid area");
      await page.locator("#area").fill("500");
    } else if (app.id === "home-security-cost") {
      await page.locator("#country").selectOption("TZ");
      await page.locator("#homeType").selectOption("mansion");
      await page.locator("#riskLevel").selectOption("high");
      await page.locator("#securityLevel").selectOption("premium");
    } else if (app.id === "cybersecurity-assessment") {
      await page.locator("#country").selectOption("ZA");
    }
    await page.getByRole("button", { name: app.submit }).click();
    assert.strictEqual(await page.locator(".frs-results").getAttribute("data-visible"), "true", `${app.id}: result`);
    if (app.id === "home-security-cost") {
      assert.ok((await page.locator(".frs-result-value").textContent()).includes("1"), "Home Security renders the shared premium scenario");
      await assertHomeScenarioPrivacy(page, state, app.route);
      await page.locator("#homeType").selectOption("flat");
      assert.strictEqual(await page.locator(".frs-results").getAttribute("data-visible"), "false", "Home Security clears a stale result when a canonical control changes");
      assert.ok((await page.locator(".frs-status").textContent()).includes("Paramètres modifiés"), "Home Security announces stale-result clearing");
      await page.locator("#homeType").selectOption("mansion");
      await page.getByRole("button", { name: app.submit }).click();
    }
    await page.setViewportSize({width:320,height:900});
    await page.locator("html").evaluate((node)=>{node.style.fontSize="32px";});
    await assertNoClippedRectangles(page, `${app.id}: populated result at fixed 320px/200%`);
    if (app.id === "home-security-cost") {
      await page.setViewportSize({width:375,height:900});
      await assertNoClippedRectangles(page, `${app.id}: populated result at fixed 375px/200%`);
    }
    await page.locator("html").evaluate((node)=>{node.style.fontSize="16px";});
    await assertContrast(page, app.id, "dark");
    await assertContrast(page, app.id, "light");
    if (app.id === "data-breach-cost") {
      assert.strictEqual(await page.locator('.frs-results a[href="https://www.odpc.go.ke/report-a-data-breach/"]').count(), 1, "breach: selected-country law and authority");
    } else if (app.id === "cybersecurity-assessment") {
      assert.strictEqual(await page.locator('.frs-results a[href="https://inforegulator.org.za/popia/"]').count(), 1, "cyber: selected-country law and authority");
      assert.strictEqual(await page.locator('.frs-results a[href="https://www.nist.gov/cyberframework"]').count(), 1, "cyber: NIST CSF 2.0 guidance");
    } else if (app.id === "fire-safety-checklist") {
      assert.strictEqual(await page.locator('.frs-results a[href="https://www.mint.gov.gh/agencies/ghana-national-fire-service/"]').count(), 1, "fire: selected-country law and authority");
      assert.ok((await page.locator(".frs-results").innerText()).includes("erreur serveur"), "fire: dead GNFS portal state disclosed");
    }
    await page.getByRole("button", {name:"Réinitialiser"}).click();
    await page.waitForFunction(()=>document.querySelector(".frs-status")?.textContent.includes("réinitialisé"));
    assert.strictEqual(await page.locator(".frs-results").getAttribute("data-visible"), "false", `${app.id}: reset clears result`);
    assert.ok((await page.locator(".frs-status").textContent()).includes("réinitialisé"), `${app.id}: reset status`);
    await page.getByRole("button", {name:app.submit}).click();
    assert.strictEqual(await page.locator(".frs-results").getAttribute("data-visible"), "true", `${app.id}: recalculates after reset`);
    const invalidControl=app.id==="cctv-cost"?"#cameras":app.id==="home-security-cost"?"#securityLevel":app.id==="data-breach-cost"?"#records":app.id==="fire-safety-checklist"?"#area":null;
    if(invalidControl){
      if(app.id==="home-security-cost"){
        await page.locator(invalidControl).evaluate((control)=>{var option=document.createElement("option");option.value="XX";option.textContent="Invalide";option.selected=true;control.appendChild(option);});
      }else{
        await page.locator(invalidControl).fill("0");
      }
      await page.getByRole("button", {name:app.submit}).click();
      assert.strictEqual(await page.locator(".frs-results").getAttribute("data-visible"), "false", `${app.id}: valid-to-invalid clears stale result`);
      if(app.id==="home-security-cost")assert.ok((await page.locator(".frs-status").textContent()).includes("niveau de protection"), "Home Security reports invalid canonical selection in French");
      await page.getByRole("button", {name:"Réinitialiser"}).click();
      await page.getByRole("button", {name:app.submit}).click();
    }
    const invalidData = app.id === "cctv-cost"
      ? { recorder: "XX" }
      : app.id === "home-security-cost"
        ? { securityLevel: "XX" }
        : { country: "XX" };
    await page.locator("[data-import-file]").setInputFiles({
      name: "scenario-invalide.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, app: app.id, locale: "fr", data: invalidData })),
    });
    await page.waitForFunction(() => document.querySelector(".frs-status")?.textContent.includes("option inconnue"));
    assert.ok((await page.locator(".frs-status").textContent()).includes("option inconnue"), `${app.id}: corrupt import`);
    assert.strictEqual(await page.locator(".frs-results").getAttribute("data-visible"), "false", `${app.id}: corrupt import clears stale result`);
    await page.getByRole("button", { name: app.submit }).click();
    assert.strictEqual(await page.locator(".frs-results").getAttribute("data-visible"), "true", `${app.id}: recalculation after rejected import`);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exporter JSON" }).click();
    const download = await downloadPromise;
    assert.strictEqual(download.suggestedFilename(), `afrotools-${app.id}-fr.json`, `${app.id}: export filename`);
    const path = await download.path();
    assert.ok(path && fs.existsSync(path), `${app.id}: export file`);
    const exportBuffer = fs.readFileSync(path);
    const payload = JSON.parse(exportBuffer.toString("utf8"));
    assert.strictEqual(payload.app, app.id, `${app.id}: export app`);
    assert.strictEqual(payload.locale, "fr", `${app.id}: export locale`);
    const reopenContext = await browser.newContext({ viewport: { width: 375, height: 900 }, acceptDownloads: true });
    const reopenPage = await reopenContext.newPage();
    const reopenState = watch(reopenPage);
    await reopenPage.goto(`${BASE_URL}${app.route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await reopenPage.locator("[data-import-file]").setInputFiles({
      name: download.suggestedFilename(),
      mimeType: "application/json",
      buffer: exportBuffer,
    });
    await reopenPage.waitForFunction(() => document.querySelector(".frs-status")?.textContent.includes("rouvert"));
    assert.ok((await reopenPage.locator(".frs-status").textContent()).includes("rouvert"), `${app.id}: reopen in fresh browser context`);
    assert.strictEqual(await reopenPage.locator(".frs-results").getAttribute("data-visible"), "true", `${app.id}: fresh-context recalculation`);
    const reopenDownloadPromise = reopenPage.waitForEvent("download");
    await reopenPage.getByRole("button", { name: "Exporter JSON" }).click();
    const reopenDownload = await reopenDownloadPromise;
    const reopenPath = await reopenDownload.path();
    assert.ok(reopenPath && fs.existsSync(reopenPath), `${app.id}: reopened export file`);
    const reopenedPayload = JSON.parse(fs.readFileSync(reopenPath, "utf8"));
    assert.deepStrictEqual(reopenedPayload.data, payload.data, `${app.id}: fresh-context JSON data fidelity`);
    await assertClean(reopenState, `${app.id} fresh-context JSON reopen`);
    await reopenContext.close();
    await assertPrintPdf(page, "[data-print]", app.id);
  }
  await assertClean(state, `${app.id} workflow`);
  await context.close();
  console.log(`PASS workflow: ${app.id}`);
}

async function checkFireEquality(browser) {
  const fixtures = [
    { checks:["c1","c2","c3","c4","c5","c16"], score:"41/100" },
    { checks:["c1","c3","c5","c7","c9","c11","c13","c15","c17"], score:"51/100" },
    { checks:["c2","c6","c8","c10","c12"], score:"37/100" },
  ];
  const english = await browser.newPage({ viewport: { width: 375, height: 900 } });
  const french = await browser.newPage({ viewport: { width: 375, height: 900 } });
  const englishState = watch(english);
  const frenchState = watch(french);
  try {
    await Promise.all([
      english.goto(`${BASE_URL}/tools/fire-safety-checklist/`, { waitUntil:"domcontentloaded", timeout:30000 }),
      french.goto(`${BASE_URL}/fr/tools/checklist-securite-incendie/`, { waitUntil:"domcontentloaded", timeout:30000 }),
    ]);
    for (const fixture of fixtures) {
      await english.locator('input[id^="c"][type="checkbox"]').evaluateAll((controls) => controls.forEach((control) => { control.checked = false; }));
      await french.locator('input[name="checks"]').evaluateAll((controls) => controls.forEach((control) => { control.checked = false; }));
      for (const id of fixture.checks) {
        await english.locator(`#${id}`).evaluate((control) => {
          control.checked = true;
          control.dispatchEvent(new Event("change", { bubbles: true }));
        });
        await french.locator(`input[name="checks"][value="${id}"]`).evaluate((control) => {
          control.checked = true;
          control.dispatchEvent(new Event("change", { bubbles: true }));
        });
      }
      await english.getByRole("button", { name:"Score Fire Safety Readiness" }).click();
      await french.getByRole("button", { name:"Évaluer la préparation" }).click();
      assert.strictEqual(await english.locator("#complianceScore").textContent(), fixture.score, `English Fire subset ${fixture.checks.join(",")}`);
      assert.strictEqual(await french.locator(".frs-result-value").textContent(), fixture.score, `French Fire subset ${fixture.checks.join(",")}`);
    }
    await assertClean(englishState, "English Fire equality");
    await assertClean(frenchState, "French Fire equality");
  } finally {
    await Promise.all([english.close(), french.close()]);
  }
  console.log("PASS Fire: shared engine subset equality 41/51/37");
}

function displayedInteger(text) {
  return Number(String(text || "").replace(/[^\d]/g, ""));
}

async function checkHomeEquality(browser) {
  const englishContext = await browser.newContext({ viewport: { width: 375, height: 900 } });
  const frenchContext = await browser.newContext({ viewport: { width: 375, height: 900 } });
  const english = await englishContext.newPage();
  const french = await frenchContext.newPage();
  const englishState = watch(english);
  const frenchState = watch(french);
  const fixtures = [
    { country:"NG", homeType:"bungalow", riskLevel:"medium", securityLevel:"standard" },
    { country:"NG", homeType:"flat", riskLevel:"low", securityLevel:"basic" },
    { country:"KE", homeType:"mansion", riskLevel:"high", securityLevel:"premium" },
  ];
  try {
    await Promise.all([
      english.goto(`${BASE_URL}/tools/home-security-cost/`, { waitUntil:"domcontentloaded", timeout:30000 }),
      french.goto(`${BASE_URL}/fr/tools/cout-securite-maison/`, { waitUntil:"domcontentloaded", timeout:30000 }),
    ]);
    await assertHomeControlContract(french);
    const englishControls = await english.locator(".en-tool-layout").evaluate(() =>
      ["country","homeType","riskLevel","securityLevel"].map((id) => {
        const control=document.getElementById(id);
        return {id,defaultValue:control.value,values:Array.from(control.options,(option)=>option.value)};
      })
    );
    assert.deepStrictEqual(englishControls, HOME_SECURITY.CONTROL_CONTRACT, "English Home Security DOM matches its shared contract");
    for (const fixture of fixtures) {
      for (const [id, value] of Object.entries(fixture)) {
        await Promise.all([english.locator(`#${id}`).selectOption(value), french.locator(`#${id}`).selectOption(value)]);
      }
      await Promise.all([
        english.getByRole("button", { name:"Calculate Security Costs" }).click(),
        french.getByRole("button", { name:"Calculer les coûts" }).click(),
      ]);
      const expected = HOME_SECURITY.calculate(fixture);
      const englishValues = {
        setup: displayedInteger(await english.locator("#setupCost").textContent()),
        monthly: displayedInteger(await english.locator("#monthlyRunning").textContent()),
        annual: displayedInteger(await english.locator("#annualCost").textContent()),
      };
      const frenchValues = {
        setup: displayedInteger(await french.locator(".frs-result-value").textContent()),
        monthly: displayedInteger(await french.locator(".frs-result-note").textContent()),
        annual: displayedInteger(await french.locator(".frs-result-hero strong").textContent()),
        fiveYear: displayedInteger(await french.locator(".frs-metric").filter({hasText:"Total sur 5 ans"}).locator("strong").textContent()),
      };
      const expectedValues = {
        setup: Math.round(expected.totalSetup),
        monthly: Math.round(expected.totalMonthly),
        annual: Math.round(expected.annualCost),
      };
      assert.deepStrictEqual(englishValues, expectedValues, `English Home Security canonical result ${JSON.stringify(fixture)}`);
      assert.deepStrictEqual(
        frenchValues,
        Object.assign({ fiveYear:Math.round(expected.fiveYear) }, expectedValues),
        `French Home Security exact result parity ${JSON.stringify(fixture)}`
      );
    }
    await assertClean(englishState, "English Home Security equality");
    await assertClean(frenchState, "French Home Security equality");
  } finally {
    await Promise.all([englishContext.close(), frenchContext.close()]);
  }
  console.log("PASS Home Security: exact four-control DOM and three English/French formula fixtures");
}

(async () => {
  const ownedServer = await startOwnedServer();
  const browser = await chromium.launch({ headless: true, timeout: 60000 });
  try {
    await checkHub(browser);
    await checkFireEquality(browser);
    await checkHomeEquality(browser);
    for (const app of APPS) {
      const viewportMatrix = app.id === "home-security-cost"
        ? [[320, 1], [375, 1], [320, 2], [375, 2]]
        : [[320, 1], [375, 1], [320, 2]];
      for (const [width, textScale] of viewportMatrix) {
        const page = await browser.newPage();
        try {
          await checkBase(page, app, width, textScale);
        } finally {
          await page.close();
        }
      }
      console.log(`PASS viewport: ${app.id} 320/375${app.id === "home-security-cost" ? " at exact 16px->32px" : "/200%"} themes/a11y/SEO/privacy`);
      await checkWorkflow(browser, app);
    }
  } finally {
    await browser.close();
    if (ownedServer) {
      ownedServer.kill();
      await new Promise((resolve) => {
        if (ownedServer.exitCode !== null) return resolve();
        ownedServer.once("exit", resolve);
        setTimeout(resolve, 3000);
      });
    }
  }
  console.log("French Security browser proof passed: hub + 7/7 apps.");
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
