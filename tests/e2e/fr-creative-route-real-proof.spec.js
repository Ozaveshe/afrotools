const { expect, test } = require("@playwright/test");

const VIEWPORT = Object.freeze({ width: 320, height: 900 });
const BASELINE_ROOT_FONT_PX = 16;
const HUB_ROUTE = "/fr/creative/";
const THEME_MODES = Object.freeze(["light", "manual-dark", "system-dark"]);

// Independent expected-route inventory. Production route-map output is not
// used to decide which physical French pages receive acceptance credit.
const OWNERS = Object.freeze([
  ["african-palette", "palette-couleurs-africaines"],
  ["afrostream", "afrostream-afrique-s-createur-streaming-hub"],
  ["art-commission", "prix-commande-art"],
  ["book-publishing-cost", "cout-publication-livre"],
  ["creator-analytics", "stats-createur"],
  ["creator-bios", "bio-createur"],
  ["creator-brand", "kit-de-marque-pour-createur"],
  ["creator-calendar", "calendrier-createur"],
  ["creator-canvas", "canevas-de-projet-pour-createur"],
  ["creator-captions", "legendes-createur"],
  ["creator-carousel", "createur-de-carrousel"],
  ["creator-clip", "decoupe-de-video-pour-createur"],
  ["creator-club", "club-des-createurs"],
  ["creator-course", "cours-pour-createurs"],
  ["creator-desk", "bureau-du-createur"],
  ["creator-hashtags", "hashtags-createur"],
  ["creator-hooks", "accroches-de-contenu-pour-createur"],
  ["creator-invoice", "facture-createur"],
  ["creator-kit", "kit-media-pour-createur"],
  ["creator-mail", "courriels-pour-createur"],
  ["creator-mind", "idees-de-contenu-pour-createur"],
  ["creator-money", "revenus-du-createur"],
  ["creator-page", "page-createur"],
  ["creator-polish", "amelioration-de-contenu-pour-createur"],
  ["creator-pricing", "tarification-pour-createur"],
  ["creator-record", "enregistrement-pour-createur"],
  ["creator-repurpose", "reutilisation-de-contenu-pour-createur"],
  ["creator-research", "recherche-de-contenu-pour-createur"],
  ["creator-resize", "redimensionnement-pour-createur"],
  ["creator-schedule", "planning-du-createur"],
  ["creator-scripts", "scripts-video-pour-createur"],
  ["creator-split", "repartition-des-revenus-entre-createurs"],
  ["creator-stock", "mediatheque-pour-createur"],
  ["creator-team", "equipe-du-createur"],
  ["creator-thumb", "miniature-pour-createur"],
  ["creator-titles", "titres-de-contenu-pour-createur"],
  ["creator-voice", "voix-de-marque-du-createur"],
  ["engagement-rate", "taux-engagement"],
  ["linkedin-optimizer", "optimiseur-linkedin"],
  ["music-royalty-splitter", "partage-redevances-musicales"],
  ["personal-brand-audit", "audit-marque-personnelle"],
  ["photography-pricing", "prix-seance-photo"],
  ["podcast-monetization", "monetisation-podcast"],
  ["self-publishing-royalty", "calculateur-de-droits-d-autoedition"],
  ["social-media-calendar", "calendrier-medias-sociaux"],
  ["wedding-photo-package", "forfait-photo-mariage"],
]);

const WORKSPACES = Object.freeze(
  OWNERS.filter(([englishId]) => englishId.startsWith("creator-"))
);

