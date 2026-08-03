(function () {
  'use strict';

  function isReviewControl(element) {
    var key = [element.id, element.name, element.getAttribute('aria-label')].join(' ').toLowerCase();
    return /review|confirm|consent|theme|dark|language-menu/.test(key);
  }

  function currentAppId() {
    var localeNode = document.getElementById('sw-document-pdf-locale');
    if (!localeNode) return '';
    try {
      return String(JSON.parse(localeNode.textContent || '{}').id || '');
    } catch (_) {
      return '';
    }
  }

  function keepAccessibilityStylesLast() {
    var expectedPath = '/assets/css/sw-document-pdf-a11y.css';
    var moving = false;

    function stylesheet() {
      return Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(function (link) {
        try {
          return new URL(link.href, window.location.href).pathname === expectedPath;
        } catch (_) {
          return false;
        }
      });
    }

    function pin() {
      var link = stylesheet();
      if (!link || link.parentNode !== document.head || link === document.head.lastElementChild) return;
      moving = true;
      document.head.appendChild(link);
      Promise.resolve().then(function () {
        moving = false;
      });
    }

    pin();
    new MutationObserver(function () {
      if (!moving) pin();
    }).observe(document.head, { childList: true });
    window.addEventListener('load', pin, { once: true });
  }

  function exportButtons() {
    return Array.from(document.querySelectorAll('button, a[download]')).filter(function (element) {
      var key = [element.id, element.dataset && element.dataset.action, element.dataset && element.dataset.export, element.textContent].join(' ').toLowerCase();
      var action = String(element.dataset && (element.dataset.action || element.dataset.export) || '').toLowerCase();
      if (/generate|compare|extract|process|create|run|merge|split|compress|convert|translate|repair|apply|fill|organize|tengeneza|linganisha|chakata|unganisha|gawanya|bana|badilisha|tafsiri|rekebisha|tumia|jaza|panga/.test(key)
          && !/download|pakua/.test(key)) return false;
      return /^(?:pdf|word|doc|docx|txt|csv|json|ics|print)$/.test(action)
        || /download|export|pakua|pdfbtn|docbtn|txtbtn|csvbtn|jsonbtn|printbtn|icsbtn/.test(key);
    });
  }

  function outputButtons() {
    return Array.from(document.querySelectorAll('button')).filter(function (element) {
      var key = [element.id, element.dataset && element.dataset.action, element.textContent].join(' ').toLowerCase();
      return /generate|compare|extract|process|create|run|merge|split|compress|convert|translate|repair|apply|fill|organize|tengeneza|linganisha|toa maandishi|chakata|unganisha|gawanya|bana|badilisha|tafsiri|rekebisha|tumia|jaza|panga/.test(key)
        && !/download|pakua/.test(key);
    });
  }

  function isAvailable(element) {
    if (!element || element.disabled || element.getAttribute('aria-disabled') === 'true') return false;
    var style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
  }

  function resultContainers() {
    return Array.from(document.querySelectorAll(
      '[id*="ResultCard"],[id*="resultCard"],[id*="ResultPanel"],[id*="resultPanel"],' +
      '[data-result],.result-card,.result-panel,.results-card,.download-toolbar'
    ));
  }

  function resultSignature() {
    return resultContainers().map(function (element) {
      return [
        element.id,
        element.className,
        element.getAttribute('style') || '',
        (element.textContent || '').trim()
      ].join('|');
    }).join('\n');
  }

  function markFreshWhenOutputReady() {
    var attempts = 0;
    var initialResultSignature = resultSignature();
    var timer = setInterval(function () {
      attempts += 1;
      var resultChanged = resultSignature() !== initialResultSignature
        && resultContainers().some(isAvailable);
      if (exportButtons().some(isAvailable) || resultChanged) {
        clearInterval(timer);
        document.documentElement.dataset.swDocumentResult = 'fresh';
        document.querySelectorAll('[data-sw-disabled-for-stale-result="true"]').forEach(function (exportButton) {
          exportButton.disabled = false;
          exportButton.removeAttribute('aria-disabled');
          delete exportButton.dataset.swDisabledForStaleResult;
        });
      } else if (attempts >= 300) {
        clearInterval(timer);
      }
    }, 100);
  }

  function announce(message) {
    var status = document.querySelector('[role="status"],[aria-live="polite"]');
    if (!status) {
      status = document.createElement('p');
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.className = 'sw-document-pdf-integrity-status';
      (document.querySelector('main') || document.body).appendChild(status);
    }
    status.textContent = message;
  }

  function invalidate() {
    // This workspace recalculates its preview synchronously on every field
    // change and already clears its explicit export-review checkbox. There is
    // no separate generate action that could re-enable a disabled export.
    if (currentAppId() === 'freelance-invoice') return;
    if (document.documentElement.dataset.swDocumentResult !== 'fresh') return;
    document.documentElement.dataset.swDocumentResult = 'stale';
    exportButtons().forEach(function (button) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
      button.dataset.swDisabledForStaleResult = 'true';
    });
    announce('Taarifa zimebadilika. Tengeneza matokeo mapya kabla ya kupakua.');
  }

  document.addEventListener('DOMContentLoaded', function () {
    keepAccessibilityStylesLast();
    document.addEventListener('input', function (event) {
      if (event.target.matches('input, textarea, select') && !isReviewControl(event.target)) invalidate();
    }, true);
    document.addEventListener('change', function (event) {
      if (event.target.matches('input, textarea, select') && !isReviewControl(event.target)) invalidate();
    }, true);
    outputButtons().forEach(function (button) {
      button.addEventListener('click', function () {
        markFreshWhenOutputReady();
      }, true);
    });
  });
})();
