(function () {
  'use strict';

  var planners = document.querySelectorAll('[data-lobola-quick-planner]');
  if (!planners.length) return;

  function safeNumber(value) {
    var number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : 0;
  }

  function formatAmount(symbol, value) {
    return symbol + Math.round(Math.max(0, value)).toLocaleString('en-US');
  }

  function copyText(text, status, labels) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        status.textContent = labels.copied;
      }).catch(function () {
        status.textContent = labels.copyFailed;
      });
      return;
    }
    status.textContent = labels.copyFailed;
  }

  Array.prototype.forEach.call(planners, function (root) {
    var countryCode = root.getAttribute('data-country-code') || 'za';
    var countryName = root.getAttribute('data-country-name') || 'South Africa';
    var currency = root.getAttribute('data-currency') || 'ZAR';
    var symbol = root.getAttribute('data-symbol') || currency + ' ';
    var defaultCattle = safeNumber(root.getAttribute('data-cattle'));
    var defaultPerHead = safeNumber(root.getAttribute('data-per-head'));
    var defaultCash = safeNumber(root.getAttribute('data-cash'));
    var locale = root.getAttribute('data-locale') === 'fr' ? 'fr' : 'en';
    var labels = locale === 'fr' ? {
      stepTitle: 'Commencez par ce que les familles ont discuté',
      stepHelp: 'Chaque montant est modifiable. Saisissez zéro si un élément n’a pas encore été discuté.',
      cattle: 'Équivalent bétail ou nombre de têtes',
      perHead: 'Valeur de planification par tête',
      cash: 'Espèces supplémentaires convenues',
      gifts: 'Cadeaux et articles pratiques',
      meeting: 'Rencontre, déplacement et cérémonie',
      update: 'Mettre à jour le total',
      total: 'Total de planification modifiable',
      disclaimer: 'Ni tarif officiel, ni mesure de la valeur d’une personne.',
      livestock: 'Référence bétail',
      copy: 'Copier le résumé',
      share: 'Partager sur WhatsApp',
      full: 'Ouvrir le planificateur familial complet',
      meetingAction: 'Préparer la rencontre familiale',
      summaryTitle: ' — résumé de planification de la lobola',
      currency: 'Devise',
      additionalCash: 'Espèces supplémentaires',
      giftsItems: 'Cadeaux et articles pratiques',
      meetingCeremony: 'Rencontre, déplacement et cérémonie',
      reminder: 'Rappel : ce document aide la discussion. Il ne fixe aucun montant officiel et ne mesure la valeur de personne.',
      updated: 'Total de planification mis à jour.',
      copied: 'Résumé copié.',
      copyFailed: 'Sélectionnez le résumé et copiez-le manuellement.',
      shareOpened: 'Partage WhatsApp ouvert.',
      planYours: 'Préparez votre plan'
    } : {
      stepTitle: 'Start from what the family has discussed',
      stepHelp: 'Every number is editable. Use zero when an item has not been discussed.',
      cattle: 'Livestock or cattle equivalent',
      perHead: 'Planning value per head',
      cash: 'Additional family-agreed cash',
      gifts: 'Gifts and practical items',
      meeting: 'Meeting, travel and ceremony costs',
      update: 'Update planning total',
      total: 'Editable planning total',
      disclaimer: 'Not an official rate or a measure of anyone’s worth.',
      livestock: 'Livestock reference',
      copy: 'Copy summary',
      share: 'Share on WhatsApp',
      full: 'Open full family planner',
      meetingAction: 'Prepare the family meeting',
      summaryTitle: ' lobola planning summary',
      currency: 'Currency',
      additionalCash: 'Additional cash',
      giftsItems: 'Gifts and practical items',
      meetingCeremony: 'Meeting, travel and ceremony',
      reminder: 'Reminder: this is a discussion aid, not an official amount or a measure of anyone’s worth.',
      updated: 'Planning total updated.',
      copied: 'Summary copied.',
      copyFailed: 'Select the summary and copy it manually.',
      shareOpened: 'WhatsApp share opened.',
      planYours: 'Plan yours'
    };
    var prefix = 'lobola-' + countryCode + '-';
    var fullPlannerUrl = '/tools/lobola-calculator/?country=' + encodeURIComponent(countryCode) + '&currency=' + encodeURIComponent(currency) + '#lobola-planner';

    root.innerHTML =
      '<div class="lc-quick-layout">' +
        '<form class="lc-quick-form" novalidate>' +
          '<div class="lc-quick-step"><span>1</span><div><strong>' + labels.stepTitle + '</strong><small>' + labels.stepHelp + '</small></div></div>' +
          '<div class="lc-quick-grid">' +
            '<div class="lc-field"><label for="' + prefix + 'cattle">' + labels.cattle + '</label><input id="' + prefix + 'cattle" name="cattle" type="number" min="0" max="100" step="1" inputmode="numeric" value="' + defaultCattle + '"></div>' +
            '<div class="lc-field"><label for="' + prefix + 'per-head">' + labels.perHead + ' (' + currency + ')</label><input id="' + prefix + 'per-head" name="perHead" type="number" min="0" step="1" inputmode="decimal" value="' + defaultPerHead + '"></div>' +
            '<div class="lc-field"><label for="' + prefix + 'cash">' + labels.cash + ' (' + currency + ')</label><input id="' + prefix + 'cash" name="cash" type="number" min="0" step="1" inputmode="decimal" value="' + defaultCash + '"></div>' +
            '<div class="lc-field"><label for="' + prefix + 'gifts">' + labels.gifts + ' (' + currency + ')</label><input id="' + prefix + 'gifts" name="gifts" type="number" min="0" step="1" inputmode="decimal" value="0"></div>' +
            '<div class="lc-field"><label for="' + prefix + 'meeting">' + labels.meeting + ' (' + currency + ')</label><input id="' + prefix + 'meeting" name="meeting" type="number" min="0" step="1" inputmode="decimal" value="0"></div>' +
          '</div>' +
          '<button class="lc-btn primary" type="submit">' + labels.update + '</button>' +
        '</form>' +
        '<aside class="lc-quick-result" aria-live="polite" aria-atomic="true">' +
          '<span class="lc-quick-label">' + labels.total + '</span>' +
          '<strong class="lc-quick-total">' + formatAmount(symbol, 0) + '</strong>' +
          '<p class="lc-quick-caption">' + labels.disclaimer + '</p>' +
          '<dl class="lc-quick-breakdown"></dl>' +
          '<div class="lc-quick-actions">' +
            '<button class="lc-btn lc-copy-summary" type="button">' + labels.copy + '</button>' +
            '<button class="lc-btn lc-share-summary" type="button">' + labels.share + '</button>' +
            '<a class="lc-btn" href="' + fullPlannerUrl + '">' + labels.full + '</a>' +
            '<a class="lc-btn" href="' + (locale === 'fr' ? '/fr/tools/checklist-negociation-dot/' : '/tools/lobola-negotiation-checklist/') + '">' + labels.meetingAction + '</a>' +
          '</div>' +
          '<p class="lc-status" aria-live="polite"></p>' +
        '</aside>' +
      '</div>';

    var form = root.querySelector('form');
    var total = root.querySelector('.lc-quick-total');
    var breakdown = root.querySelector('.lc-quick-breakdown');
    var status = root.querySelector('.lc-status');
    var lastSummary = '';

    function calculate() {
      var data = new FormData(form);
      var cattle = safeNumber(data.get('cattle'));
      var perHead = safeNumber(data.get('perHead'));
      var cash = safeNumber(data.get('cash'));
      var gifts = safeNumber(data.get('gifts'));
      var meeting = safeNumber(data.get('meeting'));
      var livestock = cattle * perHead;
      var planningTotal = livestock + cash + gifts + meeting;

      total.textContent = formatAmount(symbol, planningTotal);
      breakdown.innerHTML =
        '<div><dt>' + labels.livestock + '</dt><dd>' + formatAmount(symbol, livestock) + '</dd></div>' +
        '<div><dt>' + labels.additionalCash + '</dt><dd>' + formatAmount(symbol, cash) + '</dd></div>' +
        '<div><dt>' + labels.giftsItems + '</dt><dd>' + formatAmount(symbol, gifts) + '</dd></div>' +
        '<div><dt>' + labels.meetingCeremony + '</dt><dd>' + formatAmount(symbol, meeting) + '</dd></div>';

      lastSummary = [
        countryName + labels.summaryTitle,
        labels.currency + ': ' + currency,
        labels.livestock + ': ' + cattle + ' x ' + formatAmount(symbol, perHead) + ' = ' + formatAmount(symbol, livestock),
        labels.additionalCash + ': ' + formatAmount(symbol, cash),
        labels.giftsItems + ': ' + formatAmount(symbol, gifts),
        labels.meetingCeremony + ': ' + formatAmount(symbol, meeting),
        labels.total + ': ' + formatAmount(symbol, planningTotal),
        labels.reminder
      ].join('\n');
      status.textContent = labels.updated;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      calculate();
    });
    Array.prototype.forEach.call(form.querySelectorAll('input'), function (input) {
      input.addEventListener('input', calculate);
    });
    root.querySelector('.lc-copy-summary').addEventListener('click', function () {
      copyText(lastSummary, status, labels);
    });
    root.querySelector('.lc-share-summary').addEventListener('click', function () {
      window.open('https://wa.me/?text=' + encodeURIComponent(lastSummary + '\n\n' + labels.planYours + ': https://afrotools.com' + fullPlannerUrl), '_blank', 'noopener');
      status.textContent = labels.shareOpened;
    });

    calculate();
  });
})();
