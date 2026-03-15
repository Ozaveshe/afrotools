/* AfroTools Toast — lightweight notification system */
window.AfroToast = window.AfroToast || {
  show: function(msg, opts) {
    opts = opts || {};
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1E293B;color:#fff;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,.2);transition:opacity .3s;font-family:inherit;';
    if (opts.type === 'error') el.style.background = '#dc2626';
    if (opts.type === 'success') el.style.background = '#16a34a';
    document.body.appendChild(el);
    setTimeout(function(){ el.style.opacity = '0'; setTimeout(function(){ el.remove(); }, 300); }, opts.duration || 3000);
  }
};
