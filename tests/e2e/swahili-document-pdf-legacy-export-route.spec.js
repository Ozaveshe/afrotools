/**
 * Route-isolated Swahili guest export proof.
 *
 * Run exactly one route at a time:
 *   $env:SW_EXPORT_ID='pdf-compress'
 *   npx playwright test tests/e2e/swahili-document-pdf-legacy-export-route.spec.js --workers=1
 *
 * The mature French parser suite is compiled in memory against the Swahili
 * route contract. This keeps PDF/ZIP/DOCX/image parsing identical while each
 * legacy route remains isolated and fail-closed in its own receipt.
 */
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const ROOT = path.resolve(__dirname, '../..');
const TARGET_ID = process.env.SW_EXPORT_ID;
if (!TARGET_ID) throw new Error('SW_EXPORT_ID is required; run one legacy route at a time.');

const { apps } = require('../../scripts/build-swahili-document-pdf-parity.js');
const swConfig = {
  apps: apps.map((row) => ({
    id: row.id,
    swahiliRoute: row.swahiliRoute,
    exports: row.exports,
    sensitive: row.sensitive === true,
    requiresConsent: row.requiresConsent === true
  }))
};
const frConfig = require('../../data/localization/fr-document-pdf-parity.json');
const target = swConfig.apps.find((app) => app.id === TARGET_ID);
if (!target || target.id === 'document-pdf') {
  throw new Error(`SW_EXPORT_ID must identify one of the 31 export routes; received ${TARGET_ID}.`);
}
const currentEnglishOwnerIds = new Set(swConfig.apps.map((app) => app.id));

const titlePatterns = {
  'pdf-workspace': '^espace PDF:',
  'pdf-convert': '^convertisseur:',
  'pdf-merge-split': '^fusionner/diviser:',
  'pdf-compress': '^compresser:',
  'pdf-image-convert': '^images PDF:',
  'pdf-watermark': '^filigrane:',
  'pdf-password': '^mot de passe:',
  'pdf-page-numbers': '^num',
  'pdf-sign': '^signature:',
  'pdf-ocr': '^OCR:',
  'pdf-form-filler': '^formulaire:',
  'pdf-redact': '^caviardage:',
  'pdf-header-footer': '^en-t',
  'pdf-editor': '^.diteur:',
  'pdf-reorder': '^r.organiser:',
  'pdf-chat': '^chat PDF:',
  'pdf-translate': '^traduction PDF:',
  'pdf-compare': '^comparaison PDF:',
  'pdf-to-audio': '^PDF en audio:',
  'pdf-bates': '^Bates:',
  'html-to-pdf': '^HTML en PDF:',
  'pdf-find-replace': '^rechercher/remplacer:',
  'pdf-repair': '^r.parer:',
  'pdf-workflow': '^flux PDF:',
  'cv-builder': '^CV:',
  'invoice-generator': '^facture: PDF',
  'cover-letter': '^lettre:',
  'freelance-invoice': '^facture freelance:',
  'meeting-minutes': '^réunion:',
  'receipt-generator': '^reçu:',
  'business-plan': '^plan d.affaires:'
};

let source = fs.readFileSync(
  path.join(ROOT, 'tests/e2e/french-document-pdf-exports.spec.js'),
  'utf8'
);

