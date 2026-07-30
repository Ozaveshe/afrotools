const { test, expect } = require('@playwright/test');
const engine = require('../../assets/js/engines/career-planning.js');

const routes = [
  { path: '/fr/tools/croissance-carriere/', heading: /croissance de carrière/i, report: /PLAN DE CROISSANCE/ },
  { path: '/fr/tools/changement-carriere/', heading: /changement de carrière/i, report: /PLAN DE CHANGEMENT/ },
  { path: '/fr/tools/preparation-retraite/', heading: /préparation à la retraite/i, report: /PRÉPARATION À LA RETRAITE/ },
  { path: '/fr/tools/negociation-salaire/', heading: /négociation salariale/i, report: /PLAN DE NÉGOCIATION/ }
];

for (const width of [320, 375]) {
  for (const route of routes) {
    test(`${route.path} native workflow at ${width}px`, async ({ page }) => {
      const errors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.setViewportSize({ width, height: 850 });
      await page.goto(route.path);
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
      await expect(page.locator('iframe')).toHaveCount(0);
      await page.getByRole('button', { name: 'Calculer mon scénario' }).click();
      await expect(page.locator('[data-report]')).toContainText(route.report);
      await expect(page.locator('[data-results]')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(overflow).toBe(false);
      await page.getByRole('button', { name: 'Enregistrer sur cet appareil' }).click();
      await expect(page.locator('[data-status]')).toContainText('enregistré uniquement');
      const saved = await page.evaluate(() => Object.keys(localStorage).some((key) => key.startsWith('afrotools-fr-career-')));
      expect(saved).toBe(true);
      await page.getByRole('button', { name: 'Copier' }).click();
      await expect(page.locator('[data-status]')).toContainText('copié');
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Télécharger TXT' }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.txt$/);
      const body = require('fs').readFileSync(await download.path(), 'utf8');
      expect(body).toMatch(route.report);
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
      await expect(page.locator('.fr-career-card').first()).toBeVisible();
      await page.setViewportSize({ width: width * 2, height: 850 });
      await page.evaluate(() => { document.body.style.zoom = '2'; });
      const reflow = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        width: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
        offenders: [...document.querySelectorAll('body *')].filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.right > document.documentElement.clientWidth + 1 || rect.left < -1;
        }).slice(0, 12).map((element) => `${element.tagName}.${element.className}`)
      }));
      expect(reflow, JSON.stringify(reflow)).toMatchObject({ overflow: false });
      expect(errors).toEqual([]);
    });
  }
}

for (const route of routes) {
  test(`${route.path} rejects an invalid numeric boundary`, async ({ page }) => {
    await page.goto(route.path);
    const firstNumber = page.locator('input[type=number]').first();
    await firstNumber.fill('-1');
    await page.getByRole('button', { name: 'Calculer mon scénario' }).click();
    await expect(page.locator('[data-status]')).toContainText('Vérifiez les valeurs');
    await expect(page.locator('[data-results]')).toBeHidden();
  });
}

test('career pages expose reciprocal SEO, French AI route ownership and canonical artwork', async ({ page }) => {
  for (const route of routes) {
    await page.goto(route.path);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', new RegExp(route.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    await expect(page.locator('link[hreflang=en]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\.webp$/);
  }
});

