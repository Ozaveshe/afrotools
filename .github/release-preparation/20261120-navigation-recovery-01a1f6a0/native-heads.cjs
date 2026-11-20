const fs=require("fs"), cp=require("child_process"), assert=require("assert/strict");
const load=p=>require(process.cwd()+"/"+p);
const fr=load("scripts/build-french-religious-cultural-parity"),sw=load("scripts/build-sw-religious-cultural-parity"),m=load("data/localization/fr-religious-cultural-parity.json"),tool=m.tools.find(t=>t.sourceId==="lobola-calculator");
const ft=load("scripts/build-fr-trade-parity-pages"),st=load("scripts/build-sw-trade-utility-pages"),style=load("scripts/lib/native-navigation-style");
const rows=[
 [tool.route,fr.renderToolPage(tool,m)], [sw.ROUTES[tool.sourceId],sw.page(sw.translateTool(tool))],
 ["/fr/tools/facture-proforma/",ft.pageHtml(ft.pages.find(p=>p.tool==="proforma-invoice"))],
 ["/sw/zana/ankara-proforma/",st.html(st.PAGES.find(p=>p.id==="proforma-invoice"))]
];
for(const route of ["/fr/tools/generateur-factures/","/sw/zana/kizalishaji-ankara/"])rows.push([route,fs.readFileSync(route.slice(1)+"index.html","utf8")]);
for(const [route,output] of rows){
 const file=route.slice(1)+"index.html",base=cp.execFileSync("git",["show","HEAD:"+file],{encoding:"utf8",maxBuffer:8e6});
 const critical=output.match(/<head>(\s*<style>[\s\S]*?<\/style>)/i);
 assert.equal(critical[1].trim(),style,route);
 if(!process.argv.includes("--check")) fs.writeFileSync(file,base.replace("<head>",critical[0]));
 const live=fs.readFileSync(file,"utf8").match(/<head>\s*(<style>[\s\S]*?<\/style>)/i);
 assert(live, "Missing early critical style: "+file);
 assert.equal(live[1].replace(/\s+/g,""),style.replace(/\s+/g,""),file);
 console.log("Generated critical head from owner:",file);
}

for(const file of ["tools/invoice-generator/index.html","tools/proforma-invoice/index.html","tools/freelance-invoice/index.html","tools/ankara-kente-cost/index.html"]){const m=fs.readFileSync(file,"utf8").match(/<head>\s*(<style>[\s\S]*?<\/style>)/i);assert(m,file);assert.equal(m[1].replace(/\s+/g,""),style.replace(/\s+/g,""),file);}
