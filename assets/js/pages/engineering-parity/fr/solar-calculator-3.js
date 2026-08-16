var AI_MSGS=[];
async function sendAI(){
  var input=document.getElementById('aiInput');
  var msgsEl=document.getElementById('aiMsgs');
  var sendBtn=document.getElementById('aiSend');
  var status=document.getElementById('aiStatus');
  var consent=document.getElementById('aiConsent');
  var q=input.value.trim();
  if(!q)return;
  if(!consent || !consent.checked){
    if(status) status.textContent='Tick the optional AI consent box before sending a question. The Calculateur solaire, Copier, CSV, and Imprimer actions still work locally.';
    msgsEl.innerHTML+='<div class="ai-msg-a">Confirmez l’irradiation, les pertes, la tension et les prix avec un installateur avant achat.</div>';
    msgsEl.scrollTop=msgsEl.scrollHeight;
    input.focus();
    return;
  }
  AI_MSGS.push({role:'user',content:q});
  msgsEl.innerHTML+='<div class="ai-msg-u">'+q.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>';
  input.value='';sendBtn.disabled=true;
  var thinkEl=document.createElement('div');thinkEl.className='ai-thinking';thinkEl.textContent='Réflexion…';
  msgsEl.appendChild(thinkEl);msgsEl.scrollTop=msgsEl.scrollHeight;
  try{
    var res=await fetch('/.netlify/functions/ai-advisor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tool:'solar-calculator',messages:AI_MSGS.slice(-6),context:''})});
    var data=await res.json();
    if(thinkEl.parentNode)thinkEl.remove();
    var reply=data.reply||data.error||'Désolé, aucune réponse n’a pu être obtenue.';
    AI_MSGS.push({role:'assistant',content:reply});
    msgsEl.innerHTML+='<div class="ai-msg-a">'+reply.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>')+'</div>';
  }catch(e){
    if(thinkEl.parentNode)thinkEl.remove();
    msgsEl.innerHTML+='<div class="ai-msg-a">Désolé, l’assistant d’IA est temporairement indisponible.</div>';
  }
  sendBtn.disabled=false;msgsEl.scrollTop=msgsEl.scrollHeight;input.focus();
}
