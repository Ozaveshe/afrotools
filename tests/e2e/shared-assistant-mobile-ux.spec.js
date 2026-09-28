const { test: base, expect } = require('@playwright/test');

const PRIVATE_DRAFT = 'Synthetic private draft, not sent to the assistant.';
// Firefox can expose a CSS 44px dimension as 43.999992px in its DOMRect.
const TARGET_PRECISION = .001;
const isAssistantScript = pathname => /\/(?:site-assistant(?:\.min)?|chat\.[^/]+)\.js$/.test(pathname);
const isAiRequest = url => /(?:\/ai-(?:advisor|route-intent|assist)|\/api\/ai(?:\/|$)|anthropic|openai\.com)/i.test(url);

// Exercise the real page and shared components. External resources and writes
// stay isolated, and evidence contains route metadata rather than form content.
const test = base.extend({
  observation: async ({ page, baseURL }, use, testInfo) => {
    const origin = new URL(baseURL).origin;
    const observation = {
      pageErrors: [], consoleErrors: [], warnings: [], blocked: [],
      writes: [], aiRequests: [], privateDraftInRequest: false, checkpoints: {},
      assistantScriptRequests: 0, assistantRequestHeld: false
    };
    let assistantGate;
    let releaseAssistant;
    observation.holdAssistant = () => {
      assistantGate = new Promise(resolve => { releaseAssistant = resolve; });
    };
    observation.releaseAssistant = () => releaseAssistant?.();
    page.on('pageerror', error => observation.pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') observation.consoleErrors.push(message.text());
      if (message.type() === 'warning') observation.warnings.push(message.text());
    });
    page.on('request', request => {
      const url = new URL(request.url());
      const metadata = { method: request.method(), origin: url.origin, path: url.pathname };
      if (request.method() !== 'GET') observation.writes.push(metadata);
      if (isAiRequest(request.url())) observation.aiRequests.push(metadata);
      if (request.url().includes(encodeURIComponent(PRIVATE_DRAFT)) ||
          [...url.searchParams.values()].some(value => value.includes(PRIVATE_DRAFT)) ||
          request.postData()?.includes(PRIVATE_DRAFT)) observation.privateDraftInRequest = true;
    });
    await page.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() !== 'GET' || isAiRequest(request.url())) {
        observation.blocked.push({ method: request.method(), origin: url.origin, path: url.pathname });
        return route.abort();
      }
      if (url.origin !== origin) {
        observation.blocked.push({ method: request.method(), origin: url.origin, path: url.pathname });
        return route.fulfill({ status: 204, body: '',
          contentType: request.resourceType() === 'stylesheet' ? 'text/css' : 'text/plain' });
      }
      if ((url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/')) &&
          url.pathname !== '/api/auth/session') {
        observation.blocked.push({ method: request.method(), origin: url.origin, path: url.pathname });
        return route.abort();
      }
      if (isAssistantScript(url.pathname)) {
        observation.assistantScriptRequests++;
        if (assistantGate) {
          observation.assistantRequestHeld = true;
          await assistantGate;
        }
      }
      return route.continue();
    });
    try {
      await use(observation);
      expect(observation.writes, 'Opening or closing the helper must not submit a form.').toEqual([]);
      expect(observation.aiRequests, 'Opening the helper must not call an AI provider.').toEqual([]);
      expect(observation.privateDraftInRequest).toBe(false);
      expect(observation.pageErrors).toEqual([]);
    } finally {
      observation.releaseAssistant();
      const { holdAssistant, releaseAssistant: release, ...evidence } = observation;
      await testInfo.attach('shared assistant workflow evidence', {
        body: Buffer.from(JSON.stringify(evidence, null, 2)), contentType: 'application/json'
      });
    }
  }
});

test.use({ hasTouch: true });

async function visit(page, route, width, theme, position = null) {
  await page.setViewportSize({ width, height: 844 });
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await page.addInitScript(({ theme, position }) => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    localStorage.setItem('aft_theme', theme);
    // A stale assistant-only choice must not override the website's theme.
    localStorage.setItem('afrobot_theme', theme === 'dark' ? 'light' : 'dark');
    if (position) localStorage.setItem('afrobot_position', JSON.stringify(position));
    else localStorage.removeItem('afrobot_position');
    localStorage.setItem('afro_pwa_dismissed', String(Date.now()));
  }, { theme, position });
  const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
  expect(response.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await expect(page.locator('afro-navbar').locator('.burger')).toBeAttached();
}

