const { test, expect } = require('@playwright/test');

for (const width of [375, 1280]) {
  test(`Orange Money withdrawal guide preserves navigation and FAQ at ${width}px`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
    await page.goto('/fr/blog/frais-orange-money-guide-2026/');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/fr/blog/frais-orange-money-guide-2026/');
    await expect(page.locator('#retrait-million')).toHaveCount(1);
    for (const id of ['cameroun', 'retrait-million', 'senegal', 'mali', 'cote-ivoire']) {
      await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
      await expect(page.locator(`nav[aria-label="Tarifs Orange Money par pays"] a[href="#${id}"]`)).toHaveCount(1);
    }
    const summary = page.getByText('Peut-on retirer 1 000 000 FCFA en une seule opération au Cameroun ?', { exact: true });
    await summary.focus();
    await page.keyboard.press('Enter');
    const answer = summary.locator('..').locator('.faq-answer');
    await expect(answer).toBeVisible();
    await expect(answer).toContainText('8 008 FCFA');
    const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent)));
    const faq = schemas.find(schema => schema['@type'] === 'FAQPage');
    const visibleFaq = await page.locator('details.faq-item').evaluateAll(nodes => nodes.map(node => ({
      name: node.querySelector('summary').textContent.trim(),
      text: node.querySelector('.faq-answer').textContent.trim(),
    })));
    expect(visibleFaq).toHaveLength(5);
    expect(faq.mainEntity.map(item => ({ name: item.name, text: item.acceptedAnswer.text }))).toEqual(visibleFaq);
    const question = faq.mainEntity.find(item => item.name.includes('1 000 000'));
    expect((await answer.innerText()).trim()).toBe(question.acceptedAnswer.text);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
  });
}
