(function () {
  'use strict';

  var TOOLS = {
    'mobile-money-vs-banque': {
      englishId: 'mobile-vs-bank',
      resultSelector: '#mb-results'
    },
    'comparateur-passerelle-paiement': {
      englishId: 'payment-gateway',
      resultSelector: '#pg-results'
    },
    'frais-pos': {
      englishId: 'pos-fees',
      resultSelector: '#pos-results'
    },
    'frais-marchand': {
      englishId: 'merchant-fees',
      resultSelector: '#mf-results'
    },
    'paiement-b2b-transfrontalier': {
      englishId: 'b2b-payment',
      resultSelector: '#b2b-results'
    }
  };

  function routeSlug() {
    var match = window.location.pathname.match(/^\/fr\/tools\/([^/]+)\/?$/);
    return match ? match[1] : '';
  }

  function visibleResult(config) {
    var node = document.querySelector(config.resultSelector);
    if (!node || !node.classList.contains('on')) return '';
    return node.innerText.replace(/\n{3,}/g, '\n\n').trim();
  }

  function setStatus(node, value) {
    if (node) node.textContent = value;
  }

  function copyText(value, status) {
    if (!value) {
      setStatus(status, 'Lancez d’abord le calcul, puis copiez le résultat affiché.');
      return;
    }
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      setStatus(status, 'La copie automatique est indisponible dans ce navigateur.');
      return;
    }
    navigator.clipboard.writeText(value)
      .then(function () { setStatus(status, 'Résultat copié.'); })
      .catch(function () { setStatus(status, 'La copie a échoué. Sélectionnez le texte manuellement.'); });
  }

  function downloadText(config, value, status) {
    if (!value) {
      setStatus(status, 'Lancez d’abord le calcul, puis téléchargez le résultat affiché.');
      return;
    }
    var blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = config.englishId + '-resultat-paiement.txt';
    link.hidden = true;
    document.body.appendChild(link);
    setStatus(status, 'Préparation du fichier TXT local…');
    link.click();
    window.setTimeout(function () {
      link.remove();
      URL.revokeObjectURL(url);
    }, 1000);
    setStatus(status, 'Fichier TXT téléchargé localement.');
  }

  function saveMarker(config, status) {
    var marker = {
      toolId: config.englishId,
      route: window.location.pathname,
      savedAt: new Date().toISOString(),
      storesFinancialDetails: false
    };
    try {
      localStorage.setItem('afro_fr_fintech_payment_marker_v1', JSON.stringify(marker));
      setStatus(status, 'Repère enregistré sur cet appareil. Aucun montant ni choix de prestataire n’a été conservé.');
    } catch (error) {
      setStatus(status, 'L’enregistrement local est indisponible dans ce navigateur.');
    }
  }

  function mount() {
    var config = TOOLS[routeSlug()];
    if (!config) return;
    var results = document.querySelector(config.resultSelector);
    if (!results || document.querySelector('.fintech-pay-actions')) return;
    var actions = document.createElement('section');
    actions.className = 'fintech-pay-actions';
    actions.hidden = true;
    actions.setAttribute('aria-label', 'Actions sur le résultat de paiement');
    actions.innerHTML = [
      '<div>',
      '<strong>Conservez la comparaison avant de déplacer de l’argent.</strong>',
      '<p>Copiez ou téléchargez le résultat affiché pour le vérifier. L’enregistrement local conserve uniquement cette route et la date.</p>',
      '<span class="fintech-pay-actions__status" data-fr-finpay-status aria-live="polite">Lancez le calcul pour activer les actions sur le résultat.</span>',
      '</div>',
      '<div class="fintech-pay-actions__buttons">',
      '<button type="button" class="primary" data-fr-finpay-copy>Copier le résultat</button>',
      '<button type="button" data-fr-finpay-download>Télécharger en TXT</button>',
      '<button type="button" data-fr-finpay-save>Enregistrer un repère</button>',
      '</div>'
    ].join('');
    results.insertAdjacentElement('afterend', actions);
    var status = actions.querySelector('[data-fr-finpay-status]');
    actions.querySelector('[data-fr-finpay-copy]').addEventListener('click', function () {
      copyText(visibleResult(config), status);
    });
    actions.querySelector('[data-fr-finpay-download]').addEventListener('click', function () {
      downloadText(config, visibleResult(config), status);
    });
    actions.querySelector('[data-fr-finpay-save]').addEventListener('click', function () {
      saveMarker(config, status);
    });
    function syncVisibility() {
      var active = results.classList.contains('on');
      actions.hidden = !active;
      actions.classList.toggle('is-visible', active);
      Array.prototype.forEach.call(actions.querySelectorAll('button'), function (button) {
        button.disabled = !active;
      });
      if (!active) {
        setStatus(status, 'Lancez le calcul pour activer les actions sur le résultat.');
      }
    }
    syncVisibility();
    if (window.MutationObserver) {
      new MutationObserver(syncVisibility).observe(results, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
}());