test('same fixtures reproduce the four English owner outputs', async ({ page }) => {
  await page.goto('/tools/career-growth/');
  const growthOwner = await page.evaluate(() => {
    const values = {
      'cg-country': 'NG', 'cg-industry': 'tech', 'cg-level': '2', 'cg-salary': '0',
      'cg-experience': '5', 'cg-edu': 'degree', 'cg-path': 'ic', 'cg-learning': '2',
      'cg-network': 'medium', 'cg-switch': 'sometimes'
    };
    Object.entries(values).forEach(([id, value]) => { document.getElementById(id).value = value; });
    calcCareerGrowth();
    return currentCareerGrowthPlan;
  });
  const growthShared = engine.careerGrowth({
    country: 'NG', industry: 'tech', level: 2, salary: 0, experience: 5,
    education: 'degree', path: 'ic', learning: '2', network: 'medium', mobility: 'sometimes'
  });
  expect(growthOwner.currentSalary).toBeCloseTo(growthShared.startSalary, 6);
  expect(growthOwner.fiveYearSalary).toBeCloseTo(growthShared.fiveYearSalary, 6);
  expect(growthOwner.tenYearSalary).toBeCloseTo(growthShared.tenYearSalary, 6);
  expect(growthOwner.cumulativeEarnings).toBeCloseTo(growthShared.cumulativeEarnings, 6);

  await page.goto('/tools/career-switch/');
  const switchOwner = await page.evaluate(() => {
    const values = {
      currency: 'NGN', currentSal: '300000', currentBenefits: '30000', newSal: '500000',
      retrainCost: '600000', retrainMonths: '6', searchMonths: '3',
      partTimeIncome: '0.5', growthRate: '8', satisfaction: '5'
    };
    Object.entries(values).forEach(([id, value]) => { document.getElementById(id).value = value; });
    calcSwitch();
    return currentSwitchPlan;
  });
  const switchShared = engine.careerSwitch({
    currency: 'NGN', currentSalary: 300000, currentBenefits: 30000,
    newSalary: 500000, retrainingCost: 600000, retrainingMonths: 6,
    searchMonths: 3, partTimeIncome: 0.5, growthRate: 8, satisfaction: 5
  });
  expect(switchOwner.totalCost).toBeCloseTo(switchShared.totalCost, 6);
  expect(switchOwner.breakEven).toBe(switchShared.breakEven);
  expect(switchOwner.projectionRows[4].difference).toBeCloseTo(switchShared.projectionRows[4].difference, 6);

  await page.goto('/tools/retirement-readiness/');
  const retirementOwner = await page.evaluate(() => {
    const values = {
      'rr-country': 'NG', 'rr-age': '35', 'rr-retire-age': '60', 'rr-savings': '3000000',
      'rr-contrib': '100000', 'rr-salary': '500000', 'rr-pension-payout': '0',
      'rr-expenses': '350000'
    };
    Object.entries(values).forEach(([id, value]) => { document.getElementById(id).value = value; });
    calcRetirement();
    return currentRetirementPlan;
  });
  const retirementShared = engine.retirement({
    country: 'NG', age: 35, retirementAge: 60, savings: 3000000,
    contribution: 100000, salary: 500000, pensionPayout: 0, expenses: 350000
  });
  expect(retirementOwner.projected).toBeCloseTo(retirementShared.projected, 6);
  expect(retirementOwner.target).toBeCloseTo(retirementShared.target, 6);
  expect(retirementOwner.score).toBe(retirementShared.score);
  expect(retirementOwner.extraContrib).toBeCloseTo(retirementShared.extraContribution, 6);

  await page.goto('/tools/salary-negotiation/');
  const negotiationOwner = await page.evaluate(() => {
    const values = {
      country: 'NG', experience: '5', benchmarkSalary: '500000',
      currentSalary: '0', offerSalary: '450000'
    };
    Object.entries(values).forEach(([id, value]) => { document.getElementById(id).value = value; });
    calcNegotiation();
    return LAST_NEGOTIATION_RESULT;
  });
  const negotiationShared = engine.salaryNegotiation({
    country: 'NG', experience: 5, benchmark: 500000, current: 0, offer: 450000
  });
  expect(negotiationOwner.p25).toBe(negotiationShared.lower);
  expect(negotiationOwner.median).toBe(negotiationShared.median);
  expect(negotiationOwner.p75).toBe(negotiationShared.upper);
  expect(negotiationOwner.counter).toBe(negotiationShared.counter);
});

test('financial inputs do not enter request URLs or bodies', async ({ page }) => {
  const leaked = [];
  await page.goto('/fr/tools/changement-carriere/');
  page.on('request', (request) => {
    const payload = `${request.url()} ${request.postData() || ''}`;
    if (payload.includes('987654321')) leaked.push(payload);
  });
  await page.locator('[name=currentSalary]').fill('987654321');
  await page.getByRole('button', { name: 'Calculer mon scénario' }).click();
  await page.getByRole('button', { name: 'Enregistrer sur cet appareil' }).click();
  expect(leaked).toEqual([]);
  expect(page.url()).not.toContain('987654321');
});

test('French Career hub owns all four accepted routes', async ({ page }) => {
  await page.goto('/fr/jobs/');
  for (const route of routes) {
    await expect(page.locator(`a[href="${route.path}"]`).first()).toBeVisible();
  }
});
