(function () {
  "use strict";

  var rootPath = "/assets/img/kitchen";
  var extensions = [".webp", ".jpg", ".jpeg", ".png"];
  var legacyAliases = {};

  function slugOf(input) {
    if (!input) return "";
    return (typeof input === "string" ? input : String(input.slug || "")).trim();
  }

  function unique(items) {
    var seen = {};
    return items.filter(function (item) {
      if (!item || seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }

  function candidateFiles(slug) {
    var safeSlug = slugOf(slug);
    if (!safeSlug) return [];

    var stems = [safeSlug, safeSlug + "-1", safeSlug + "-2", safeSlug + "-3", safeSlug + "-4", safeSlug + "-5"];
    var files = [];

    stems.forEach(function (stem) {
      extensions.forEach(function (extension) {
        files.push(stem + extension);
      });
    });

    return unique(files.concat(legacyAliases[safeSlug] || []));
  }

  function getCandidatePaths(input) {
    return unique([getKnownHeroSrc(input)].concat(candidateFiles(input).map(function (file) {
      return rootPath + "/" + file;
    })));
  }

  function getIntelligenceEntry(input) {
    var slug = slugOf(input);
    var data = window.AfroKitchenCuisineIntelligence;
    if (!slug || !data || !data.recipes) return null;
    return data.recipes[slug] || null;
  }

  function getKnownHeroSrc(input) {
    var entry = getIntelligenceEntry(input);
    return entry && entry.image && entry.image.hero_src ? entry.image.hero_src : "";
  }

  function shouldProbeForImage(input) {
    var entry = getIntelligenceEntry(input);
    if (!entry || !entry.image) return true;
    return entry.image.hero_ready !== false;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function loadFirst(paths, configure, onLoad, onMissing) {
    var index = 0;

    (function tryNext() {
      if (index >= paths.length) {
        if (onMissing) onMissing();
        return;
      }

      var image = new Image();
      var src = paths[index];
      index += 1;
      image.decoding = "async";
      if (configure) configure(image);
      image.onload = function () {
        if (onLoad) onLoad(image, src);
      };
      image.onerror = tryNext;
      image.src = src;
    })();
  }

  window.AfroKitchenImages = {
    rootPath: rootPath,
    extensions: extensions.slice(),
    getFilename: function (input, extension) {
      var slug = slugOf(input);
      return slug ? slug + (extension || ".webp") : "";
    },
    getPath: function (input) {
      var paths = getCandidatePaths(input);
      return paths.length ? paths[0] : "";
    },
    getImageUrl: function (input) {
      var knownHeroSrc = getKnownHeroSrc(input);
      if (knownHeroSrc) return knownHeroSrc;
      if (!shouldProbeForImage(input)) return "/assets/img/tools/afrokitchen.webp";
      var paths = getCandidatePaths(input);
      return paths.length ? paths[0] : "/assets/img/tools/afrokitchen.webp";
    },
    getCandidatePaths: getCandidatePaths,
    createCardSlotMarkup: function (recipe, options) {
      var settings = options || {};
      var slug = slugOf(recipe);
      var alt = escapeHtml(settings.alt || recipe.image_alt || recipe.name || "");
      var label = escapeHtml(settings.label || "AfroKitchen");
      var title = escapeHtml(settings.title || recipe.name || "Recipe");

      return '<div class="ak-recipe-card-thumb ak-img-fallback" data-ak-image-slot="card" data-ak-image-slug="' +
        escapeHtml(slug) +
        '" data-ak-image-alt="' +
        alt +
        '"><div class="ak-card-fallback"><div class="ak-card-fallback-label">' +
        label +
        '</div><p class="ak-card-fallback-title">' +
        title +
        "</p></div></div>";
    },
    createFeaturedSlotMarkup: function (recipe, options) {
      var settings = options || {};
      var slug = slugOf(recipe);
      var alt = escapeHtml(settings.alt || recipe.image_alt || recipe.name || "");

      return '<div class="ak-featured-fallback" data-ak-image-slot="featured" data-ak-image-slug="' +
        escapeHtml(slug) +
        '" data-ak-image-alt="' +
        alt +
        '" aria-hidden="true"></div>';
    },
    hydrate: function (root) {
      (root || document).querySelectorAll("[data-ak-image-slot][data-ak-image-slug]").forEach(function (slot) {
        if (slot.dataset.akImageBound === "true") return;
        slot.dataset.akImageBound = "true";
        if (!shouldProbeForImage(slot.dataset.akImageSlug)) {
          slot.dataset.akImageMissing = "true";
          return;
        }

        loadFirst(
          getCandidatePaths(slot.dataset.akImageSlug),
          function (image) {
            if (slot.dataset.akImageSlot === "card") image.loading = "lazy";
          },
          function (image) {
            image.alt = slot.dataset.akImageAlt || "";

            if (slot.dataset.akImageSlot === "featured") {
              image.className = "ak-featured-img";
              slot.replaceWith(image);
              return;
            }

            slot.className = "ak-recipe-card-thumb";
            slot.innerHTML = "";
            image.className = "ak-recipe-card-img";
            slot.appendChild(image);
          },
          function () {
            slot.dataset.akImageMissing = "true";
          }
        );
      });
    },
    applyHeroBackground: function (element, recipe, fallbackBackground) {
      if (!element) return Promise.resolve(null);
      if (fallbackBackground) element.style.background = fallbackBackground;
      element.style.backgroundImage = "none";
      if (!shouldProbeForImage(recipe)) return Promise.resolve(null);

      return new Promise(function (resolve) {
        loadFirst(
          getCandidatePaths(recipe),
          null,
          function (_image, src) {
            element.style.backgroundImage = "url(" + src + ")";
            element.style.backgroundPosition = "center";
            element.style.backgroundSize = "cover";
            resolve(src);
          },
          function () {
            resolve(null);
          }
        );
      });
    }
  };
})();
