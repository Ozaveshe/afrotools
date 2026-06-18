const assert = require('assert');
const fs = require('fs');
const { chromium } = require('playwright');

const runtime = fs.readFileSync('assets/js/health-tool-runtime.js', 'utf8');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(`<!doctype html>
    <html>
      <body>
        <div id="health-app-root"></div>
        <script>
          window.__snapshots = [];
          window.AfroHealthWorkflow = {
            recordSnapshot: function(snapshot) {
              window.__snapshots.push(snapshot);
            }
          };
          window.HEALTH_TOOL_CONFIG = {
            id: 'runtime-snapshot-smoke',
            title: 'Runtime Snapshot Smoke',
            type: 'cost-estimator',
            defaultCurrency: 'NGN',
            fields: [
              { id: 'currency', type: 'text', label: 'Currency code', value: 'NGN' },
              { id: 'baseCost', type: 'number', label: 'Base cost', value: '1000' },
              { id: 'units', type: 'number', label: 'Visits', value: '2' },
              { id: 'coverage', type: 'number', label: 'Coverage percent', value: '0' },
              { id: 'patientName', type: 'text', label: 'Patient name', value: 'PRIVATE_RUNTIME_SMOKE_NAME' },
              { id: 'privateNotes', type: 'textarea', label: 'Private notes' }
            ]
          };
        </script>
      </body>
    </html>`);

  await page.addScriptTag({ content: runtime });
  await page.fill('#privateNotes', 'PRIVATE_RUNTIME_SMOKE pasted private clinical context');
  await page.click('#health-run');

  const snapshots = await page.evaluate(() => window.__snapshots);
  assert.strictEqual(snapshots.length, 1);

  const snapshot = snapshots[0];
  const serialized = JSON.stringify(snapshot);
  const labels = snapshot.fields.map((field) => field.label);

  assert(labels.includes('Base cost'));
  assert(labels.includes('Visits'));
  assert(!labels.includes('Patient name'));
  assert(!labels.includes('Private notes'));
  assert(!serialized.includes('PRIVATE_RUNTIME_SMOKE'));
  assert.strictEqual(snapshot.toolId, 'runtime-snapshot-smoke');
  assert(snapshot.headline.includes('Estimated out-of-pocket planning total'));

  await browser.close();
  console.log('health-tool-runtime snapshot tests passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