function parts(page) {
  const assistant = page.locator('afro-site-assistant');
  const navbar = page.locator('afro-navbar');
  return {
    assistant, navbar, launcher: assistant.locator('#fab'), panel: assistant.locator('#panel'),
    input: assistant.locator('#inp'), close: assistant.locator('#close'),
    burger: navbar.locator('.burger'), menu: navbar.locator('.mob'),
    menuAsk: navbar.locator('#mobAssistantOpen'), menuStatus: navbar.locator('#mobAssistantStatus')
  };
}

async function loadFromKeyboard(page) {
  // The first real keyboard interaction should finish the deferred loading.
  await page.keyboard.press('Tab');
  const ui = parts(page);
  await expect(ui.assistant).toHaveCount(1);
  await expect(ui.launcher).toBeVisible();
  await expect(ui.launcher).toHaveAccessibleName(/AfroTools/);
  await expect(ui.panel).toHaveAttribute('aria-hidden', 'true');
  return ui;
}

async function geometry(locator) {
  return locator.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const root = element.getRootNode();
    const outer = root.host || element;
    const nav = document.querySelector('afro-navbar')?.shadowRoot?.querySelector('nav');
    const header = nav?.getBoundingClientRect().bottom || 0;
    const point = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const innerHit = root.elementFromPoint(point.x, point.y);
    const documentHit = document.elementFromPoint(point.x, point.y);
    return {
      top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right,
      width: rect.width, height: rect.height, header, viewport: innerHeight,
      full: rect.width > 0 && rect.height > 0 && rect.top >= header &&
        rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth,
      centerHit: (innerHit === element || element.contains(innerHit)) &&
        (documentHit === outer || outer.contains(documentHit)),
      position: getComputedStyle(element).position,
      overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
    };
  });
}

async function twoFrames(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function reveal(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  for (let attempt = 0; attempt < 20; attempt++) {
    await twoFrames(page);
    const bounds = await geometry(locator);
    if (bounds.full && bounds.centerHit) return bounds;
    if (bounds.top < bounds.header + 8) await page.mouse.wheel(0, -200);
    else if (bounds.bottom > bounds.viewport - 8) await page.mouse.wheel(0, 200);
  }
  throw new Error('A task target remains covered or clipped: ' + JSON.stringify(await geometry(locator)));
}

async function expectFlowLauncher(page, ui, observation) {
  await expect.poll(() => ui.assistant.evaluate(host => getComputedStyle(host).position))
    .toMatch(/^(static|relative)$/);
  await expect(ui.launcher).toContainText(/AfroTools/);
  await expect(ui.launcher).toHaveAttribute('aria-expanded', 'false');
  const layout = await ui.assistant.evaluate(host => {
    const heading = document.querySelector('h1').getBoundingClientRect();
    const rect = host.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, width: rect.width,
      afterHeading: rect.top >= heading.bottom - 1, gap: rect.top - heading.bottom,
      position: getComputedStyle(host).position, scroll: scrollY };
  });
  expect(layout.afterHeading, JSON.stringify(layout)).toBe(true);
  expect(layout.gap, JSON.stringify(layout)).toBeLessThanOrEqual(160);
  expect((await geometry(ui.launcher)).height).toBeGreaterThanOrEqual(44 - TARGET_PRECISION);
  observation.checkpoints.flowLauncher = layout;
}

async function expectTaskClear(page, ui, target, observation, key) {
  observation.checkpoints[key] = await reveal(page, target);
  await expect(ui.panel).toBeHidden();
  const overlap = await target.evaluate(element => {
    const assistant = document.querySelector('afro-site-assistant');
    const task = element.getBoundingClientRect();
    const launcher = assistant.shadowRoot.getElementById('fab').getBoundingClientRect();
    return task.left < launcher.right && task.right > launcher.left &&
      task.top < launcher.bottom && task.bottom > launcher.top;
  });
  expect(overlap, 'A closed launcher must not cover the task.').toBe(false);
  expect(observation.checkpoints[key].overflow).toBe(0);
}

