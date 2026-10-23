(function(){'use strict';var form=document.querySelector('[data-sw-fintech-payment-form]');if(!form)return;form.tabIndex=-1;var cardShare=form.querySelector('#pos-card-pct');if(cardShare)cardShare.step='0.01';var result=form.querySelector('.results'),error=form.querySelector('.form-error');function clear(){if(result)result.classList.remove('on');if(error)error.textContent='';}form.addEventListener('input',clear);form.addEventListener('change',clear);form.addEventListener('keydown',function(event){if(event.key==='Enter'&&event.target.tagName!=='TEXTAREA'){event.preventDefault();form.requestSubmit();}});form.addEventListener('submit',function(event){event.preventDefault();clear();if(!form.checkValidity()){form.reportValidity();return;}var calculate=window[form.getAttribute('data-calculate')];if(typeof calculate==='function')calculate();});}());

// Local Swahili exports for the gateway comparison; calculation stays shared.
(function mountSwGatewayExports() {
  'use strict';
  if (document.documentElement.lang !== 'sw' ||
      document.body.getAttribute('data-sw-fintech-payment-app') !== 'payment-gateway' ||
      window.location.pathname !== '/sw/zana/ada-za-payment-gateway/') return;
  var form = document.querySelector('[data-sw-fintech-payment-form]');
  var result = document.getElementById('pg-results');
  if (!form || !result || document.querySelector('[data-sw-pg-actions]')) return;

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  var actions = element('section', 'card');
  actions.setAttribute('data-sw-pg-actions', '');
  actions.setAttribute('aria-label', 'Hifadhi ulinganisho wa ada');
  actions.hidden = true;
  actions.appendChild(element('h2', '', 'Hifadhi ulinganisho huu'));
  actions.appendChild(element('p', '', 'Pakua TXT au nakili matokeo ya sasa. Hakuna taarifa zinazotumwa kwa seva.'));
  var buttons = element('div', 'form-grid');
  var copy = element('button', 'btn-calc', 'Nakili matokeo');
  var download = element('button', 'btn-calc', 'Pakua TXT');
  copy.type = download.type = 'button';
  copy.setAttribute('data-sw-pg-copy', '');
  download.setAttribute('data-sw-pg-download', '');
  buttons.appendChild(copy);
  buttons.appendChild(download);
  actions.appendChild(buttons);
  var status = element('p', 'field-help');
  status.setAttribute('data-sw-pg-status', '');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  actions.appendChild(status);
  // Outside the form so its Enter-to-calculate handler cannot intercept exports.
  form.insertAdjacentElement('afterend', actions);

  var comparisonRevision = 0;
  var copyRevision = 0;

  function value(id) { return document.getElementById(id).value; }
  function currentComparison() {
    if (!result.classList.contains('on')) return '';
    var currency = value('pg-currency');
    var country = document.getElementById('context-country');
    var countryName = country.selectedOptions.length ? country.selectedOptions[0].textContent : country.value;
    var lines = [
      'Kilinganisha ada za njia za malipo',
      'Nchi ya biashara: ' + countryName,
      'Sarafu: ' + currency,
      'Thamani ya wastani ya muamala: ' + currency + ' ' + value('pg-avg-txn'),
      'Idadi ya miamala kwa mwezi: ' + value('pg-monthly-txns'),
      '', 'Masharti ya ofa yaliyoingizwa:'
    ];
    for (var i = 1; i <= 3; i++) {
      lines.push(value('pg-name-' + i) + ': ' + value('pg-rate-' + i) + '%; ada tambarare ' +
        currency + ' ' + value('pg-flat-' + i) + '; kikomo ' + currency + ' ' + value('pg-cap-' + i));
    }
    lines.push('Kikomo cha 0 kinamaanisha hakuna kikomo.', '', result.innerText.trim(), '');
    var assumptions = document.querySelector('.info-box p');
    if (assumptions) lines.push(assumptions.innerText.trim());
    return lines.join('\n');
  }
  function sync() {
    var active = result.classList.contains('on');
    actions.hidden = !active;
    copy.disabled = download.disabled = !active;
    status.textContent = active ? 'Matokeo ya sasa yako tayari kunakiliwa au kupakuliwa.' : 'Linganisha ofa ili kuhifadhi matokeo ya sasa.';
  }
  function comparisonChanged() {
    comparisonRevision++;
    copyRevision++;
    sync();
  }
  copy.addEventListener('click', function () {
    var text = currentComparison();
    if (!text) { sync(); return; }
    var revision = comparisonRevision;
    var attempt = ++copyRevision;
    function stillCurrent() {
      return revision === comparisonRevision && attempt === copyRevision && text === currentComparison();
    }
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      status.textContent = 'Kunakili hakupatikani kwenye kivinjari hiki. Tumia Pakua TXT.';
      return;
    }
    navigator.clipboard.writeText(text).then(function () {
      if (stillCurrent()) status.textContent = 'Matokeo yamenakiliwa.';
    }).catch(function () {
      if (stillCurrent()) status.textContent = 'Kunakili hakukufaulu. Tumia Pakua TXT.';
    });
  });
  download.addEventListener('click', function () {
    var text = currentComparison();
    if (!text) { sync(); return; }
    copyRevision++;
    var url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    var link = element('a');
    link.href = url;
    link.download = 'payment-gateway-ulinganisho.txt';
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    window.setTimeout(function () { link.remove(); URL.revokeObjectURL(url); }, 1000);
    status.textContent = 'Faili la TXT limeandaliwa kwenye kifaa hiki.';
  });
  form.addEventListener('input', comparisonChanged);
  form.addEventListener('change', comparisonChanged);
  form.addEventListener('submit', comparisonChanged);
  if (window.MutationObserver) new MutationObserver(comparisonChanged).observe(result, { attributes: true, attributeFilter: ['class'] });
  sync();
})();
