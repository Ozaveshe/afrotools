(function () {
  'use strict';
  var review = document.getElementById('invoiceReviewConfirm');
  var hint = document.getElementById('invoiceActionHint');
  if (!review) return;
  function invalidate() {
    if (!review.checked) return;
    review.checked = false;
    hint.textContent = 'Takardar kuɗi ta canza. Sake duba ta kafin fitarwa.';
  }
  // Capture at document level, before any export handler on a button.
  document.addEventListener('click', function (event) {
    var target = event.target.closest && event.target.closest('button');
    if (!target) return;
    if (['btnPDF', 'btnPDFMobile', 'btnExportJson'].includes(target.id)) {
      if (review.checked) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      hint.textContent = 'Duba takardar kuɗi ka tabbatar da bayanan kafin fitarwa.';
      review.focus();
    } else if (target.matches('.invoice-saved-card, .tpl-btn, .client-item, [data-load-client], [data-load-template]') ||
      ['btnNewInvoice', 'btnAddItem', 'btnApplySavedItem'].includes(target.id) || target.closest('.line-item')) {
      invalidate();
    }
  }, true);
  ['input', 'change'].forEach(function (eventName) {
    document.addEventListener(eventName, function (event) {
      if (event.target === review || event.target.id === 'includeInvoiceDataInLink') return;
      if (event.target.closest && event.target.closest('#main')) invalidate();
    }, true);
  });
  // Loading a saved client/template or JSON can update fields without DOM input events.
  var state = window.AfroInvoiceState;
  if (state && state.restoreState) {
    var restore = state.restoreState;
    state.restoreState = function (value) {
      invalidate();
      return restore.apply(this, arguments);
    };
  }
})();
