(function () {
  'use strict';

  function setSelected(buttons, activeButton) {
    buttons.forEach(function (button) {
      var isActive = button === activeButton;
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.tabIndex = isActive ? 0 : -1;
    });
  }

  function bindTablist(buttons, activate) {
    buttons.forEach(function (button, index) {
      button.addEventListener('click', function () { activate(button); });
      button.addEventListener('keydown', function (event) {
        var offset = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
          : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1
            : 0;
        if (!offset) return;
        event.preventDefault();
        var nextButton = buttons[(index + offset + buttons.length) % buttons.length];
        nextButton.focus();
        nextButton.click();
      });
    });
  }

  function syncMainMode(button) {
    var mergeCard = document.getElementById('merge-card');
    var splitCard = document.getElementById('split-card');
    var showMerge = button.dataset.mode === 'merge';

    setSelected(Array.from(document.querySelectorAll('.mode-btn')), button);
    if (mergeCard) mergeCard.setAttribute('aria-hidden', showMerge ? 'false' : 'true');
    if (splitCard) splitCard.setAttribute('aria-hidden', showMerge ? 'true' : 'false');
  }

  function syncSplitMode(button) {
    setSelected(Array.from(document.querySelectorAll('.split-mode-btn')), button);
    document.querySelectorAll('.split-panel').forEach(function (panel) {
      panel.setAttribute('aria-hidden', panel.id === button.getAttribute('aria-controls') ? 'false' : 'true');
    });
  }

  function decoratePageCells() {
    document.querySelectorAll('#splitGrid .sp-cell').forEach(function (cell) {
      var label = cell.querySelector('.sp-cell-label');
      var pageLabel = label ? label.textContent.trim() : 'Shafin PDF';

      if (!cell.classList.contains('selectable')) {
        cell.removeAttribute('role');
        cell.removeAttribute('tabindex');
        cell.removeAttribute('aria-pressed');
        cell.removeAttribute('aria-label');
        return;
      }

      cell.setAttribute('role', 'button');
      cell.setAttribute('tabindex', '0');
      cell.setAttribute('aria-pressed', cell.classList.contains('selected') ? 'true' : 'false');
      cell.setAttribute('aria-label', pageLabel + (cell.classList.contains('selected') ? ', an zaba' : ', ba a zaba ba'));
    });
  }

  function syncProgress() {
    var progressBar = document.getElementById('progressBar');
    var progressFill = document.getElementById('progressFill');
    if (!progressBar || !progressFill) return;

    var value = parseInt(progressFill.style.width, 10);
    progressBar.setAttribute('aria-valuenow', Number.isFinite(value) ? String(value) : '0');
  }

  function init() {
    var modeButtons = Array.from(document.querySelectorAll('.mode-btn'));
    var splitModeButtons = Array.from(document.querySelectorAll('.split-mode-btn'));
    var splitGrid = document.getElementById('splitGrid');
    var progressFill = document.getElementById('progressFill');

    bindTablist(modeButtons, syncMainMode);
    bindTablist(splitModeButtons, syncSplitMode);

    if (splitGrid) {
      splitGrid.addEventListener('keydown', function (event) {
        var cell = event.target.closest('.sp-cell.selectable');
        if (!cell || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        cell.click();
      });
      new MutationObserver(decoratePageCells).observe(splitGrid, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
    }

    if (progressFill) {
      new MutationObserver(syncProgress).observe(progressFill, {
        attributes: true,
        attributeFilter: ['style']
      });
    }

    if (modeButtons[0]) syncMainMode(modeButtons[0]);
    if (splitModeButtons[0]) syncSplitMode(splitModeButtons[0]);
    decoratePageCells();
    syncProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