async function expectOpenPanel(ui, width, height = 844) {
  await expect(ui.panel).toHaveAttribute('aria-hidden', 'false');
  await expect(ui.panel).toBeVisible();
  await expect(ui.launcher).toHaveAttribute('aria-expanded', 'true');
  await expect(ui.input).toBeFocused();
  await expect.poll(async () => {
    const rect = await ui.panel.boundingBox();
    return rect && rect.x >= 0 && rect.y >= 0 &&
      rect.x + rect.width <= width && rect.y + rect.height <= height;
  }).toBe(true);
  await expect.poll(async () => (await geometry(ui.close)).centerHit).toBe(true);
  await expect.poll(async () => {
    const panel = await ui.panel.boundingBox(), input = await ui.input.boundingBox();
    return panel && input && input.x >= panel.x && input.y >= panel.y &&
      input.x + input.width <= panel.x + panel.width &&
      input.y + input.height <= panel.y + panel.height && (await geometry(ui.input)).centerHit;
  }, { message: 'The focused input must remain visible and pointer reachable inside the panel.' }).toBe(true);
  if (width <= 768) {
    await expect(ui.panel).toHaveAttribute('aria-modal', 'true');
    for (const control of [ui.close, ui.assistant.locator('#themeBtn'), ui.assistant.locator('#clearBtn')]) {
      const rect = await control.boundingBox();
      expect(rect.width).toBeGreaterThanOrEqual(44 - TARGET_PRECISION);
      expect(rect.height).toBeGreaterThanOrEqual(44 - TARGET_PRECISION);
    }
    expect(await ui.input.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
  }
}

const primaryCases = [
  { name: 'homepage discovery', route: '/', width: 320, theme: 'light', task: 'home' },
  { name: 'contact draft', route: '/contact/', width: 320, theme: 'dark', task: 'contact' },
  { name: 'Kenya result and tax guide', route: '/kenya/ke-paye', width: 320, theme: 'dark', task: 'kenya' },
  { name: 'Kenya wide mobile result', route: '/kenya/ke-paye', width: 390, theme: 'light', task: 'kenya' },
  { name: 'Kitchen discovery', route: '/tools/afrokitchen/', width: 390, theme: 'light', task: 'kitchen' },
  { name: 'English recipe portions', route: '/tools/afrokitchen/recipes/jollof-rice-ng/', width: 390, theme: 'dark', task: 'recipe' }
];

test.describe('Shared assistant mobile task placement', () => {
  for (const scenario of primaryCases) {
    test(scenario.name + ' keeps closed help in flow at ' + scenario.width + 'px ' + scenario.theme,
      async ({ page, observation }, testInfo) => {
        await visit(page, scenario.route, scenario.width, scenario.theme);
        const ui = await loadFromKeyboard(page);
        await expectFlowLauncher(page, ui, observation);
        if (scenario.task === 'home') {
          const input = page.getByRole('combobox', { name: 'Describe what you would like to do' });
          await expectTaskClear(page, ui, input, observation, 'discoveryInput');
          await input.fill('Kenya PAYE');
          await expect(input).toHaveValue('Kenya PAYE');
          await input.press('Escape');
        } else if (scenario.task === 'contact') {
          const message = page.getByLabel('Your Message', { exact: true });
          await expectTaskClear(page, ui, message, observation, 'message');
          await message.fill(PRIVATE_DRAFT);
          await expectTaskClear(page, ui, page.getByRole('button', { name: /Send Message/ }), observation, 'send');
          // Opening help while a private draft exists must leave it untouched.
          await ui.burger.click();
          await ui.menuAsk.click();
          await expectOpenPanel(ui, scenario.width);
          await page.keyboard.press('Escape');
          await expect(message).toHaveValue(PRIVATE_DRAFT);
        } else if (scenario.task === 'kenya') {
          const salary = page.getByLabel('Monthly Gross Salary', { exact: true });
          await expectTaskClear(page, ui, salary, observation, 'salary');
          await salary.click();
          await salary.press('ControlOrMeta+A');
          await page.keyboard.insertText('75000');
          await expect(salary).toHaveValue('75000');
          await salary.press('Enter');
          await expect(page.locator('#resAmount')).toContainText('54,735');
          await expectTaskClear(page, ui, page.getByRole('button', { name: 'Download PDF', exact: true }), observation, 'resultExport');
          await expectTaskClear(page, ui, page.locator('.ng-bands-table tbody tr').last().locator('td').last(), observation, 'lastTaxBand');
          if (scenario.width === 320) await testInfo.attach('Kenya guide without a floating obstruction', {
            body: await page.screenshot(), contentType: 'image/png'
          });
        } else if (scenario.task === 'kitchen') {
          const search = page.getByRole('searchbox', { name: 'Search dishes or countries' });
          await expectTaskClear(page, ui, search, observation, 'recipeSearch');
          await search.fill('jollof');
          await expect(page.locator('#recipes-grid')).toContainText(/Jollof/i);
          await expectTaskClear(page, ui, page.getByLabel('Servings', { exact: true }), observation, 'plannerServings');
        } else {
          const increase = page.getByRole('button', { name: 'Increase servings', exact: true });
          await expect(page.locator('#ak-static-servings')).toHaveText('6');
          await expectTaskClear(page, ui, increase, observation, 'portions');
          await increase.tap();
          await expect(page.locator('#ak-static-servings')).toHaveText('7');
          await expectTaskClear(page, ui, page.locator('.ak-ing-check').last(), observation, 'ingredientChecklist');
        }
        await expect(ui.panel).toHaveAttribute('aria-hidden', 'true');
        await expect.poll(() => page.evaluate(() => Math.max(0,
          document.documentElement.scrollWidth - document.documentElement.clientWidth))).toBe(0);
      });
  }
});

test.describe('Mobile navigation and keyboard access', () => {
  const locales = [
    { code: 'fr', route: '/fr/', width: 320, theme: 'light', label: 'Assistant AfroTools' },
    { code: 'sw', route: '/sw/', width: 390, theme: 'dark', label: 'Msaidizi wa AfroTools' },
    { code: 'ha', route: '/ha/', width: 320, theme: 'dark', label: 'Tambayi AfroTools' }
  ];
  for (const locale of locales) {
    test(locale.code + ' menu waits for the lazy assistant and returns focus to the visible menu button',
      async ({ page, observation }) => {
        observation.holdAssistant();
        await visit(page, locale.route, locale.width, locale.theme);
        const ui = parts(page);
        await ui.burger.click();
        await expect(ui.menuAsk).toHaveAccessibleName(locale.label);
        await expect(ui.menuAsk).toBeVisible();
        expect((await geometry(ui.menuAsk)).height).toBeGreaterThanOrEqual(44 - TARGET_PRECISION);
        await ui.menuAsk.focus();
        await page.keyboard.press('Enter');
        await expect(ui.menuStatus).toHaveAttribute('role', 'status');
        await expect(ui.menuStatus).not.toBeEmpty();
        await expect(ui.burger).toHaveAttribute('aria-expanded', 'true');
        await expect.poll(() => observation.assistantRequestHeld).toBe(true);
        observation.releaseAssistant();
        await expectOpenPanel(ui, locale.width);
        await expect(ui.assistant).toHaveCount(1);
        await expect(ui.menu).toHaveAttribute('aria-hidden', 'true');
        await page.keyboard.press('Escape');
        await expect(ui.panel).toBeHidden();
        await expect(ui.burger).toBeFocused();
        expect((await geometry(ui.burger)).centerHit).toBe(true);
        expect(observation.assistantScriptRequests).toBe(1);
      });
  }

  for (const scenario of [
    { route: '/', width: 390, theme: 'light' },
    { route: '/kenya/ke-paye', width: 320, theme: 'dark' }
  ]) {
    test('keyboard opens, confines Tab, and closes help on ' + scenario.route + ' ' + scenario.width + 'px',
      async ({ page, observation }) => {
        await visit(page, scenario.route, scenario.width, scenario.theme);
        const ui = await loadFromKeyboard(page);
        await ui.launcher.focus();
        await page.keyboard.press('Enter');
        await expectOpenPanel(ui, scenario.width);
        await expect(ui.panel).toHaveRole('dialog');
        observation.checkpoints.keyboardFocus = [];
        for (const key of ['Tab', 'Shift+Tab']) {
          for (let step = 0; step < 24; step++) {
            await page.keyboard.press(key);
            const focus = await ui.panel.evaluate(panel => {
              const active = panel.getRootNode().activeElement;
              const rect = active?.getBoundingClientRect();
              const describe = node => node ? { tag: node.tagName, id: node.id } : null;
              return { inside: !!active && panel.contains(active),
                visible: !!rect && rect.width > 0 && rect.height > 0,
                documentHasFocus: document.hasFocus(), documentActive: describe(document.activeElement),
                shadowActive: describe(active), modal: panel.matches(':modal'),
                hiddenAncestor: describe(active?.closest('[hidden],[inert],[aria-hidden="true"]')) };
            });
            observation.checkpoints.keyboardFocus.push({ key, step, ...focus });
            expect(focus.inside && focus.visible && focus.documentHasFocus,
              JSON.stringify({ key, step, ...focus })).toBe(true);
          }
        }
        await page.keyboard.press('Escape');
        await expect(ui.launcher).toBeFocused();
        await expect(ui.panel).toBeHidden();
        await expect.poll(() => ui.panel.evaluate(panel => panel.inert)).toBe(true);
        await page.keyboard.press('Tab');
        expect(await ui.panel.evaluate(panel => panel.contains(panel.getRootNode().activeElement))).toBe(false);
        observation.checkpoints.closedInert = true;
      });
  }

  test('cancelling a pending menu request does not steal focus when the script arrives',
    async ({ page, observation }) => {
      observation.holdAssistant();
      await visit(page, '/', 320, 'light');
      const ui = parts(page);
      await ui.burger.click();
      await ui.menuAsk.focus();
      await page.keyboard.press('Enter');
      await expect(ui.menuStatus).not.toBeEmpty();
      await expect.poll(() => observation.assistantRequestHeld).toBe(true);
      await page.keyboard.press('Escape');
      await expect(ui.burger).toBeFocused();
      observation.releaseAssistant();
      await expect(ui.assistant).toHaveCount(1);
      await expect(ui.panel).toHaveAttribute('aria-hidden', 'true');
      await twoFrames(page);
      await expect(ui.panel).toBeHidden();
      await expect(ui.burger).toBeFocused();
    });

  test('moving focus to menu search cancels pending help without replacing the search',
    async ({ page, observation }) => {
      observation.holdAssistant();
      await visit(page, '/', 390, 'dark');
      const ui = parts(page);
      await ui.burger.click();
      await ui.menuAsk.focus();
      await page.keyboard.press('Enter');
      await expect(ui.menuStatus).not.toBeEmpty();
      await expect.poll(() => observation.assistantRequestHeld).toBe(true);
      const search = ui.navbar.getByRole('textbox', { name: 'Search tools' });
      await search.fill('PDF');
      await expect(search).toBeFocused();
      observation.releaseAssistant();
      await expect(ui.assistant).toHaveCount(1);
      await expect(ui.panel).toHaveAttribute('aria-hidden', 'true');
      await twoFrames(page);
      await expect(ui.menu).toHaveAttribute('aria-hidden', 'false');
      await expect(ui.panel).toBeHidden();
      await expect(search).toBeFocused();
      await expect(search).toHaveValue('PDF');
    });
});

async function panelColors(ui) {
  return ui.assistant.evaluate(host => {
    const root = host.shadowRoot;
    return { background: getComputedStyle(root.getElementById('panel')).backgroundColor,
      foreground: getComputedStyle(root.querySelector('.p-title')).color };
  });
}

function luminance(color) {
  const values = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
    const channel = value / 255;
    return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
  });
  return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
}

