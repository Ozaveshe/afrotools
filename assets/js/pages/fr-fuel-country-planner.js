(function () {
  'use strict';

  document.querySelectorAll('[data-fr-fuel-planner]').forEach(function (panel) {
    var type = panel.querySelector('[name="fuel_type"]');
    var quantity = panel.querySelector('[name="litres_per_day"]');
    var days = panel.querySelector('[name="days_per_month"]');
    var label = panel.querySelector('[data-fuel-quantity-label]');
    var output = panel.querySelector('[data-fuel-planner-output]');
    var currency = panel.getAttribute('data-currency') || '';
    if (!type || !quantity || !days || !label || !output) return;

    function number(field) {
      return field.value.trim() === '' ? NaN : Number(field.value);
    }

    function render() {
      var option = type.options[type.selectedIndex];
      var unit = option ? option.getAttribute('data-unit') : '';
      label.textContent = unit === 'kg' ? 'Kilogrammes par jour' : 'Litres par jour';
      var daily = number(quantity);
      var month = number(days);
      var validQuantity = Number.isFinite(daily) && daily >= 0;
      var validDays = Number.isInteger(month) && month >= 1 && month <= 31;
      quantity.setAttribute('aria-invalid', String(!validQuantity));
      days.setAttribute('aria-invalid', String(!validDays));
      if (!validQuantity || !validDays) {
        output.textContent = !validQuantity
          ? 'Saisissez une quantité positive ou nulle par jour.'
          : 'Saisissez un nombre entier de jours entre 1 et 31.';
        return;
      }
      var price = option ? Number(option.getAttribute('data-price')) : NaN;
      if (!Number.isFinite(price) || price <= 0 || !['L', 'kg'].includes(unit)) {
        output.textContent = 'Le prix du relevé est indisponible pour ce carburant.';
        return;
      }
      var total = daily * month * price;
      if (!Number.isFinite(total)) {
        output.textContent = 'La quantité est trop élevée pour calculer ce budget.';
        return;
      }
      var formatted = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(total);
      var dailyText = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(daily);
      output.textContent = 'Estimation locale : ' + formatted + ' ' + currency + ' par mois pour ' + dailyText + ' ' + unit + '/jour de ' + option.textContent + ' pendant ' + month + ' jours. Calcul fondé sur le relevé daté ci-dessous ; vérifiez le prix local avant achat ou devis.';
    }

    panel.addEventListener('input', render);
    panel.addEventListener('change', render);
    render();
  });
})();
