(function () {
  'use strict';
  var form = document.getElementById('areaForm');
  var output = document.getElementById('areaResult');
  var status = document.getElementById('areaStatus');
  var format = new Intl.NumberFormat('en', { maximumFractionDigits: 6 });
  form.addEventListener('input', function () {
    output.hidden = true;
    status.textContent = 'Inputs changed. Calculate to update the result.';
  });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    output.hidden = true;
    try {
      if (form.elements.amount.value.trim() === '' || form.elements.basis.value.trim() === '') throw new Error('Enter an area and a feddan basis.');
      var result = window.AfroTools.feddanArea.convert(form.elements.amount.value, form.elements.direction.value, form.elements.basis.value);
      ['feddans', 'acres', 'squareMetres', 'hectares'].forEach(function (key) {
        document.getElementById(key + 'Result').textContent = format.format(result[key]);
      });
      output.hidden = false;
      status.textContent = 'Calculated using ' + format.format(Number(form.elements.basis.value)) + ' square metres per feddan. Results are rounded to six decimal places.';
    } catch (error) { status.textContent = error.message; }
  });
  form.elements.direction.addEventListener('change', function () {
    document.getElementById('amountLabel').textContent = form.elements.direction.value === 'feddan-to-acre' ? 'Area in feddans' : 'Area in acres';
    output.hidden = true;
    status.textContent = 'Enter the area and calculate.';
  });
}());
