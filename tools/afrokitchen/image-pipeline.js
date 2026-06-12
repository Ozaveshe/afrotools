!function () {
  "use strict";

  var rootPath = "/assets/img/kitchen";
  var extensions = [".webp", ".jpg", ".jpeg", ".png"];
  var manualCandidates = {};
  var localImageFiles = "achu-soup-cm.webp|agatoke-bi.webp|akoho-sy-voanio-mg.webp|alloco-ci.webp|alouda-mu.webp|amiwo-bj.webp|arroz-de-caju-gw.webp|asida-ly.webp|atanga-ga.webp|atassi-watche-bj.webp|atkilt-wat-et.webp|attieke-poisson-ci.webp|babenda-bf.webp|banana-fritters-gq.webp|banku-tilapia-gh.webp|bazin-ly.webp|beignets-banane-ga.webp|benachin-gm.webp|benga-bf.webp|bessara-ma.webp|bilola-gq.webp|bogobe-jwa-lerotse-bw.webp|boule-td.webp|bunny-chow-za.webp|burundian-brochettes-bi.webp|burundian-isombe.webp|buzio-caboverdiano-cv.webp|cabidela-de-galinha-ao.webp|cachupa-rica-cv.webp|caldo-chabeu-gw.webp|caldo-de-mancarra-gw.webp|caldo-mancarra-gw.webp|calulu-st.webp|cambaboor-dj.webp|canja-cv.webp|cassava-leaf-stew-sl.webp|central-african-peanut-stew-cf.webp|chabeu-gw.webp|chakhchoukha-dz.webp|chebakia-ma.webp|chicken-pastilla-ma.webp|chicken-tagine-preserved-lemons-ma.webp|chicken-yassa-gm.webp|chocolate-quente-st.webp|chorba-frik-dz.webp|couscous-royal-dz.webp|dakouin-bj.webp|daraba-td.webp|dholl-puri.webp|dholl-puri-mu.webp|dikgobe-bw.webp|djabadji-ml.webp|djiboutian-laxoox.webp|dobara-biskra-dz.webp|domoda-gm.webp|doro-wat.webp|dovi-zw.webp|dumboy-lr.webp|emasi-etinkhobe-sz.webp|eritrean-ful.webp|eritrean-shiro.webp|eru-cm.webp|fah-fah.webp|fah-fah-dj.webp|fakoye-ml.webp|fangasou-td.webp|feteer-meshaltet-eg.webp|fouti-gn.webp|fouti-guinea-gn.webp|foutou-sauce-graine-ci.webp|fufu-light-soup-gh.webp|ful-medames-eg.webp|ful-medames-sd.webp|fumbwa-cd.webp|funge-de-bombo-ao.webp|futali-mw.webp|gaat-er.webp|ga-kenkey-fried-fish-gh.webp|garba-ci.webp|gateau-piment.webp|gateaux-piments-mu.webp|gb-soup-lr.webp|genfo-et.webp|ginger-juice-gn.webp|ginger-pineapple-drink-gq.webp|githeri-ke.webp|gomen-et.webp|gonre-bf.webp|gozo-cf.webp|groundnut-soup-gh.webp|harira-ma.webp|hawawshi-eg.webp|hraime-ly.webp|ibiharage-bi.webp|ikivuguto-bi.webp|incwancwa-sz.webp|injera.webp|isombe-peanut-bi.webp|jagacida-cv.webp|jarret-boeuf-td.webp|jollof-rice-gh.webp|jollof-rice-gq.webp|jollof-rice-lr.webp|jollof-rice-ng.webp|jollof-rice-ng-1.webp|jollof-rice-ng-2.webp|jus-tamarin-km.webp|jus-tamarin-td.webp|kanda-ti-nyma-cf.webp|karkanji-td.webp|kedjenou-ci.webp|kefta-tagine-ma.webp|kelewele-gh.webp|kenyan-pilau.webp|kik-alicha-et.webp|kisser-td.webp|kitfo.webp|kizaka-ao.webp|koki-beans-cm.webp|koklo-meme-tg.webp|kondowole.webp|konkoe-gn.webp|kontomire-stew-gh.webp|koshari-eg.webp|kuli-kuli-bj.webp|kuli-kuli-bj-2.webp|kwacoco-bible-cm.webp|lablabi-tn.webp|la-bouillie-td.webp|lahoh-dj.webp|lakh-mr.webp|lamb-tagine-prunes-almonds-ma.webp|langouste-vanille.webp|langouste-vanille-km.webp|lasary-voatabia-mg.webp|liboke-ya-mbika-cd.webp|likhobe-ls.webp|maakouda-ma.webp|mahshi-eg.webp|makara-banana-fritters-cf.webp|makayabu-cd.webp|makroud-dz.webp|malamba-gq.webp|mandasi-malawi-mw.webp|maru-we-llham-mr.webp|mataba-comoros-km.webp|mauritian-biryani-mu.webp|mbakbaka-ly.webp|mbatten-ly.webp|mbongo-tchobi-cm.webp|mechoui-mr.webp|mhadjeb-dz.webp|misir-wat-et.webp|mkatra-foutra.webp|mkatra-siniya-km.webp|moambe-chicken-cd.webp|mofo-gasy.webp|molokhia-eg.webp|morogo-bw.webp|motoho-ls.webp|msemen-ma.webp|muamba-de-galinha-ao.webp|mufete-ao.webp|mukeke.webp|mukimo-ke.webp|ndole-cm.webp|ntaba-cd.webp|nthochi-bread-mw.webp|nyama-choma.webp|nyekoe-ls.webp|nyembwe-chicken-ga.webp|odika-chicken-ga.webp|palava-sauce-lr.webp|palm-butter-soup-lr.webp|palm-nut-chicken-cf.webp|papa-le-moroho-ls.webp|pastel-diablo-cv.webp|pepesoup-gq.webp|pescado-cacahuete-gq.webp|phane-bw.webp|pilao-comorien-km.webp|pilao-nazi.webp|placali-sauce-kope-ci.webp|plasas-gm.webp|poisson-fume-plantain-ga.webp|poisson-moyo-bj.webp|potjiekos-na.webp|poulet-bicyclette-bf.webp|poulet-moutarde-ga.webp|poulet-muambe-cg.webp|poulet-yassa-gn.webp|ranonapango-mg.webp|ravitoto.webp|rechta-algeroise-dz.webp|red-red-gh.webp|rfissa-ma.webp|rishta-kiskas-ly.webp|riz-gras-bf.webp|roasted-mealie-sz.webp|romazava.webp|rougaille.webp|sadza-nenyama-zw.webp|sahrawi-camel-stew-eh.webp|sahrawi-mint-tea-eh.webp|saka-saka-cd.webp|sauce-feuille-gn.webp|sauce-graine-cf.webp|sayadeya-eg.webp|seswaa-bw.webp|shaah-cadays-dj.webp|shahan-ful-er.webp|sharba-libiya-ly.webp|shiro-wat-et.webp|sidvudvu-sz.webp|siphuphe-setindlubu-sz.webp|sishwala-emasi-sz.webp|skoudehkaris.webp|succotash-gq.webp|suwa-er.webp|taameya-eg.webp|taita-er.webp|tajine-zitoun-dz.webp|thieboudienne-mr.webp|thieboudienne-sn.webp|thobwa-mw.webp|tibs-et.webp|tigadegena-ml.webp|toh-ml.webp|torborgee-lr.webp|tuo-zaafi-gh.webp|ubugari.webp|ugali-na-sukuma-wiki.webp|umbhidvo-wetintsanga-sz.webp|umcombotsi-sz.webp|umm-ali-eg.webp|usban-ly.webp|vetkoek-bw.webp|vindaye-poisson-mu.webp|vinho-caju-gw.webp|waakye-gh.webp|wagasi-grille-bj.webp|xerem-cv.webp|zamne-bf.webp|zigini.webp".split("|");
  var localImageFileSet = {};
  var localImageBySlug = {};
  var pendingImages = [];

  localImageFiles.forEach(function (filename) {
    var slug = filename.replace(/\.[^.]+$/, "").replace(/-[1-5]$/, "");
    localImageFileSet[filename] = true;
    if (!localImageBySlug[slug]) localImageBySlug[slug] = filename;
  });

  function recipeSlug(recipe) {
    if (!recipe) return "";
    return (typeof recipe === "string" ? recipe : String(recipe.slug || "")).trim();
  }

  function unique(items) {
    var seen = {};
    return items.filter(function (item) {
      if (!item || seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }

  function cuisineEntry(recipe) {
    var slug = recipeSlug(recipe);
    var data = window.AfroKitchenCuisineIntelligence;
    return slug && data && data.recipes && data.recipes[slug] || null;
  }

  function heroSrc(recipe) {
    var entry = cuisineEntry(recipe);
    return entry && entry.image && entry.image.hero_src ? entry.image.hero_src : "";
  }

  function knownHeroSrc(recipe) {
    var src = heroSrc(recipe);
    var prefix = rootPath + "/";
    if (!src) return "";
    if (src.indexOf(prefix) === 0) {
      return localImageFileSet[src.slice(prefix.length)] ? src : "";
    }
    return src;
  }

  function heroReady(recipe) {
    var entry = cuisineEntry(recipe);
    return !entry || !entry.image || entry.image.hero_ready !== false;
  }

  function candidateFilenames(recipe) {
    var slug = recipeSlug(recipe);
    if (!slug) return [];
    return unique([localImageBySlug[slug]].concat(manualCandidates[slug] || []));
  }

  function candidatePaths(recipe) {
    return unique([knownHeroSrc(recipe)].concat(candidateFilenames(recipe).map(function (filename) {
      return rootPath + "/" + filename;
    })));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function releaseProbe(img) {
    var index = pendingImages.indexOf(img);
    if (index !== -1) pendingImages.splice(index, 1);
  }

  function tryImages(paths, configure, onLoad, onMissing) {
    var index = 0;
    function next() {
      if (index >= paths.length) {
        if (onMissing) onMissing();
        return;
      }
      var path = paths[index];
      index += 1;
      var img = new Image();
      pendingImages.push(img);
      img.decoding = "async";
      if (configure) configure(img);
      img.onload = function () {
        releaseProbe(img);
        if (onLoad) onLoad(img, path);
      };
      img.onerror = function () {
        releaseProbe(img);
        next();
      };
      img.src = path;
    }
    next();
  }

  function canUseFetchProbe(path) {
    return window.fetch && (path.indexOf("/") === 0 || path.indexOf(window.location.origin) === 0);
  }

  function probePath(path) {
    if (!canUseFetchProbe(path)) return Promise.resolve(true);
    return fetch(path, { method: "HEAD", cache: "force-cache" }).then(function (response) {
      return response.ok;
    }).catch(function () {
      return false;
    });
  }

  function hydrateSlot(slot) {
    var paths = candidatePaths(slot.dataset.akImageSlug);
    var index = 0;
    function next() {
      if (index >= paths.length) {
        slot.dataset.akImageMissing = "true";
        return;
      }
      var path = paths[index];
      index += 1;
      probePath(path).then(function (ok) {
        if (!ok) {
          next();
          return;
        }
        loadPath(path);
      });
    }
    function loadPath(path) {
      var img = document.createElement("img");
      img.decoding = "async";
      img.alt = slot.dataset.akImageAlt || "";
      img.style.position = "absolute";
      img.style.width = "1px";
      img.style.height = "1px";
      img.style.opacity = "0";
      img.style.pointerEvents = "none";
      img.onload = function () {
        if (slot.dataset.akImageSlot === "featured") {
          img.className = "ak-featured-img";
          img.removeAttribute("style");
          slot.replaceWith(img);
          return;
        }
        slot.className = "ak-recipe-card-thumb";
        slot.innerHTML = "";
        img.loading = "lazy";
        img.className = "ak-recipe-card-img";
        img.removeAttribute("style");
        slot.appendChild(img);
      };
      img.onerror = function () {
        img.remove();
        next();
      };
      slot.appendChild(img);
      img.src = path;
    }
    next();
  }

  window.AfroKitchenImages = {
    rootPath: rootPath,
    extensions: extensions.slice(),
    getFilename: function (recipe, ext) {
      var slug = recipeSlug(recipe);
      return slug ? slug + (ext || ".webp") : "";
    },
    getPath: function (recipe) {
      var paths = candidatePaths(recipe);
      return paths.length ? paths[0] : "";
    },
    getImageUrl: function (recipe) {
      var hero = heroSrc(recipe);
      if (hero) return hero;
      if (!heroReady(recipe)) return "/assets/img/tools/afrokitchen.webp";
      var paths = candidatePaths(recipe);
      return paths.length ? paths[0] : "/assets/img/tools/afrokitchen.webp";
    },
    getCandidatePaths: candidatePaths,
    createCardSlotMarkup: function (recipe, options) {
      var config = options || {};
      var slug = recipeSlug(recipe);
      var alt = escapeHtml(config.alt || recipe.image_alt || recipe.name || "");
      var label = escapeHtml(config.label || "AfroKitchen");
      var title = escapeHtml(config.title || recipe.name || "Recipe");
      return '<div class="ak-recipe-card-thumb ak-img-fallback" data-ak-image-slot="card" data-ak-image-slug="' + escapeHtml(slug) + '" data-ak-image-alt="' + alt + '"><div class="ak-card-fallback"><div class="ak-card-fallback-label">' + label + '</div><p class="ak-card-fallback-title">' + title + "</p></div></div>";
    },
    createFeaturedSlotMarkup: function (recipe, options) {
      var config = options || {};
      var slug = recipeSlug(recipe);
      var alt = escapeHtml(config.alt || recipe.image_alt || recipe.name || "");
      return '<div class="ak-featured-fallback" data-ak-image-slot="featured" data-ak-image-slug="' + escapeHtml(slug) + '" data-ak-image-alt="' + alt + '" aria-hidden="true"></div>';
    },
    hydrate: function (root) {
      (root || document).querySelectorAll("[data-ak-image-slot][data-ak-image-slug]").forEach(function (slot) {
        if (slot.dataset.akImageBound === "true") return;
        slot.dataset.akImageBound = "true";
        if (!heroReady(slot.dataset.akImageSlug)) {
          slot.dataset.akImageMissing = "true";
          return;
        }
        hydrateSlot(slot);
      });
    },
    applyHeroBackground: function (element, recipe, fallbackBackground) {
      if (!element) return Promise.resolve(null);
      if (fallbackBackground) element.style.background = fallbackBackground;
      element.style.backgroundImage = "none";
      if (!heroReady(recipe)) return Promise.resolve(null);
      return new Promise(function (resolve) {
        tryImages(candidatePaths(recipe), null, function (img, path) {
          element.style.backgroundImage = "url(" + path + ")";
          element.style.backgroundPosition = "center";
          element.style.backgroundSize = "cover";
          resolve(path);
        }, function () {
          resolve(null);
        });
      });
    }
  };
}();
