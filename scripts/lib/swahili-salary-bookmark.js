'use strict';

function repairSalaryBookmark(html) {
  const oldCallback = "AfroAuth.openModal('login',function(){updateSaveUI();});";
  if (!html.includes(oldCallback)) return html;
  const helper = `  function finishRequestedSave(){
    if(!isLoggedIn()) return;
    if(!isSaved()) window.toggleSaveTool();
    updateSaveUI();
  }
  function resumeRequestedSave(){
    if(location.hash !== '#save-tool' || !isLoggedIn()) return;
    var pending;
    try {
      pending = sessionStorage.getItem('afro:pending-payroll-bookmark');
      if(pending !== location.pathname) return;
      sessionStorage.removeItem('afro:pending-payroll-bookmark');
    } catch (_) { return; }
    history.replaceState(history.state, '', location.pathname + location.search);
    finishRequestedSave();
  }
`;
  return html
    .replace('  window.toggleSaveTool=function(){', helper + '  window.toggleSaveTool=function(){')
    .replace(oldCallback, "AfroAuth.openModal('login',finishRequestedSave);")
    .replace(/window\.location\.href='\/sw\/auth\/\?mode=login&next=[^']+';/,
      `var target = location.pathname;
        try {
          sessionStorage.setItem('afro:pending-payroll-bookmark', target);
          target += '#save-tool';
        } catch (_) { /* Return to the calculator for a manual save. */ }
        window.location.href='/sw/auth/?mode=login&next='+encodeURIComponent(target);`)
    .replace("window.addEventListener('afro-auth-change',updateSaveUI);",
      "window.addEventListener('afro-auth-change',updateSaveUI);\n  window.addEventListener('afro-auth-change',resumeRequestedSave);\n  document.addEventListener('DOMContentLoaded',resumeRequestedSave);");
}
module.exports = { repairSalaryBookmark };
