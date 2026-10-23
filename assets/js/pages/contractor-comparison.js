(function(){
  'use strict';
  var form=document.getElementById('contractorComparison');if(!form)return;
  var ids=['employeeGross','contractorInvoice','withholdingRate'];
  var results=document.getElementById('results'),status=document.getElementById('comparisonStatus');
  var copy=document.getElementById('copyComparison'),download=document.getElementById('downloadComparison');
  var engine=window.AfroTools&&window.AfroTools.HREngine,country=form.getAttribute('data-comparison-country');
  var rule=typeof EMPLOYER_COST_RULES!=='undefined'?EMPLOYER_COST_RULES[country]:null;
  var currency=rule&&rule.currency||'Local currency',summary=null,revision=0;
  document.getElementById('comparisonCurrency').textContent=currency;
  function money(v){return currency+' '+Number(v).toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function modelDetails(gross){
    var components=rule&&rule.components||[],details=[];
    function uses(key,value){return components.some(function(component){return component[key]===value;});}
    if(uses('base','basic'))details.push('Basic salary is assumed to be 60% of gross: '+money(gross*0.6)+'.');
    if(uses('base','basic+housing+transport'))details.push('Basic, housing and transport are assumed to be 40%, 15% and 10% of gross respectively: '+money(gross*0.4)+', '+money(gross*0.15)+' and '+money(gross*0.1)+'.');
    if(uses('condition','5+employees'))details.push('The model assumes 5 or more employees for contributions with that condition.');
    if(uses('condition','payroll>500K'))details.push('The payroll-threshold model assumes 1 employee: annual payroll is this monthly gross multiplied by 12 ('+money(gross*12)+'), compared with the existing '+currency+' 500,000 threshold.');
    return details;
  }
  function errorClear(id){var el=document.getElementById(id),msg=document.getElementById(id+'Error');el.removeAttribute('aria-invalid');el.setAttribute('aria-describedby',id+'Help');msg.textContent='';msg.hidden=true;}
  function invalidate(){revision++;summary=null;results.textContent='';results.classList.remove('on');results.hidden=true;copy.disabled=true;download.disabled=true;status.textContent='Inputs changed. Compare again for updated costs.';}
  ids.forEach(function(id){function edit(){invalidate();errorClear(id);}var el=document.getElementById(id);el.addEventListener('input',edit);el.addEventListener('change',edit);});
  form.addEventListener('submit',function(event){
    event.preventDefault();invalidate();ids.forEach(errorClear);
    if(!engine){status.textContent='The calculator could not load. Reload this page to try again.';return;}
    var r=engine.contractorVsEmployee(country,document.getElementById('employeeGross').value,{contractorInvoice:document.getElementById('contractorInvoice').value,withholdingRate:document.getElementById('withholdingRate').value});
    if(r.error){status.textContent=r.error;var first;ids.forEach(function(id){if(!r.errors||!r.errors[id])return;var el=document.getElementById(id),msg=document.getElementById(id+'Error');el.setAttribute('aria-invalid','true');el.setAttribute('aria-describedby',id+'Help '+id+'Error');msg.textContent=r.errors[id];msg.hidden=false;if(!first)first=el;});if(first)first.focus();return;}
    var difference=r.savings,heading=difference>0?'Employee costs more in this model':difference<0?'Contractor invoice costs more in this model':'Same employer cost in this model';
    var hero=document.createElement('div');hero.className='hr-res-hero';var title=document.createElement('h2');title.className='hr-res-hero-label';title.textContent=heading;hero.appendChild(title);var amount=document.createElement('p');amount.className='hr-res-hero-amount';amount.textContent=money(Math.abs(difference));hero.appendChild(amount);results.appendChild(hero);
    var table=document.createElement('table');table.className='hr-summary-table';var header=table.createTHead().insertRow();['Monthly item','Employee','Contractor'].forEach(function(text){var th=document.createElement('th');th.textContent=text;header.appendChild(th);});var body=table.createTBody();
    function row(label,a,b){var line=body.insertRow();[label,a,b].forEach(function(text){line.insertCell().textContent=text;});}
    row('Gross salary / invoice',money(r.employee.grossSalary),money(r.contractor.invoiceAmount));
    row('Employer contributions in model',money(r.employee.totalEmployerContributions),'Not added to invoice');
    row('Total employer cost',money(r.employee.totalCostToCompany),money(r.contractor.totalCost));
    var lines=['Contractor vs employee monthly cost plan — '+(rule&&rule.name||country),'Currency: '+currency,'Employee gross salary: '+money(r.employee.grossSalary),'Employer contributions in existing model: '+money(r.employee.totalEmployerContributions),'Employee total employer cost: '+money(r.employee.totalCostToCompany),'Contractor invoice / total employer cost: '+money(r.contractor.invoiceAmount),heading+': '+money(Math.abs(difference))];
    if(r.contractor.withholdingAssumptionProvided){row('Withholding assumption','Not assessed',r.contractor.whtRate+'%');row('Withheld from invoice','—',money(r.contractor.whtAmount));row('Contractor take-home after assumed withholding','—',money(r.contractor.netToContractor));lines.push('Visitor withholding assumption: '+r.contractor.whtRate+'%','Withheld from invoice: '+money(r.contractor.whtAmount),'Contractor take-home after assumed withholding: '+money(r.contractor.netToContractor));}
    results.appendChild(table);
    var details=modelDetails(r.employee.grossSalary);
    if(details.length){var disclosure=document.createElement('details');disclosure.className='hr-warn hr-model-assumptions';var caption=document.createElement('summary');caption.textContent='Employer model assumptions';disclosure.appendChild(caption);var list=document.createElement('ul');list.setAttribute('style','padding-left:1.25rem');details.forEach(function(text){var item=document.createElement('li');item.textContent=text;list.appendChild(item);lines.push('Employer model assumption: '+text);});disclosure.appendChild(list);results.appendChild(disclosure);}
    var assumptions='Uses the existing country employer-contribution model; amounts may be rounded by that model. Excludes extra benefits, leave/admin costs and contractor expenses or other taxes. ';
    assumptions+=r.contractor.withholdingAssumptionProvided?'Withholding is your assumption, deducted within the invoice; it does not reduce the business invoice cost.':'Cost-only comparison: withholding and contractor take-home are not assessed. Add a rate above if needed.';
    assumptions+=' Employment classification depends on the actual working relationship, not this cost difference.';
    var note=document.createElement('p');note.className='hr-warn';note.textContent=assumptions;results.appendChild(note);lines.push(assumptions);summary=lines.join('\n');
    results.classList.add('on');results.hidden=false;copy.disabled=false;download.disabled=false;status.textContent='Comparison ready. Copy or download the inputs and assumptions.';
  });
  copy.addEventListener('click',async function(){if(!summary)return;var text=summary,version=revision;try{await navigator.clipboard.writeText(text);if(version===revision&&summary===text)status.textContent='Comparison copied.';}catch(error){if(version===revision&&summary===text)status.textContent='Copy is unavailable. Download the TXT summary instead.';}});
  download.addEventListener('click',function(){if(!summary)return;var url=URL.createObjectURL(new Blob([summary],{type:'text/plain;charset=utf-8'}));var link=document.createElement('a');link.href=url;link.download='contractor-comparison-'+country.toLowerCase()+'.txt';document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);status.textContent='TXT comparison downloaded.';});
})();
