(function(){
  "use strict";

  var RAIL_ID="carsSuperAppFocus";
  var STYLE_ID="carsSuperAppFocusStyle";
  var PACKETS={};
  var dataPromise=null;
  var NEXT_STEPS=[
    {title:"Estimate finance",label:"Open car loan estimator",href:"/tools/car-loan/",body:"Model deposit, term, and monthly payment with your own lender assumptions. No lender decision or offer is implied."},
    {title:"Check insurance",label:"Open car insurance tools",href:"/tools/car-insurance/",body:"Plan insurance questions and likely cost inputs before you buy. This is not a policy quote or coverage confirmation."},
    {title:"Compare import duty",label:"Open import duty calculator",href:"/tools/import-duty/",body:"Compare the duty layer against the landed-cost estimate and official customs rules where available."},
    {title:"Prepare inspection checklist",label:"No dedicated checklist route yet",href:"",body:"Before paying, verify VIN, chassis, service history, mileage evidence, import papers, accident signs, and mechanic inspection notes."},
    {title:"Contact business enquiry",label:"Contact AfroTools",href:"/business-enquiry/",body:"For importer, lender, insurer, or fleet workflows. This is not a seller appointment, formal inspection report, or purchase reservation."}
  ];
  var PRESETS=[
    {label:"Nigeria reliable sedans",fields:{country:"nigeria",make:"toyota",body:"sedan",maxRisk:"55"}},
    {label:"Kenya Japan imports",fields:{country:"kenya",make:"toyota",sourceMarket:"japan",recommendation:"import-likely-cheaper"}},
    {label:"Ghana low-risk buys",fields:{country:"ghana",maxRisk:"50",minLiquidity:"60"}},
    {label:"South Africa pickups",fields:{country:"south-africa",body:"pickup",minLiquidity:"55"}}
  ];

  function $(selector,root){return (root||document).querySelector(selector)}
  function $all(selector,root){return Array.prototype.slice.call((root||document).querySelectorAll(selector))}
  function esc(value){
    return String(value == null ? "" : value).replace(/[&<>"']/g,function(char){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char];
    });
  }
  function number(value,fallback){
    var parsed=Number(value);
    return Number.isFinite(parsed)?parsed:(fallback||0);
  }
  function fetchJson(url){
    return fetch(url,{cache:"no-cache"}).then(function(response){
      if(!response.ok)throw new Error("Could not load "+url);
      return response.json();
    });
  }
  function formatMoney(value,context){
    var api=window.AfroCarPriceIntelligence;
    var currency=context && context.localCurrency || "USD";
    var rate=context && context.usdToLocal || 1;
    if(api && api.formatMoney)return api.formatMoney(number(value)*rate,currency);
    try{
      return new Intl.NumberFormat("en",{style:"currency",currency:currency,maximumFractionDigits:0}).format(number(value)*rate);
    }catch(error){
      return currency+" "+Math.round(number(value)*rate).toLocaleString();
    }
  }
  function formatUsd(value){
    var api=window.AfroCarPriceIntelligence;
    if(api && api.formatMoney)return api.formatMoney(value,"USD");
    return "USD "+Math.round(number(value)).toLocaleString();
  }
  function rangeText(range,context){
    return formatMoney(range.min,context)+" to "+formatMoney(range.max,context)+" ("+formatUsd(range.min)+" to "+formatUsd(range.max)+" reference)";
  }
  function dataSourceLabel(confidence){
    return /verified-live|live/i.test(confidence||"") ? "Verified live" : "Static estimate";
  }
  function freshnessLabel(context){
    return "Source "+context.freshness.source+"; local "+context.freshness.local;
  }
  function confidenceText(context){
    return "Source "+context.sourcePrice.confidence+"; local "+context.localPrice.confidence+"; landed "+context.landed.confidence;
  }
  function sourceConfidenceStrip(data){
    var policy=data && data.priceData && data.priceData.estimatePolicy || "Seed ranges are planning estimates, not dealer quotes.";
    return '<div class="cars-source-confidence-strip" aria-label="Source confidence and freshness"><span><strong>Vehicle prices</strong> Static estimate snapshot</span><span><strong>Landed cost</strong> Rule-pack or directory estimate</span><span><strong>FX</strong> Snapshot/static fallback unless live API is available</span><a href="#carsMethodology">Methodology &amp; sources</a><small>'+esc(policy)+'</small></div>';
  }
  function nextStepsHtml(){
    return '<section class="cars-next-steps cars-panel" aria-label="Car buyer next steps"><div class="cars-section-head"><h2>Honest next steps</h2><span>No approvals, bookings, or certifications implied</span></div><div class="cars-next-step-grid">'+NEXT_STEPS.map(function(step){
      var inner='<span>'+esc(step.title)+'</span><p>'+esc(step.body)+'</p><strong>'+esc(step.label)+'</strong>';
      return step.href ? '<a class="cars-next-step-card" href="'+esc(step.href)+'">'+inner+'</a>' : '<article class="cars-next-step-card unavailable" aria-label="'+esc(step.title)+'">'+inner+'</article>';
    }).join("")+'</div></section>';
  }
  function enhanceNextSteps(){
    if($(".cars-next-steps"))return;
    var grid=$(".cars-card-grid");
    var panel=grid && grid.closest && grid.closest(".cars-panel");
    if(panel)panel.insertAdjacentHTML("afterend",nextStepsHtml());
  }
  function enhanceFirstScreen(data){
    var hero=$(".cars-hero-grid");
    if(hero && !$(".cars-source-confidence-strip",hero.parentNode)){
      hero.insertAdjacentHTML("afterend",sourceConfidenceStrip(data));
    }
    var sourceBlock=$(".cars-source-block");
    if(sourceBlock){
      sourceBlock.id="carsMethodology";
      sourceBlock.setAttribute("tabindex","-1");
      if(!$(".cars-source-methodology-note",sourceBlock)){
        var list=$("ul",sourceBlock);
        var note='<div class="cars-source-methodology-note"><h3>What these sources cover</h3><p>Official customs links cover import procedures, rule-pack references, valuation or duty guidance where available, and authority contact paths. They do not prove current dealer inventory, asking-price availability, lender approval, or a final customs decision for a specific vehicle.</p><p>Vehicle price bands remain static estimate snapshots unless a verified live source is explicitly labelled on the card.</p></div>';
        if(list)list.insertAdjacentHTML("beforebegin",note);
        else sourceBlock.insertAdjacentHTML("beforeend",note);
      }
    }
    enhanceNextSteps();
  }
  function loadData(){
    var api=window.AfroCarPriceIntelligence;
    var importApi=window.AfroCarImportCost;
    if(dataPromise)return dataPromise;
    if(!api || !importApi || !importApi.mergeData)return Promise.reject(new Error("Car pricing engine is not ready."));
    dataPromise=Promise.all([
      fetchJson("/data/cars/price-intelligence.json").then(function(data){
        try{
          var override=JSON.parse(localStorage.getItem("carPriceIntelligenceOverride")||"null");
          return override && override.schemaVersion ? override : data;
        }catch(error){
          return data;
        }
      }),
      fetchJson("/data/trade/car-import-cost-core.json").then(function(core){
        var packs=Object.keys(core.countryPackFiles||{}).map(function(code){
          return fetchJson(core.countryPackFiles[code]);
        });
        var fx=/^(localhost|127\.0\.0\.1|\[?::1\]?)$/i.test(location.hostname)
          ? fetchJson("/data/forex/latest.json")
          : fetchJson("/api/forex?base=USD").catch(function(){return fetchJson("/data/forex/latest.json")});
        return Promise.all(packs.concat([fx])).then(function(results){
          var forex=results.pop();
          return importApi.mergeData(core,results,forex && forex.rates || {});
        });
      })
    ]).then(function(results){
      return {priceData:results[0],importData:results[1]};
    });
    return dataPromise;
  }
  function packetText(context){
    var landedRange={min:context.landed.best,max:context.landed.painful};
    var confidence="source "+context.sourcePrice.confidence+", local "+context.localPrice.confidence+", landed "+context.landed.confidence;
    return [
      "AfroTools local vs import decision packet",
      context.vehicle.year+" "+context.vehicle.make+" "+context.vehicle.model+" in "+context.country.name,
      "Local asking range: "+rangeText(context.localPrice,context),
      "Landed-cost range: "+rangeText(landedRange,context),
      "Import recommendation: "+context.recommendation.label,
      "Recommendation basis: "+context.recommendation.explanation,
      "Confidence: "+confidence,
      "Assumptions: "+context.pricingMode+"; source market "+sourceLabel(context.sourceMarket)+"; "+context.localCurrency+" display via current FX data; source freshness "+context.freshness.source+"; local freshness "+context.freshness.local+"; eligibility "+context.eligibilityStatus+".",
      "No live inventory, dealer availability, lender approval, official valuation, or customs decision is implied.",
      "Next action: /tools/car-import-cost/",
      "Next action: /tools/import-duty/"
    ].join("\n");
  }
  function sourceLabel(source){
    var api=window.AfroCarPriceIntelligence;
    var sourceMarkets=lastPriceData && lastPriceData.sourceMarkets || {};
    var market=sourceMarkets[source];
    if(market && market.label)return market.label;
    if(api && api.slug)return String(source||"").replace(/-/g," ");
    return String(source||"").replace(/-/g," ");
  }
  var lastPriceData=null;
  function packetHtml(context,id){
    var landedRange={min:context.landed.best,max:context.landed.painful};
    var confidence=confidenceText(context);
    var assumptions=[
      context.pricingMode,
      "source "+sourceLabel(context.sourceMarket),
      context.localCurrency+" via current FX data",
      "freshness "+context.freshness.source+" / "+context.freshness.local,
      "eligibility "+context.eligibilityStatus,
      "no live inventory or dealer availability claim"
    ].join("; ");
    PACKETS[id]=packetText(context);
    return '<details class="cars-decision-packet" data-cars-packet-id="'+esc(id)+'"><summary>Local vs import decision packet</summary><dl><div><dt>Local asking range</dt><dd>'+esc(rangeText(context.localPrice,context))+'</dd></div><div><dt>Landed-cost range</dt><dd>'+esc(rangeText(landedRange,context))+'</dd></div><div><dt>Import recommendation</dt><dd>'+esc(context.recommendation.label)+'</dd></div><div><dt>Confidence</dt><dd>'+esc(confidence)+'</dd></div></dl><p>'+esc(assumptions)+'.</p><div class="cars-packet-actions"><a href="/tools/car-import-cost/">Car import cost</a><a href="/tools/import-duty/">Import duty</a><button type="button" data-cars-copy-packet="'+esc(id)+'" data-label="Copy packet">Copy packet</button><button type="button" data-cars-export-packet="'+esc(id)+'">Export packet</button></div></details>';
  }
  function confidenceHtml(context){
    var state=dataSourceLabel(context.landed.confidence);
    return '<div class="cars-card-confidence" data-confidence-state="'+esc(state)+'"><span><strong>'+esc(state)+'</strong> '+esc(confidenceText(context))+'</span><span><strong>Freshness</strong> '+esc(freshnessLabel(context))+'</span><span><strong>Availability</strong> No dealer feed or live inventory claim</span></div>';
  }
  function packetId(context){
    return [context.country.code,context.vehicle.id,context.sourceMarket].join(":");
  }
  function enhancePackets(){
    var api=window.AfroCarPriceIntelligence;
    if(!api)return;
    var cards=$all(".cars-card:not([data-cars-decision-packet])");
    if(!cards.length)return;
    cards.forEach(function(card){
      card.setAttribute("data-cars-decision-packet","pending");
    });
    loadData().then(function(data){
      lastPriceData=data.priceData;
      enhanceFirstScreen(data);
      cards.forEach(function(card){
        if($(".cars-decision-packet",card)){
          card.setAttribute("data-cars-decision-packet","mounted");
          return;
        }
        var link=$(".cars-card h3 a",card);
        if(!link){
          card.removeAttribute("data-cars-decision-packet");
          return;
        }
        var route=api.parseCarsPath(new URL(link.href,location.href).pathname);
        var country=api.getCountry(data.priceData,route.country||"nigeria");
        var vehicle=api.findVehicle(data.priceData,route);
        var context=vehicle && api.buildVehicleContext(data.priceData,data.importData,{countryCode:country.code,vehicle:vehicle});
        if(!context){
          card.removeAttribute("data-cars-decision-packet");
          return;
        }
        if(!$(".cars-card-confidence",card)){
          var metrics=$(".cars-card-metrics",card)||$(".cars-reco",card)||card;
          metrics.insertAdjacentHTML("afterend",confidenceHtml(context));
        }
        card.setAttribute("data-cars-decision-packet","mounted");
        var target=$(".cars-card-actions",card)||card;
        target.insertAdjacentHTML("beforebegin",packetHtml(context,packetId(context)));
      });
    }).catch(function(error){
      if(window.console && console.warn)console.warn("Car decision packet unavailable",error);
    });
  }
  function copyText(text,button){
    var done=function(){
      if(button){
        var label=button.getAttribute("data-label")||"Copy packet";
        button.textContent="Copied";
        window.setTimeout(function(){button.textContent=label},1600);
      }
    };
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(done).catch(function(){fallbackCopy(text,done)});
    }else{
      fallbackCopy(text,done);
    }
  }
  function fallbackCopy(text,done){
    var area=document.createElement("textarea");
    area.value=text;
    area.setAttribute("readonly","");
    area.style.position="fixed";
    area.style.left="-9999px";
    document.body.appendChild(area);
    area.select();
    try{document.execCommand("copy");done()}catch(error){}
    document.body.removeChild(area);
  }
  function exportText(text,id){
    var blob=new Blob([text],{type:"text/plain"});
    var link=document.createElement("a");
    link.href=URL.createObjectURL(blob);
    link.download="afrotools-local-vs-import-packet-"+String(id||"car").replace(/[^a-z0-9]+/gi,"-").toLowerCase()+".txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  function addStyles(){
    if(document.getElementById(STYLE_ID))return;
    var style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=[
      ".cars-super-focus{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}",
      ".cars-super-focus button{min-height:38px;border:1px solid rgba(255,255,255,.22);border-radius:999px;background:rgba(255,255,255,.1);color:#fff;padding:0 13px;font:800 .82rem/1 Inter,system-ui,sans-serif;cursor:pointer}",
      ".cars-super-focus button:hover,.cars-super-focus button:focus-visible{background:#fff;color:#0f172a;outline:none}",
      ".cars-source-confidence-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:18px}",
      ".cars-source-confidence-strip span,.cars-source-confidence-strip a{min-width:0;border:1px solid rgba(255,255,255,.28);border-radius:8px;background:rgba(255,255,255,.12);color:#fff;padding:10px 11px;text-decoration:none;line-height:1.35}",
      ".cars-source-confidence-strip strong{display:block;color:#bce8ce;font-size:.72rem;letter-spacing:.04em;text-transform:uppercase}",
      ".cars-source-confidence-strip a{display:flex;align-items:center;justify-content:center;font-weight:800}",
      ".cars-source-confidence-strip small{grid-column:1/-1;color:#e7edf6;line-height:1.5}",
      ".cars-card-confidence{display:grid;gap:7px;margin:12px 15px 0;border:1px solid #dbe6f2;border-radius:8px;background:#fbfcfe;padding:10px 11px}",
      ".cars-card-confidence span{display:block;color:#52657e;font-size:.84rem;line-height:1.45;overflow-wrap:anywhere}",
      ".cars-card-confidence strong{color:#142033}",
      ".cars-source-methodology-note{border:1px solid #dbe6f2;border-radius:8px;background:#f8fbfe;margin:12px 0;padding:12px}",
      ".cars-source-methodology-note h3{margin:0 0 6px;color:#142033;font-size:1rem}",
      ".cars-source-methodology-note p+p{margin-top:8px}",
      ".cars-next-steps{scroll-margin-top:18px}",
      ".cars-next-step-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}",
      ".cars-next-step-card{display:grid;align-content:start;gap:8px;min-width:0;min-height:150px;border:1px solid #dbe6f2;border-radius:8px;background:#fff;color:#142033;padding:14px;text-decoration:none}",
      ".cars-next-step-card:hover,.cars-next-step-card:focus-visible{border-color:#1769aa;outline:3px solid #b9def7;outline-offset:2px}",
      ".cars-next-step-card span{color:#52657e;font-size:.72rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase}",
      ".cars-next-step-card p{margin:0;color:#647187;font-size:.9rem;line-height:1.5}",
      ".cars-next-step-card strong{margin-top:auto;color:#0e4f83;font-size:.9rem}",
      ".cars-next-step-card.unavailable{background:#f8fbfe}",
      ".cars-next-step-card.unavailable strong{color:#647187}",
      ".cars-decision-packet{margin:12px 15px 0;border:1px solid #dbe6f2;border-radius:8px;background:#f8fbfe;padding:10px 12px;overflow:hidden}",
      ".cars-decision-packet summary{cursor:pointer;color:#173f6b;font-weight:800}",
      ".cars-decision-packet dl{display:grid;gap:8px;margin:10px 0 0}",
      ".cars-decision-packet div{min-width:0}",
      ".cars-decision-packet dt{color:#52657e;font-size:.72rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase}",
      ".cars-decision-packet dd{margin:3px 0 0;color:#142033;font-weight:700;line-height:1.35;overflow-wrap:anywhere}",
      ".cars-decision-packet p{margin:10px 0 0;color:#647187;font-size:.88rem;line-height:1.5}",
      ".cars-packet-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}",
      ".cars-packet-actions a,.cars-packet-actions button{display:inline-flex;align-items:center;justify-content:center;min-height:36px;border:1px solid #cbd8e8;border-radius:8px;background:#fff;color:#0e4f83;cursor:pointer;font:800 .84rem/1 Inter,system-ui,sans-serif;padding:8px 10px;text-decoration:none}",
      ".cars-packet-actions a:hover,.cars-packet-actions button:hover,.cars-packet-actions a:focus-visible,.cars-packet-actions button:focus-visible{border-color:#1769aa;outline:3px solid #b9def7;outline-offset:2px}",
      "@media(max-width:1060px){.cars-next-step-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}",
      "@media(max-width:860px){.cars-source-confidence-strip{grid-template-columns:repeat(2,minmax(0,1fr))}}",
      "@media(max-width:640px){.cars-super-focus button{flex:1 1 150px}.cars-source-confidence-strip,.cars-next-step-grid{grid-template-columns:1fr}}"
    ].join("");
    document.head.appendChild(style);
  }

  function setField(form,name,value){
    var field=form && form.elements[name];
    if(!field || value == null)return;
    field.value=value;
  }

  function applyPreset(index){
    var preset=PRESETS[index];
    var form=document.getElementById("carsFilterForm");
    if(!preset || !form)return;
    Object.keys(preset.fields).forEach(function(name){
      setField(form,name,preset.fields[name]);
    });
    form.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));
    var target=$(".cars-filter-panel")||form;
    if(target)target.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function mount(){
    addStyles();
    if(document.getElementById(RAIL_ID))return;
    var stats=$(".cars-hero-stats");
    if(!stats)return;
    var rail=document.createElement("div");
    rail.id=RAIL_ID;
    rail.className="cars-super-focus";
    rail.setAttribute("aria-label","Car buyer presets");
    rail.innerHTML=PRESETS.map(function(preset,index){
      return '<button type="button" data-cars-super-preset="'+index+'">'+preset.label+"</button>";
    }).join("");
    stats.insertAdjacentElement("afterend",rail);
    loadData().then(enhanceFirstScreen).catch(function(){});
    enhanceNextSteps();
    enhancePackets();
  }

  function init(){
    mount();
    document.addEventListener("click",function(event){
      var button=event.target.closest("[data-cars-super-preset]");
      if(!button)return;
      applyPreset(Number(button.getAttribute("data-cars-super-preset")));
    });
    document.addEventListener("click",function(event){
      var copyButton=event.target.closest("[data-cars-copy-packet]");
      if(copyButton){
        var copyId=copyButton.getAttribute("data-cars-copy-packet");
        if(PACKETS[copyId])copyText(PACKETS[copyId],copyButton);
        return;
      }
      var exportButton=event.target.closest("[data-cars-export-packet]");
      if(exportButton){
        var exportId=exportButton.getAttribute("data-cars-export-packet");
        if(PACKETS[exportId])exportText(PACKETS[exportId],exportId);
      }
    });
    if(window.MutationObserver){
      new MutationObserver(function(){
        mount();
        enhancePackets();
      }).observe(document.getElementById("carsApp")||document.body,{childList:true,subtree:true});
    }
    enhancePackets();
    window.setTimeout(mount,500);
    window.setTimeout(mount,1200);
    window.setTimeout(enhancePackets,1600);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
})();
