// Save/Share buttons — manual placement needed
(function(){
  var containers = document.querySelectorAll('.card, .tool-card, .calculator-card, [class*="result"]');
  var target = containers.length > 0 ? containers[containers.length - 1] : document.querySelector('main') || document.body;
  var div = document.createElement('div');
  div.className = 'result-actions';
  div.style.cssText = 'display:flex;gap:8px;margin-top:20px;flex-wrap:wrap';
  div.innerHTML = '<save-result-button tool-slug="structural-calc" tool-name="Structural Calc"></save-result-button><share-result-button tool-name="Structural Calc" tool-slug="structural-calc"></share-result-button>';
  target.appendChild(div);
})();
