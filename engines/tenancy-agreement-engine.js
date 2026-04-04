!function(){"use strict";
window.AfroTools=window.AfroTools||{};
var D=null;
function getData(){if(!D)D=window.AfroTools.tenancyData;return D;}
function fmtDate(d){if(!d)return'_____________';return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});}
function esc(s){return s?s.replace(/</g,'&lt;').replace(/>/g,'&gt;'):'';}

window.AfroTools.TenancyAgreementEngine={

  getCountryData:function(cc){
    var d=getData();if(!d)return null;
    var c=d.countries[cc],t=d.tenancy[cc];
    if(!c||!t)return null;
    return{country:c,tenancy:t};
  },

  generate:function(form,cc){
    var r=this.getCountryData(cc);if(!r)return{error:'Country not found'};
    var c=r.country,t=r.tenancy,sym=c.currencySymbol;
    var cn=0;
    function clause(text){cn++;return'<div class="clause"><strong>'+cn+'.</strong> '+text+'</div>';}

    var html='<h1>TENANCY AGREEMENT</h1>';
    html+='<p style="text-align:center;font-size:.9rem;color:#64748b;margin-bottom:1.5rem">Governed by '+t.law+'</p>';
    html+='<p>This Tenancy Agreement ("Agreement") is entered into on <strong>'+fmtDate(form.startDate)+'</strong> between:</p>';
    html+='<p><strong>The Landlord:</strong> '+esc(form.llName||'[Landlord Name]')+', of '+esc(form.llAddr||'[Address]')+' ("the Landlord")</p>';
    if(form.agentName)html+='<p><strong>Agent:</strong> '+esc(form.agentName)+'</p>';
    html+='<p><strong>The Tenant:</strong> '+esc(form.tenName||'[Tenant Name]')+', of '+esc(form.tenAddr||'[Address]')+' ("the Tenant")</p>';
    html+='<h2>Terms and Conditions</h2>';

    // Premises
    html+=clause('The Landlord agrees to let and the Tenant agrees to take the property situated at <strong>'+esc(form.propAddr||'[Property Address]')+'</strong>, being a <strong>'+esc(form.propType||'residential property')+'</strong>'+(form.bedrooms?' with '+form.bedrooms+' bedroom(s)':'')+', '+(form.furnished==='yes'?'fully furnished':'unfurnished')+' ("the Premises").');

    // Term
    var dur=form.duration||'12 months';
    html+=clause('The tenancy shall commence on <strong>'+fmtDate(form.startDate)+'</strong> for a period of <strong>'+esc(dur)+'</strong>, unless terminated earlier in accordance with this Agreement or applicable law.');

    // Rent
    var rent=parseFloat(form.rent)||0;
    html+=clause('The Tenant shall pay rent of <strong>'+sym+rent.toLocaleString()+'</strong> per <strong>'+(form.payFreq||'month')+'</strong>, payable in advance on or before the first day of each '+(form.payFreq||'month')+'. Payment shall be made by bank transfer or such other method as agreed.');

    // Deposit
    var deposit=parseFloat(form.deposit)||0;
    html+=clause('The Tenant shall pay a security deposit of <strong>'+sym+deposit.toLocaleString()+'</strong> upon execution of this Agreement. The deposit shall be refunded within 30 days of vacating, less any deductions for damages or unpaid rent. '+(t.maxDeposit?'('+c.name+' law: maximum deposit is '+t.maxDeposit+')':''));

    // Rent review
    if(form.rentReview){
      html+=clause('The rent shall be reviewed annually. Any increase shall not exceed <strong>'+esc(form.rentReview)+'%</strong> per annum. '+(t.rentIncreaseCap?'('+c.name+' regulation: '+t.rentIncreaseCap+')':''));
    }

    // Utilities
    var utils=[];
    if(form.utilElec==='tenant')utils.push('electricity');
    if(form.utilWater==='tenant')utils.push('water');
    if(form.utilWaste==='tenant')utils.push('waste disposal');
    if(form.utilInternet==='tenant')utils.push('internet');
    if(utils.length){
      html+=clause('The Tenant shall be responsible for payment of the following utilities: <strong>'+utils.join(', ')+'</strong>. All other utilities shall be the responsibility of the Landlord.');
    }else{
      html+=clause('All utilities including electricity, water, waste disposal, and internet shall be the responsibility of the Landlord unless otherwise agreed in writing.');
    }

    // Maintenance
    html+=clause('The Landlord shall be responsible for structural repairs and maintenance of the Premises. The Tenant shall maintain the interior in good condition and shall be liable for damage caused by negligence or misuse.');

    // Use of premises
    html+=clause('The Premises shall be used solely for <strong>'+(form.propType==='commercial'?'commercial':'residential')+'</strong> purposes. The Tenant shall not use the Premises for any illegal activity or in a manner that causes nuisance to neighbours.');

    // Landlord access
    html+=clause('The Landlord or authorised agent may enter the Premises upon giving <strong>24 hours\' written notice</strong> for the purpose of inspection, repairs, or showing the property to prospective tenants (during the last 2 months of the tenancy).');

    // Optional clauses
    if(form.clSublet)html+=clause('The Tenant may sublet part or all of the Premises with the prior written consent of the Landlord, such consent not to be unreasonably withheld.');
    if(form.clPets)html+=clause('The Tenant is permitted to keep domestic pets on the Premises, subject to compliance with local by-laws and the condition that no damage is caused.');
    if(form.clRenovation)html+=clause('The Tenant shall not make any structural alterations or renovations to the Premises without the prior written consent of the Landlord. Any approved alterations shall become the property of the Landlord upon termination.');
    if(form.clFirstRefusal)html+=clause('The Tenant shall have the right of first refusal to purchase the Premises should the Landlord decide to sell during the term of this Agreement.');
    if(form.clDiplomatic)html+=clause('<strong>Diplomatic / Break Clause:</strong> Either party may terminate this Agreement by giving <strong>2 months\' written notice</strong> at any time, regardless of the fixed term. This clause is included for diplomatic or corporate tenants requiring flexibility.');

    // Termination & Notice
    html+=clause('Either party may terminate this Agreement by giving written notice as required by law. Landlord notice: '+t.noticeLandlord+'. Tenant notice: '+t.noticeTenant+'. '+t.tenantProtection);

    // Dispute resolution
    html+=clause('Any dispute arising from this Agreement shall be referred to the <strong>'+t.disputeBody+'</strong> in accordance with '+t.law+'. Language of proceedings: '+t.legalLanguage+'.');

    // Stamp duty note
    if(t.stampDuty&&t.stampDuty.toLowerCase().indexOf('no')!==0){
      html+='<p style="font-size:.85rem;color:#6b7280;margin:1rem 0;font-style:italic"><strong>Note:</strong> '+t.stampDuty+'. Parties are advised to register this agreement as required.</p>';
    }

    // Governing law
    html+=clause('This Agreement shall be governed by and construed in accordance with <strong>'+t.law+'</strong>.');

    // Signatures
    html+='<div class="signatures">';
    html+='<div class="sig-block"><div class="sig-line"></div><strong>'+esc(form.llName||'[Landlord]')+'</strong><br><span style="font-size:.85rem;color:#64748b">Landlord</span><br><span style="font-size:.82rem;color:#94a3b8">Date: ____________</span></div>';
    html+='<div class="sig-block"><div class="sig-line"></div><strong>'+esc(form.tenName||'[Tenant]')+'</strong><br><span style="font-size:.85rem;color:#64748b">Tenant</span><br><span style="font-size:.82rem;color:#94a3b8">Date: ____________</span></div>';
    html+='</div>';
    html+='<div style="margin-top:2rem;text-align:center"><p style="font-size:.85rem;color:#64748b;margin-bottom:1rem"><strong>Witnesses:</strong></p>';
    html+='<div class="signatures"><div class="sig-block"><div class="sig-line"></div>Witness 1<br><span style="font-size:.82rem;color:#94a3b8">Name: ____________</span></div><div class="sig-block"><div class="sig-line"></div>Witness 2<br><span style="font-size:.82rem;color:#94a3b8">Name: ____________</span></div></div></div>';

    return{html:html};
  }
};
}();
