const fs = require('node:fs/promises');
const { test, expect } = require('@playwright/test');

const dataRoute = '/sw/zana/kubadilisha-data/';
const hashRoute = '/sw/zana/kizalishaji-hash/';
const markdownRoute = '/sw/zana/kihariri-markdown/';
const scopedRoutes = [
  ['Base64', '/sw/zana/base64/'],
  ['Data Converter', dataRoute],
  ['Hash Generator', hashRoute],
  ['Markdown Editor', markdownRoute]
];

const nestedRows = [
  {
    id: 1,
    name: 'Asha',
    tags: ['sw', 'en'],
    groups: [{ code: 'a', active: true }],
    meta: { city: 'Nairobi', score: 0 }
  },
  {
    id: 2,
    name: 'Baraka',
    tags: [],
    groups: [{ code: 'b', active: false }, { code: 'c', active: true }],
    meta: { city: 'Dar es Salaam', score: 4.5 },
    emptyObject: {},
    laterField: 'imehifadhiwa',
    multiline: 'mstari wa kwanza\nmstari wa pili, "ndiyo"'
  }
];

async function convert(page, inputFormat, outputFormat, input) {
  await page.locator('#inputData').fill(input);
  await page.locator('#inputFormat').selectOption(inputFormat);
  await page.locator('#outputFormat').selectOption(outputFormat);
  await page.locator('#convertBtn').click();
  await expect(page.locator('#outputData')).not.toHaveValue('');
  return page.locator('#outputData').inputValue();
}

async function downloadOutput(page) {
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#downloadBtn').click();
  const download = await downloadPromise;
  const path = await download.path();
  return {
    name: download.suggestedFilename(),
    content: await fs.readFile(path, 'utf8')
  };
}

function trackPostLoadDataRequests(page) {
  const requests = [];
  page.on('request', request => {
    if (['fetch', 'xhr', 'websocket', 'eventsource'].includes(request.resourceType())) {
      requests.push(`${request.resourceType()}: ${request.url()}`);
    }
  });
  return requests;
}

test('Data Converter round-trips later fields, nested object arrays, and top-level arrays', async ({ page }) => {
  await page.goto(dataRoute);
  const dataRequests = trackPostLoadDataRequests(page);
  expect(await page.evaluate(() => typeof window.jsyaml)).toBe('undefined');
  const source = JSON.stringify(nestedRows);

  for (const format of ['json', 'csv', 'tsv', 'xml', 'yaml', 'toml']) {
    const encoded = await convert(page, 'json', format, source);
    const downloaded = await downloadOutput(page);
    expect(downloaded.content).toBe(encoded);
    if (format === 'yaml') {
      expect(downloaded.name.toLowerCase()).toMatch(/\.ya?ml$/);
    } else {
      expect(downloaded.name.toLowerCase()).toContain(`.${format}`);
    }

    const reopened = await convert(page, format, 'json', downloaded.content);
    expect(JSON.parse(reopened)).toEqual(nestedRows);
  }

  const sql = await convert(page, 'json', 'sql', source);
  expect(sql).toContain('laterField');
  expect(sql).toContain('[{"code":"b","active":false},{"code":"c","active":true}]');
  const sqlDownload = await downloadOutput(page);
  expect(sqlDownload.content).toBe(sql);
  expect(sqlDownload.name.toLowerCase()).toContain('.sql');
  expect(dataRequests).toEqual([]);
});

test('Data Converter fallback parses traditional nested YAML and rejects lossy TOML', async ({ page }) => {
  await page.goto(dataRoute);
  const yaml = [
    '- name: Asha',
    '  teams:',
    '    - code: a',
    '      active: true',
    '  meta:',
    '    city: Nairobi',
    '- name: Baraka',
    '  teams:',
    '    - code: b',
    '      active: false',
    '    - code: c',
    '      active: true',
    '  laterField: imehifadhiwa'
  ].join('\n');

  const parsed = JSON.parse(await convert(page, 'yaml', 'json', yaml));
  expect(parsed).toEqual([
    {
      name: 'Asha',
      teams: [{ code: 'a', active: true }],
      meta: { city: 'Nairobi' }
    },
    {
      name: 'Baraka',
      teams: [{ code: 'b', active: false }, { code: 'c', active: true }],
      laterField: 'imehifadhiwa'
    }
  ]);

  await page.locator('#inputData').fill(JSON.stringify([{ id: 1, missing: null }]));
  await page.locator('#inputFormat').selectOption('json');
  await page.locator('#outputFormat').selectOption('toml');
  await page.locator('#convertBtn').click();
  await expect(page.locator('#outputData')).toHaveValue('');
  await expect(page.locator('#validationMsg')).toContainText('TOML haitumii null');

  for (const scalar of [null, true, 7, 'thamani']) {
    const xml = await convert(page, 'json', 'xml', JSON.stringify(scalar));
    const reopened = await convert(page, 'xml', 'json', xml);
    expect(JSON.parse(reopened)).toEqual(scalar);
  }

  await page.locator('#fileInput').setInputFiles({
    name: 'data-isiyofaa.bin',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('hii si XML')
  });
  await expect(page.locator('#outputData')).toHaveValue('');
  await expect(page.locator('#validationMsg')).toContainText('Invalid XML');
});

