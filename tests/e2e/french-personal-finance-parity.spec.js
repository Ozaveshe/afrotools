const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

test.describe.configure({ mode: 'serial' });

const ROOT = path.resolve(__dirname, '../..');
const EVIDENCE_DIR = path.join(ROOT, 'artifacts', 'french-personal-finance-parity');

const APPS = [
  {
    id: 'budget-50-30-20',
    route: '/fr/tools/budget-50-30-20/',
    fill: async (page) => {
      await page.getByLabel('Revenu net mensuel').fill('300000');
      await page.getByLabel('Dépenses actuelles pour les besoins').fill('150000');
      await page.getByLabel('Dépenses actuelles pour les envies').fill('90000');
      await page.getByLabel('Épargne et dette supplémentaire').fill('60000');
    },
    result: /150\s?000/,
    invalidLabel: 'Revenu net mensuel',
    invalidValue: '0',
    invalidMessage: /supérieur à zéro/
  },
  {
    id: 'budget-album-ep',
    route: '/fr/tools/budget-album-ep/',
    fill: async (page) => {
      await page.getByLabel('Type de projet').selectOption('album');
      await expect(page.getByLabel('Nombre de titres')).toHaveValue('12');
      await page.getByLabel('Type de projet').selectOption('ep');
      await expect(page.getByLabel('Nombre de titres')).toHaveValue('5');
    },
    result: /570\s?000/,
    invalidLabel: 'Nombre de titres',
    invalidValue: '0',
    invalidMessage: /entre 1 et 20/
  },
  {
    id: 'budget-film',
    route: '/fr/tools/budget-film/',
    fill: async () => {},
    result: /20\s?000\s?000/,
    invalidLabel: 'Marketing et livraison',
    invalidValue: '0',
    invalidMessage: /totaliser 100/,
    errorFocusLabel: 'Au-dessus de la ligne'
  },
  {
    id: 'fonds-urgence-securite',
    route: '/fr/tools/fonds-d-urgence-et-de-securite/',
    fill: async (page) => {
      await page.getByLabel('Dépenses essentielles mensuelles').fill('150000');
      await page.getByLabel('Mois d’essentiels à couvrir').fill('3');
      await page.getByLabel('Coûts d’urgence ponctuels').fill('50000');
      await page.getByLabel('Épargne d’urgence actuelle').fill('100000');
      await page.getByLabel('Contribution mensuelle prévue').fill('50000');
    },
    result: /500\s?000/,
    invalidLabel: 'Mois d’essentiels à couvrir',
    invalidValue: '25',
    invalidMessage: /entre 1 et 24/
  },
  {
    id: 'classement-activites-complementaires',
    route: '/fr/tools/classement-d-activites-complementaires/',
    fill: async (page) => {
      const hours = page.getByLabel('Temps disponible par semaine');
      expect(await hours.locator('option').evaluateAll((options) => options.map((option) => option.value))).toEqual(['5', '10', '20', '40']);
      await page.getByText('Rédaction', { exact: true }).click();
      await hours.selectOption('10');
      await page.getByLabel('Tranche de capital de départ').selectOption('2');
    },
    result: /Rédaction freelance et contenu/,
    invalidLabel: 'Temps disponible par semaine',
    invalidValue: '',
    invalidMessage: /temps hebdomadaire/
  }
];

function bodyHasNoHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
}

