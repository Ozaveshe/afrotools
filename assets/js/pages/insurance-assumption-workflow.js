(function (root) {
  'use strict';

  function finiteNonNegative(value) {
    return Number.isFinite(value) && value >= 0;
  }

  function allValid(values) {
    return values.every(finiteNonNegative);
  }

  /*
   * DOM-free arithmetic shared by the accepted English Insurance workflows
   * and their native French counterparts. Keep formula changes synchronized
   * with data/insurance/assumption-contract.json and its oracle fixtures.
   */
  function calculate(mode, input) {
    input = input || {};

    if (mode === 'need') {
      var annual = Number(input.annual);
      var years = Number(input.years);
      var debts = Number(input.debts);
      var education = Number(input.education);
      var other = Number(input.other);
      var available = Number(input.available);
      if (!allValid([annual, years, debts, education, other, available]) || years === 0) {
        return { ok: false, error: 'need_invalid' };
      }
      var grossNeed = annual * years + debts + education + other;
      return {
        ok: true,
        mode: mode,
        grossNeed: grossNeed,
        available: available,
        gap: Math.max(0, grossNeed - available)
      };
    }

    if (mode === 'compare') {
      var aPremium = Number(input.aPremium);
      var aExcess = Number(input.aExcess);
      var aLimit = Number(input.aLimit);
      var bPremium = Number(input.bPremium);
      var bExcess = Number(input.bExcess);
      var bLimit = Number(input.bLimit);
      if (!allValid([aPremium, aExcess, aLimit, bPremium, bExcess, bLimit]) || aLimit === 0 || bLimit === 0) {
        return { ok: false, error: 'compare_invalid' };
      }
      var aKnownCost = aPremium + aExcess;
      var bKnownCost = bPremium + bExcess;
      return {
        ok: true,
        mode: mode,
        aKnownCost: aKnownCost,
        aLimit: aLimit,
        bKnownCost: bKnownCost,
        bLimit: bLimit,
        lower: aKnownCost === bKnownCost ? 'equal' : (aKnownCost < bKnownCost ? 'a' : 'b')
      };
    }

    if (mode === 'contribution') {
      var base = Number(input.base);
      var employee = Number(input.employee);
      var employer = Number(input.employer);
      var periods = Number(input.months);
      if (!allValid([base, employee, employer, periods]) || periods === 0 || employee > 100 || employer > 100) {
        return { ok: false, error: 'contribution_invalid' };
      }
      var employeeTotal = base * employee / 100 * periods;
      var employerTotal = base * employer / 100 * periods;
      return {
        ok: true,
        mode: mode,
        employeeTotal: employeeTotal,
        employerTotal: employerTotal,
        combined: employeeTotal + employerTotal
      };
    }

    if (mode === 'claim') {
      var incident = new Date(String(input.incident || '') + 'T00:00:00');
      var planned = new Date(String(input.planned || '') + 'T00:00:00');
      var windowDays = Number(input.windowDays);
      if (!Number.isFinite(incident.getTime()) || !Number.isFinite(planned.getTime()) ||
          !finiteNonNegative(windowDays) || windowDays === 0) {
        return { ok: false, error: 'claim_invalid' };
      }
      var elapsed = Math.floor((planned - incident) / 86400000);
      if (elapsed < 0) return { ok: false, error: 'claim_date_order' };
      return {
        ok: true,
        mode: mode,
        windowDays: windowDays,
        elapsed: elapsed,
        remaining: windowDays - elapsed
      };
    }

    if (mode === 'warning') {
      var checked = Number(input.checked);
      if (!finiteNonNegative(checked)) return { ok: false, error: 'warning_invalid' };
      return { ok: true, mode: mode, checked: checked };
    }

    var exposure = Number(input.exposure);
    var rate = Number(input.rate);
    var fixed = Number(input.fixed);
    var contingency = Number(input.contingency);
    if (!allValid([exposure, rate, fixed, contingency]) || exposure === 0 || rate > 100 || contingency > 100) {
      return { ok: false, error: 'quote_invalid' };
    }
    var subtotal = exposure * rate / 100 + fixed;
    return {
      ok: true,
      mode: 'quote',
      subtotal: subtotal,
      total: subtotal * (1 + contingency / 100)
    };
  }

  var engine = Object.freeze({ calculate: calculate });
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.insuranceAssumptionEngine = engine;
  if (typeof module === 'object' && module.exports) module.exports = engine;

  var document = root.document;
  if (!document) return;
  var workflowRoot = document.querySelector('[data-insurance-workflow]');
  if (!workflowRoot) return;

  var form = workflowRoot.querySelector('form');
  var output = workflowRoot.querySelector('[data-result]');
  var mode = workflowRoot.dataset.mode;
  var requestedLocale = workflowRoot.dataset.locale;
  var locale = requestedLocale === 'fr' || requestedLocale === 'sw' ? requestedLocale : 'en';
  var currencySelect = form.elements.currency;
  var defaultCurrency = workflowRoot.dataset.currency || (locale === 'fr' ? 'XOF' : 'your currency');
  var money = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : (locale === 'sw' ? 'sw-KE' : 'en'), { maximumFractionDigits: 2 });
  var lastResult = null;

  var copy = {
    en: {
      errors: {
        need_invalid: 'Enter non-negative amounts and at least one year.',
        compare_invalid: 'Enter non-negative costs and a positive annual limit for both plans.',
        contribution_invalid: 'Enter a positive period and rates from 0% to 100%.',
        claim_invalid: 'Enter both dates and a positive notification window from your policy.',
        claim_date_order: 'Planned notification cannot be before the incident date.',
        warning_invalid: 'Review the selected warning signals.',
        quote_invalid: 'Enter a positive exposure and rates from 0% to 100%.'
      },
      copied: 'Summary copied.',
      copyFailed: 'Copy is unavailable. Select the result text manually.',
      exportFirst: 'Complete the worksheet before exporting.',
      reset: 'Worksheet reset.',
      print: 'Use the browser print dialog to save a local PDF.'
    },
    fr: {
      errors: {
        need_invalid: 'Saisissez des montants positifs ou nuls et au moins une année.',
        compare_invalid: 'Saisissez des coûts positifs ou nuls et un plafond annuel supérieur à zéro pour chaque formule.',
        contribution_invalid: 'Saisissez un nombre de périodes positif et des taux compris entre 0 % et 100 %.',
        claim_invalid: 'Saisissez les deux dates et un délai de déclaration positif tiré de votre contrat.',
        claim_date_order: 'La date de déclaration prévue ne peut pas précéder la date du sinistre.',
        warning_invalid: 'Vérifiez les signaux sélectionnés.',
        quote_invalid: 'Saisissez une exposition supérieure à zéro et des taux compris entre 0 % et 100 %.'
      },
      copied: 'Résumé copié.',
      copyFailed: 'La copie est indisponible. Sélectionnez le résultat manuellement.',
      exportFirst: 'Complétez la feuille avant d’exporter.',
      reset: 'Feuille réinitialisée.',
      print: 'Utilisez la boîte de dialogue d’impression pour enregistrer un PDF local.'
    },
    sw: {
      errors: {
        need_invalid: 'Weka kiasi kisichopungua sifuri na angalau mwaka mmoja.',
        compare_invalid: 'Weka gharama zisizopungua sifuri na kikomo cha mwaka kinachozidi sifuri kwa mipango yote miwili.',
        contribution_invalid: 'Weka idadi chanya ya vipindi na viwango vya asilimia 0 hadi 100.',
        claim_invalid: 'Weka tarehe zote mbili na muda chanya wa kutoa taarifa ulio kwenye mkataba wako.',
        claim_date_order: 'Tarehe ya taarifa uliyopanga haiwezi kuwa kabla ya tarehe ya tukio.',
        warning_invalid: 'Kagua ishara za tahadhari ulizochagua.',
        quote_invalid: 'Weka thamani inayozidi sifuri na viwango vya asilimia 0 hadi 100.'
      },
      copied: 'Muhtasari umenakiliwa.',
      copyFailed: 'Kunakili hakupatikani. Chagua maandishi ya matokeo mwenyewe.',
      exportFirst: 'Kamilisha karatasi ya kazi kabla ya kupakua.',
      reset: 'Karatasi ya kazi imewekwa upya.',
      print: 'Tumia kisanduku cha kuchapisha cha kivinjari kuhifadhi PDF ya ndani.'
    }
  };

  function number(name) {
    var field = form.elements[name];
    if (!field || String(field.value).trim() === '') return NaN;
    return Number(field.value);
  }

  function currentCurrency() {
    return currencySelect && currencySelect.value ? currencySelect.value : defaultCurrency;
  }

  function format(value) {
    return currentCurrency() + ' ' + money.format(value);
  }

  function setStatus(message) {
    var status = workflowRoot.querySelector('[data-export-status]');
    if (status) status.textContent = message;
  }

  function say(message) {
    output.textContent = message;
    output.focus();
  }

  function collectInput() {
    if (mode === 'need') {
      return {
        annual: number('annual'),
        years: number('years'),
        debts: number('debts'),
        education: number('education'),
        other: number('other'),
        available: number('available')
      };
    }
    if (mode === 'compare') {
      return {
        aPremium: number('aPremium'),
        aExcess: number('aExcess'),
        aLimit: number('aLimit'),
        bPremium: number('bPremium'),
        bExcess: number('bExcess'),
        bLimit: number('bLimit')
      };
    }
    if (mode === 'contribution') {
      return {
        base: number('base'),
        employee: number('employee'),
        employer: number('employer'),
        months: number('months')
      };
    }
    if (mode === 'claim') {
      return {
        incident: form.elements.incident.value,
        planned: form.elements.planned.value,
        windowDays: number('windowDays')
      };
    }
    if (mode === 'warning') {
      return { checked: form.querySelectorAll('input[type=checkbox]:checked').length };
    }
    return {
      exposure: number('exposure'),
      rate: number('rate'),
      fixed: number('fixed'),
      contingency: number('contingency')
    };
  }

  function renderResult(result) {
    if (locale === 'sw') {
      if (result.mode === 'need') {
        return 'Pengo la mipango: ' + format(result.gap) + '. Mahitaji yote ' +
          format(result.grossNeed) + ' ukiondoa rasilimali zilizopo ' + format(result.available) +
          '. Hili si pendekezo la mkataba wala bei rasmi.';
      }
      if (result.mode === 'compare') {
        var lowerSw = result.lower === 'equal'
          ? 'Makisio ya gharama zinazojulikana yanafanana.'
          : (result.lower === 'a'
            ? 'Mpango A una jumla ndogo ya malipo na kiasi cha kujilipia ulichoingiza.'
            : 'Mpango B una jumla ndogo ya malipo na kiasi cha kujilipia ulichoingiza.');
        return 'Mpango A: gharama inayojulikana ' + format(result.aKnownCost) + ', kikomo ulichoingiza ' +
          format(result.aLimit) + '. Mpango B: gharama inayojulikana ' + format(result.bKnownCost) +
          ', kikomo ulichoingiza ' + format(result.bLimit) + '. ' + lowerSw +
          ' Ulinzi, vizuizi, mtandao wa huduma na muda wa kusubiri vinaweza kuwa muhimu zaidi kuliko bei; hili si pendekezo.';
      }
      if (result.mode === 'contribution') {
        return 'Kwa makisio uliyoingiza tu: mfanyakazi ' + format(result.employeeTotal) +
          ', mwajiri ' + format(result.employerTotal) + ', jumla ' + format(result.combined) +
          '. Thibitisha msingi na viwango vya sasa kwa mamlaka inayohusika.';
      }
      if (result.mode === 'claim') {
        return 'Muda wa mkataba ulioweka: siku ' + result.windowDays + '. Taarifa imepangwa siku ya ' +
          result.elapsed + '. Hali ya makisio: ' +
          (result.remaining >= 0
            ? 'zimebaki siku ' + result.remaining
            : 'imezidi muda ulioweka kwa siku ' + Math.abs(result.remaining)) +
          '. Wasiliana na kampuni ya bima mapema; zana hii haiamui uhalali wa dai.';
      }
      if (result.mode === 'warning') {
        return 'Umechagua ishara ' + result.checked +
          ' za kukagua. Hili si hitimisho la udanganyifu. Hifadhi ushahidi, thibitisha wakala na mkataba kwa mdhibiti au kampuni ya bima, kisha ripoti kupitia njia rasmi.';
      }
      return 'Jumla ya makisio: ' + format(result.total) + ' (' + format(result.subtotal) +
        ' kabla ya akiba ya tahadhari). Viwango na gharama zote zimetoka kwako; hii si premium ya moja kwa moja, bei rasmi, tathmini, uamuzi wa kustahiki au uamuzi wa ulinzi.';
    }
    if (locale === 'fr') {
      if (result.mode === 'need') {
        return 'Besoin de planification : ' + format(result.gap) + '. Besoins bruts ' +
          format(result.grossNeed) + ' moins ressources disponibles ' + format(result.available) +
          '. Ce résultat n’est ni une recommandation de contrat ni un devis.';
      }
      if (result.mode === 'compare') {
        var lowerFr = result.lower === 'equal'
          ? 'Les scénarios de coût connu sont identiques.'
          : (result.lower === 'a'
            ? 'La formule A présente le coût prime-plus-franchise saisi le plus faible.'
            : 'La formule B présente le coût prime-plus-franchise saisi le plus faible.');
        return 'Formule A : ' + format(result.aKnownCost) + ' de coût connu, plafond saisi ' +
          format(result.aLimit) + '. Formule B : ' + format(result.bKnownCost) +
          ' de coût connu, plafond saisi ' + format(result.bLimit) + '. ' + lowerFr +
          ' Garanties, exclusions, réseau et délais de carence peuvent compter davantage que le prix ; ceci n’est pas une recommandation.';
      }
      if (result.mode === 'contribution') {
        return 'Selon vos seules hypothèses : salarié ' + format(result.employeeTotal) +
          ', employeur ' + format(result.employerTotal) + ', total ' + format(result.combined) +
          '. Confirmez l’assiette et les taux actuels auprès de l’autorité compétente.';
      }
      if (result.mode === 'claim') {
        return 'Délai contractuel saisi : ' + result.windowDays + ' jours. Déclaration prévue au jour ' +
          result.elapsed + '. État de l’hypothèse : ' +
          (result.remaining >= 0
            ? result.remaining + ' jour(s) restant(s)'
            : Math.abs(result.remaining) + ' jour(s) au-delà du délai saisi') +
          '. Contactez rapidement l’assureur ; cet outil ne décide pas de la validité du sinistre.';
      }
      if (result.mode === 'warning') {
        return 'Vous avez coché ' + result.checked +
          ' signal(aux) à examiner. Ceci ne constitue pas une conclusion de fraude. Conservez les preuves, vérifiez l’intermédiaire et le contrat auprès du régulateur ou de l’assureur, puis utilisez un canal officiel pour signaler vos préoccupations.';
      }
      return 'Total selon hypothèses : ' + format(result.total) + ' (' + format(result.subtotal) +
        ' avant marge de prudence). Tous les taux et montants fixes viennent de vous ; ceci n’est ni une prime en direct, ni un devis, ni une évaluation, ni une décision d’éligibilité ou de garantie.';
    }

    if (result.mode === 'need') {
      return 'Planning gap: ' + format(result.gap) + '. Gross needs ' + format(result.grossNeed) +
        ' minus available resources ' + format(result.available) +
        '. This is not a policy recommendation or quote.';
    }
    if (result.mode === 'compare') {
      var lowerEn = result.lower === 'equal'
        ? 'The known-cost scenarios are equal.'
        : (result.lower === 'a'
          ? 'Plan A has the lower entered premium-plus-excess scenario.'
          : 'Plan B has the lower entered premium-plus-excess scenario.');
      return 'Plan A: ' + format(result.aKnownCost) + ' known cost, ' + format(result.aLimit) +
        ' entered limit. Plan B: ' + format(result.bKnownCost) + ' known cost, ' +
        format(result.bLimit) + ' entered limit. ' + lowerEn +
        ' Coverage, exclusions, networks and waiting periods can outweigh price; this is not a recommendation.';
    }
    if (result.mode === 'contribution') {
      return 'Using only your entered assumptions: employee ' + format(result.employeeTotal) +
        ', employer ' + format(result.employerTotal) + ', combined ' + format(result.combined) +
        '. Confirm the current statutory basis and rates with the responsible authority.';
    }
    if (result.mode === 'claim') {
      return 'Your entered policy window: ' + result.windowDays + ' days. Planned notification is day ' +
        result.elapsed + '. Assumption status: ' +
        (result.remaining >= 0
          ? result.remaining + ' day(s) remain'
          : Math.abs(result.remaining) + ' day(s) beyond the entered window') +
        '. Contact the insurer promptly; this tool does not decide claim validity.';
    }
    if (result.mode === 'warning') {
      return 'You marked ' + result.checked +
        ' review signal(s). This is not a fraud finding. Preserve records, verify the intermediary and policy with the regulator or insurer, and report concerns through an official channel.';
    }
    return 'Assumption total: ' + format(result.total) + ' (' + format(result.subtotal) +
      ' before contingency). All rates and fixed amounts came from you; this is not a live premium, quote, valuation, eligibility result or coverage decision.';
  }

  function run() {
    if (!form.reportValidity()) {
      lastResult = null;
      say(copy[locale].errors[mode + '_invalid'] || copy[locale].errors.quote_invalid);
      Array.prototype.forEach.call(workflowRoot.querySelectorAll('[data-export]'), function (button) {
        button.disabled = true;
      });
      return null;
    }
    var input = collectInput();
    if (locale === 'sw' && mode === 'warning' && input.checked === 0) {
      lastResult = null;
      say(copy[locale].errors.warning_invalid);
      return null;
    }
    var result = engine.calculate(mode, input);
    if (!result.ok) {
      lastResult = null;
      say(copy[locale].errors[result.error] || copy[locale].errors.quote_invalid);
      return null;
    }
    lastResult = {
      schemaVersion: 1,
      locale: locale,
      appId: workflowRoot.dataset.appId || '',
      mode: mode,
      currency: currentCurrency(),
      inputs: input,
      result: result,
      boundary: locale === 'fr'
        ? 'Estimation de planification uniquement ; aucun devis, contrat, garantie, éligibilité ou conseil officiel.'
        : (locale === 'sw'
          ? 'Makisio ya mipango tu; si bei rasmi, mkataba, ulinzi, uamuzi wa kustahiki wala ushauri rasmi.'
          : 'Planning estimate only; no quote, policy, coverage, eligibility or official advice.')
    };
    say(renderResult(result));
    Array.prototype.forEach.call(workflowRoot.querySelectorAll('[data-export]'), function (button) {
      button.disabled = false;
    });
    return lastResult;
  }

  function downloadJson() {
    if (!lastResult && !run()) {
      setStatus(copy[locale].exportFirst);
      return;
    }
    var blob = new Blob([JSON.stringify(lastResult, null, 2)], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = (workflowRoot.dataset.appId || 'insurance-assumption') + '-' + locale + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
  }

  function copySummary() {
    if (!lastResult && !run()) {
      setStatus(copy[locale].exportFirst);
      return;
    }
    var text = output.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setStatus(copy[locale].copied);
      }).catch(function () {
        setStatus(copy[locale].copyFailed);
      });
    } else {
      setStatus(copy[locale].copyFailed);
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    run();
  });

  workflowRoot.querySelector('[data-action=reset]').addEventListener('click', function () {
    form.reset();
    output.textContent = '';
    lastResult = null;
    Array.prototype.forEach.call(workflowRoot.querySelectorAll('[data-export]'), function (button) {
      button.disabled = true;
    });
    setStatus(copy[locale].reset);
    form.querySelector('input,select').focus();
  });

  Array.prototype.forEach.call(workflowRoot.querySelectorAll('[data-export]'), function (button) {
    button.addEventListener('click', function () {
      var action = button.dataset.export;
      if (action === 'copy') copySummary();
      if (action === 'json') downloadJson();
      if (action === 'pdf') {
        if (!lastResult && !run()) {
          setStatus(copy[locale].exportFirst);
          return;
        }
        setStatus(copy[locale].print);
        root.print();
      }
    });
  });

  var stamp = workflowRoot.dataset.sourceDate;
  var ageTarget = workflowRoot.querySelector('[data-source-age]');
  if (stamp && ageTarget) {
    var age = Math.floor((Date.now() - new Date(stamp + 'T00:00:00Z').getTime()) / 86400000);
    ageTarget.textContent = locale === 'fr'
      ? (age > 60
        ? 'Données anciennes pour un domaine à risque élevé : le plancher du jeu a ' + age + ' jours (cadence de révision de 60 jours).'
        : 'Le plancher du jeu a ' + age + ' jours.')
      : (locale === 'sw'
        ? (age > 60
          ? 'Data ni ya zamani kwa eneo lenye hatari kubwa: tarehe ya msingi ina siku ' + age + ' (ukaguzi kila siku 60).'
          : 'Tarehe ya msingi ya data ina siku ' + age + '.')
        : (age > 60
          ? 'Stale for high-risk figures: dataset floor is ' + age + ' days old (60-day review cadence).'
          : 'Dataset floor is ' + age + ' days old.'));
  }
}(typeof globalThis !== 'undefined' ? globalThis : this));
