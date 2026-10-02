const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),acorn=require('acorn');
const {localizeFrenchSolarCountryPicker}=require('../scripts/lib/french-solar-country-picker');
const {rewriteSolarRouteLiterals}=require('../scripts/lib/french-solar-country-routes');
const {frenchSolarCountryDisplayNames}=require('../scripts/repair-fr-solar-country-pages');
const root=path.resolve(__dirname,'..'),names=frenchSolarCountryDisplayNames();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const controller=html=>[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(row=>row[1]).find(source=>source.includes('function applyCountry('));
const before=rewriteSolarRouteLiterals(controller(read('tools/solar-roi/index.html'))),after=localizeFrenchSolarCountryPicker(before,names);
const owned=new Set(['findCountry','applyCountry','updateCards','solarFrenchCountryName']);
function nodes(source){const all=[];function walk(node){if(!node||typeof node!=='object')return;all.push(node);for(const[key,value]of Object.entries(node)){if(['start','end','raw'].includes(key))continue;if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value);}}walk(acorn.parse(source,{ecmaVersion:'latest'}));return all;}
function remainder(node){if(!node||typeof node!=='object')return node;if(node.type==='FunctionDeclaration'&&owned.has(node.id.name))return null;if(node.type==='Literal'&&['No exact country match yet. Keep typing or use the dropdown.','Aucun pays trouvé. Continuez à saisir ou utilisez la liste.'].includes(node.value))return {type:'Literal',value:'<owned invalid-country message>'};if(Array.isArray(node))return node.map(remainder).filter(row=>row!==null);return Object.fromEntries(Object.entries(node).filter(([key])=>!['start','end','raw'].includes(key)).map(([key,value])=>[key,remainder(value)]));}
test('root localization preserves all data, sources, defaults, exports and logic outside the country discovery owner',()=>{
 assert.deepEqual(remainder(acorn.parse(after,{ecmaVersion:'latest'})),remainder(acorn.parse(before,{ecmaVersion:'latest'})));
 assert.equal(localizeFrenchSolarCountryPicker(after,names),after);
 assert.equal(controller(read('fr/tools/roi-solaire/index.html')),after);
});
function harness(){const declared=nodes(before).find(node=>node.type==='VariableDeclarator'&&node.id.name==='COUNTRIES'),countries=JSON.parse(before.slice(declared.init.start,declared.init.end));
 const cards=countries.map(country=>({hidden:false,attributes:{'data-country':[country.name,country.slug,country.code,country.currency].join(' ').toLowerCase(),'data-country-slug':country.slug},getAttribute(key){return this.attributes[key];}}));
 const context={COUNTRIES:countries,cards,input:{value:''},select:{value:''},open:{},pickerStatus:{},exportStatus:{},status:{},empty:{},stored:[],updateAssumptionPreview(){},storeCountry(country){this.stored.push(country.code);},updateUrl(){}};
 // Browser globals call storeCountry as an ordinary function, so capture codes in a closure.
 context.storeCountry=country=>context.stored.push(country.code);
 const script=nodes(after).filter(node=>node.type==='FunctionDeclaration'&&['normalize',...owned].includes(node.id.name)).map(node=>after.slice(node.start,node.end)).join('\n');vm.runInNewContext(script,context);return {context,countries,cards};}
test('all 54 root actions retain exact French routes, localized copy and immutable country records',()=>{
 const {context,countries,cards}=harness(),original=JSON.stringify(countries),cardAttributes=JSON.stringify(cards.map(card=>card.attributes));assert.equal(countries.length,54);
 for(const country of countries){context.applyCountry(country,true);context.updateCards();assert.equal(context.open.href,'/fr/tools/roi-solaire/'+country.slug+'/');assert.equal(context.open.textContent,'Ouvrir le calculateur ('+names[country.code]+')');assert.equal(context.input.value,names[country.code]);assert.equal(context.pickerStatus.textContent,'Pays sélectionné : '+country.flag+' '+names[country.code]+' — '+country.currency);assert.equal(cards.find(card=>card.attributes['data-country-slug']===country.slug).hidden,false);}
 assert.equal(JSON.stringify(countries),original);assert.equal(JSON.stringify(cards.map(card=>card.attributes)),cardAttributes);assert.deepEqual(context.stored,countries.map(country=>country.code));
});
test('accented and renamed French countries remain discoverable in root cards and destination lookup',()=>{
 const {context,cards}=harness();for(const [query,code]of [['Sénégal','SN'],['Afrique du Sud','ZA'],['Égypte','EG']]){context.input.value=query;context.updateCards();assert.equal(context.findCountry(query).code,code);assert.equal(cards.filter(card=>!card.hidden).length,1);assert.equal(context.status.textContent,'Résultats : 1 pays.');}
 context.input.value='unknown-country!!!';context.updateCards();assert.equal(cards.filter(card=>!card.hidden).length,0);assert.equal(context.status.textContent,'Résultats : 0 pays.');assert.equal(context.empty.hidden,false);context.input.value='';context.updateCards();assert.equal(context.status.textContent,'Tous les pays : 54.');
});
test('root and country datalist values use French names while retaining every country code',()=>{
 for(const [file,id]of [['fr/tools/roi-solaire/index.html','solarRootCountryList'],['fr/tools/roi-solaire/kenya/index.html','solarCountryPageList']]){const list=read(file).match(new RegExp('<datalist\\b[^>]*id=["\']'+id+'["\'][^>]*>([\\s\\S]*?)<\\/datalist>','i'));assert.ok(list,id);const options=[...list[1].matchAll(/<option\b([^>]*)>([^<]*)<\/option>/gi)];assert.equal(options.length,54);for(const option of options){const code=option[2].trim().split(' - ').pop(),value=option[1].match(/\bvalue=(["'])(.*?)\1/i)[2].replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');assert.ok(names[code],code);assert.equal(value,names[code]);}}
});
