const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../assets/js/pages/french-leave-reports.js'),'utf8'),context);const validate=context.window.AfroTools.leaveReports.validateBackup;
test('leave backup preserves known scenario and rejects unrelated or invalid inputs before restore',()=>{
 const valid={schemaVersion:1,tool:'leave-calculator',inputs:{country:'KE',daysTaken:4.5}};assert.equal(JSON.stringify(validate(valid,{KE:{}})),JSON.stringify(valid.inputs));
 for(const value of [null,{}, {...valid,tool:'invoice-generator'}, {...valid,inputs:[]}, {...valid,inputs:{country:'KE',daysTaken:-1}}, {...valid,inputs:{country:'KE',daysTaken:0.1}}, {...valid,inputs:{country:'KE',daysTaken:367}}, {...valid,inputs:{country:'__proto__',daysTaken:4}}, {...valid,inputs:{country:'KE',daysTaken:'4'}}, {...valid,inputs:{country:'KE',daysTaken:4,extra:true}}])assert.throws(()=>validate(value,{KE:{}}));
});
