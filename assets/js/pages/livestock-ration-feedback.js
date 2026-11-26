(function (root) {
  'use strict';
  var labels = {
    en: {main:'Main ration',alt:'Alternative ration',animal:'per animal/day',herd:'herd/day',over:'over budget',under:'under budget',exact:'at budget',none:'no budget entered',budget:'budget',gap:'below target',met:'target met',cp:'crude protein (CP)',tdn:'total digestible nutrients (TDN)'},
    fr: {main:'Ration principale',alt:'Ration alternative',animal:'par animal et par jour',herd:'troupeau par jour',over:'au-dessus du budget',under:'sous le budget',exact:'au budget',none:'aucun budget saisi',budget:'budget',gap:'sous la cible',met:'cible atteinte',cp:'protéines brutes (PB)',tdn:'nutriments digestibles totaux (TDN)'},
    sw: {main:'Mgao mkuu',alt:'Mgao mbadala',animal:'kwa mnyama kwa siku',herd:'kwa kundi kwa siku',over:'zaidi ya bajeti',under:'chini ya bajeti',exact:'sawa na bajeti',none:'bajeti haijawekwa',budget:'bajeti',gap:'chini ya lengo',met:'lengo limetimizwa',cp:'protini ghafi (CP)',tdn:'jumla ya virutubisho vinavyomeng’enyeka (TDN)'}
  };
  function describe(result, locale) {
    var t = labels[locale] || labels.en;
    var format = new Intl.NumberFormat(locale, {minimumFractionDigits:2, maximumFractionDigits:2});
    function money(value) { return result.symbol + ' ' + format.format(value); }
    function cost(label, value, budget) {
      if (budget === null) return label + ': ' + money(value) + ' (' + t.none + ')';
      var cents = Math.round(value * 100) - Math.round(budget * 100);
      var difference = cents === 0 ? t.exact : money(Math.abs(cents) / 100) + ' ' + (cents > 0 ? t.over : t.under);
      return label + ': ' + money(value) + ' (' + t.budget + ' ' + money(budget) + ', ' + difference + ')';
    }
    function nutrient(label, supplied, target) {
      return label + ': ' + supplied + ' / ' + target + ' g (' + (supplied < target ? (target - supplied) + ' g ' + t.gap : t.met) + ')';
    }
    function describeRation(label, perAnimal, herd, cp, tdn) {
      var budget = result.dailyBudgetPerAnimal;
      return label + ' — ' + [cost(t.animal,perAnimal,budget),cost(t.herd,herd,budget === null ? null : budget * result.numAnimals),
        nutrient(t.cp,cp,result.req.cp_g),nutrient(t.tdn,tdn,result.req.tdn_g)].join(' · ');
    }
    return [describeRation(t.main,result.costs.dailyPerAnimal,result.costs.dailyTotal,result.prov.cp_g,result.prov.tdn_g),
      describeRation(t.alt,result.alt.dailyCost,result.alt.dailyTotal,result.alt.cp_g,result.alt.tdn_g)];
  }
  function render(container, result, locale) {
    var block = container.querySelector('.ration-feedback');
    if (!block) { block = document.createElement('div'); block.className = 'ration-feedback'; container.prepend(block); }
    block.replaceChildren();
    describe(result,locale).forEach(function(line){ var p = document.createElement('p'); p.textContent = line; block.appendChild(p); });
  }
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.LivestockRationFeedback = {describe:describe,render:render};
})(window);
