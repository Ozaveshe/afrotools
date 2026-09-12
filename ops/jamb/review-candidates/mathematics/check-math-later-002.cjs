'use strict';
const cp=require('node:child_process'),path=require('node:path');cp.execFileSync(process.execPath,[path.join(__dirname,'check-batch.cjs'),"math-later-002",...process.argv.slice(2)],{stdio:'inherit'});
