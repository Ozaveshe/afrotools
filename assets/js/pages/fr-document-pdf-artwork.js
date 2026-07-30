(function () {
  'use strict';

  var ARTWORK_BY_ROUTE = Object.freeze({
    '/fr/tools/espace-pdf/': '/assets/img/tools/fr/pdf-workspace.png',
    '/fr/tools/fusionner-diviser-pdf/': '/assets/img/tools/fr/pdf-merge-split.png',
    '/fr/tools/compresser-pdf/': '/assets/img/tools/fr/pdf-compress.png',
    '/fr/tools/pdf-en-image/': '/assets/img/tools/pdf-image-convert.webp',
    '/fr/tools/filigrane-pdf/': '/assets/img/tools/fr/pdf-watermark.png',
    '/fr/tools/proteger-pdf/': '/assets/img/tools/fr/pdf-password.png',
    '/fr/tools/numerotation-pdf/': '/assets/img/tools/fr/pdf-page-numbers.png',
    '/fr/tools/signer-pdf/': '/assets/img/tools/fr/pdf-sign.png',
    '/fr/tools/ocr-pdf/': '/assets/img/tools/fr/pdf-ocr.png',
    '/fr/tools/remplir-formulaire-pdf/': '/assets/img/tools/fr/pdf-form-filler.png',
    '/fr/tools/caviarder-pdf/': '/assets/img/tools/fr/pdf-redact.png',
    '/fr/tools/entete-pied-pdf/': '/assets/img/tools/fr/pdf-header-footer.png',
    '/fr/tools/editeur-pdf/': '/assets/img/tools/fr/pdf-editor.png',
    '/fr/tools/convertir-pdf/': '/assets/img/tools/pdf-convert.webp',
    '/fr/tools/reorganiser-pdf/': '/assets/img/tools/pdf-reorder.webp',
    '/fr/tools/chat-pdf/': '/assets/img/tools/pdf-chat.webp',
    '/fr/tools/traduire-pdf/': '/assets/img/tools/pdf-translate.webp',
    '/fr/tools/comparer-pdf/': '/assets/img/tools/pdf-compare.webp',
    '/fr/tools/pdf-en-audio/': '/assets/img/tools/pdf-to-audio.webp',
    '/fr/tools/numerotation-bates-pdf/': '/assets/img/tools/pdf-bates.webp',
    '/fr/tools/html-en-pdf/': '/assets/img/tools/html-to-pdf.webp',
    '/fr/tools/rechercher-remplacer-pdf/': '/assets/img/tools/pdf-find-replace.webp',
    '/fr/tools/reparer-pdf/': '/assets/img/tools/pdf-repair.webp',
    '/fr/tools/flux-pdf/': '/assets/img/tools/fr/pdf-workflow.png',
    '/fr/tools/generateur-cv/': '/assets/img/tools/fr/cv-builder.png',
    '/fr/tools/generateur-factures/': '/assets/img/tools/fr/invoice-generator.png',
    '/fr/tools/generateur-lettre-motivation/': '/assets/img/tools/fr/cover-letter.png',
    '/fr/tools/compte-rendu-reunion/': '/assets/img/tools/meeting-minutes.webp',
    '/fr/tools/generateur-recu/': '/assets/img/tools/receipt-generator.webp',
    '/fr/tools/plan-affaires/': '/assets/img/tools/fr/business-plan.png',
    '/fr/document-pdf/': '/assets/img/tools/document-pdf.webp',
    '/fr/tools/facture-freelance/': '/assets/img/tools/freelance-invoice.webp'
  });

  function normalizeRoute(href) {
    try {
      var pathname = new URL(href, window.location.href).pathname;
      return pathname.endsWith('/') ? pathname : pathname + '/';
    } catch (_) {
      return '';
    }
  }

  function applyArtwork(root) {
    (root || document).querySelectorAll('a[href]').forEach(function (link) {
      var asset = ARTWORK_BY_ROUTE[normalizeRoute(link.getAttribute('href'))];
      if (!asset) return;
      var thumb = link.querySelector('.tc-thumb, .tool-card__image, [data-tool-image]');
      if (!thumb) return;
      var image = thumb.querySelector('img');
      if (!image) {
        image = document.createElement('img');
        image.loading = 'lazy';
        image.alt = (link.querySelector('.tc-name, h2, h3') || {}).textContent || '';
        thumb.appendChild(image);
      }
      image.src = asset;
      image.removeAttribute('onerror');
      image.dataset.frArtwork = 'reviewed';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyArtwork(document);
    var target = document.getElementById('tool-grid');
    if (target && typeof MutationObserver !== 'undefined') {
      new MutationObserver(function () { applyArtwork(target); })
        .observe(target, { childList: true, subtree: true });
    }
  });
})();
