const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
for(const name of ['atsClassic','lagosCorporate','nairobiTech'])test('styled CV retains supplied contacts and detail: '+name,()=>{
 const ctx={CVTemplates:{},CVApp:{}};ctx.window=ctx;
 vm.runInNewContext(fs.readFileSync('tools/cv-builder/js/cv-pdf-templates.js','utf8'),ctx);
 const data={fn:'Élodie',ln:'François Łukasz',github:'https://example.test/github',web:'https://example.test/website',portfolio:'https://example.test/portfolio',altPhone:'+250 700000001',skills:{},edus:[{deg:'Maîtrise',sch:'Université Exemple',d:'Étude des systèmes durables.'}],refs:[{n:'Asha Mwang’ombe',rel:'Ancienne responsable'}],projs:[{n:'Projet',d:'Maelezo ya mradi.'}],showRefs:true,showProjs:true};
 const html=ctx.CVTemplates[name](data,'KE','#225588');
 for(const value of [data.fn,data.ln,data.github,data.web,data.portfolio,data.altPhone,data.edus[0].d,data.refs[0].rel,data.projs[0].d])assert.ok(html.includes(value),value);
 assert.match(html,/<h1 style="color:inherit;/);
 const hidden=ctx.CVTemplates[name]({...data,showRefs:false,showProjs:false},'KE','#225588');
 assert.ok(!hidden.includes(data.refs[0].rel));assert.ok(!hidden.includes(data.projs[0].d));
 const escaped=ctx.CVTemplates[name]({...data,portfolio:'<script>bad()</script>'},'KE','#225588');assert.ok(!escaped.includes('<script>bad()'));
});
for(const [lang,expected]of [['fr',['Profil professionnel','Expérience professionnelle','Formation','Compétences professionnelles','Références','En cours']],['sw',['Wasifu wa kitaaluma','Uzoefu wa kitaaluma','Elimu','Ujuzi wa biashara','Wadhamini','Sasa']]])test('production template native headings and dates: '+lang,()=>{
 const ctx={document:{documentElement:{lang}},CVTemplates:{},CVApp:{esc:x=>String(x||'')}};ctx.window=ctx;
 vm.runInNewContext(fs.readFileSync('tools/cv-builder/js/cv-pdf-templates.js','utf8'),ctx);
 const html=ctx.CVTemplates.lagosCorporate({fn:'Élodie',summary:'Ujuzi',skills:{h:'SQL'},exps:[{t:'Role',cur:true}],edus:[{deg:'Maîtrise'}],refs:[{n:'Asha'}],showRefs:true},'KE','#225588');
 for(const value of expected)assert.ok(html.includes(value),value);
});
