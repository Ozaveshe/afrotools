(function () {
  'use strict';
  var fields = ['name', 'role', 'skills', 'education'];
  var result = document.getElementById('cvResult');
  function read() {
    var state = {};
    fields.forEach(function (id) { state[id] = document.getElementById(id).value.trim(); });
    return state;
  }
  function draft() {
    var state = read();
    result.style.display = 'block';
    result.replaceChildren();
    if (!state.name || !state.role) {
      result.textContent = !state.name ? 'Saka sunanka kafin gina daftarin CV.' : 'Saka aikin da kake nema kafin gina daftarin CV.';
      document.getElementById(!state.name ? 'name' : 'role').focus();
      return null;
    }
    var title = document.createElement('strong');
    title.textContent = state.name;
    result.appendChild(title);
    [state.role, 'Ƙwarewa: ' + state.skills, 'Ilimi ko horo: ' + state.education].forEach(function (text) {
      var paragraph = document.createElement('p');
      paragraph.textContent = text;
      result.appendChild(paragraph);
    });
    return state;
  }
  window.draftCv = draft;
  window.downloadCvBrief = function () {
    var state = draft();
    if (!state) return;
    var text = 'Takaitaccen CV\n\nSuna: ' + state.name + '\nAiki: ' + state.role +
      '\nƘwarewa: ' + state.skills + '\nIlimi ko horo: ' + state.education +
      '\n\nSirri: an shirya wannan a cikin burauza.';
    var link = document.createElement('a');
    var url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    link.href = url;
    link.download = 'ha-cv-brief.txt';
    link.dataset.noPdfGate = 'true';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  };
})();
