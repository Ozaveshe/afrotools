'use strict';
const check=require('./check-candidate-integrity.cjs');
const result=check(require('./english-2018-001.json'),{32:'B',35:'B',38:'C',41:'D',43:'B',44:'C'},4);
process.stdout.write(JSON.stringify(result)+'\n');
