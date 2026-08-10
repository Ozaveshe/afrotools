  (function() {
    'use strict';

    var locale = window.AfroToolsCreatorRecordLocale || {};
    var strings = locale.strings || {};
    function t(key, fallback) {
      return Object.prototype.hasOwnProperty.call(strings, key) ? strings[key] : fallback;
    }

    /* ============================================
       STATE
    ============================================ */
    var state = {
      mode: 'screen',         // screen | webcam | both | audio
      recording: false,
      paused: false,
      sysAudio: true,
      mic: true,
      noiseSuppression: false,
      countdown: true,
      mirror: true,
      webcamShape: 'circle',  // circle | rounded | rect
      pipPos: 'bl',           // tl | tr | bl | br
      annoTool: 'pen',
      drawing: false,
      startX: 0, startY: 0,
      timerSec: 0,
      timerInterval: null,
      mediaRecorder: null,
      chunks: [],
      recordedBlob: null,
      screenStream: null,
      webcamStream: null,
      micStream: null,
      combinedStream: null,
      compositeCanvas: null,
      compositeCtx: null,
      compositeRAF: null
    };

    /* ============================================
       DOM REFS
    ============================================ */
    var $ = function(id) { return document.getElementById(id); };
    var modeSelector   = $('modeSelector');
    var recordBtn      = $('recordBtn');
    var pauseBtn       = $('pauseBtn');
    var stopBtn        = $('stopBtn');
    var timerDisplay   = $('timerDisplay');
    var recIndicator   = $('recIndicator');
    var previewArea    = $('previewArea');
    var previewEmpty   = $('previewEmpty');
    var liveVideo      = $('liveVideo');
    var playbackVideo  = $('playbackVideo');
    var annotationCanvas = $('annotationCanvas');
    var annotationBar  = $('annotationBar');
    var trimPanel      = $('trimPanel');
    var trimStart      = $('trimStart');
    var trimEnd        = $('trimEnd');
    var trimFill       = $('trimFill');
    var trimStartTime  = $('trimStartTime');
    var trimEndTime    = $('trimEndTime');
    var trimInfo       = $('trimInfo');
    var exportPanel    = $('exportPanel');
    var downloadBtn    = $('downloadBtn');
    var qualitySelect  = $('qualitySelect');
    var fileInfo       = $('fileInfo');
    var historyPanel   = $('historyPanel');
    var historyList    = $('historyList');
    var historyToggleBtn = $('historyToggleBtn');
    var sysAudioToggle = $('sysAudioToggle');
    var micToggle      = $('micToggle');
    var noiseToggle    = $('noiseToggle');
    var countdownToggle = $('countdownToggle');
    var mirrorToggle   = $('mirrorToggle');
    var volumeBar      = $('volumeBar');
    var webcamPanel    = $('webcamPanel');
    var cameraSelect   = $('cameraSelect');
    var toast          = $('toast');

    /* ============================================
       UTILS
    ============================================ */
    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(function() { toast.classList.remove('show'); }, 2200);
    }

    function fmtTime(sec) {
      var m = Math.floor(sec / 60);
      var s = sec % 60;
      return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }

    function fmtDuration(sec) {
      if (sec < 60) return sec.toFixed(1) + 's';
      return Math.floor(sec / 60) + 'm ' + Math.round(sec % 60) + 's';
    }

    function fmtSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(1) + ' MB';
    }

    function autoFilename() {
      var d = new Date();
      return (locale.filenamePrefix || 'CreatorRecord') + '-' + d.getFullYear() + (d.getMonth()+1 < 10 ? '0' : '') + (d.getMonth()+1) +
        (d.getDate() < 10 ? '0' : '') + d.getDate() + '-' +
        (d.getHours() < 10 ? '0' : '') + d.getHours() +
        (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    }

    /* ============================================
       TOGGLE HELPERS
    ============================================ */
    function setupToggle(btn, key) {
      btn.setAttribute('aria-pressed', state[key] ? 'true' : 'false');
      btn.addEventListener('click', function() {
        state[key] = !state[key];
        btn.classList.toggle('on', state[key]);
        btn.setAttribute('aria-pressed', state[key] ? 'true' : 'false');
      });
    }
    setupToggle(sysAudioToggle, 'sysAudio');
    setupToggle(micToggle, 'mic');
    setupToggle(noiseToggle, 'noiseSuppression');
    setupToggle(countdownToggle, 'countdown');
    setupToggle(mirrorToggle, 'mirror');

    /* ============================================
       MODE SELECTOR
    ============================================ */
    modeSelector.addEventListener('click', function(e) {
      var card = e.target.closest('.crd-mode-card');
      if (!card || state.recording) return;
      modeSelector.querySelectorAll('.crd-mode-card').forEach(function(c) { c.classList.remove('active'); });
      card.classList.add('active');
      state.mode = card.dataset.mode;
      var showCam = state.mode === 'webcam' || state.mode === 'both';
      webcamPanel.style.display = showCam ? 'block' : 'none';
      if (showCam) enumerateCameras();
    });

    function activateOnKeyboard(container, selector) {
      container.addEventListener('keydown', function(e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var target = e.target.closest(selector);
        if (!target) return;
        e.preventDefault();
        target.click();
      });
    }
    activateOnKeyboard(modeSelector, '.crd-mode-card');
    activateOnKeyboard($('pipGrid'), '.crd-pip-pos');

    /* ============================================
       WEBCAM SHAPE + PIP POSITION
    ============================================ */
    $('shapeSelector').addEventListener('click', function(e) {
      var btn = e.target.closest('.crd-shape-btn');
      if (!btn) return;
      document.querySelectorAll('.crd-shape-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.webcamShape = btn.dataset.shape;
    });

    $('pipGrid').addEventListener('click', function(e) {
      var pos = e.target.closest('.crd-pip-pos');
      if (!pos) return;
      document.querySelectorAll('.crd-pip-pos').forEach(function(p) { p.classList.remove('active'); });
      pos.classList.add('active');
      state.pipPos = pos.dataset.pos;
    });

    /* ============================================
       CAMERA ENUMERATION
    ============================================ */
    function enumerateCameras() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      navigator.mediaDevices.enumerateDevices().then(function(devices) {
        var cams = devices.filter(function(d) { return d.kind === 'videoinput'; });
        cameraSelect.innerHTML = '';
        if (cams.length === 0) {
          cameraSelect.innerHTML = '<option>' + t('noCameras', 'No cameras found') + '</option>';
          return;
        }
        cams.forEach(function(c, i) {
          var opt = document.createElement('option');
          opt.value = c.deviceId;
          opt.textContent = c.label || t('camera', 'Camera') + ' ' + (i + 1);
          cameraSelect.appendChild(opt);
        });
      });
    }

    /* ============================================
       VOLUME METER
    ============================================ */
    var audioCtx = null, analyser = null, micSource = null, volRAF = null;

    function startVolumeMeter(stream) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        micSource = audioCtx.createMediaStreamSource(stream);
        micSource.connect(analyser);
        var data = new Uint8Array(analyser.frequencyBinCount);
        function update() {
          analyser.getByteFrequencyData(data);
          var sum = 0;
          for (var i = 0; i < data.length; i++) sum += data[i];
          var avg = sum / data.length;
          volumeBar.style.width = Math.min(100, avg * 1.2) + '%';
          volRAF = requestAnimationFrame(update);
        }
        update();
      } catch(e) { /* silent */ }
    }

    function stopVolumeMeter() {
      if (volRAF) cancelAnimationFrame(volRAF);
      if (audioCtx) { audioCtx.close().catch(function(){}); audioCtx = null; }
      volumeBar.style.width = '0%';
    }

    /* ============================================
       FEATURE DETECTION
    ============================================ */
    function checkSupport() {
      if (!navigator.mediaDevices) {
        showToast(t('mediaUnsupported', 'Your browser does not support media recording'));
        return false;
      }
      if (state.mode !== 'webcam' && state.mode !== 'audio' && !navigator.mediaDevices.getDisplayMedia) {
        showToast(t('screenUnsupported', 'Screen capture not supported in this browser'));
        return false;
      }
      if (typeof MediaRecorder === 'undefined') {
        showToast(t('recorderUnsupported', 'MediaRecorder not supported — try Chrome or Edge'));
        return false;
      }
      return true;
    }

    /* ============================================
       GET STREAMS
    ============================================ */
    function getScreenStream() {
      var opts = { video: true };
      if (state.sysAudio) opts.audio = true;
      return navigator.mediaDevices.getDisplayMedia(opts);
    }

    function getWebcamStream() {
      var camId = cameraSelect.value;
      var constraints = {
        video: camId ? { deviceId: { exact: camId } } : true,
        audio: false
      };
      return navigator.mediaDevices.getUserMedia(constraints);
    }

    function getMicStream() {
      return navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: state.noiseSuppression,
          autoGainControl: true
        }
      });
    }

    /* ============================================
       COMPOSITE CANVAS (Screen + Webcam PiP)
    ============================================ */
    function startComposite(screenStream, camStream) {
      var screenTrack = screenStream.getVideoTracks()[0];
      var settings = screenTrack.getSettings();
      var W = settings.width || 1920;
      var H = settings.height || 1080;

      var canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      var ctx = canvas.getContext('2d');
      state.compositeCanvas = canvas;
      state.compositeCtx = ctx;

      var screenVid = document.createElement('video');
      screenVid.srcObject = screenStream;
      screenVid.muted = true;
      screenVid.play();

      var camVid = document.createElement('video');
      camVid.srcObject = camStream;
      camVid.muted = true;
      camVid.play();

      var pipSize = Math.round(W * 0.18);

      function draw() {
        ctx.drawImage(screenVid, 0, 0, W, H);

        var margin = 20;
        var x = 0, y = 0;
        if (state.pipPos === 'tl') { x = margin; y = margin; }
        else if (state.pipPos === 'tr') { x = W - pipSize - margin; y = margin; }
        else if (state.pipPos === 'bl') { x = margin; y = H - pipSize - margin; }
        else { x = W - pipSize - margin; y = H - pipSize - margin; }

        ctx.save();
        if (state.mirror) {
          ctx.translate(x + pipSize, y);
          ctx.scale(-1, 1);
          x = 0; y = 0;
        }

        if (state.webcamShape === 'circle') {
          ctx.beginPath();
          ctx.arc(x + pipSize / 2, y + pipSize / 2, pipSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(camVid, x, y, pipSize, pipSize);
        } else if (state.webcamShape === 'rounded') {
          var r = pipSize * 0.15;
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.arcTo(x + pipSize, y, x + pipSize, y + pipSize, r);
          ctx.arcTo(x + pipSize, y + pipSize, x, y + pipSize, r);
          ctx.arcTo(x, y + pipSize, x, y, r);
          ctx.arcTo(x, y, x + pipSize, y, r);
          ctx.clip();
          ctx.drawImage(camVid, x, y, pipSize, pipSize);
        } else {
          ctx.drawImage(camVid, x, y, pipSize, pipSize);
        }

        ctx.restore();

        // Border
        ctx.save();
        var ox = 0, oy = 0;
        if (state.pipPos === 'tl') { ox = 20; oy = 20; }
        else if (state.pipPos === 'tr') { ox = W - pipSize - 20; oy = 20; }
        else if (state.pipPos === 'bl') { ox = 20; oy = H - pipSize - 20; }
        else { ox = W - pipSize - 20; oy = H - pipSize - 20; }

        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 3;
        if (state.webcamShape === 'circle') {
          ctx.beginPath();
          ctx.arc(ox + pipSize / 2, oy + pipSize / 2, pipSize / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          var br = state.webcamShape === 'rounded' ? pipSize * 0.15 : 2;
          ctx.beginPath();
          ctx.moveTo(ox + br, oy);
          ctx.arcTo(ox + pipSize, oy, ox + pipSize, oy + pipSize, br);
          ctx.arcTo(ox + pipSize, oy + pipSize, ox, oy + pipSize, br);
          ctx.arcTo(ox, oy + pipSize, ox, oy, br);
          ctx.arcTo(ox, oy, ox + pipSize, oy, br);
          ctx.closePath();
          ctx.stroke();
        }
        ctx.restore();

        state.compositeRAF = requestAnimationFrame(draw);
      }
      draw();

      return canvas.captureStream(30);
    }

    function stopComposite() {
      if (state.compositeRAF) cancelAnimationFrame(state.compositeRAF);
      state.compositeCanvas = null;
      state.compositeCtx = null;
    }

    /* ============================================
       ANNOTATION CANVAS
    ============================================ */
    function setupAnnotations() {
      var canvas = annotationCanvas;
      var rect = previewArea.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.display = 'block';
      var ctx = canvas.getContext('2d');
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      function getXY(e) {
        var r = canvas.getBoundingClientRect();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - r.left, y: clientY - r.top };
      }

      canvas.onmousedown = canvas.ontouchstart = function(e) {
        e.preventDefault();
        var tool = state.annoTool;
        if (tool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineWidth = 20;
        } else if (tool === 'highlight') {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = 'rgba(255,255,0,0.35)';
          ctx.lineWidth = 18;
        } else if (tool === 'pen') {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 3;
        }

        if (tool === 'text') {
          var pos = getXY(e);
          var txt = prompt(t('enterText', 'Enter text:'));
          if (txt) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.font = '16px DM Sans, sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText(txt, pos.x, pos.y);
          }
          return;
        }

        if (tool === 'arrow') {
          var start = getXY(e);
          state.startX = start.x;
          state.startY = start.y;
          state.drawing = true;
          return;
        }

        state.drawing = true;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        var p = getXY(e);
        ctx.moveTo(p.x, p.y);
      };

      canvas.onmousemove = canvas.ontouchmove = function(e) {
        if (!state.drawing) return;
        e.preventDefault();
        if (state.annoTool === 'arrow') return;
        var p = getXY(e);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      };

      canvas.onmouseup = canvas.ontouchend = function(e) {
        if (!state.drawing) return;
        state.drawing = false;

        if (state.annoTool === 'arrow') {
          var end = getXY(e.changedTouches ? e.changedTouches[0] : e);
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(state.startX, state.startY);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          // Arrowhead
          var angle = Math.atan2(end.y - state.startY, end.x - state.startX);
          var headLen = 14;
          ctx.beginPath();
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 6), end.y - headLen * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 6), end.y - headLen * Math.sin(angle + Math.PI / 6));
          ctx.stroke();
        }

        ctx.globalCompositeOperation = 'source-over';
      };
    }

    annotationBar.addEventListener('click', function(e) {
      var btn = e.target.closest('.crd-anno-btn');
      if (!btn) return;

      if (btn.id === 'clearAnnotations') {
        var ctx = annotationCanvas.getContext('2d');
        ctx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
        return;
      }

      annotationBar.querySelectorAll('.crd-anno-btn').forEach(function(b) {
        if (b.id !== 'clearAnnotations') b.classList.remove('active');
      });
      btn.classList.add('active');
      state.annoTool = btn.dataset.tool;
    });

    /* ============================================
       COUNTDOWN
    ============================================ */
    function doCountdown() {
      return new Promise(function(resolve) {
        if (!state.countdown) { resolve(); return; }
        var overlay = document.createElement('div');
        overlay.className = 'crd-countdown';
        document.body.appendChild(overlay);
        var count = 3;
        function tick() {
          overlay.innerHTML = '<div class="crd-countdown-num">' + count + '</div><div class="crd-countdown-label">' + t('getReady', 'Get ready...') + '</div>';
          if (count === 0) {
            document.body.removeChild(overlay);
            resolve();
            return;
          }
          count--;
          setTimeout(tick, 900);
        }
        tick();
      });
    }

    /* ============================================
       TIMER
    ============================================ */
    function startTimer() {
      state.timerSec = 0;
      timerDisplay.textContent = '00:00';
      timerDisplay.classList.add('recording');
      state.timerInterval = setInterval(function() {
        state.timerSec++;
        timerDisplay.textContent = fmtTime(state.timerSec);
      }, 1000);
    }

    function stopTimer() {
      clearInterval(state.timerInterval);
      timerDisplay.classList.remove('recording');
    }

    function pauseTimer() {
      clearInterval(state.timerInterval);
    }

    function resumeTimer() {
      state.timerInterval = setInterval(function() {
        state.timerSec++;
        timerDisplay.textContent = fmtTime(state.timerSec);
      }, 1000);
    }

    /* ============================================
       STOP ALL STREAMS
    ============================================ */
    function stopAllStreams() {
      [state.screenStream, state.webcamStream, state.micStream].forEach(function(s) {
        if (s) s.getTracks().forEach(function(t) { t.stop(); });
      });
      state.screenStream = null;
      state.webcamStream = null;
      state.micStream = null;
      stopComposite();
      stopVolumeMeter();
    }

    /* ============================================
       START RECORDING
    ============================================ */
    async function startRecording() {
      if (state.recording) return;
      if (!checkSupport()) return;

      try {
        var streams = [];

        // Get screen stream
        if (state.mode === 'screen' || state.mode === 'both') {
          state.screenStream = await getScreenStream();
          // If user cancels screen share
          state.screenStream.getVideoTracks()[0].onended = function() { stopRecording(); };
        }

        // Get webcam
        if (state.mode === 'webcam' || state.mode === 'both') {
          state.webcamStream = await getWebcamStream();
        }

        // Get mic
        if (state.mic && state.mode !== 'audio') {
          state.micStream = await getMicStream();
          startVolumeMeter(state.micStream);
        }
        if (state.mode === 'audio') {
          state.micStream = await getMicStream();
          startVolumeMeter(state.micStream);
        }

        // Build combined stream
        var videoStream = null;
        if (state.mode === 'screen') {
          videoStream = state.screenStream;
        } else if (state.mode === 'webcam') {
          videoStream = state.webcamStream;
        } else if (state.mode === 'both') {
          videoStream = startComposite(state.screenStream, state.webcamStream);
        }

        var tracks = [];
        if (videoStream) {
          videoStream.getVideoTracks().forEach(function(t) { tracks.push(t); });
        }
        // Audio tracks: system audio from screen + mic
        if (state.screenStream && state.sysAudio) {
          state.screenStream.getAudioTracks().forEach(function(t) { tracks.push(t); });
        }
        if (state.micStream) {
          state.micStream.getAudioTracks().forEach(function(t) { tracks.push(t); });
        }

        if (tracks.length === 0) {
          showToast(t('noTracks', 'No media tracks available'));
          stopAllStreams();
          return;
        }

        state.combinedStream = new MediaStream(tracks);

        // Show live preview
        previewEmpty.style.display = 'none';
        playbackVideo.style.display = 'none';
        liveVideo.style.display = 'block';
        liveVideo.srcObject = state.mode === 'both' ? state.combinedStream : (videoStream || state.combinedStream);
        if (state.mode === 'webcam' && state.mirror) {
          liveVideo.style.transform = 'scaleX(-1)';
        } else {
          liveVideo.style.transform = '';
        }

        // Show annotations for screen modes
        if (state.mode === 'screen' || state.mode === 'both') {
          annotationBar.classList.add('visible');
          setupAnnotations();
        }

      } catch(err) {
        if (err.name === 'NotAllowedError') {
          showToast(t('permissionDenied', 'Permission denied — please allow access'));
        } else {
          showToast(t('errorPrefix', 'Error:') + ' ' + err.message);
        }
        stopAllStreams();
        return;
      }

      // Countdown
      await doCountdown();

      // Start MediaRecorder
      var mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }
      if (state.mode === 'audio') {
        mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/webm';
      }

      state.chunks = [];
      var recorderOptions = { mimeType: mimeType };
      if (state.mode !== 'audio') {
        recorderOptions.videoBitsPerSecond = { '1080': 8000000, '720': 4000000, '480': 2000000 }[qualitySelect.value] || 4000000;
      }
      state.mediaRecorder = new MediaRecorder(state.combinedStream, recorderOptions);

      state.mediaRecorder.ondataavailable = function(e) {
        if (e.data && e.data.size > 0) state.chunks.push(e.data);
      };

      state.mediaRecorder.onstop = function() {
        var type = state.mode === 'audio' ? 'audio/webm' : 'video/webm';
        state.recordedBlob = new Blob(state.chunks, { type: type });
        onRecordingComplete();
      };

      state.mediaRecorder.start(100);
      state.recording = true;
      state.paused = false;

      // UI updates
      recordBtn.classList.add('recording');
      recIndicator.classList.add('active');
      pauseBtn.disabled = false;
      stopBtn.disabled = false;
      startTimer();

      // Disable mode selector
      modeSelector.querySelectorAll('.crd-mode-card').forEach(function(c) { c.style.pointerEvents = 'none'; c.style.opacity = '.5'; });

      // Hide export/trim/history
      exportPanel.classList.remove('visible');
      trimPanel.classList.remove('visible');
    }

    /* ============================================
       PAUSE / RESUME
    ============================================ */
    function togglePause() {
      if (!state.recording || !state.mediaRecorder) return;
      if (state.paused) {
        state.mediaRecorder.resume();
        state.paused = false;
        pauseBtn.innerHTML = '&#9208;&#65039;';
        resumeTimer();
        recIndicator.classList.add('active');
      } else {
        state.mediaRecorder.pause();
        state.paused = true;
        pauseBtn.innerHTML = '&#9654;&#65039;';
        pauseTimer();
        recIndicator.classList.remove('active');
      }
    }

    /* ============================================
       STOP RECORDING
    ============================================ */
    function stopRecording() {
      if (!state.recording) return;
      if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.stop();
      }
      state.recording = false;
      state.paused = false;
      stopTimer();
      stopAllStreams();

      recordBtn.classList.remove('recording');
      recIndicator.classList.remove('active');
      pauseBtn.disabled = true;
      stopBtn.disabled = true;
      pauseBtn.innerHTML = '&#9208;&#65039;';

      // Re-enable mode selector
      modeSelector.querySelectorAll('.crd-mode-card').forEach(function(c) { c.style.pointerEvents = ''; c.style.opacity = ''; });

      // Hide annotations
      annotationBar.classList.remove('visible');
      annotationCanvas.style.display = 'none';

      liveVideo.style.display = 'none';
      liveVideo.srcObject = null;
    }

    /* ============================================
       CANCEL (Esc)
    ============================================ */
    function cancelRecording() {
      if (!state.recording) return;
      if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.onstop = null; // prevent onRecordingComplete
        state.mediaRecorder.stop();
      }
      state.recording = false;
      state.paused = false;
      state.chunks = [];
      stopTimer();
      stopAllStreams();

      recordBtn.classList.remove('recording');
      recIndicator.classList.remove('active');
      pauseBtn.disabled = true;
      stopBtn.disabled = true;

      modeSelector.querySelectorAll('.crd-mode-card').forEach(function(c) { c.style.pointerEvents = ''; c.style.opacity = ''; });
      annotationBar.classList.remove('visible');
      annotationCanvas.style.display = 'none';
      liveVideo.style.display = 'none';
      liveVideo.srcObject = null;
      previewEmpty.style.display = '';

      showToast(t('cancelled', 'Recording cancelled'));
    }

    /* ============================================
       ON RECORDING COMPLETE
    ============================================ */
    function onRecordingComplete() {
      if (!state.recordedBlob || state.recordedBlob.size === 0) {
        showToast(t('failed', 'Recording failed — no data captured'));
        previewEmpty.style.display = '';
        return;
      }

      // Show playback
      var url = URL.createObjectURL(state.recordedBlob);
      playbackVideo.src = url;
      playbackVideo.style.display = 'block';
      previewEmpty.style.display = 'none';

      // Show export
      exportPanel.classList.add('visible');
      fileInfo.textContent = fmtDuration(state.timerSec) + ' \u00b7 ' + fmtSize(state.recordedBlob.size);

      // Show trim
      trimPanel.classList.add('visible');
      trimStart.value = 0;
      trimEnd.value = 100;
      trimFill.style.left = '0%';
      trimFill.style.width = '100%';
      trimStartTime.textContent = '0:00';
      trimEndTime.textContent = fmtTime(state.timerSec);
      trimInfo.textContent = fmtDuration(state.timerSec) + ' \u00b7 ' + fmtSize(state.recordedBlob.size);

      // Save to history
      saveToHistory(state.recordedBlob);

      showToast(t('complete', 'Recording complete!'));
    }

    /* ============================================
       TRIM CONTROLS
    ============================================ */
    function updateTrim() {
      var s = parseFloat(trimStart.value);
      var e = parseFloat(trimEnd.value);
      if (s > e - 1) { trimStart.value = e - 1; s = e - 1; }
      trimFill.style.left = s + '%';
      trimFill.style.width = (e - s) + '%';

      var duration = state.timerSec;
      var startSec = (s / 100) * duration;
      var endSec = (e / 100) * duration;
      trimStartTime.textContent = fmtTime(Math.round(startSec));
      trimEndTime.textContent = fmtTime(Math.round(endSec));

      var trimmedDuration = endSec - startSec;
      var estimatedSize = state.recordedBlob ? (state.recordedBlob.size * (trimmedDuration / duration)) : 0;
      trimInfo.textContent = fmtDuration(trimmedDuration) + ' \u00b7 ' + fmtSize(Math.round(estimatedSize));

      // Seek playback
      if (playbackVideo.duration) {
        playbackVideo.currentTime = startSec;
      }
    }
    trimStart.addEventListener('input', updateTrim);
    trimEnd.addEventListener('input', updateTrim);

    /* ============================================
       DOWNLOAD
    ============================================ */
    downloadBtn.addEventListener('click', function() {
      if (!state.recordedBlob) return;
      var ext = state.mode === 'audio' ? '.webm' : '.webm';
      var a = document.createElement('a');
      a.href = URL.createObjectURL(state.recordedBlob);
      a.download = autoFilename() + ext;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast(t('downloading', 'Downloading...'));
    });

    /* ============================================
       INDEXEDDB HISTORY
    ============================================ */
    var DB_NAME = 'CreatorRecordDB';
    var DB_VERSION = 1;
    var STORE_NAME = 'recordings';
    var MAX_HISTORY = 5;

    function openDB() {
      return new Promise(function(resolve, reject) {
        var req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          }
        };
        req.onsuccess = function(e) { resolve(e.target.result); };
        req.onerror = function(e) { reject(e); };
      });
    }

    function saveToHistory(blob) {
      // Generate thumbnail
      generateThumbnail(blob).then(function(thumb) {
        openDB().then(function(db) {
          var tx = db.transaction(STORE_NAME, 'readwrite');
          var store = tx.objectStore(STORE_NAME);
          store.add({
            name: autoFilename(),
            date: new Date().toISOString(),
            size: blob.size,
            duration: state.timerSec,
            mode: state.mode,
            thumbnail: thumb,
            blob: blob
          });
          tx.oncomplete = function() {
            // Prune old entries
            pruneHistory(db);
            renderHistory();
          };
        }).catch(function() {});
      });
    }

    function generateThumbnail(blob) {
      return new Promise(function(resolve) {
        if (state.mode === 'audio') { resolve(null); return; }
        var video = document.createElement('video');
        video.src = URL.createObjectURL(blob);
        video.muted = true;
        video.currentTime = 0.5;
        video.onloadeddata = function() {
          var canvas = document.createElement('canvas');
          canvas.width = 160; canvas.height = 90;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, 160, 90);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
          URL.revokeObjectURL(video.src);
        };
        video.onerror = function() { resolve(null); };
      });
    }

    function pruneHistory(db) {
      var tx = db.transaction(STORE_NAME, 'readwrite');
      var store = tx.objectStore(STORE_NAME);
      var req = store.count();
      req.onsuccess = function() {
        if (req.result > MAX_HISTORY) {
          var cursor = store.openCursor();
          var toDelete = req.result - MAX_HISTORY;
          cursor.onsuccess = function(e) {
            var c = e.target.result;
            if (c && toDelete > 0) {
              c.delete();
              toDelete--;
              c.continue();
            }
          };
        }
      };
    }

    function renderHistory() {
      openDB().then(function(db) {
        var tx = db.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var req = store.getAll();
        req.onsuccess = function() {
          var items = req.result.reverse();
          if (items.length === 0) {
            historyList.innerHTML = '<div class="crd-history-empty">' + t('noRecordings', 'No recordings yet') + '</div>';
            return;
          }
          historyList.innerHTML = '';
          items.forEach(function(item) {
            var el = document.createElement('div');
            el.className = 'crd-history-item';
            var thumbHTML = item.thumbnail
              ? '<img src="' + item.thumbnail + '" alt="thumb">'
              : '<span>&#127908;</span>';
            var dateStr = new Date(item.date).toLocaleDateString(locale.dateLocale || undefined);
            el.innerHTML =
              '<div class="crd-history-thumb">' + thumbHTML + '</div>' +
              '<div class="crd-history-meta">' +
                '<div class="crd-history-name">' + item.name + '</div>' +
                '<div class="crd-history-date">' + dateStr + ' \u00b7 ' + fmtSize(item.size) + '</div>' +
              '</div>' +
              '<div class="crd-history-actions">' +
                '<button type="button" class="crd-history-action-btn preview-btn" data-id="' + item.id + '">' + t('preview', 'Preview') + '</button>' +
                '<button type="button" class="crd-history-action-btn" data-id="' + item.id + '" data-action="download">' + t('download', 'Download') + '</button>' +
                '<button type="button" class="crd-history-action-btn del" data-id="' + item.id + '" data-action="delete">' + t('delete', 'Delete') + '</button>' +
              '</div>';
            historyList.appendChild(el);
          });
        };
      }).catch(function() {});
    }

    // History interactions
    historyList.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) {
        var previewBtn = e.target.closest('.preview-btn');
        if (previewBtn) {
          loadHistoryItem(parseInt(previewBtn.dataset.id), 'preview');
        }
        return;
      }
      var id = parseInt(btn.dataset.id);
      var action = btn.dataset.action;
      if (action === 'download') loadHistoryItem(id, 'download');
      if (action === 'delete') deleteHistoryItem(id);
    });

    function loadHistoryItem(id, action) {
      openDB().then(function(db) {
        var tx = db.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var req = store.get(id);
        req.onsuccess = function() {
          if (!req.result) return;
          var item = req.result;
          if (action === 'preview') {
            var url = URL.createObjectURL(item.blob);
            playbackVideo.src = url;
            playbackVideo.style.display = 'block';
            previewEmpty.style.display = 'none';
            liveVideo.style.display = 'none';
            state.recordedBlob = item.blob;
            state.timerSec = item.duration;
            exportPanel.classList.add('visible');
            fileInfo.textContent = fmtDuration(item.duration) + ' \u00b7 ' + fmtSize(item.size);
            trimPanel.classList.add('visible');
            trimStart.value = 0; trimEnd.value = 100;
            trimFill.style.left = '0%'; trimFill.style.width = '100%';
            trimStartTime.textContent = '0:00';
            trimEndTime.textContent = fmtTime(item.duration);
            trimInfo.textContent = fmtDuration(item.duration) + ' \u00b7 ' + fmtSize(item.size);
          } else if (action === 'download') {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(item.blob);
            a.download = item.name + '.webm';
            a.click();
            URL.revokeObjectURL(a.href);
            showToast(t('downloading', 'Downloading...'));
          }
        };
      });
    }

    function deleteHistoryItem(id) {
      openDB().then(function(db) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        store.delete(id);
        tx.oncomplete = function() {
          renderHistory();
          showToast(t('deleted', 'Recording deleted'));
        };
      });
    }

    /* ============================================
       HISTORY TOGGLE
    ============================================ */
    historyToggleBtn.addEventListener('click', function() {
      var visible = historyPanel.style.display !== 'none';
      historyPanel.style.display = visible ? 'none' : 'block';
      if (!visible) renderHistory();
    });

    /* ============================================
       BUTTON EVENTS
    ============================================ */
    recordBtn.addEventListener('click', function() {
      if (state.recording) {
        stopRecording();
      } else {
        startRecording();
      }
    });
    pauseBtn.addEventListener('click', togglePause);
    stopBtn.addEventListener('click', stopRecording);

    /* ============================================
       KEYBOARD SHORTCUTS
    ============================================ */
    document.addEventListener('keydown', function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      var key = e.key.toLowerCase();
      if (key === 'r') {
        e.preventDefault();
        if (!state.recording) startRecording();
      } else if (key === 'p') {
        e.preventDefault();
        togglePause();
      } else if (key === 's' && state.recording) {
        e.preventDefault();
        stopRecording();
      } else if (key === 'escape') {
        e.preventDefault();
        cancelRecording();
      }
    });

    /* ============================================
       INIT
    ============================================ */
    renderHistory();

    // Request permissions early to populate camera list
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(function(s) {
          s.getTracks().forEach(function(t) { t.stop(); });
          enumerateCameras();
        })
        .catch(function() {});
    }

  })();
