'use strict';
const {collect,publicReport}=require('../netlify/functions/_shared/election-monitor');
const ledger=require('../data/government/africa-election-tracker.json');
const surveySources=require('../data/government/election-survey-sources.json');
collect(ledger,null,undefined,undefined,surveySources.sources).then((report)=>{
  console.log(JSON.stringify(publicReport(report),null,2));
  console.log('Read-only source probe. This is not proof of deployed scheduled execution or editorial fact verification.');
}).catch(error=>{console.error(error.message);process.exitCode=1;});
