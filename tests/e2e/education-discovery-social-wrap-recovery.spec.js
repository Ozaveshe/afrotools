'use strict';
const {test, expect} = require('@playwright/test');
const fixtures = require('../fixtures/education-social-wrap-recovery/native-current-main-baseline-five.json');
const {assertHead, assertSourceBody} = require('../support/education-social-wrap-oracle');

const widths = [320, 360, 390, 1365];
for (const fixture of fixtures.rows) for (const width of widths) {
  const route = '/' + fixture.file.replace(/index\.html$/, '');
  const home = route === '/education/';
  test(route + ' social metadata and ' + width + 'px actions', async ({page}) => {
    await page.setViewportSize({width, height:900});
    const errors=[];
    page.on('pageerror', error => errors.push(error.message));
    const response=await page.goto(route, {waitUntil:'load'});
    expect(response.status()).toBe(200);
    const served=await response.text();
    assertSourceBody(served, fixture.raw_html);
    const heads=await page.evaluate(raw => {
      function snapshot(doc) {
        const meta={},counts={};
        for (const node of doc.head.querySelectorAll('meta[name],meta[property]')) {
          const key=(node.getAttribute('property')||node.getAttribute('name')).toLowerCase();
          counts[key]=(counts[key]||0)+1;
          meta[key]=node.getAttribute('content')||'';
        }
        return {title:doc.title,meta,counts,canonical:doc.head.querySelector('link[rel=canonical]')?.getAttribute('href'),
          alternates:[...doc.head.querySelectorAll('link[rel=alternate][hreflang]')].map(n=>[n.getAttribute('hreflang'),n.getAttribute('href')]).sort(),
          robots:meta.robots||'',jsonLd:[...doc.head.querySelectorAll('script[type="application/ld+json"]')].map(n=>JSON.parse(n.textContent))};
      }
      return {actual:snapshot(document),baseline:snapshot(new DOMParser().parseFromString(raw,'text/html'))};
    }, fixture.raw_html);
    assertHead(heads.actual,heads.baseline);
    if (home) {
      const search=page.getByRole('searchbox',{name:'Search by task or tool name'});
      await search.focus();
      await expect(search).toBeFocused();
      await page.keyboard.type('JAMB aggregate');
      await expect(page.locator('a[data-education-tool]:visible')).not.toHaveCount(0);
      await expect(page.locator('#education-search-status')).not.toHaveText('');
      await page.locator('#education-country').selectOption('NG');
      await page.locator('#education-exam').selectOption('jamb');
      await expect(page.locator('a[data-education-tool]:visible')).not.toHaveCount(0);
      await page.getByRole('button',{name:'Clear search and filters'}).click();
      await expect(search).toHaveValue('');
      await expect(page.locator('#education-country')).toHaveValue('');
      await expect(page.locator('#education-exam')).toHaveValue('');
      await expect(page.getByRole('button',{name:'Clear search and filters'})).toBeHidden();
    } else {
      const action=page.locator('.edu-intro .btn');
      await expect(action).toHaveCount(1);
      await action.focus();
      await expect(action).toBeFocused();
      const size=await action.boundingBox();
      expect(size.height).toBeGreaterThanOrEqual(44);
      expect(size.x).toBeGreaterThanOrEqual(0);
      expect(size.x+size.width).toBeLessThanOrEqual(width);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBe(0);
    expect(errors).toEqual([]);
  });
}
