'use strict';

// Exact controller extracted from tools/credit-score/index.html.
// English and French route owners load this same file; keep formula changes shared.
function csText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('credit-score',key,fallback)
    : fallback;
}
function calcCreditScore(){
  var payment=parseInt(document.getElementById('cs-payment').value);
  var utilization=parseInt(document.getElementById('cs-utilization').value);
  var age=parseInt(document.getElementById('cs-age').value);
  var mix=parseInt(document.getElementById('cs-mix').value);
  var inquiries=parseInt(document.getElementById('cs-inquiries').value);
  var values=[payment,utilization,age,mix,inquiries];
  var error=document.getElementById('cs-error');
  if(error)error.textContent='';
  if(values.some(function(value){return !Number.isFinite(value)||value<0||value>100;})){
    if(error)error.textContent=csText('invalid','Choose a valid value from 0 to 100 for each of the five factors.');
    document.getElementById('cs-results').classList.remove('on');
    return;
  }
  var score=Math.round(values.reduce(function(sum,value){return sum+value;},0)/values.length);
  var grade,gradeColor;
  if(score>=80){grade=csText('strongProfile','Strong self-check profile');gradeColor='#8b5cf6';}
  else if(score>=60){grade=csText('mixedProfile','Mixed self-check profile');gradeColor='#f59e0b';}
  else{grade=csText('reviewProfile','Factors need review');gradeColor='#dc2626';}
  document.getElementById('cs-score').textContent=score;
  var gradeEl=document.getElementById('cs-grade');
  gradeEl.textContent=grade;
  gradeEl.style.color=gradeColor;
  document.getElementById('cs-marker').style.left=score+'%';
  var factors=[
    {name:csText('paymentHistory','Payment History'),weight:'20%',score:payment},
    {name:csText('utilization','Credit Utilization'),weight:'20%',score:utilization},
    {name:csText('historyAge','Credit History Age'),weight:'20%',score:age},
    {name:csText('creditMix','Credit Mix'),weight:'20%',score:mix},
    {name:csText('newInquiries','New Inquiries'),weight:'20%',score:inquiries}
  ];
  var factorList=document.getElementById('cs-factor-list');
  factorList.innerHTML='';
  factors.forEach(function(f){
    var cls=f.score>=80?'good':f.score>=60?'medium':'bad';
    var label=f.score>=80?csText('strong','Strong'):f.score>=60?csText('mixed','Mixed'):csText('review','Review');
    factorList.innerHTML+='<div class="factor-item"><span class="factor-name">'+f.name+'</span><span class="factor-weight">'+f.weight+'</span><span class="factor-score '+cls+'">'+label+'</span></div>';
  });
  var tips=[];
  if(payment<80)tips.push({icon:'&#x23F0;','tip':csText('paymentTip','Review due dates, payment records and any arrears shown on your official report.')});
  if(utilization<80)tips.push({icon:'&#x1F4B3;','tip':csText('utilizationTip','Check balances and limits on the current report, then compare them with your own records.')});
  if(age<80)tips.push({icon:'&#x1F4C5;','tip':csText('ageTip','A short history is not an error by itself; verify that older eligible accounts have not been omitted.')});
  if(mix<80)tips.push({icon:'&#x1F4CB;','tip':csText('mixTip','Do not open credit only to change this checklist. Review whether existing account types are reported correctly.')});
  if(inquiries<80)tips.push({icon:'&#x1F50D;','tip':csText('inquiriesTip','Review recent applications and query any enquiry you do not recognise.')});
  if(tips.length===0)tips.push({icon:'&#x2705;','tip':csText('strongTip','The self-check selections are strong. An official report can still contain errors or use different factors.')});
  var tipsEl=document.getElementById('cs-tips');
  tipsEl.innerHTML='';
  tips.forEach(function(t){
    tipsEl.innerHTML+='<div class="tip-item"><span class="tip-icon">'+t.icon+'</span><span>'+t.tip+'</span></div>';
  });
  document.getElementById('cs-results').classList.add('on');
  document.getElementById('cs-results').focus();
}
