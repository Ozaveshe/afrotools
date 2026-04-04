!function(){"use strict";
window.AfroTools=window.AfroTools||{};
var D=null;
function getData(){if(!D)D=window.AfroTools.businessLicenseData;return D;}

var INDUSTRIES=[
  {key:'retail',name:'Retail / Trading',icon:'\uD83D\uDED2'},
  {key:'food',name:'Food & Beverage',icon:'\uD83C\uDF54'},
  {key:'construction',name:'Construction',icon:'\uD83C\uDFD7\uFE0F'},
  {key:'healthcare',name:'Healthcare / Pharmacy',icon:'\uD83C\uDFE5'},
  {key:'financial',name:'Financial Services',icon:'\uD83C\uDFE6'},
  {key:'education',name:'Education',icon:'\uD83C\uDF93'},
  {key:'manufacturing',name:'Manufacturing',icon:'\uD83C\uDFED'},
  {key:'transport',name:'Transport / Logistics',icon:'\uD83D\uDE9A'},
  {key:'technology',name:'Technology / Telecom',icon:'\uD83D\uDCBB'},
  {key:'mining',name:'Mining & Extractives',icon:'\u26CF\uFE0F'},
  {key:'agriculture',name:'Agriculture',icon:'\uD83C\uDF3E'},
  {key:'hotel',name:'Hotel / Hospitality',icon:'\uD83C\uDFE8'}
];

window.AfroTools.BusinessLicenseEngine={

  getIndustries:function(){return INDUSTRIES;},

  getLicenses:function(cc,industry){
    var d=getData();if(!d||!d.licenses[cc])return[];
    var countryData=d.licenses[cc];
    return countryData[industry]||[];
  },

  renderIndustryTabs:function(cc){
    var h='<div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.5rem">';
    for(var i=0;i<INDUSTRIES.length;i++){
      var ind=INDUSTRIES[i];
      h+='<button class="lic-tab'+(i===0?' active':'')+'" data-industry="'+ind.key+'" style="padding:.6rem 1rem;min-height:44px;border-radius:8px;border:1px solid #9ca3af;background:'+(i===0?'var(--leg,#7c3aed)':'#fff')+';color:'+(i===0?'#fff':'#374151')+';font-size:.82rem;font-weight:600;cursor:pointer;transition:background .2s,color .2s">'+ind.icon+' '+ind.name+'</button>';
    }
    h+='</div>';
    return h;
  },

  renderLicenseCards:function(cc,industry){
    var licenses=this.getLicenses(cc,industry);
    if(!licenses.length)return'<p style="color:#94a3b8;text-align:center;padding:2rem">No specific license data available for this industry in this country. Contact local authorities for requirements.</p>';
    var h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem">';
    for(var i=0;i<licenses.length;i++){
      var l=licenses[i];
      var badgeColor=l.mandatory?'#dc2626':'#d97706';
      var badgeBg=l.mandatory?'#fee2e2':'#fef3c7';
      var badgeText=l.mandatory?'MANDATORY':'CONDITIONAL';
      h+='<div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:1.25rem;box-shadow:0 1px 3px rgba(0,0,0,.05)">';
      h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.75rem"><strong style="font-size:.95rem;color:#1e293b">'+l.name+'</strong><span style="padding:.2rem .5rem;border-radius:4px;font-size:.65rem;font-weight:700;background:'+badgeBg+';color:'+badgeColor+'">'+badgeText+'</span></div>';
      h+='<div style="font-size:.82rem;color:#64748b;margin-bottom:.5rem">'+l.auth+'</div>';
      h+='<div style="display:flex;gap:1rem;font-size:.8rem;color:#475569;flex-wrap:wrap">';
      if(l.cost)h+='<span><strong>Cost:</strong> '+l.cost+'</span>';
      if(l.renewal)h+='<span><strong>Renewal:</strong> '+l.renewal+'</span>';
      if(l.processingTime)h+='<span><strong>Time:</strong> '+l.processingTime+'</span>';
      h+='</div></div>';
    }
    h+='</div>';
    return h;
  },

  initPage:function(cc){
    var E=this;
    var tabsEl=document.getElementById('licTabs');
    var cardsEl=document.getElementById('licCards');
    if(!tabsEl||!cardsEl)return;

    tabsEl.innerHTML=E.renderIndustryTabs(cc);
    cardsEl.innerHTML=E.renderLicenseCards(cc,'retail');

    tabsEl.addEventListener('click',function(ev){
      var btn=ev.target.closest('.lic-tab');
      if(!btn)return;
      var ind=btn.getAttribute('data-industry');
      var tabs=tabsEl.querySelectorAll('.lic-tab');
      for(var i=0;i<tabs.length;i++){
        tabs[i].classList.remove('active');
        tabs[i].style.background='#fff';tabs[i].style.color='#374151';
      }
      btn.classList.add('active');
      btn.style.background='var(--leg,#7c3aed)';btn.style.color='#fff';
      cardsEl.innerHTML=E.renderLicenseCards(cc,ind);
    });
  }
};
}();
