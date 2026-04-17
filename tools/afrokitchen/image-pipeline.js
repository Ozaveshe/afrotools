(function () {
  'use strict';

  var ROOT_PATH = '/assets/img/kitchen';

  function getSlug(input) {
    if (!input) return '';
    if (typeof input === 'string') return input.trim();
    return String(input.slug || '').trim();
  }

  function getFilename(input) {
    var slug = getSlug(input);
    return slug ? slug + '.webp' : '';
  }

  function getPath(input) {
    var filename = getFilename(input);
    return filename ? ROOT_PATH + '/' + filename : '';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function createCardSlotMarkup(recipe, options) {
    var opts = options || {};
    var slug = getSlug(recipe);
    var alt = escapeHtml(opts.alt || recipe.image_alt || recipe.name || '');
    var label = escapeHtml(opts.label || 'AfroKitchen');
    var title = escapeHtml(opts.title || recipe.name || 'Recipe');

    return '' +
      '<div class="ak-recipe-card-thumb ak-img-fallback" data-ak-image-slot="card" data-ak-image-slug="' + escapeHtml(slug) + '" data-ak-image-alt="' + alt + '">' +
        '<div class="ak-card-fallback">' +
          '<div class="ak-card-fallback-label">' + label + '</div>' +
          '<p class="ak-card-fallback-title">' + title + '</p>' +
        '</div>' +
      '</div>';
  }

  function createFeaturedSlotMarkup(recipe, options) {
    var opts = options || {};
    var slug = getSlug(recipe);
    var alt = escapeHtml(opts.alt || recipe.image_alt || recipe.name || '');
    var label = escapeHtml(opts.label || 'Featured recipe');
    var title = escapeHtml(opts.title || recipe.name || 'Recipe');

    return '' +
      '<div class="ak-featured-fallback" data-ak-image-slot="featured" data-ak-image-slug="' + escapeHtml(slug) + '" data-ak-image-alt="' + alt + '">' +
        '<div class="ak-featured-kicker">' + label + '</div>' +
        '<div class="ak-card-fallback-title">' + title + '</div>' +
      '</div>';
  }

  function hydrate(root) {
    var scope = root || document;
    var slots = scope.querySelectorAll('[data-ak-image-slot][data-ak-image-slug]');

    slots.forEach(function (slot) {
      if (slot.dataset.akImageBound === 'true') return;
      slot.dataset.akImageBound = 'true';

      var src = getPath(slot.dataset.akImageSlug);
      if (!src) return;

      var variant = slot.dataset.akImageSlot;
      var alt = slot.dataset.akImageAlt || '';
      var img = new Image();
      img.decoding = 'async';
      if (variant === 'card') img.loading = 'lazy';

      img.onload = function () {
        img.src = src;
        img.alt = alt;

        if (variant === 'featured') {
          img.className = 'ak-featured-img';
          slot.replaceWith(img);
          return;
        }

        slot.className = 'ak-recipe-card-thumb';
        slot.innerHTML = '';
        img.className = 'ak-recipe-card-img';
        slot.appendChild(img);
      };

      img.onerror = function () {
        slot.dataset.akImageMissing = 'true';
      };

      img.src = src;
    });
  }

  function applyHeroBackground(element, recipe, fallbackBackground) {
    if (!element) return Promise.resolve(null);

    var src = getPath(recipe);
    if (fallbackBackground) element.style.background = fallbackBackground;
    element.style.backgroundImage = 'none';

    if (!src) return Promise.resolve(null);

    return new Promise(function (resolve) {
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () {
        element.style.backgroundImage = 'url(' + src + ')';
        element.style.backgroundPosition = 'center';
        element.style.backgroundSize = 'cover';
        resolve(src);
      };
      img.onerror = function () {
        resolve(null);
      };
      img.src = src;
    });
  }

  window.AfroKitchenImages = {
    rootPath: ROOT_PATH,
    getFilename: getFilename,
    getPath: getPath,
    createCardSlotMarkup: createCardSlotMarkup,
    createFeaturedSlotMarkup: createFeaturedSlotMarkup,
    hydrate: hydrate,
    applyHeroBackground: applyHeroBackground
  };
})();
