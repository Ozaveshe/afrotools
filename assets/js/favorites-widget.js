// Favorites widget — adds ★ star button to any tool page
// Include on tool pages with: <script src="/assets/js/favorites-widget.js" defer></script>
// The page must have a <meta name="tool-id" content="ke-paye"> tag to identify the tool

(function() {
  function init() {
    if (typeof afroFavs === 'undefined') return;

    // Get tool ID from meta tag
    const meta = document.querySelector('meta[name="tool-id"]');
    if (!meta) return;
    const toolId = meta.content;

    // Create floating star button
    const btn = document.createElement('button');
    btn.id = 'fav-btn';
    btn.setAttribute('aria-label', 'Save to My Tools');
    const isFav = afroFavs.has(toolId);
    btn.innerHTML = isFav ? '★ Saved' : '☆ Save Tool';
    btn.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9990;
      background: ${isFav ? 'var(--color-primary)' : '#fff'};
      color: ${isFav ? '#fff' : '#1e293b'};
      border: 1.5px solid ${isFav ? 'var(--color-primary)' : '#e2e8f0'};
      border-radius: 100px;
      padding: 10px 18px;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      transition: all 0.18s;
      display: flex;
      align-items: center;
      gap: 6px;
    `;

    btn.addEventListener('click', function() {
      const nowFav = afroFavs.toggle(toolId);
      btn.innerHTML = nowFav ? '★ Saved' : '☆ Save Tool';
      btn.style.background = nowFav ? 'var(--color-primary)' : '#fff';
      btn.style.color = nowFav ? '#fff' : '#1e293b';
      btn.style.borderColor = nowFav ? 'var(--color-primary)' : '#e2e8f0';

      // Pulse animation
      btn.style.transform = 'scale(1.1)';
      setTimeout(() => { btn.style.transform = 'scale(1)'; }, 200);
    });

    btn.addEventListener('mouseenter', function() {
      btn.style.boxShadow = '0 6px 20px rgba(93,219,158,0.25)';
    });
    btn.addEventListener('mouseleave', function() {
      btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
    });

    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
