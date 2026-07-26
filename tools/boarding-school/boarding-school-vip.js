(function(){
'use strict';
var engine=window.BoardingSchoolEngine,current=null,$=function(id){return document.getElementById(id);};
function value(id){return $(id).value.trim();}
function label(){return value('bs-label').slice(0,12);}
function money(n){return(label()?label()+' ':'')+Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
function cell(row,text,tag){var el=document.createElement(tag||'td');el.textContent=text;row.appendChild(el);}
function metric(parent,title,val,note){var card=document.createElement('div');card.className='bs-metric';[['span',title],['strong',val],['small',note]].forEach(function(part){card.appendChild(Object.assign(document.createElement(part[0]),{textContent:part[1]}));});parent.appendChild(card);}
function inputs(){return{years:value('bs-years'),terms:value('bs-terms'),months:value('bs-months'),trips:value('bs-trips'),tuitionTerm:value('bs-tuition'),boardingTerm:value('bs-boarding'),mealsTerm:value('bs-meals'),extrasTerm:value('bs-term-extra'),monthly:value('bs-monthly'),tripCost:value('bs-trip-cost'),annual:value('bs-annual'),startup:value('bs-startup'),inflation:value('bs-inflation'),contingency:value('bs-contingency'),dayAnnual:value('bs-day')};}
function render(plan){
 $('bs-result-summary').textContent='Full '+plan.years+'-year scenario using '+plan.terms+' term(s), '+plan.months+' spending month(s) and '+plan.trips+' chargeable trip(s) per year.';
 var metrics=$('bs-metrics');metrics.replaceChildren();
 metric(metrics,'First-year total',money(plan.schedule[0].total),'Includes setup and contingency');
 metric(metrics,'Full-duration total',money(plan.total),plan.years+' years');
 metric(metrics,'Average per year',money(plan.averageAnnual),'Full total ÷ years');
 metric(metrics,'Contingency included',money(plan.totalContingency),(plan.contingencyRate*100).toFixed(1)+'% each year');
 if(plan.difference!==null)metric(metrics,'Boarding minus entered day-school total',money(plan.difference),plan.difference>=0?'Boarding scenario is higher':'Boarding scenario is lower');
 var body=$('bs-schedule');body.replaceChildren();plan.schedule.forEach(function(item){var row=document.createElement('tr');cell(row,item.year);cell(row,money(item.recurring));cell(row,money(item.oneTime));cell(row,money(item.contingency));cell(row,money(item.total));body.appendChild(row);});
 var breakdown=$('bs-breakdown');breakdown.replaceChildren();var title=document.createElement('h3');title.textContent='Year-one recurring-cost formula';var list=document.createElement('ul');
 [['Term costs',money(plan.termSubtotal)+' × '+plan.terms+' terms'],['Monthly costs',money(plan.inputs.monthly)+' × '+plan.months+' months'],['Transport',money(plan.inputs.tripCost)+' × '+plan.trips+' trips'],['Annual charges',money(plan.inputs.annual)+' × 1 year'],['One-time setup',money(plan.startup)+' in year one'],['Inflation assumption',(plan.inflation*100).toFixed(1)+'% on later recurring costs']].forEach(function(item){var li=document.createElement('li');li.textContent=item[0]+': '+item[1];list.appendChild(li);});breakdown.append(title,list);
 $('bs-result').hidden=false;$('bs-result').focus();
}
function calculate(event){if(event)event.preventDefault();$('bs-error').textContent='';$('bs-status').textContent='';try{current=engine.calculate(inputs());render(current);}catch(error){current=null;$('bs-result').hidden=true;$('bs-error').textContent=error.message;$('bs-error').focus();}}
function report(){if(!current)calculate();if(!current)return'';var p=current;var lines=['Boarding school full-cost scenario - AfroTools','Currency / unit: '+(label()||'not specified'),'Years: '+p.years,'Terms per year: '+p.terms,'Spending months per year: '+p.months,'Trips per year: '+p.trips,'Inflation assumption: '+(p.inflation*100).toFixed(1)+'%','Contingency: '+(p.contingencyRate*100).toFixed(1)+'%','','Period inputs','- Tuition/school fees per term: '+money(p.inputs.tuitionTerm),'- Boarding/accommodation per term: '+money(p.inputs.boardingTerm),'- Meals per term: '+money(p.inputs.mealsTerm),'- Levies/extras per term: '+money(p.inputs.extrasTerm),'- Pocket money/supplies per month: '+money(p.inputs.monthly),'- Transport per trip: '+money(p.inputs.tripCost),'- Annual charges: '+money(p.inputs.annual),'- One-time setup: '+money(p.inputs.startup),'','Results','- First-year total: '+money(p.schedule[0].total),'- Full-duration total: '+money(p.total),'- Average per year: '+money(p.averageAnnual),'- Contingency included: '+money(p.totalContingency)];
 if(p.difference!==null)lines.push('- Entered day-school full-duration total: '+money(p.dayTotal),'- Boarding minus day-school scenario: '+money(p.difference));
 lines.push('','Year schedule');p.schedule.forEach(function(y){lines.push('- Year '+y.year+': recurring '+money(y.recurring)+', one-time '+money(y.oneTime)+', contingency '+money(y.contingency)+', total '+money(y.total));});
 lines.push('','Planning scenario only. Confirm every fee, inclusion, payment date, deposit, refund rule and repeating cost with the school. Inflation and contingency are family assumptions, not a forecast or quote.');return lines.join('\n');}
function copy(){var text=report();if(!text)return;navigator.clipboard.writeText(text).then(function(){$('bs-status').textContent='Report copied.';}).catch(function(){$('bs-status').textContent='Copy is unavailable. Download the TXT report instead.';});}
function download(){var text=report();if(!text)return;var url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));var a=document.createElement('a');a.href=url;a.download='boarding-school-full-cost-scenario.txt';a.click();URL.revokeObjectURL(url);$('bs-status').textContent='TXT report downloaded.';}
function clear(){['bs-tuition','bs-boarding','bs-meals','bs-term-extra','bs-monthly','bs-trip-cost','bs-annual','bs-startup','bs-day'].forEach(function(id){$(id).value='0';});$('bs-result').hidden=true;$('bs-error').textContent='';$('bs-status').textContent='';current=null;$('bs-tuition').focus();}
$('bs-form').addEventListener('submit',calculate);$('bs-clear').addEventListener('click',clear);$('bs-copy').addEventListener('click',copy);$('bs-download').addEventListener('click',download);$('bs-print').addEventListener('click',function(){if(report())window.print();});
}());
