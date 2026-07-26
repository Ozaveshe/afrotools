(function () {
  "use strict";
  const engine = window.AfroTools && window.AfroTools.degreeRouteEngine;
  if (!engine) return;
  const byId = id => document.getElementById(id);
  let current = null;
  const qualificationLabels = {certificate:"Certificate",diploma:"Diploma",hnd:"Higher National Diploma",bachelor:"Bachelor's degree",pgd:"Postgraduate diploma",master:"Master's degree",doctorate:"Doctorate",other:"Other qualification"};

  function escapeHtml(value){return String(value||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
  function read(){
    return {
      destination:byId("destination").value,
      purpose:byId("purpose").value,
      qualification:byId("qualification").value,
      institutionStatus:byId("institutionStatus").value,
      documents:Array.from(document.querySelectorAll(".dv-docs input:checked")).map(input=>input.value)
    };
  }
  function render(route){
    byId("resultSummary").textContent=`Route for ${qualificationLabels[route.qualification]||"qualification"} use in ${route.destination} for ${route.purpose}.`;
    byId("decisionOwner").textContent=route.owner;
    byId("officialLinks").innerHTML=`<a href="${escapeHtml(route.link.url)}" target="_blank" rel="noopener">${escapeHtml(route.link.label)}</a>`;
    byId("evidenceGaps").innerHTML=(route.gaps.length?route.gaps:["No evidence gaps selected in this worksheet"]).map(gap=>`<li>${escapeHtml(gap)}</li>`).join("");
    byId("separationNote").textContent=route.separation;
    byId("routeResult").hidden=false;
    byId("routeResult").focus();
  }
  function summary(){
    if(!current)return"";
    return [
      "Foreign degree recognition route — AfroTools","",
      `Destination: ${current.destination}`,
      `Purpose: ${current.purpose}`,
      `Qualification: ${qualificationLabels[current.qualification]||current.qualification}`,
      `Decision owner: ${current.owner}`,
      `Official starting point: ${current.link.label} — ${current.link.url}`,"",
      "Evidence gaps",...(current.gaps.length?current.gaps:["No gaps selected in this worksheet"]).map(g=>`- ${g}`),"",
      `Process separation: ${current.separation}`,"",
      "No equivalency determination was made. This route does not predict admission, employment, licensing, salary, visa or immigration approval.",
      "Confirm the accepted provider, report type, delivery method and validity period with the decision owner before paying."
    ].join("\n");
  }
  byId("degreeRouteForm").addEventListener("submit",event=>{
    event.preventDefault();
    const route=engine.build(read());
    if(!route.valid){byId("routeError").textContent=route.error;byId("routeResult").hidden=true;current=null;return}
    byId("routeError").textContent="";current=route;render(route);
  });
  byId("copyRoute").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(summary());byId("exportStatus").textContent="Route copied."}catch(_e){byId("exportStatus").textContent="Copy failed. Download TXT instead."}});
  byId("downloadRoute").addEventListener("click",()=>{const url=URL.createObjectURL(new Blob([summary()],{type:"text/plain;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="degree-recognition-route.txt";a.click();URL.revokeObjectURL(url);byId("exportStatus").textContent="TXT route downloaded."});
  byId("printRoute").addEventListener("click",()=>{byId("exportStatus").textContent="Opening print. Choose Save as PDF.";window.print()});
  window.AFROTOOLS_DEGREE_VIP=true;
})();
