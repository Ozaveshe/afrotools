const { test, expect } = require('@playwright/test');

for (const width of [390, 1440]) {
  test(`blog reading controls and recommendations reflow at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/blog/import-duty-nigeria-2026/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.article-toc a').first()).toBeVisible();

    const layout = await page.evaluate(() => {
      const box = (element) => {
        const { left, right, top, bottom, width } = element.getBoundingClientRect();
        return { left, right, top, bottom, width };
      };
      const article = document.querySelector('.article-body');
      const toc = document.querySelector('.article-toc');
      return {
        article: box(article), toc: box(toc),
        contained: !!toc.closest('.article-layout'),
        overflow: document.documentElement.scrollWidth > innerWidth,
        inlineLinkDisplay: getComputedStyle(article.querySelector('p a')).display,
        relatedAnchor: !!document.getElementById('related-articles'),
        links: [...toc.querySelectorAll('a')].map((link) => !!document.getElementById(link.hash.slice(1))),
        cards: [...document.querySelectorAll('.related-card')].map((card) => ({
          card: box(card), badge: box(card.querySelector('.category-badge, .related-badge')),
          title: box(card.querySelector('h3')), description: box(card.querySelector('p'))
        }))
      };
    });
    expect(layout.contained).toBe(true);
    expect(layout.overflow).toBe(false);
    expect(layout.toc.left).toBeGreaterThanOrEqual(layout.article.left - 1);
    expect(layout.toc.right).toBeLessThanOrEqual(layout.article.right + 1);
    expect(layout.toc.width).toBeLessThanOrEqual(760);
    expect(layout.links.every(Boolean)).toBe(true);
    expect(layout.inlineLinkDisplay).toBe('inline');
    expect(layout.relatedAnchor).toBe(true);
    expect(layout.cards).toHaveLength(3);
    for (const { card, badge, title, description } of layout.cards) {
      expect(title.top).toBeGreaterThanOrEqual(badge.bottom);
      expect(description.top).toBeGreaterThanOrEqual(title.bottom);
      expect(title.width).toBeGreaterThan(card.width * 0.65);
      expect(description.right).toBeLessThanOrEqual(card.right);
    }

    await page.locator('.article-toc').screenshot({ path: testInfo.outputPath('contents.png') });
    await page.locator('.related-articles').screenshot({ path: testInfo.outputPath('related-articles.png') });

    await page.locator('.article-toc a[href="#vehicle-imports-need-a-fresh-quote"]').click();
    await expect(page).toHaveURL(/#vehicle-imports-need-a-fresh-quote$/);
    await expect(page.locator('#vehicle-imports-need-a-fresh-quote')).toBeInViewport();
    await expect.poll(() => page.locator('#vehicle-imports-need-a-fresh-quote')
      .evaluate((heading) => heading.getBoundingClientRect().top)).toBeGreaterThanOrEqual(80);
  });
}

for (const width of [390, 1440]) {
  test(`shared linked tool cards retain their layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/energy/', { waitUntil: 'domcontentloaded' });
    const card = page.locator('.en-tool-card').first();
    await expect(card).toBeVisible();
    const layout = await card.evaluate((element) => {
      const name = element.querySelector('.en-tc-name').getBoundingClientRect();
      const description = element.querySelector('.en-tc-desc').getBoundingClientRect();
      return {
        display: getComputedStyle(element).display,
        titleBottom: name.bottom, descriptionTop: description.top,
        textRight: description.right, cardRight: element.getBoundingClientRect().right
      };
    });
    expect(['block', 'flex', 'grid']).toContain(layout.display);
    expect(layout.descriptionTop).toBeGreaterThanOrEqual(layout.titleBottom);
    expect(layout.textRight).toBeLessThanOrEqual(layout.cardRight);
  });
}

for (const route of ['/', '/energy/', '/api/', '/fr/blog/', '/sw/blogu/', '/tools/import-duty/']) {
  test(`${route} keeps UI headings sans serif without Google Fonts`, async ({ page }) => {
    await page.route('https://fonts.googleapis.com/**', (request) => request.abort());
    await page.route('https://fonts.gstatic.com/**', (request) => request.abort());
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible();
    const fonts = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((headings) =>
      headings.filter((heading) => heading.getBoundingClientRect().height > 0)
        .map((heading) => ({ text: heading.textContent.trim(), family: getComputedStyle(heading).fontFamily }))
    );
    for (const heading of fonts) expect(heading.family, heading.text).toContain('DM Sans');
    expect(fonts.length).toBeGreaterThan(0);
  });
}