test('Data Converter parses independent RFC 4180 records and rejects every malformed TOML fixture', async ({ page }) => {
  await page.goto(dataRoute);
  const csvFixture = [
    'id,maelezo,kauli',
    '1,"mstari wa kwanza\r\nmstari wa pili","Alisema ""ndiyo, sasa"""',
    '2,"koma, ndani","nukuu ""mbili"""'
  ].join('\r\n');
  const parsedCsv = JSON.parse(await convert(page, 'csv', 'json', csvFixture));
  expect(parsedCsv).toEqual([
    { id: '1', maelezo: 'mstari wa kwanza\r\nmstari wa pili', kauli: 'Alisema "ndiyo, sasa"' },
    { id: '2', maelezo: 'koma, ndani', kauli: 'nukuu "mbili"' }
  ]);

  const validToml = [
    'title = "Mfano"',
    'numbers = [1, 2, 3]',
    'inline = { active = true, score = 4.5 }',
    '',
    '[owner]',
    'name = "Asha"'
  ].join('\n');
  expect(JSON.parse(await convert(page, 'toml', 'json', validToml))).toEqual({
    title: 'Mfano',
    numbers: [1, 2, 3],
    inline: { active: true, score: 4.5 },
    owner: { name: 'Asha' }
  });

  const malformedToml = [
    'mstari usio na alama ya sawa',
    'a = [1,',
    'a = "haijafungwa',
    'a = { key = 1',
    'a = 1\na = 2',
    'bad key = 1',
    'a = { key = 1, key = 2 }',
    '[sehemu]\n[sehemu]'
  ];

  let downloads = 0;
  page.on('download', () => { downloads += 1; });
  await page.locator('#inputData').fill('{"stale":true}');
  await page.locator('#inputFormat').selectOption('json');
  await page.locator('#outputFormat').selectOption('json');
  await page.locator('#convertBtn').click();
  await expect(page.locator('#outputData')).not.toHaveValue('');
  for (const fixture of malformedToml) {
    await page.locator('#inputData').fill(fixture);
    await page.locator('#inputFormat').selectOption('toml');
    await page.locator('#convertBtn').click();
    await expect(page.locator('#outputData')).toHaveValue('');
    await expect(page.locator('#validationMsg')).toHaveClass(/invalid/);
    await page.locator('#downloadBtn').click();
  }
  await page.waitForTimeout(100);
  expect(downloads).toBe(0);

  await page.locator('#inputData').fill('{"stale":true}');
  await page.locator('#inputFormat').selectOption('json');
  await page.locator('#convertBtn').click();
  await expect(page.locator('#outputData')).not.toHaveValue('');
  for (const badCsv of ['a,b\r\n1,"haijafungwa', 'a,b\r\n1,2,3']) {
    await page.locator('#inputData').fill(badCsv);
    await page.locator('#inputFormat').selectOption('csv');
    await page.locator('#convertBtn').click();
    await expect(page.locator('#outputData')).toHaveValue('');
  }
});

