(function(){
  var target = document.getElementById('resultCard');
  if (!target) return;
  var div = document.createElement('div');
  div.className = 'result-actions';
  div.style.cssText = 'display:flex;gap:8px;margin-top:20px;flex-wrap:wrap';
  div.innerHTML = '<save-result-button tool-slug="roof-calculator" tool-name="Roof Calculator"></save-result-button><share-result-button tool-name="Roof Calculator" tool-slug="roof-calculator"></share-result-button>';
  target.appendChild(div);
})();
