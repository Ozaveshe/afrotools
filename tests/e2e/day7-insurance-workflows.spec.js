const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const modes = {
  'car-insurance': 'quote',
  'health-insurance-compare': 'compare',
  'life-insurance-calc': 'need',
  'funeral-insurance': 'quote',
  'motor-third-party': 'quote',
  'business-insurance': 'quote',
  'travel-insurance': 'quote',
  'workers-comp': 'contribution',
  'health-contribution': 'contribution',
  'claim-tracker': 'claim',
  'crop-insurance-calc': 'quote',
  'fire-insurance': 'quote',
  'insurance-fraud-checker': 'warning',
  'marine-insurance': 'quote',
  'microinsurance': 'quote',
  'professional-indemnity': 'quote'
};

async function expectNoOverflow(page) {
  const widths = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    return {
      document: document.documentElement.scrollWidth,
      viewport,
      offenders: [...document.querySelectorAll('body *')]
        .filter(element => {
          const box = element.getBoundingClientRect();
          return box.right > viewport + 1 || box.left < -1;
        })
        .slice(0, 8)
        .map(element => ({
          tag: element.tagName,
          className: element.className,
          left: element.getBoundingClientRect().left,
          right: element.getBoundingClientRect().right,
          text: (element.textContent || '').trim().slice(0, 60)
        }))
    };
  });
  expect(widths.document, JSON.stringify(widths.offenders, null, 2)).toBe(widths.viewport);
}

test.describe('Day 7 Insurance serial workflow proof', () => {
  test('Insurance hub routes a need without claiming live cover or persisting it', async ({ page }) => {
    const writes = [];
    const errors = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') writes.push(request.postData() || '');
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 320, height: 840 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/insurance/', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Show recommended route' }).click();
    await expect(page.getByRole('status')).toContainText('Choose a workflow');
    await expect(page.locator('#insurance-need')).toBeFocused();
    await page.locator('#insurance-need').selectOption('claim');
    await page.getByRole('button', { name: 'Show recommended route' }).click();
    await expect(page.locator('#insurance-route-title')).toHaveText('Claim evidence tracker');
    await expect(page.locator('#insurance-route-link')).toHaveAttribute('href', '/tools/claim-tracker/');
    await expect(page.locator('body')).toContainText('That is not 322 separately accepted canonical apps');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#insurance-route')).not.toHaveClass(/on/);
    await expect(page.locator('#insurance-need')).toBeFocused();
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expectNoOverflow(page);
    expect(writes.every((body) => body === '')).toBe(true);
    expect(errors).toEqual([]);
  });
});

async function executeWorkflow(page, mode) {
  const result = page.locator('[data-result]');
  if (mode === 'need') {
    await page.locator('[name=annual]').fill('1000');
    await page.locator('[name=years]').fill('5');
    await page.locator('[name=debts]').fill('500');
    await page.locator('[name=education]').fill('250');
    await page.locator('[name=other]').fill('100');
    await page.locator('[name=available]').fill('850');
    await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
    await expect(result).toContainText('5,000');
  } else if (mode === 'compare') {
    await page.locator('[name=aPremium]').fill('100');
    await page.locator('[name=aExcess]').fill('20');
    await page.locator('[name=aLimit]').fill('1000');
    await page.locator('[name=bPremium]').fill('90');
    await page.locator('[name=bExcess]').fill('50');
    await page.locator('[name=bLimit]').fill('1200');
    await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
    await expect(result).toContainText('Plan A has the lower');
  } else if (mode === 'contribution') {
    await page.locator('[name=base]').fill('1000');
    await page.locator('[name=employee]').fill('2');
    await page.locator('[name=employer]').fill('3');
    await page.locator('[name=months]').fill('12');
    await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
    await expect(result).toContainText('600');
  } else if (mode === 'claim') {
    await page.locator('[name=incident]').fill('2026-07-01');
    await page.locator('[name=planned]').fill('2026-07-06');
    await page.locator('[name=windowDays]').fill('14');
    await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
    await expect(result).toContainText('9 day(s) remain');
  } else if (mode === 'warning') {
    await page.locator('[type=checkbox]').first().check();
    await page.getByRole('button', { name: 'Review signals' }).click();
    await expect(result).toContainText('not a fraud finding');
  } else {
    await page.locator('[name=exposure]').fill('10000');
    await page.locator('[name=rate]').fill('2');
    await page.locator('[name=fixed]').fill('50');
    await page.locator('[name=contingency]').fill('10');
    await page.getByRole('button', { name: 'Calculate from my inputs' }).click();
    await expect(result).toContainText('275');
  }
  await expect(result).toBeFocused();
}

for (const [tool, mode] of Object.entries(modes)) {
  const directory = path.resolve(__dirname, '..', '..', 'tools', tool);
  const files = fs.readdirSync(directory).filter(file => file.endsWith('.html')).sort();
  test.describe(`${tool} route family`, () => {
    for (const file of files) {
      const slug = file === 'index.html' ? '' : file.slice(0, -5);
      const route = `/tools/${tool}/${slug}`;
      test(`${route} executes deterministic inputs and resets privately`, async ({ page }) => {
        const writes = [];
        const errors = [];
        page.on('request', request => {
          if (request.method() !== 'GET') writes.push(request.postData() || '');
        });
        page.on('pageerror', error => errors.push(error.message));
        await page.setViewportSize({ width: slug.length % 2 ? 320 : 375, height: 840 });
        await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('[data-insurance-workflow]')).toHaveAttribute('data-mode', mode);
        await page.getByRole('button', { name: mode === 'warning' ? 'Review signals' : 'Calculate from my inputs' }).click();
        if (mode === 'warning') {
          await expect(page.locator('[data-result]')).toContainText('0 review signal(s)');
        } else {
          await expect(page.locator('[data-result]')).toHaveText('');
        }
        await executeWorkflow(page, mode);
        await page.getByRole('button', { name: 'Reset' }).click();
        await expect(page.locator('[data-result]')).toHaveText('');
        await expect(page.locator('form input, form select').first()).toBeFocused();
        await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
        await expectNoOverflow(page);
        expect(writes.every(body => body === '')).toBe(true);
        expect(errors).toEqual([]);
      });
    }
  });
}