test('assistant and navigation use the website theme despite a contrary legacy preference',
  async ({ page, observation }) => {
    await visit(page, '/', 320, 'light');
    const ui = await loadFromKeyboard(page);
    await ui.launcher.click();
    await expectOpenPanel(ui, 320);
    await expect.poll(async () => luminance((await panelColors(ui)).background)).toBeGreaterThan(.7);
    await ui.assistant.locator('#themeBtn').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(ui.navbar).toHaveClass(/theme-dark/);
    await expect.poll(async () => luminance((await panelColors(ui)).background)).toBeLessThan(.15);
    const colors = await panelColors(ui);
    expect((Math.max(luminance(colors.foreground), luminance(colors.background)) + .05) /
      (Math.min(luminance(colors.foreground), luminance(colors.background)) + .05)).toBeGreaterThanOrEqual(4.5);
    await page.keyboard.press('Escape');
    await ui.burger.click();
    await ui.navbar.locator('#mobThemeToggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect.poll(async () => luminance((await panelColors(ui)).background)).toBeGreaterThan(.7);
    await page.keyboard.press('Escape');
    await expect(ui.burger).toBeFocused();
    observation.checkpoints.globalThemeSynced = true;
  });

test.describe('Desktop continuity and responsive transitions', () => {
  // Firefox's touch override suppresses mouse PointerEvents. Desktop drag uses
  // a mouse context; the mobile touch cases above retain their touch context.
  test.use({ hasTouch: false });
  test('desktop 56px launcher still drags and its saved position survives a mobile round trip',
    async ({ page, observation }) => {
      await visit(page, '/kenya/ke-paye', 1280, 'light', { x: 1014, y: 700 });
      const ui = await loadFromKeyboard(page);
      await expect(ui.assistant).toHaveCSS('position', 'fixed');
      await expect.poll(() => ui.assistant.boundingBox()).toMatchObject({ width: 56, height: 56, x: 1014, y: 700 });
      observation.checkpoints.initialDesktopLauncher = await geometry(ui.launcher);
      expect(observation.checkpoints.initialDesktopLauncher.centerHit).toBe(true);
      const initial = await ui.launcher.boundingBox();
      await page.mouse.move(initial.x + initial.width / 2, initial.y + initial.height / 2);
      await page.mouse.down();
      await page.mouse.move(840, 580, { steps: 8 });
      await page.mouse.up();
      await expect(ui.panel).toHaveAttribute('aria-hidden', 'true');
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('afrobot_position')).x)).toBeLessThan(1014);
      const stored = await page.evaluate(() => localStorage.getItem('afrobot_position'));
      const position = JSON.parse(stored);
      await page.setViewportSize({ width: 390, height: 844 });
      await expectFlowLauncher(page, ui, observation);
      expect(await page.evaluate(() => localStorage.getItem('afrobot_position'))).toBe(stored);
      await page.setViewportSize({ width: 1280, height: 844 });
      await expect(ui.assistant).toHaveCSS('position', 'fixed');
      await expect.poll(() => ui.assistant.boundingBox()).toMatchObject({ x: position.x, y: position.y, width: 56, height: 56 });
      expect(await page.evaluate(() => localStorage.getItem('afrobot_position'))).toBe(stored);
      await ui.launcher.click();
      await expectOpenPanel(ui, 1280);
      await expect.poll(async () => {
        const host = await ui.assistant.boundingBox(), panel = await ui.panel.boundingBox();
        return Math.abs(panel.x + panel.width - host.x - host.width);
      }).toBeLessThanOrEqual(.05);
      expect(await ui.panel.evaluate(panel => panel.matches(':modal'))).toBe(false);
      await page.setViewportSize({ width: 1280, height: 420 });
      await expectOpenPanel(ui, 1280, 420);
      expect(await page.evaluate(() => localStorage.getItem('afrobot_position'))).toBe(stored);
      observation.checkpoints.shortDesktopPanel = {
        panel: await ui.panel.boundingBox(), close: await geometry(ui.close), input: await geometry(ui.input)
      };
      await page.setViewportSize({ width: 1280, height: 844 });
      await expectOpenPanel(ui, 1280);
      const salary = page.getByLabel('Monthly Gross Salary', { exact: true });
      const target = await reveal(page, salary);
      // A real outside click must keep the clicked form field focused.
      await page.mouse.click((target.left + target.right) / 2, (target.top + target.bottom) / 2);
      await expect(ui.panel).toBeHidden();
      observation.checkpoints.outsideCloseFocus = await ui.assistant.evaluate(host => {
        const describe = node => node ? { tag: node.tagName, id: node.id } : null;
        return { documentActive: describe(document.activeElement), shadowActive: describe(host.shadowRoot.activeElement) };
      });
      await expect(salary).toBeFocused();
      await ui.launcher.click();
      await expectOpenPanel(ui, 1280);
      await page.keyboard.press('Escape');
      await expect(ui.launcher).toBeFocused();
      observation.checkpoints.savedDesktopPosition = position;
    });

  test('breakpoint transitions keep an open panel reachable without creating a drag preference',
    async ({ page, observation }) => {
      await visit(page, '/', 600, 'dark');
      const ui = await loadFromKeyboard(page);
      await expectFlowLauncher(page, ui, observation);
      await page.setViewportSize({ width: 768, height: 844 });
      await expectFlowLauncher(page, ui, observation);
      await page.setViewportSize({ width: 769, height: 844 });
      const mobileAt769 = await page.evaluate(() => matchMedia('(max-width: 768px)').matches);
      if (mobileAt769) await expectFlowLauncher(page, ui, observation);
      else await expect(ui.assistant).toHaveCSS('position', 'fixed');
      // WebKit excludes its scrollbar from CSS media-query width, so 769px
      // can still be mobile. Cross the real breakpoint in every engine.
      await page.setViewportSize({ width: 780, height: 844 });
      expect(await page.evaluate(() => matchMedia('(max-width: 768px)').matches)).toBe(false);
      await expect(ui.assistant).toHaveCSS('position', 'fixed');
      await ui.launcher.click();
      await expectOpenPanel(ui, 780);
      await expect.poll(async () => {
        const host = await ui.assistant.boundingBox(), panel = await ui.panel.boundingBox();
        return Math.abs(panel.x + panel.width - host.x - host.width);
      }).toBeLessThanOrEqual(.05);
      expect(await ui.panel.evaluate(panel => panel.matches(':modal'))).toBe(false);
      await page.setViewportSize({ width: 320, height: 844 });
      await expectOpenPanel(ui, 320);
      expect(await ui.panel.evaluate(panel => panel.matches(':modal'))).toBe(true);
      await page.keyboard.press('Tab');
      expect(await ui.panel.evaluate(panel => panel.contains(panel.getRootNode().activeElement))).toBe(true);
      await page.keyboard.press('Escape');
      await expect(ui.launcher).toBeFocused();
      await expectFlowLauncher(page, ui, observation);
      expect(await page.evaluate(() => localStorage.getItem('afrobot_position'))).toBeNull();
    });
});

