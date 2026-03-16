// Favorites widget — adds ★ star button to any tool page
// Include on tool pages with: <script src="/assets/js/favorites-widget.js" defer></script>
// The page must have a <meta name="tool-id" content="ke-paye"> tag to identify the tool
// Uses SavedTools library for Supabase sync when logged in, localStorage fallback otherwise.

(function() {
  var LOCAL_KEY = 'afro_favs_v2';

  function getLocal() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; }
    catch(e) { return []; }
  }

  function toggleLocal(id) {
    var favs = getLocal();
    var idx = favs.indexOf(id);
    if (idx >= 0) {
      favs.splice(idx, 1);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(favs));
      return false;
    } else {
      favs.unshift(id);
      if (favs.length > 50) favs = favs.slice(0, 50);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(favs));
      return true;
    }
  }

  function init() {
    var meta = document.querySelector('meta[name="tool-id"]');
    if (!meta) return;
    var toolId = meta.content;
    var toolName = document.title.split('\u2014')[0].split('|')[0].trim();
    var toolUrl = window.location.pathname;

    var isFav = getLocal().indexOf(toolId) >= 0;

    var btn = document.createElement('button');
    btn.id = 'fav-btn';
    btn.setAttribute('aria-label', 'Save to My Tools');

    function updateBtn(saved) {
      btn.innerHTML = saved ? '\u2605 Saved' : '\u2606 Save Tool';
      btn.style.background = saved ? 'var(--color-primary,#007AFF)' : '#fff';
      btn.style.color = saved ? '#fff' : '#1e293b';
      btn.style.borderColor = saved ? 'var(--color-primary,#007AFF)' : '#e2e8f0';
    }

    btn.style.cssText = 'position:fixed;bottom:24px;right:92px;z-index:9990;border-radius:100px;padding:10px 18px;font-family:"DM Sans",system-ui,sans-serif;font-size:0.82rem;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.12);transition:all 0.18s;display:flex;align-items:center;gap:6px;border:1.5px solid #e2e8f0;';
    updateBtn(isFav);

    btn.addEventListener('click', function() {
      // Optimistic UI: toggle localStorage immediately, update button instantly
      var nowSaved = toggleLocal(toolId);
      updateBtn(nowSaved);

      // Animate
      btn.style.transform = 'scale(1.1)';
      setTimeout(function() { btn.style.transform = 'scale(1)'; }, 200);

      // Background Supabase sync (fire-and-forget, never blocks UI)
      if (typeof window._savedToolsInstance !== 'undefined') {
        // SavedTools will sync to Supabase when auth is ready
        if (nowSaved) {
          window._savedToolsInstance.save(toolId, toolName, toolUrl, '').catch(function() {});
        } else {
          window._savedToolsInstance.remove(toolId).catch(function() {});
        }
      }
    });

    btn.addEventListener('mouseenter', function() { btn.style.boxShadow = '0 6px 20px rgba(0,122,255,0.25)'; });
    btn.addEventListener('mouseleave', function() { btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; });

    document.body.appendChild(btn);

    // Background check: if Supabase has different state, update button
    if (typeof window._savedToolsInstance !== 'undefined') {
      window._savedToolsInstance.isSaved(toolId).then(function(cloudSaved) {
        if (cloudSaved !== isFav) updateBtn(cloudSaved);
      }).catch(function() {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