test('Hash Generator treats hostile filenames as text and preserves FIPS vectors', async ({ page }) => {
  await page.goto(hashRoute);
  const dataRequests = trackPostLoadDataRequests(page);
  await expect.poll(() => page.evaluate(() => (
    typeof window.CryptoJS !== 'undefined' && typeof window.jsSHA !== 'undefined'
  ))).toBe(true);

  await page.evaluate(() => { window.__hashFilenameXss = false; });
  await page.locator('.tab-btn[data-tab="file-tab"]').click();
  const hostileName = '<img src=x onerror="window.__hashFilenameXss=true">.bin';
  await page.locator('#fileInput').setInputFiles({
    name: hostileName,
    mimeType: 'application/octet-stream',
    buffer: Buffer.from([0, 1, 2, 3, 255])
  });
  await expect(page.locator('#fileInfo')).toContainText(hostileName);
  await expect(page.locator('#fileInfo img')).toHaveCount(0);
  await expect(page.locator('#fileResults .hash-item')).toHaveCount(7);
  expect(await page.evaluate(() => window.__hashFilenameXss)).toBe(false);

  await page.locator('.tab-btn[data-tab="text-tab"]').click();
  await page.locator('#textInput').fill('abc');
  const sha3 = page.locator('#textResults .hash-item').filter({ hasText: 'SHA3-256' }).locator('.hash-value');
  await expect(sha3).toHaveText('3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532');

  await page.locator('#pbkdf2Toggle').check();
  await page.locator('#pbkdf2Salt').fill('salt');
  await page.locator('#pbkdf2Iters').fill('1');
  await page.locator('#pbkdf2KeySize').selectOption('256');
  await page.locator('#textInput').fill('password');
  const pbkdf2 = page.locator('#textResults .hash-item').filter({ hasText: 'PBKDF2' }).locator('.hash-value');
  await expect(pbkdf2).toHaveText('120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b');

  await page.locator('.tab-btn[data-tab="verify-tab"]').click();
  await page.locator('#verifyHash').fill('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  await page.locator('#verifyText').fill('abc');
  await page.locator('#verifyBtn').click();
  await expect(page.locator('#verifyResult')).toContainText('Checksum inalingana');
  await expect(page.locator('#verifyResult')).toHaveAttribute('role', 'status');

  await page.locator('.tab-btn[data-tab="text-tab"]').click();
  for (const invalidIterations of ['0', '-1', '1.5', '1000001']) {
    await page.locator('#pbkdf2Iters').fill(invalidIterations);
    expect(await page.locator('#pbkdf2Iters').evaluate(input => input.checkValidity())).toBe(false);
    expect(await page.locator('#pbkdf2Form').evaluate(form => form.checkValidity())).toBe(false);
    await expect(page.locator('#textResults')).toBeEmpty();
    await expect(page.locator('#verifyResult')).toBeEmpty();
    await expect(page.locator('#hashStatus')).toHaveAttribute('role', 'alert');
    await expect(page.locator('#hashStatus')).not.toBeEmpty();
  }

  await page.locator('#pbkdf2Iters').fill('1');
  expect(await page.locator('#pbkdf2Iters').evaluate(input => input.checkValidity())).toBe(true);
  await expect(pbkdf2).toHaveText('120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b');
  expect(dataRequests).toEqual([]);
});

test('Markdown table dialog traps keyboard focus, closes with Escape, and restores focus', async ({ page }) => {
  await page.goto(markdownRoute);
  const opener = page.locator('[data-action="table-gen"]');
  const dialog = page.getByRole('dialog', { name: 'Tengeneza Jedwali la Markdown' });

  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(dialog).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('#tableRows')).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#tableInsert')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#tableRows')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.locator('#tableModal')).toHaveAttribute('aria-hidden', 'true');
  await expect(opener).toBeFocused();

  await page.keyboard.press('Enter');
  await page.locator('#tableRows').fill('2');
  await page.locator('#tableCols').fill('2');
  await page.locator('#tableInsert').click();
  await expect(page.locator('#editor')).toHaveValue(/\| Kichwa 1 \| Kichwa 2 \|/);
  await expect(page.locator('#editor')).toBeFocused();
});

