(function (window, document) {
  'use strict';

  var recipe = window.__AK_STATIC_RECIPE;
  var AK = window.AfroKitchenEngine;
  if (!recipe || !AK) return;

  var state = {
    servings: recipe.default_servings || 1,
    timers: {}
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function renderIngredients() {
    var container = document.getElementById('ak-static-ingredients');
    if (!container) return;

    var scaled = AK.scaleIngredients(recipe.ingredients || [], recipe.default_servings || 1, state.servings);
    var currentGroup = '';
    var html = '';

    scaled.forEach(function (ingredient) {
      if (ingredient.group_name && ingredient.group_name !== currentGroup) {
        currentGroup = ingredient.group_name;
        html += '<div class="ak-ing-group">' + escapeHtml(currentGroup) + '</div>';
      }

      html += '<label class="ak-ing-item">' +
        '<input type="checkbox" class="ak-ing-check">' +
        '<span class="ak-ing-text">' +
          '<span class="ak-ing-amount">' + escapeHtml(AK.formatAmount(ingredient.scaled_amount)) + ' ' + escapeHtml(ingredient.unit) + '</span> ' +
          escapeHtml(ingredient.name) +
          (ingredient.prep_note ? ', <em>' + escapeHtml(ingredient.prep_note) + '</em>' : '') +
          (ingredient.is_optional ? ' <span class="ak-ing-optional">(optional)</span>' : '') +
          (ingredient.substitution ? ' <span class="ak-ing-optional">[Sub: ' + escapeHtml(ingredient.substitution) + ']</span>' : '') +
        '</span>' +
      '</label>';
    });

    container.innerHTML = html;
    setText('ak-static-servings', String(state.servings));
  }

  function renderNutrition() {
    var container = document.getElementById('ak-static-nutrition');
    if (!container) return;

    var nutrition = AK.scaleNutrition(recipe, state.servings);
    if (!nutrition) return;

    container.innerHTML =
      '<div class="ak-nutrition-card"><span>Calories</span><strong>' + escapeHtml(String(nutrition.calories)) + '</strong></div>' +
      '<div class="ak-nutrition-card"><span>Protein</span><strong>' + escapeHtml(String(nutrition.protein_g || 0)) + 'g</strong></div>' +
      '<div class="ak-nutrition-card"><span>Carbs</span><strong>' + escapeHtml(String(nutrition.carbs_g || 0)) + 'g</strong></div>' +
      '<div class="ak-nutrition-card"><span>Fat</span><strong>' + escapeHtml(String(nutrition.fat_g || 0)) + 'g</strong></div>' +
      '<div class="ak-nutrition-card"><span>Fiber</span><strong>' + escapeHtml(String(nutrition.fiber_g || 0)) + 'g</strong></div>';
  }

  function adjustServings(delta) {
    var nextValue = state.servings + delta;
    if (nextValue < 1 || nextValue > 50) return;
    state.servings = nextValue;
    renderIngredients();
    renderNutrition();
  }

  function updateTimer(stepNumber) {
    var timer = state.timers[stepNumber];
    if (!timer) return;

    setText('ak-timer-display-' + stepNumber, AK.formatTime(timer.remaining));

    var toggle = document.getElementById('ak-timer-toggle-' + stepNumber);
    if (toggle) {
      toggle.textContent = timer.running ? 'Pause timer' : (timer.remaining === timer.total ? 'Start timer' : 'Resume timer');
    }

    var progress = document.getElementById('ak-timer-progress-' + stepNumber);
    if (progress) {
      progress.style.width = ((timer.remaining / timer.total) * 100) + '%';
    }
  }

  function toggleTimer(stepNumber, totalSeconds) {
    var timer = state.timers[stepNumber];
    if (!timer) {
      timer = state.timers[stepNumber] = {
        total: totalSeconds,
        remaining: totalSeconds,
        running: false,
        interval: null
      };
    }

    if (timer.running) {
      clearInterval(timer.interval);
      timer.running = false;
      updateTimer(stepNumber);
      return;
    }

    timer.running = true;
    updateTimer(stepNumber);
    timer.interval = window.setInterval(function () {
      timer.remaining -= 1;

      if (timer.remaining <= 0) {
        clearInterval(timer.interval);
        timer.remaining = 0;
        timer.running = false;
      }

      updateTimer(stepNumber);
    }, 1000);
  }

  function resetTimer(stepNumber, totalSeconds) {
    var timer = state.timers[stepNumber];
    if (timer && timer.interval) {
      clearInterval(timer.interval);
    }

    state.timers[stepNumber] = {
      total: totalSeconds,
      remaining: totalSeconds,
      running: false,
      interval: null
    };
    updateTimer(stepNumber);
  }

  function init() {
    renderIngredients();
    renderNutrition();
  }

  window.AKStaticRecipePage = {
    adjustServings: adjustServings,
    toggleTimer: toggleTimer,
    resetTimer: resetTimer
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window, document);