test('a privacy-disabled calculator offers no shared Ask entry or deferred assistant loading',
  async ({ page, observation }) => {
    await visit(page, '/tools/import-duty/', 320, 'dark');
    const ui = parts(page);
    await page.getByLabel('Supplier / invoice value', { exact: true }).fill('6000');
    await ui.burger.click();
    await expect(ui.menu).toHaveAttribute('aria-hidden', 'false');
    await expect(ui.menuAsk).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(ui.burger).toBeFocused();
    await page.setViewportSize({ width: 1280, height: 844 });
    await page.keyboard.press('Tab');
    await expect(ui.assistant).toHaveCount(0);
    expect(observation.assistantScriptRequests).toBe(0);
    expect(await page.evaluate(() => document.querySelectorAll('script[src*="site-assistant"],script[src*="/chat."]').length)).toBe(0);
  });

test.describe('Existing task-local Ask controls', () => {
  for (const scenario of [
    { name: 'Uganda PAYE', route: '/uganda/ug-paye', width: 320, theme: 'dark', ask: '#ugPayeAskBtn' },
    { name: 'AFCON', route: '/tools/afcon-predictor/', width: 390, theme: 'light', ask: '#afcon-ask' }
  ]) {
    test(scenario.name + ' inline Ask still opens once during lazy loading and returns keyboard focus',
      async ({ page, observation }) => {
        observation.holdAssistant();
        await visit(page, scenario.route, scenario.width, scenario.theme);
        if (scenario.name === 'Uganda PAYE') {
          await page.getByRole('button', { name: /Calculate Take-Home Pay/ }).tap();
          await expect(page.locator('#resAmount')).toContainText('1,086,750');
        }
        const ask = page.locator(scenario.ask);
        await reveal(page, ask);
        await ask.tap();
        await expect.poll(() => observation.assistantRequestHeld).toBe(true);
        observation.releaseAssistant();
        const ui = parts(page);
        await expectOpenPanel(ui, scenario.width);
        await expect(ui.assistant).toHaveCount(1);
        await page.keyboard.press('Escape');
        await expect(ui.panel).toBeHidden();
        await expect(ask).toBeFocused();
        expect((await geometry(ask)).centerHit).toBe(true);
      });
  }
});