test('Markdown preview, import, downloads, and invalid imports keep one current document', async ({ page }) => {
  await page.goto(markdownRoute);
  const dataRequests = trackPostLoadDataRequests(page);
  const markdown = '# Kichwa\n\n| Jina | Hali |\n| --- | --- |\n| Asha | Tayari |';
  await page.locator('#editor').fill(markdown);
  await expect(page.locator('#preview h1')).toHaveText('Kichwa');
  await expect(page.locator('#preview table')).toContainText('Asha');

  const markdownDownloadPromise = page.waitForEvent('download');
  await page.locator('#downloadMdBtn').click();
  const markdownDownload = await markdownDownloadPromise;
  expect(await fs.readFile(await markdownDownload.path(), 'utf8')).toBe(markdown);

  const htmlDownloadPromise = page.waitForEvent('download');
  await page.locator('#downloadHtmlBtn').click();
  const htmlDownload = await htmlDownloadPromise;
  const html = await fs.readFile(await htmlDownload.path(), 'utf8');
  expect(html).toContain('<h1>Kichwa</h1>');
  expect(html).toContain('<table>');

  const imported = '## Hati iliyoletwa\n\nMaandishi mapya.';
  await page.locator('#importMdInput').setInputFiles({
    name: 'hati.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from(imported)
  });
  await expect(page.locator('#editor')).toHaveValue(imported);
  await expect(page.locator('#preview h2')).toHaveText('Hati iliyoletwa');

  await page.locator('#importMdInput').setInputFiles({
    name: 'hati.html',
    mimeType: 'text/html',
    buffer: Buffer.from('<h1>isiyokubalika</h1>')
  });
  await expect(page.locator('#editor')).toHaveValue('');
  await expect(page.locator('#preview')).toBeEmpty();
  await expect(page.locator('#mdToast')).toContainText('Chagua faili la .md');
  expect(dataRequests).toEqual([]);
});

