(function () {
  "use strict";
  var root = document.querySelector("[data-swfa-clip]"),
    engine = window.AfroTools && window.AfroTools.CreatorClipEngine;
  if (!root || !engine) return;
  var form = root.querySelector("form"),
    file = root.querySelector("[data-file]"),
    video = root.querySelector("video"),
    status = root.querySelector("[data-status]"),
    exportsNode = root.querySelector("[data-exports]"),
    lastBlob = null,
    lastPlan = null;
  function setStatus(message, error) {
    status.textContent = message;
    status.classList.toggle("error", !!error);
  }
  function download(name, type, body) {
    var blob = body instanceof Blob ? body : new Blob([body], { type: type }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 100);
  }
  function bestMime() {
    return (
      ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(
        function (type) {
          return window.MediaRecorder && MediaRecorder.isTypeSupported(type);
        },
      ) || ""
    );
  }
  function recordStream(stream, duration) {
    return new Promise(function (resolve, reject) {
      var mime = bestMime();
      if (!mime) return reject(new Error("codec"));
      var chunks = [],
        recorder = new MediaRecorder(stream, { mimeType: mime });
      recorder.ondataavailable = function (event) {
        if (event.data && event.data.size) chunks.push(event.data);
      };
      recorder.onerror = function () {
        reject(new Error("record"));
      };
      recorder.onstop = function () {
        resolve(new Blob(chunks, { type: mime }));
      };
      recorder.start(50);
      setTimeout(
        function () {
          recorder.stop();
          stream.getTracks().forEach(function (track) {
            track.stop();
          });
        },
        Math.max(300, duration * 1000),
      );
    });
  }
  function synthetic(plan) {
    var canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    var ctx = canvas.getContext("2d"),
      frame = 0,
      timer = setInterval(function () {
        ctx.fillStyle = frame % 2 ? "#0b67d1" : "#09223a";
        ctx.fillRect(0, 0, 640, 360);
        ctx.fillStyle = "#fff";
        ctx.font = "700 34px system-ui";
        ctx.fillText("AfroTools · Klipu ya majaribio", 48, 160);
        ctx.font = "22px system-ui";
        ctx.fillText(plan.title + " · fremu " + frame, 48, 210);
        frame += 1;
      }, 60),
      stream = canvas.captureStream(15);
    return recordStream(stream, Math.min(plan.durationSeconds, 1.2)).finally(
      function () {
        clearInterval(timer);
      },
    );
  }
  function captureUploaded(plan) {
    if (!video.captureStream && !video.mozCaptureStream)
      throw new Error("capture");
    video.currentTime = plan.startSeconds;
    return video.play().then(function () {
      var stream = (video.captureStream || video.mozCaptureStream).call(video);
      return recordStream(stream, Math.min(plan.durationSeconds, 5)).finally(
        function () {
          video.pause();
        },
      );
    });
  }
  function finish(blob, plan) {
    lastBlob = blob;
    lastPlan = Object.assign({}, plan, {
      mimeType: blob.type,
      sizeBytes: blob.size,
      proof: engine.isWebm
        ? "webm-ebml-checked-after-download"
        : "browser-mediarecorder",
    });
    exportsNode.hidden = false;
    setStatus(
      "Klipu ya WebM imetengenezwa ndani ya kivinjari. Pakua na hakiki kabla ya kuchapisha.",
    );
  }
  file.addEventListener("change", function () {
    var selected = file.files && file.files[0];
    if (!selected) return;
    video.src = URL.createObjectURL(selected);
    video.hidden = false;
    setStatus(
      "Video imepakiwa ndani ya kivinjari. Chagua muda wa kuanza na kumaliza.",
    );
  });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    lastBlob = null;
    exportsNode.hidden = true;
    try {
      var plan = engine.createPlan({
        title: form.elements.title.value,
        start: form.elements.start.value,
        end: form.elements.end.value,
      });
      if (!file.files.length) throw new Error("file");
      setStatus("Inakata klipu ndani ya kivinjari…");
      captureUploaded(plan)
        .then(function (blob) {
          finish(blob, plan);
        })
        .catch(function () {
          setStatus(
            "Kivinjari hiki hakiruhusu kunasa stream ya video iliyopakiwa. Tumia kitufe cha sampuli kuthibitisha codec, au jaribu Chromium ya kisasa.",
            true,
          );
        });
    } catch (_) {
      setStatus(
        "Ongeza video na muda sahihi; mwisho lazima uwe baada ya mwanzo na klipu isiwe zaidi ya dakika 5.",
        true,
      );
    }
  });
  root.querySelector("[data-synthetic]").addEventListener("click", function () {
    var plan;
    try {
      plan = engine.createPlan({
        title: form.elements.title.value,
        start: 0,
        end: 1,
      });
    } catch (_) {
      setStatus("Weka jina la klipu kwanza.", true);
      return;
    }
    setStatus("Inarekodi sampuli salama ya MediaStream…");
    synthetic(plan)
      .then(function (blob) {
        finish(blob, plan);
      })
      .catch(function () {
        setStatus(
          "MediaRecorder/WebM haipatikani kwenye kivinjari hiki.",
          true,
        );
      });
  });
  exportsNode.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-export]");
    if (!button || !lastBlob) return;
    if (button.dataset.export === "webm")
      download("klipu-ya-mtayarishi.webm", lastBlob.type, lastBlob);
    else
      download(
        "klipu-ya-mtayarishi.json",
        "application/json;charset=utf-8",
        JSON.stringify(lastPlan, null, 2),
      );
  });
  root.querySelector("[data-reset]").addEventListener("click", function () {
    form.reset();
    video.pause();
    video.removeAttribute("src");
    video.hidden = true;
    lastBlob = null;
    lastPlan = null;
    exportsNode.hidden = true;
    setStatus("Chagua video inayomilikiwa au tumia sampuli ya majaribio.");
  });
  window.__SwCreatorClip = {
    createPlan: engine.createPlan,
    recordSynthetic: function (input) {
      var plan = engine.createPlan(input);
      return synthetic(plan).then(function (blob) {
        return { blob: blob, plan: plan };
      });
    },
    isWebm: engine.isWebm,
  };
})();
