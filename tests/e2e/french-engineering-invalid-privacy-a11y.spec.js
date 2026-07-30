const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const manifest = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'reports/fr-engineering-construction-parity-manifest.json'),
  'utf8'
));
const missing = {
  afrodraft: '/fr/ingenierie/afrodraft/',
  'afroplan-floor-planner': '/fr/ingenierie/planificateur-etage/',
  'scaffolding-calc': '/fr/tools/calculateur-echafaudage/',
  'window-door-sizing': '/fr/tools/dimensionnement-fenetres-portes/',
  'plumbing-material': '/fr/tools/materiaux-plomberie/'
};
const rows = manifest.routes.map((row) => ({ ...row, french: row.french || missing[row.id] }));

async function getVisibleUnnamedControls(page) {
  return page.evaluate(() => {
    const pathFor = (element) => {
      const root = element.getRootNode();
      const host = root instanceof ShadowRoot ? `${root.host.tagName.toLowerCase()}::shadow ` : '';
      return `${host}${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}`;
    };
    const hasName = (control) => {
      if ((control.getAttribute('aria-label') || '').trim()) return true;
      const labelledBy = (control.getAttribute('aria-labelledby') || '').trim().split(/\s+/).filter(Boolean);
      if (labelledBy.length) {
        const root = control.getRootNode();
        const text = labelledBy.map((id) => {
          const node = typeof root.getElementById === 'function'
            ? root.getElementById(id)
            : document.getElementById(id);
          return node ? node.textContent.trim() : '';
        }).join(' ').trim();
        if (text) return true;
      }
      if (control.labels && Array.from(control.labels).some(label => label.textContent.trim())) return true;
      if (control.tagName === 'BUTTON' && control.textContent.trim()) return true;
      if (control.tagName === 'INPUT' && /^(?:button|submit|reset)$/i.test(control.type) && control.value.trim()) {
        return true;
      }
      return Boolean((control.getAttribute('title') || '').trim());
    };
    const visible = (control) => {
      if (control.type === 'hidden' || control.disabled) return false;
      const style = getComputedStyle(control);
      const rect = control.getBoundingClientRect();
      return style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        Number.parseFloat(style.opacity || '1') > 0 &&
        rect.width > 0 &&
        rect.height > 0;
    };
    const unnamed = [];
    const inspect = (root) => {
      root.querySelectorAll('input,select,textarea,button').forEach((control) => {
        if (visible(control) && !hasName(control)) {
          unnamed.push({ path: pathFor(control), html: control.outerHTML.slice(0, 400) });
        }
      });
      root.querySelectorAll('*').forEach((element) => {
        if (element.shadowRoot) inspect(element.shadowRoot);
      });
    };
    inspect(document);
    return unnamed;
  });
}

async function getReopenedReflowReceipt(page, width, rootSize) {
  await page.setViewportSize({ width, height: 812 });
  await page.evaluate((size) => {
    document.documentElement.style.setProperty(
      'font-size',
      `${size}px`,
      'important'
    );
  }, rootSize);
  await page.evaluate(() => new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  ));
  return page.evaluate(({ viewportWidth, requestedRoot }) => {
    const composedParent = (element) => {
      if (element.parentElement) return element.parentElement;
      const root = element.getRootNode();
      return root instanceof ShadowRoot ? root.host : null;
    };
    const excluded = (element) => {
      for (let current = element; current; current = composedParent(current)) {
        const style = getComputedStyle(current);
        if (
          current.hasAttribute('hidden') ||
          current.hasAttribute('inert') ||
          (current.tagName === 'DIALOG' && !current.hasAttribute('open'))
        ) return true;
        if (
          Number.parseFloat(style.opacity || '1') === 0 &&
          style.pointerEvents === 'none'
        ) return true;
      }
      return false;
    };
    const pathFor = (element) => {
      const root = element.getRootNode();
      const host = root instanceof ShadowRoot
        ? `${root.host.tagName.toLowerCase()}::shadow `
        : '';
      const id = element.id ? `#${element.id}` : '';
      const classes = element.classList?.length
        ? `.${Array.from(element.classList).slice(0, 3).join('.')}`
        : '';
      return `${host}${element.tagName.toLowerCase()}${id}${classes}`;
    };
    const clipped = [];
    const inspect = (root) => {
      root.querySelectorAll('*').forEach((element) => {
        if (element.shadowRoot) inspect(element.shadowRoot);
        if (excluded(element)) return;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          rect.width <= 0 ||
          rect.height <= 0
        ) return;
        if (rect.left < -1 || rect.right > viewportWidth + 1) {
          clipped.push(pathFor(element));
        }
        Array.from(element.childNodes)
          .filter((node) => (
            node.nodeType === Node.TEXT_NODE &&
            /\S/.test(node.data || '')
          ))
          .forEach((node) => {
            const value = node.data || '';
            const range = document.createRange();
            range.setStart(node, value.search(/\S/));
            range.setEnd(node, value.search(/\s*$/));
            if (Array.from(range.getClientRects()).some((textRect) => (
              textRect.width > 0 &&
              (
                textRect.left < -1 ||
                textRect.right > viewportWidth + 1
              )
            ))) {
              clipped.push(`${pathFor(element)}::text`);
            }
            range.detach();
          });
      });
    };
    inspect(document.body);
    return {
      rootSize: Number.parseFloat(
        getComputedStyle(document.documentElement).fontSize
      ),
      requestedRoot,
      overflow: document.documentElement.scrollWidth - viewportWidth,
      clipped: Array.from(new Set(clipped)).slice(0, 24)
    };
  }, { viewportWidth: width, requestedRoot: rootSize });
}

