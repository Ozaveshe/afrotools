(function(root){'use strict';
 root.AfroTools=root.AfroTools||{};
 function summary(){
  var r=root.FARM_BUDGET_LAST_RESULT;if(!r||!r.ok)return null;
  var currency=r.currency.code,amount=function(v){return currency+' '+new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(v);};
  var lines=['AfroTools - Farm Budget planning report','Country: '+r.input.countryCode,'Currency: '+currency,'Area: '+r.totals.area+' ha','Start month: '+r.input.startMonth,'Land: '+r.input.landMode+'; labour: '+r.input.laborMode+'; mechanisation: '+r.input.mechanizationMode,'Finance: '+r.input.financeMode];
  if(r.input.loanRate!==undefined)lines.push('Annual loan rate: '+r.input.loanRate+'%; term: '+r.input.loanTerm+' months');
  if(r.input.rentOverride!==undefined)lines.push('Entered rent per ha: '+amount(r.input.rentOverride));
  lines.push('Fertilizer per kg: '+amount(r.fertilizerPricePerKg)+' ('+r.fertilizerPriceSource+')','','Crop assumptions:');
  r.cropLines.forEach(function(c,i){var input=r.input.crops[i];lines.push((i+1)+'. '+c.crop.replace(/_/g,' ')+': '+c.area+' ha; modeled harvest: '+c.yieldTonnes+' tonnes','Selling price per tonne: '+amount(c.marketPricePerTonne)+' ('+c.priceSources.market+')');if(input.seedPricePerKg!==undefined)lines.push('Entered seed price per kg: '+amount(input.seedPricePerKg));});
  lines.push('','Budget breakdown:');['seed','fertilizer','chemicals','labor','mechanization','land','transport'].forEach(function(k){lines.push(k+': '+amount(r.totals[k]));});
  lines.push('Contingency: '+amount(r.contingency),'Loan interest: '+amount(r.loanInterest),'Total budget: '+amount(r.totalBudget),'Modeled revenue: '+amount(r.totals.revenue),'Modeled profit: '+amount(r.profit),'ROI: '+r.roi.toFixed(1)+'%','','Six-month cash allocation:');
  r.cashflow.forEach(function(m){lines.push('Calendar month '+(m.monthIndex+1)+': '+amount(m.value));});
  lines.push('Fertilizer spending is split equally between months 3 and 4 of this cash plan. This is not an agronomic application schedule.','', 'Aggregate break-even: '+r.breakEvenYieldTonnesHa.toFixed(2)+' tonnes/ha; '+amount(r.breakEvenRevenuePerHa)+'/ha revenue. Crop-output proportions and prices stay constant; budget is fixed. This is not a yield target for each crop.','','Planning assumptions only. User-entered prices are not independently verified; country references and other model assumptions are static. Verify local prices, yields, timing, finance terms and costs before using this budget. No currency conversion applied.','Privacy: generated locally; no farm inputs sent by this report.');
  return lines.join('\n');
 }
 root.AfroTools.farmBudgetSummary=summary;
 root.addEventListener('beforeprint',function(){var result=document.getElementById('results'),report=document.getElementById('farm-budget-print-report');if(!report){report=document.createElement('pre');report.id='farm-budget-print-report';result.appendChild(report);}report.textContent=summary()||'';});
})(window);
