(function (window, document) {
  'use strict';

  var FAVORITES_KEY = 'afro_favs_v2';
  var META = window.PAYE_TOOL_SAVE_META || {};
  var TOOL_ID = META.toolId || window.PAYE_SAVE_SLUG || '';
  var DEFAULT_TITLE = META.defaultTitle || 'Save this calculator';
  var DEFAULT_DESC = META.defaultDesc || 'Bookmark this calculator to your personal dashboard for quick access anytime.';
  var authReadyAttached = false;

  function isLoggedIn() {
    if (!window.AfroAuth) return false;

    try {
      if (typeof window.AfroAuth.isLoggedIn === 'function' && window.AfroAuth.isLoggedIn()) {
        return true;
      }
    } catch (error) {
      console.warn('[PayeToolSaveCta] isLoggedIn check failed:', error);
    }

    try {
      if (typeof window.AfroAuth.getUser === 'function') {
        var user = window.AfroAuth.getUser();
        if (user && user.id) return true;
      }
    } catch (error) {
      console.warn('[PayeToolSaveCta] getUser fallback failed:', error);
    }

    try {
      if (typeof window.AfroAuth.getCachedProfile === 'function') {
        var cachedProfile = window.AfroAuth.getCachedProfile();
        if (cachedProfile && cachedProfile.id) return true;
      }
    } catch (error) {
      console.warn('[PayeToolSaveCta] getCachedProfile fallback failed:', error);
    }

    if (window.AfroWorkspace && typeof window.AfroWorkspace.isSignedIn === 'function') {
      try {
        return !!window.AfroWorkspace.isSignedIn();
      } catch (error) {
        console.warn('[PayeToolSaveCta] workspace sign-in check failed:', error);
      }
    }

    return false;
  }

  function getFavs() {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    } catch (error) {
      return [];
    }
  }

  function getSavedList() {
    if (window.afroFavs && typeof window.afroFavs.getAll === 'function') {
      return window.afroFavs.getAll();
    }
    return getFavs();
  }

  function isSaved() {
    return !!TOOL_ID && getSavedList().indexOf(TOOL_ID) > -1;
  }

  function whenAuthReady(callback) {
    if (!window.AfroAuth || typeof window.AfroAuth.onReady !== 'function') {
      return false;
    }

    window.AfroAuth.onReady(function () {
      callback();

      if (
        window._savedToolsInstance &&
        window._savedToolsInstance._readyPromise &&
        typeof window._savedToolsInstance._readyPromise.then === 'function'
      ) {
        window._savedToolsInstance._readyPromise.then(callback).catch(function () {
          callback();
        });
      }
    });

    return true;
  }

  function scheduleSaveUiRefresh() {
    if (authReadyAttached) return;
    authReadyAttached = true;

    if (!whenAuthReady(updateSaveUI)) {
      setTimeout(updateSaveUI, 400);
      setTimeout(updateSaveUI, 1200);
    }
  }

  function showSaveToast(message) {
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;padding:12px 24px;border-radius:10px;font-size:.85rem;font-family:DM Sans,sans-serif;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,.2);max-width:400px;text-align:center';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity .3s';
      setTimeout(function () {
        toast.remove();
      }, 300);
    }, 4000);
  }

  function writeFallbackFavorites(saved) {
    var favorites = getFavs();
    var index = favorites.indexOf(TOOL_ID);

    if (saved) {
      if (index === -1) {
        favorites.unshift(TOOL_ID);
      }
    } else if (index > -1) {
      favorites.splice(index, 1);
    }

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }

  async function toggleFavorite() {
    if (window.afroFavs && typeof window.afroFavs.toggleAsync === 'function') {
      return !!(await window.afroFavs.toggleAsync(TOOL_ID));
    }

    if (window._savedToolsInstance && typeof window._savedToolsInstance.toggle === 'function') {
      return !!(await window._savedToolsInstance.toggle(TOOL_ID));
    }

    if (window.afroFavs && typeof window.afroFavs.toggle === 'function') {
      return !!window.afroFavs.toggle(TOOL_ID);
    }

    var saved = !isSaved();
    writeFallbackFavorites(saved);
    return saved;
  }

  async function handleToggleSaveTool() {
    updateSaveUI();

    if (!isLoggedIn()) {
      if (window.AfroAuth && typeof window.AfroAuth.openModal === 'function') {
        window.AfroAuth.openModal('login', function () {
          updateSaveUI();
        });
      } else {
        window.location.href = '/dashboard/';
      }
      return;
    }

    try {
      var saved = await toggleFavorite();
      updateSaveUI();
      showSaveToast(saved ? 'Added to My Tools.' : 'Removed from My Tools.');
    } catch (error) {
      console.warn('[PayeToolSaveCta] Could not toggle favorite:', error);
      showSaveToast('Could not update My Tools right now.');
    }
  }

  function updateSaveUI() {
    var loggedIn = isLoggedIn();
    var saved = loggedIn && isSaved();
    var svgSaved = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
    var svgUnsaved = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';

    var inlineButton = document.getElementById('inlineSaveBtn');
    if (inlineButton) {
      if (!loggedIn) {
        inlineButton.innerHTML = svgUnsaved + ' Sign in to Save';
        inlineButton.classList.remove('saved');
      } else if (saved) {
        inlineButton.innerHTML = svgSaved + ' Saved';
        inlineButton.classList.add('saved');
      } else {
        inlineButton.innerHTML = svgUnsaved + ' Save to My Tools';
        inlineButton.classList.remove('saved');
      }
    }

    var sidebarButton = document.getElementById('sidebarSaveBtn');
    if (sidebarButton) {
      var sidebarLabel = document.getElementById('sidebarSaveLabel');
      if (!loggedIn) {
        if (sidebarLabel) sidebarLabel.textContent = 'Sign in to Save';
        sidebarButton.classList.remove('saved');
      } else if (saved) {
        if (sidebarLabel) sidebarLabel.textContent = 'Saved';
        sidebarButton.classList.add('saved');
      } else {
        if (sidebarLabel) sidebarLabel.textContent = 'Save to My Tools';
        sidebarButton.classList.remove('saved');
      }
    }

    var bannerTitle = document.querySelector('.ng-save-title');
    var bannerDesc = document.querySelector('.ng-save-desc');
    if (!loggedIn) {
      if (bannerTitle) bannerTitle.textContent = 'Sign in to save this calculator';
      if (bannerDesc) bannerDesc.textContent = 'Create a free account to bookmark tools, track calculations, and access your dashboard.';
    } else {
      if (bannerTitle) bannerTitle.textContent = DEFAULT_TITLE;
      if (bannerDesc) bannerDesc.textContent = DEFAULT_DESC;
    }
  }

  window.toggleSaveTool = handleToggleSaveTool;
  window.updateSaveUI = updateSaveUI;

  document.addEventListener('DOMContentLoaded', function () {
    updateSaveUI();
    scheduleSaveUiRefresh();
  });

  window.addEventListener('afro-auth-change', updateSaveUI);
  window.addEventListener('afro-favorites-change', updateSaveUI);
  window.addEventListener('storage', function (event) {
    if (event.key === FAVORITES_KEY) {
      updateSaveUI();
    }
  });
})(window, document);
