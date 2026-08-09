(function (window, document) {
  'use strict';

  var root = document.querySelector('[data-creator-brand-app]');
  if (!root) return;

  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.creatorBrand;
  var requestedLocale = root.getAttribute('data-locale');
  var locale = requestedLocale === 'fr' ? 'fr' : (requestedLocale === 'sw' ? 'sw' : 'en');
  var storageKey = 'afrotools_creator_brand_v2';
  var currentKit = null;
  function localized(en, fr, sw) { return locale === 'fr' ? fr : (locale === 'sw' ? sw : en); }

  function byName(name) {
    return root.querySelector('[name="' + name + '"]');
  }

  function status(message) {
    root.querySelector('[data-status]').textContent = message;
  }

  function collect() {
    return {
      name: byName('name').value,
      tagline: byName('tagline').value,
      industry: byName('industry').value,
      audience: byName('audience').value,
      mission: byName('mission').value,
      primaryColor: byName('primaryColor').value,
      secondaryColor: byName('secondaryColor').value,
      textColor: byName('textColor').value,
      headingFont: byName('headingFont').value,
      bodyFont: byName('bodyFont').value,
      tone: byName('tone').value,
      keywords: byName('keywords').value,
    };
  }

  function fill(kit) {
    byName('name').value = kit.profile.name;
    byName('tagline').value = kit.profile.tagline;
    byName('industry').value = kit.profile.industry;
    byName('audience').value = kit.profile.audience;
    byName('mission').value = kit.profile.mission;
    byName('primaryColor').value = kit.colors.primary;
    byName('secondaryColor').value = kit.colors.secondary;
    byName('textColor').value = kit.colors.text;
    byName('headingFont').value = kit.typography.heading;
    byName('bodyFont').value = kit.typography.body;
    byName('tone').value = kit.voice.tone;
    byName('keywords').value = kit.voice.keywords.join(', ');
  }

  function render(kit) {
    currentKit = kit;
    var hero = root.querySelector('[data-brand-hero]');
    hero.style.background = 'linear-gradient(135deg,' + kit.colors.primary + ',' + kit.colors.secondary + ')';
    hero.style.color = kit.colors.text;
    hero.querySelector('h2').textContent = kit.profile.name;
    hero.querySelector('p').textContent = kit.profile.tagline;
    hero.querySelector('h2').style.fontFamily = '"' + kit.typography.heading + '",system-ui,sans-serif';
    hero.querySelector('p').style.fontFamily = '"' + kit.typography.body + '",system-ui,sans-serif';
    root.querySelector('[data-mission]').textContent = kit.profile.mission;
    root.querySelector('[data-audience]').textContent = kit.profile.audience;

    var swatches = root.querySelector('[data-swatches]');
    swatches.innerHTML = '';
    [kit.colors.primary, kit.colors.secondary, kit.colors.text].forEach(function (color) {
      var item = document.createElement('div');
      item.className = 'ccn-swatch';
      item.style.background = color;
      item.textContent = color;
      swatches.appendChild(item);
    });

    root.querySelector('[data-contrast]').textContent = localized('Text/primary contrast: ', 'Contraste texte/primaire : ', 'Contrast ya maandishi/rangi kuu: ') +
      kit.colors.primaryTextContrast + ':1 — ' +
      (kit.colors.primaryTextWcagAA ? localized('passes WCAG AA', 'conforme WCAG AA', 'imefikia WCAG AA') : localized('improve for normal text', 'à améliorer pour le texte normal', 'iboreshe kwa maandishi ya kawaida'));

    var posts = root.querySelector('[data-posts]');
    posts.innerHTML = '';
    kit.voice.samplePosts.forEach(function (post) {
      var li = document.createElement('li');
      li.textContent = post;
      posts.appendChild(li);
    });
  }

  function generate(showStatus) {
    if (!engine) {
      status(localized('The local engine is unavailable.', 'Le moteur local est indisponible.', 'Injini ya kifaa haipatikani.'));
      return null;
    }
    var kit = engine.buildKit(collect(), locale);
    render(kit);
    if (showStatus) status(localized('Preview generated locally.', 'Aperçu généré localement.', 'Muonekano umetengenezwa kwenye kifaa.'));
    return kit;
  }

  function download(content, type, filename) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  function filename(extension) {
    var base = (currentKit && currentKit.profile.name || 'creator-brand').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'creator-brand';
    return base + '-brand-kit.' + extension;
  }

  function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(value);
    var area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    return Promise.resolve();
  }

  root.querySelector('form').addEventListener('submit', function (event) {
    event.preventDefault();
    generate(true);
  });

  root.querySelector('[data-save]').addEventListener('click', function () {
    var kit = generate(false);
    if (!kit) return;
    localStorage.setItem(storageKey, JSON.stringify(kit));
    status(localized('Kit saved in this browser.', 'Kit enregistré dans ce navigateur.', 'Kit imehifadhiwa kwenye kivinjari hiki.'));
  });

  root.querySelector('[data-copy]').addEventListener('click', function () {
    var kit = generate(false);
    if (!kit) return;
    copyText(engine.toText(kit, locale)).then(function () {
      status(localized('Summary copied.', 'Résumé copié.', 'Muhtasari umenakiliwa.'));
    });
  });

  root.querySelector('[data-json]').addEventListener('click', function () {
    var kit = generate(false);
    if (!kit) return;
    download(JSON.stringify(kit, null, 2), 'application/json', filename('json'));
    status(localized('JSON downloaded.', 'JSON téléchargé.', 'JSON imepakuliwa.'));
  });

  root.querySelector('[data-txt]').addEventListener('click', function () {
    var kit = generate(false);
    if (!kit) return;
    download(engine.toText(kit, locale), 'text/plain;charset=utf-8', filename('txt'));
    status(localized('TXT summary downloaded.', 'Résumé TXT téléchargé.', 'Muhtasari wa TXT umepakuliwa.'));
  });

  root.querySelector('[data-html]').addEventListener('click', function () {
    var kit = generate(false);
    if (!kit) return;
    download(engine.toGuideHtml(kit, locale), 'text/html;charset=utf-8', filename('html'));
    status(localized('HTML guide downloaded.', 'Guide HTML téléchargé.', 'Mwongozo wa HTML umepakuliwa.'));
  });

  root.querySelector('[data-import]').addEventListener('change', function (event) {
    var file = event.target.files && event.target.files[0];
    if (!file || file.size > 1024 * 1024 || !/\.json$/i.test(file.name)) {
      status(localized('Choose a JSON file smaller than 1 MB.', 'Choisissez un fichier JSON inférieur à 1 Mo.', 'Chagua faili ya JSON iliyo chini ya MB 1.'));
      event.target.value = '';
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var imported = JSON.parse(String(reader.result || ''));
        var rebuilt = engine.buildKit({
          name: imported.profile && imported.profile.name,
          tagline: imported.profile && imported.profile.tagline,
          industry: imported.profile && imported.profile.industry,
          audience: imported.profile && imported.profile.audience,
          mission: imported.profile && imported.profile.mission,
          primaryColor: imported.colors && imported.colors.primary,
          secondaryColor: imported.colors && imported.colors.secondary,
          textColor: imported.colors && imported.colors.text,
          headingFont: imported.typography && imported.typography.heading,
          bodyFont: imported.typography && imported.typography.body,
          tone: imported.voice && imported.voice.tone,
          keywords: imported.voice && imported.voice.keywords && imported.voice.keywords.join(', '),
        }, locale);
        fill(rebuilt);
        render(rebuilt);
        status(localized('JSON kit imported locally.', 'Kit JSON importé localement.', 'Kit ya JSON imefunguliwa kwenye kifaa.'));
      } catch (_) {
        status(localized('That JSON file could not be read.', 'Ce fichier JSON ne peut pas être lu.', 'Faili hiyo ya JSON haiwezi kusomwa.'));
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  });

  try {
    var saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && saved.profile && saved.colors) fill(saved);
  } catch (_) {}
  generate(false);
})(window, document);
