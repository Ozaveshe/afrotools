(function initFrenchTransportParity() {
  'use strict';

  var body = document.body;
  if (!body || !body.hasAttribute('data-fr-transport-parity')) return;

  var appId = body.getAttribute('data-fr-transport-parity');
  var appName = body.getAttribute('data-fr-transport-name') || document.title;
  var frenchRoute = body.getAttribute('data-fr-transport-route') || location.pathname;
  var reviewDate = body.getAttribute('data-fr-transport-review-date') || '2026-06-18';
  var status = document.querySelector('[data-fr-transport-status]');
  var error = document.querySelector('[data-fr-transport-error]');
  var textDownload = document.querySelector('[data-fr-transport-download-text]');
  var pdfDownload = document.querySelector('[data-fr-transport-download-pdf]');
  var staleAfterResultApps = new Set([
    'car-import-cost',
    'car-price-intelligence',
    'ride-fare',
    'boda-income',
    'matatu-fare',
    'delivery-cost',
    'car-loan-vs-cash',
    'vehicle-registration',
    'vehicle-depreciation',
    'fleet-fuel',
    'last-mile-delivery',
    'parking-fee',
    'route-cost',
    'toll-calc',
    'truck-load',
    'vehicle-operating-cost',
    'vehicle-tracker-roi'
  ]);
  var requiresExplicitRecalculation = staleAfterResultApps.has(appId);
  var resultIsFresh = false;

  function installCarImportPrivacyBoundary() {
    if (appId !== 'car-import-cost') return;
    var nativeReplaceState = history.replaceState.bind(history);
    history.replaceState = function replaceCarImportState(state, title, nextUrl) {
      if (nextUrl) {
        try {
          var parsed = new URL(nextUrl, location.href);
          if (parsed.pathname === frenchRoute && (parsed.search || parsed.hash)) {
            return nativeReplaceState(state, title, frenchRoute);
          }
        } catch (urlError) {
          return nativeReplaceState(state, title, frenchRoute);
        }
      }
      return nativeReplaceState(state, title, nextUrl);
    };
    try {
      localStorage.removeItem('carImportCostLastInput');
      var nativeSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function setPrivacyBoundedItem(key, value) {
        if (this === localStorage && key === 'carImportCostLastInput') return;
        return nativeSetItem.call(this, key, value);
      };
    } catch (storageError) {
      // The calculator remains usable when storage is unavailable.
    }
    if (location.search || location.hash) {
      nativeReplaceState(null, '', frenchRoute);
    }
  }

  installCarImportPrivacyBoundary();

  function installCarImportThemeReadiness() {
    if (appId !== 'car-import-cost') return;
    var attempts = 0;
    var settleVersion = 0;

    function themeSurfaceHasPainted(activeTheme) {
      var root = document.documentElement;
      var quickCard = document.querySelector('.car-import-quick-card');
      if (!quickCard || root.getAttribute('data-theme') !== activeTheme) return false;
      var cardStyle = getComputedStyle(quickCard);
      if (activeTheme === 'dark') {
        return cardStyle.backgroundColor === 'rgb(23, 38, 61)'
          && cardStyle.color === 'rgb(238, 245, 255)';
      }
      return cardStyle.backgroundColor === 'rgb(255, 255, 255)'
        && cardStyle.color === 'rgb(16, 32, 51)';
    }

    function advertiseSettledTheme(choice, activeTheme) {
      var version = ++settleVersion;
      body.removeAttribute('data-fr-transport-theme-ready');
      body.setAttribute('data-fr-transport-theme-state', 'settling');
      requestAnimationFrame(function waitForThemeStylesheet() {
        requestAnimationFrame(function waitForThemePaint() {
          if (version !== settleVersion) return;
          if (!themeSurfaceHasPainted(activeTheme)) {
            setTimeout(function retryThemePaint() {
              if (version === settleVersion) advertiseSettledTheme(choice, activeTheme);
            }, 25);
            return;
          }
          body.setAttribute('data-fr-transport-theme-state', 'ready');
          body.setAttribute('data-fr-transport-theme-choice', choice);
          body.setAttribute('data-fr-transport-active-theme', activeTheme);
          body.setAttribute('data-fr-transport-theme-ready', 'true');
          document.dispatchEvent(new CustomEvent('afrotools:fr-transport-theme-ready', {
            detail: {
              choice: choice,
              activeTheme: activeTheme
            }
          }));
        });
      });
    }

    document.addEventListener('afrotools:theme-change', function onThemeChange(event) {
      var detail = event && event.detail || {};
      advertiseSettledTheme(detail.theme || 'auto', detail.activeTheme || 'light');
    });

    function markReadyFromDarkModeApi() {
      var darkMode = window.AfroTools && window.AfroTools.darkMode;
      if (!darkMode || typeof darkMode.get !== 'function' || typeof darkMode.set !== 'function') {
        attempts += 1;
        if (attempts <= 40) setTimeout(markReadyFromDarkModeApi, 25);
        return;
      }
      var choice = darkMode.get();
      var activeTheme = darkMode.set(choice);
      advertiseSettledTheme(choice, activeTheme);
    }
    markReadyFromDarkModeApi();
  }

  installCarImportThemeReadiness();

  var translations = {
    'Summary ready to copy or download.': 'Résumé prêt à copier ou télécharger.',
    'Saved locally': 'Enregistré sur cet appareil',
    'No charges in this block for the active inputs.': 'Aucun coût dans cette section pour les données saisies.',
    'Calculate landed cost': 'Calculer le coût rendu',
    'Compare source markets': 'Comparer les marchés sources',
    'Estimated on-road cost': 'Coût routier estimé',
    'Official Charges': 'Coûts présentés comme officiels',
    'Practical Costs': 'Coûts pratiques',
    'Registration': 'Immatriculation',
    'Scenarios': 'Scénarios',
    'Compare': 'Comparer',
    'Documents': 'Documents',
    'Customs value basis': 'Base de valeur douanière',
    'Official charges': 'Coûts issus du barème du modèle',
    'Third-party, port, and delivery costs': 'Coûts de tiers, port et livraison',
    'Registration and plates': 'Immatriculation et plaques',
    'Scenarios and sensitivity': 'Scénarios et sensibilité',
    'Exchange-rate and delay sensitivity': 'Sensibilité au change et aux retards',
    'Source market comparison': 'Comparaison des marchés sources',
    'Document checklist': 'Checklist des documents',
    'Sources used': 'Sources utilisées',
    'Trust notes': 'Limites et confiance',
    'Ask the AfroTools car import advisor': 'Conseil local pour préparer l’importation',
    'Ask AI with this quote': 'Obtenir un conseil local (sans envoi)',
    'Ask why this country is expensive, what hidden costs to expect, or whether to import or buy locally.': 'Posez une question sur les hypothèses, les coûts cachés ou la comparaison importation et achat local.',
    'Export PDF': 'Télécharger le PDF',
    'Export CSV': 'Télécharger le CSV',
    'Print': 'Imprimer',
    'Share quote': 'Partager le résumé',
    'Save locally': 'Enregistrer sur cet appareil',
    'The car import calculator data could not load. Refresh the page or try again shortly.': 'Les données du calculateur n’ont pas pu être chargées. Actualisez la page ou réessayez.',
    'Based on the calculation context, keep a buffer for FX movement, storage, clearing agent differences, and final customs valuation.': 'Gardez une marge pour le change, le stockage, le transitaire et la valeur douanière finale.'
  };
  var generatedTranslations = document.querySelector('[data-fr-transport-ui-translations]');
  if (generatedTranslations) {
    try {
      Object.assign(translations, JSON.parse(generatedTranslations.textContent));
    } catch (translationError) {
      // Keep the local fallback dictionary usable if a hand-authored page
      // ever carries malformed generated translation data.
    }
  }
  var orderedTranslationKeys = Object.keys(translations).sort(function byLength(left, right) {
    return right.length - left.length;
  });
  var translationPatterns = orderedTranslationKeys.map(function compileTranslation(source) {
    var escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return {
      source: source,
      pattern: new RegExp('(^|[^\\p{L}])(' + escaped + ')(?=$|[^\\p{L}])', 'gu')
    };
  });

  function translateText(value) {
    var original = String(value || '');
    var trimmed = original.trim();
    if (Object.prototype.hasOwnProperty.call(translations, trimmed)) {
      return original.replace(trimmed, translations[trimmed]);
    }
    return translationPatterns.reduce(function replaceKnownPhrase(output, entry) {
      return output.replace(entry.pattern, function translatedPhrase(match, prefix) {
        return prefix + translations[entry.source];
      });
    }, original);
  }

  function translateSubtree(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function translateNode(node) {
      if (node.parentElement && node.parentElement.closest('script,style')) return;
      var translated = translateText(node.nodeValue);
      if (translated !== node.nodeValue) node.nodeValue = translated;
    });
    root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(function translateAttribute(element) {
      ['placeholder', 'aria-label', 'title'].forEach(function updateAttribute(attribute) {
        if (!element.hasAttribute(attribute)) return;
        element.setAttribute(attribute, translateText(element.getAttribute(attribute)));
      });
    });
  }

  function applyCarImportNativeCopy() {
    if (appId !== 'car-import-cost') return;
    var cloudSave = document.getElementById('carImportCloudSave');
    if (cloudSave) cloudSave.remove();
    if (requiresExplicitRecalculation) setExportAvailability(resultIsFresh);
    var guide = document.getElementById('carImportGuideNote');
    if (!guide) return;
    var country = document.querySelector('#carImportCountry option:checked');
    var sourceMarket = document.querySelector('#carImportSourceMarket option:checked');
    var countryLabel = country ? country.textContent.trim() : 'le pays sélectionné';
    var sourceLabel = sourceMarket ? translateText(sourceMarket.textContent.trim()) : 'le marché source sélectionné';
    var markup = '<strong>Lecture rapide :</strong> Cette estimation pour ' + countryLabel
      + ' inclut davantage que les seuls droits de douane. Utilisez <strong>Coûts présentés comme officiels</strong>'
      + ' pour isoler les coûts douaniers, ou ouvrez <strong>Comparer</strong> pour vérifier si '
      + sourceLabel + ' reste préférable aux autres marchés sources.';
    if (guide.innerHTML !== markup) guide.innerHTML = markup;
  }

  function resultCandidates() {
    var main = document.querySelector('main,[role="main"]') || body;
    return Array.prototype.slice.call(main.querySelectorAll(
      '.results.on,.results:not([hidden]),[id*="result" i]:not([hidden]),output,[aria-live],.result-panel:not([hidden]),.cars-card-grid,[data-fr-cars-result],[data-fr-transport-result]'
    )).filter(function outsideProof(element) {
      return !element.closest('.fr-transport-proof');
    });
  }

  function visibleResultText() {
    var candidates = resultCandidates().filter(function visible(element) {
      var style = getComputedStyle(element);
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && !element.closest('[data-fr-transport-stale="true"]')
        && element.textContent.trim();
    });
    return candidates.map(function text(element) {
      return element.textContent.replace(/\s+/g, ' ').trim();
    }).join('\n').slice(0, 12000);
  }

  function setExportAvailability(enabled) {
    var actions = [textDownload, pdfDownload];
    if (appId === 'car-import-cost') {
      actions = actions.concat(Array.prototype.slice.call(document.querySelectorAll(
        '#carImportPdf,#carImportCsv,#carImportPrint,#carImportShare,#carImportSaveLocal'
      )));
    }
    actions.forEach(function updateExport(button) {
      if (!button) return;
      button.disabled = !enabled;
      button.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    });
    body.setAttribute('data-fr-transport-export-ready', enabled ? 'true' : 'false');
  }

  function clearStaleMarkers() {
    document.querySelectorAll('[data-fr-transport-stale="true"]').forEach(function clearMarker(element) {
      element.removeAttribute('data-fr-transport-stale');
    });
  }

  function markFreshResult() {
    clearStaleMarkers();
    if (!visibleResultText()) return;
    resultIsFresh = true;
    setExportAvailability(true);
    if (status) status.textContent = 'Résumé prêt à copier ou télécharger.';
  }

  function scheduleFreshResultCheck() {
    if (!requiresExplicitRecalculation) return;
    [0, 50, 250, 750].forEach(function schedule(delay) {
      setTimeout(markFreshResult, delay);
    });
  }

  function markResultStale() {
    if (!requiresExplicitRecalculation || !resultIsFresh) return;
    resultCandidates().forEach(function markCandidate(element) {
      element.setAttribute('data-fr-transport-stale', 'true');
    });
    resultIsFresh = false;
    setExportAvailability(false);
    if (error) error.textContent = '';
    if (status) status.textContent = 'Saisies modifiées : relancez le calcul avant d’exporter.';
  }

  function localSummary() {
    var result = visibleResultText();
    var assumptions = Array.prototype.slice.call(
      document.querySelectorAll('main input:not([type="hidden"]),main select,main textarea,[role="main"] input:not([type="hidden"]),[role="main"] select,[role="main"] textarea')
    ).filter(function enabled(element) {
      return !element.disabled && element.value !== '';
    }).map(function row(element) {
      var label = element.labels && element.labels[0]
        ? element.labels[0].textContent.replace(/\s+/g, ' ').trim()
        : element.getAttribute('aria-label') || element.name || element.id;
      var selected = element.tagName === 'SELECT' && element.selectedOptions[0]
        ? element.selectedOptions[0].textContent.trim()
        : element.value;
      return label + ': ' + selected;
    }).slice(0, 40);
    return [
      appName,
      'Route: ' + frenchRoute,
      'Revue des sources: ' + reviewDate + ' (non actualisée en direct)',
      '',
      'Saisies et hypothèses',
      assumptions.join('\n') || 'Aucune saisie disponible.',
      '',
      'Résultat',
      result || 'Lancez le calcul avant d’exporter.',
      '',
      'Limite: estimation de planification. Confirmez prix, tarif, trajet, disponibilité, documents et règles auprès de la source compétente.'
    ].join('\n');
  }

  function downloadText() {
    if (requiresExplicitRecalculation && !resultIsFresh) return;
    var text = localSummary();
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'afrotools-' + appId + '-resume.txt';
    link.click();
    setTimeout(function revoke() { URL.revokeObjectURL(link.href); }, 0);
    if (status) status.textContent = 'Résumé TXT téléchargé sur cet appareil.';
  }

  function downloadPdf() {
    if (requiresExplicitRecalculation && !resultIsFresh) return;
    var result = visibleResultText() || 'Lancez le calcul avant d’exporter.';
    if (!(window.AfroTools && window.AfroTools.pdf && typeof window.AfroTools.pdf.generate === 'function')) {
      if (error) error.textContent = 'Le module PDF local n’est pas disponible. Utilisez le résumé TXT.';
      return;
    }
    if (error) error.textContent = '';
    window.AfroTools.pdf.generate({
      noGate: true,
      skipGate: true,
      category: 'transport',
      toolId: appId,
      title: appName,
      subtitle: 'Estimation locale en français',
      sections: [{
        heading: 'Résultat visible',
        rows: [{ label: 'Résumé', value: result.slice(0, 900) }]
      }],
      source: 'Registre Transport AfroTools, revue ' + reviewDate + '. Aucune donnée tarifaire actualisée en direct.',
      disclaimer: 'Estimation de planification uniquement. Confirmez tout prix, tarif, horaire, trajet, disponibilité, document ou règle auprès de la source compétente.',
      filename: 'afrotools-' + appId + '-resume.pdf'
    }).then(function completePdf(outcome) {
      if (status && !(outcome && outcome.blocked)) status.textContent = 'PDF téléchargé sur cet appareil.';
    }).catch(function pdfError() {
      if (error) error.textContent = 'Le PDF n’a pas pu être créé. Utilisez le résumé TXT.';
    });
  }

  function hasInvalidInput(container) {
    return Array.prototype.slice.call(container.querySelectorAll('input:not([type="hidden"])')).some(function invalid(input) {
      if (input.disabled) return false;
      if (!input.checkValidity()) return true;
      if (input.type === 'number' && input.value !== '' && Number(input.value) < 0 && Number(input.min || 0) >= 0) return true;
      return false;
    });
  }

  function clearVisibleResults() {
    document.querySelectorAll('.results.on,.en-results.on').forEach(function clearClass(element) {
      element.classList.remove('on');
    });
    document.querySelectorAll('.result-panel:not([hidden]),[id*="results" i]:not([hidden])').forEach(function hide(element) {
      if (!element.matches('.results,.en-results') && !element.closest('.fr-transport-proof')) element.hidden = true;
    });
    resultIsFresh = false;
    if (requiresExplicitRecalculation) setExportAvailability(false);
  }

  document.addEventListener('car-import:reset', function resetFrenchCarImportState() {
    if (appId !== 'car-import-cost') return;
    clearStaleMarkers();
    clearVisibleResults();
    try {
      localStorage.removeItem('carImportCostLastInput');
      sessionStorage.removeItem('carImportCostLastInput');
    } catch (storageError) {
      // Reset remains usable when storage is unavailable.
    }
    if (error) error.textContent = '';
    if (status) status.textContent = 'Estimation réinitialisée. Saisissez de nouvelles informations pour recalculer.';
    translateSubtree(body);
  });

  document.addEventListener('click', function validatePrimaryAction(event) {
    var button = event.target.closest('button[type="submit"],button[onclick]');
    if (!button || button.closest('.fr-transport-proof')) return;
    var container = button.closest('form,.card,main,[role="main"]') || body;
    if (!hasInvalidInput(container)) {
      if (error) error.textContent = '';
      clearStaleMarkers();
      scheduleFreshResultCheck();
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    clearVisibleResults();
    if (error) error.textContent = 'Corrigez les champs invalides avant de relancer le calcul.';
    if (status) status.textContent = 'Résultat effacé après une saisie invalide.';
  }, true);

  function clearStaleResult(event) {
    if (
      !event.target.matches('input,select,textarea')
      || event.target.matches('#carImportAiQuestion')
      || event.target.closest('.fr-transport-proof')
    ) return;
    markResultStale();
  }

  document.addEventListener('input', clearStaleResult);
  document.addEventListener('change', clearStaleResult);

  document.addEventListener('click', function keepCarImportAdviceLocal(event) {
    var button = event.target.closest('#carImportAskAi');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    var question = document.getElementById('carImportAiQuestion');
    var log = document.getElementById('carImportAiLog');
    if (!question || !log || !question.value.trim()) return;
    var message = document.createElement('div');
    message.className = 'car-import-ai-message assistant';
    message.textContent = 'Conseil local : gardez une marge pour le change, le stockage, le transitaire et la valeur douanière finale. Cette réponse ne quitte pas le navigateur et ne constitue pas une décision officielle.';
    log.appendChild(message);
    question.value = '';
    if (status) status.textContent = 'Conseil déterministe affiché localement, sans appel réseau.';
  }, true);

  document.addEventListener('click', function keepCarImportPdfLocalAndUngated(event) {
    var button = event.target.closest('#carImportPdf');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    downloadPdf();
  }, true);

  textDownload?.addEventListener('click', downloadText);
  pdfDownload?.addEventListener('click', downloadPdf);

  function scheduleBoundedTranslation() {
    [0, 250, 1000, 2500].forEach(function schedule(delay) {
      setTimeout(function translateKnownDynamicUi() {
        translateSubtree(body);
        applyCarImportNativeCopy();
      }, delay);
    });
  }

  document.addEventListener('DOMContentLoaded', function afterAppInit() {
    if (requiresExplicitRecalculation) setExportAvailability(false);
    scheduleBoundedTranslation();
    var translationQueued = false;
    var observer = new MutationObserver(function translateDynamicUi() {
      if (translationQueued) return;
      translationQueued = true;
      setTimeout(function translateMutationBatch() {
        translationQueued = false;
        translateSubtree(body);
        applyCarImportNativeCopy();
      }, 0);
    });
    observer.observe(body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    var aiButton = document.getElementById('carImportAskAi');
    if (aiButton) aiButton.textContent = 'Obtenir un conseil local (sans envoi)';
    if (location.search) history.replaceState(null, '', frenchRoute);
    var carImportForm = document.getElementById('carImportForm');
    if (carImportForm) {
      carImportForm.addEventListener('submit', function keepSensitiveValuesOutOfUrl() {
        setTimeout(function clearUrl() {
          history.replaceState(null, '', frenchRoute);
        }, 0);
      });
    }
  });

  document.addEventListener('click', function translateAfterWorkflowAction(event) {
    if (appId === 'car-price-intelligence' || !event.target.closest('button')) return;
    setTimeout(function translateUpdatedResult() {
      translateSubtree(body);
    }, 0);
    setTimeout(function translateDeferredResult() {
      translateSubtree(body);
    }, 250);
  });
})();
