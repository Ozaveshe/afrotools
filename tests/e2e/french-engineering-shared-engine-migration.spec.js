const { test, expect } = require('@playwright/test');

const routes = [
  {
    route:'/tools/scaffolding-calc/',
    action:/Calculate/i,
    result:'#sg-results',
    invalid:'#sg-perimeter',
    expected:/540\s*m²|3,?954,?000/,
    download:'[data-qe-download="scaffolding-calc"]',
    title:'Scaffolding Calculator'
  },
  {
    route:'/tools/window-door-sizing/',
    action:/Calculate/i,
    result:'#wd-results',
    invalid:'#wd-rooms',
    expected:/MEETS 5% TARGET|BELOW 5% TARGET/,
    download:'[data-qe-download="window-door-sizing"]',
    title:'Window & Door Sizing Guide'
  },
  {
    route:'/tools/plumbing-material/',
    action:/Calculate/i,
    result:'#pm-results',
    invalid:'#pm-baths',
    expected:/353,?400|203,?400/,
    download:'[data-qe-download="plumbing-material"]',
    title:'Plumbing Material Calculator'
  }
];

test('three extracted Engineering engines preserve workflows, fail closed, and export local TXT', async ({ page }) => {
  test.setTimeout(120_000);
  const writes = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.hostname === '127.0.0.1' && request.method() !== 'GET') writes.push(`${request.method()} ${url.pathname}`);
  });
  for (const item of routes) {
    await page.goto(item.route, { waitUntil:'domcontentloaded' });
    await page.getByRole('button', { name:item.action }).first().click();
    await expect(page.locator(item.result)).toHaveClass(/on/);
    await expect(page.locator(item.result)).toContainText(item.expected);

    const downloadEvent = page.waitForEvent('download');
    await page.locator(item.download).click();
    const download = await downloadEvent;
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const text = Buffer.concat(chunks).toString('utf8');
    expect(text).toContain(item.title);
    expect(text).toContain('Generated locally in this browser.');
    expect(text).toContain('Inputs:');
    expect(text).toContain('Results:');
    expect(text).not.toMatch(/\b(?:NaN|Infinity|undefined)\b/);

    await page.locator(item.invalid).fill('0');
    await expect(page.locator(item.invalid)).toHaveValue('0');
    await page.evaluate(route => {
      if (route.includes('scaffolding')) window.calcScaffolding();
      else if (route.includes('window-door')) window.calcWindowDoor();
      else window.calcPlumbing();
    }, item.route);
    await expect(page.locator(item.result)).not.toHaveClass(/on/);
  }
  expect(writes).toEqual([]);
});
