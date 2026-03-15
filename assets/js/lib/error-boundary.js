/**
 * AFROTOOLS — Error Boundary & Global Error Handling
 * ===================================================================
 * Catches unhandled errors and promise rejections, displays user-friendly
 * error messages, and reports errors to analytics.
 *
 * Usage:
 *   <script src="/assets/js/lib/error-boundary.js"></script>
 *   (Load early in <head> before other scripts)
 *
 *   // Wrap tool-specific code:
 *   AfroTools.errors.wrap('ng-paye', function() {
 *     // tool initialization code
 *   });
 *
 *   // Or use try/catch with reporting:
 *   try { ... } catch(e) { AfroTools.errors.report('ng-paye', e); }
 * ===================================================================
 */

(function () {
  'use strict';

  var _errorCount = 0;
  var MAX_ERRORS = 5; // Don't spam analytics

  // ── ERROR UI ──────────────────────────────────────────────

  function showErrorBanner(message) {
    // Only show once
    if (document.getElementById('afro-error-banner')) return;

    var banner = document.createElement('div');
    banner.id = 'afro-error-banner';
    banner.setAttribute('role', 'alert');
    banner.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:99999;' +
      'background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:12px 20px;' +
      'display:flex;align-items:center;gap:10px;font-family:DM Sans,sans-serif;font-size:13px;' +
      'color:#991b1b;box-shadow:0 4px 12px rgba(0,0,0,0.1);max-width:90vw;';

    banner.innerHTML = '<span>⚠️</span><span>' + (message || 'Something went wrong. Try refreshing the page.') +
      '</span><button onclick="this.parentElement.remove()" style="background:none;border:none;font-size:16px;cursor:pointer;color:#991b1b;padding:0 4px;">✕</button>';

    document.body.appendChild(banner);

    // Auto-dismiss after 8s
    setTimeout(function() {
      if (banner.parentElement) banner.remove();
    }, 8000);
  }

  // ── ERROR REPORTING ────────────────────────────────────────

  function reportError(toolId, error, context) {
    if (_errorCount >= MAX_ERRORS) return;
    _errorCount++;

    var errorMsg = error instanceof Error ? error.message : String(error);
    var errorStack = error instanceof Error ? error.stack : '';

    // Report to analytics if available
    if (typeof AfroTools !== 'undefined' && AfroTools.analytics && AfroTools.analytics.trackError) {
      AfroTools.analytics.trackError(toolId || 'global', 'js_error', errorMsg);
    }

    // Console logging for dev
    console.error('[AfroTools Error]', toolId || 'global', errorMsg, context || '');
    if (errorStack) console.error(errorStack);
  }

  // ── GLOBAL ERROR HANDLERS ──────────────────────────────────

  window.onerror = function(message, source, lineno, colno, error) {
    reportError('global', error || message, { source: source, line: lineno, col: colno });

    // Show UI for critical errors (skip analytics/tracking script errors)
    if (source && !source.includes('gtag') && !source.includes('analytics') && !source.includes('supabase')) {
      showErrorBanner();
    }

    return false; // Allow default browser handling too
  };

  window.addEventListener('unhandledrejection', function(event) {
    var reason = event.reason;
    reportError('global', reason || 'Unhandled promise rejection', { type: 'unhandledrejection' });

    // Don't show banner for network errors (common on mobile)
    if (reason && reason instanceof TypeError && reason.message && reason.message.includes('fetch')) {
      return;
    }
  });

  // ── TOOL WRAPPER ──────────────────────────────────────────

  function wrap(toolId, fn) {
    try {
      return fn();
    } catch (e) {
      reportError(toolId, e);
      showErrorBanner('This tool encountered an error. Try refreshing.');
      return null;
    }
  }

  function wrapAsync(toolId, fn) {
    return fn().catch(function(e) {
      reportError(toolId, e);
      showErrorBanner('This tool encountered an error. Try refreshing.');
    });
  }

  // ── EXPOSE ────────────────────────────────────────────────

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.errors = {
    wrap: wrap,
    wrapAsync: wrapAsync,
    report: reportError,
    showBanner: showErrorBanner,
  };

})();
