(function () {
  'use strict';
  var hosts = Array.from(document.querySelectorAll('[data-reviewed-figure]'));
  if (!hosts.length) return;
  var figures = [];
  var controller = new AbortController();
  async function start() {
    try {
      var pool = await AfroJAMB.QuestionTrust.loadPool();
      for (var host of hosts) {
        if (controller.signal.aborted) return;
        try {
          var card = host.closest('[data-reviewed-question]');
          var q = pool.questions.find(function(row) { return row.id === card.dataset.reviewedQuestion; });
          if (!q || q.review.content_sha256 !== host.dataset.reviewedFigure) throw new Error('Question changed');
          host.textContent = 'Verifying the question diagram…';
          var figure = await AfroJAMB.ReviewedFigure.load(q, pool.review_revision, controller.signal);
          figures.push(figure);
          var img = document.createElement('img');
          img.src = figure.url; img.alt = figure.alt;
          img.style.cssText = 'display:block;max-width:100%;height:auto;margin:12px auto;';
          host.replaceChildren(img);
          var details = card.querySelector('details');
          details.hidden = false; details.style.removeProperty('display');
        } catch (error) {
          host.textContent = 'This diagram or question version could not be verified. Reload to retry; its answer remains hidden.';
        }
      }
    } catch (error) {
      hosts.forEach(function(host) { host.textContent = 'The reviewed bank is unavailable. Reload to verify this diagram and view its answer.'; });
    }
  }
  window.addEventListener('pagehide', function() {
    controller.abort(); figures.forEach(function(figure) { figure.revoke(); });
  });
  window.addEventListener('pageshow', function(event) { if (event.persisted) location.reload(); });
  start();
}());
