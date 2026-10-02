(function (window, document) {
  'use strict';
  function init() {
    var recipe = window.__AK_STATIC_RECIPE, assets = window.AKVisualAssets;
    var page = document.querySelector('.ak-visual-recipe');
    if (!recipe || !assets || !page) return;
    var actions = page.querySelector('.ak-static-actions');
    var tools = page.querySelector('.ak-cookbook-tools');
    if (actions && tools) {
      var exports = document.createElement('details');
      exports.className = 'ak-visual-exports';
      var exportSummary = document.createElement('summary');
      exportSummary.textContent = 'Copy, print & more';
      exports.appendChild(exportSummary);
      tools.after(exports);
      exports.appendChild(actions);
      var actionStatus = actions.querySelector('#ak-static-action-status');
      if (actionStatus) exports.after(actionStatus);
    }
    var ingredients = document.getElementById('ak-static-ingredients');
    function decorateIngredients() {
      if (!ingredients) return;
      ingredients.querySelectorAll('.ak-ing-item').forEach(function (label, index) {
        var ingredient = recipe.ingredients[index];
        if (!ingredient) return;
        if (ingredient.group_name && !label.querySelector('.ak-ing-category')) {
          var category = document.createElement('span');
          category.className = 'ak-ing-category';
          category.textContent = ingredient.group_name;
          label.appendChild(category);
        }
        if (label.querySelector('.ak-ing-art')) return;
        var art = document.createElement('span');
        art.className = 'ak-ing-art';
        art.setAttribute('aria-hidden', 'true');
        art.innerHTML = assets.ingredient(ingredient.name);
        label.insertBefore(art, label.querySelector('.ak-ing-text'));
      });
      ingredients.classList.add('ak-illustrated-ingredients');
    }
    decorateIngredients();
    if (ingredients) new MutationObserver(decorateIngredients).observe(ingredients, { childList: true });

    var panel = page.querySelector('.ak-ingredients-panel');
    if (panel) {
      var details = document.createElement('details');
      details.className = 'ak-visual-nutrition';
      var summary = document.createElement('summary');
      summary.textContent = 'Nutrition & substitution notes';
      details.appendChild(summary);
      panel.querySelectorAll('.ak-ingredients-footer, .ak-substitution-panel').forEach(function (node) { details.appendChild(node); });
      if (details.children.length > 1) panel.appendChild(details);
    }

    var method = document.getElementById('recipe-method');
    var steps = method ? Array.from(method.querySelectorAll('.ak-step')) : [];
    if (!steps.length) return;
    var current = 0, full = false;
    var nav = document.createElement('nav');
    nav.className = 'ak-visual-step-nav';
    nav.setAttribute('aria-label', 'Recipe steps');
    var buttons = steps.map(function (step, index) {
      var button = document.createElement('button');
      button.type = 'button'; button.textContent = String(index + 1);
      button.setAttribute('aria-label', 'Step ' + (index + 1) + ': ' + (recipe.steps[index].title || 'Cooking step'));
      button.addEventListener('click', function () { current = index; full = false; render(true); });
      nav.appendChild(button); return button;
    });
    var view = document.createElement('button');
    view.type = 'button'; view.setAttribute('data-ak-full-method', '');
    view.setAttribute('aria-pressed', 'false');
    view.addEventListener('click', function () { full = !full; render(false); });
    nav.appendChild(view);
    method.querySelector('.ak-steps').before(nav);
    var pager = document.createElement('div');
    pager.className = 'ak-visual-pager';
    pager.innerHTML = '<button type="button" data-ak-visual-prev>Previous step</button><p role="status" aria-live="polite"></p><button type="button" data-ak-visual-next>Next step</button>';
    method.querySelector('.ak-steps').after(pager);
    var previous = pager.querySelector('[data-ak-visual-prev]'), next = pager.querySelector('[data-ak-visual-next]');
    previous.addEventListener('click', function () { if (current > 0) { current--; render(true); } });
    next.addEventListener('click', function () {
      if (current < steps.length - 1) { current++; render(true); }
      else { pager.querySelector('p').textContent = 'Method complete. Check any running timers before serving.'; }
    });
    function render(focus) {
      steps.forEach(function (step, index) { step.hidden = !full && index !== current; });
      buttons.forEach(function (button, index) {
        if (!full && index === current) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
      view.textContent = full ? 'One step at a time' : 'Full method';
      view.setAttribute('aria-pressed', String(full));
      pager.hidden = full;
      previous.disabled = current === 0;
      next.textContent = current === steps.length - 1 ? 'Finish cooking' : 'Next step';
      pager.querySelector('p').textContent = 'Step ' + (current + 1) + ' of ' + steps.length;
      if (focus) {
        var title = steps[current].querySelector('.ak-step-title');
        if (title) { title.tabIndex = -1; title.focus({ preventScroll: true }); }
      }
    }
    render(false);
    var dialog = document.querySelector('.ak-cook-dialog');
    if (dialog) dialog.addEventListener('close', function () { render(false); });

    var running = document.createElement('div');
    running.className = 'ak-running-timers';
    running.setAttribute('aria-label', 'Active recipe timers');
    pager.after(running);
    var timerButtons = new Map();
    function showTimers() {
      steps.forEach(function (step, index) {
        var active = step.classList.contains('is-timer-running') || step.classList.contains('is-timer-complete');
        var button = timerButtons.get(index);
        if (!active) { if (button) { button.remove(); timerButtons.delete(index); } return; }
        if (!button) {
          button = document.createElement('button'); button.type = 'button';
          button.addEventListener('click', function () {
            if (dialog && dialog.open) dialog.close();
            current = index; full = false; render(true);
            steps[index].scrollIntoView({ block: 'nearest' });
          });
          timerButtons.set(index, button); running.appendChild(button);
        }
        var display = step.querySelector('[id^="ak-timer-display-"]');
        var text = (recipe.steps[index].timer_label || recipe.steps[index].title || 'Step ' + (index + 1)) + ': ' + (step.classList.contains('is-timer-complete') ? 'Ready to check' : display ? display.textContent : 'Running');
        if (button.textContent !== text) button.textContent = text;
      });
      running.hidden = timerButtons.size === 0;
    }
    new MutationObserver(showTimers).observe(method.querySelector('.ak-steps'), { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class'] });
    showTimers();
    window.addEventListener('beforeprint', function () { steps.forEach(function (step) { step.hidden = false; }); });
    window.addEventListener('afterprint', function () { render(false); });
    function revealFragment() {
      var match = window.location.hash.match(/^#step-(\d+)$/);
      if (!match) return;
      var index = steps.findIndex(function (step) { return step.id === 'step-' + match[1]; });
      if (index >= 0) { current = index; full = false; render(false); steps[index].scrollIntoView({ block: 'start' }); }
    }
    window.addEventListener('hashchange', revealFragment);
    revealFragment();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})(window, document);
