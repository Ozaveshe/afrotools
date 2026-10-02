const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),acorn=require('acorn');
const {processHtml,frenchSolarCountryDisplayNames}=require('../scripts/repair-fr-solar-country-pages');
const {rewriteSolarRouteLiterals}=require('../scripts/lib/french-solar-country-routes');
const {localizeFrenchSolarCountryPicker,localizeFrenchSolarCountryPickerHtml}=require('../scripts/lib/french-solar-country-picker');
const root=path.resolve(__dirname,'..');
function controller(html){return [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(row=>row[1]).find(source=>source.includes('function setupCountryPicker('));}
const english=fs.readFileSync(path.join(root,'tools/solar-roi/kenya/index.html'),'utf8');
const before=rewriteSolarRouteLiterals(controller(english)),after=localizeFrenchSolarCountryPicker(before,frenchSolarCountryDisplayNames());
const french=fs.readFileSync(path.join(root,'fr/tools/roi-solaire/kenya/index.html'),'utf8'),committed=controller(french);
function nodes(source){const all=[];function walk(node){if(!node||typeof node!=='object')return;all.push(node);for(const [key,value]of Object.entries(node)){if(['start','end','raw'].includes(key))continue;if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value);}}walk(acorn.parse(source,{ecmaVersion:'latest'}));return all;}
const owned=new Set(['setupCountryPicker','findCountry','solarFrenchCountryName']);
function remainder(node){if(!node||typeof node!=='object')return node;if(node.type==='FunctionDeclaration'&&owned.has(node.id.name))return null;if(Array.isArray(node))return node.map(remainder).filter(row=>row!==null);return Object.fromEntries(Object.entries(node).filter(([key])=>!['start','end','raw'].includes(key)).map(([key,value])=>[key,remainder(value)]));}
test('locale owner changes only country presentation/search; calculations, data and all other controller AST stay unchanged',()=>{
 assert.deepEqual(remainder(acorn.parse(after,{ecmaVersion:'latest'})),remainder(acorn.parse(before,{ecmaVersion:'latest'})));
 assert.equal(localizeFrenchSolarCountryPicker(after,frenchSolarCountryDisplayNames()),after);
 assert.equal(processHtml(french),french,'Country output is stable under its source owner');
});
function harness(){
 const declared=nodes(committed).find(node=>node.type==='VariableDeclarator'&&node.id.name==='SOLAR_COUNTRIES');
 const countries=JSON.parse(committed.slice(declared.init.start,declared.init.end));
 const fields={};for(const suffix of ['Search','Select','Open','Status'])fields['solarCountryPage'+suffix]={value:'',textContent:'',handlers:{},addEventListener(event,callback){this.handlers[event]=callback;},closest(){return null;}};
 const context={SOLAR_COUNTRIES:countries,DEFAULTS:{countryCode:'KE',countrySlug:'kenya'},URLSearchParams,location:{search:'',href:''},byId:id=>fields[id],storeSelectedCountry(){},updateCountryQuery(){},trackSolarEvent(){}};
 const script=nodes(committed).filter(node=>node.type==='FunctionDeclaration'&&['normalizeCountry',...owned].includes(node.id.name)).map(node=>committed.slice(node.start,node.end)).join('\n');
 vm.runInNewContext(script,context);context.setupCountryPicker('solarCountryPage','kenya');return {context,fields,countries};
}
test('all 54 country actions remain French with exact canonical routes and stable engine identities',()=>{
 const {context,fields,countries}=harness();assert.equal(countries.length,54);
 const select=fields.solarCountryPageSelect,open=fields.solarCountryPageOpen,status=fields.solarCountryPageStatus;
 for(const country of countries){const original=JSON.stringify(country);select.value=country.slug;select.handlers.change();assert.equal(open.href,'/fr/tools/roi-solaire/'+country.slug+'/');assert.equal(open.textContent,'Ouvrir le calculateur ('+context.solarFrenchCountryName(country)+')');assert.equal(status.textContent,'Pays sélectionné : '+country.flag+' '+context.solarFrenchCountryName(country)+' — '+country.currency);assert.equal(JSON.stringify(country),original);}
 assert.equal(context.solarFrenchCountryName(countries.find(row=>row.code==='SN')),'Sénégal');
 assert.equal(context.solarFrenchCountryName(countries.find(row=>row.code==='ZA')),'Afrique du Sud');
});
test('French accented search, code/English compatibility and invalid-search feedback work without changing country identities',()=>{
 const {context,fields}=harness(),search=fields.solarCountryPageSearch;
 for(const query of ['Sénégal','sénégal','Senegal','SN','senegal']){assert.equal(context.findCountry(query).code,'SN');search.value=query;search.handlers.input();assert.equal(fields.solarCountryPageSelect.value,'senegal');assert.equal(search.value,'Sénégal');}
 search.value='unknown-country!!!';search.handlers.input();assert.equal(fields.solarCountryPageStatus.textContent,'Aucun pays trouvé. Continuez à saisir ou utilisez la liste.');assert.equal(fields.solarCountryPageSelect.value,'senegal');
});
test('JSON, external scripts and displayed code examples stay outside the picker owner',()=>{
 const code='<script>function setupCountryPicker(){} function findCountry(){}</script>';
 for(const html of ['<pre>'+code+'</pre>','<code>'+code+'</code>','<textarea>'+code+'</textarea>','<script type="application/json">{"name":"Open "}</script>','<script src="/external.js"></script>'])assert.equal(localizeFrenchSolarCountryPickerHtml(html,{}),html);
});
