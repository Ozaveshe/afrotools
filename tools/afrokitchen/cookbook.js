(function (window, document) {
  'use strict';
  var key = 'ak_cookbook_v1';
  function read() {
    var rows = JSON.parse(window.localStorage.getItem(key) || '[]');
    if (!Array.isArray(rows)) throw new Error('Invalid cookbook');
    return Array.from(new Set(rows.filter(function (slug) {
      return typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
    }))).slice(0, 1000);
  }
  function contains(slug) { return read().indexOf(slug) !== -1; }
  window.AfroKitchenCookbook = { read: read, contains: contains };

  function init() {
    function revealDirectory(hash) {
      if (hash !== '#country-grid' && hash !== '#collections-grid') return;
      var target = document.querySelector(hash);
      if (!target) return;
      var parent = target.parentElement;
      while (parent) { if (parent.tagName === 'DETAILS') parent.open = true; parent = parent.parentElement; }
    }
    revealDirectory(window.location.hash);
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a');
      if (link && link.origin === window.location.origin && link.pathname === window.location.pathname) revealDirectory(link.hash);
    });
    window.addEventListener('hashchange', function () { revealDirectory(window.location.hash); });
    var recipe = window.__AK_STATIC_RECIPE;
    if (!recipe) return;
    var save = document.querySelector('[data-ak-save-recipe]');
    var status = document.querySelector('[data-ak-cookbook-status]');
    function showSaved() {
      try {
        var saved = contains(recipe.slug);
        save.textContent = saved ? 'Saved to cookbook' : 'Save recipe';
        save.setAttribute('aria-pressed', String(saved));
      } catch (error) {
        status.textContent = 'Your cookbook could not be read on this device.';
      }
    }
    if (save) {
      showSaved();
      save.addEventListener('click', function () {
        try {
          var rows = read(), saved = rows.indexOf(recipe.slug) !== -1;
          rows = rows.filter(function (slug) { return slug !== recipe.slug; });
          if (!saved) rows.unshift(recipe.slug);
          window.localStorage.setItem(key, JSON.stringify(rows.slice(0, 1000)));
          showSaved();
          status.textContent = saved ? 'Recipe removed from your cookbook.' : 'Recipe saved on this device. Find it in My cookbook.';
        } catch (error) {
          status.textContent = 'This browser could not save your cookbook. You can still print or download the recipe.';
        }
      });
      window.addEventListener('storage', function (event) { if (event.key === key || event.key === null) showSaved(); });
    }
    var open = document.querySelector('[data-ak-cook-mode]');
    var layout = document.querySelector('#recipe-ingredients .ak-recipe-layout');
    if (!open || !layout) return;
    var steps = Array.from(layout.querySelectorAll('.ak-step'));
    if (!steps.length) { open.hidden = true; return; }
    var dialog = document.createElement('dialog');
    dialog.className = 'ak-page ak-static-page ak-cook-dialog';
    dialog.setAttribute('aria-labelledby', 'ak-cook-mode-title');
    dialog.innerHTML = '<header class="ak-cook-dialog-head"><div><span class="ak-section-kicker">Cook mode</span><h2 id="ak-cook-mode-title"></h2><p data-ak-cook-servings></p></div><button type="button" class="ak-btn ak-btn-outline" data-ak-cook-close>Close cook mode</button></header><div data-ak-cook-workspace></div><footer class="ak-cook-dialog-foot"><button type="button" class="ak-btn ak-btn-outline" data-ak-cook-prev>Previous step</button><p aria-live="polite" data-ak-cook-progress></p><button type="button" class="ak-btn ak-btn-primary" data-ak-cook-next>Next step</button></footer>';
    document.body.appendChild(dialog);
    if (typeof dialog.showModal !== 'function') { open.hidden = true; return; }
    dialog.querySelector('h2').textContent = recipe.name;
    var ingredients = layout.querySelector('.ak-ingredients-panel');
    var ingredientsDetails = document.createElement('details');
    ingredientsDetails.className = 'ak-cook-ingredients';
    ingredientsDetails.innerHTML = '<summary>Ingredients checklist</summary>';
    var index = 0, placeholder, ingredientsPlaceholder, previousHidden;
    function renderStep() {
      steps.forEach(function (step, position) { step.hidden = position !== index; });
      dialog.querySelector('[data-ak-cook-progress]').textContent = 'Step ' + (index + 1) + ' of ' + steps.length;
      dialog.querySelector('[data-ak-cook-prev]').disabled = index === 0;
      dialog.querySelector('[data-ak-cook-next]').textContent = index === steps.length - 1 ? 'Finish cooking' : 'Next step';
      dialog.scrollTop = 0;
    }
    open.addEventListener('click', function () {
      previousHidden = steps.map(function (step) { return step.hidden; });
      placeholder = document.createComment('Cook mode layout returns here');
      layout.before(placeholder);
      ingredientsPlaceholder = document.createComment('Ingredients return here');
      ingredients.before(ingredientsPlaceholder);
      ingredientsPlaceholder.after(ingredientsDetails);
      ingredientsDetails.appendChild(ingredients);
      ingredientsDetails.open = window.matchMedia('(min-width: 641px)').matches;
      dialog.querySelector('[data-ak-cook-workspace]').appendChild(layout);
      dialog.querySelector('[data-ak-cook-servings]').textContent = 'Cooking for ' + document.getElementById('ak-static-servings').textContent + ' ' + (recipe.serving_unit || 'servings');
      renderStep();
      dialog.showModal();
      dialog.querySelector('[data-ak-cook-close]').focus();
    });
    dialog.querySelector('[data-ak-cook-close]').addEventListener('click', function () { dialog.close(); });
    dialog.querySelector('[data-ak-cook-prev]').addEventListener('click', function () { if (index > 0) { index--; renderStep(); } });
    dialog.querySelector('[data-ak-cook-next]').addEventListener('click', function () {
      if (index === steps.length - 1) { dialog.close(); return; }
      index++; renderStep();
    });
    function restoreLayout() {
      if (!placeholder) return;
      placeholder.replaceWith(layout);
      ingredientsPlaceholder.replaceWith(ingredients);
      ingredientsDetails.remove();
      steps.forEach(function (step, position) { step.hidden = previousHidden[position]; });
      placeholder = null;
    }
    dialog.addEventListener('close', function () {
      restoreLayout();
      open.focus({ preventScroll: true });
    });
    window.addEventListener('beforeprint', function () {
      if (dialog.open) { dialog.close(); restoreLayout(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})(window, document);
