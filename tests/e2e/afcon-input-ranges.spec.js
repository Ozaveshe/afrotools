const { test, expect } = require('@playwright/test');

const route = '/tools/afcon-predictor/';
const fields = ['formBoost', 'defenseBoost', 'hostBoost', 'upsetTolerance'];
const report = '[data-report-preview]';
const status = '[data-afcon-input-status]';

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
    return route.fulfill({ status: 204, body: '' });
  });
});

for (const variant of [{width:320,theme:'light'}, {width:390,theme:'dark'}]) {
  for (const name of fields) {
  test(`AFCON validates ${name} and restores the report ${variant.width} ${variant.theme}`, async ({ page }) => {
    const errors=[];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({width:variant.width,height:844});
    await page.emulateMedia({colorScheme:variant.theme,reducedMotion:'reduce'});
    await page.goto(route);
    await expect(page.locator('.sports-result-value')).toHaveText('8.0%');
    await page.locator('#sports-favorite').selectOption('Nigeria');
    // Reproduce the former overflow before checking the new field metadata.
    await page.locator('#sports-formBoost').fill('1000000');
    await page.getByRole('button',{name:'Calculate',exact:true}).click();
    await expect(page.locator(status)).toHaveText('Enter a value from 0 to 10 for Recent form boost.');
    await expect(page.locator('#sports-formBoost')).toBeFocused();
    await expect(page.locator(report)).toHaveCount(0);
    await expect(page.locator('[data-print-report]')).toHaveCount(0);
    await expect(page.locator('[data-copy-local-report]')).toHaveCount(0);

      for (const value of ['-1', '', '10.5', '1000000']) {
        await page.getByRole('button',{name:'Reset',exact:true}).click();
        const field=page.locator('#sports-'+name);
        await expect(field).toHaveAttribute('min','0');
        await expect(field).toHaveAttribute('max','10');
        await field.fill(value);
        await page.getByRole('button',{name:'Calculate',exact:true}).click();
        await expect(page.locator(status)).toContainText('Enter a value from 0 to 10');
        await expect(field).toHaveAttribute('aria-invalid','true');
        await expect(field).toBeFocused();
        expect(await field.evaluate(node=>node.validity.valid)).toBe(false);
        await expect(page.locator(report)).toHaveCount(0);
        await expect(page.locator('[data-print-report]')).toHaveCount(0);
        await expect(page.locator('[data-copy-local-report]')).toHaveCount(0);
        await field.fill('0.5');
        // The invalid report stays absent until a real change/submit calculation.
        await expect(page.locator(report)).toHaveCount(0);
        await page.getByRole('button',{name:'Calculate',exact:true}).click();
        await expect(page.locator(report)).toContainText('0.5');
        await expect(page.locator(status)).toBeHidden();
        await expect(field).not.toHaveAttribute('aria-invalid','true');
        expect(await field.evaluate(node=>node.validity.valid)).toBe(true);
        for (const boundary of ['0','10']) {
          await field.fill(boundary);
          await field.press('Tab');
          await expect(page.locator(report)).toBeVisible();
          await expect(page.locator(status)).toBeHidden();
          expect(await field.evaluate(node=>node.validity.valid)).toBe(true);
        }
      }
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    await expect(page.locator('.sports-result-value')).toHaveText('8.0%');
    await expect(page.locator(report)).toContainText('Recent form boost: 3');
    await expect(page.locator('.sports-status')).toHaveText('Local planning calculator');
    await expect(page.locator(report)).toContainText("Compare your team's rank with the strongest contenders");
    await expect(page.locator(report)).not.toContainText('Competitor tournament tools');
    expect(await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-innerWidth))).toBe(0);
    expect(errors).toEqual([]);
  });
  }

  test(`AFCON invalid edits cancel held copy feedback ${variant.width} ${variant.theme}`, async ({ page }) => {
    await page.setViewportSize({width:variant.width,height:844});
    await page.emulateMedia({colorScheme:variant.theme,reducedMotion:'reduce'});
    await page.goto(route);
    await page.evaluate(()=>{
      window.__copyPayloads=[];
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText(text){
        window.__copyPayloads.push(text);
        return new Promise(resolve=>{window.__finishAfconCopy=resolve;});
      }}});
    });
    const original=await page.locator(report).textContent();
    await page.locator('[data-copy-local-report]').click();
    await expect(page.locator('[data-afcon-report-status]')).toHaveText('Copying report…');
    await page.locator('#sports-hostBoost').fill('1000000');
    await expect(page.locator(report)).toHaveCount(0);
    await expect(page.locator('[data-afcon-report-status]')).toHaveCount(0);
    await page.evaluate(()=>window.__finishAfconCopy());
    await expect(page.locator(status)).toContainText('Host or crowd advantage');
    await expect(page.locator('body')).not.toContainText('Report copied locally.');
    expect(await page.evaluate(()=>window.__copyPayloads)).toEqual([original]);
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    await expect(page.locator('.sports-result-value')).toHaveText('8.0%');
    await expect(page.locator(status)).toBeHidden();
    await expect(page.locator(report)).toBeVisible();
  });
}