function localHost(url) {
  const parsed = new URL(url);
  return (
    (parsed.protocol === "http:" || parsed.protocol === "https:") &&
    (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost")
  );
}

function includesMarker(value, markers) {
  let payload = String(value || "");
  try {
    payload += `\n${decodeURIComponent(payload)}`;
  } catch {
    // The undecoded value remains part of the fail-closed marker scan.
  }
  return markers.some((marker) => payload.includes(marker));
}

async function waitForRouteProofReady(page) {
  await page.waitForFunction(() => {
    if (!document.documentElement.hasAttribute("data-fr-creative-surface")) {
      return false;
    }
    const customElements = [];
    const visit = (root) => {
      for (const element of root.querySelectorAll("*")) {
        if (element.shadowRoot) {
          customElements.push(element);
          visit(element.shadowRoot);
        }
      }
    };
    visit(document);
    return customElements.every((element) => {
      if (![
        "afro-navbar",
        "afro-footer",
        "afro-site-assistant",
        "afro-country-selector",
      ].includes(element.localName)) {
        return true;
      }
      return (
        element.hasAttribute("data-fr-creative-route-real-reflow") &&
        Boolean(
          element.shadowRoot.querySelector(
            "style[data-fr-creative-route-real-reflow]"
          )
        )
      );
    });
  });
}

async function openWithNetworkRecorder(page, route) {
  const allRequestEnvelopes = [];
  const consoleEntries = [];
  const pageErrors = [];
  const unauthorizedRequests = [];
  const activeMarkers = [];

  await page.addInitScript(() => {
    const proof = {
      storageMutations: [],
      historyMutations: [],
    };
    Object.defineProperty(window, "__frCreativePrivacyProof", {
      configurable: false,
      enumerable: false,
      value: proof,
      writable: false,
    });

    const storageOwner = (storage) => {
      try {
        if (storage === window.localStorage) return "localStorage";
        if (storage === window.sessionStorage) return "sessionStorage";
      } catch {
        return "unknownStorage";
      }
      return "unknownStorage";
    };
    for (const method of ["setItem", "removeItem", "clear"]) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function (...args) {
        proof.storageMutations.push({
          storage: storageOwner(this),
          method,
          key: args.length ? String(args[0]) : "",
          value: args.length > 1 ? String(args[1]) : "",
        });
        return original.apply(this, args);
      };
    }
    for (const method of ["pushState", "replaceState"]) {
      const original = history[method].bind(history);
      history[method] = function (state, title, url) {
        proof.historyMutations.push({
          method,
          state: state == null ? "" : JSON.stringify(state),
          title: String(title || ""),
          url: url == null ? "" : new URL(String(url), location.href).href,
        });
        return original(state, title, url);
      };
    }
    try {
      localStorage.setItem("afrotools_cookie_consent", "declined");
    } catch {
      // The strict request interceptor remains the fail-closed boundary.
    }
  });

  page.on("console", (message) => {
    consoleEntries.push({ type: message.type(), text: message.text() });
  });
  page.on("pageerror", (error) => {
    pageErrors.push(String(error && error.stack ? error.stack : error));
  });

  await page.route("**/*", async (intercepted) => {
    const request = intercepted.request();
    let headers = {};
    try {
      headers = await request.allHeaders();
    } catch {
      headers = request.headers();
    }
    const envelope = {
      method: request.method().toUpperCase(),
      resourceType: request.resourceType(),
      url: request.url(),
      query: new URL(request.url()).search,
      body: request.postData() || "",
      headers,
    };
    allRequestEnvelopes.push(envelope);
    if (localHost(envelope.url)) {
      await intercepted.continue();
      return;
    }
    unauthorizedRequests.push(envelope);
    await intercepted.abort("blockedbyclient");
  });

  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  expect(response && response.status(), `${route} must be served as a real local route`).toBe(200);
  await expect(page.locator("body")).toBeVisible();
  await waitForRouteProofReady(page);

  return {
    allRequestEnvelopes,
    activeMarkers,
    consoleEntries,
    pageErrors,
    unauthorizedRequests,
  };
}

async function readPrivacySurfaces(page) {
  return page.evaluate(() => {
    const readStorage = (storage) => {
      const values = {};
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        values[key] = storage.getItem(key);
      }
      return values;
    };
    let local = {};
    let session = {};
    try {
      local = readStorage(localStorage);
      session = readStorage(sessionStorage);
    } catch {
      // An inaccessible storage surface stays represented by an empty object.
    }
    return {
      location: {
        href: location.href,
        search: location.search,
        hash: location.hash,
      },
      cookie: document.cookie,
      localStorage: local,
      sessionStorage: session,
      probe: window.__frCreativePrivacyProof || {
        storageMutations: [],
        historyMutations: [],
      },
    };
  });
}

