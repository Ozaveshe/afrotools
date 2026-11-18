"use strict";

(function () {
  const config = window.__SW_TRADE_CORE_CONFIG__;
  if (!config || config.id !== "incoterms-calculator") return;
  const form = document.querySelector("[data-incoterms-form]");
  const f = form.elements;
  const labels = {
    packaging:"Ufungashaji na uwekaji alama", loading_origin:"Upakiaji mahali pa kuondokea",
    export_customs:"Taratibu za forodha za kuuza nje", inland_origin:"Usafiri wa ndani kabla ya kusafirisha nje",
    loading_vessel:"Kupakia kwenye chombo cha usafiri", freight:"Nauli ya usafiri mkuu", insurance:"Bima ya mizigo",
    unloading_dest:"Upakuaji katika bandari ya mwisho", import_customs:"Taratibu za forodha za kuagiza",
    duties_taxes:"Ushuru na kodi za kuagiza", inland_dest:"Usafiri wa ndani baada ya kuagiza", delivery:"Kupeleka mzigo hadi ghalani"
  };
  const terms = new Map(IncotermsEngine.getAllTerms().map(term => [term.code,term]));
  const customs = "Sheria ya nchi ya kuagiza huamua kama gharama za usafiri hadi mahali pa kuagiza, upakiaji, upakuaji, ushughulikiaji na bima zitajumuishwa kwa kiasi au kikamilifu katika thamani ya forodha. Thibitisha msingi wa ushuru kwa mamlaka ya forodha.";
  const money = new Intl.NumberFormat("sw",{minimumFractionDigits:0,maximumFractionDigits:2});
  const usd = value => money.format(value) + " USD";
  for (const term of terms.values()) {
    const label = term.code + (["CIF","CFR","FOB","FAS"].includes(term.code) ? " — bahari na njia za maji" : " — aina zote za usafiri");
    f.termCode.add(new Option(label,term.code));
    f.compareCode.add(new Option(label,term.code));
  }
  for (const [id,name] of Object.entries(labels)) {
    const label = document.createElement("label");
    const field = document.createElement("input");
    field.type = "number"; field.name = id; field.min = "0"; field.step = "0.01"; field.required = true;
    label.append(name + " (USD)",field);
    form.querySelector("[data-cost-fields]").append(label);
  }
  function comparison(input) { return input.compareCode ?? (input.termCode === "FOB" ? "CIF" : "FOB"); }
  function validate(input) {
    if (!input || !terms.has(input.termCode) || !terms.has(comparison(input))) throw new Error("Chagua masharti yanayopatikana.");
    if (input.termCode === comparison(input)) throw new Error("Chagua masharti mawili tofauti.");
    if (!input.costs || typeof input.costs !== "object" || Array.isArray(input.costs)) throw new Error("Weka gharama za usafirishaji.");
    let total = 0;
    for (const id of Object.keys(labels)) {
      const amount = input.costs[id] ?? 0;
      if (!Number.isFinite(amount) || amount < 0) throw new Error("Tumia gharama halali ya sifuri au zaidi.");
      total += amount;
    }
    if (!Number.isFinite(total)) throw new Error("Jumla ya gharama ni kubwa mno.");
  }
  function readInput() {
    return {termCode:f.termCode.value,compareCode:f.compareCode.value,costs:Object.fromEntries(Object.keys(labels).map(id=>[id,f[id].valueAsNumber]))};
  }
  function setInput(input) {
    f.termCode.value=input.termCode; f.compareCode.value=comparison(input);
    for (const id of Object.keys(labels)) f[id].value=input.costs[id] ?? 0;
  }
  function calculate(input) {
    const split = IncotermsEngine.calculateCostSplit(input.termCode,input.costs);
    const alternative = IncotermsEngine.calculateCostSplit(comparison(input),input.costs);
    return {split,alternative,buyerDifference:alternative.buyerTotal-split.buyerTotal,customs};
  }
  function rows(result) {
    const {split,alternative} = result;
    const rows = [["Jumla ya gharama ulizoingiza",usd(split.total)]];
    for (const t of [split,alternative]) {
      rows.push([t.termCode+" · muuzaji",usd(t.sellerTotal)],[t.termCode+" · mnunuzi",usd(t.buyerTotal)]);
    }
    rows.push(["Mabadiliko kwa mnunuzi kutoka "+split.termCode+" kwenda "+alternative.termCode,usd(result.buyerDifference)]);
    const payer = row => row.paidBy === "seller" ? "muuzaji" : "mnunuzi";
    split.breakdown.forEach((row,i)=>rows.push([labels[row.id],usd(row.amount)+" · "+split.termCode+" "+payer(row)+" · "+alternative.termCode+" "+payer(alternative.breakdown[i])]));
    const selected=[split.termCode,alternative.termCode];
    if (selected.some(code=>["CIF","FOB","CFR"].includes(code))) rows.push(["Hatari ya kupoteza au kuharibu mzigo","Kwa CIF, CFR na FOB, hatari huhamia kwa mnunuzi mzigo unapopakiwa melini katika bandari ya kuondokea. Kwa CIF muuzaji hulipa nauli na bima hadi bandari ya mwisho."]);
    rows.push(["Thamani ya forodha",result.customs],
      ["Chanzo cha masharti","ICC, Incoterms 2020: https://iccwbo.org/business-solutions/incoterms-rules/incoterms-2020/"],
      ["Chanzo cha uthamini wa forodha","WTO, kifungu cha 8.2: https://www.wto.org/english/docs_e/legal_e/cv_e.htm"]);
    return rows;
  }
  f.termCode.addEventListener("change",()=>{ if (f.termCode.value===f.compareCode.value) f.compareCode.value=comparison({termCode:f.termCode.value}); });
  form.addEventListener("reset",()=>setTimeout(()=>setInput(config.input),0));
  setInput(config.input);
  window.swTradeForm={readInput,setInput,validate,calculate,rows};
})();
