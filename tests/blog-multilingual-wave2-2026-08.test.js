'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'data/content/blog-multilingual-wave2-2026-08.json'), 'utf8'));

function routeFor(locale, slug) {
  return locale === 'en' ? `/blog/${slug}/` : locale === 'fr' ? `/fr/blog/${slug}/` : `/sw/blogu/${slug}/`;
}

function fileFor(locale, slug) {
  const base = locale === 'en' ? 'blog' : locale === 'fr' ? 'fr/blog' : 'sw/blogu';
  return path.join(root, base, slug, 'index.html');
}

function visibleWords(html) {
  const body = (html.match(/<article class="article-body">([\s\S]*?)<\/article>/) || [])[1] || '';
  return body.replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
}

test('wave two owns exactly ten differentiated multilingual clusters', () => {
  assert.equal(source.topics.length, 10);
  const slugs = new Set();
  const keywords = new Set();
  for (const topic of source.topics) {
    assert.ok(topic.sources.length >= 2, `${topic.id} needs at least two sources`);
    for (const locale of ['en', 'fr', 'sw']) {
      const item = topic.locales[locale];
      assert.ok(item);
      assert.ok(!slugs.has(`${locale}:${item.slug}`), `duplicate ${locale} slug ${item.slug}`);
      assert.ok(!keywords.has(item.keyword.toLocaleLowerCase(locale)), `duplicate keyword ${item.keyword}`);
      slugs.add(`${locale}:${item.slug}`);
      keywords.add(item.keyword.toLocaleLowerCase(locale));
    }
  }
});

test('all thirty generated articles meet the publishing contract', () => {
  for (const topic of source.topics) {
    assert.ok(fs.existsSync(path.join(root, 'assets/img/tools', `${topic.image}.webp`)), `missing ${topic.image}.webp`);
    for (const locale of ['en', 'fr', 'sw']) {
      const item = topic.locales[locale];
      const html = fs.readFileSync(fileFor(locale, item.slug), 'utf8');
      const route = routeFor(locale, item.slug);
      assert.match(html, /afrotools-source-owner" content="scripts\/build-blog-multilingual-wave2-2026-08\.js"/);
      assert.ok(html.includes(`<link rel="canonical" href="https://afrotools.com${route}">`));
      for (const alternate of ['en', 'fr', 'sw']) {
        const target = topic.locales[alternate];
        assert.ok(html.includes(`hreflang="${alternate}" href="https://afrotools.com${routeFor(alternate, target.slug)}"`));
      }
      assert.ok(html.includes('hreflang="x-default"'));
      assert.ok(html.includes('blog-typography.css'));
      assert.ok(html.includes(item.tool[0]), `${topic.id}/${locale} missing tool handoff`);
      assert.ok(visibleWords(html) >= 800, `${topic.id}/${locale} is thin`);
      assert.equal((html.match(/"@type":"Article"/g) || []).length, 1);
      assert.equal((html.match(/"@type":"BreadcrumbList"/g) || []).length, 1);
      assert.equal((html.match(/"@type":"FAQPage"/g) || []).length, 1);
      assert.ok(!/[—–]|Ã.|â€|ï¿½/.test(html), `${topic.id}/${locale} contains prohibited typography or mojibake`);
    }
  }
});

test('hub and manifest discovery include the complete wave once', () => {
  const englishHub = fs.readFileSync(path.join(root, 'blog/index.html'), 'utf8');
  const swahiliHub = fs.readFileSync(path.join(root, 'sw/blogu/index.html'), 'utf8');
  const frenchHub = fs.readFileSync(path.join(root, 'fr/blog/index.html'), 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/content/blog-article-manifest.json'), 'utf8'));
  const frenchManifest = JSON.parse(fs.readFileSync(path.join(root, 'data/localization/fr-blog-manifest.json'), 'utf8'));
  for (const topic of source.topics) {
    const en = topic.locales.en;
    const fr = topic.locales.fr;
    const sw = topic.locales.sw;
    assert.equal((englishHub.match(new RegExp(`/blog/${en.slug}/`, 'g')) || []).length, 2);
    assert.equal((swahiliHub.match(new RegExp(`/sw/blogu/${sw.slug}/`, 'g')) || []).length, 1);
    assert.ok(frenchHub.includes(`/fr/blog/${fr.slug}/`));
    assert.equal(manifest.articles.filter((row) => row.file === `blog/${en.slug}/index.html`).length, 1);
    assert.equal(manifest.articles.filter((row) => row.file === `fr/blog/${fr.slug}/index.html`).length, 1);
    assert.equal(frenchManifest.articles.filter((row) => row.slug === fr.slug).length, 1);
  }
});

test('generator check accepts the fully post-processed release output', () => {
  const result = spawnSync(process.execPath, ['scripts/build-blog-multilingual-wave2-2026-08.js'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`.trim());
  assert.match(result.stdout, /0 file\(s\) out of date/);
});