async function assertFailClosedPrivacy(page, route, network) {
  const surfaces = await readPrivacySurfaces(page);
  const markerRequests = network.allRequestEnvelopes.filter((envelope) =>
    includesMarker(JSON.stringify(envelope), network.activeMarkers)
  );
  const markerStorage = [
    ...surfaces.probe.storageMutations,
    surfaces.localStorage,
    surfaces.sessionStorage,
    surfaces.cookie,
  ].filter((entry) => includesMarker(JSON.stringify(entry), network.activeMarkers));
  const markerHistoryOrLocation = [
    surfaces.location,
    ...surfaces.probe.historyMutations,
  ].filter((entry) => includesMarker(JSON.stringify(entry), network.activeMarkers));
  const markerConsole = [
    ...network.consoleEntries,
    ...network.pageErrors,
  ].filter((entry) => includesMarker(JSON.stringify(entry), network.activeMarkers));

  expect(
    network.unauthorizedRequests,
    `${route} must issue zero unauthorized requests across every HTTP method`
  ).toEqual([]);
  expect(
    markerRequests,
    `${route} must keep markers out of full URL, query, body, and headers`
  ).toEqual([]);
  expect(
    markerHistoryOrLocation,
    `${route} must keep markers out of URL query/hash and history state`
  ).toEqual([]);
  expect(
    markerStorage,
    `${route} must keep synthetic sensitive markers out of storage`
  ).toEqual([]);
  expect(
    markerConsole,
    `${route} must keep synthetic sensitive markers out of console and errors`
  ).toEqual([]);
}

async function readRecursiveOverflowAudit(page) {
  return page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const composedParent = (node) => {
      if (node.parentElement) return node.parentElement;
      const root = node.getRootNode();
      return root instanceof ShadowRoot ? root.host : null;
    };
    const excluded = (element) => {
      for (let current = element; current; current = composedParent(current)) {
        const style = getComputedStyle(current);
        if (
          current.hidden
          || current.inert
          || style.display === "none"
          || style.visibility === "hidden"
          || style.visibility === "collapse"
          || style.contentVisibility === "hidden"
          || (
            Number.parseFloat(style.opacity || "1") === 0
            && style.pointerEvents === "none"
          )
        ) return true;
      }
      return false;
    };
    const localSelector = (element) => {
      const id = element.id ? `#${element.id}` : "";
      const classes = element.classList.length
        ? `.${Array.from(element.classList).slice(0, 3).join(".")}`
        : "";
      return `${element.tagName.toLowerCase()}${id}${classes}`;
    };
    const entries = [];
    const walk = (root, prefix) => {
      for (const element of root.children) {
        const path = prefix ? `${prefix} >>> ${localSelector(element)}` : localSelector(element);
        entries.push({ element, path });
        if (element.shadowRoot) walk(element.shadowRoot, path);
        walk(element, prefix);
      }
    };
    walk(document.body, "");

    const controls = new Set(entries
      .map(({ element }) => element)
      .filter((element) => element.matches(
        "button, input, select, textarea, a[href], [role='button'], [contenteditable='true']"
      )));
    const rectOverflow = [];
    const elementOverflow = [];
    const controlOverflow = [];
    const textOverflow = [];

    for (const { element, path } of entries) {
      if (excluded(element)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0 || rect.bottom <= 0) continue;
      const data = {
        selector: path,
        left: Number(rect.left.toFixed(2)),
        right: Number(rect.right.toFixed(2)),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      };
      if (rect.left < -0.5 || rect.right > viewportWidth + 0.5) {
        (controls.has(element) ? controlOverflow : rectOverflow).push(data);
      }

      const style = getComputedStyle(element);
      const containsOwnOverflow =
        !controls.has(element)
        && element.clientWidth > 0
        && element.scrollWidth > element.clientWidth + 1
        && !["auto", "scroll"].includes(style.overflowX);
      if (containsOwnOverflow) elementOverflow.push(data);

      for (const node of element.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const textRect of range.getClientRects()) {
          if (textRect.width <= 0 || textRect.height <= 0) continue;
          let clippingAncestor = null;
          for (
            let ancestor = element;
            ancestor;
            ancestor = composedParent(ancestor)
          ) {
            const ancestorStyle = getComputedStyle(ancestor);
            if (["hidden", "clip"].includes(ancestorStyle.overflowX)) {
              const ancestorRect = ancestor.getBoundingClientRect();
              if (
                textRect.left < ancestorRect.left - 0.5
                || textRect.right > ancestorRect.right + 0.5
              ) {
                clippingAncestor = localSelector(ancestor);
                break;
              }
            }
          }
          if (
            textRect.left < -0.5
            || textRect.right > viewportWidth + 0.5
            || clippingAncestor
          ) {
            textOverflow.push({
              selector: `${path}::text`,
              clippingAncestor,
              left: Number(textRect.left.toFixed(2)),
              right: Number(textRect.right.toFixed(2)),
              text: node.textContent.trim().replace(/\s+/g, " ").slice(0, 80),
            });
          }
        }
      }
    }

    return {
      clientWidth: document.documentElement.clientWidth,
      controlOverflow: controlOverflow.slice(0, 20),
      documentOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      elementOverflow: elementOverflow.slice(0, 20),
      innerWidth: window.innerWidth,
      rectOverflow: rectOverflow.slice(0, 20),
      rootFontPx: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
      textOverflow: textOverflow.slice(0, 20),
      visualViewportWidth: window.visualViewport ? window.visualViewport.width : window.innerWidth,
    };
  });
}

