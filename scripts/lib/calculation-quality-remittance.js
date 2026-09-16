'use strict';
const path=require('path');
const artifact='engines/remittance-quote-comparator-engine.js',id='formula-engines-remittance-quote-comparator-engine';
const source={registryId:null,title:'User-entered checked quotes; Unicode CLDR supplies localized region names only',url:'https://www.unicode.org/cldr/charts/48/summary/fr.html',kind:'user-entered-values-and-locale-reference',authorityStatus:'source-reviewed'};
function metadata(file){return file!==artifact?{}:{sources:[source],lastVerified:'2026-09-16',verificationBasis:'Synthetic arithmetic and corridor tests; no current provider quote, tariff, eligibility or exchange-rate verification.',applicablePopulation:'Users comparing two or three independently checked quotes.',currencyAssumption:'Each quote explicitly supplies sending and receiving currency; matching currencies alone do not establish the same corridor.',units:['sending-currency','receiving-currency','receiving-currency-per-sending-currency','minutes','ISO-timestamp'],knownExclusions:['No live provider quotes, tariff tables, payment execution, safety or provider eligibility verification.','Strict corridor grouping is enabled by both remittance and crypto-remittance controllers; callers omitting requireCorridor still use the legacy compatibility API and must not infer route equivalence.','Country-name recognition uses runtime Intl/CLDR data, not a provider service-country database or legal status certification.','Payout methods and delivery times remain visible alternatives within the same corridor, not equivalent-service certification.'],disclaimer:'Compare only checked quotes for the intended corridor. Highest recipient amount is not a recommendation; confirm current availability, expiry, payout method, limits and safety.',rounding:{method:'IEEE-754 arithmetic; display-only locale formatting',precision:'Effective rate is recipient amount divided by total debit; no fee added to the already inclusive debit.',stages:['No intermediate monetary rounding.','Highest eligible comparable recipient amount and exact differences; tie comparison tolerance 1e-9.']}};}
const base={label:'Synthetic A',sendCountry:'GB',receiveCountry:'SN',sendCurrency:'USD',receiveCurrency:'XOF',totalDebit:100,recipientAmount:58000,observedAt:'2026-01-01T10:00:00Z'};
const cases=[
 ['canonical-congo-name',{receiveCountry:'Congo - Kinshasa'},{groupCount:1,highest:58000,secondCode:'CD'},['normal'],{receiveCountry:'CD'}],
 ['congo-cross-country',{receiveCountry:'CG'},{groupCount:0,highest:null},['cross_jurisdiction'],{receiveCountry:'CD'}],
 ['deprecated-region',{receiveCountry:'ZR'},{error:'RECEIVE_COUNTRY_REQUIRED'},['invalid_input']],
 ['uk-alias',{sendCountry:'UK'},{groupCount:1,highest:58000},['normal']],
 ['same-corridor',{recipientAmount:59000},{groupCount:1,highest:59000,firstRate:580,secondDifference:0},['normal']],
 ['different-destination',{receiveCountry:'CI',recipientAmount:59000},{groupCount:0,highest:null},['cross_jurisdiction']],
 ['different-origin',{sendCountry:'US'},{groupCount:0,highest:null},['cross_jurisdiction']],
 ['native-alias',{sendCountry:'Royaume-Uni',receiveCountry:' Sénégal ',recipientAmount:59000},{groupCount:1,highest:59000,secondCountry:' Sénégal ',secondCode:'SN'},['normal']],
 ['unknown-country',{receiveCountry:'Synthetic Unknown'},{error:'RECEIVE_COUNTRY_REQUIRED'},['invalid_input']],
 ['missing-origin',{sendCountry:''},{error:'SEND_COUNTRY_REQUIRED'},['missing_input']],
 ['expiry-boundary',{expiresAt:'2026-09-16T12:00:00Z'},{groupCount:0,highest:null,secondExpiry:'expired'},['date_boundary']],
 ['different-debit',{totalDebit:101},{groupCount:0,highest:null},['normal']],
 ['fee-exceeds-debit',{statedFee:101},{error:'FEE_EXCEEDS_DEBIT'},['invalid_input']]
];
function fixtures(formulas){const formula=formulas.find(f=>f.id===id);return !formula?[]:cases.map(([name,patch,expected,caseClasses,firstPatch])=>({id:'remittance-corridor-'+name,formulaId:id,formulaVersion:formula.formulaVersion,caseClasses,operation:'remittance-corridor',input:{requireCorridor:true,asOf:'2026-09-16T12:00:00Z',quotes:[{...base,...firstPatch},{...base,label:'Synthetic B',...patch}]},expected,tolerance:0,evidence:source,changeNote:'2026-09-16 independent literal expectations; no provider freshness claims.'}));}
function run(root,input){try{const r=require(path.join(root,artifact)).calculate(input);return{groupCount:r.groups.length,highest:r.groups.length?r.groups[0].highestRecipientAmount:null,firstRate:r.quotes[0].effectiveRate,secondDifference:r.quotes[1].differenceFromHighestRecipient,secondCountry:r.quotes[1].receiveCountry,secondCode:r.quotes[1].receiveCountryCode,secondExpiry:r.quotes[1].expiryState};}catch(error){return{error:error.message};}}
module.exports={metadata,fixtures,run};
