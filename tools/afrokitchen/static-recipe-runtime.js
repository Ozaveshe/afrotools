!function (window, document) {
  "use strict";

  var recipe = window.__AK_STATIC_RECIPE;
  var engine = window.AfroKitchenEngine;
  if (!recipe || !engine) return;

  var storageKey = "ak_static_recipe_" + (recipe.slug || "recipe") + "_v2";
  var mealPlanKey = "ak_meal_plan_v1";
  var state = loadState();

  window.AKStaticRecipePage = {
    adjustServings: adjustServings,
    toggleTimer: toggleTimer,
    resetTimer: resetTimer,
    copyRecipe: copyRecipe,
    printRecipe: printRecipe,
    addToMealPlan: addToMealPlan,
    clearChecked: clearChecked
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  function init() {
    injectStyles();
    injectWorkflowControls();
    renderIngredients();
    renderNutrition();
    renderSubstitutions();
    wireIngredientChecks();
    prepareTimers();
    updateAllTimerDisplays();
    updateCheckProgress();
  }

  function loadState() {
    var fallback = {
      servings: recipe.default_servings || 1,
      checked: {},
      timers: {}
    };
    try {
      var saved = JSON.parse(window.localStorage.getItem(storageKey) || "null");
      if (!saved || typeof saved !== "object") return fallback;
      return {
        servings: clamp(Number(saved.servings || fallback.servings), 1, 50),
        checked: saved.checked && typeof saved.checked === "object" ? saved.checked : {},
        timers: saved.timers && typeof saved.timers === "object" ? saved.timers : {}
      };
    } catch (error) {
      return fallback;
    }
  }

  function saveState() {
    try {
      var timers = {};
      Object.keys(state.timers || {}).forEach(function (key) {
        var timer = state.timers[key];
        timers[key] = {
          total: timer.total,
          remaining: timer.remaining,
          running: false
        };
      });
      window.localStorage.setItem(storageKey, JSON.stringify({
        servings: state.servings,
        checked: state.checked,
        timers: timers
      }));
    } catch (error) {}
  }

  function injectStyles() {
    if (document.getElementById("ak-static-runtime-style")) return;
    var style = document.createElement("style");
    style.id = "ak-static-runtime-style";
    style.textContent = [
      ".ak-static-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}",
      ".ak-static-actions .ak-btn{min-height:44px;padding:0 16px}",
      ".ak-static-status{flex:1 1 100%;min-height:22px;margin:2px 0 0;color:var(--ak-muted);font-size:.86rem;line-height:1.45}",
      ".ak-check-progress{margin:0 0 14px;padding:12px 14px;border:1px solid var(--ak-line);border-radius:16px;background:var(--ak-bg);color:var(--ak-muted);font-size:.88rem;line-height:1.55}",
      ".ak-check-progress strong{color:var(--ak-primary-deep)}",
      ".ak-ing-item.is-checked .ak-ing-text{color:var(--ak-subtle);text-decoration:line-through}",
      ".ak-ing-sub{display:block;margin-top:4px;color:var(--ak-leaf-deep);font-size:.82rem;text-decoration:none}",
      ".ak-substitution-panel{margin-top:18px;padding-top:18px;border-top:1px solid var(--ak-line)}",
      ".ak-substitution-panel ul{margin:0;padding-left:18px;color:var(--ak-muted);line-height:1.65}",
      ".ak-substitution-panel li+li{margin-top:8px}",
      ".ak-timer-status{min-height:20px;color:var(--ak-muted);font-size:.84rem}",
      ".ak-step.is-timer-running{border-color:var(--ak-primary-border);box-shadow:0 18px 34px rgba(199,62,29,.12)}",
      ".ak-step.is-timer-complete{border-color:rgba(15,123,67,.28)}",
      ".ak-nutrition-note{grid-column:1/-1;margin:0;color:var(--ak-muted);font-size:.82rem;line-height:1.45}",
      "@media(max-width:760px){.ak-static-actions{justify-content:stretch}.ak-static-actions .ak-btn{flex:1 1 100%}}",
      "@media print{.ak-static-actions,.ak-check-progress,.ak-static-status,.ak-static-timer-buttons,.ak-static-timer-bar,.ak-timer-status{display:none!important}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function injectWorkflowControls() {
    var servingBar = document.querySelector(".ak-static-serving-bar");
    if (!servingBar || servingBar.querySelector(".ak-static-actions")) return;
    var actions = document.createElement("div");
    actions.className = "ak-static-actions";
    actions.innerHTML = [
      '<button class="ak-btn ak-btn-outline" type="button" data-ak-copy-recipe>Copy recipe</button>',
      '<button class="ak-btn ak-btn-outline" type="button" data-ak-print-recipe>Print</button>',
      '<button class="ak-btn ak-btn-primary" type="button" data-ak-add-meal-plan>Add to meal plan</button>',
      '<p class="ak-static-status" id="ak-static-action-status" aria-live="polite"></p>'
    ].join("");
    servingBar.appendChild(actions);
    actions.querySelector("[data-ak-copy-recipe]").addEventListener("click", copyRecipe);
    actions.querySelector("[data-ak-print-recipe]").addEventListener("click", printRecipe);
    actions.querySelector("[data-ak-add-meal-plan]").addEventListener("click", addToMealPlan);
  }

  function renderIngredients() {
    var root = document.getElementById("ak-static-ingredients");
    if (!root) return;
    var scaled = scaleIngredients();
    var html = '<div class="ak-check-progress" id="ak-check-progress" aria-live="polite"></div>';
    var currentGroup = "";
    scaled.forEach(function (ingredient, index) {
      var key = ingredientKey(ingredient, index);
      var checked = !!state.checked[key];
      if (ingredient.group_name && ingredient.group_name !== currentGroup) {
        currentGroup = ingredient.group_name;
        html += '<div class="ak-ing-group">' + escapeHtml(currentGroup) + "</div>";
      }
      html += '<label class="ak-ing-item' + (checked ? " is-checked" : "") + '">' +
        '<input type="checkbox" class="ak-ing-check" data-ak-ing-key="' + escapeHtml(key) + '"' + (checked ? " checked" : "") + ">" +
        '<span class="ak-ing-text">' + ingredientLine(ingredient) + "</span>" +
        "</label>";
    });
    root.innerHTML = html;
    setText("ak-static-servings", String(state.servings));
    updateServingHelper();
    wireIngredientChecks();
    updateCheckProgress();
  }

  function wireIngredientChecks() {
    document.querySelectorAll("#ak-static-ingredients .ak-ing-check").forEach(function (checkbox) {
      checkbox.addEventListener("change", function () {
        var key = checkbox.getAttribute("data-ak-ing-key");
        if (!key) return;
        state.checked[key] = checkbox.checked;
        checkbox.closest(".ak-ing-item").classList.toggle("is-checked", checkbox.checked);
        saveState();
        updateCheckProgress();
      });
    });
  }

  function updateCheckProgress() {
    var progress = document.getElementById("ak-check-progress");
    if (!progress) return;
    var boxes = Array.prototype.slice.call(document.querySelectorAll("#ak-static-ingredients .ak-ing-check"));
    var checked = boxes.filter(function (box) { return box.checked; }).length;
    var total = boxes.length;
    progress.innerHTML = "<strong>" + checked + " of " + total + "</strong> ingredients checked" +
      (checked ? ' <button class="ak-btn ak-btn-sm ak-btn-outline" type="button" data-ak-clear-checked>Clear</button>' : "");
    var clearButton = progress.querySelector("[data-ak-clear-checked]");
    if (clearButton) clearButton.addEventListener("click", clearChecked);
  }

  function clearChecked() {
    state.checked = {};
    saveState();
    renderIngredients();
  }

  function ingredientLine(ingredient) {
    var amount = "";
    if (Number(ingredient.scaled_amount || 0) > 0) {
      amount = '<span class="ak-ing-amount">' + escapeHtml(engine.formatAmount(ingredient.scaled_amount)) +
        (ingredient.unit ? " " + escapeHtml(ingredient.unit) : "") + "</span> ";
    }
    return amount +
      escapeHtml(ingredient.name || "") +
      (ingredient.prep_note ? ", <em>" + escapeHtml(ingredient.prep_note) + "</em>" : "") +
      (ingredient.is_optional ? ' <span class="ak-ing-optional">(optional)</span>' : "") +
      (ingredient.substitution ? '<span class="ak-ing-sub">Substitution: ' + escapeHtml(ingredient.substitution) + "</span>" : "");
  }

  function renderNutrition() {
    var footer = document.querySelector(".ak-ingredients-footer");
    var nutrition = document.getElementById("ak-static-nutrition");
    var scaled = engine.scaleNutrition(recipe, state.servings);
    if (!scaled && !footer) {
      var panel = document.querySelector(".ak-ingredients-panel");
      if (!panel) return;
      footer = document.createElement("div");
      footer.className = "ak-ingredients-footer";
      footer.innerHTML = '<h3 class="ak-mini-title">Nutrition estimate</h3><p class="ak-panel-helper">No saved nutrition estimate for this recipe yet.</p>';
      panel.appendChild(footer);
      return;
    }
    if (!scaled || !nutrition) return;
    nutrition.innerHTML = [
      nutritionCard("Calories", String(scaled.calories)),
      nutritionCard("Protein", valueWithUnit(scaled.protein_g, "g")),
      nutritionCard("Carbs", valueWithUnit(scaled.carbs_g, "g")),
      nutritionCard("Fat", valueWithUnit(scaled.fat_g, "g")),
      nutritionCard("Fiber", valueWithUnit(scaled.fiber_g, "g")),
      '<p class="ak-nutrition-note">Scaled estimate for ' + escapeHtml(String(state.servings)) + " " + escapeHtml(recipe.serving_unit || "servings") + ".</p>"
    ].join("");
  }

  function renderSubstitutions() {
    var panel = document.querySelector(".ak-ingredients-panel");
    if (!panel || panel.querySelector(".ak-substitution-panel")) return;
    var substitutions = (recipe.ingredients || []).filter(function (ingredient) {
      return ingredient && ingredient.substitution;
    });
    var section = document.createElement("div");
    section.className = "ak-substitution-panel";
    section.innerHTML = '<h3 class="ak-mini-title">Substitution notes</h3>' +
      (substitutions.length
        ? "<ul>" + substitutions.map(function (ingredient) {
            return "<li><strong>" + escapeHtml(ingredient.name) + ":</strong> " + escapeHtml(ingredient.substitution) + "</li>";
          }).join("") + "</ul>"
        : '<p class="ak-panel-helper">No saved substitution notes for this recipe.</p>');
    panel.appendChild(section);
  }

  function adjustServings(delta) {
    var next = clamp(state.servings + delta, 1, 50);
    if (next === state.servings) return;
    state.servings = next;
    saveState();
    renderIngredients();
    renderNutrition();
    setStatus("Scaled to " + state.servings + " " + (recipe.serving_unit || "servings") + ".");
  }

  function prepareTimers() {
    (recipe.steps || []).forEach(function (step) {
      if (!step || !step.timer_seconds) return;
      var key = timerKey(step);
      var saved = state.timers[key] || {};
      state.timers[key] = {
        total: Number(step.timer_seconds),
        remaining: clamp(Number(saved.remaining || step.timer_seconds), 0, Number(step.timer_seconds)),
        running: false,
        interval: null
      };
      var actions = document.querySelector("#step-" + step.step_number + " .ak-static-step-actions");
      if (actions && !actions.querySelector(".ak-timer-status")) {
        var status = document.createElement("div");
        status.className = "ak-timer-status";
        status.id = "ak-timer-status-" + step.step_number;
        status.setAttribute("aria-live", "polite");
        actions.appendChild(status);
      }
    });
    saveState();
  }

  function toggleTimer(stepNumber, totalSeconds) {
    var key = String(stepNumber);
    var timer = state.timers[key];
    if (!timer) {
      timer = state.timers[key] = {
        total: Number(totalSeconds),
        remaining: Number(totalSeconds),
        running: false,
        interval: null
      };
    }
    if (timer.running) {
      window.clearInterval(timer.interval);
      timer.running = false;
      updateTimerDisplay(key);
      saveState();
      return;
    }
    timer.running = true;
    updateTimerDisplay(key);
    timer.interval = window.setInterval(function () {
      timer.remaining -= 1;
      if (timer.remaining <= 0) {
        window.clearInterval(timer.interval);
        timer.remaining = 0;
        timer.running = false;
      }
      updateTimerDisplay(key);
      saveState();
    }, 1000);
  }

  function resetTimer(stepNumber, totalSeconds) {
    var key = String(stepNumber);
    var timer = state.timers[key];
    if (timer && timer.interval) window.clearInterval(timer.interval);
    state.timers[key] = {
      total: Number(totalSeconds),
      remaining: Number(totalSeconds),
      running: false,
      interval: null
    };
    updateTimerDisplay(key);
    saveState();
  }

  function updateAllTimerDisplays() {
    Object.keys(state.timers || {}).forEach(updateTimerDisplay);
  }

  function updateTimerDisplay(key) {
    var timer = state.timers[key];
    if (!timer) return;
    setText("ak-timer-display-" + key, engine.formatTime(timer.remaining));
    var button = document.getElementById("ak-timer-toggle-" + key);
    if (button) {
      button.textContent = timer.running ? "Pause timer" : timer.remaining === timer.total ? "Start timer" : timer.remaining === 0 ? "Restart timer" : "Resume timer";
      button.setAttribute("aria-label", button.textContent + " for step " + key);
    }
    var progress = document.getElementById("ak-timer-progress-" + key);
    if (progress) progress.style.width = (timer.total ? timer.remaining / timer.total * 100 : 0) + "%";
    var status = document.getElementById("ak-timer-status-" + key);
    if (status) {
      status.textContent = timer.running ? "Timer running: " + engine.formatTime(timer.remaining) + " left." :
        timer.remaining === 0 ? "Timer complete." :
        timer.remaining === timer.total ? "Timer ready." :
        "Timer paused at " + engine.formatTime(timer.remaining) + ".";
    }
    var step = document.getElementById("step-" + key);
    if (step) {
      step.classList.toggle("is-timer-running", !!timer.running);
      step.classList.toggle("is-timer-complete", timer.remaining === 0);
    }
  }

  function copyRecipe() {
    var text = buildRecipeText();
    copyText(text).then(function () {
      setStatus("Recipe copied.");
    }).catch(function () {
      window.prompt("Copy recipe", text);
    });
  }

  function printRecipe() {
    setStatus("Print dialog opened.");
    window.print();
  }

  function addToMealPlan() {
    if (!window.localStorage) {
      setStatus("Meal plan storage is not available in this browser.");
      return;
    }
    var item = {
      slug: recipe.slug,
      name: recipe.name,
      country_name: recipe.country_name,
      country_code: recipe.country_code,
      category: recipe.category,
      servings: state.servings,
      url: window.location.pathname,
      added_at: new Date().toISOString()
    };
    try {
      var plan = JSON.parse(window.localStorage.getItem(mealPlanKey) || "[]");
      plan = Array.isArray(plan) ? plan.filter(function (entry) { return entry && entry.slug !== item.slug; }) : [];
      plan.unshift(item);
      plan = plan.slice(0, 21);
      window.localStorage.setItem(mealPlanKey, JSON.stringify(plan));
      setStatus("Added to this browser's AfroKitchen meal plan.");
    } catch (error) {
      setStatus("Could not save this recipe to the meal plan.");
    }
  }

  function buildRecipeText() {
    var lines = [
      recipe.name,
      recipe.country_name + (recipe.region ? " | " + recipe.region : ""),
      "Servings: " + state.servings + " " + (recipe.serving_unit || "servings"),
      "Time: " + ((recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0) || recipe.total_time_minutes || 0) + " minutes",
      "",
      recipe.description || "",
      ""
    ];
    var scaled = scaleIngredients();
    lines.push("Ingredients");
    var group = "";
    scaled.forEach(function (ingredient) {
      if (ingredient.group_name && ingredient.group_name !== group) {
        group = ingredient.group_name;
        lines.push("");
        lines.push(group + ":");
      }
      lines.push("- " + plainIngredientLine(ingredient));
    });
    lines.push("");
    lines.push("Method");
    (recipe.steps || []).forEach(function (step) {
      lines.push((step.step_number || "") + ". " + (step.title || "Step"));
      lines.push(step.instruction || "");
      if (step.timer_seconds) lines.push("Timer: " + engine.formatTime(step.timer_seconds));
      if (step.tip) lines.push("Tip: " + step.tip);
      lines.push("");
    });
    if (recipe.chef_notes && recipe.chef_notes.serve_with) {
      lines.push("Serve with: " + recipe.chef_notes.serve_with);
    } else if (recipe.best_served_with) {
      lines.push("Serve with: " + recipe.best_served_with);
    }
    lines.push("");
    lines.push("Source: " + window.location.href);
    return lines.join("\n").replace(/\n{3,}/g, "\n\n");
  }

  function plainIngredientLine(ingredient) {
    var amount = Number(ingredient.scaled_amount || 0) > 0
      ? engine.formatAmount(ingredient.scaled_amount) + (ingredient.unit ? " " + ingredient.unit : "") + " "
      : "";
    return amount + (ingredient.name || "") +
      (ingredient.prep_note ? ", " + ingredient.prep_note : "") +
      (ingredient.is_optional ? " (optional)" : "") +
      (ingredient.substitution ? " | Substitution: " + ingredient.substitution : "");
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return fallbackCopyText(text);
      });
    }
    return fallbackCopyText(text);
  }

  function fallbackCopyText(text) {
    return new Promise(function (resolve, reject) {
      try {
        var textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  function scaleIngredients() {
    return engine.scaleIngredients(recipe.ingredients || [], recipe.default_servings || 1, state.servings);
  }

  function nutritionCard(label, value) {
    return '<div class="ak-nutrition-card"><span>' + escapeHtml(label) + "</span><strong>" + escapeHtml(value) + "</strong></div>";
  }

  function valueWithUnit(value, unit) {
    return String(value || 0) + unit;
  }

  function ingredientKey(ingredient, index) {
    return String(ingredient.id || ingredient.sort_order || index) + "|" + String(ingredient.name || "");
  }

  function timerKey(step) {
    return String(step.step_number);
  }

  function updateServingHelper() {
    var helper = document.querySelector(".ak-ingredients-panel .ak-panel-helper");
    if (helper) helper.textContent = "For " + state.servings + " " + (recipe.serving_unit || "servings");
  }

  function setStatus(message) {
    setText("ak-static-action-status", message);
  }

  function setText(id, value) {
    var element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function clamp(value, min, max) {
    value = Number.isFinite(value) ? value : min;
    return Math.max(min, Math.min(max, value));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
}(window, document);