async function visibleHorizontalClipping(page) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const tolerance = 1;
    const offenders = [];

    function parentAcrossShadow(element) {
      if (element.parentElement) return element.parentElement;
      const root = element.getRootNode();
      return root instanceof ShadowRoot ? root.host : null;
    }

    function isClosedOrInert(element) {
      let current = element;
      while (current) {
        if (
          current.hidden ||
          current.inert ||
          current.getAttribute('aria-hidden') === 'true' ||
          (current instanceof HTMLDialogElement && !current.open)
        ) return true;
        const style = getComputedStyle(current);
        if (style.display === 'none' || style.visibility === 'hidden' || style.contentVisibility === 'hidden') return true;
        const isClippedAssistiveText =
          style.position === 'absolute' &&
          parseFloat(style.width) <= 1 &&
          parseFloat(style.height) <= 1 &&
          style.overflow === 'hidden' &&
          (style.clip !== 'auto' || style.clipPath !== 'none');
        if (isClippedAssistiveText) return true;
        current = parentAcrossShadow(current);
      }
      return false;
    }

    function selectorFor(element) {
      const parts = [];
      let current = element;
      while (current && parts.length < 5) {
        let part = current.localName;
        if (current.id) part += `#${current.id}`;
        else if (current.classList.length) part += `.${Array.from(current.classList).slice(0, 2).join('.')}`;
        parts.unshift(part);
        const root = current.getRootNode();
        if (!current.parentElement && root instanceof ShadowRoot) {
          parts.unshift(`${root.host.localName}::shadow`);
          current = root.host;
        } else {
          current = current.parentElement;
        }
      }
      return parts.join(' > ');
    }

    function record(kind, element, rect, text) {
      if (rect.left >= -tolerance && rect.right <= viewportWidth + tolerance) return;
      offenders.push({
        kind,
        selector: selectorFor(element),
        text: String(text || '').trim().replace(/\s+/g, ' ').slice(0, 100),
        left: Number(rect.left.toFixed(2)),
        right: Number(rect.right.toFixed(2)),
        viewportWidth
      });
    }

    function inspect(element) {
      if (isClosedOrInert(element)) return;
      Array.from(element.getClientRects()).forEach((rect) => {
        if (rect.width > 0 && rect.height > 0) record('element', element, rect, element.getAttribute('aria-label') || '');
      });
      Array.from(element.childNodes).forEach((node) => {
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) return;
        const range = document.createRange();
        range.selectNodeContents(node);
        Array.from(range.getClientRects()).forEach((rect) => {
          if (rect.width > 0 && rect.height > 0) record('text', element, rect, node.textContent);
        });
      });
      if (element.shadowRoot) Array.from(element.shadowRoot.children).forEach(inspect);
      Array.from(element.children).forEach(inspect);
    }

    inspect(document.documentElement);
    return offenders.slice(0, 100);
  });
}

async function expectNoVisibleHorizontalClipping(page, state) {
  const offenders = await visibleHorizontalClipping(page);
  expect(offenders, `${state}: visible content crossed the fixed 320px viewport`).toEqual([]);
}

async function setRoot200Percent(page, enabled) {
  await page.evaluate((isEnabled) => {
    document.documentElement.style.fontSize = isEnabled ? '32px' : '';
  }, enabled);
}

async function setMobileNavbarOpen(page, open) {
  const navbar = page.locator('afro-navbar');
  await expect(navbar).toHaveAttribute('data-styles-ready', '');
  await navbar.evaluate((host, shouldOpen) => {
    const shadow = host.shadowRoot;
    const burger = shadow && shadow.querySelector('.burger');
    const drawer = shadow && shadow.querySelector('.mob');
    if (!burger || !drawer) throw new Error('Open-shadow mobile navbar controls are unavailable');
    if (drawer.classList.contains('open') !== shouldOpen) burger.click();
  }, open);
  await expect.poll(() => navbar.evaluate((host) => host.shadowRoot.querySelector('.mob').classList.contains('open'))).toBe(open);
}

async function verifyFixed320Geometry(page, state, options = {}) {
  await page.setViewportSize({ width: 320, height: 800 });
  await setRoot200Percent(page, true);
  await expectNoVisibleHorizontalClipping(page, `${state} · light DOM and closed shadow controls`);
  if (options.openNavbar !== false) {
    await setMobileNavbarOpen(page, true);
    await expectNoVisibleHorizontalClipping(page, `${state} · open navbar shadow DOM`);
    await setMobileNavbarOpen(page, false);
  }
  await setRoot200Percent(page, false);
}

