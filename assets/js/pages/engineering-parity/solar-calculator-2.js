// Save/Share buttons - manual placement needed
(function(){
  var target = document.getElementById('resultsSection') || document.querySelector('main') || document.body;
  var div = document.createElement('div');
  div.className = 'result-actions';
  div.style.cssText = 'display:flex;gap:8px;margin-top:20px;flex-wrap:wrap';
  div.innerHTML = '<save-result-button tool-slug="solar-calculator" tool-name="Solar Calculator"></save-result-button><share-result-button tool-name="Solar Calculator" tool-slug="solar-calculator"></share-result-button>';
  target.appendChild(div);
})();