function assertAuditResult(audit, route, phase, expectedRootFontPx) {
  expect(audit.rootFontPx, `${route} ${phase} computed root size`).toBe(expectedRootFontPx);
  expect(audit.innerWidth, `${route} ${phase} window width must remain real 320px`).toBe(
    VIEWPORT.width
  );
  expect(audit.clientWidth, `${route} ${phase} document width must remain real 320px`).toBe(
    VIEWPORT.width
  );
  expect(
    audit.visualViewportWidth,
    `${route} ${phase} visual viewport must remain real 320px`
  ).toBe(VIEWPORT.width);
  expect(
    {
      controlOverflow: audit.controlOverflow,
      documentOverflow: audit.documentOverflow,
      elementOverflow: audit.elementOverflow,
      rectOverflow: audit.rectOverflow,
      textOverflow: audit.textOverflow,
    },
    `${route} ${phase} recursive exact 200% overflow audit`
  ).toEqual({
    controlOverflow: [],
    documentOverflow: 0,
    elementOverflow: [],
    rectOverflow: [],
    textOverflow: [],
  });
}

async function assertExactDoubleTextAndNoOverflow(page, route, phase = "initial") {
  expect(page.viewportSize()).toEqual(VIEWPORT);

  const baseline = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    innerWidth: window.innerWidth,
    rootFontPx: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
    visualViewportWidth: window.visualViewport ? window.visualViewport.width : window.innerWidth,
  }));

  expect(baseline.rootFontPx, `${route} must keep the verified 16px root baseline`).toBe(
    BASELINE_ROOT_FONT_PX
  );
  expect(baseline.innerWidth, `${route} baseline window width`).toBe(VIEWPORT.width);
  expect(baseline.clientWidth, `${route} baseline document width`).toBe(VIEWPORT.width);
  expect(baseline.visualViewportWidth, `${route} baseline visual viewport width`).toBe(
    VIEWPORT.width
  );

  await page.evaluate((rootFontPx) => {
    document.documentElement.style.setProperty(
      "font-size",
      `${rootFontPx * 2}px`,
      "important"
    );
  }, baseline.rootFontPx);
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
  await waitForRouteProofReady(page);

  const expectedRootFontPx = baseline.rootFontPx * 2;
  assertAuditResult(
    await readRecursiveOverflowAudit(page),
    route,
    phase,
    expectedRootFontPx
  );
  return expectedRootFontPx;
}

