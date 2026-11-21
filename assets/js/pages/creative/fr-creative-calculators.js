(() => {
  'use strict';
  const form=document.querySelector('form[data-fr-creative-native]');
  const results=document.querySelector('#results');
  const stats=results.querySelector('dl');
  const status=results.querySelector('[role=status]');
  const currency={NG:'NGN',KE:'KES',ZA:'ZAR',GH:'GHS',EG:'EGP',TZ:'TZS'};
  const number=n=>n.toLocaleString('fr',{maximumFractionDigits:2});
  const money=(n,c='USD')=>n.toLocaleString('fr',{style:'currency',currency:c,currencyDisplay:'code'});
  const engine=window.AfroTools;
  function metric(key,label,value) {
    const dt=document.createElement('dt'),dd=document.createElement('dd');
    dt.textContent=label; dd.textContent=value; dd.dataset.value=key; stats.append(dt,dd);
  }
  function engagement(data) {
    const r=engine.EngagementRateEngine.calculate(data);
    metric('rate','Taux d’engagement par publication',number(r.rate)+' %');
    metric('interactions','Interactions moyennes par publication',number(r.interactions));
    metric('followers','Abonnés',number(r.followers));
    metric('benchmark','Repère moyen intégré pour '+r.benchmark.platform,number(r.benchmark.average)+' %');
  }
  function podcast(data) {
    const r=engine.PodcastMonetizationEngine.calculate(data);
    metric('total','Revenu mensuel simulé',money(r.total));
    metric('annual','Projection annuelle',money(r.total*12));
    metric('local','Projection mensuelle au taux du modèle (1 USD = '+number(r.rate)+' '+currency[data.country]+')',money(r.total*r.rate,currency[data.country]));
    metric('downloads','Téléchargements par épisode',number(r.downloadsPerEpisode));
    const streams=['Publicités avant l’épisode','Publicités pendant l’épisode','Publicités après l’épisode','Partenariats directs','Contributions des auditeurs','Produits dérivés'];
    r.streams.forEach((s,i)=>metric('stream-'+i,streams[i],money(s.monthly)));
  }
  function photo(data) {
    const r=engine.PhotographyPricingEngine.calculate(data),fmt=n=>money(n,currency[data.country]);
    metric('session','Tarif simulé de la séance',fmt(r.sessionPrice));
    metric('hourly','Tarif par heure de prise de vue et de retouche',fmt(r.hourlyRate));
    metric('dailyCost','Loyer et amortissement par jour travaillé',fmt(r.dailyCost));
    metric('dayRate','Tarif pour huit heures de prise de vue',fmt(r.dayRate));
    metric('annual','Projection annuelle du modèle',fmt(r.annual));
  }
  form.addEventListener('input',()=>{
    results.hidden=true;status.textContent='';
    if(form.elements.patrons)form.elements.patronFee.required=Number(form.elements.patrons.value)>0;
  });
  form.addEventListener('submit',event=>{
    event.preventDefault();if(!form.reportValidity())return;
    stats.replaceChildren();
    const data=Object.fromEntries(new FormData(form));
    ({'engagement-rate':engagement,'podcast-monetization':podcast,'photography-pricing':photo})[form.dataset.frCreativeNative](data);
    results.hidden=false;results.scrollIntoView({block:'nearest'});
  });
  results.querySelector('button').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(stats.innerText);status.textContent='Résultat copié.';}
    catch{status.textContent='Sélectionnez le résultat pour le copier.';}
  });
})();
