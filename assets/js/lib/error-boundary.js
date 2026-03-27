!function(){"use strict";var r=0;function e(r){if(!document.getElementById("afro-error-banner")){var e=document.createElement("div");e.id="afro-error-banner",e.setAttribute("role","alert"),e.style.cssText="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:99999;background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:12px 20px;display:flex;align-items:center;gap:10px;font-family:DM Sans,sans-serif;font-size:13px;color:#991b1b;box-shadow:0 4px 12px rgba(0,0,0,0.1);max-width:90vw;",e.innerHTML="<span>⚠️</span><span>"+(r||"Something went wrong. Try refreshing the page.")+'</span><button onclick="this.parentElement.remove()" style="background:none;border:none;font-size:16px;cursor:pointer;color:#991b1b;padding:0 4px;">✕</button>',document.body.appendChild(e),setTimeout(function(){e.parentElement&&e.remove()},8e3)}}function o(e,o,n){if(!(r>=5)){r++;var t=o instanceof Error?o.message:String(o),a=o instanceof Error?o.stack:"";"undefined"!=typeof AfroTools&&AfroTools.analytics&&AfroTools.analytics.trackError&&AfroTools.analytics.trackError(e||"global","js_error",t),console.error("[AfroTools Error]",e||"global",t,n||""),a&&console.error(a)}}window.onerror=function(r,n,t,a,s){return o("global",s||r,{source:n,line:t,col:a}),!n||n.includes("gtag")||n.includes("analytics")||n.includes("supabase")||e(),!1},window.addEventListener("unhandledrejection",function(r){var e=r.reason;o("global",e||"Unhandled promise rejection",{type:"unhandledrejection"}),e&&e instanceof TypeError&&e.message&&e.message.includes("fetch")}),window.AfroTools=window.AfroTools||{},window.AfroTools.errors={wrap:function(r,n){try{return n()}catch(n){return o(r,n),e("This tool encountered an error. Try refreshing."),null}},wrapAsync:function(r,n){return n().catch(function(n){o(r,n),e("This tool encountered an error. Try refreshing.")})},report:o,showBanner:e}}();

/**
 * AFROTOOLS ERROR BOUNDARY
 * Reusable error/empty state UI for data-fetching tools.
 *
 * Usage:
 *   AfroError.show(container, { title, desc, retry: () => loadData() })
 *   AfroError.showEmpty(container, { title, desc })
 *   AfroError.clear(container)
 */
(function () {
  'use strict';
  var AfroError = {
    show: function (container, opts) {
      if (!container) return;
      opts = opts || {};
      var title = opts.title || 'Something went wrong';
      var desc = opts.desc || 'We couldn\u2019t load this data. Please check your connection and try again.';
      var icon = opts.icon || '\u26A0\uFE0F';
      var div = document.createElement('div');
      div.className = 'afro-error';
      div.setAttribute('role', 'alert');
      var iconEl = document.createElement('div');
      iconEl.className = 'afro-error-icon';
      iconEl.textContent = icon;
      div.appendChild(iconEl);
      var titleEl = document.createElement('div');
      titleEl.className = 'afro-error-title';
      titleEl.textContent = title;
      div.appendChild(titleEl);
      var descEl = document.createElement('div');
      descEl.className = 'afro-error-desc';
      descEl.textContent = desc;
      div.appendChild(descEl);
      if (typeof opts.retry === 'function') {
        var btn = document.createElement('button');
        btn.className = 'afro-error-retry';
        btn.type = 'button';
        btn.textContent = 'Try Again';
        btn.addEventListener('click', function () {
          AfroError.clear(container);
          opts.retry();
        });
        div.appendChild(btn);
      }
      container.appendChild(div);
    },
    showEmpty: function (container, opts) {
      if (!container) return;
      opts = opts || {};
      var title = opts.title || 'No results';
      var desc = opts.desc || 'Try adjusting your inputs or selecting a different option.';
      var icon = opts.icon || '\uD83D\uDCED';
      var div = document.createElement('div');
      div.className = 'afro-empty';
      var iconEl = document.createElement('div');
      iconEl.className = 'afro-empty-icon';
      iconEl.textContent = icon;
      div.appendChild(iconEl);
      var titleEl = document.createElement('div');
      titleEl.className = 'afro-empty-title';
      titleEl.textContent = title;
      div.appendChild(titleEl);
      var descEl = document.createElement('div');
      descEl.className = 'afro-empty-desc';
      descEl.textContent = desc;
      div.appendChild(descEl);
      container.appendChild(div);
    },
    clear: function (container) {
      if (!container) return;
      var el = container.querySelector('.afro-error');
      if (el) el.remove();
      el = container.querySelector('.afro-empty');
      if (el) el.remove();
    }
  };
  window.AfroError = AfroError;
})();