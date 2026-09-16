(function () {
  'use strict';
  const engine=window.AfroTools && window.AfroTools.MinWageEngine;
  const arithmetic=window.AfroTools && window.AfroTools.minimumWageInflation;
  const root=document.getElementById('referenceInflation');
  if(!engine||!arithmetic||!root)return;
  const $=id=>document.getElementById(id);
  const format=n=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(n);
  const names=new Intl.DisplayNames(['fr'],{type:'region'});
  const uncertainty='Source et date de vérification de l’IPC non précisées dans cette série. Ces observations enregistrées ne constituent pas une mesure vérifiée du coût de la vie actuel.';
  const ns='http://www.w3.org/2000/svg';
  function svg(tag,attrs,text){const el=document.createElementNS(ns,tag);Object.entries(attrs||{}).forEach(([k,v])=>el.setAttribute(k,v));if(text!==undefined)el.textContent=text;return el;}
  function current(){
    const country=engine.getCountry($('referenceCountry').value);
    const series=country&&engine.getInflationData(country.code);
    const summary=arithmetic.summarize(series);
    if(!summary||!series.points.every(p=>Number.isFinite(p.year)&&Number.isFinite(p.nominal)&&Number.isFinite(p.cpi)))return null;
    const points=series.points.map(p=>({year:p.year,nominal:p.nominal,cpi:p.cpi,converted:arithmetic.summarize({points:[series.points[0],p]})}));
    if(points.some(p=>!p.converted))return null;
    return {country,summary,points};
  }
  function render(){
    const data=current();
    $('referenceInflationGraph').replaceChildren();$('referenceInflationRows').replaceChildren();
    $('referenceInflationCSV').disabled=!data;
    $('referenceInflationStatus').textContent='';
    $('referenceInflationBody').hidden=!data;
    if(!data){$('referenceInflationSummary').textContent='Aucune série d’inflation exploitable n’est enregistrée pour ce pays.';return null;}
    const {country,summary,points}=data;
    const change=summary.direction==='unchanged'?'aucune variation de pouvoir d’achat':(summary.direction==='gain'?'gain':'perte')+' de pouvoir d’achat de '+format(Math.abs(summary.change))+' %';
    $('referenceInflationSummary').textContent=names.of(country.code)+' : observation de '+summary.lastYear+' à '+format(summary.nominal)+' '+country.currency+', soit '+format(summary.real)+' aux prix de '+summary.firstYear+' — '+change+'. '+uncertainty;
    $('referenceInflationUnits').textContent='Montants enregistrés en '+country.currency+'. Courbe pleine : salaire nominal ; courbe en pointillés : valeur aux prix de '+summary.firstYear+'. Référence nationale historique ; la sélection d’un secteur ne modifie pas cette série.';
    const graph=$('referenceInflationGraph');
    const chart=svg('svg',{viewBox:'0 0 640 280',role:'img','aria-labelledby':'referenceInflationChartTitle referenceInflationChartDescription'});
    chart.append(svg('title',{id:'referenceInflationChartTitle'},'Salaire nominal et pouvoir d’achat enregistré — '+names.of(country.code)));
    chart.append(svg('desc',{id:'referenceInflationChartDescription'},'Observations de '+summary.firstYear+' à '+summary.lastYear+'. Les valeurs et indices sont également fournis dans le tableau. '+uncertainty));
    const max=Math.max(...points.flatMap(p=>[p.nominal,p.converted.real]),1);
    const x=i=>85+i*525/(points.length-1),y=n=>225-n/max*185;
    chart.append(svg('path',{d:'M85 35 V225 H615',fill:'none',stroke:'currentColor'}));
    for(const [value,label] of [[0,'0'],[max,format(max)]])chart.append(svg('text',{x:79,y:y(value)+4,'text-anchor':'end',fill:'currentColor','font-size':20},label));
    for(const [i,anchor] of [[0,'start'],[points.length-1,'end']])chart.append(svg('text',{x:x(i),y:247,'text-anchor':anchor,fill:'currentColor','font-size':20},points[i].year));
    for(const [key,cls,dash] of [['nominal','mw-inflation-nominal',null],['real','mw-inflation-real','7 4']]){
      const line=svg('polyline',{points:points.map((p,i)=>x(i)+','+y(key==='nominal'?p.nominal:p.converted.real)).join(' '),fill:'none','stroke-width':3,class:cls});if(dash)line.setAttribute('stroke-dasharray',dash);chart.append(line);
    }
    graph.append(chart);
    for(const point of points){const row=document.createElement('tr');for(const value of [point.year,format(point.nominal),format(point.cpi),format(point.converted.real)]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);} $('referenceInflationRows').append(row);}
    return data;
  }
  $('referenceCountry').addEventListener('change',render);
  $('referenceReset').addEventListener('click',render);
  $('referenceInflationCSV').addEventListener('click',()=>{
    const data=render();if(!data)return;
    const rows=[['Pays','Devise','Année observée','Salaire nominal enregistré','Indice IPC enregistré','Valeur aux prix de l’année de base','Année de base','Limites de source']];
    for(const p of data.points)rows.push([names.of(data.country.code),data.country.currency,p.year,p.nominal,p.cpi,p.converted.real,data.summary.firstYear,uncertainty]);
    const csv=rows.map(row=>row.map(value=>'"'+String(value).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='afrotools-inflation-salaire-'+data.country.code.toLowerCase()+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    $('referenceInflationStatus').textContent='CSV de la série sélectionnée préparé avec les années, indices et limites de source.';
  });
  render();
})();