async function getGuideContrastFailures(page) {
  return page.locator('.fr-engineering-native-guide').evaluate((guide) => {
    const parse = (value) => {
      const match = String(value).match(
        /rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\)/i
      );
      return match
        ? [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? 1 : Number(match[4])]
        : null;
    };
    const luminance = (rgb) => {
      const channels = rgb.slice(0, 3).map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const ratio = (foreground, background) => {
      const first = luminance(foreground);
      const second = luminance(background);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    };
    const backgroundFor = (element) => {
      for (let current = element; current; current = current.parentElement) {
        const color = parse(getComputedStyle(current).backgroundColor);
        if (color && color[3] >= 0.99) return color;
      }
      return [255, 255, 255, 1];
    };
    const pathFor = (element) => {
      const id = element.id ? `#${element.id}` : '';
      const classes = element.classList.length
        ? `.${Array.from(element.classList).slice(0, 2).join('.')}`
        : '';
      return `${element.tagName.toLowerCase()}${id}${classes}`;
    };
    return Array.from(guide.querySelectorAll('h2,h3,p,li,dt,dd,figcaption,summary,a,button,label'))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      })
      .map((element) => {
        const style = getComputedStyle(element);
        const foreground = parse(style.color);
        const background = backgroundFor(element);
        const value = foreground && ratio(foreground, background);
        const fontSize = Number.parseFloat(style.fontSize);
        const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
        const large = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
        return {
          path: pathFor(element),
          ratio: value ? Number(value.toFixed(2)) : 0,
          required: large ? 3 : 4.5
        };
      })
      .filter((entry) => entry.ratio < entry.required);
  });
}

