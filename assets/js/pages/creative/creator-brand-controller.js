(function (window, document) {
  'use strict';

  var root = document.querySelector('[data-creator-brand-app]');
  if (!root) return;

  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.creatorBrand;
  var locale = root.getAttribute('data-locale') === 'fr' ? 'fr' : 'en';
  var storageKey = 'afrotools_creator_brand_v2';
  var currentKit = null;

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

    root.querySelector('[data-contrast]').textContent = (locale === 'fr' ? 'Contraste texte/primaire : ' : 'Text/primary contrast: ') +
      kit.colors.primaryTextContrast + ':1 — ' +
      (kit.colors.primaryTextWcagAA ? (locale === 'fr' ? 'conforme WCAG AA' : 'passes WCAG AA') :
        (locale === 'fr' ? 'à améliorer pour le texte normal' : 'improve for normal text'));

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
      status(locale === 'fr' ? 'Le moteur local est indisponible.' : 'The local engine is unavailable.');
      return null;
    }
    var kit = engine.buildKit(collect());
    render(kit);
    if (showStatus) status(locale === 'fr' ? 'Aperçu généré localement.' : 'Preview generated locally.');
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
    status(locale === 'fr' ? 'Kit enregistré dans ce navigateur.' : 'Kit saved in this browser.');
  });

  root.querySelector('[data-copy]').addEventListener('click', function () {
    var kit = generate(false);
    if (!kit) return;
    copyText(engine.toText(kit, locale)).then(function () {
      status(locale === 'fr' ? 'Résumé copié.' : 'Summary copied.');
    });
  });

  root.querySelector('[data-json]').addEventListener('click', function () {
    var kit = generate(false);
    if (!kit) return;
    download(JSON.stringify(kit, null, 2), 'application/json', filename('json'));
    status(locale === 'fr' ? 'JSON téléchargé.' : 'JSON downloaded.');
  });

  root.querySelector('[data-txt]').addEventListener('click', function () {
    var kit = generate(false);
    if (!kit) return;
    download(engine.toText(kit, locale), 'text/plain;charset=utf-8', filename('txt'));
    status(locale === 'fr' ? 'Résumé TXT téléchargé.' : 'TXT summary downloaded.');
  });

  root.querySelector('[data-html]').addEventListener('click', function () {
    var kit = generate(false);
    if (!kit) return;
    download(engine.toGuideHtml(kit, locale), 'text/html;charset=utf-8', filename('html'));
    status(locale === 'fr' ? 'Guide HTML téléchargé.' : 'HTML guide downloaded.');
  });

  root.querySelector('[data-import]').addEventListener('change', function (event) {
    var file = event.target.files && event.target.files[0];
    if (!file || file.size > 1024 * 1024 || !/\.json$/i.test(file.name)) {
      status(locale === 'fr' ? 'Choisissez un fichier JSON inférieur à 1 Mo.' : 'Choose a JSON file smaller than 1 MB.');
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
        });
        fill(rebuilt);
        render(rebuilt);
        status(locale === 'fr' ? 'Kit JSON importé localement.' : 'JSON kit imported locally.');
      } catch (_) {
        status(locale === 'fr' ? 'Ce fichier JSON ne peut pas être lu.' : 'That JSON file could not be read.');
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