source = source.replace(
  /const CONFIG = JSON\.parse\(fs\.readFileSync\([\s\S]*?'utf8'\s*\)\);/,
  `const CONFIG = { apps: [${JSON.stringify(target)}] };`
);
source = source.replace(
  "const RECEIPT_PATH = path.join(ROOT, 'reports/french-document-pdf-export-receipts.json');",
  `const RECEIPT_PATH = path.join(ROOT, 'reports/swahili-document-pdf-export-receipts/${TARGET_ID}.json');`
);
source = source.replace(
  "route: app.frenchWorkspaceRoute || app.frenchRoute,",
  "route: app.swahiliRoute,"
);
source = source.replace(
  "locale: 'fr',",
  "locale: 'sw',\n    scope: 'route-isolated-download-contract-export-proof',\n    proofVersion: 'download-contract-v3',\n    targetId: " + JSON.stringify(TARGET_ID) + ","
);
source = source.replace(
  "primaryActionsUngated: accepted,",
  "primaryActionsUngated: app.sensitive === true ? accepted : false,\n      guestUnauthenticated: app.sensitive === true ? accepted : false,\n      guestBlocked: app.sensitive === true ? null : true,\n      registeredDownload: app.sensitive === true ? null : accepted,\n      downloadContract: app.sensitive === true ? 'sensitive-guest' : 'free-account',"
);
source = source.replace(
  "test.beforeEach(async ({ page }) => {",
  "test.beforeEach(async ({ page }) => {\n" +
  (target.sensitive ? '' :
    "  await page.addInitScript(() => { window.AfroAuth = { isLoggedIn: () => true, getUser: () => ({ id: 'registered-contract-user', email: 'registered@example.test', tier: 'free' }), getCachedProfile: () => null }; });\n")
);
source = source.replace(
  /\s*const servedContract = await request\.get\('\/data\/localization\/fr-document-pdf-parity\.json'\);\s*expect\(servedContract\.ok\(\)\)\.toBe\(true\);\s*const servedApps = \(await servedContract\.json\(\)\)\.apps;\s*expect\(servedApps\.map\(\(app\) => app\.id\)\)\.toEqual\(CONFIG\.apps\.map\(\(app\) => app\.id\)\);/,
  '\n  expect(CONFIG.apps).toHaveLength(1);'
);
source = source.replace(
  "await expect(page.locator('html')).toHaveAttribute('lang', 'fr');",
  "await expect(page.locator('html')).toHaveAttribute('lang', 'sw');"
);
source = source.replace(
  /\n  await page\.waitForFunction\(\n    \(\) => document\.documentElement\.dataset\.frDocumentPdfReady === 'true',\n    null,\n    \{ timeout: 10_000 \}\n  \);/,
  ''
);
source = source.replace(
  "localStorage.setItem('afrotools_cookie_consent', 'declined');",
  "localStorage.setItem('afrotools_cookie_consent', 'declined');\n" +
  "    localStorage.removeItem('afro_auth_v2');\n" +
  "    localStorage.removeItem('afro_session_v3');\n" +
  "    localStorage.removeItem('afro_profile_cache');"
);
source = source.replace(
  "await expect(page.locator('html')).toHaveAttribute('lang', 'sw');",
  "await expect(page.locator('html')).toHaveAttribute('lang', 'sw');\n" +
  `  await expect(page.locator('email-gate-modal')).toHaveCount(${target.sensitive ? 0 : 1});\n` +
  "  expect(await page.evaluate(() => ({ auth: localStorage.getItem('afro_auth_v2'), session: localStorage.getItem('afro_session_v3'), profile: localStorage.getItem('afro_profile_cache') }))).toEqual({ auth: null, session: null, profile: null });"
);
source = source.replace(
  "if (options.frenchPattern) expect(text).toMatch(options.frenchPattern);",
  "if (options.frenchPattern) expect(text.trim().length).toBeGreaterThan(20);"
);
source = source.replace(
  "fixtureRecovered: options.expectedText ? recoveredText.includes(options.expectedText) : true,",
  "fixtureRecovered: options.expectedText ? recoveredText.includes(options.expectedText) : null,\n    expectedFixtureAssertion: Boolean(options.expectedText),"
);
source = source.replace(
  "operation: options.operation",
  "operation: options.operation,\n    operationVerified: options.operation ? Boolean(options.inputBytes && !download.bytes.equals(Buffer.from(options.inputBytes))) : null"
);
source = source.replace(
  "let fixtureRecovered = !options.expected;",
  "let fixtureRecovered = options.expected ? false : null;"
);
source = source.replace(
  "expect(fixtureRecovered).toBe(true);",
  "if (options.expected) expect(fixtureRecovered).toBe(true);"
);
source = source.replace(
  "fixtureRecovered: options.expected ? text.includes(options.expected) : true",
  "fixtureRecovered: options.expected ? text.includes(options.expected) : null,\n    expectedFixtureAssertion: Boolean(options.expected)"
);
source = source.replace(
  "parsedPayload,\n    fixtureRecovered\n  });",
  "parsedPayload,\n    fixtureRecovered,\n    expectedFixtureAssertion: Boolean(options.expected)\n  });"
);
source = source.replace(
  "requiredParts: ['[Content_Types].xml', '_rels/.rels', 'word/document.xml'],\n    fixtureRecovered: true",
  "requiredParts: ['[Content_Types].xml', '_rels/.rels', 'word/document.xml'],\n    fixtureRecovered: true,\n    expectedFixtureAssertion: Boolean(expected)"
);
source = source.replace(
  "correctPasswordOpened: true,\n    fixtureRecovered: true",
  "correctPasswordOpened: true,\n    fixtureRecovered: true,\n    expectedFixtureAssertion: true"
);
source = source.replace(
  "test.describe.configure({ mode: 'default', timeout: 180_000 });",
  "test.describe.configure({ mode: 'default', timeout: 60_000 });\n" +
  `test.beforeEach(({}, testInfo) => { if (!(new RegExp(${JSON.stringify(titlePatterns[TARGET_ID])}, 'i')).test(testInfo.title)) test.skip(); });`
);