for (const row of rows) {
  test(`${row.id} | ${row.french} fail-closed accessibility, reset, import, provenance and privacy receipt`, async ({ page }) => {
    test.setTimeout(180_000);
    const runtimeErrors = [];
    const writes = [];
    const aiRequests = [];
    const sockets = [];
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') {
        const location = message.location();
        runtimeErrors.push(`${message.text()}${location.url ? ` (${location.url})` : ''}`);
      }
    });
    page.on('response', (response) => {
      if (response.status() >= 400) runtimeErrors.push(`HTTP ${response.status()} ${response.url()}`);
    });
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (/\/(?:api|\.netlify\/functions)\/.*ai|ai-advisor/i.test(url.pathname)) {
        aiRequests.push(`${request.method()} ${url.pathname}`);
      }
      if (!/^(?:GET|HEAD|OPTIONS)$/i.test(request.method())) {
        writes.push(`${request.method()} ${url.origin}${url.pathname}`);
      }
    });
    page.on('websocket', (socket) => sockets.push(socket.url()));
    await page.addInitScript(() => {
      localStorage.setItem('afrotools_cookie_consent', 'declined');
      localStorage.setItem('afrotools_ai_consent', 'declined');
    });
    await page.route(/^https?:\/\//, async (route) => {
      const hostname = new URL(route.request().url()).hostname;
      if (hostname === '127.0.0.1') await route.continue();
      else await route.fulfill({ status: 204, body: '' });
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto(row.french, { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => Boolean(
      window.AfroToolsFrenchEngineeringAcceptance &&
      window.AfroToolsFrenchEngineeringAcceptance.ready
    ))).toBe(true);

    const numeric = page.locator('input[type="number"][min]').filter({ visible: true }).first();
    await expect(numeric, `${row.french} invalid-state owner`).toBeVisible();
    const initialValue = await numeric.inputValue();
    const controlId = await numeric.getAttribute('id');
    expect(controlId, `${row.french} reset/import control needs a stable id`).toBeTruthy();
    const min = Number(await numeric.getAttribute('min'));
    const max = Number(await numeric.getAttribute('max'));
    const invalidValue = Number.isFinite(min) ? min - Math.max(1, Math.abs(min) * 0.25) : -1;
    await numeric.fill(String(invalidValue));
    expect(
      await numeric.evaluate((input) => input.checkValidity()),
      `${row.french} accepts below-min input`
    ).toBe(false);

    const form = numeric.locator('xpath=ancestor::form[1]');
    if (await form.count()) {
      await form.evaluate((node) => node.requestSubmit());
    } else {
      const action = page.getByRole('button', { name: /Calculer|Estimer|Générer|Créer/i }).first();
      if (await action.count() && await action.isVisible()) await action.click();
    }
    const body = await page.locator('body').innerText();
    expect(body, `${row.french} emitted a non-finite invalid result`).not.toMatch(/\b(?:NaN|Infinity|undefined)\b/);
    expect(
      await numeric.evaluate((input) => input.matches(':invalid') || input.getAttribute('aria-invalid') === 'true')
    ).toBe(true);

    const reset = page.locator('[data-fr-engineering-reset]');
    await expect(reset, `${row.french} shared reset`).toBeVisible();
    await reset.click();
    await expect.poll(() => numeric.inputValue(), { message: `${row.french} reset value` }).toBe(initialValue);
    await expect(page.locator('[data-fr-engineering-runtime-status]')).toContainText('réinitialisé');

    const initialNumber = Number(initialValue);
    const importedValue = Number.isFinite(initialNumber)
      ? (Number.isFinite(max) && initialNumber + 1 > max
          ? Math.max(Number.isFinite(min) ? min : -Infinity, initialNumber - 1)
          : initialNumber + 1)
      : (Number.isFinite(min) ? min + 1 : 1);
    const importInput = page.locator('[data-fr-engineering-import]');
    await expect(importInput, `${row.french} local JSON reopen control`).toBeVisible();
    await importInput.setInputFiles({
      name: `${row.id}-etat-local.json`,
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({
        schema: 'afrotools-fr-engineering-local-export-v1',
        owner: row.id,
        route: row.french,
        inputs: { [controlId]: importedValue },
        result: ''
      }))
    });
    await expect.poll(() => numeric.inputValue(), { message: `${row.french} reopened value` })
      .toBe(String(importedValue));
    await expect(page.locator('[data-fr-engineering-runtime-status]')).toContainText('rouvert localement');

    for (const width of [320, 375]) {
      for (const rootSize of [16, 32]) {
        const receipt = await getReopenedReflowReceipt(
          page,
          width,
          rootSize
        );
        const proof = `${row.french} reopened ${width}px/${rootSize}px root`;
        expect(receipt.rootSize, `${proof} computed root`)
          .toBeCloseTo(rootSize, 5);
        expect(receipt.overflow, `${proof} document overflow`)
          .toBeLessThanOrEqual(2);
        expect(receipt.clipped, `${proof} clipped descendants/text`)
          .toEqual([]);
      }
    }
    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => {
      document.documentElement.style.setProperty(
        'font-size',
        '16px',
        'important'
      );
    });

    const assistantFab = page.locator('afro-site-assistant').locator('#fab');
    if (await assistantFab.count() && await assistantFab.isVisible()) {
      await assistantFab.click();
      await page.evaluate(() =>
        new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      );
    }
    expect(
      await getVisibleUnnamedControls(page),
      `${row.french} visible controls without accessible names`
    ).toEqual([]);

    const assistantClose = page.locator('afro-site-assistant').locator('#close');
    if (await assistantClose.count() && await assistantClose.isVisible()) {
      await assistantClose.click();
      await expect(page.locator('afro-site-assistant').locator('#panel'))
        .not.toHaveClass(/\bopen\b/);
    }
    await reset.focus();
    await expect(reset, `${row.french} reset cannot receive keyboard focus`).toBeFocused();

    const artwork = page.locator('.fr-engineering-owner-artwork img');
    await expect(artwork, `${row.french} rendered owner artwork`).toBeVisible();
    await expect.poll(() => artwork.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
    const artworkName = row.artwork[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(artwork).toHaveAttribute('src', new RegExp(`${artworkName}$`));
    await expect(page.locator('.fr-engineering-provenance a'))
      .toHaveAttribute('href', `https://afrotools.com${row.english}`);
    await expect(page.locator('.fr-engineering-provenance time')).toHaveAttribute('datetime', '2026-07-29');
    expect(await getGuideContrastFailures(page), `${row.french} light-theme guide contrast`).toEqual([]);

    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
    expect(await getGuideContrastFailures(page), `${row.french} dark-theme guide contrast`).toEqual([]);

    expect(runtimeErrors, `${row.french} runtime errors`).toEqual([]);
    expect(writes, `${row.french} local-first writes`).toEqual([]);
    expect(aiRequests, `${row.french} AI requests without consent`).toEqual([]);
    expect(sockets, `${row.french} sockets without consent`).toEqual([]);
  });
}