async function setInvalidValue(page, app) {
  const control = page.getByLabel(app.invalidLabel);
  const tagName = await control.evaluate((element) => element.tagName);
  if (tagName === 'SELECT') {
    await control.evaluate((element) => {
      element.value = '';
      element.dispatchEvent(new Event('change', { bubbles: true }));
    });
  } else {
    await control.fill(app.invalidValue);
  }
}

async function restoreControlValue(page, app, value) {
  const control = page.getByLabel(app.invalidLabel);
  const tagName = await control.evaluate((element) => element.tagName);
  if (tagName === 'SELECT') await control.selectOption(value);
  else await control.fill(value);
}

async function expectClearedInvalidState(page, app) {
  await expect(page.locator('[data-status]')).toContainText(app.invalidMessage);
  await expect(page.getByLabel(app.errorFocusLabel || app.invalidLabel)).toBeFocused();
  await expect(page.locator('[data-result]')).toHaveAttribute('hidden', '');
  await expect(page.locator('[data-result]')).toBeEmpty();
  expect(await page.locator('[data-personal-finance-form]').evaluate((form) => form._lastCalculation)).toBeNull();
}

test.beforeAll(() => {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
});

test('French Personal Finance hub exposes exactly the five canonical native apps', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/fr/personal-finance/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('décisions d’argent');
  await expect(page.locator('.pf-tool-card')).toHaveCount(5);
  await expect(page.locator('.pf-tool-card a')).toHaveCount(5);
  expect(await bodyHasNoHorizontalOverflow(page)).toBe(true);
  await verifyFixed320Geometry(page, 'hub initial');

  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();
  expect(await bodyHasNoHorizontalOverflow(page)).toBe(true);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'hub-375-light.png'), fullPage: true });
  expect(errors).toEqual([]);
});

