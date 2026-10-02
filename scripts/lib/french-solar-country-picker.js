"use strict";

const acorn = require("acorn");

// Only the country discovery/presentation functions are locale-owned here.
// Country identity, source data, storage keys and calculator logic stay intact.
function localizeFrenchSolarCountryPicker(source, names) {
  const tree = acorn.parse(source, { ecmaVersion: "latest" });
  const functions = new Map();
  const nodes = [];
  function visit(node) {
    if (!node || typeof node !== "object") return;
    nodes.push(node);
    if (node.type === "FunctionDeclaration") functions.set(node.id.name, node);
    for (const [key, value] of Object.entries(node)) {
      if (["start", "end", "raw"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  }
  visit(tree);
  const isRoot=!functions.has("setupCountryPicker")&&functions.has("applyCountry")&&functions.has("updateCards");
  const picker = functions.get(isRoot?"applyCountry":"setupCountryPicker");
  if (!picker) return source;
  const finder = functions.get("findCountry");
  if (!finder) throw new Error("French Solar country picker has no discovery owner");
  if (Object.keys(names).length !== 54) throw new Error("French Solar needs all 54 country display names");
  const helper='function solarFrenchCountryName(country){if(!country)return "";var names='+JSON.stringify(names)+';return names[country.code]||country.name;}';
  const existing=functions.get("solarFrenchCountryName");
  if (existing) return source.slice(0,existing.start)+helper+source.slice(existing.end);
  const edits = [];
  const copy = new Map([
    ["Open ", "Ouvrir le calculateur ("],
    [" calculator", ")"],
    [" selected - ", " — "],
    isRoot
      ? [" planning brief ready. Copy it for quotes or download JSON for your records.", " — fiche de préparation disponible. Copiez-la pour demander des devis ou téléchargez le JSON."]
      : ["No exact country match yet. Keep typing or use the dropdown.", "Aucun pays trouvé. Continuez à saisir ou utilisez la liste."],
  ]);
  const seen = new Set();
  function pickerVisit(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "Literal" && copy.has(node.value)) {
      seen.add(node.value);
      edits.push({start:node.start,end:node.end,text:JSON.stringify(copy.get(node.value))});
    }
    if (node.type === "MemberExpression" && !node.computed && node.object.name === "country") {
      if (node.property.name === "name") edits.push({start:node.start,end:node.end,text:"solarFrenchCountryName(country)"});
      if (node.property.name === "flag") edits.push({start:node.start,end:node.end,text:'("Pays sélectionné : " + country.flag)'});
    }
    for (const [key,value] of Object.entries(node)) {
      if (["start","end","raw"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(pickerVisit);
      else if (value && typeof value === "object") pickerVisit(value);
    }
  }
  pickerVisit(picker);
  if (seen.size !== copy.size) throw new Error("French Solar picker copy contract changed; inspect the controller");
  let finderText = source.slice(finder.start, finder.end);
  const normalizer=isRoot?"normalize":"normalizeCountry";
  for (const [before,after] of [
    [normalizer+'(country.name)===query','('+normalizer+'(country.name)===query||'+normalizer+'(solarFrenchCountryName(country))===query)'],
    [normalizer+'(country.name).indexOf(query)>=0','('+normalizer+'(country.name).indexOf(query)>=0||'+normalizer+'(solarFrenchCountryName(country)).indexOf(query)>=0)'],
  ]) {
    if (finderText.split(before).length !== 2) throw new Error("French Solar country search contract changed");
    finderText = finderText.replace(before,after);
  }
  edits.push({start:finder.start,end:finder.end,text:helper+'\n'+finderText});
  if(isRoot){
    const invalid=nodes.filter(node=>node.type==="Literal"&&node.value==="No exact country match yet. Keep typing or use the dropdown.");
    if(invalid.length!==1)throw new Error("French Solar root invalid-search owner changed");
    edits.push({start:invalid[0].start,end:invalid[0].end,text:JSON.stringify("Aucun pays trouvé. Continuez à saisir ou utilisez la liste.")});
    const cards=functions.get("updateCards");let text=source.slice(cards.start,cards.end);
    for(const [before,after]of [
      ['var match=!query||card.getAttribute("data-country").indexOf(query)>=0;', 'var match=!query||card.getAttribute("data-country").indexOf(query)>=0||normalize(solarFrenchCountryName(findCountry(card.getAttribute("data-country-slug")))).indexOf(query)>=0;'],
      ['status.textContent=query?("Showing "+visible+" matching "+(visible===1?"country":"countries")+"."):"Showing all "+cards.length+" countries.";', 'status.textContent=query?("Résultats : "+visible+" pays."):("Tous les pays : "+cards.length+".");'],
    ]){if(text.split(before).length!==2)throw new Error("French Solar card-filter owner changed");text=text.replace(before,after);}
    edits.push({start:cards.start,end:cards.end,text});
  }
  for (const edit of edits.sort((a,b)=>b.start-a.start)) source=source.slice(0,edit.start)+edit.text+source.slice(edit.end);
  acorn.parse(source, {ecmaVersion:"latest"});
  return source;
}

function localizeFrenchSolarCountryPickerHtml(html, names) {
  const datalists=fragment=>fragment.replace(/<datalist\b[^>]*\bid=["'](?:solarRootCountryList|solarCountryPageList)["'][^>]*>[\s\S]*?<\/datalist>/gi,
    block=>block.replace(/<option\b[^>]*>[\s\S]*?<\/option>/gi,option=>{
      const code=option.match(/>\s*[^<]* - ([A-Z]{2})\s*<\/option>/);
      if(!code||!names[code[1]])throw new Error("French Solar datalist country identity missing");
      const value=names[code[1]].replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
      return option.replace(/\bvalue=(["'])(.*?)\1/i,'value="'+value+'"');
    }));
  let output="",cursor=0;
  for(const match of html.matchAll(/<(script|style|textarea|pre|code)\b[\s\S]*?<\/\1\s*>/gi)){
    output+=datalists(html.slice(cursor,match.index));
    const block=match[0],tag=match[1];
    output+=tag.toLowerCase()!=="script"?block:block.replace(/(<script\b([^>]*)>)([\s\S]*?)(<\/script>)/i,
      (whole,open,attributes,source,close)=>{
        if (/\bsrc\s*=|application\/(?:ld\+json|json)/i.test(attributes)||!source.trim()) return whole;
        return open+localizeFrenchSolarCountryPicker(source,names)+close;
      });
    cursor=match.index+block.length;
  }
  return output+datalists(html.slice(cursor));
}

module.exports={localizeFrenchSolarCountryPicker,localizeFrenchSolarCountryPickerHtml};
