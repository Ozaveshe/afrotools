(function () {
  'use strict';

  var routes = {
    '/fr/tools/plan-etage/': {
      id: 'floor-plan',
      title: 'Dossier de cadrage du budget bâtiment',
      lead: 'Regroupez les pièces, le niveau de finition, les provisions et le total afin de faire contrôler le périmètre.',
      resultSelector: '#results'
    },
    '/fr/tools/calcul-structure/': {
      id: 'structural-calc',
      title: 'Dossier de contrôle structurel',
      lead: 'Consignez le résultat préliminaire de poutre, poteau, dalle ou fondation pour la revue technique.',
      resultSelector: '#beam-results, #col-results, #slab-results, #foot-results'
    },
    '/fr/tools/charge-electrique/': {
      id: 'electrical-load',
      title: 'Dossier de transmission du bilan de charge',
      lead: 'Transformez les appareils et le résultat en un relevé destiné au contrôle des câbles, protections et groupes.',
      resultSelector: '#resultCard'
    },
    '/fr/tools/dosage-beton/': {
      id: 'concrete-mix',
      title: 'Dossier de préparation du bétonnage',
      lead: 'Résumez la classe, le volume, les matériaux, le coût et les contrôles de cure avant le coulage.',
      resultSelector: '#results'
    },
    '/fr/tools/cout-forage/': {
      id: 'borehole-cost',
      title: 'Dossier de demande de devis de forage',
      lead: 'Regroupez profondeur, géologie, pompe, citerne et ventilation des coûts pour consulter les foreurs.',
      resultSelector: '#resultCard'
    },
    '/fr/tools/calculateur-armature/': {
      id: 'rebar-calculator',
      title: 'Dossier de commande et bordereau d’armatures',
      lead: 'Regroupez le bordereau, le poids, les pertes et le coût en une note de commande contrôlable.',
      resultSelector: '#results'
    }
  };

  function route() {
    var value = window.location.pathname.replace(/\/index\.html$/i, '/');
    return value.endsWith('/') ? value : value + '/';
  }

  function clean(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function french(value) {
    var pairs = [
      ['Borehole Cost Estimator', 'Estimateur du coût de forage'],
      ['General construction, floors', 'Construction générale, planchers'],
      ['Domestic / Residential', 'Domestique / Résidentiel'],
      ['Volume Input Method', 'Méthode de saisie du volume'],
      ['Estimated Depth', 'Profondeur estimée'],
      ['Concrete Mix Calculator', 'Calculateur de dosage du béton'],
      ['Concrete Grade', 'Classe de béton'],
      ['Geology / Terrain', 'Géologie / Terrain'],
      ['Hard rock', 'Roche dure'],
      ['Medium rock', 'Roche moyenne'],
      ['Soft soil', 'Sol meuble'],
      ['Purpose', 'Usage'],
      ['Thickness', 'Épaisseur'],
      ['Slab', 'Dalle'],
      ['Column', 'Poteau'],
      ['Footing', 'Fondation'],
      ['General', 'Général'],
      ['Medium', 'Moyen'],
      ['Residential', 'Résidentiel'],
      ['Domestic', 'Domestique'],
      ['Save', 'Enregistrer'],
      ['None', 'Aucun']
    ];
    var result = clean(value);
    pairs.forEach(function (pair) {
      result = result.replace(new RegExp(pair[0], 'gi'), pair[1]);
    });
    return result;
  }

  function labelFor(control) {
    if (control.id) {
      var linked = document.querySelector(
        'label[for="' + CSS.escape(control.id) + '"]'
      );
      if (linked) return french(linked.textContent);
    }
    var parent = control.closest('label, .field, .form-group, div');
    var label = parent && parent.querySelector('label, .f-label');
    return french(
      (label && label.textContent) ||
      control.getAttribute('aria-label') ||
      control.name ||
      control.id
    );
  }

  function visibleInputs() {
    return Array.prototype.slice.call(
      document.querySelectorAll('input, select, textarea')
    ).filter(function (control) {
      return control.type !== 'hidden' &&
        !control.disabled &&
        !control.closest(
          '.engineering-focus-panel, .eng-toolkit, .eng-floating-panel, .fr-engineering-native-guide'
        ) &&
        (control.offsetParent !== null || control.closest('.calc-section.active'));
    }).map(function (control) {
      var value = control.tagName === 'SELECT' && control.selectedOptions[0]
        ? control.selectedOptions[0].textContent
        : control.value;
      return labelFor(control) + ' : ' + french(value);
    }).filter(function (entry) {
      return entry !== ' : ';
    }).slice(0, 24);
  }

  function visibleResult(config) {
    var candidates = Array.prototype.slice.call(
      document.querySelectorAll(config.resultSelector || '')
    );
    var node = candidates.find(function (candidate) {
      return candidate.offsetParent !== null && clean(candidate.textContent);
    }) || candidates.find(function (candidate) {
      return clean(candidate.textContent);
    });
    var value = node ? french(node.textContent) : '';
    return value && !/--/.test(value)
      ? value
      : 'Lancez d’abord le calcul, puis actualisez ce dossier.';
  }

  function report(config) {
    var lines = [
      french((document.querySelector('h1') || {}).textContent) || config.title,
      'Généré : ' + new Date().toLocaleString('fr'),
      '',
      'Données'
    ];
    visibleInputs().forEach(function (entry) { lines.push('- ' + entry); });
    lines.push('', 'Résultat visible', '- ' + visibleResult(config), '');
    lines.push('Contrôles avant action');
    var guide = Array.prototype.slice.call(
      document.querySelectorAll('.fr-engineering-guide-grid article p')
    ).map(function (node) { return clean(node.textContent); });
    guide.forEach(function (entry) { lines.push('- ' + entry); });
    lines.push(
      '',
      'Confidentialité et limites',
      '- Les données restent dans ce navigateur.',
      '- Estimation de planification uniquement : aucune validation officielle ou professionnelle.',
      '- Vérifiez les prix, règles, normes, autorisations et conditions de site.'
    );
    return lines.join('\n');
  }

  function download(name, value) {
    var url = URL.createObjectURL(
      new Blob([value], { type: 'text/plain;charset=utf-8' })
    );
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  function copy(value, done, failed) {
    function legacyCopy() {
      var field = document.createElement('textarea');
      field.value = value;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      var copied = false;
      try {
        copied = document.execCommand('copy');
      } catch (_error) {
        copied = false;
      }
      field.remove();
      (copied ? done : failed)();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(done, legacyCopy);
    } else {
      legacyCopy();
    }
  }

  function mount(config) {
    if (document.querySelector('[data-engineering-focus-panel="' + config.id + '"]')) {
      return;
    }
    var section = document.createElement('section');
    section.className = 'engineering-focus-panel';
    section.setAttribute('data-engineering-focus-panel', config.id);
    section.innerHTML =
      '<div class="engineering-focus-card">' +
      '<span class="engineering-focus-kicker">Rapport local de chantier</span>' +
      '<h2>' + config.title + '</h2><p>' + config.lead + '</p>' +
      '<div class="engineering-focus-grid"><div>' +
      '<output class="engineering-focus-output" data-eng-output aria-live="polite"></output>' +
      '<div class="engineering-focus-actions">' +
      '<button type="button" data-eng-primary data-eng-action="refresh">Actualiser le rapport</button>' +
      '<button type="button" data-eng-action="copy">Copier</button>' +
      '<button type="button" data-eng-action="download">Télécharger le TXT</button>' +
      '<button type="button" data-eng-action="save">Enregistrer localement</button>' +
      '</div><div class="engineering-focus-status" data-eng-status role="status" aria-live="polite"></div>' +
      '</div><div><ul class="engineering-focus-list">' +
      '<li>Contrôlez les dimensions, unités, hypothèses et données de site.</li>' +
      '<li>Vérifiez les prix, normes et exigences professionnelles locales.</li>' +
      '<li>Utilisez ce dossier comme note de planification, jamais comme validation officielle.</li>' +
      '</ul><p class="engineering-focus-note"><strong>Confidentialité et fraîcheur :</strong> les données restent dans ce navigateur. Vérifiez les sources locales avant d’agir.</p>' +
      '</div></div></div>';
    var before = document.querySelector(
      '.df-upgrade, .seo-section, .seo-content, .faq, afro-related-tools, afro-footer'
    );
    if (before && before.parentNode) before.parentNode.insertBefore(section, before);
    else document.body.appendChild(section);

    var output = section.querySelector('[data-eng-output]');
    var status = section.querySelector('[data-eng-status]');
    function refresh() {
      output.textContent = report(config);
      status.textContent = 'Rapport actualisé à partir des données visibles.';
    }
    section.addEventListener('click', function (event) {
      var action = event.target.closest('[data-eng-action]');
      if (!action) return;
      var name = action.dataset.engAction;
      if (name === 'refresh') refresh();
      if (name === 'copy') {
        copy(
          output.textContent,
          function () { status.textContent = 'Rapport copié.'; },
          function () { status.textContent = 'Copie indisponible dans ce navigateur.'; }
        );
      }
      if (name === 'download') {
        download(config.id + '-rapport-chantier.txt', output.textContent);
        status.textContent = 'Rapport TXT téléchargé localement.';
      }
      if (name === 'save') {
        localStorage.setItem(
          'afrotools:engineering-focus:' + config.id,
          JSON.stringify({
            id: config.id,
            savedAt: new Date().toISOString(),
            report: output.textContent
          })
        );
        status.textContent = 'Rapport enregistré localement dans ce navigateur.';
      }
    });
    refresh();
  }

  function start() {
    var config = routes[route()];
    if (config) mount(config);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}());
