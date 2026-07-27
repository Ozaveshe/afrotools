(function () {
  'use strict';

  var configElement = document.getElementById('gv-config');
  var form = document.getElementById('gv-form');
  if (!configElement || !form) return;

  var config;
  try {
    config = JSON.parse(configElement.textContent);
  } catch (_) {
    document.getElementById('gv-form-status').textContent = 'This verification planner could not load its route contract.';
    return;
  }

  var country = document.getElementById('gv-country');
  var task = document.getElementById('gv-task');
  var checks = document.getElementById('gv-checks');
  var result = document.getElementById('gv-result');
  var status = document.getElementById('gv-form-status');

  country.innerHTML = config.sources.map(function (source) {
    return '<option value="' + source.code + '">' + source.country + '</option>';
  }).join('');
  task.innerHTML = config.tasks.map(function (item) {
    return '<option value="' + item.id + '">' + item.label + '</option>';
  }).join('');
  checks.innerHTML = config.checks.map(function (item) {
    return '<label class="gv-check"><input type="checkbox" name="gv-check" value="' + item.id + '"><span>' + item.label + '</span></label>';
  }).join('');

  function selectedSource() {
    return config.sources.find(function (source) { return source.code === country.value; }) || config.sources[0];
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var selected = Array.from(form.querySelectorAll('[name=gv-check]:checked')).map(function (input) { return input.value; });
    var gaps = config.checks.filter(function (item) { return selected.indexOf(item.id) === -1; });
    var source = selectedSource();
    document.getElementById('gv-gap-count').textContent = String(gaps.length);
    document.getElementById('gv-route-summary').textContent = source.country + ' - ' + task.selectedOptions[0].textContent + '. You marked ' + selected.length + ' of ' + config.checks.length + ' official checks as ready.';
    document.getElementById('gv-gap-list').innerHTML = (gaps.length ? gaps : [{ prompt: config.completePrompt }]).map(function (item) {
      return '<li>' + item.prompt + '</li>';
    }).join('');
    document.getElementById('gv-official-link').textContent = 'Open ' + source.authority;
    document.getElementById('gv-official-link').href = source.url;
    document.getElementById('gv-source-note').textContent = config.sourceBoundary;
    result.classList.add('gv-on');
    status.textContent = config.successStatus;
  });

  form.addEventListener('reset', function () {
    setTimeout(function () {
      country.value = config.sources[0].code;
      task.value = config.tasks[0].id;
      result.classList.remove('gv-on');
      status.textContent = 'Planner reset.';
      country.focus();
    }, 0);
  });
}());
