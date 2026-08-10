!function() {
  "use strict";

  var sw = document.documentElement.lang === 'sw';
  var swCopy = {
    'File too large. Max 500MB.': 'Faili ni kubwa sana. Kiwango ni MB 500.',
    'Unsupported format. Use MP4, WebM, or MOV.': 'Muundo haukubaliki. Tumia MP4, WebM au MOV.',
    'Upload a video first': 'Pakia video kwanza',
    'Speech Recognition not supported. Use Chrome.': 'Utambuzi wa sauti haupatikani. Tumia Chrome.',
    'Starting speech recognition...': 'Inaanza kutambua sauti...',
    'No speech detected. Try adding captions manually.': 'Hakuna sauti iliyotambuliwa. Ongeza manukuu mwenyewe.',
    'Could not start speech recognition': 'Utambuzi wa sauti haukuweza kuanza',
    'Video exported!': 'Video imepakuliwa!',
    'Database error': 'Hitilafu ya hifadhi ya ndani',
    'Nothing to save': 'Hakuna mradi wa kuhifadhi',
    'Project saved!': 'Mradi umehifadhiwa!',
    'Save failed': 'Uhifadhi umeshindwa',
    'No saved project found': 'Hakuna mradi uliohifadhiwa',
    'Project restored!': 'Mradi umerejeshwa!',
  };
  function tr(message) {
    if (!sw) return message;
    if (swCopy[message]) return swCopy[message];
    return String(message)
      .replace(/^Video loaded: /, 'Video imepakiwa: ')
      .replace(/^In point: /, 'Mwanzo: ')
      .replace(/^Out point: /, 'Mwisho: ')
      .replace(/ captions generated$/, ' manukuu yametengenezwa')
      .replace(/^Speed: /, 'Kasi: ');
  }

  /* ================================================
     STATE
  ================================================ */
  var videoEl = document.getElementById('videoEl');
  var captionOverlay = document.getElementById('captionOverlay');
  var state = {
    file: null,
    duration: 0,
    trimStart: 0,
    trimEnd: 0,
    captions: [],       // [{id, start, end, text}]
    overlays: [],       // [{id, time, text, animation}]
    captionStyle: 'classic',
    ratio: '16-9',
    bgFill: 'blur',
    quality: 1080,
    customStyle: { font: 'DM Sans', size: 24, color: '#ffffff', bg: '#000000', bgOn: false, pos: 'bottom' },
    isPlaying: false,
    nextId: 1
  };

  /* ================================================
     UTILS
  ================================================ */
  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = tr(msg); el.classList.add('show');
    setTimeout(function() { el.classList.remove('show'); }, 2500);
  }

  function fmtTime(s) {
    if (!s || isNaN(s)) return '0:00';
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function uid() { return state.nextId++; }

  /* ================================================
     FILE UPLOAD
  ================================================ */
  var dropzone = document.getElementById('dropzone');
  var fileInput = document.getElementById('fileInput');
  var editor = document.getElementById('editor');

  dropzone.addEventListener('click', function(e) {
    if (e.target.tagName !== 'INPUT') fileInput.click();
  });

  dropzone.addEventListener('dragover', function(e) { e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', function() { dropzone.classList.remove('dragover'); });
  dropzone.addEventListener('drop', function(e) {
    e.preventDefault(); dropzone.classList.remove('dragover');
    var files = e.dataTransfer.files;
    if (files.length) loadVideo(files[0]);
  });

  fileInput.addEventListener('change', function() {
    if (fileInput.files.length) loadVideo(fileInput.files[0]);
  });

  function loadVideo(file) {
    if (file.size > 500 * 1024 * 1024) { toast('File too large. Max 500MB.'); return; }
    var validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (validTypes.indexOf(file.type) === -1 && !file.name.match(/\.(mp4|webm|mov)$/i)) {
      toast('Unsupported format. Use MP4, WebM, or MOV.'); return;
    }

    state.file = file;
    var url = URL.createObjectURL(file);
    videoEl.src = url;
    videoEl.load();

    function activateEditor(duration) {
      state.duration = Number.isFinite(duration) && duration > 0 ? duration : 0;
      state.trimStart = 0;
      state.trimEnd = state.duration;
      state.captions = [];
      state.overlays = [];

      dropzone.style.display = 'none';
      editor.classList.add('active');

      updateTimeDisplay();
      updateTrimDisplay();
      renderCaptions();
      renderOverlays();
      toast('Video loaded: ' + file.name);
    }
    videoEl.onloadedmetadata = function() {
      if (Number.isFinite(videoEl.duration)) {
        activateEditor(videoEl.duration);
        return;
      }
      videoEl.ontimeupdate = function() {
        if (!Number.isFinite(videoEl.duration)) return;
        videoEl.ontimeupdate = null;
        videoEl.currentTime = 0;
        activateEditor(videoEl.duration);
      };
      videoEl.currentTime = 1e101;
    };
  }

  // New Video button
  document.getElementById('newVideoBtn').addEventListener('click', function() {
    if (state.file && !confirm(sw ? 'Uanze upya? Kazi ambayo haijahifadhiwa itapotea.' : 'Start over? Unsaved work will be lost.')) return;
    videoEl.pause(); videoEl.src = '';
    state.file = null; state.duration = 0;
    state.captions = []; state.overlays = [];
    editor.classList.remove('active');
    dropzone.style.display = '';
    fileInput.value = '';
  });

  /* ================================================
     TRANSPORT CONTROLS
  ================================================ */
  var playBtn = document.getElementById('playBtn');

  playBtn.addEventListener('click', function() { togglePlay(); });

  function togglePlay() {
    if (!state.file) return;
    if (videoEl.paused) { videoEl.play(); state.isPlaying = true; playBtn.innerHTML = '&#9208;&#65039;'; }
    else { videoEl.pause(); state.isPlaying = false; playBtn.innerHTML = '&#9654;&#65039;'; }
  }

  document.getElementById('skipBackBtn').addEventListener('click', function() {
    videoEl.currentTime = Math.max(0, videoEl.currentTime - 5);
  });
  document.getElementById('skipFwdBtn').addEventListener('click', function() {
    videoEl.currentTime = Math.min(state.duration, videoEl.currentTime + 5);
  });

  document.getElementById('volumeSlider').addEventListener('input', function() {
    videoEl.volume = parseFloat(this.value);
  });

  document.getElementById('fullscreenBtn').addEventListener('click', function() {
    var wrap = document.getElementById('playerWrap');
    if (wrap.requestFullscreen) wrap.requestFullscreen();
    else if (wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen();
  });

  // Time update loop
  videoEl.addEventListener('timeupdate', function() {
    updateTimeDisplay();
    updatePlayhead();
    updateCaptionOverlay();
  });

  videoEl.addEventListener('ended', function() {
    state.isPlaying = false;
    playBtn.innerHTML = '&#9654;&#65039;';
  });

  function updateTimeDisplay() {
    document.getElementById('timeDisplay').textContent = fmtTime(videoEl.currentTime) + ' / ' + fmtTime(state.duration);
  }

  /* ================================================
     TIMELINE
  ================================================ */
  var timelineStrip = document.getElementById('timelineStrip');
  var playheadEl = document.getElementById('playhead');
  var trimRegion = document.getElementById('trimRegion');
  var trimStartHandle = document.getElementById('trimStart');
  var trimEndHandle = document.getElementById('trimEnd');

  function updatePlayhead() {
    if (!state.duration) return;
    var pct = (videoEl.currentTime / state.duration) * 100;
    playheadEl.style.left = pct + '%';
    document.getElementById('timelineProgress').style.width = pct + '%';
  }

  function updateTrimDisplay() {
    if (!state.duration) return;
    var startPct = (state.trimStart / state.duration) * 100;
    var endPct = (state.trimEnd / state.duration) * 100;
    trimRegion.style.left = startPct + '%';
    trimRegion.style.width = (endPct - startPct) + '%';
    document.getElementById('trimStartTime').textContent = fmtTime(state.trimStart);
    document.getElementById('trimEndTime').textContent = fmtTime(state.trimEnd);
    var trimDur = state.trimEnd - state.trimStart;
    document.getElementById('trimLabel').textContent = fmtTime(trimDur) + (sw ? ' imechaguliwa' : ' selected');
  }

  // Click timeline to seek
  timelineStrip.addEventListener('click', function(e) {
    if (!state.duration) return;
    var rect = timelineStrip.getBoundingClientRect();
    var pct = (e.clientX - rect.left) / rect.width;
    videoEl.currentTime = pct * state.duration;
  });

  // Drag trim handles
  function makeTrimDraggable(handle, isStart) {
    var dragging = false;
    handle.addEventListener('mousedown', function(e) { e.stopPropagation(); dragging = true; });
    handle.addEventListener('touchstart', function(e) { e.stopPropagation(); dragging = true; }, { passive: true });

    function onMove(clientX) {
      if (!dragging || !state.duration) return;
      var rect = timelineStrip.getBoundingClientRect();
      var pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      var time = pct * state.duration;
      if (isStart) {
        state.trimStart = Math.min(time, state.trimEnd - 0.5);
      } else {
        state.trimEnd = Math.max(time, state.trimStart + 0.5);
      }
      updateTrimDisplay();
    }

    document.addEventListener('mousemove', function(e) { onMove(e.clientX); });
    document.addEventListener('touchmove', function(e) { if (dragging) onMove(e.touches[0].clientX); });
    document.addEventListener('mouseup', function() { dragging = false; });
    document.addEventListener('touchend', function() { dragging = false; });
  }

  makeTrimDraggable(trimStartHandle, true);
  makeTrimDraggable(trimEndHandle, false);

  /* ================================================
     KEYBOARD SHORTCUTS
  ================================================ */
  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (!state.file) return;

    switch (e.key.toLowerCase()) {
      case 'k': case ' ':
        e.preventDefault(); togglePlay(); break;
      case 'j':
        videoEl.currentTime = Math.max(0, videoEl.currentTime - 10); break;
      case 'l':
        videoEl.currentTime = Math.min(state.duration, videoEl.currentTime + 10); break;
      case 'i':
        state.trimStart = videoEl.currentTime; updateTrimDisplay();
        toast('In point: ' + fmtTime(state.trimStart)); break;
      case 'o':
        state.trimEnd = videoEl.currentTime; updateTrimDisplay();
        toast('Out point: ' + fmtTime(state.trimEnd)); break;
    }
  });

  /* ================================================
     TAB SWITCHING
  ================================================ */
  document.querySelectorAll('.ccl-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.ccl-tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.ccl-tab-panel').forEach(function(p) { p.classList.remove('active'); });
      tab.classList.add('active');
      var panelId = 'panel-' + tab.getAttribute('data-tab');
      document.getElementById(panelId).classList.add('active');
    });
  });

  /* ================================================
     AUTO CAPTIONS (Web Speech API)
  ================================================ */
  document.getElementById('genCaptionsBtn').addEventListener('click', function() {
    if (!state.file) { toast('Upload a video first'); return; }

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast('Speech Recognition not supported. Use Chrome.');
      return;
    }

    var btn = document.getElementById('genCaptionsBtn');
    btn.classList.add('loading'); btn.disabled = true;

    var recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    var tempCaptions = [];
    var startTime = 0;

    // We need audio context to feed recognition from video
    // Approach: play video, let mic pick up OR use a simulated approach
    // For browser-only, we'll play the video and capture via AudioContext
    var audioCtx, source, dest, mediaStream;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      source = audioCtx.createMediaElementSource(videoEl);
      dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      source.connect(audioCtx.destination); // keep audio audible
      mediaStream = dest.stream;
    } catch (err) {
      // If already connected, just use direct
      toast('Starting speech recognition...');
    }

    // Use the video's current time as reference
    videoEl.currentTime = state.trimStart;
    videoEl.play();
    state.isPlaying = true;
    playBtn.innerHTML = '&#9208;&#65039;';

    var lastResultTime = videoEl.currentTime;

    recognition.onresult = function(event) {
      for (var i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          var text = event.results[i][0].transcript.trim();
          if (text) {
            var now = videoEl.currentTime;
            var capStart = lastResultTime;
            var capEnd = now;
            // Ensure min 1s duration
            if (capEnd - capStart < 1) capEnd = capStart + 1;
            tempCaptions.push({ id: uid(), start: capStart, end: capEnd, text: text });
            lastResultTime = now;
          }
        }
      }
      renderCaptions();
    };

    recognition.onerror = function(ev) {
      console.warn('Speech recognition error:', ev.error);
      if (ev.error === 'no-speech') return; // ignore
      stopRecognition();
    };

    recognition.onend = function() {
      // Recognition can auto-stop; restart if still playing
      if (state.isPlaying && videoEl.currentTime < state.trimEnd) {
        try { recognition.start(); } catch (e) {}
      }
    };

    function stopRecognition() {
      try { recognition.stop(); } catch (e) {}
      videoEl.pause();
      state.isPlaying = false;
      playBtn.innerHTML = '&#9654;&#65039;';
      btn.classList.remove('loading'); btn.disabled = false;

      if (tempCaptions.length) {
        state.captions = state.captions.concat(tempCaptions);
        renderCaptions();
        toast(tempCaptions.length + ' captions generated');
      } else {
        toast('No speech detected. Try adding captions manually.');
      }
    }

    // Stop when reaching trim end
    var checkInterval = setInterval(function() {
      if (videoEl.currentTime >= state.trimEnd || videoEl.paused) {
        clearInterval(checkInterval);
        stopRecognition();
      }
    }, 500);

    // Also stop after 2 minutes max
    setTimeout(function() {
      clearInterval(checkInterval);
      stopRecognition();
    }, 120000);

    try { recognition.start(); } catch (e) {
      btn.classList.remove('loading'); btn.disabled = false;
      toast('Could not start speech recognition');
    }
  });

  /* ================================================
     CAPTION LIST RENDER
  ================================================ */
  function renderCaptions() {
    var list = document.getElementById('captionList');
    var empty = document.getElementById('captionEmpty');
    if (!state.captions.length) {
      empty.style.display = '';
      // Remove all rows but keep empty
      var rows = list.querySelectorAll('.ccl-caption-row');
      rows.forEach(function(r) { r.remove(); });
      return;
    }
    empty.style.display = 'none';

    // Remove existing rows
    var rows = list.querySelectorAll('.ccl-caption-row');
    rows.forEach(function(r) { r.remove(); });

    state.captions.forEach(function(cap, idx) {
      var row = document.createElement('div');
      row.className = 'ccl-caption-row';
      row.setAttribute('data-id', cap.id);

      var timeSpan = document.createElement('span');
      timeSpan.className = 'ccl-caption-time';
      timeSpan.textContent = fmtTime(cap.start) + ' - ' + fmtTime(cap.end);
      timeSpan.addEventListener('click', function() {
        videoEl.currentTime = cap.start;
      });

      var input = document.createElement('input');
      input.className = 'ccl-caption-text-input';
      input.type = 'text';
      input.value = cap.text;
      input.placeholder = sw ? 'Maandishi ya nukuu...' : 'Caption text...';
      input.addEventListener('input', function() { cap.text = input.value; });

      var delBtn = document.createElement('button');
      delBtn.className = 'ccl-caption-delete';
      delBtn.innerHTML = '&#10005;';
      delBtn.addEventListener('click', function() {
        state.captions.splice(idx, 1);
        renderCaptions();
      });

      row.appendChild(timeSpan);
      row.appendChild(input);
      row.appendChild(delBtn);
      list.appendChild(row);
    });
  }

  // Add caption manually
  document.getElementById('addCaptionBtn').addEventListener('click', function() {
    var t = videoEl.currentTime || 0;
    state.captions.push({ id: uid(), start: t, end: Math.min(t + 3, state.duration || t + 3), text: '' });
    renderCaptions();
    // Focus last input
    var inputs = document.querySelectorAll('.ccl-caption-text-input');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  // Clear captions
  document.getElementById('clearCaptionsBtn').addEventListener('click', function() {
    if (state.captions.length && !confirm(sw ? 'Ufute manukuu yote?' : 'Clear all captions?')) return;
    state.captions = [];
    renderCaptions();
  });

  /* ================================================
     CAPTION OVERLAY (real-time)
  ================================================ */
  function updateCaptionOverlay() {
    var t = videoEl.currentTime;
    var active = null;
    for (var i = 0; i < state.captions.length; i++) {
      if (t >= state.captions[i].start && t <= state.captions[i].end) {
        active = state.captions[i]; break;
      }
    }
    captionOverlay.textContent = active ? active.text : '';

    // Highlight active row
    document.querySelectorAll('.ccl-caption-row').forEach(function(row) {
      var id = parseInt(row.getAttribute('data-id'));
      row.classList.toggle('active', active && active.id === id);
    });
  }

  /* ================================================
     CAPTION STYLES
  ================================================ */
  document.getElementById('styleGrid').addEventListener('click', function(e) {
    var card = e.target.closest('.ccl-style-card');
    if (!card) return;
    document.querySelectorAll('.ccl-style-card').forEach(function(c) { c.classList.remove('active'); });
    card.classList.add('active');
    state.captionStyle = card.getAttribute('data-style');

    // Update overlay class
    captionOverlay.className = 'ccl-caption-overlay style-' + state.captionStyle;

    // Show/hide custom controls
    var customEl = document.getElementById('customControls');
    customEl.classList.toggle('active', state.captionStyle === 'custom');

    if (state.captionStyle === 'custom') applyCustomStyle();
  });

  // Custom style controls
  function applyCustomStyle() {
    var s = state.customStyle;
    captionOverlay.style.fontFamily = s.font;
    captionOverlay.style.fontSize = s.size + 'px';
    captionOverlay.style.color = s.color;
    captionOverlay.style.background = s.bgOn ? s.bg : 'transparent';
    captionOverlay.style.padding = s.bgOn ? '8px 16px' : '0';
    captionOverlay.style.borderRadius = s.bgOn ? '8px' : '0';

    // Position
    captionOverlay.style.bottom = s.pos === 'bottom' ? '12%' : s.pos === 'center' ? '45%' : 'auto';
    captionOverlay.style.top = s.pos === 'top' ? '8%' : 'auto';
  }

  document.getElementById('customFont').addEventListener('change', function() {
    state.customStyle.font = this.value; applyCustomStyle();
  });
  document.getElementById('customSize').addEventListener('input', function() {
    state.customStyle.size = parseInt(this.value);
    document.getElementById('customSizeVal').textContent = this.value + 'px';
    applyCustomStyle();
  });
  document.getElementById('customColor').addEventListener('input', function() {
    state.customStyle.color = this.value; applyCustomStyle();
  });
  document.getElementById('customBg').addEventListener('input', function() {
    state.customStyle.bg = this.value; applyCustomStyle();
  });
  document.getElementById('customBgOn').addEventListener('change', function() {
    state.customStyle.bgOn = this.checked; applyCustomStyle();
  });
  document.getElementById('customPos').addEventListener('change', function() {
    state.customStyle.pos = this.value; applyCustomStyle();
  });

  /* ================================================
     PLATFORM RESIZE
  ================================================ */
  document.getElementById('resizeGrid').addEventListener('click', function(e) {
    var card = e.target.closest('.ccl-resize-card');
    if (!card) return;
    document.querySelectorAll('.ccl-resize-card').forEach(function(c) { c.classList.remove('active'); });
    card.classList.add('active');
    state.ratio = card.getAttribute('data-ratio');

    var wrap = document.getElementById('playerWrap');
    wrap.className = 'ccl-player-wrap';
    if (state.ratio !== '16-9') wrap.classList.add('ratio-' + state.ratio);
  });

  // BG fill pills
  wirePills('bgFillPills');
  function wirePills(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', function(e) {
      var pill = e.target.closest('.ccl-pill');
      if (!pill) return;
      el.querySelectorAll('.ccl-pill').forEach(function(p) { p.classList.remove('active'); });
      pill.classList.add('active');
      if (id === 'bgFillPills') state.bgFill = pill.getAttribute('data-val');
    });
  }

  // Quality pills
  wirePills('qualityPills');
  document.getElementById('qualityPills').addEventListener('click', function(e) {
    var pill = e.target.closest('.ccl-pill');
    if (pill) state.quality = parseInt(pill.getAttribute('data-val'));
  });

  /* ================================================
     TEXT OVERLAYS
  ================================================ */
  function renderOverlays() {
    var list = document.getElementById('overlayList');
    var empty = document.getElementById('overlayEmpty');
    var existing = list.querySelectorAll('.ccl-overlay-row');
    existing.forEach(function(r) { r.remove(); });

    if (!state.overlays.length) { empty.style.display = ''; return; }
    empty.style.display = 'none';

    state.overlays.forEach(function(ov, idx) {
      var row = document.createElement('div');
      row.className = 'ccl-overlay-row';

      var timeInput = document.createElement('input');
      timeInput.className = 'ccl-overlay-time-input';
      timeInput.type = 'text';
      timeInput.value = fmtTime(ov.time);
      timeInput.title = sw ? 'Muda (bofya kuweka muda wa sasa)' : 'Time (click to set to current)';
      timeInput.addEventListener('click', function() {
        ov.time = videoEl.currentTime;
        timeInput.value = fmtTime(ov.time);
      });

      var textInput = document.createElement('input');
      textInput.className = 'ccl-overlay-text-input';
      textInput.type = 'text';
      textInput.value = ov.text;
      textInput.placeholder = sw ? 'Maandishi ya juu...' : 'Overlay text...';
      textInput.addEventListener('input', function() { ov.text = textInput.value; });

      var animSelect = document.createElement('select');
      animSelect.className = 'ccl-overlay-anim-select';
      ['fade', 'pop', 'slide'].forEach(function(a) {
        var opt = document.createElement('option');
        opt.value = a;
        opt.textContent = sw ? ({fade:'Fifia',pop:'Jitokeze',slide:'Teleza'}[a] || a) : a.charAt(0).toUpperCase() + a.slice(1);
        if (ov.animation === a) opt.selected = true;
        animSelect.appendChild(opt);
      });
      animSelect.addEventListener('change', function() { ov.animation = animSelect.value; });

      var delBtn = document.createElement('button');
      delBtn.className = 'ccl-caption-delete';
      delBtn.innerHTML = '&#10005;';
      delBtn.addEventListener('click', function() {
        state.overlays.splice(idx, 1);
        renderOverlays();
      });

      row.appendChild(timeInput);
      row.appendChild(textInput);
      row.appendChild(animSelect);
      row.appendChild(delBtn);
      list.appendChild(row);
    });
  }

  document.getElementById('addOverlayBtn').addEventListener('click', function() {
    state.overlays.push({ id: uid(), time: videoEl.currentTime || 0, text: '', animation: 'fade' });
    renderOverlays();
    var inputs = document.querySelectorAll('.ccl-overlay-text-input');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  /* ================================================
     EXPORT (Canvas + MediaRecorder)
  ================================================ */
  document.getElementById('exportBtn').addEventListener('click', function() {
    if (!state.file) { toast('Upload a video first'); return; }

    var btn = document.getElementById('exportBtn');
    btn.disabled = true;
    btn.textContent = sw ? 'Inapakua...' : 'Exporting...';

    var progressWrap = document.getElementById('exportProgress');
    var progressFill = document.getElementById('progressFill');
    var progressText = document.getElementById('progressText');
    progressWrap.classList.add('active');
    progressFill.style.width = '0%';
    progressText.textContent = sw ? 'Inaandaa...' : 'Preparing...';

    // Determine output size
    var ratioMap = { '16-9': [16,9], '9-16': [9,16], '1-1': [1,1], '4-5': [4,5] };
    var r = ratioMap[state.ratio] || [16,9];
    var maxH = state.quality;
    var cW, cH;
    if (r[0] >= r[1]) {
      cH = maxH;
      cW = Math.round(maxH * r[0] / r[1]);
    } else {
      cW = Math.round(maxH * r[0] / r[1]);
      cH = maxH;
    }
    // Ensure even dimensions
    cW = cW % 2 === 0 ? cW : cW + 1;
    cH = cH % 2 === 0 ? cH : cH + 1;

    var canvas = document.createElement('canvas');
    canvas.width = cW;
    canvas.height = cH;
    var ctx = canvas.getContext('2d');

    // Clone video for export
    var exportVideo = document.createElement('video');
    exportVideo.src = videoEl.src;
    exportVideo.muted = false;
    exportVideo.volume = 1;

    exportVideo.onloadedmetadata = function() {
      exportVideo.currentTime = state.trimStart;

      exportVideo.onseeked = function() {
        exportVideo.onseeked = null;
        startRecording();
      };
    };

    function startRecording() {
      var stream = canvas.captureStream(30);

      // Add audio track from video
      try {
        var aud = new AudioContext();
        var audSrc = aud.createMediaElementSource(exportVideo);
        var audDest = aud.createMediaStreamDestination();
        audSrc.connect(audDest);
        audSrc.connect(aud.destination);
        audDest.stream.getAudioTracks().forEach(function(t) { stream.addTrack(t); });
      } catch (e) {
        console.warn('Audio export error:', e);
      }

      var mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      var recorder = new MediaRecorder(stream, { mimeType: mimeType, videoBitsPerSecond: state.quality >= 1080 ? 8000000 : state.quality >= 720 ? 4000000 : 2000000 });
      var chunks = [];

      recorder.ondataavailable = function(e) { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = function() {
        var blob = new Blob(chunks, { type: 'video/webm' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'creatorclip-export.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        btn.disabled = false;
        btn.textContent = sw ? 'Pakua video' : 'Export Video';
        progressText.textContent = sw ? 'Imekamilika!' : 'Done!';
        progressFill.style.width = '100%';
        toast('Video exported!');

        setTimeout(function() { progressWrap.classList.remove('active'); }, 3000);
      };

      recorder.start(100);
      exportVideo.play();

      var trimDuration = state.trimEnd - state.trimStart;

      function drawFrame() {
        if (exportVideo.paused || exportVideo.ended || exportVideo.currentTime >= state.trimEnd) {
          exportVideo.pause();
          recorder.stop();
          return;
        }

        // Draw background fill
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, cW, cH);

        // Calculate video draw size (fit within canvas)
        var vw = exportVideo.videoWidth;
        var vh = exportVideo.videoHeight;
        var scale = Math.min(cW / vw, cH / vh);
        var dw = vw * scale;
        var dh = vh * scale;
        var dx = (cW - dw) / 2;
        var dy = (cH - dh) / 2;

        // Background fill
        if (state.bgFill === 'blur') {
          ctx.filter = 'blur(20px)';
          ctx.drawImage(exportVideo, -20, -20, cW + 40, cH + 40);
          ctx.filter = 'none';
        } else if (state.bgFill === 'white') {
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, cW, cH);
        } else if (state.bgFill === 'gradient') {
          var grad = ctx.createLinearGradient(0, 0, 0, cH);
          grad.addColorStop(0, '#1a1a2e');
          grad.addColorStop(1, '#16213e');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, cW, cH);
        }
        // else black (already filled)

        // Draw video
        ctx.drawImage(exportVideo, dx, dy, dw, dh);

        // Draw caption
        var t = exportVideo.currentTime;
        var activeCap = null;
        for (var i = 0; i < state.captions.length; i++) {
          if (t >= state.captions[i].start && t <= state.captions[i].end) {
            activeCap = state.captions[i]; break;
          }
        }

        if (activeCap) {
          drawCaption(ctx, activeCap.text, cW, cH);
        }

        // Progress
        var elapsed = exportVideo.currentTime - state.trimStart;
        var pct = Math.min(100, (elapsed / trimDuration) * 100);
        progressFill.style.width = pct + '%';
        progressText.textContent = Math.round(pct) + '% — ' + fmtTime(elapsed) + ' / ' + fmtTime(trimDuration);

        requestAnimationFrame(drawFrame);
      }

      drawFrame();
    }
  });

  function drawCaption(ctx, text, cW, cH) {
    var style = state.captionStyle;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var y = cH * 0.85;
    var fontSize = Math.round(cH / 18);

    switch (style) {
      case 'classic':
        ctx.font = '700 ' + fontSize + 'px DM Sans, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 6;
        ctx.fillText(text, cW / 2, y, cW * 0.9);
        ctx.shadowBlur = 0;
        break;
      case 'bold-yellow':
        ctx.font = '900 ' + Math.round(fontSize * 1.2) + 'px Impact, sans-serif';
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(text, cW / 2, y, cW * 0.9);
        ctx.fillText(text, cW / 2, y, cW * 0.9);
        break;
      case 'karaoke':
        ctx.font = '700 ' + fontSize + 'px DM Sans, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(text, cW / 2, y, cW * 0.9);
        ctx.shadowBlur = 0;
        break;
      case 'minimal':
        ctx.font = '400 ' + Math.round(fontSize * 0.85) + 'px DM Sans, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(text.toLowerCase(), cW / 2, y, cW * 0.9);
        break;
      case 'neon':
        ctx.font = '700 ' + fontSize + 'px DM Sans, sans-serif';
        ctx.fillStyle = '#0ff';
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 20;
        ctx.fillText(text, cW / 2, y, cW * 0.9);
        ctx.shadowBlur = 0;
        break;
      case 'typewriter':
        ctx.font = '600 ' + Math.round(fontSize * 0.9) + 'px Courier New, monospace';
        var tw = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(cW / 2 - tw / 2 - 16, y - fontSize / 2 - 8, tw + 32, fontSize + 16);
        ctx.fillStyle = '#fff';
        ctx.fillText(text, cW / 2, y, cW * 0.9);
        break;
      case 'gradient':
        ctx.font = '800 ' + Math.round(fontSize * 1.1) + 'px DM Sans, sans-serif';
        var grd = ctx.createLinearGradient(cW * 0.2, y, cW * 0.8, y);
        grd.addColorStop(0, '#EF4444');
        grd.addColorStop(0.5, '#F59E0B');
        grd.addColorStop(1, '#10B981');
        ctx.fillStyle = grd;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 6;
        ctx.fillText(text, cW / 2, y, cW * 0.9);
        ctx.shadowBlur = 0;
        break;
      case 'custom':
        var cs = state.customStyle;
        ctx.font = '700 ' + cs.size + 'px ' + cs.font + ', sans-serif';
        if (cs.bgOn) {
          var m = ctx.measureText(text);
          ctx.fillStyle = cs.bg;
          ctx.fillRect(cW / 2 - m.width / 2 - 12, y - cs.size / 2 - 6, m.width + 24, cs.size + 12);
        }
        ctx.fillStyle = cs.color;
        var posY = cs.pos === 'top' ? cH * 0.1 : cs.pos === 'center' ? cH * 0.5 : cH * 0.85;
        ctx.fillText(text, cW / 2, posY, cW * 0.9);
        break;
      default:
        ctx.font = '700 ' + fontSize + 'px DM Sans, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(text, cW / 2, y, cW * 0.9);
    }
  }

  /* ================================================
     PROJECT SAVE / LOAD (IndexedDB)
  ================================================ */
  var DB_NAME = 'CreatorClipDB';
  var STORE_NAME = 'projects';

  function openDB(cb) {
    var req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = function() {
      var db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = function() { cb(req.result); };
    req.onerror = function() { toast('Database error'); };
  }

  document.getElementById('saveProjectBtn').addEventListener('click', function() {
    if (!state.file) { toast('Nothing to save'); return; }

    var reader = new FileReader();
    reader.onload = function() {
      var project = {
        id: 'project-1',
        name: state.file.name,
        videoData: reader.result,
        videoType: state.file.type,
        captions: state.captions,
        overlays: state.overlays,
        captionStyle: state.captionStyle,
        ratio: state.ratio,
        bgFill: state.bgFill,
        quality: state.quality,
        trimStart: state.trimStart,
        trimEnd: state.trimEnd,
        customStyle: state.customStyle,
        savedAt: Date.now()
      };

      openDB(function(db) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(project);
        tx.oncomplete = function() { toast('Project saved!'); };
        tx.onerror = function() { toast('Save failed'); };
      });
    };
    reader.readAsArrayBuffer(state.file);
  });

  document.getElementById('loadProjectBtn').addEventListener('click', function() {
    openDB(function(db) {
      var tx = db.transaction(STORE_NAME, 'readonly');
      var req = tx.objectStore(STORE_NAME).get('project-1');
      req.onsuccess = function() {
        var project = req.result;
        if (!project) { toast('No saved project found'); return; }

        // Restore video
        var blob = new Blob([project.videoData], { type: project.videoType || 'video/mp4' });
        var file = new File([blob], project.name || 'video.mp4', { type: project.videoType || 'video/mp4' });
        state.file = file;
        var url = URL.createObjectURL(blob);
        videoEl.src = url;
        videoEl.load();

        videoEl.onloadedmetadata = function() {
          state.duration = videoEl.duration;
          state.trimStart = project.trimStart || 0;
          state.trimEnd = project.trimEnd || videoEl.duration;
          state.captions = project.captions || [];
          state.overlays = project.overlays || [];
          state.captionStyle = project.captionStyle || 'classic';
          state.ratio = project.ratio || '16-9';
          state.bgFill = project.bgFill || 'blur';
          state.quality = project.quality || 1080;
          state.customStyle = project.customStyle || state.customStyle;

          // Update UI
          dropzone.style.display = 'none';
          editor.classList.add('active');

          updateTimeDisplay();
          updateTrimDisplay();
          renderCaptions();
          renderOverlays();

          // Restore style selection
          document.querySelectorAll('.ccl-style-card').forEach(function(c) {
            c.classList.toggle('active', c.getAttribute('data-style') === state.captionStyle);
          });
          captionOverlay.className = 'ccl-caption-overlay style-' + state.captionStyle;

          // Restore ratio
          document.querySelectorAll('.ccl-resize-card').forEach(function(c) {
            c.classList.toggle('active', c.getAttribute('data-ratio') === state.ratio);
          });
          var wrap = document.getElementById('playerWrap');
          wrap.className = 'ccl-player-wrap';
          if (state.ratio !== '16-9') wrap.classList.add('ratio-' + state.ratio);

          toast('Project restored!');
        };
      };
    });
  });

  /* ================================================
     FILTERS
  ================================================ */
  var currentFilter = 'none';
  var FILTERS = {
    none: 'none',
    grayscale: 'grayscale(100%)',
    sepia: 'sepia(80%)',
    warm: 'saturate(130%) hue-rotate(-10deg) brightness(105%)',
    cool: 'saturate(80%) hue-rotate(20deg) brightness(98%)',
    vintage: 'sepia(40%) contrast(90%) brightness(95%)',
    highcontrast: 'contrast(150%) brightness(105%)',
    cinematic: 'contrast(120%) brightness(90%) saturate(80%)'
  };

  document.getElementById('filterGrid').addEventListener('click', function(e) {
    var card = e.target.closest('.ccl-style-card');
    if (!card) return;
    var filter = card.getAttribute('data-filter');
    if (!filter) return;
    currentFilter = filter;
    document.querySelectorAll('#filterGrid .ccl-style-card').forEach(function(c) { c.classList.remove('active'); });
    card.classList.add('active');
    applyVideoFilter();
  });

  ['brightnessSlider', 'contrastSlider', 'saturationSlider'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', function() {
        var valEl = document.getElementById(id.replace('Slider', 'Val'));
        if (valEl) valEl.textContent = el.value + '%';
        applyVideoFilter();
      });
    }
  });

  function applyVideoFilter() {
    var b = (document.getElementById('brightnessSlider') || {}).value || 100;
    var c = (document.getElementById('contrastSlider') || {}).value || 100;
    var s = (document.getElementById('saturationSlider') || {}).value || 100;
    var base = 'brightness(' + (b / 100) + ') contrast(' + (c / 100) + ') saturate(' + (s / 100) + ')';
    var filterStr = FILTERS[currentFilter] || 'none';
    videoEl.style.filter = filterStr === 'none' ? base : base + ' ' + filterStr;
  }

  /* ================================================
     SPEED
  ================================================ */
  document.getElementById('speedPills').addEventListener('click', function(e) {
    var pill = e.target.closest('.ccl-pill');
    if (!pill) return;
    var speed = parseFloat(pill.getAttribute('data-speed'));
    if (isNaN(speed)) return;
    videoEl.playbackRate = speed;
    document.querySelectorAll('#speedPills .ccl-pill').forEach(function(p) { p.classList.remove('active'); });
    pill.classList.add('active');
    toast('Speed: ' + speed + 'x');
  });

  /* ================================================
     AUDIO
  ================================================ */
  var audioVol = document.getElementById('audioVolume');
  if (audioVol) {
    audioVol.addEventListener('input', function() {
      var v = parseInt(audioVol.value);
      document.getElementById('audioVolumeVal').textContent = v + '%';
      videoEl.volume = Math.min(v / 100, 1);
    });
  }

  var muteBtn = document.getElementById('muteBtn');
  if (muteBtn) {
    muteBtn.addEventListener('click', function() {
      videoEl.muted = !videoEl.muted;
      muteBtn.classList.toggle('active', videoEl.muted);
      muteBtn.innerHTML = videoEl.muted
        ? '&#128264; ' + (sw ? 'Washa sauti' : 'Unmute')
        : '&#128263; ' + (sw ? 'Nyamazisha' : 'Mute');
      toast(videoEl.muted ? 'Audio muted' : 'Audio unmuted');
    });
  }

  /* ================================================
     INIT
  ================================================ */
  renderCaptions();
  renderOverlays();

}();
