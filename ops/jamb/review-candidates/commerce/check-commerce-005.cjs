'use strict';
const {execFileSync}=require('node:child_process'),path=require('node:path');
execFileSync(process.execPath,[path.join(__dirname,'check-batch.cjs'),'commerce-005',...process.argv.slice(2)],{stdio:'inherit'});