for (const app of APPS) {
  test(`${app.id}: 320/375/200%, themes, keyboard, privacy and exports`, async ({ page }) => {
    const errors = [];
    const failedResponses = [];
    const dataRequests = [];

    await page.addInitScript(() => {
      window.__afroPrintCalls = 0;
      window.print = () => { window.__afroPrintCalls += 1; };
      window.__afroObjectUrlCalls = 0;
      const createObjectURL = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (...args) => {
        window.__afroObjectUrlCalls += 1;
        return createObjectURL(...args);
      };
      window.__afroClipboardWrites = [];
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text) => {
            window.__afroClipboardWrites.push(String(text));
          }
        }
      });
    });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('response', (response) => {
      if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
    });
    page.on('request', (request) => {
      if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
        dataRequests.push({ url: request.url(), method: request.method(), postData: request.postData() || '' });
      }
    });

    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(app.route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await bodyHasNoHorizontalOverflow(page)).toBe(true);
    await verifyFixed320Geometry(page, `${app.id} initial`);

    const unnamed = await page.locator('input:not([type="hidden"]), select, button, a[href]').evaluateAll((elements) => elements
      .filter((element) => {
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
      })
      .filter((element) => {
        const labelled = element.labels && element.labels.length > 0;
        const name = element.getAttribute('aria-label') || element.getAttribute('aria-labelledby') || element.textContent.trim();
        return !labelled && !name;
      })
      .map((element) => element.outerHTML));
    expect(unnamed).toEqual([]);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await app.fill(page);
    dataRequests.length = 0;

    const calculate = page.getByRole('button', { name: 'Calculer localement' });
    await calculate.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const focusOutline = await calculate.evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(focusOutline).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-result]')).toContainText(app.result);
    await expect(page.locator('[data-status]')).toContainText('Aucun montant n’a été envoyé');
    expect(dataRequests).toEqual([]);
    expect(await bodyHasNoHorizontalOverflow(page)).toBe(true);
    await verifyFixed320Geometry(page, `${app.id} result`);
    await page.waitForLoadState('networkidle');
    const nonNavbarRequests = dataRequests.filter((request) => !(
      request.method === 'GET' &&
      request.postData === '' &&
      new URL(request.url).pathname === '/assets/js/components/navbar-data.json'
    ));
    expect(nonNavbarRequests).toEqual([]);
    dataRequests.length = 0;
    await page.setViewportSize({ width: 375, height: 812 });

    await page.screenshot({ path: path.join(EVIDENCE_DIR, `${app.id}-375-light.png`), fullPage: true });

    await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click();
    await expect(page.locator('[data-status]')).toContainText('uniquement sur cet appareil');
    await setInvalidValue(page, app);
    await page.getByRole('button', { name: 'Rouvrir le brouillon' }).click();
    await expect(page.locator('[data-status]')).toContainText('Brouillon local rouvert');

    const jsonDownloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger JSON réouvrable' }).click();
    const jsonDownload = await jsonDownloadPromise;
    const jsonPath = await jsonDownload.path();
    expect(jsonPath).toBeTruthy();
    const exported = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    expect(exported.appId).toBe(app.id === 'classement-activites-complementaires' ? 'classement-activites' : app.id);
    expect(exported.boundary).toBe('planning_estimate_browser_local');
    expect(Object.keys(exported.inputs).length).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Réinitialiser' }).click();
    await expect(page.locator('[data-result]')).toHaveAttribute('hidden', '');
    await page.locator('[data-import]').setInputFiles(jsonPath);
    await expect(page.locator('[data-status]')).toContainText('Sauvegarde JSON rouverte localement');
    await expect(page.locator('[data-result]')).toContainText(app.result);

    const txtDownloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger TXT' }).click();
    const txtDownload = await txtDownloadPromise;
    const txtPath = await txtDownload.path();
    expect(txtPath).toBeTruthy();
    const txt = fs.readFileSync(txtPath, 'utf8');
    expect(txt).toContain('Calcul local');
    expect(txt).toMatch(app.result);

    await page.getByRole('button', { name: 'Imprimer ou enregistrer en PDF' }).click();
    await expect.poll(() => page.evaluate(() => window.__afroPrintCalls)).toBe(1);
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(5000);
    const parsedPdf = await pdfParse(pdf);
    expect(parsedPdf.text).toMatch(app.result);

    const validControlValue = await page.getByLabel(app.invalidLabel).inputValue();
    await setInvalidValue(page, app);
    await calculate.focus();
    await page.keyboard.press('Enter');
    await expectClearedInvalidState(page, app);

    await restoreControlValue(page, app, validControlValue);
    await calculate.click();
    await expect(page.locator('[data-result]')).toContainText(app.result);

    const sideEffectsBeforeInvalidExport = await page.evaluate(() => ({
      objectUrls: window.__afroObjectUrlCalls,
      clipboardWrites: window.__afroClipboardWrites.length,
      printCalls: window.__afroPrintCalls
    }));
    await setInvalidValue(page, app);
    await page.getByRole('button', { name: 'Copier le résumé' }).click();
    await page.getByRole('button', { name: 'Télécharger TXT' }).click();
    await page.getByRole('button', { name: 'Télécharger JSON réouvrable' }).click();
    await page.getByRole('button', { name: 'Imprimer ou enregistrer en PDF' }).click();
    await expectClearedInvalidState(page, app);
    expect(await page.evaluate(() => ({
      objectUrls: window.__afroObjectUrlCalls,
      clipboardWrites: window.__afroClipboardWrites.length,
      printCalls: window.__afroPrintCalls
    }))).toEqual(sideEffectsBeforeInvalidExport);

    const initialBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.getByRole('button', { name: /Thème :/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: /Thème :/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const darkBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(darkBackground).not.toBe(initialBackground);

    await page.evaluate(() => {
      localStorage.removeItem('aft_theme');
      document.documentElement.style.fontSize = '200%';
    });
    expect(await bodyHasNoHorizontalOverflow(page)).toBe(true);

    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme-choice', 'auto');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    expect(dataRequests).toEqual([]);
    expect(errors).toEqual([]);
    expect(failedResponses).toEqual([]);
  });
}
