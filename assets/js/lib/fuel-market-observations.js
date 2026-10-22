(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.AfroTools=root.AfroTools||{};root.AfroTools.FuelMarketObservations=api;}}(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function date(value){var parsed=/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value||'')?Date.parse(value):NaN;return Number.isFinite(parsed)&&new Date(parsed).toISOString().slice(0,10)===String(value).slice(0,10)?parsed:NaN;}
 function status(record,nowValue,maxAge){
  var now=date(nowValue||new Date().toISOString()),effective=date(record&&record.effective_date),verified=date(record&&record.last_verified_at),end=date(record&&record.valid_to);
  var valid=Boolean(record&&['petrol','diesel'].includes(record.fuel_type)&&Number.isFinite(Number(record.price))&&Number(record.price)>0&&Number(record.price)<=10000000&&/^[A-Z]{3}$/.test(record.currency||'')&&record.unit==='litre'&&/^https:\/\/[^\s]+$/.test(record.source_url||'')&&record.source_name&&Number.isFinite(now)&&Number.isFinite(effective)&&Number.isFinite(verified)&&effective<=now&&verified<=now&&(!record.valid_to||Number.isFinite(end)));
  var age=valid?Math.floor((now-effective)/86400000):null;
  var historical=valid&&((Number.isFinite(end)&&now>end+86400000)||age>(Number(maxAge)||45));
  return {valid:valid,available:valid&&!historical,historical:historical,stale:historical,ageDays:age,basis:!valid?'unavailable':historical?'historical-estimate':record.date_basis==='observation'?'dated-observation':'market-reference'};
 }
 function merge(markets,latest,nowValue){
  var rows=JSON.parse(JSON.stringify(markets||[]));
  (latest&&Array.isArray(latest.countries)?latest.countries:[]).forEach(function(row){
   if(!/^[A-Z]{2}$/.test(row.code||'')||!row.name)return;
   var fuels=['petrol','diesel'].map(function(type){
    var item=row[type],url=row.official_verified===true?row.official_source_url:row.source_url;
    // A dated source observation is not a newly effective tariff or a station quote.
    var record={fuel_type:type,price:item&&item.price,currency:row.currency,unit:item&&['liter','litre'].includes(item.unit)?'litre':item&&item.unit,effective_date:row.last_updated,last_verified_at:row.last_updated,date_basis:'observation',source_name:row.official_verified===true?'Official source observation':'GlobalPetrolPrices country observation',source_url:url,confidence:row.official_verified===true?'high':'low',notes:'Country-level observation dated '+row.last_updated+'. Effective tariff date is not supplied. Confirm the local pump price.'};
    return status(record,nowValue).valid?record:null;
   }).filter(Boolean);
   if(!fuels.length)return;
   var existing=rows.find(function(m){return m.country_code===row.code&&m.granularity==='national';});
   if(existing){fuels.forEach(function(record){var index=existing.fuels.findIndex(function(r){return r.fuel_type===record.fuel_type;});var old=existing.fuels[index];if(!old||date(record.last_verified_at)>date(old.last_verified_at)){if(old)record.previous_record=old;if(index<0)existing.fuels.push(record);else existing.fuels[index]=record;}});}
   else rows.push({market_id:row.code.toLowerCase()+'-national-observation',country_code:row.code,country_name:row.name,locality_name:row.name,granularity:'national',latitude:null,longitude:null,coverage_note:'Country benchmark; no city or station coverage is implied.',fuels:fuels});
  });
  return rows;
 }
 function priceContext(market,record,basis){return {id:market.market_id,name:market.locality_name,countryCode:market.country_code,granularity:market.granularity,price:record.price,currency:record.currency,effectiveDate:record.effective_date,dateBasis:record.date_basis||'effective',lastVerifiedAt:record.last_verified_at,validTo:record.valid_to||null,sourceName:record.source_name,sourceUrl:record.source_url,priceBasis:basis,priceKind:record.price_kind||'country-benchmark',notes:record.notes||''};}
 return {status:status,merge:merge,priceContext:priceContext};
}));
