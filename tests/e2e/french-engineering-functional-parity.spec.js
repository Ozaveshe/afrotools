const { test, expect } = require('@playwright/test');

const flows = [
  ['/fr/ingenierie/afrodraft/', null, /Lancer AfroDraft|Ouvrir AfroDraft/i],
  ['/fr/ingenierie/planificateur-etage/', null, /Commencer le plan|Ouvrir le planificateur/i],
  ['/fr/tools/calculateur-solaire/', /Calculer/i, /5 panels|5 panneaux/i],
  ['/fr/tools/plan-etage/', null, /91\s*m/i],
  ['/fr/tools/devis-quantitatif/', null, /Ouvrir.*devis|Lancer.*devis|Commencer/i],
  ['/fr/tools/calcul-structure/', /Calculer/i, /225\s*[×x]\s*475|497\s*mm/i],
  ['/fr/tools/charge-electrique/', /Calculer/i, /6\.2\s*kW|18\.8\s*A/i],
  ['/fr/tools/dosage-beton/', /Calculer/i, /ciment|agrégat/i],
  ['/fr/tools/calculateur-peinture/', /Calculer/i, /litres|liters/i],
  ['/fr/tools/calculateur-carrelage/', /Calculer/i, /96|12 boîtes|12 boxes/i],
  ['/fr/tools/dimensionnement-citerne/', /Calculer/i, /3,?000\s*L|750\s*L/i],
  ['/fr/tools/calculateur-toiture/', /Calculer/i, /163\.1\s*m|39 feuilles|39 sheets/i],
  ['/fr/tools/cout-forage/', /Estimer/i, /1,?732,?000|60\s*m/i],
  ['/fr/tools/calculateur-armature/', /Calculer/i, /290\s*kg|60 barres|60 bars/i],
  ['/fr/tools/dimensionnement-generateur/', /Calculer/i, /2\.5\s*kVA|0\.9\s*kW/i],
  ['/fr/tools/generateur-boq/', /Générer/i, /13,?622,?239|8,?845,?610/i],
  ['/fr/tools/cout-renovation/', /Estimer/i, /rénovation|total/i],
  ['/fr/tools/dimensionnement-fosse-septique/', /Calculer/i, /2\.0\s*m|367,?600/i],
  ['/fr/tools/cout-cloture/', /Calculer/i, /2,?720,?000/i],
  ['/fr/tools/cout-piscine/', /Estimer/i, /48,?000\s*L|6,?584,?000/i],
  ['/fr/tools/honoraires-architecte/', /Calculer/i, /2,?295,?000|6\.4%/i],
  ['/fr/tools/estimateur-du-cout-de-preparation-d-un-terrain/', /Calculer/i, /2,?011,?500/i],
  ['/fr/tools/estimateur-du-cout-de-construction-routiere/', /Estimer/i, /74\.25\s*M|61\.88\s*M/i],
  ['/fr/tools/calculateur-echafaudage/', /Calculer/i, /540\s*m|6,?018,?000/i],
  ['/fr/tools/dimensionnement-fenetres-portes/', /Calculer/i, /5%/i],
  ['/fr/tools/materiaux-plomberie/', /Calculer/i, /353,?400|203,?400/i]
];
const ENGLISH_OUTPUT = /\b(?:How it works|Related tools|Calculate(?: materials| load| beam| paint| road cost)?|Download(?: PDF| TXT| JSON| CSV)?|Construction Cost|Planning estimate|Enter (?:your|the)|Select (?:a|your)|Your results?|Input summary|Project summary|Cost breakdown|Built (?:Area|Surface) sqm|Inputs reviewed|Room area|Wall length|Openings|Units|Estimate total|Planning total|Editable assumptions|Default rates|Unit Cost|Buffer percent|Labour allowance|Estimated total|Tiles \(Exact\)|Total to Buy|Boxes \(~8\/box\)|Tiles per m2|Wastage|Bar Bending Schedule|Cutting Length Adjustments|Lap Lengths|Estimated Steel Cost|Bottom bars|Top bars|Stirrups|Column bars|masonry|roofing|finishes|speed|quality|risk)\b/i;

test('all 26 French Engineering workflows reproduce the English output oracles', async ({ page }) => {
  test.setTimeout(600_000);
  const writes = [];
  const flowStart = Number.parseInt(process.env.FLOW_START || '0', 10);
  const selectedFlows = flows.slice(Number.isFinite(flowStart) ? flowStart : 0);
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.route(/^https?:\/\//, async (route) => {
    const hostname = new URL(route.request().url()).hostname;
    if (hostname === '127.0.0.1') await route.continue();
    else await route.abort();
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (request.method() !== 'GET' && url.hostname === '127.0.0.1') {
      writes.push(`${request.method()} ${url.pathname}`);
    }
  });

  for (const [route, action, expected] of selectedFlows) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    if (action) {
      const button = page.getByRole('button', { name: action }).first();
      await expect(button, `${route} primary workflow button`).toBeVisible();
      await button.click();
    }
    await expect(page.locator('body'), `${route} deterministic output`).toContainText(expected);
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/[₦$€£]\s*NaN|\b(?:Infinity|undefined)\b/);
    expect(body, `${route} residual English output`).not.toMatch(ENGLISH_OUTPUT);

    const unnamed = await page.locator('input:not([type="hidden"]),select,textarea,button').evaluateAll((controls) =>
      controls.filter((control) => control.offsetParent !== null && !(
        (control.labels && control.labels.length) ||
        control.getAttribute('aria-label') ||
        control.getAttribute('aria-labelledby') ||
        control.textContent.trim() ||
        control.title
      )).map((control) => control.outerHTML)
    );
    expect(unnamed, `${route} unnamed controls`).toEqual([]);
  }
  expect(writes).toEqual([]);
});