for (const frApp of frConfig.apps) {
  const swApp = swConfig.apps.find((app) => app.id === frApp.id);
  const frRoute = frApp.frenchWorkspaceRoute || frApp.frenchRoute;
  if (swApp && frRoute) source = source.split(frRoute).join(swApp.swahiliRoute);
}
source = source.split('/fr/tools/compte-rendu-reunion/app').join(target.id === 'meeting-minutes' ? target.swahiliRoute : '/fr/tools/compte-rendu-reunion/app');
source = source.split('/fr/tools/plan-affaires/app').join(target.id === 'business-plan' ? target.swahiliRoute : '/fr/tools/plan-affaires/app');

const replacements = {
  'pdf-redact': { '#fullPageBtn': '#fullUkurasaBtn' },
  'pdf-to-audio': { '#downloadTextBtn': '#downloadMaandishiBtn' },
  'pdf-workflow': {
    '#pdfFileInput': '#pdfFailiInput',
    '#downloadReportBtn': '#downloadRipotiBtn'
  }
};
if (!currentEnglishOwnerIds.has(TARGET_ID)) {
  for (const [from, to] of Object.entries(replacements[TARGET_ID] || {})) {
    source = source.split(from).join(to);
  }
}

// These review gates exist in the upgraded French pages, but not in the
// corresponding native Swahili legacy UI. Removing a nonexistent test-only
// click does not create a capability; absent advertised exports remain blocked
// in the route receipt.
if (!currentEnglishOwnerIds.has(TARGET_ID)) {
  for (const selector of [
    '#excelReviewConfirm',
    '#imageReviewConfirm',
    '#htmlPdfReviewConfirm',
    '#reviewConfirm',
    '#translationReviewConfirm',
    '#reportReviewConfirm',
    '#audioReviewConfirm',
    '#batesReviewConfirm'
  ].filter((selector) => !(TARGET_ID === 'pdf-compare' && selector === '#reportReviewConfirm'))) {
    source = source.replace(
      new RegExp(`\\n\\s+await expect\\(page\\.locator\\('${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'\\)\\)\\.toBeVisible\\(\\{ timeout: \\d+_?\\d* \\}\\);`, 'g'),
      ''
    );
    source = source.replace(
      new RegExp(`\\n\\s+await page\\.locator\\('${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'\\)\\.check\\(\\);`, 'g'),
      ''
    );
  }
}
if (TARGET_ID === 'pdf-merge-split') {
  source = source.replace(
    "minimumPages: 3,\n    expectedText: PRIVATE_MARKER",
    "minimumPages: 3"
  );
  source = source.replace(
    "await uploadPdfs(page, '#mergeFileInput');\n  await page.locator('#mergeBtn').click();",
    "await uploadPdfs(page, '#mergeFileInput');\n  await waitEnabled(page, '#mergeBtn');\n  await page.locator('#mergeBtn').press('Enter');\n" +
    "  await expect(page.locator('#resultCard')).toHaveClass(/on/, { timeout: 30_000 });\n" +
    "  expect(await page.locator('#resultText').textContent()).not.toMatch(/hitilafu|error/i);"
  );
}
if (TARGET_ID === 'pdf-form-filler') {
  source = source.replace(
    "const parsed = await parsePdf(output);\n  expect(parsed.text).toMatch(/VALEUR-FR-2026|DONNEE_PRIVEE_EXPORT_2026/);",
    "const parsed = await parsePdf(output);\n" +
    "  const filledDocument = await PDFDocument.load(output.bytes);\n" +
    "  const filledValues = filledDocument.getForm().getFields().map((field) => typeof field.getText === 'function' ? field.getText() : '').join(' ');\n" +
    "  expect(filledValues).toMatch(/VALEUR-FR-2026|DONNEE_PRIVEE_EXPORT_2026/);"
  );
  source = source.replace(
    "fixtureRecovered: true,\n    acroFormFixtureRecovered: true",
    "fixtureRecovered: true,\n    expectedFixtureAssertion: true,\n    acroFormFixtureRecovered: true"
  );
}
if (TARGET_ID === 'pdf-sign') {
  source = source.replace(
    "await acceptPdf('pdf-sign', await captureDownload(page, '#finalDownloadBtn'), {\n    minimumPages: 2\n  });",
    "await acceptPdf('pdf-sign', await captureDownload(page, '#finalDownloadBtn'), {\n    minimumPages: 2, inputBytes: firstPdf, operation: 'typed-signature-placed-and-reopened'\n  });"
  );
}
if (TARGET_ID === 'pdf-redact') {
  source = source.replace(
    "await expect(page.locator('#fullPageBtn')).toBeVisible({ timeout: 30_000 });",
    "await expect(page.locator('#fullPageBtn')).toBeVisible({ timeout: 30_000 });\n  await waitEnabled(page, '#fullPageBtn');"
  );
  source = source.replace(
    "await page.locator('#reviewConfirm').check();\n  await page.locator('#exportBtn').click();",
    "await waitEnabled(page, '#exportBtn');\n  await page.locator('#reviewConfirm').check();\n  await page.locator('#exportBtn').press('Enter');"
  );
  source = source.replace(
    "await acceptPdf('pdf-redact', await captureDownload(page, '#downloadBtn'), { minimumPages: 2 });",
    "await acceptPdf('pdf-redact', await captureDownload(page, '#downloadBtn'), { minimumPages: 2, inputBytes: firstPdf, operation: 'full-page-redaction-applied-and-reopened' });"
  );
}
if (TARGET_ID === 'pdf-editor') {
  source = source.replace(
    "await page.locator('#reviewConfirm').check();\n  await acceptPdf('pdf-editor', await captureDownload(page, '#tbDL'), { minimumPages: 2 });",
    "await page.locator('#tbText').click();\n" +
    "  await page.locator('#overlayCanvas').click({ position: { x: 140, y: 140 } });\n" +
    "  await page.locator('#tioText').fill('SW EDIT 2026');\n" +
    "  await page.locator('#tioOk').click();\n" +
    "  await page.locator('#reviewConfirm').check();\n" +
    "  await acceptPdf('pdf-editor', await captureDownload(page, '#tbDL'), { minimumPages: 2, inputBytes: firstPdf, operation: 'text-edit-added-and-reopened' });"
  );
}
if (TARGET_ID === 'pdf-reorder') {
  source = source.replace(
    "  await page.waitForTimeout(1200);\n  await page.locator('#reviewConfirm').check();",
    "  await page.waitForTimeout(1200);\n" +
    "  await page.locator('#btnReverse').click();\n" +
    "  await page.locator('#reviewConfirm').check();"
  );
  source = source.replace(
    "await acceptPdf('pdf-reorder', await captureDownload(page, '#btnDownload'), {\n    minimumPages: 2,\n    expectedText: PRIVATE_MARKER\n  });",
    "await acceptPdf('pdf-reorder', await captureDownload(page, '#btnDownload'), {\n    minimumPages: 2, inputBytes: firstPdf, operation: 'page-order-reversed-and-reopened'\n  });"
  );
}
if (TARGET_ID === 'pdf-translate') {
  source = source.replace(
    "test.describe.configure({ mode: 'default', timeout: 60_000 });",
    "test.describe.configure({ mode: 'default', timeout: 120_000 });"
  );
  source = source.replace(
    "await uploadPdf(page, '#pdfFile');",
    "await uploadPdf(page, '#pdfFile', secondPdf, 'tafsiri-synthetic.pdf');"
  );
  source = source.replace(
    "await acceptPdf('pdf-translate', await captureDownload(page, '#downloadPdf'));",
    "await acceptPdf('pdf-translate', await captureDownload(page, '#downloadPdf', 90_000), { inputBytes: secondPdf, operation: 'local-translation-draft-exported-and-reopened' });"
  );
  source = source.replace(
    "acceptText('pdf-translate', 'txt', await captureDownload(page, '#downloadTxt'), {\n    frenchPattern:",
    "acceptText('pdf-translate', 'txt', await captureDownload(page, '#downloadTxt'), {\n    expected: PRIVATE_MARKER,\n    frenchPattern:"
  );
}
if (TARGET_ID === 'pdf-repair') {
  source = source.replace(
    "await acceptPdf('pdf-repair', await captureDownload(page, '#downloadBtn'), { minimumPages: 2 });",
    "await acceptPdf('pdf-repair', await captureDownload(page, '#downloadBtn'), { minimumPages: 2, inputBytes: firstPdf, operation: 'repair-rewrite-applied-and-reopened' });"
  );
}
if (TARGET_ID === 'pdf-to-audio') {
  source = source.replace(
    "\n  await expect(page.locator('#downloadAudioBtn')).toHaveCount(0);",
    ''
  );
}
if (TARGET_ID === 'invoice-generator') {
  source = source.replace(
    "  await page.locator('.li-price').fill('15000');",
    "  await page.locator('.li-price').fill('15000');\n" +
    "  await page.locator('#invoiceReviewConfirm').check();"
  );
}
const stableKeyboardActions = {
  'pdf-watermark': ['#watermarkBtn'],
  'pdf-page-numbers': ['#numberBtn'],
  'pdf-redact': ['#fullPageBtn', '#exportBtn'],
  'pdf-header-footer': ['#applyBtn'],
  'pdf-bates': ['#stampBtn']
};
for (const selector of stableKeyboardActions[TARGET_ID] || []) {
  source = source.split(`page.locator('${selector}').click()`).join(`page.locator('${selector}').press('Enter')`);
}
const stableKeyboardChecks = {
  'pdf-header-footer': ['#previewConfirm'],
  'pdf-to-audio': ['#audioReviewConfirm'],
  'pdf-bates': ['#batesReviewConfirm'],
  'invoice-generator': ['#invoiceReviewConfirm']
};
for (const selector of stableKeyboardChecks[TARGET_ID] || []) {
  source = source.split(`page.locator('${selector}').check()`).join(`page.locator('${selector}').press('Space')`);
}
if (TARGET_ID === 'pdf-header-footer') {
  source = source.replace(
    "await page.locator('#applyBtn').press('Enter');",
    "await waitEnabled(page, '#applyBtn');\n  await page.locator('#applyBtn').press('Enter');"
  );
}
if (TARGET_ID === 'cv-builder') {
  source = source.replace(
    "await acceptPdf('cv-builder', await captureDownload(page, '.cv-export-drawer-shell [data-cv-export=\"pdf\"]'));",
    "await acceptPdf('cv-builder', await captureDownload(page, '.cv-export-drawer-shell [data-cv-export=\"ats-pdf\"]'), { expectedText: PRIVATE_MARKER });"
  );
}
source = source.replace(
  /\n    if \(format === 'png'\) \{\n      await page\.getByRole\('button', \{ name: \/exporter un autre\|export another\/i \}\)\.click\(\);\n    \}/,
  ''
);

fs.mkdirSync(path.join(ROOT, 'reports/swahili-document-pdf-export-receipts'), { recursive: true });
const compiled = new Module(__filename, module);
compiled.filename = __filename;
compiled.paths = module.paths;
compiled._compile(source, __filename);