async function readComputedContrastAudit(page) {
  return page.evaluate(() => {
    const parseColor = (value) => {
      const match = String(value || "").match(
        /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)/i
      );
      if (!match) return null;
      return [
        Number(match[1]),
        Number(match[2]),
        Number(match[3]),
        match[4] == null ? 1 : Number(match[4]),
      ];
    };
    const blend = (foreground, background) => {
      const alpha = foreground[3] + background[3] * (1 - foreground[3]);
      if (alpha === 0) return [0, 0, 0, 0];
      return [
        ((foreground[0] * foreground[3]) +
          (background[0] * background[3] * (1 - foreground[3]))) /
          alpha,
        ((foreground[1] * foreground[3]) +
          (background[1] * background[3] * (1 - foreground[3]))) /
          alpha,
        ((foreground[2] * foreground[3]) +
          (background[2] * background[3] * (1 - foreground[3]))) /
          alpha,
        alpha,
      ];
    };
    const luminance = (color) => {
      const channels = color.slice(0, 3).map((channel) => {
        const value = channel / 255;
        return value <= 0.04045
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4;
      });
      return (
        (0.2126 * channels[0]) +
        (0.7152 * channels[1]) +
        (0.0722 * channels[2])
      );
    };
    const contrast = (left, right) => {
      const first = luminance(left);
      const second = luminance(right);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    };
    const composedParent = (node) => {
      if (node.parentElement) return node.parentElement;
      const root = node.getRootNode();
      return root instanceof ShadowRoot ? root.host : null;
    };
    const selector = (element) => {
      const id = element.id ? `#${element.id}` : "";
      const classes = element.classList.length
        ? `.${Array.from(element.classList).slice(0, 2).join(".")}`
        : "";
      return `${element.tagName.toLowerCase()}${id}${classes}`;
    };
    const excluded = (element) => {
      for (let current = element; current; current = composedParent(current)) {
        const style = getComputedStyle(current);
        const rect = current.getBoundingClientRect();
        if (
          current.hidden ||
          current.inert ||
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.visibility === "collapse" ||
          Number.parseFloat(style.opacity || "1") === 0 ||
          rect.width <= 0 ||
          rect.height <= 0
        ) return true;
      }
      return false;
    };
    const effectiveBackground = (element) => {
      const layers = [];
      for (let current = element; current; current = composedParent(current)) {
        const style = getComputedStyle(current);
        const color = parseColor(style.backgroundColor);
        if (color && color[3] > 0) layers.push(color);
      }
      let result = [255, 255, 255, 1];
      for (const layer of layers.reverse()) result = blend(layer, result);
      return result;
    };
    const entries = [];
    const walk = (root, path = "") => {
      for (const element of root.children) {
        const nextPath = path ? `${path} >>> ${selector(element)}` : selector(element);
        entries.push({ element, path: nextPath });
        if (element.shadowRoot) walk(element.shadowRoot, nextPath);
        walk(element, path);
      }
    };
    walk(document.body);

    const failures = [];
    let textSamples = 0;
    let controlSamples = 0;
    for (const { element, path } of entries) {
      if (excluded(element)) continue;
      const style = getComputedStyle(element);
      const directText = Array.from(element.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent)
        .join(" ")
        .trim();
      const isTextControl = element.matches(
        "button, [role='button'], input:not([type='hidden']), select, textarea"
      );
      if (directText || isTextControl) {
        const foreground = parseColor(style.color);
        const background = effectiveBackground(element);
        if (!foreground) {
          failures.push({ path, issue: "unparsed foreground", value: style.color });
        } else {
          const ratio = contrast(blend(foreground, background), background);
          const fontSize = Number.parseFloat(style.fontSize);
          const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
          const large = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
          const minimum = large ? 3 : 4.5;
          textSamples += 1;
          if (ratio + 0.01 < minimum) {
            failures.push({
              path,
              issue: "text contrast",
              ratio: Number(ratio.toFixed(2)),
              minimum,
              text: (directText || element.value || element.getAttribute("aria-label") || "")
                .replace(/\s+/g, " ")
                .slice(0, 80),
            });
          }
        }
      }

      if (isTextControl) {
        const border = parseColor(style.borderTopColor);
        const background = effectiveBackground(composedParent(element) || document.body);
        if (border) {
          const ratio = contrast(blend(border, background), background);
          controlSamples += 1;
          if (ratio + 0.01 < 3) {
            failures.push({
              path,
              issue: "control boundary contrast",
              ratio: Number(ratio.toFixed(2)),
              minimum: 3,
            });
          }
        }
      }

      if (
        element.matches("input, textarea") &&
        element.placeholder &&
        !element.value
      ) {
        const placeholder = getComputedStyle(element, "::placeholder");
        const foreground = parseColor(placeholder.color);
        const background = effectiveBackground(element);
        if (foreground) {
          const ratio = contrast(blend(foreground, background), background);
          textSamples += 1;
          if (ratio + 0.01 < 4.5) {
            failures.push({
              path: `${path}::placeholder`,
              issue: "placeholder contrast",
              ratio: Number(ratio.toFixed(2)),
              minimum: 4.5,
            });
          }
        }
      }
    }

    return {
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
      controlSamples,
      failures: failures.slice(0, 40),
      textSamples,
    };
  });
}

