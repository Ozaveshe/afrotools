const { test, expect } = require('@playwright/test');

// Synthetic API data only; all provider requests are blocked or fulfilled locally.
const { marker, creator, related, news, supporter, cases } = {
  "marker": "<img src=\"/synthetic-marker-image.svg\" onerror=\"window.__profileMarker=(window.__profileMarker||0)+1\">",
  "creator": {
    "id": 42,
    "slug": "synthetic-creator",
    "name": "Synthetic Creator",
    "avatar": "SC",
    "country": "NG",
    "bio": "Synthetic profile.",
    "category": "education",
    "primary_platform": "youtube",
    "youtube_url": "https://www.youtube.com/@syntheticcreator",
    "total_followers": 1200,
    "is_published": true
  },
  "related": {
    "id": 43,
    "slug": "synthetic-related",
    "name": "Synthetic Related",
    "avatar": "SR",
    "country": "NG",
    "bio": "Synthetic profile.",
    "category": "education",
    "primary_platform": "youtube",
    "youtube_url": "https://www.youtube.com/@syntheticcreator",
    "total_followers": 1200,
    "is_published": true
  },
  "news": {
    "title": "Synthetic news",
    "source_name": "Synthetic source",
    "excerpt": "Synthetic excerpt",
    "source_url": "https://example.test/article",
    "published_at": "2026-10-01T00:00:00Z"
  },
  "supporter": {
    "supporter_name": "Synthetic supporter",
    "source_label": "Synthetic source",
    "amount": 1,
    "is_verified": true
  },
  "cases": [
    {
      "name": "country name",
      "selector": "#profileCountry, #profileBadges",
      "creator": {
        "country": "ZZ",
        "country_name": "<img src=\"/synthetic-marker-image.svg\" onerror=\"window.__profileMarker=(window.__profileMarker||0)+1\">"
      }
    },
    {
      "name": "country flag",
      "selector": "#profileCountry",
      "creator": {
        "flag": "<img src=\"/synthetic-marker-image.svg\" onerror=\"window.__profileMarker=(window.__profileMarker||0)+1\">"
      }
    },
    {
      "name": "related avatar",
      "selector": "#relatedGrid",
      "similar": {
        "avatar": "<img src=\"/synthetic-marker-image.svg\" onerror=\"window.__profileMarker=(window.__profileMarker||0)+1\">"
      }
    },
    {
      "name": "related name",
      "selector": "#relatedGrid",
      "similar": {
        "name": "<img src=\"/synthetic-marker-image.svg\" onerror=\"window.__profileMarker=(window.__profileMarker||0)+1\">"
      }
    },
    {
      "name": "related category",
      "selector": "#relatedGrid",
      "similar": {
        "category": "<img src=\"/synthetic-marker-image.svg\" onerror=\"window.__profileMarker=(window.__profileMarker||0)+1\">"
      }
    },
    {
      "name": "related slug attribute",
      "selector": "#relatedGrid",
      "similar": {
        "slug": "x\"><img src=\"/synthetic-marker-image.svg\" onerror=\"window.__profileMarker=(window.__profileMarker||0)+1\">"
      }
    },
    {
      "name": "supporter name",
      "selector": "#giftersList",
      "supporter": {
        "supporter_name": "<img src=\"/synthetic-marker-image.svg\" onerror=\"window.__profileMarker=(window.__profileMarker||0)+1\">"
      }
    },
    {
      "name": "supporter source",
      "selector": "#giftersList",
      "supporter": {
        "source_label": "<img src=\"/synthetic-marker-image.svg\" onerror=\"window.__profileMarker=(window.__profileMarker||0)+1\">"
      }
    },
    {
      "name": "news source",
      "selector": "#newsList",
      "news": {
        "source_name": "<img src=\"/synthetic-marker-image.svg\" onerror=\"window.__profileMarker=(window.__profileMarker||0)+1\">"
      }
    },
    {
      "name": "news title",
      "selector": "#newsList",
      "news": {
        "title": "<img src=\"/synthetic-marker-image.svg\" onerror=\"window.__profileMarker=(window.__profileMarker||0)+1\">"
      }
    },
    {
      "name": "news excerpt",
      "selector": "#newsList",
      "news": {
        "excerpt": "<img src=\"/synthetic-marker-image.svg\" onerror=\"window.__profileMarker=(window.__profileMarker||0)+1\">"
      }
    },
    {
      "name": "news URL attribute",
      "selector": "#newsList",
      "news": {
        "source_url": "https://example.test/x\"><img src=\"/synthetic-marker-image.svg\" onerror=\"window.__profileMarker=(window.__profileMarker||0)+1\">"
      }
    },
    {
      "name": "hero markup with absent image",
      "selector": "#profileAvatar",
      "creator": {
        "avatar": "<img src=\"/synthetic-marker-image.svg\" onerror=\"window.__profileMarker=(window.__profileMarker||0)+1\">"
      }
    },
    {
      "name": "hero markup with broken image",
      "selector": "#profileAvatar",
      "creator": {
        "avatar": "<img src=\"/synthetic-marker-image.svg\" onerror=\"window.__profileMarker=(window.__profileMarker||0)+1\">",
        "avatar_url": "/synthetic-broken.svg"
      }
    },
    {
      "name": "literal ampersand and quotes",
      "selector": "#relatedGrid",
      "similar": {
        "name": "A&B <C> \"D\""
      },
      "safeCase": "literal"
    },
    {
      "name": "valid hero image",
      "selector": "#profileAvatar",
      "creator": {
        "avatar": "/synthetic-valid.svg"
      },
      "safeCase": "heroPhoto"
    },
    {
      "name": "valid related image",
      "selector": "#relatedGrid",
      "similar": {
        "avatar": "/synthetic-valid.svg"
      },
      "safeCase": "relatedPhoto"
    },
    {
      "name": "news javascript URL",
      "selector": "#newsList",
      "news": {
        "source_url": "javascript:window.__profileMarker=1"
      },
      "safeCase": "blockedLink"
    },
    {
      "name": "news data URL",
      "selector": "#newsList",
      "news": {
        "source_url": "data:text/html,<script>window.__profileMarker=1</script>"
      },
      "safeCase": "blockedLink"
    },
    {
      "name": "news relative link",
      "selector": "#newsList",
      "news": {
        "source_url": "/tools/afrostream/article?slug=synthetic"
      },
      "safeCase": "internalLink"
    },
    {
      "name": "news external link and query",
      "selector": "#newsList",
      "news": {
        "source_url": "https://example.test/article?a=1&b=2"
      },
      "safeCase": "externalLink"
    },
    {
      "name": "related slug encoding",
      "selector": "#relatedGrid",
      "similar": {
        "slug": "A \"B\"&C"
      },
      "safeCase": "encodedSlug"
    }
  ]
};

