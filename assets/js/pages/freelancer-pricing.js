(function(){
  'use strict';
  var form=document.getElementById('freelancerPlanner');if(!form)return;
  var engine=window.AfroTools&&window.AfroTools.FreelancerPricing;
  var ids=['takeHome','expenses','billableHours','reservePercent','projectHours'];
  var result=document.getElementById('results'),status=document.getElementById('plannerStatus');
  var copy=document.getElementById('copyQuote'),download=document.getElementById('downloadQuote');
  var quote=null,revision=0;
  var cc=form.getAttribute('data-planner-country'),country=form.getAttribute('data-planner-country-name');
  var reference=typeof FREELANCER_RATES!=='undefined'?FREELANCER_RATES[cc]:null;
  var countryData=typeof EMPLOYER_COST_RULES!=='undefined'?EMPLOYER_COST_RULES[cc]:null;
  var currency=(reference&&reference.currency)||(countryData&&countryData.currency)||'Local currency';
  document.getElementById('plannerCurrency').textContent=currency;
  function clearError(id){var el=document.getElementById(id),error=document.getElementById(id+'Error');el.removeAttribute('aria-invalid');el.setAttribute('aria-describedby',id+'Help');error.textContent='';error.hidden=true;}
  function invalidate(){revision++;quote=null;result.textContent='';result.hidden=true;result.classList.remove('on');copy.disabled=true;download.disabled=true;status.textContent='Inputs changed. Calculate your updated quote.';}
  ids.forEach(function(id){var el=document.getElementById(id);function edited(){invalidate();clearError(id);}el.addEventListener('input',edited);el.addEventListener('change',edited);});
  form.addEventListener('submit',function(event){
    event.preventDefault();invalidate();ids.forEach(clearError);
    if(!engine){status.textContent='The calculator could not load. Reload this page to try again.';return;}
    var values={};ids.forEach(function(id){values[id]=document.getElementById(id).value;});
    var calculated=engine.calculate(values);
    if(calculated.errors){var first;ids.forEach(function(id){if(!calculated.errors[id])return;var el=document.getElementById(id),error=document.getElementById(id+'Error');el.setAttribute('aria-invalid','true');el.setAttribute('aria-describedby',id+'Help '+id+'Error');error.textContent=calculated.errors[id];error.hidden=false;if(!first)first=el;});status.textContent='Correct the highlighted fields, then calculate.';if(first)first.focus();return;}
    quote=engine.summary(calculated,currency,country);
    var money=function(value){return currency+' '+value.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2});};
    var hero=document.createElement('div');hero.className='hr-res-hero';
    var title=document.createElement('h2');title.className='hr-res-hero-label';title.textContent='Your minimum hourly rate';hero.appendChild(title);
    var hourly=document.createElement('p');hourly.className='hr-res-hero-amount';hourly.textContent=money(calculated.hourly);hero.appendChild(hourly);
    var project=document.createElement('p');project.className='hr-warn';project.textContent='Project quote for '+calculated.inputs.projectHours+' hours: '+money(calculated.project);result.appendChild(hero);result.appendChild(project);
    var explanation=document.createElement('p');explanation.className='hr-warn';explanation.textContent='Based on '+money(calculated.inputs.takeHome)+' monthly take-home, '+money(calculated.inputs.expenses)+' expenses, '+calculated.inputs.billableHours+' billable hours/month and a '+calculated.inputs.reservePercent+'% reserve from billing. Monthly billing target: '+money(calculated.monthlyBilling)+'. This is your planning floor, not a market rate or statutory tax calculation.';result.appendChild(explanation);
    result.hidden=false;result.classList.add('on');copy.disabled=false;download.disabled=false;status.textContent='Quote ready. Copy or download your assumptions and calculation.';
  });
  copy.addEventListener('click',async function(){
    if(!quote)return;var captured=quote,version=revision;
    try{await navigator.clipboard.writeText(captured);if(version===revision&&quote===captured)status.textContent='Quote summary copied.';}
    catch(error){if(version===revision&&quote===captured)status.textContent='Copy is unavailable. Download the TXT summary instead.';}
  });
  download.addEventListener('click',function(){if(!quote)return;var url=URL.createObjectURL(new Blob([quote],{type:'text/plain;charset=utf-8'}));var a=document.createElement('a');a.href=url;a.download='freelance-quote-'+cc.toLowerCase()+'.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);status.textContent='TXT summary downloaded.';});
  var target=document.getElementById('freelancerReferences');
  if(!reference||!reference.skills){target.textContent='Use the planner above with your own costs. Country benchmark figures are not supplied here.';return;}
  var intro=document.createElement('p');intro.textContent='Existing rate-card references, separate from your quote. Reference dates are not supplied.';target.appendChild(intro);
  Object.keys(reference.skills).forEach(function(key){var skill=reference.skills[key];var title=document.createElement('h3');title.textContent=skill.label;target.appendChild(title);var table=document.createElement('table');table.className='hr-summary-table';var header=table.createTHead().insertRow();['Level','Hourly','Monthly'].forEach(function(text){var th=document.createElement('th');th.textContent=text;header.appendChild(th);});var body=table.createTBody();['junior','mid','senior'].forEach(function(level){var rate=skill[level];if(!rate)return;var row=body.insertRow();[level,rate.hourly,rate.monthly].forEach(function(value,index){var cell=row.insertCell();cell.textContent=index===0?value:(value===undefined?'—':currency+' '+Number(value).toLocaleString('en'));});});target.appendChild(table);});
})();