async function setThemeMode(page, mode) {
  await page.emulateMedia({
    colorScheme: mode === "system-dark" ? "dark" : "light",
    reducedMotion: "reduce",
  });
  await page.evaluate((nextMode) => {
    document.documentElement.style.removeProperty("font-size");
    try {
      if (nextMode === "manual-dark") localStorage.setItem("aft_theme", "dark");
      else if (nextMode === "light") localStorage.setItem("aft_theme", "light");
      else localStorage.removeItem("aft_theme");
    } catch {
      // The route still receives an explicit DOM theme below.
    }
  }, mode);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.evaluate((nextMode) => {
    document.documentElement.style.removeProperty("font-size");
    if (nextMode === "manual-dark") document.documentElement.dataset.theme = "dark";
    else if (nextMode === "light") document.documentElement.dataset.theme = "light";
    else document.documentElement.removeAttribute("data-theme");
  }, mode);
  await waitForRouteProofReady(page);
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

async function assertComputedContrastInEveryTheme(page, route) {
  for (const mode of THEME_MODES) {
    await setThemeMode(page, mode);
    const audit = await readComputedContrastAudit(page);
    expect(
      audit.textSamples,
      `${route} ${mode} must inspect rendered text contrast`
    ).toBeGreaterThan(0);
    expect(
      audit.controlSamples,
      `${route} ${mode} must inspect rendered control contrast`
    ).toBeGreaterThanOrEqual(0);
    expect(
      audit.failures,
      `${route} ${mode} comprehensive computed contrast`
    ).toEqual([]);
    expect(
      audit.colorScheme.includes(mode === "light" ? "light" : "dark"),
      `${route} ${mode} computed color scheme`
    ).toBe(true);
  }
}

async function performSensitiveInputAction(page, englishId, network) {
  const markerBase = `FR-CREATIVE-PROOF-${englishId}`;
  network.activeMarkers.push(markerBase);

  if (englishId === "creator-clip" || englishId === "creator-resize") {
    const file = page.locator("input[type='file']").first();
    await expect(file, `${englishId} must expose its local file input`).toHaveCount(1);
    const isResize = englishId === "creator-resize";
    await file.setInputFiles({
      name: `${markerBase}.${isResize ? "png" : "webm"}`,
      mimeType: isResize ? "image/png" : "video/webm",
      buffer: isResize
        ? Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZrS8AAAAASUVORK5CYII=",
          "base64"
        )
        : Buffer.from("synthetic local WebM proof input"),
    });
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 25)));
    return;
  }

  if (englishId === "creator-record") {
    const microphonePreference = page.locator("#micToggle");
    await expect(microphonePreference).toBeVisible();
    await microphonePreference.click();
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 25)));
    return;
  }

  const root = page.locator("main").first();
  const scope = await root.count() ? root : page.locator("body");
  const candidates = scope.locator(
    "textarea:not([disabled]):not([readonly]), "
      + "[contenteditable='true'], "
      + "select:not([disabled]), "
      + "input:not([disabled]):not([readonly])"
      + ":not([type='hidden']):not([type='file']):not([type='button'])"
      + ":not([type='submit']):not([type='reset']):not([type='checkbox'])"
      + ":not([type='radio']):not([type='color'])"
  );

  let control = null;
  for (let index = 0; index < await candidates.count(); index += 1) {
    const candidate = candidates.nth(index);
    if (await candidate.isVisible()) {
      control = candidate;
      break;
    }
  }
  expect(control, `${englishId} must expose a visible sensitive-input control`).not.toBeNull();

  const type = ((await control.getAttribute("type")) || "text").toLowerCase();
  let value = `${markerBase}-SYNTHETIC`;
  if (type === "email") value = `${markerBase.toLowerCase()}@example.invalid`;
  if (type === "url") value = `https://example.invalid/${markerBase.toLowerCase()}`;
  if (type === "tel") value = "+221700000000";
  if (type === "number") value = "7";
  if (type === "date") value = "2026-08-19";
  if (type === "time") value = "10:30";
  if (type === "datetime-local") value = "2026-08-19T10:30";

  if (value.includes(markerBase)) network.activeMarkers.push(value);

  if (await control.evaluate((element) => element.tagName === "SELECT")) {
    const optionValues = await control.locator("option").evaluateAll((options) =>
      options.map((option) => option.value).filter(Boolean)
    );
    expect(optionValues.length, `${englishId} representative select needs a real option`).toBeGreaterThan(0);
    await control.selectOption(optionValues[Math.min(1, optionValues.length - 1)]);
  } else if (type === "range") {
    await control.evaluate((element) => {
      const min = Number(element.min || 0);
      const max = Number(element.max || 100);
      element.value = String(min + ((max - min) / 2));
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
  } else if (await control.getAttribute("contenteditable") === "true") {
    await control.fill(value);
  } else {
    await control.fill(value);
    await expect(control).toHaveValue(value);
  }
  await control.press("Tab");
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 25)));
}