async function openProfile(page, item) {
  const row = { ...creator, ...item.creator };
  const similar = item.similar ? [{ ...related, ...item.similar }] : [];
  const supporters = item.supporter ? [{ ...supporter, ...item.supporter }] : [];
  const newsRows = item.news ? [{ ...news, ...item.news }] : [];
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
    if (url.pathname === '/api/afrostream/creator') return route.fulfill({ json: { success: true, data: { creator: row, streams: [], similar, snapshots: [], supporters, news: newsRows, coverage: {} } } });
    if (url.pathname === '/api/afrostream/creators') return route.fulfill({ json: { success: true, data: [row] } });
    if (url.pathname.startsWith('/api/afrostream/')) return route.fulfill({ json: { success: true, data: [] } });
    if (url.pathname === '/synthetic-valid.svg') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="blue"/></svg>' });
    if (url.pathname.startsWith('/synthetic-')) return route.fulfill({ status: 404, body: '' });
    return route.continue();
  });
  await page.goto('/tools/afrostream/creator.html?id=synthetic-creator');
  await page.waitForFunction(() => Boolean(window._asCreator));
  return row;
}

for (const item of cases) {
  test('creator profile safely renders ' + item.name, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await openProfile(page, item);
    await expect(page.locator('#profileName')).toHaveText(creator.name);
    expect(await page.evaluate(() => window.__profileMarker || 0)).toBe(0);
    await expect(page.locator(item.selector).locator('img[src="/synthetic-marker-image.svg"]')).toHaveCount(0);
    if (!item.safeCase && !/attribute/.test(item.name)) {
      expect((await page.locator(item.selector).allTextContents()).some(text => text.includes(marker))).toBe(true);
    }
    if (item.safeCase === 'literal') await expect(page.locator('#relatedGrid .as-related-name')).toHaveText('A&B <C> "D"');
    if (item.safeCase === 'heroPhoto') {
      await expect.poll(() => page.locator('#profileAvatar').evaluate(node => node.style.backgroundImage)).toContain('synthetic-valid.svg');
      await expect(page.locator('#profileAvatar')).toHaveText('');
    }
    if (item.safeCase === 'relatedPhoto') await expect.poll(() => page.locator('#relatedGrid .as-related-avatar').evaluate(node => node.style.backgroundImage)).toContain('synthetic-valid.svg');
    if (item.safeCase === 'blockedLink') await expect(page.locator('.as-news-card')).toHaveAttribute('href', '#');
    if (item.safeCase === 'internalLink') {
      const expected = new URL('/tools/afrostream/article?slug=synthetic', page.url()).href;
      await expect(page.locator('.as-news-card')).toHaveAttribute('href', expected);
      expect(await page.locator('.as-news-card').getAttribute('target')).toBeNull();
    }
    if (item.safeCase === 'externalLink') {
      await expect(page.locator('.as-news-card')).toHaveAttribute('href', 'https://example.test/article?a=1&b=2');
      await expect(page.locator('.as-news-card')).toHaveAttribute('target', '_blank');
      await expect(page.locator('.as-news-card')).toHaveAttribute('rel', 'noopener');
    }
    if (item.safeCase === 'encodedSlug') await expect(page.locator('#relatedGrid .as-related-card')).toHaveAttribute('href', 'creator.html?id=' + encodeURIComponent('A "B"&C'));
    await page.locator('#followPlatformBtn').focus();
    await expect(page.locator('#followPlatformBtn')).toBeFocused();
    await expect(page.locator('#followPlatformBtn')).toHaveAttribute('href', creator.youtube_url);
    expect(errors).toEqual([]);
  });
}
