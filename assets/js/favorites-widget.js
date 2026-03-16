// Favorites widget — adds ★ star button to any tool page
// Include on tool pages with: <script src="/assets/js/favorites-widget.js" defer></script>
// The page must have a <meta name="tool-id" content="ke-paye"> tag to identify the tool
// Uses SavedTools library for Supabase sync when logged in, localStorage fallback otherwise.

(function() {
  function init() {
    var meta = document.querySelector('meta[name="tool-id"]');
    if (!meta) return;
    var toolId = meta.content;
    var toolName = document.title.split('\u2014')[0].split('|')[0].trim();
    var toolUrl = window.location.pathname;

    var hasSavedTools = typeof window._savedToolsInstance !== 'undefined';
    var hasAfroFavs = typeof window.afroFavs !== 'undefined';
    if (!hasSavedTools && !hasAfroFavs) return;

    var isFav = hasAfroFavs ? window.afroFavs.has(toolId) : false;

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

    btn.addEventListener('click', async function() {
      btn.disabled = true;
      if (hasSavedTools) {
        var nowFav = await window._savedToolsInstance.toggle(toolId, toolName, toolUrl, '');
        updateBtn(nowFav);
      } else if (hasAfroFavs) {
        updateBtn(window.afroFavs.toggle(toolId));
      }
      btn.style.transform = 'scale(1.1)';
      setTimeout(function() { btn.style.transform = 'scale(1)'; btn.disabled = false; }, 200);
    });

    btn.addEventListener('mouseenter', function() { btn.style.boxShadow = '0 6px 20px rgba(0,122,255,0.25)'; });
    btn.addEventListener('mouseleave', function() { btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; });

    document.body.appendChild(btn);

    // Async check: Supabase might have favorites not in localStorage yet
    if (hasSavedTools) {
      window._savedToolsInstance.isSaved(toolId).then(function(cloudSaved) {
        if (cloudSaved !== isFav) updateBtn(cloudSaved);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