test.beforeAll(() => {
  expect(OWNERS).toHaveLength(46);
  expect(new Set(OWNERS.map(([englishId]) => englishId)).size).toBe(46);
  expect(new Set(OWNERS.map(([, frenchSlug]) => frenchSlug)).size).toBe(46);
  expect(WORKSPACES).toHaveLength(33);
});

test("French Creative hub is a real native 80-surface category route", async ({
  page,
}) => {
  await page.setViewportSize(VIEWPORT);
  const network = await openWithNetworkRecorder(page, HUB_ROUTE);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.locator(".creative-card")).toHaveCount(46);
  await expect(page.locator(".creative-counts")).toContainText("33");
  await expect(page.locator(".creative-counts")).toContainText("80");
  await assertExactDoubleTextAndNoOverflow(page, HUB_ROUTE);
  await assertFailClosedPrivacy(page, HUB_ROUTE, network);
  await assertComputedContrastInEveryTheme(page, HUB_ROUTE);
  await assertFailClosedPrivacy(page, HUB_ROUTE, network);
});

for (const [englishId, frenchSlug] of OWNERS) {
  const route = `/fr/tools/${frenchSlug}/`;
  test(`${englishId}: real French launcher doubles 16px to 32px at a fixed 320px viewport`, async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORT);
    const network = await openWithNetworkRecorder(page, route);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator("h1").first()).toBeVisible();
    await assertExactDoubleTextAndNoOverflow(page, route);
    await assertFailClosedPrivacy(page, route, network);
    await assertComputedContrastInEveryTheme(page, route);
    await assertFailClosedPrivacy(page, route, network);
  });
}

for (const [englishId, frenchSlug] of WORKSPACES) {
  const route = `/fr/tools/${frenchSlug}/app`;
  test(`${englishId}: real French workspace keeps sensitive input local at exact 200% text`, async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORT);
    const network = await openWithNetworkRecorder(page, route);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    const expectedRootFontPx = await assertExactDoubleTextAndNoOverflow(
      page,
      route,
      "initial"
    );
    await performSensitiveInputAction(page, englishId, network);
    await page.evaluate(() => new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
    assertAuditResult(
      await readRecursiveOverflowAudit(page),
      route,
      "post-action",
      expectedRootFontPx
    );
    await assertFailClosedPrivacy(page, route, network);
    await assertComputedContrastInEveryTheme(page, route);
    await assertFailClosedPrivacy(page, route, network);
  });
}
