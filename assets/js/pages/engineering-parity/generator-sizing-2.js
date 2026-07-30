(function(){
  var target = document.getElementById('results');
  if (!target) return;
  var div = document.createElement('div');
  div.className = 'result-actions';
  div.style.cssText = 'display:flex;gap:8px;margin-top:20px;flex-wrap:wrap';
  div.innerHTML = '<save-result-button tool-slug="generator-sizing" tool-name="Generator Sizing"></save-result-button><share-result-button tool-name="Generator Sizing" tool-slug="generator-sizing"></share-result-button>';
  target.appendChild(div);
})();
