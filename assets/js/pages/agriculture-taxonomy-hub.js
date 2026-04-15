(function () {
  'use strict';

  function createElement(tagName, className, text) {
    var element = document.createElement(tagName);
    if (className) element.className = className;
    if (typeof text === 'string') element.textContent = text;
    return element;
  }

  function slugLabel(slug) {
    return String(slug || '')
      .split('-')
      .filter(Boolean)
      .map(function (part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(' ');
  }

  function statusLabel(tool) {
    return tool.status === 'new' ? 'New' : 'Live';
  }

  function coverageLabel(tool) {
    if (!tool || !tool.countries) return 'Registry-backed';
    if (tool.countries.indexOf('ALL') !== -1) return 'Pan-African';
    return tool.countries.length === 1
      ? '1 country'
      : tool.countries.length + ' countries';
  }

  function familyLabel(tool, taxonomy) {
    return slugLabel(taxonomy.getToolFamilyKey(tool).replace(/^tools\//, ''));
  }

  function toolMatchesQuery(tool, query) {
    if (!query) return true;
    var values = [
      tool.id,
      tool.name,
      tool.desc,
      tool.href,
      familyLabel(tool, window.AfroToolsCategoryTaxonomy.agriculture)
    ];

    if (tool.tags && typeof tool.tags.join === 'function') {
      values.push(tool.tags.join(' '));
    }

    return values.join(' ').toLowerCase().indexOf(query) !== -1;
  }

  function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function renderStatValues(report) {
    var totalNode = document.querySelector('[data-agri-stat="total-tools"]');
    var bucketNode = document.querySelector('[data-agri-stat="bucket-count"]');
    var zeroGapNode = document.querySelector('[data-agri-stat="zero-gap"]');

    if (totalNode) totalNode.textContent = String(report.totalTools);
    if (bucketNode) bucketNode.textContent = String(report.buckets.length);
    if (zeroGapNode) {
      zeroGapNode.textContent = report.missingAssignments.length === 0 && report.duplicateAssignments.length === 0 ? '0' : String(report.missingAssignments.length + report.duplicateAssignments.length);
    }
  }

  function buildToolCard(tool, taxonomy, bucketLabel) {
    var card = createElement('article', 'agri-tool-card');
    var header = createElement('div', 'agri-tool-card__header');
    var meta = createElement('div', 'agri-tool-card__meta');
    var family = createElement('span', 'agri-chip agri-chip--soft', familyLabel(tool, taxonomy));
    var bucket = createElement('span', 'agri-chip agri-chip--soft', bucketLabel);
    var state = createElement('span', 'agri-chip agri-chip--' + tool.status, statusLabel(tool));
    var title = createElement('h3', 'agri-tool-card__title');
    var link = createElement('a', 'agri-tool-card__link', tool.name);
    var desc = createElement('p', 'agri-tool-card__desc', tool.desc);
    var footer = createElement('div', 'agri-tool-card__footer');
    var coverage = createElement('span', 'agri-tool-card__coverage', coverageLabel(tool));
    var action = createElement('a', 'agri-tool-card__action', 'Open tool');

    link.href = tool.href;
    action.href = tool.href;
    title.appendChild(link);

    meta.appendChild(family);
    meta.appendChild(bucket);
    header.appendChild(meta);
    header.appendChild(state);

    footer.appendChild(coverage);
    footer.appendChild(action);

    card.appendChild(header);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(footer);

    return card;
  }

  function renderFeaturedSection(report, taxonomy) {
    var container = document.querySelector('[data-agri-featured]');
    if (!container) return;

    clearNode(container);
    report.featuredTools.forEach(function (tool) {
      var bucketKey = taxonomy.getMatchingBuckets(tool)[0];
      var bucket = report.bucketMap[bucketKey];
      container.appendChild(buildToolCard(tool, taxonomy, bucket ? bucket.label : 'Agriculture'));
    });
  }

  function renderWorkflowSection(report) {
    var container = document.querySelector('[data-agri-workflows]');
    if (!container) return;

    clearNode(container);

    report.workflows.forEach(function (workflow) {
      var card = createElement('article', 'workflow-card');
      var title = createElement('h3', 'workflow-card__title', workflow.title);
      var summary = createElement('p', 'workflow-card__summary', workflow.summary);
      var list = createElement('div', 'workflow-card__steps');

      workflow.tools.forEach(function (tool) {
        var step = createElement('a', 'workflow-step', tool.name);
        step.href = tool.href;
        list.appendChild(step);
      });

      card.appendChild(title);
      card.appendChild(summary);
      card.appendChild(list);
      container.appendChild(card);
    });
  }

  function renderBucketCards(report, currentBucketKey) {
    var container = document.querySelector('[data-agri-buckets]');
    if (!container) return;

    clearNode(container);

    report.buckets.forEach(function (bucket) {
      var card = createElement('article', 'bucket-card');
      var heading = createElement('div', 'bucket-card__heading');
      var title = createElement('h3', 'bucket-card__title');
      var link = createElement('a', '', bucket.label);
      var count = createElement('span', 'bucket-card__count', String(bucket.count));
      var summary = createElement('p', 'bucket-card__summary', bucket.summary);
      var familyList = createElement('div', 'bucket-card__families');
      var footer = createElement('div', 'bucket-card__footer');
      var action = createElement('a', 'bucket-card__action', currentBucketKey === bucket.key ? 'Viewing bucket' : 'Open bucket hub');

      link.href = '/agriculture/' + bucket.slug + '/';
      title.appendChild(link);

      heading.appendChild(title);
      heading.appendChild(count);

      bucket.topFamilies.forEach(function (family) {
        familyList.appendChild(createElement('span', 'agri-chip agri-chip--soft', slugLabel(family.key.replace(/^tools\//, '')) + ' (' + family.count + ')'));
      });

      action.href = '/agriculture/' + bucket.slug + '/';
      if (currentBucketKey === bucket.key) {
        action.className += ' bucket-card__action--current';
      }

      footer.appendChild(createElement('span', 'bucket-card__family-count', bucket.familyCount + ' families'));
      footer.appendChild(action);

      card.appendChild(heading);
      card.appendChild(summary);
      card.appendChild(familyList);
      card.appendChild(footer);
      container.appendChild(card);
    });
  }

  function renderBucketOverview(bucket, taxonomy) {
    var container = document.querySelector('[data-agri-bucket-overview]');
    var familiesContainer = document.querySelector('[data-agri-bucket-families]');
    var featuredContainer = document.querySelector('[data-agri-bucket-featured]');

    if (container) {
      clearNode(container);
      container.appendChild(createElement('p', 'agri-note', bucket.summary));
    }

    if (familiesContainer) {
      clearNode(familiesContainer);
      bucket.familyStats.forEach(function (family) {
        var chip = createElement('span', 'agri-chip agri-chip--soft', slugLabel(family.key.replace(/^tools\//, '')) + ' (' + family.count + ')');
        familiesContainer.appendChild(chip);
      });
    }

    if (featuredContainer) {
      clearNode(featuredContainer);
      bucket.featuredTools.forEach(function (tool) {
        featuredContainer.appendChild(buildToolCard(tool, taxonomy, bucket.label));
      });
    }
  }

  function renderAssignmentNote(report) {
    var container = document.querySelector('[data-agri-assignment-note]');
    if (!container) return;

    var text = report.totalTools + ' English Agriculture registry entries are assigned to one primary bucket. '
      + 'Duplicate assignments: ' + report.duplicateAssignments.length + '. '
      + 'Missing assignments: ' + report.missingAssignments.length + '.';

    container.textContent = text;
  }

  function renderExplorer(report, taxonomy, initialBucketKey) {
    var container = document.querySelector('[data-agri-explorer]');
    var searchInput = document.querySelector('[data-agri-search]');
    var chipContainer = document.querySelector('[data-agri-filter-chips]');
    var resultsCount = document.querySelector('[data-agri-results-count]');
    var emptyState = document.querySelector('[data-agri-empty]');
    var loadMoreButton = document.querySelector('[data-agri-load-more]');
    var sortSelect = document.querySelector('[data-agri-sort]');
    var state = {
      bucket: initialBucketKey || 'all',
      query: '',
      sort: 'priority',
      limit: 24
    };

    if (!container || !chipContainer || !loadMoreButton) return;

    function getFilteredTools() {
      var selectedTools = state.bucket === 'all'
        ? report.buckets.reduce(function (list, bucket) {
            return list.concat(bucket.tools);
          }, [])
        : (report.bucketMap[state.bucket] ? report.bucketMap[state.bucket].tools.slice() : []);

      var filtered = selectedTools.filter(function (tool) {
        return toolMatchesQuery(tool, state.query);
      });

      filtered.sort(function (toolA, toolB) {
        if (state.sort === 'alpha') {
          return String(toolA.name || '').localeCompare(String(toolB.name || ''));
        }

        if (state.sort === 'family') {
          var familyDiff = familyLabel(toolA, taxonomy).localeCompare(familyLabel(toolB, taxonomy));
          if (familyDiff !== 0) return familyDiff;
        }

        var priorityDiff = Number(toolB.priority || 0) - Number(toolA.priority || 0);
        if (priorityDiff !== 0) return priorityDiff;
        return String(toolA.name || '').localeCompare(String(toolB.name || ''));
      });

      return filtered;
    }

    function renderChips() {
      clearNode(chipContainer);

      function appendChip(bucketKey, label) {
        var button = createElement('button', 'agri-filter-chip' + (state.bucket === bucketKey ? ' is-active' : ''), label);
        button.type = 'button';
        button.addEventListener('click', function () {
          state.bucket = bucketKey;
          state.limit = 24;
          render();
        });
        chipContainer.appendChild(button);
      }

      if (!initialBucketKey) {
        appendChip('all', 'All Agriculture');
      }

      report.buckets.forEach(function (bucket) {
        appendChip(bucket.key, bucket.label + ' (' + bucket.count + ')');
      });
    }

    function render() {
      var filteredTools = getFilteredTools();
      var visibleTools = filteredTools.slice(0, state.limit);

      clearNode(container);
      visibleTools.forEach(function (tool) {
        var bucketKey = taxonomy.getMatchingBuckets(tool)[0];
        var bucket = report.bucketMap[bucketKey];
        container.appendChild(buildToolCard(tool, taxonomy, bucket ? bucket.label : 'Agriculture'));
      });

      if (resultsCount) {
        resultsCount.textContent = filteredTools.length + ' tools';
      }

      if (emptyState) {
        emptyState.hidden = filteredTools.length !== 0;
      }

      loadMoreButton.hidden = filteredTools.length <= state.limit;
      renderChips();
    }

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        state.query = String(searchInput.value || '').trim().toLowerCase();
        state.limit = 24;
        render();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        state.sort = sortSelect.value;
        render();
      });
    }

    loadMoreButton.addEventListener('click', function () {
      state.limit += 24;
      render();
    });

    render();
  }

  function renderPage(tools) {
    var taxonomyRoot = window.AfroToolsCategoryTaxonomy;
    var pageMode = document.body.getAttribute('data-agri-view') || 'overview';
    var bucketKey = document.body.getAttribute('data-agri-bucket') || '';
    var taxonomy = taxonomyRoot && taxonomyRoot.agriculture;
    var report;

    if (!taxonomy || typeof taxonomy.getReport !== 'function') return;

    report = taxonomy.getReport(tools);

    renderStatValues(report);
    renderAssignmentNote(report);

    if (pageMode === 'overview') {
      renderFeaturedSection(report, taxonomy);
      renderWorkflowSection(report);
      renderBucketCards(report, '');
      renderExplorer(report, taxonomy, '');
      return;
    }

    if (!bucketKey || !report.bucketMap[bucketKey]) return;

    document.querySelectorAll('[data-agri-bucket-name]').forEach(function (node) {
      node.textContent = report.bucketMap[bucketKey].label;
    });
    document.querySelectorAll('[data-agri-bucket-count]').forEach(function (node) {
      node.textContent = String(report.bucketMap[bucketKey].count);
    });

    renderBucketCards(report, bucketKey);
    renderBucketOverview(report.bucketMap[bucketKey], taxonomy);
    renderExplorer(report, taxonomy, bucketKey);
  }

  if (typeof onRegistryReady === 'function') {
    onRegistryReady(renderPage);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (typeof AFRO_TOOLS !== 'undefined') {
        renderPage(AFRO_TOOLS);
      } else {
        document.addEventListener('afrotools:registry-ready', function handleRegistryReady(event) {
          document.removeEventListener('afrotools:registry-ready', handleRegistryReady);
          renderPage(event.detail.tools);
        });
      }
    });
  }
})();
