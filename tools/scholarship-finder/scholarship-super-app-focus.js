(function(){
  "use strict";

  function isLocalPreview(){
    return /^(localhost|127\.0\.0\.1|\[?::1\]?)$/i.test(location.hostname || "");
  }

  function installLocalPreviewFetch(){
    if(!isLocalPreview() || !window.fetch || window.__AfroScholarshipLocalPreviewFetch)return;
    var nativeFetch=window.fetch.bind(window);
    window.__AfroScholarshipLocalPreviewFetch=true;
    window.fetch=function(input,init){
      var url=typeof input==="string"?input:(input&&input.url)||"";
      var path="";
      try{path=new URL(url,location.href).pathname}catch(e){path=url}
      if(path==="/api/scholarships"){
        var fallback=window.AfroScholarshipFeed&&typeof window.AfroScholarshipFeed.getFallbackScholarships==="function"
          ? window.AfroScholarshipFeed.getFallbackScholarships()
          : [];
        return Promise.resolve(new Response(JSON.stringify({
          scholarships:fallback,
          mode:"fallback",
          label:"Local preview",
          message:"Local static preview is using the curated scholarship fallback catalog.",
          isDegraded:true,
          lastCheckedAt:new Date().toISOString()
        }),{status:200,headers:{"Content-Type":"application/json"}}));
      }
      if(path==="/api/scholarship-values"){
        return Promise.resolve(new Response(JSON.stringify({items:[]}),{status:200,headers:{"Content-Type":"application/json"}}));
      }
      if(path==="/api/forex"){
        return nativeFetch("/data/forex/latest.json",init);
      }
      return nativeFetch(input,init);
    };
  }

  installLocalPreviewFetch();

  var STYLE_ID = "sch-super-app-focus-style";
  var RAIL_ID = "schDeadlineSprint";

  function $(id){return document.getElementById(id)}
  function esc(value){
    return String(value == null ? "" : value)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  function addStyles(){
    if($(STYLE_ID))return;
    var style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=[
      ".sch-deadline-sprint{max-width:1180px;margin:18px auto 0;padding:0 24px}",
      ".sch-deadline-sprint-inner{display:grid;grid-template-columns:1.1fr auto;gap:14px;align-items:center;border:1px solid rgba(255,255,255,.16);border-radius:16px;background:rgba(255,255,255,.08);backdrop-filter:blur(12px);padding:14px 16px;color:#fff}",
      ".sch-deadline-sprint strong{display:block;font-size:.92rem;margin-bottom:3px}",
      ".sch-deadline-sprint span{display:block;color:rgba(255,255,255,.72);font-size:.82rem;line-height:1.5}",
      ".sch-deadline-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}",
      ".sch-deadline-actions button{min-height:38px;border:1px solid rgba(255,255,255,.22);border-radius:999px;background:rgba(255,255,255,.1);color:#fff;padding:0 12px;font:800 .78rem/1 'DM Sans',system-ui,sans-serif;cursor:pointer}",
      ".sch-deadline-actions button:hover,.sch-deadline-actions button:focus-visible{background:#fff;color:#0063d1;outline:none}",
      "@media(max-width:720px){.sch-deadline-sprint-inner{grid-template-columns:1fr}.sch-deadline-actions{justify-content:flex-start}.sch-deadline-actions button{flex:1 1 140px}}"
    ].join("");
    document.head.appendChild(style);
  }

  function selectOption(id,value){
    var el=$(id);
    if(!el)return;
    el.value=value;
    el.dispatchEvent(new Event("change",{bubbles:true}));
  }

  function clickTab(name){
    var tab=document.querySelector('[data-sch-tab="'+name+'"]');
    if(tab)tab.click();
  }

  function firstDeadlineText(){
    var nodes=document.querySelectorAll(".sch-card-deadline strong");
    for(var i=0;i<nodes.length;i+=1){
      var text=(nodes[i].textContent||"").trim();
      if(text && !/no single|provider-specific|rolling/i.test(text))return text;
    }
    return "";
  }

  function updateRail(){
    var rail=$(RAIL_ID);
    if(!rail)return;
    var deadline=firstDeadlineText();
    var savedText=($("shortlistNote")&&$("shortlistNote").textContent)||"No saved scholarships yet";
    var status=rail.querySelector("[data-sch-sprint-status]");
    if(status){
      status.textContent=deadline ? "Next dated deadline in view: "+deadline+"." : "No dated deadline is visible in the current result set.";
    }
    var saved=rail.querySelector("[data-sch-saved-note]");
    if(saved)saved.textContent=savedText;
  }

  function mountRail(){
    addStyles();
    if($(RAIL_ID))return updateRail();
    var hero=document.querySelector(".scholarship-product-hero");
    if(!hero)return;
    var rail=document.createElement("div");
    rail.id=RAIL_ID;
    rail.className="sch-deadline-sprint";
    rail.innerHTML='<div class="sch-deadline-sprint-inner"><div><strong>Deadline sprint mode</strong><span data-sch-sprint-status>Checking visible scholarship deadlines.</span><span data-sch-saved-note>No saved scholarships yet</span></div><div class="sch-deadline-actions"><button type="button" data-sch-focus="closing">Closing soon</button><button type="button" data-sch-focus="deadline">Sort by deadline</button><button type="button" data-sch-focus="saved">Saved list</button></div></div>';
    hero.appendChild(rail);
    updateRail();
  }

  function handleFocus(action){
    if(action==="closing"){
      selectOption("deadlineFilter","closing");
      selectOption("sortBy","deadline");
      clickTab("closing");
      var tabs=$("ScholarshipResultTabs");
      if(tabs)tabs.scrollIntoView({behavior:"smooth",block:"start"});
    }else if(action==="deadline"){
      selectOption("sortBy","deadline");
      var grid=$("scholarshipGrid");
      if(grid)grid.scrollIntoView({behavior:"smooth",block:"start"});
    }else if(action==="saved"){
      clickTab("saved");
      var btn=$("shortlistToggle");
      if(btn && !document.querySelector('[data-sch-tab="saved"].is-active'))btn.click();
    }
    window.setTimeout(updateRail,100);
  }

  function init(){
    mountRail();
    document.addEventListener("click",function(event){
      var button=event.target.closest("[data-sch-focus]");
      if(!button)return;
      handleFocus(button.getAttribute("data-sch-focus"));
    });
    var grid=$("scholarshipGrid");
    if(grid && window.MutationObserver){
      new MutationObserver(updateRail).observe(grid,{childList:true,subtree:true});
    }
    window.setTimeout(mountRail,200);
    window.setTimeout(updateRail,800);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
})();