for (const [appName, route] of scopedRoutes) {
  test(`${appName} reflows at 320/375px and 200% with themes, focus, clean console and resources`, async ({ page }) => {
    const consoleErrors = [];
    const failedResources = [];
    const serverCalls = [];
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('requestfailed', request => {
      if (['document', 'script', 'stylesheet', 'image'].includes(request.resourceType())) {
        failedResources.push(`${request.resourceType()}: ${request.url()}`);
      }
    });
    page.on('response', response => {
      if (response.status() >= 400 &&
          ['document', 'script', 'stylesheet', 'image'].includes(response.request().resourceType())) {
        failedResources.push(`${response.status()}: ${response.url()}`);
      }
    });
    page.on('request', request => {
      if (request.url().includes('/.netlify/functions/')) serverCalls.push(request.url());
    });

    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      await expect.poll(() => page.evaluate(() => Boolean(
        window.AfroTools && window.AfroTools.darkMode
      ))).toBe(true);

      for (const theme of ['light', 'dark']) {
        await page.evaluate(value => window.AfroTools.darkMode.set(value), theme);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        const colors = await page.evaluate(() => {
          function rgb(value) {
            const match = value.match(/[\d.]+/g);
            return match ? match.slice(0, 3).map(Number) : [0, 0, 0];
          }
          function luminance(parts) {
            const channels = parts.map(value => {
              const normalized = value / 255;
              return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
          }
          const style = getComputedStyle(document.body);
          const foreground = luminance(rgb(style.color));
          const background = luminance(rgb(style.backgroundColor));
          return {
            backgroundColor: style.backgroundColor,
            contrast: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)
          };
        });
        expect(colors.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
        expect(colors.contrast).toBeGreaterThanOrEqual(4.5);
      }

      const session = await page.context().newCDPSession(page);
      const accessibilityTree = await session.send('Accessibility.getFullAXTree');
      expect(accessibilityTree.nodes.some(node => node.role && node.role.value === 'RootWebArea')).toBe(true);
      await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
      await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });
      await session.detach();

      const control = page.locator(
        'input:not([type="hidden"]):visible, textarea:visible, select:visible, button:visible'
      ).first();
      if (await control.count()) {
        await control.focus();
        await expect(control).toBeFocused();
      }

      const unnamedControls = await page.locator('button:visible, input:not([type="hidden"]):visible, textarea:visible, select:visible').evaluateAll(nodes => nodes.filter(node => {
        const labelledBy = node.getAttribute('aria-labelledby');
        const labelledText = labelledBy && document.getElementById(labelledBy)
          ? document.getElementById(labelledBy).textContent.trim() : '';
        const explicitLabel = node.id ? document.querySelector(`label[for="${CSS.escape(node.id)}"]`) : null;
        return !(node.getAttribute('aria-label') || labelledText || (explicitLabel && explicitLabel.textContent.trim()) || node.textContent.trim() || node.getAttribute('title'));
      }).map(node => node.id || node.outerHTML.slice(0, 80)));
      expect(unnamedControls).toEqual([]);
    }

    expect(serverCalls).toEqual([]);
    expect(failedResources).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}

test('Base64 proves Unicode, URL-safe, binary/file/image downloads and clipboard fallback', async ({ page }) => {
  await page.goto('/sw/zana/base64/');
  const dataRequests = trackPostLoadDataRequests(page);
  const unicode = 'Habari 👋🏾 — Kiswahili na 中文';
  await page.locator('#text-input').fill(unicode);
  const encoded = await page.locator('#text-output').inputValue();
  expect(encoded).toBe(Buffer.from(unicode, 'utf8').toString('base64'));
  await page.locator('#decode-btn').click();
  await page.locator('#text-input').fill(encoded);
  await expect(page.locator('#text-output')).toHaveValue(unicode);

  await page.locator('#encode-btn').click();
  await page.locator('#url-safe-toggle').check();
  await page.locator('#text-input').fill(unicode);
  const safe = await page.locator('#text-output').inputValue();
  expect(safe).not.toMatch(/[+/=]/);
  await page.locator('#decode-btn').click();
  await page.locator('#text-input').fill(safe);
  await expect(page.locator('#text-output')).toHaveValue(unicode);

  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    window.__base64FallbackCopy = 0;
    document.execCommand = command => {
      if (command === 'copy') window.__base64FallbackCopy += 1;
      return true;
    };
  });
  await page.locator('#text-copy-output').click();
  await expect.poll(() => page.evaluate(() => window.__base64FallbackCopy)).toBe(1);

  const binary = Buffer.from([0, 255, 128, 1]);
  await page.locator('.tab-btn[data-tab="file-tab"]').click();
  await page.locator('#file-input').setInputFiles({
    name: 'binary.bin', mimeType: 'application/octet-stream', buffer: binary
  });
  await expect(page.locator('#file-info')).toContainText('Aina: application/octet-stream');
  await expect(page.locator('#file-info')).not.toContainText(/Type|unknown/);
  await expect(page.locator('#file-output')).toHaveValue('AP+AAQ==');
  const textDownloadPromise = page.waitForEvent('download');
  await page.locator('#file-download-txt').click();
  const textDownload = await textDownloadPromise;
  expect(await fs.readFile(await textDownload.path(), 'utf8')).toBe('AP+AAQ==');

  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
  await page.locator('.tab-btn[data-tab="image-tab"]').click();
  await page.locator('#img-input').setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: png });
  await expect(page.locator('#img-output')).toHaveValue(/^data:image\/png;base64,/);
  await expect(page.locator('#img-preview img')).toHaveCount(1);

  await page.locator('.tab-btn[data-tab="decode-file-tab"]').click();
  await page.locator('#decode-input').fill('AP+AAQ==');
  await page.locator('#decode-filename').fill('binary.bin');
  await page.locator('#decode-filetype').selectOption('');
  const binaryDownloadPromise = page.waitForEvent('download');
  await page.locator('#decode-download-btn').click();
  const binaryDownload = await binaryDownloadPromise;
  expect(await fs.readFile(await binaryDownload.path())).toEqual(binary);
  await page.locator('#decode-input').fill('%%% si Base64');
  await page.locator('#decode-download-btn').click();
  const invalidToast = page.locator('.toast').last();
  await expect(invalidToast).toContainText('hakuna faili lililopakuliwa');
  await expect(invalidToast).toHaveAttribute('role', 'alert');
  await expect(invalidToast).toHaveAttribute('aria-live', 'assertive');

  const visibleText = await page.locator('body').innerText();
  expect(visibleText).not.toMatch(/Keyboard shortcut|\bType:\b|\bunknown\b|\bPreview\b|URL-Safe Mode|padding\) removed/);
  await page.locator('.tab-btn[data-tab="text-tab"]').click();
  await page.locator('#text-copy-output').click();
  const operationToast = page.locator('.toast').last();
  await expect(operationToast).toHaveAttribute('role', 'status');
  await expect(operationToast).toHaveAttribute('aria-live', 'polite');
  expect(dataRequests).toEqual([]);
});

