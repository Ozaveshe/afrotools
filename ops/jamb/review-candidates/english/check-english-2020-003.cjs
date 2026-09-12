'use strict';
const check=require('./check-candidate-integrity.cjs');
const result=check(require('./english-2020-003.json'),{1:'B',4:'B',6:'C',7:'D',8:'D',10:'C',12:'C',14:'C',74:'B',76:'B',77:'C',78:'D',79:'C',81:'B',86:'A',90:'A',91:'C',95:'B',96:'B',97:'B',98:'B',100:'B'},8,8);
process.stdout.write(JSON.stringify(result)+'\n');
