const {test,expect}=require('@playwright/test');
test('homepage country and category reach actual matching directory results',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/sw/');
 await page.locator('#swCountry').selectOption('kenya');await page.locator('#swCategory').selectOption('financial');
 await expect(page.locator('#swEvidence')).toHaveCount(0);
 await page.locator('#swCountry').locator('..').locator('button').click();
 await expect(page.locator('#search-results-section')).toBeVisible();
 const links=await page.locator('#search-results-grid a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));expect(links.length).toBeGreaterThan(0);
 const invalid=await page.evaluate(links=>links.filter(href=>!AFRO_TOOLS.some(t=>t.href===href&&t.category==='financial'&&(t.countries||[]).some(c=>['KE','ALL'].includes(c)))),links);expect(invalid).toEqual([]);
 await expect(page.locator('#search-results-title')).toContainText('kenya');
 await expect(page.locator('form[action="/sw/zana-zote/"] [name=country]').first()).toHaveValue('kenya');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#sw-directory-clear-filters').click();await expect(page).toHaveURL(/\/sw\/zana-zote\/$/);
});
test('country aliases, unknown countries and legacy evidence filters are explicit',async({page})=>{
 await page.goto('/sw/zana-zote/?country=Afrika%20Kusini&category=financial');await expect(page.locator('#search-results-grid a').first()).toBeVisible();
 await page.goto('/sw/zana-zote/?country=UnknownPlace&category=financial');await expect(page.locator('#search-results-section')).toBeVisible();await expect(page.locator('#search-results-grid a')).toHaveCount(0);
 await page.goto('/sw/zana-zote/?country=kenya&category=financial&evidence=official');await expect(page.locator('#search-results-summary')).toContainText('hakijatumika');await expect(page.locator('#search-results-grid a').first()).toBeVisible();
});
test('text search remains usable and does not bypass selected filters',async({page})=>{
 await page.goto('/sw/zana-zote/?q=PAYE');await expect(page.locator('#search-results-grid a').first()).toBeVisible();
 await page.goto('/sw/zana-zote/?q=PAYE&country=UnknownPlace&category=financial');await expect(page.locator('#search-results-grid a')).toHaveCount(0);
 await page.locator('#sw-directory-clear-filters').click();await expect(page).toHaveURL(/\?q=PAYE$/);await expect(page.locator('#search-results-grid a').first()).toBeVisible();
});
