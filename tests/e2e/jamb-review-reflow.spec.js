const {test, expect} = require('@playwright/test');
const {bank, questions, reviewed} = require('../support/jamb-reviewed-fixtures');

for (const width of [320, 390]) test(`CBT review keeps long answers and status labels readable at ${width}px`, async ({page}, testInfo) => {
  await page.setViewportSize({width, height:900});
  const {review: ignored, ...base} = questions()[0];
  const answer = 'Electromagneticcompatibility';
  const row = reviewed({...base, question:'Select the synthetic label.', options:{A:answer, B:'Second label', C:'Third label', D:'Fourth label'}, answer:'A', explanation:'The first option is the requested synthetic label.'});
  const fixture = bank([row]);
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (!['localhost','127.0.0.1'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
  await page.route('**/data/jamb/pools/*.json', route => route.fulfill({json:route.request().url().endsWith('/index.json') ? fixture.index : fixture.pool}));
  await page.route('**/.netlify/functions/jamb-attempt', route => route.fulfill({json:{ok:true}}));
  await page.goto('/jamb/cbt/', {waitUntil:'load'});
  await page.locator('#start-btn').click();
  await page.getByRole('radio', {name:'Option A: '+answer, exact:true}).click();
  await page.locator('#cbt-submit-top').click();
  await page.locator('#confirm-submit-btn').click();
  await expect(page.locator('#result-pct')).toHaveText('100');
  await page.locator('[data-filter="all"]').click();
  const option = page.locator('.rev-opt.correct');
  await expect(option).toContainText(answer);
  await expect(option.locator('.rev-opt-tag')).toHaveText('Your answer · Correct');
  const geometry = await option.evaluate(element => ({
    viewport:innerWidth, documentWidth:document.documentElement.scrollWidth,
    children:[...element.children].map(child => ({top:child.getBoundingClientRect().top, right:child.getBoundingClientRect().right, width:child.clientWidth, contentWidth:child.scrollWidth}))
  }));
  expect(geometry.documentWidth, JSON.stringify(geometry)).toBeLessThanOrEqual(width+1);
  expect(Math.abs(geometry.children[0].top - geometry.children[1].top)).toBeLessThanOrEqual(1);
  for (const child of geometry.children) {
    expect(child.right).toBeLessThanOrEqual(width+1);
    expect(child.contentWidth).toBeLessThanOrEqual(child.width+1);
  }
  await option.screenshot({path:testInfo.outputPath('answer-review.png')});
});
