'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { filterSupersededRecipeCover } = require('../scripts/generate-afrokitchen-static-pages');
const covers = require('../data/image-generation/recipe-image-aliases.json').versioned_covers;
const slug = 'achu-soup-cm';
const current = '/assets/img/kitchen/' + covers[slug] + '.webp';
const old = '/assets/img/kitchen/' + slug + '.webp';
const image = src => ({ src, alt: 'preserve description', caption: 'preserve caption' });

test('selected versioned cover excludes only its superseded same-origin original', () => {
  const retained = [image(current), image('/assets/img/kitchen/jollof-rice-ng.webp'), image('/assets/img/kitchen/achu-soup-cm-2.webp'), image('https://example.org' + old), image('https://afrotools.com.example.org' + old)];
  const input = [...retained, image(old), image('https://afrotools.com' + old + '?v=old#photo')];
  assert.deepEqual(filterSupersededRecipeCover(input, { slug }, { pageImage: current }), retained);
  assert.equal(input.length, 7, 'input collection is not mutated');
  assert.deepEqual(filterSupersededRecipeCover(input, { slug }, { pageImage: 'https://afrotools.com' + current }), retained);
});

test('unversioned recipes and unselected or absent replacement keep their existing gallery', () => {
  const input = [image(old), image('/assets/img/kitchen/jollof-rice-ng.webp')];
  assert.equal(filterSupersededRecipeCover(input, { slug: 'unmapped-recipe' }, { pageImage: old }), input);
  assert.equal(filterSupersededRecipeCover(input, { slug }, { pageImage: old }), input);
  assert.equal(filterSupersededRecipeCover(input, { slug }, { pageImage: current }), input, 'missing current gallery entry keeps fallback');
  const withCurrent = [...input, image(current)];
  assert.equal(filterSupersededRecipeCover(withCurrent, { slug }, { pageImage: 'https://example.org' + current }), withCurrent);
});
