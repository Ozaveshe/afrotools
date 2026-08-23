(function () {
  'use strict';
  var updated = document.getElementById('lastUpdated');
  var note = document.getElementById('dataNote');
  if (!updated || !note) return;

  function reconcile() {
    var failed = /couldn['’]?t load|could not load|unavailable/i.test(updated.textContent || '');
    if (!failed) return;
    note.hidden = false;
    note.setAttribute('role', 'status');
    note.textContent = 'Live data temporarily unavailable. Current rankings could not be checked; historical AfroStream methodology and creator content remain available.';
    var podium = document.getElementById('podiumGrid');
    if (podium && /not enough matching creators/i.test(podium.textContent || '')) {
      podium.innerHTML = '<div class="as-empty-state" style="grid-column:1/-1"><strong>Live data temporarily unavailable</strong><p>Current ranking rows could not be loaded. <a href="methodology/">View the ranking methodology</a>.</p></div>';
    }
  }

  var observer = new MutationObserver(reconcile);
  observer.observe(updated, { childList: true, characterData: true, subtree: true });
  reconcile();
})();
