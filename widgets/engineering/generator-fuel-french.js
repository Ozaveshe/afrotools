(() => {
  if (new URLSearchParams(location.search).get("lang") !== "fr") return;
  const labels = {"Generator Fuel Cost Calculator":"Coût du carburant d’un groupe électrogène","Generator Size (kVA)":"Puissance apparente (kVA)","Fuel Type":"Carburant","Petrol (PMS)":"Essence (PMS)","Diesel (AGO)":"Gazole (AGO)","Load %":"Charge (%)","Hours/Day":"Heures par jour","Days/Month":"Jours par mois","Fuel Price/Litre":"Prix par litre (votre devis)","Currency":"Code de devise","Quick Fuel Price":"Exemples de prix à remplacer par votre tarif","Calculate Fuel Costs":"Calculer le coût","Monthly Fuel Cost":"Coût mensuel du carburant","L/Hour":"Litres par heure","L/Day":"Litres par jour","L/Month":"Litres par mois","Cost per kWh":"Coût par kWh","Energy produced per month":"Énergie produite par mois","Nigeria PMS":"Nigéria · essence","Nigeria Diesel":"Nigéria · gazole","South Africa":"Afrique du Sud"};
  function translate(element) {
    const text = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (text.nextNode()) {
      const node = text.currentNode, original = node.nodeValue.trim();
      let value = labels[original];
      if (!value && / per year$/.test(original)) value = original.replace(/ per year$/, " par an");
      if (!value && original.startsWith("Planning basis for ")) {
        const match = /^Planning basis for (.+?): ([\d.]+) power factor and ([\d.]+) L\/kWh at ([\d.]+)% load/.exec(original);
        if (match) value = "Hypothèses pour " + (/diesel/i.test(match[1]) ? "le gazole" : "l’essence") + " : facteur de puissance " + match[2].replace(".",",") + ", consommation " + match[3].replace(".",",") + " L/kWh et charge de " + match[4].replace(".",",") + " %. Le coût annuel correspond à douze mois au même rythme.";
      }
      if (value && value !== original) node.nodeValue = value;
    }
  }
  function install() {
    const root=document.getElementById("widget-root"), button=root?.querySelector('[id$="-btn"]'), result=root?.querySelector('[id$="-results"]');
    if (!button || !result) return false;
    translate(root); new MutationObserver(()=>translate(result)).observe(result,{childList:true});
    const status=document.createElement("p");status.setAttribute("role","status");button.after(status);
    function clear(){result.style.display="none";status.textContent="";}
    root.addEventListener("input",clear);
    root.addEventListener("click",event=>{
      if(event.target.closest("button")!==button){if(event.target.closest("button"))clear();return;}
      const invalid=Array.from(root.querySelectorAll('input[type="number"]')).some(el=>el.value===""||!Number.isFinite(el.valueAsNumber)||el.valueAsNumber<Number(el.min)||el.max!==""&&el.valueAsNumber>Number(el.max));
      const currency=root.querySelector('[id$="-curr"]').value.trim();
      if(invalid || !/^[a-z]{3}$/i.test(currency)){event.stopImmediatePropagation();clear();status.textContent="Vérifiez les quantités, les durées et le code de devise à trois lettres.";return;}

    },true);
    return true;
  }
  if (!install()) {
    const observer = new MutationObserver(() => { if (install()) observer.disconnect(); });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
