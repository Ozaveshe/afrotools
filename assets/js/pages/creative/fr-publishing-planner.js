(() => {
  'use strict';
  const form = document.querySelector('[data-fr-creative-native]');
  const fields = form.elements;
  const cost = form.dataset.frCreativeNative === 'book-publishing-cost';
  const result = document.querySelector('#results');
  const currency = {NG:'NGN',KE:'KES',ZA:'ZAR',GH:'GHS',EG:'EGP'};
  const money = (n, iso='USD') => n.toLocaleString('fr',{style:'currency',currency:iso,currencyDisplay:'code'});
  function refresh() {
    result.hidden = true;
    document.querySelector('#copied').textContent = '';
    if (cost) {
      fields.printCost.required = Number(fields.printQty.value) > 0;
      fields.printQty.required = Number(fields.printCost.value) > 0;
    } else {
      const printed = fields.format.value !== 'ebook';
      fields.pages.closest('label').hidden = !printed;
      fields.pages.disabled = !printed;
      fields.pages.required = printed;
    }
  }
  function entry(tag, text) {
    const node = document.createElement(tag);
    node.textContent = text;
    return node;
  }
  form.addEventListener('input',refresh);
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const iso = currency[data.country];
    const stats = result.querySelector('dl');
    const list = result.querySelector('ul');
    stats.replaceChildren();
    list.replaceChildren();
    const stat = (key,label,value) => {
      const item = entry('dd',value);
      item.dataset.value = key;
      stats.append(entry('dt',label),item);
    };
    if (cost) {
      const r = window.AfroTools.BookPublishingCostEngine.calculate({...data,retailPrice:data.price,monthlySales:data.monthly});
      stat('total','Budget total',money(r.totalUSD));
      stat('local','Budget au taux du modèle (1 USD = '+r.rate.toLocaleString('fr')+' '+iso+')',money(r.totalLocal,iso));
      stat('editing','Révision et correction',money(r.editingTotal));
      stat('setup','Couverture, mise en page et ISBN',money(r.setupTotal-r.editingTotal));
      stat('print','Impression du tirage',money(r.printTotal));
      stat('perCopy','Droits numériques simulés par copie',money(r.royaltyPerCopy));
      stat('breakEven','Exemplaires à vendre pour couvrir les coûts',String(r.breakEven));
      r.projections.forEach(p=>list.append(entry('li','Année '+p.year+' · '+p.copies.toLocaleString('fr')+' exemplaires · '+money(p.net)+' de revenu après frais budgétés.')));
    } else {
      const r = window.AfroTools.SelfPublishingRoyaltyEngine.calculate(data);
      const best = r.best.perCopy*r.monthly;
      stat('perCopy','Revenu maximal simulé par exemplaire',money(r.best.perCopy));
      stat('monthly','Revenu mensuel maximal simulé',money(best));
      stat('annual','Projection sur douze mois',money(best*12));
      stat('local','Projection mensuelle au taux du modèle (1 USD = '+r.rate.toLocaleString('fr')+' '+iso+')',money(best*r.rate,iso));
      if (r.format!=='ebook') stat('print','Coût d’impression simulé par exemplaire',money(r.format==='hardcover'?r.hardcoverPrint:r.printCost));
      const seen = new Set();
      r.platforms.forEach(p=>{
        const detail = (p.rate*100).toFixed(0)+' % · '+money(p.perCopy)+' par exemplaire · '+money(p.perCopy*r.monthly)+' par mois';
        if (!seen.has(detail)) list.append(entry('li',detail));
        seen.add(detail);
      });
    }
    result.hidden = false;
    result.scrollIntoView({block:'nearest'});
  });
  document.querySelector('#copy').addEventListener('click',async()=>{
    const status=document.querySelector('#copied');
    try {
      await navigator.clipboard.writeText(result.querySelector('dl').innerText+'\n'+result.querySelector('ul').innerText);
      status.textContent='Résultat copié.';
    } catch {status.textContent='Sélectionnez le résultat pour le copier.';}
  });
  refresh();
})();
