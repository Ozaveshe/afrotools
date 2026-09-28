(function () {
  'use strict';
  var prefix = '/tools/afrostream/university/', key = 'afrostream-playbook-v1', state = { goal:'start', completed:{} };
  var plans = {
    start:{title:'Run your first stream',description:'Start small: one format, one platform, one session you can repeat.',steps:[
      ['Choose one show format','Decide what viewers will come for and how long the session will run.','start-here','Read the starting guide'],
      ['Choose a platform you can use','Check your account’s streaming access and country availability.','platforms','Compare platforms'],
      ['Test audio, light and connection','Make a short private test before announcing a session.','setup','Use the setup guide'],
      ['Prepare a backup','Plan for power, mobile data and a local recording.','africa-survival-guide','Plan around interruptions'],
      ['Run it, then review it','Record one thing to repeat and one thing to improve next time.','repurposing','Make more from your recording']
    ]},
    clips:{title:'Make a week of clips',description:'Give one good session more than one chance to find its audience.',steps:[
      ['Choose one recording','Use a session you own, with permission for any guests and third-party material.','repurposing','Plan your repurposing'],
      ['Mark three useful moments','Pick a clear takeaway, a strong reaction and a moment that stands on its own.','repurposing','Find your clip structure'],
      ['Make one mobile-friendly edit','Give the clip a clear opening, readable captions and a format that fits the destination.','mobile-workflow','Use a mobile workflow'],
      ['Schedule a simple test','Publish the clips on separate days. Keep a note of the format and time used.','30-day-plan','Build a repeatable schedule'],
      ['Review and choose the next clip','Look at audience retention and useful responses before deciding what to repeat.','start-here','Build the next session']
    ]},
    pitch:{title:'Prepare a brand pitch',description:'A specific offer and credible evidence beat an inflated follower claim.',steps:[
      ['Define the offer','Write down the content format, deliverables, turnaround and audience the brand would reach.','brand-deals','Scope your brand deal'],
      ['Collect audience evidence','Use dated platform screenshots. Separate followers, views and engagement rather than adding them together.','media-kit','Build your evidence'],
      ['Set scope and usage rights','Decide what is included, how many revisions you offer and how the brand may reuse the work.','brand-deals','Prepare your terms'],
      ['Build a concise media kit','Show your format, audience, relevant work and a reliable way to contact you.','media-kit','Create your media kit'],
      ['Draft one relevant pitch','Choose a brand that fits the audience, propose a specific idea and explain the next step.','monetization','Understand the business model']
    ]}
  };
  function track(name, props) { if (window.AfroTools && AfroTools.analytics && AfroTools.analytics.track) AfroTools.analytics.track(name,props || {}); }
  function save() { try { localStorage.setItem(key,JSON.stringify(state)); } catch (_) {} }
  function checked() { return Array.isArray(state.completed[state.goal]) ? state.completed[state.goal] : []; }
  function updateProgress() {
    var count = checked().filter(function (n) { return Number.isInteger(n) && n >= 0 && n < 5; }).length;
    document.getElementById('planProgress').setAttribute('aria-valuenow',String(count));
    document.getElementById('planProgressFill').style.width = count * 20 + '%';
    document.getElementById('planProgressText').textContent = count + ' of 5 steps complete' + (count === 5 ? '. Ready for your next move.' : '');
  }
  function render() {
    var plan = plans[state.goal];
    document.getElementById('planTitle').textContent = plan.title;
    document.getElementById('planDescription').textContent = plan.description;
    document.getElementById('planSaveStatus').textContent = '';
    document.querySelectorAll('[data-goal]').forEach(function (button) { button.setAttribute('aria-pressed',String(button.dataset.goal === state.goal)); });
    document.getElementById('planSteps').innerHTML = plan.steps.map(function (step,index) {
      return '<li><input type="checkbox" id="step-' + index + '" data-step="' + index + '"' + (checked().includes(index) ? ' checked' : '') + '><div><label for="step-' + index + '">' + step[0] + '</label><p>' + step[1] + '</p><a href="' + prefix + step[2] + '/" data-playbook-module="' + step[2] + '">' + step[3] + ' →</a></div></li>';
    }).join('');
    updateProgress();
  }
  try {
    var saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved && plans[saved.goal] && saved.completed && typeof saved.completed === 'object') {
      state = {goal:saved.goal,completed:{}};
      Object.keys(plans).forEach(function (goal) { state.completed[goal] = Array.isArray(saved.completed[goal]) ? Array.from(new Set(saved.completed[goal].filter(function (index) { return Number.isInteger(index) && index >= 0 && index < 5; }))) : []; });
    }
  } catch (_) {}
  var linkedGoal = new URLSearchParams(location.search).get('goal');
  if (plans[linkedGoal]) state.goal = linkedGoal;
  document.addEventListener('click',function (event) {
    var goal = event.target.closest('[data-goal]');
    if (goal && plans[goal.dataset.goal]) { state.goal = goal.dataset.goal; save(); render(); track('afrostream_playbook_goal_selected',{goal:state.goal}); }
    var module = event.target.closest('[data-playbook-module]');
    if (module) track('afrostream_playbook_lesson_opened',{goal:state.goal,lesson:module.dataset.playbookModule});
  });
  document.getElementById('planSteps').addEventListener('change',function (event) {
    var input = event.target.closest('[data-step]');
    if (!input) return;
    var index = Number(input.dataset.step), completed = checked().filter(function (n) { return n !== index; });
    if (input.checked) completed.push(index);
    state.completed[state.goal] = completed; save(); updateProgress();
    track('afrostream_playbook_step_changed',{goal:state.goal,step:index + 1,completed:input.checked});
    if (completed.length === 5) track('afrostream_playbook_checklist_completed',{goal:state.goal});
  });
  document.getElementById('resetPlan').addEventListener('click',function () { state.completed[state.goal] = []; save(); render(); });
  document.getElementById('downloadPlan').addEventListener('click',function () {
    var plan = plans[state.goal];
    var text = 'AFROSTREAM CREATOR PLAYBOOK\n' + plan.title + '\n\n' + plan.description + '\n\n' + plan.steps.map(function (step,index) {
      return (checked().includes(index) ? '[x] ' : '[ ] ') + (index + 1) + '. ' + step[0] + '\n' + step[1] + '\nhttps://afrotools.com' + prefix + step[2] + '/';
    }).join('\n\n') + '\n\nProgress reflects your own checklist. It does not certify results or guarantee income.\nhttps://afrotools.com/tools/afrostream/university/\n';
    var url = URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
    var link = document.createElement('a'); link.href = url; link.download = 'afrostream-' + state.goal + '-plan.txt'; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); },1000);
    document.getElementById('planSaveStatus').textContent = 'Your plan has been downloaded.';
    track('afrostream_playbook_plan_saved',{goal:state.goal});
  });
  render();
  track('afrostream_playbook_viewed',{goal:state.goal});
})();
