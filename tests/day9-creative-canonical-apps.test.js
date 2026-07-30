const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');

const IDS = [
  'african-palette', 'afrostream', 'art-commission', 'book-publishing-cost',
  'creator-analytics', 'creator-bios', 'creator-brand', 'creator-calendar',
  'creator-canvas', 'creator-captions', 'creator-carousel', 'creator-clip',
  'creator-club', 'creator-course', 'creator-desk', 'creator-hashtags',
  'creator-hooks', 'creator-invoice', 'creator-kit', 'creator-mail',
  'creator-mind', 'creator-money', 'creator-page', 'creator-polish',
  'creator-pricing', 'creator-record', 'creator-repurpose', 'creator-research',
  'creator-resize', 'creator-schedule', 'creator-scripts', 'creator-split',
  'creator-stock', 'creator-team', 'creator-thumb', 'creator-titles',
  'creator-voice', 'engagement-rate', 'linkedin-optimizer',
  'music-royalty-splitter', 'personal-brand-audit', 'photography-pricing',
  'podcast-monetization', 'self-publishing-royalty',
  'social-media-calendar', 'wedding-photo-package',
];

const LAUNCHERS = new Set(IDS.filter((id) => id.startsWith('creator-')));
const ESTIMATE_ROUTES = new Set([
  'african-palette', 'art-commission', 'book-publishing-cost',
  'engagement-rate', 'linkedin-optimizer', 'music-royalty-splitter',
  'personal-brand-audit', 'photography-pricing', 'podcast-monetization',
  'self-publishing-royalty', 'social-media-calendar',
  'wedding-photo-package',
]);

test('Creative registry inventory is exactly 46 English canonical destinations', () => {
  assert.equal(IDS.length, 46);
  assert.equal(new Set(IDS).size, 46);
  assert.equal(LAUNCHERS.size, 33);
  assert.equal(IDS.length - LAUNCHERS.size, 13);
});

for (const id of IDS) {
  test(`${id} has a complete canonical and search contract`, () => {
    const file = path.join(ROOT, 'tools', id, 'index.html');
    assert.ok(fs.existsSync(file), `${id} index route is missing`);
    const html = fs.readFileSync(file, 'utf8');
    const title = (html.match(/<title>([^<]+)<\/title>/i) || [])[1] || '';
    const description =
      (html.match(/<meta name="description" content="([^"]+)"/i) || [])[1] || '';
    const schemas = Array.from(
      html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi),
      (match) => JSON.parse(match[1])
    );

    assert.ok(title.length >= 20 && title.length <= 65, `${id} title length ${title.length}`);
    assert.ok(
      description.length >= 80 && description.length <= 160,
      `${id} description length ${description.length}`
    );
    assert.match(
      html,
      new RegExp(`<link rel="canonical" href="https://afrotools\\.com/tools/${id}/">`)
    );
    assert.ok(
      schemas.some((schema) =>
        ['WebApplication', 'SoftwareApplication'].includes(schema['@type'])
      )
    );
    assert.doesNotMatch(html, /<form\b[^>]*\baction=["'][^"']+["']/i);

    if (LAUNCHERS.has(id)) {
      assert.match(
        html,
        new RegExp(`href="(?:app\\.html(?:\\?[^"]*)?|/tools/${id}/app)"`)
      );
      assert.ok(fs.existsSync(path.join(ROOT, 'tools', id, 'app.html')));
      const ctas = Array.from(
        html.matchAll(
          new RegExp(
            `<a\\b[^>]*href="(?:app\\.html[^"]*|/tools/${id}/app)"[^>]*>([\\s\\S]*?)<\\/a>`,
            'gi'
          )
        ),
        (match) => match[1].replace(/<[^>]+>/g, '').trim()
      );
      assert.ok(ctas.some(Boolean));
      assert.ok(ctas.every((label) => !/\s\?$/.test(label)), `${id} has a broken CTA label`);
    }

    if (ESTIMATE_ROUTES.has(id)) {
      assert.match(html, /data-day9-creative-boundary/);
    }
  });
}

test('Creative estimate copy does not present a fixed currency conversion as live', () => {
  const html = fs.readFileSync(
    path.join(ROOT, 'tools', 'book-publishing-cost', 'index.html'),
    'utf8'
  );
  const controller = fs.readFileSync(
    path.join(
      ROOT,
      'assets',
      'js',
      'pages',
      'creative',
      'book-publishing-cost-controller.js'
    ),
    'utf8'
  );
  const publicOwner = `${html}\n${controller}`;
  assert.match(publicOwner, /using the built-in planning rate/);
  assert.doesNotMatch(publicOwner, /at current exchange rate/i);
});
