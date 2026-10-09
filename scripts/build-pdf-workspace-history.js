'use strict';
const fs=require('fs'),path=require('path');
const {installPdfWorkspaceHistory}=require('./lib/pdf-workspace-history-runtime');
const root=path.resolve(__dirname,'..');
const files=['tools/pdf-workspace/index.html','fr/tools/espace-pdf/index.html','sw/zana/nafasi-pdf/index.html'];
let stale=0;
for(const relative of files){
 const file=path.join(root,relative),before=fs.readFileSync(file,'utf8'),after=installPdfWorkspaceHistory(before);
 if(!after.includes('/assets/js/pages/pdf-workspace-history.js'))throw new Error('PDF history owner missing: '+relative);
 if(before!==after){stale++;if(process.argv.includes('--write'))fs.writeFileSync(file,after);}
}
if(stale&&!process.argv.includes('--write'))process.exitCode=1;
console.log('PDF history runtime: '+files.length+' routes, '+stale+' '+(process.argv.includes('--write')?'updated':'stale')+'.');