test('Markdown offline fallback renders headings and tables without CDN libraries', async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/**', route => route.abort());
  await page.goto('/sw/zana/kihariri-markdown/');
  await page.locator('#editor').fill('# Kichwa\n\n| Jina | Hali |\n| --- | --- |\n| Asha | Tayari |');
  await expect(page.locator('#preview h1')).toHaveText('Kichwa');
  await expect(page.locator('#preview table')).toContainText('Asha');
  const htmlDownloadPromise = page.waitForEvent('download');
  await page.locator('#downloadHtmlBtn').click();
  const htmlDownload = await htmlDownloadPromise;
  const html = await fs.readFile(await htmlDownload.path(), 'utf8');
  expect(html).toContain('<h1>Kichwa</h1>');
  expect(html).toContain('<table>');
});

test('Markdown partial-CDN failure neutralizes HTML, SVG and MathML script vectors in preview, copy and download', async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/npm/dompurify@3/**', route => route.abort());
  await page.goto(markdownRoute);
  await expect.poll(() => page.evaluate(() => typeof window.marked !== 'undefined')).toBe(true);
  expect(await page.evaluate(() => typeof window.DOMPurify)).toBe('undefined');

  const hostileMarkdown = [
    '# Kichwa salama',
    '<img src=x onerror="window.__markdownXss=true">',
    '<svg><a xlink:href="javascript:window.__markdownXss=true"><text>hatari</text></a></svg>',
    '<math><mi xlink:href="data:text/html,<script>window.__markdownXss=true</script>">x</mi></math>',
    '[kiungo](javascript:window.__markdownXss=true)',
    '![picha](data:image/svg+xml,<svg onload=window.__markdownXss=true></svg>)'
  ].join('\n\n');
  await page.evaluate(() => { window.__markdownXss = false; });
  await page.locator('#editor').fill(hostileMarkdown);
  await expect(page.locator('#preview h1')).toHaveText('Kichwa salama');
  await expect(page.locator('#preview svg, #preview math, #preview script')).toHaveCount(0);
  await expect(page.locator('#preview [onerror], #preview [onload], #preview [xlink\\:href]')).toHaveCount(0);
  await expect(page.locator('#preview [href^="javascript:"], #preview [src^="data:"]')).toHaveCount(0);
  expect(await page.evaluate(() => window.__markdownXss)).toBe(false);

  await page.evaluate(() => {
    window.__copiedMarkdownHtml = '';
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: value => { window.__copiedMarkdownHtml = value; return Promise.resolve(); } }
    });
  });
  await page.locator('#copyHtmlBtn').click();
  await expect.poll(() => page.evaluate(() => window.__copiedMarkdownHtml.length)).toBeGreaterThan(0);
  const copiedSafe = await page.evaluate(() => {
    const doc = new DOMParser().parseFromString(window.__copiedMarkdownHtml, 'text/html');
    return !doc.querySelector('svg,math,script,[onerror],[onload],[xlink\\:href],[href^="javascript:"],[src^="data:"]');
  });
  expect(copiedSafe).toBe(true);

  const htmlDownloadPromise = page.waitForEvent('download');
  await page.locator('#downloadHtmlBtn').click();
  const htmlDownload = await htmlDownloadPromise;
  const downloadedHtml = await fs.readFile(await htmlDownload.path(), 'utf8');
  const downloadedSafe = await page.evaluate(html => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return !doc.querySelector('svg,math,script,[onerror],[onload],[xlink\\:href],[href^="javascript:"],[src^="data:"]');
  }, downloadedHtml);
  expect(downloadedSafe).toBe(true);

  await expect(page.locator('#mdToast')).toHaveAttribute('role', 'status');
  await expect(page.locator('#mdToast')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('#autoSaveStatus')).toHaveAttribute('role', 'status');
  await expect(page.locator('#autoSaveStatus')).toHaveAttribute('aria-live', 'polite');
});

test('Markdown source is NFC-clean with no mojibake or rejected visible English UI', async ({ page }) => {
  const source = await fs.readFile('sw/zana/kihariri-markdown/index.html', 'utf8');
  expect(source).toBe(source.normalize('NFC'));
  expect(source).not.toMatch(/(?:Ã.|Â.|â[^\s]|ðŸ|�)/);

  await page.goto(markdownRoute);
  const visibleText = await page.locator('body').innerText();
  expect(visibleText).not.toMatch(/Generate Markdown Table|Rows \(excluding header\)|\bColumns\b|Live Preview|Markdown file downloaded|HTML copied to clipboard/);
  expect(visibleText).not.toMatch(/(?:Ã.|Â.|â[^\s]|ðŸ|�)/);
});
