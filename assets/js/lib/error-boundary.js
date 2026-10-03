(function () {
  'use strict';

  var errorCount = 0;

  function safeToolId(value) {
    if (value === 'global') return value;
    if (typeof value !== 'string' || !/^[a-z][a-z0-9_-]{0,79}$/.test(value)) return 'global';
    var registry = window.AFRO_TOOLS;
    if (!Array.isArray(registry)) return 'global';
    return registry.some(function (tool) { return tool && tool.id === value; }) ? value : 'global';
  }

  function showBanner(message) {
    if (!document.body || document.getElementById('afro-error-banner')) return;
    var banner = document.createElement('div');
    banner.id = 'afro-error-banner';
    banner.setAttribute('role', 'alert');
    banner.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:99999;background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:12px 20px;display:flex;align-items:center;gap:10px;font-family:DM Sans,sans-serif;font-size:13px;color:#991b1b;box-shadow:0 4px 12px rgba(0,0,0,0.1);max-width:90vw;box-sizing:border-box;';
    var icon = document.createElement('span');
    icon.textContent = '⚠️';
    icon.setAttribute('aria-hidden', 'true');
    var text = document.createElement('span');
    text.textContent = typeof message === 'string' && message ? message : 'Something went wrong. Try refreshing the page.';
    text.style.overflowWrap = 'anywhere';
    var close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Dismiss error');
    close.textContent = '✕';
    close.style.cssText = 'background:none;border:none;font-size:16px;cursor:pointer;color:#991b1b;padding:0 4px;min-width:44px;min-height:44px;flex-shrink:0;';
    close.addEventListener('click', function () { banner.remove(); });
    banner.appendChild(icon);
    banner.appendChild(text);
    banner.appendChild(close);
    document.body.appendChild(banner);
    setTimeout(function () { if (banner.parentElement) banner.remove(); }, 8000);
  }

  // Keep the public signature, but never inspect or forward exception content,
  // stack traces, source URLs or caller details. Registry IDs and fixed codes
  // are the entire application-controlled diagnostic payload.
  function report(toolId, error, details) {
    if (errorCount >= 5) return;
    errorCount += 1;
    var tool = safeToolId(toolId);
    var analytics = window.AfroTools && window.AfroTools.analytics;
    if (analytics && typeof analytics.trackError === 'function') analytics.trackError(tool, 'js_error', '');
    console.error('[AfroTools Error]', { tool_id: tool, code: 'js_error', report_count: errorCount });
  }

  window.onerror = function (message, source, line, column, error) {
    report('global', error);
    if (typeof source === 'string' && source && !/gtag|analytics|supabase/.test(source)) showBanner();
    // Preserve native exception propagation. Sanitizing our logger must not
    // conceal an uncaught error from the browser or runtime acceptance tests.
    return false;
  };
  window.addEventListener('unhandledrejection', function () { report('global'); });
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.errors = {
    wrap: function (toolId, callback) {
      try { return callback(); }
      catch (error) { report(toolId, error); showBanner('This tool encountered an error. Try refreshing.'); return null; }
    },
    wrapAsync: function (toolId, callback) {
      return callback().catch(function (error) { report(toolId, error); showBanner('This tool encountered an error. Try refreshing.'); });
    },
    report: report,
    showBanner: showBanner
  };
}());

(function(){"use strict";var e={show:function(r,n){if(r){var t=(n=n||{}).title||"Something went wrong",o=n.desc||"We couldn’t load this data. Please check your connection and try again.",a=n.icon||"⚠️",i=document.createElement("div");i.className="afro-error",i.setAttribute("role","alert");var c=document.createElement("div");c.className="afro-error-icon",c.textContent=a,i.appendChild(c);var s=document.createElement("div");s.className="afro-error-title",s.textContent=t,i.appendChild(s);var l=document.createElement("div");if(l.className="afro-error-desc",l.textContent=o,i.appendChild(l),"function"==typeof n.retry){var d=document.createElement("button");d.className="afro-error-retry",d.type="button",d.textContent="Try Again",d.addEventListener("click",function(){e.clear(r),n.retry()}),i.appendChild(d)}r.appendChild(i)}},showEmpty:function(e,r){if(e){var n=(r=r||{}).title||"No results",t=r.desc||"Try adjusting your inputs or selecting a different option.",o=r.icon||"📭",a=document.createElement("div");a.className="afro-empty";var i=document.createElement("div");i.className="afro-empty-icon",i.textContent=o,a.appendChild(i);var c=document.createElement("div");c.className="afro-empty-title",c.textContent=n,a.appendChild(c);var s=document.createElement("div");s.className="afro-empty-desc",s.textContent=t,a.appendChild(s),e.appendChild(a)}},clear:function(e){if(e){var r=e.querySelector(".afro-error");r&&r.remove(),(r=e.querySelector(".afro-empty"))&&r.remove()}}};window.AfroError=e}());
