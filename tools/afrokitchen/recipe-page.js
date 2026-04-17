var AKPage = (function () {
  'use strict';

  var AK = AfroKitchenEngine;
  var AKImages = window.AfroKitchenImages;
  var AKRoutes = window.AfroKitchenStaticRoutes || {
    recipe: function (slug) {
      return '/tools/afrokitchen/recipes/' + encodeURIComponent(slug) + '/';
    }
  };

  var recipe = null;
  var servings = 6;
  var cookingStep = 0;
  var cookingTimerId = null;
  var reviewRating = 0;
  var advisorMessages = [];
  var timerIds = {};
  var utilityFeedbackTimer = null;
  var community = {
    reviews: [],
    cooksnaps: [],
    reviewCount: 0,
    averageRating: null
  };

  var categoryLabels = {
    main: 'Main dish',
    soup_stew: 'Soup or stew',
    rice: 'Rice dish',
    snack: 'Snack',
    dessert: 'Dessert',
    drink: 'Drink',
    breakfast: 'Breakfast',
    side: 'Side',
    street_food: 'Street food',
    starter: 'Starter'
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function upsertHeadTag(selector, tagName, attributes) {
    var node = document.querySelector(selector);
    if (!node) {
      node = document.createElement(tagName);
      Object.keys(attributes).forEach(function (name) {
        if (name === 'content') return;
        node.setAttribute(name, attributes[name]);
      });
      document.head.appendChild(node);
    }

    if (Object.prototype.hasOwnProperty.call(attributes, 'content')) {
      node.setAttribute('content', attributes.content);
    }

    return node;
  }

  function syncPreferredUrlMetadata(url) {
    if (!url) return;

    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = url;

    upsertHeadTag('meta[property="og:url"]', 'meta', {
      property: 'og:url',
      content: url
    });
  }

  function slugify(value) {
    return normalizeText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
  }

  function sanitizeCountryCode(value) {
    var code = String(value || '').trim().toUpperCase();
    return AK.COUNTRIES[code] ? code : '';
  }

  function formatCountry(code) {
    var safeCode = sanitizeCountryCode(code);
    if (!safeCode) return '';
    var country = AK.COUNTRIES[safeCode];
    return (country.flag ? country.flag + ' ' : '') + country.name;
  }

  function formatDate(value) {
    if (!value) return '';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function pluralize(count, singular, plural) {
    return count === 1 ? singular : (plural || singular + 's');
  }

  function safeDifficulty(value) {
    var diff = normalizeText(value);
    return diff ? diff.charAt(0).toUpperCase() + diff.slice(1) : 'Unknown';
  }

  function readCommunityRating() {
    if (community.averageRating) return community.averageRating;
    return recipe && recipe.avg_rating ? recipe.avg_rating : null;
  }

  function readCommunityReviewCount() {
    if (community.reviewCount) return community.reviewCount;
    return recipe && recipe.review_count ? recipe.review_count : 0;
  }

  function getCommunityReviews() {
    if (community.reviews && community.reviews.length) return community.reviews;
    return (recipe && recipe.reviews) || [];
  }

  function setFormFeedback(id, message, kind) {
    var el = byId(id);
    if (!el) return;
    el.textContent = message || '';
    el.className = 'ak-form-feedback' + (kind ? ' is-' + kind : '');
  }

  function showUtilityFeedback(message, kind) {
    var el = byId('utility-feedback');
    if (!el) return;
    clearTimeout(utilityFeedbackTimer);
    el.textContent = message || '';
    el.className = 'ak-utility-feedback' + (kind ? ' is-' + kind : '');
    if (!message) return;
    utilityFeedbackTimer = setTimeout(function () {
      el.textContent = '';
      el.className = 'ak-utility-feedback';
    }, 3200);
  }

  function toggleButton(id, busy, busyLabel, idleLabel) {
    var button = byId(id);
    if (!button) return;
    button.disabled = !!busy;
    button.textContent = busy ? busyLabel : idleLabel;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      try {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async function fetchJson(url, options) {
    var response = await fetch(url, options);
    var data = null;
    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }
    if (!response.ok) {
      throw new Error((data && (data.error || data.message)) || ('Request failed with ' + response.status));
    }
    return data;
  }

  async function loadRecipe(slug) {
    var loaded = await AK.fetchRecipeBySlug(slug);

    if (!loaded) {
      await new Promise(function (resolve) {
        setTimeout(resolve, 1200);
      });
      loaded = await AK.fetchRecipeBySlug(slug);
    }

    if (!loaded) {
      try {
        loaded = await fetchJson('/.netlify/functions/afrokitchen-recipes?action=get&slug=' + encodeURIComponent(slug));
      } catch (error) {
        loaded = null;
      }
    }

    if (!loaded || !loaded.id) return null;
    loaded.ingredients = loaded.ingredients || [];
    loaded.steps = loaded.steps || [];
    loaded.reviews = loaded.reviews || [];
    loaded.default_servings = loaded.default_servings || 4;
    return loaded;
  }

  function fillCountrySelect(id, codes, selectedCode, includePrompt) {
    var select = byId(id);
    if (!select) return;
    select.innerHTML = '';

    if (includePrompt) {
      var prompt = document.createElement('option');
      prompt.value = '';
      prompt.textContent = 'Country';
      select.appendChild(prompt);
    }

    codes.forEach(function (code) {
      var option = document.createElement('option');
      option.value = code;
      option.textContent = AK.COUNTRIES[code].flag + ' ' + AK.COUNTRIES[code].name;
      if (code === selectedCode) option.selected = true;
      select.appendChild(option);
    });
  }

  function populateCountrySelects() {
    var codes = Object.keys(AK.COUNTRIES).sort(function (a, b) {
      return AK.COUNTRIES[a].name.localeCompare(AK.COUNTRIES[b].name);
    });

    fillCountrySelect('cost-country', codes, recipe.country_code, false);
    fillCountrySelect('review-country', codes, recipe.country_code, true);
    fillCountrySelect('cook-country', codes, recipe.country_code, true);
  }

  function bindFormEvents() {
    var advisorInput = byId('advisor-input');
    if (advisorInput) {
      advisorInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') askAdvisor();
      });
    }

    var photoInput = byId('cook-photo');
    if (photoInput) {
      photoInput.addEventListener('change', previewCooksnapFile);
    }
  }

  async function init() {
    var params = new URLSearchParams(window.location.search);
    var slug = params.get('slug') || params.get('id');
    if (!slug) { show404(); return; }

    recipe = await loadRecipe(slug);
    if (!recipe) { show404(); return; }

    servings = recipe.default_servings;
    document.title = recipe.name + ' - AfroKitchen | AfroTools';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = recipe.description || 'Authentic African recipe from AfroKitchen.';

    syncPreferredUrlMetadata(window.location.origin + AKRoutes.recipe(recipe.slug));

    var schema = AK.getStructuredData(recipe, servings);
    byId('recipe-schema').textContent = JSON.stringify(schema);

    populateCountrySelects();
    bindFormEvents();
    renderHero();
    renderIngredients();
    renderSteps();
    renderStory();
    renderNutrition();
    renderAdvisorSuggestions();
    renderReviewStars();
    renderCommunityStats();
    renderReviews();
    renderCooksnaps();

    byId('recipe-loading').style.display = 'none';
    byId('recipe-content').style.display = '';

    updateCost();
    loadCommunity();
    loadRelated();
  }

  function show404() {
    byId('recipe-loading').style.display = 'none';
    byId('recipe-404').style.display = '';
  }

  function buildMetaPill(label, value) {
    return '<span><small>' + escapeHtml(label) + '</small><strong>' + escapeHtml(value) + '</strong></span>';
  }

  function renderHero() {
    var hero = byId('recipe-hero');
    var country = AK.COUNTRIES[recipe.country_code] || {};
    var totalMin = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
    var rating = readCommunityRating();
    var reviewCount = readCommunityReviewCount();
    var localName = normalizeText(recipe.name_local);
    var localNameEl = byId('hero-local-name');
    var creditEl = byId('recipe-hero-credit');

    hero.style.background = '#1A1008';
    AKImages.applyHeroBackground(hero, recipe, '#1A1008');
    byId('hero-breadcrumb').textContent = recipe.name;
    byId('hero-title').textContent = recipe.name;
    byId('hero-desc').textContent = recipe.description || '';

    if (localName && localName.toLowerCase() !== normalizeText(recipe.name).toLowerCase()) {
      localNameEl.textContent = localName;
      localNameEl.style.display = '';
    } else {
      localNameEl.textContent = '';
      localNameEl.style.display = 'none';
    }

    byId('hero-meta').innerHTML =
      buildMetaPill('Country', (country.flag || '') + ' ' + (recipe.country_name || country.name || 'African kitchen')) +
      buildMetaPill('Time', totalMin + ' min') +
      buildMetaPill('Serves', String(recipe.default_servings)) +
      buildMetaPill('Level', safeDifficulty(recipe.difficulty)) +
      buildMetaPill('Trust', recipe.is_verified ? 'Verified recipe' : 'Community recipe') +
      buildMetaPill('Community', rating ? (buildRatingStars(rating) + ' ' + rating + ' (' + reviewCount + ')') : 'No reviews yet');

    creditEl.textContent = '';
    creditEl.style.display = 'none';
    renderTrustBand();
  }

  function renderTrustBand() {
    var trustGrid = byId('trust-grid');
    var trustCopy = byId('trust-copy');
    var cards = [];
    var timerSteps = (recipe.steps || []).filter(function (step) {
      return !!step.timer_seconds;
    }).length;
    var reviewCount = readCommunityReviewCount();
    var photoCount = (community.cooksnaps || []).length;
    var completeness = 0;

    if (recipe.is_verified) completeness += 1;
    if (recipe.story) completeness += 1;
    if (recipe.best_served_with) completeness += 1;
    if (timerSteps) completeness += 1;
    if (reviewCount || photoCount) completeness += 1;

    cards.push({
      title: recipe.is_verified ? 'Verified foundation' : 'Published foundation',
      body: recipe.is_verified
        ? 'This recipe is marked verified in AfroKitchen and already has complete cooking steps.'
        : 'This recipe is published, but community proof will make it even stronger.'
    });
    cards.push({
      title: 'Cultural context',
      body: recipe.story
        ? 'Includes origin and context for ' + (recipe.country_name || 'this dish') + ', so the recipe feels rooted instead of generic.'
        : 'The next upgrade here is more story and context around how this dish is traditionally served.'
    });
    cards.push({
      title: 'Cook guidance',
      body: timerSteps
        ? timerSteps + ' timed ' + pluralize(timerSteps, 'step') + ' across ' + recipe.steps.length + ' total steps make this easier to cook in real time.'
        : recipe.steps.length + ' clear steps are published, but timers would make guided cooking even stronger.'
    });
    cards.push({
      title: recipe.best_served_with ? 'Serve it with' : 'Pairing opportunity',
      body: recipe.best_served_with
        ? recipe.best_served_with
        : 'Adding serving pairings will help this feel more complete for families planning a meal.'
    });
    cards.push({
      title: reviewCount || photoCount ? 'Community proof' : 'Community unlock',
      body: reviewCount || photoCount
        ? reviewCount + ' review' + (reviewCount === 1 ? '' : 's') + ' and ' + photoCount + ' cook photo' + (photoCount === 1 ? '' : 's') + ' are starting to validate the recipe in real kitchens.'
        : 'Ratings, modification notes, and cook photos are now wired in so this recipe can keep improving after publish.'
    });

    trustGrid.innerHTML = cards.map(function (card) {
      return '<article class="ak-trust-card"><div class="ak-trust-card-title">' + escapeHtml(card.title) + '</div><p>' + escapeHtml(card.body) + '</p></article>';
    }).join('');

    trustCopy.textContent = 'This recipe scores ' + completeness + '/5 on completeness right now: strong publishing basics, with the biggest upside coming from visible community proof and more local photos.';
  }

  function renderIngredients() {
    var ingredients = AK.scaleIngredients(recipe.ingredients || [], recipe.default_servings, servings);
    var list = byId('ingredients-list');
    var currentGroup = '';

    list.innerHTML = '';
    byId('servings-val').textContent = servings;

    ingredients.forEach(function (ingredient) {
      if (ingredient.group_name && ingredient.group_name !== currentGroup) {
        currentGroup = ingredient.group_name;
        var groupEl = document.createElement('div');
        groupEl.className = 'ak-ing-group';
        groupEl.textContent = currentGroup;
        list.appendChild(groupEl);
      }

      var item = document.createElement('label');
      item.className = 'ak-ing-item';
      item.innerHTML =
        '<input type="checkbox" class="ak-ing-check">' +
        '<span class="ak-ing-text">' +
          '<span class="ak-ing-amount">' + escapeHtml(AK.formatAmount(ingredient.scaled_amount) + ' ' + ingredient.unit) + '</span> ' +
          escapeHtml(ingredient.name) +
          (ingredient.prep_note ? ', <em>' + escapeHtml(ingredient.prep_note) + '</em>' : '') +
          (ingredient.is_optional ? ' <span class="ak-ing-optional">(optional)</span>' : '') +
          (ingredient.substitution ? ' <span class="ak-ing-optional">[Sub: ' + escapeHtml(ingredient.substitution) + ']</span>' : '') +
        '</span>';
      list.appendChild(item);
    });
  }

  function renderSteps() {
    var list = byId('steps-list');
    var steps = recipe.steps || [];
    list.innerHTML = '';

    steps.forEach(function (step) {
      var card = document.createElement('div');
      card.className = 'ak-step';
      card.id = 'step-' + step.step_number;

      var html =
        '<div class="ak-step-header">' +
          '<div class="ak-step-num">' + escapeHtml(step.step_number) + '</div>' +
          '<div class="ak-step-title">' + escapeHtml(step.title) + '</div>' +
        '</div>' +
        '<div class="ak-step-text">' + escapeHtml(step.instruction) + '</div>';

      if (step.tip) {
        html += '<div class="ak-step-tip">' + escapeHtml(step.tip) + '</div>';
      }

      if (step.timer_seconds) {
        html +=
          '<div class="ak-timer" id="timer-wrap-' + step.step_number + '">' +
            '<span class="ak-timer-label">' + escapeHtml(step.timer_label || 'Timer') + '</span>' +
            '<span class="ak-timer-display" id="timer-display-' + step.step_number + '">' + escapeHtml(AK.formatTime(step.timer_seconds)) + '</span>' +
            '<div class="ak-timer-bar"><div class="ak-timer-bar-fill" id="timer-bar-' + step.step_number + '" style="width:100%"></div></div>' +
            '<button class="ak-timer-btn" id="timer-start-' + step.step_number + '" onclick="AKPage.toggleTimer(' + step.step_number + ',' + step.timer_seconds + ')">Start</button>' +
            '<button class="ak-timer-btn" onclick="AKPage.resetTimerStep(' + step.step_number + ',' + step.timer_seconds + ')">Reset</button>' +
          '</div>';
      }

      card.innerHTML = html;
      list.appendChild(card);
    });
  }

  function toggleTimer(stepNum, totalSeconds) {
    var key = 'step_' + stepNum;
    if (timerIds[key]) {
      var current = AK.getTimer(timerIds[key]);
      if (current && current.running) {
        AK.pauseTimer(timerIds[key]);
        byId('timer-start-' + stepNum).textContent = 'Resume';
        return;
      }
      if (current && current.remaining > 0) {
        AK.startTimer(timerIds[key]);
        byId('timer-start-' + stepNum).textContent = 'Pause';
        return;
      }
    }

    timerIds[key] = AK.createTimer(
      totalSeconds,
      'Step ' + stepNum,
      function (timer) {
        byId('timer-display-' + stepNum).textContent = AK.formatTime(timer.remaining);
        byId('timer-bar-' + stepNum).style.width = ((timer.remaining / timer.totalSeconds) * 100) + '%';
      },
      function () {
        byId('timer-start-' + stepNum).textContent = 'Done!';
        byId('timer-display-' + stepNum).textContent = '00:00';
      }
    );

    AK.startTimer(timerIds[key]);
    byId('timer-start-' + stepNum).textContent = 'Pause';
  }

  function resetTimerStep(stepNum, totalSeconds) {
    var key = 'step_' + stepNum;
    if (timerIds[key]) AK.resetTimer(timerIds[key]);
    byId('timer-display-' + stepNum).textContent = AK.formatTime(totalSeconds);
    byId('timer-bar-' + stepNum).style.width = '100%';
    byId('timer-start-' + stepNum).textContent = 'Start';
  }

  function adjustServings(delta) {
    var nextValue = servings + delta;
    if (nextValue < 1 || nextValue > 50) return;
    servings = nextValue;
    renderIngredients();
    renderNutrition();
    updateCost();
  }

  async function updateCost() {
    var countryCode = byId('cost-country').value;
    if (!countryCode || !recipe.id) return;

    try {
      var prices = await AK.fetchIngredientPrices(recipe.id, countryCode);
      if (!prices || !prices.length) {
        byId('cost-panel').style.display = 'none';
        return;
      }

      var cost = AK.calculateRecipeCost(recipe.ingredients || [], recipe.default_servings, servings, prices, countryCode);
      byId('cost-total').textContent = cost.symbol + cost.totalCost.toLocaleString();
      byId('cost-per').textContent = cost.symbol + cost.costPerServing.toLocaleString() + ' per serving (' + servings + ' servings)';
      byId('cost-note').textContent = cost.note;
      byId('cost-panel').style.display = '';
    } catch (error) {
      byId('cost-panel').style.display = 'none';
    }
  }

  function renderStory() {
    var section = byId('story-section');
    var storyText = byId('story-text');
    var servedWith = byId('served-with');
    var variations = byId('variations');

    if (recipe.story) {
      section.style.display = '';
      storyText.innerHTML = '<p>' + escapeHtml(recipe.story).replace(/\n\n/g, '</p><p>') + '</p>';
    } else {
      section.style.display = 'none';
    }

    if (recipe.best_served_with) {
      servedWith.style.display = '';
      servedWith.innerHTML = '<strong>Best served with:</strong> ' + escapeHtml(recipe.best_served_with);
    } else {
      servedWith.style.display = 'none';
      servedWith.innerHTML = '';
    }

    if (recipe.regional_variations) {
      variations.style.display = '';
      variations.innerHTML = '<strong>Regional variations:</strong> ' + escapeHtml(recipe.regional_variations);
    } else {
      variations.style.display = 'none';
      variations.innerHTML = '';
    }
  }

  function renderNutrition() {
    if (!recipe.calories) return;

    var grid = byId('nutrition-grid');
    var items = [
      { label: 'Calories', value: recipe.calories, unit: '' },
      { label: 'Protein', value: recipe.protein_g, unit: 'g' },
      { label: 'Carbs', value: recipe.carbs_g, unit: 'g' },
      { label: 'Fat', value: recipe.fat_g, unit: 'g' },
      { label: 'Fiber', value: recipe.fiber_g, unit: 'g' }
    ];

    byId('nutrition-section').style.display = '';
    grid.innerHTML = items.map(function (item) {
      return '<div class="ak-nutrition-item"><div class="ak-nutrition-val">' + escapeHtml((item.value || 0) + item.unit) + '</div><div class="ak-nutrition-label">' + escapeHtml(item.label) + '</div></div>';
    }).join('');
  }

  function buildStatCard(label, value) {
    return '<article class="ak-community-stat"><div class="ak-community-stat-label">' + escapeHtml(label) + '</div><div class="ak-community-stat-value">' + escapeHtml(value) + '</div></article>';
  }

  function renderCommunityStats() {
    var stats = byId('community-stats');
    var rating = readCommunityRating();
    var reviewCount = readCommunityReviewCount();
    var cooksnapCount = (community.cooksnaps || []).length;
    var timerSteps = (recipe.steps || []).filter(function (step) {
      return !!step.timer_seconds;
    }).length;
    var totalMinutes = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

    stats.innerHTML =
      buildStatCard('Rating', rating ? (rating + ' / 5') : 'New') +
      buildStatCard('Reviews', String(reviewCount)) +
      buildStatCard('Cook photos', String(cooksnapCount)) +
      buildStatCard('Timed steps', String(timerSteps)) +
      buildStatCard('Total cook time', totalMinutes + ' min');
  }

  function renderReviews() {
    var reviews = getCommunityReviews();
    var summary = byId('reviews-summary');
    var list = byId('reviews-list');
    var rating = readCommunityRating();
    var reviewCount = readCommunityReviewCount();

    if (rating) {
      summary.innerHTML =
        '<div class="ak-star-rating">' + buildRatingStars(rating) + '</div>' +
        '<span><strong>' + escapeHtml(rating) + '</strong></span>' +
        '<span class="ak-section-annotation">(' + reviewCount + ' ' + pluralize(reviewCount, 'rating') + ')</span>';
    } else {
      summary.innerHTML = '<span class="ak-section-annotation">No reviews yet. The first helpful review sets the tone for the whole recipe.</span>';
    }

    list.innerHTML = '';
    if (!reviews.length) {
      list.innerHTML = '<div class="ak-community-empty-card">No written reviews yet. Share how it turned out, what you changed, or what pairing worked well.</div>';
      return;
    }

    reviews.slice(0, 12).forEach(function (entry) {
      var card = document.createElement('article');
      card.className = 'ak-review-card';

      var header = document.createElement('div');
      header.className = 'ak-review-header';
      header.innerHTML =
        '<div><div class="ak-review-author">' + escapeHtml(entry.author_name || 'Anonymous cook') + '</div><div class="ak-star-rating">' + buildRatingStars(entry.rating || 0) + '</div></div>' +
        '<div class="ak-review-meta">' +
          (entry.country_code ? '<span class="ak-review-chip">' + escapeHtml(formatCountry(entry.country_code)) + '</span>' : '') +
          (entry.created_at ? '<span class="ak-review-date">' + escapeHtml(formatDate(entry.created_at)) + '</span>' : '') +
        '</div>';
      card.appendChild(header);

      if (entry.comment) {
        var text = document.createElement('div');
        text.className = 'ak-review-text';
        text.textContent = entry.comment;
        card.appendChild(text);
      }

      if (entry.modifications) {
        var mods = document.createElement('div');
        mods.className = 'ak-review-modifications';
        mods.textContent = 'Changed: ' + entry.modifications;
        card.appendChild(mods);
      }

      list.appendChild(card);
    });
  }

  function renderReviewStars() {
    var container = byId('review-stars');
    container.innerHTML = '';

    for (var index = 1; index <= 5; index += 1) {
      (function (rating) {
        var button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', 'Rate ' + rating + ' star' + (rating === 1 ? '' : 's'));
        button.innerHTML = '&#9734;';
        button.addEventListener('click', function () {
          setReviewRating(rating);
        });
        container.appendChild(button);
      })(index);
    }
  }

  function setReviewRating(rating) {
    reviewRating = rating;
    Array.prototype.forEach.call(byId('review-stars').querySelectorAll('button'), function (button, index) {
      var active = index < rating;
      button.classList.toggle('active', active);
      button.innerHTML = active ? '&#9733;' : '&#9734;';
    });
  }

  async function loadCommunity() {
    if (!recipe || !recipe.id) return;

    try {
      var payload = await fetchJson('/.netlify/functions/afrokitchen-community?recipeId=' + encodeURIComponent(recipe.id) + '&limit=12');
      var data = payload && payload.data ? payload.data : payload;

      community = {
        reviews: data.reviews || recipe.reviews || [],
        cooksnaps: data.cooksnaps || [],
        reviewCount: data.reviewCount || 0,
        averageRating: data.averageRating || null
      };
    } catch (error) {
      community = {
        reviews: recipe.reviews || [],
        cooksnaps: [],
        reviewCount: recipe.review_count || ((recipe.reviews || []).length),
        averageRating: recipe.avg_rating || null
      };
    }

    renderHero();
    renderCommunityStats();
    renderReviews();
    renderCooksnaps();
  }

  function renderCooksnaps() {
    var grid = byId('cooksnap-grid');
    var empty = byId('cooksnap-empty');
    var items = community.cooksnaps || [];

    grid.innerHTML = '';
    if (!items.length) {
      empty.style.display = '';
      return;
    }

    empty.style.display = 'none';
    items.slice(0, 8).forEach(function (item) {
      var card = document.createElement('article');
      card.className = 'ak-cooksnap-card';
      card.innerHTML =
        '<div class="ak-cooksnap-photo-wrap"><img class="ak-cooksnap-photo" src="' + escapeHtml(item.photoUrl) + '" alt="' + escapeHtml((item.authorName || 'Community cook') + ' made ' + recipe.name) + '" loading="lazy"></div>' +
        '<div class="ak-cooksnap-body">' +
          '<div class="ak-cooksnap-meta"><strong>' + escapeHtml(item.authorName || 'Community cook') + '</strong><span>' + escapeHtml(item.countryCode ? formatCountry(item.countryCode) : '') + '</span></div>' +
          (item.note ? '<p class="ak-cooksnap-note">' + escapeHtml(item.note) + '</p>' : '') +
          (item.createdAt ? '<div class="ak-review-date">' + escapeHtml(formatDate(item.createdAt)) + '</div>' : '') +
        '</div>';
      grid.appendChild(card);
    });
  }

  async function submitReview() {
    if (!recipe || !recipe.id) return;
    if (!reviewRating) {
      setFormFeedback('review-feedback', 'Choose a star rating first.', 'error');
      return;
    }

    var comment = normalizeText(byId('review-comment').value);
    var authorName = normalizeText(byId('review-name').value) || 'Anonymous cook';
    var modifications = normalizeText(byId('review-modifications').value);
    var countryCode = sanitizeCountryCode(byId('review-country').value);

    if (comment.length > 700) {
      setFormFeedback('review-feedback', 'Keep the review under 700 characters.', 'error');
      return;
    }

    if (modifications.length > 180) {
      setFormFeedback('review-feedback', 'Keep the modifications note under 180 characters.', 'error');
      return;
    }

    try {
      toggleButton('review-submit-btn', true, 'Submitting...', 'Submit review');
      setFormFeedback('review-feedback', 'Sending your review...', 'info');

      await fetchJson('/.netlify/functions/afrokitchen-community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'review',
          recipeId: recipe.id,
          rating: reviewRating,
          comment: comment,
          authorName: authorName,
          countryCode: countryCode,
          modifications: modifications
        })
      });

      byId('review-comment').value = '';
      byId('review-name').value = '';
      byId('review-modifications').value = '';
      if (byId('review-country').options.length) byId('review-country').value = recipe.country_code || '';
      setReviewRating(0);
      setFormFeedback('review-feedback', 'Review submitted. It is now live on this recipe page.', 'success');
      showUtilityFeedback('Review submitted and added to the recipe.', 'success');
      await loadCommunity();
    } catch (error) {
      setFormFeedback('review-feedback', error.message || 'Could not submit review right now.', 'error');
    } finally {
      toggleButton('review-submit-btn', false, 'Submitting...', 'Submit review');
    }
  }

  function previewCooksnapFile() {
    var input = byId('cook-photo');
    var preview = byId('cook-photo-preview');
    var file = input && input.files ? input.files[0] : null;

    preview.innerHTML = '';
    preview.style.display = 'none';
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (event) {
      preview.innerHTML = '<img src="' + escapeHtml(event.target.result) + '" alt="Selected cook photo preview">';
      preview.style.display = '';
    };
    reader.readAsDataURL(file);
  }

  function compressImageToWebp(file) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        reject(new Error('Choose a photo before sharing your cook.'));
        return;
      }

      var reader = new FileReader();
      reader.onload = function (event) {
        var img = new Image();
        img.onload = function () {
          var width = img.width;
          var height = img.height;
          var maxSize = 1440;

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round(height * (maxSize / width));
              width = maxSize;
            } else {
              width = Math.round(width * (maxSize / height));
              height = maxSize;
            }
          }

          var canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          resolve({
            dataUrl: canvas.toDataURL('image/webp', 0.84),
            fileName: (slugify(file.name.replace(/\.[^.]+$/, '')) || 'cook') + '.webp'
          });
        };
        img.onerror = function () {
          reject(new Error('That image could not be processed.'));
        };
        img.src = event.target.result;
      };
      reader.onerror = function () {
        reject(new Error('Could not read that image file.'));
      };
      reader.readAsDataURL(file);
    });
  }

  async function submitCooksnap() {
    if (!recipe || !recipe.id) return;

    var input = byId('cook-photo');
    var file = input && input.files ? input.files[0] : null;
    var note = normalizeText(byId('cook-note').value);
    var authorName = normalizeText(byId('cook-name').value) || 'Community cook';
    var countryCode = sanitizeCountryCode(byId('cook-country').value);

    if (!file) {
      setFormFeedback('cook-feedback', 'Choose a photo first.', 'error');
      return;
    }

    if (note.length > 320) {
      setFormFeedback('cook-feedback', 'Keep the caption under 320 characters.', 'error');
      return;
    }

    try {
      toggleButton('cook-submit-btn', true, 'Uploading...', 'Share my cook');
      setFormFeedback('cook-feedback', 'Compressing and uploading your photo...', 'info');

      var compressed = await compressImageToWebp(file);
      await fetchJson('/.netlify/functions/afrokitchen-community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'cooksnap',
          recipeId: recipe.id,
          authorName: authorName,
          countryCode: countryCode,
          note: note,
          photoName: compressed.fileName,
          photoDataUrl: compressed.dataUrl
        })
      });

      byId('cook-note').value = '';
      byId('cook-name').value = '';
      byId('cook-photo').value = '';
      byId('cook-photo-preview').innerHTML = '';
      byId('cook-photo-preview').style.display = 'none';
      if (byId('cook-country').options.length) byId('cook-country').value = recipe.country_code || '';
      setFormFeedback('cook-feedback', 'Photo uploaded. Your cook is now visible in the community kitchen.', 'success');
      showUtilityFeedback('Cook photo uploaded to the recipe.', 'success');
      await loadCommunity();
    } catch (error) {
      setFormFeedback('cook-feedback', error.message || 'Could not upload that cook photo right now.', 'error');
    } finally {
      toggleButton('cook-submit-btn', false, 'Uploading...', 'Share my cook');
    }
  }

  function renderAdvisorSuggestions() {
    var ingredients = recipe.ingredients || [];
    var anchorIngredient = ingredients[3] || ingredients[0] || { name: 'this ingredient' };
    var suggestions = [
      'What can I substitute for ' + anchorIngredient.name + '?',
      'Make this less spicy',
      'How do I cook this for 20 people?',
      'What drink pairs with this?',
      'Can I make this ahead of time?'
    ];
    var container = byId('advisor-suggestions');

    container.innerHTML = '';
    suggestions.forEach(function (suggestion) {
      var button = document.createElement('button');
      button.className = 'ak-advisor-suggestion';
      button.type = 'button';
      button.textContent = suggestion;
      button.addEventListener('click', function () {
        byId('advisor-input').value = suggestion;
        askAdvisor();
      });
      container.appendChild(button);
    });
  }

  async function askAdvisor() {
    var input = byId('advisor-input');
    var question = normalizeText(input.value);
    if (!question) return;

    input.value = '';
    advisorMessages.push({ role: 'user', content: question });
    renderAdvisorMessages();

    try {
      var payload = await fetchJson('/.netlify/functions/ai-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool: 'afrokitchen',
          message: question,
          messages: advisorMessages,
          context: JSON.stringify({
            recipe_name: recipe.name,
            country: recipe.country_name,
            servings: servings,
            ingredients: (recipe.ingredients || []).map(function (item) {
              return item.name;
            }),
            difficulty: recipe.difficulty
          })
        })
      });

      var reply = payload.reply || payload.text || 'Sorry, I could not generate a response.';
      advisorMessages.push({ role: 'assistant', content: reply });
    } catch (error) {
      advisorMessages.push({
        role: 'assistant',
        content: 'Unable to reach the AI advisor right now. Try again in a moment.'
      });
    }

    renderAdvisorMessages();
  }

  function renderAdvisorMessages() {
    var container = byId('advisor-messages');
    container.innerHTML = '';

    advisorMessages.forEach(function (message) {
      var bubble = document.createElement('div');
      bubble.className = 'ak-advisor-msg ' + (message.role === 'user' ? 'user' : 'ai');
      bubble.textContent = message.content;
      container.appendChild(bubble);
    });

    container.scrollTop = container.scrollHeight;
  }

  function buildRatingStars(rating) {
    var rounded = Math.round(Number(rating) || 0);
    var stars = '';
    for (var index = 1; index <= 5; index += 1) {
      stars += index <= rounded ? '\u2605' : '\u2606';
    }
    return stars;
  }

  function buildThumbMarkup(entry) {
    return AKImages.createCardSlotMarkup(entry, {
      label: categoryLabels[entry.category] || 'AfroKitchen',
      title: entry.name,
      alt: entry.image_alt || entry.name
    });
  }

  async function loadRelated() {
    var related = [];
    var seen = {};
    var grid = byId('related-grid');

    try {
      var primary = await AK.fetchRecipes({ country: recipe.country_code, limit: 6 });
      related = related.concat(primary || []);

      if (related.length < 4 && recipe.region) {
        var secondary = await AK.fetchRecipes({ region: recipe.region, limit: 6 });
        related = related.concat(secondary || []);
      }
    } catch (error) {
      related = [];
    }

    grid.innerHTML = '';
    related
      .filter(function (entry) {
        if (!entry || !entry.slug || entry.slug === recipe.slug || seen[entry.slug]) return false;
        seen[entry.slug] = true;
        return true;
      })
      .slice(0, 3)
      .forEach(function (entry) {
        var card = document.createElement('a');
        var totalMinutes = (entry.prep_time_minutes || 0) + (entry.cook_time_minutes || 0);

        card.className = 'ak-recipe-card';
        card.href = AKRoutes.recipe(entry.slug);
        card.innerHTML =
          buildThumbMarkup(entry) +
          '<div class="ak-recipe-card-body">' +
            '<div class="ak-recipe-card-flag">' + escapeHtml(entry.country_name || recipe.country_name || 'AfroKitchen') + '</div>' +
            '<h3 class="ak-recipe-card-title">' + escapeHtml(entry.name) + '</h3>' +
            '<div class="ak-recipe-card-meta"><span><small>Time</small><strong>' + escapeHtml(totalMinutes + ' min') + '</strong></span></div>' +
          '</div>';

        AKImages.hydrate(card);
        grid.appendChild(card);
      });
  }

  function startCookingMode() {
    cookingStep = 0;
    byId('cooking-recipe-name').textContent = recipe.name;
    byId('cooking-mode').classList.add('active');
    document.body.style.overflow = 'hidden';
    renderCookingStep();
  }

  function exitCookingMode() {
    byId('cooking-mode').classList.remove('active');
    document.body.style.overflow = '';
  }

  function renderCookingStep() {
    var steps = recipe.steps || [];
    if (!steps.length) return;
    if (cookingStep < 0) cookingStep = 0;
    if (cookingStep >= steps.length) cookingStep = steps.length - 1;

    var step = steps[cookingStep];
    var html =
      '<div class="ak-cooking-step-num">Step ' + escapeHtml(step.step_number) + ' of ' + steps.length + '</div>' +
      '<div class="ak-cooking-title">' + escapeHtml(step.title) + '</div>' +
      '<div class="ak-cooking-instruction">' + escapeHtml(step.instruction) + '</div>';

    if (step.timer_seconds) {
      html +=
        '<div class="ak-timer" style="margin-bottom:20px">' +
          '<span class="ak-timer-label">' + escapeHtml(step.timer_label || 'Timer') + '</span>' +
          '<span class="ak-timer-display" id="cooking-timer-display">' + escapeHtml(AK.formatTime(step.timer_seconds)) + '</span>' +
          '<div class="ak-timer-bar"><div class="ak-timer-bar-fill" id="cooking-timer-bar" style="width:100%"></div></div>' +
          '<button class="ak-timer-btn" id="cooking-timer-btn" onclick="AKPage.toggleCookingTimer(' + step.step_number + ',' + step.timer_seconds + ')">Start</button>' +
          '<button class="ak-timer-btn" onclick="AKPage.resetCookingTimer(' + step.timer_seconds + ')">Reset</button>' +
        '</div>';
    }

    if (step.tip) {
      html += '<div class="ak-cooking-tip">' + escapeHtml(step.tip) + '</div>';
    }

    byId('cooking-body').innerHTML = html;
  }

  function cookingNext() {
    cookingStep += 1;
    if (cookingStep >= (recipe.steps || []).length) {
      exitCookingMode();
      return;
    }
    renderCookingStep();
  }

  function cookingPrev() {
    cookingStep -= 1;
    renderCookingStep();
  }

  function toggleCookingTimer(stepNum, totalSeconds) {
    if (cookingTimerId) {
      var current = AK.getTimer(cookingTimerId);
      if (current && current.running) {
        AK.pauseTimer(cookingTimerId);
        byId('cooking-timer-btn').textContent = 'Resume';
        return;
      }
      if (current && current.remaining > 0) {
        AK.startTimer(cookingTimerId);
        byId('cooking-timer-btn').textContent = 'Pause';
        return;
      }
    }

    cookingTimerId = AK.createTimer(
      totalSeconds,
      'Cooking step ' + stepNum,
      function (timer) {
        var display = byId('cooking-timer-display');
        var bar = byId('cooking-timer-bar');
        if (display) display.textContent = AK.formatTime(timer.remaining);
        if (bar) bar.style.width = ((timer.remaining / timer.totalSeconds) * 100) + '%';
      },
      function () {
        var button = byId('cooking-timer-btn');
        if (button) button.textContent = 'Done!';
      }
    );

    AK.startTimer(cookingTimerId);
    byId('cooking-timer-btn').textContent = 'Pause';
  }

  function resetCookingTimer(totalSeconds) {
    if (cookingTimerId) AK.resetTimer(cookingTimerId);
    if (byId('cooking-timer-display')) byId('cooking-timer-display').textContent = AK.formatTime(totalSeconds);
    if (byId('cooking-timer-bar')) byId('cooking-timer-bar').style.width = '100%';
    if (byId('cooking-timer-btn')) byId('cooking-timer-btn').textContent = 'Start';
  }

  function getPreferredRecipeUrl() {
    return window.location.origin + AKRoutes.recipe(recipe.slug);
  }

  function getShoppingListText() {
    var ingredients = AK.scaleIngredients(recipe.ingredients || [], recipe.default_servings, servings);
    var lines = [recipe.name + ' shopping list', 'Servings: ' + servings, ''];
    var currentGroup = '';

    ingredients.forEach(function (ingredient) {
      if (ingredient.group_name && ingredient.group_name !== currentGroup) {
        currentGroup = ingredient.group_name;
        lines.push(currentGroup + ':');
      }
      lines.push('- ' + AK.formatAmount(ingredient.scaled_amount) + ' ' + ingredient.unit + ' ' + ingredient.name + (ingredient.prep_note ? ' (' + ingredient.prep_note + ')' : ''));
    });

    lines.push('');
    lines.push(getPreferredRecipeUrl());
    return lines.join('\n');
  }

  function shareRecipe() {
    if (!recipe) return;
    var url = getPreferredRecipeUrl();
    var text = recipe.name + ' - ' + recipe.description;

    if (navigator.share) {
      navigator.share({ title: recipe.name, text: text, url: url }).catch(function () {});
      return;
    }

    window.open('https://wa.me/?text=' + encodeURIComponent(text + '\n' + url), '_blank');
  }

  async function copyLink() {
    if (!recipe) return;
    try {
      await copyText(getPreferredRecipeUrl());
      showUtilityFeedback('Recipe link copied.', 'success');
    } catch (error) {
      showUtilityFeedback('Could not copy the recipe link.', 'error');
    }
  }

  async function copyShoppingList() {
    if (!recipe) return;
    try {
      await copyText(getShoppingListText());
      showUtilityFeedback('Shopping list copied.', 'success');
    } catch (error) {
      showUtilityFeedback('Could not copy the shopping list.', 'error');
    }
  }

  function shareIngredients() {
    if (!recipe) return;
    var shoppingList = getShoppingListText();

    if (navigator.share) {
      navigator.share({
        title: recipe.name + ' shopping list',
        text: shoppingList,
        url: getPreferredRecipeUrl()
      }).catch(function () {});
      return;
    }

    window.open('https://wa.me/?text=' + encodeURIComponent(shoppingList), '_blank');
  }

  function printRecipe() {
    if (!recipe) return;
    AK.printRecipe(recipe, servings);
  }

  document.addEventListener('keydown', function (event) {
    var cookingMode = byId('cooking-mode');
    if (!cookingMode || !cookingMode.classList.contains('active')) return;
    if (event.key === 'ArrowRight' || event.key === ' ') cookingNext();
    if (event.key === 'ArrowLeft') cookingPrev();
    if (event.key === 'Escape') exitCookingMode();
  });

  byId('cooking-mode').addEventListener('touchstart', function (event) {
    window.__akTouchStartX = event.touches[0].clientX;
    window.__akTouchStartY = event.touches[0].clientY;
  }, { passive: true });

  byId('cooking-mode').addEventListener('touchend', function (event) {
    var startX = window.__akTouchStartX || 0;
    var startY = window.__akTouchStartY || 0;
    var diffX = event.changedTouches[0].clientX - startX;
    var diffY = event.changedTouches[0].clientY - startY;

    if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX < 0) cookingNext();
      else cookingPrev();
    }
  }, { passive: true });

  init();

  return {
    adjustServings: adjustServings,
    askAdvisor: askAdvisor,
    copyLink: copyLink,
    copyShoppingList: copyShoppingList,
    cookingNext: cookingNext,
    cookingPrev: cookingPrev,
    exitCookingMode: exitCookingMode,
    print: printRecipe,
    resetCookingTimer: resetCookingTimer,
    resetTimerStep: resetTimerStep,
    share: shareRecipe,
    shareIngredients: shareIngredients,
    startCookingMode: startCookingMode,
    submitCooksnap: submitCooksnap,
    submitReview: submitReview,
    toggleCookingTimer: toggleCookingTimer,
    toggleTimer: toggleTimer,
    updateCost: updateCost
  };
})();
