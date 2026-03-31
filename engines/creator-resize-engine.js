(function() {
  'use strict';

  /* ── SIZE DEFINITIONS ── */
  var SIZES = [
    { id: 'ig-square',   name: 'IG Square',      w: 1080, h: 1080, group: 'instagram', slug: 'instagram-square' },
    { id: 'ig-portrait',  name: 'IG Portrait',    w: 1080, h: 1350, group: 'instagram', slug: 'instagram-portrait' },
    { id: 'ig-story',     name: 'IG Story',       w: 1080, h: 1920, group: 'instagram', slug: 'instagram-story' },
    { id: 'x-post',       name: 'X Post',         w: 1200, h: 675,  group: 'x',         slug: 'x-post' },
    { id: 'x-header',     name: 'X Header',       w: 1500, h: 500,  group: 'x',         slug: 'x-header' },
    { id: 'yt-thumb',     name: 'YT Thumbnail',   w: 1280, h: 720,  group: 'youtube',   slug: 'youtube-thumbnail' },
    { id: 'yt-banner',    name: 'YT Banner',      w: 2560, h: 1440, group: 'youtube',   slug: 'youtube-banner' },
    { id: 'li-post',      name: 'LinkedIn Post',  w: 1200, h: 627,  group: 'linkedin',  slug: 'linkedin-post' },
    { id: 'fb-cover',     name: 'FB Cover',       w: 820,  h: 312,  group: 'facebook',  slug: 'facebook-cover' },
    { id: 'fb-post',      name: 'FB Post',        w: 1200, h: 630,  group: 'facebook',  slug: 'facebook-post' },
    { id: 'pin',          name: 'Pinterest Pin',  w: 1000, h: 1500, group: 'pinterest',  slug: 'pinterest-pin' },
    { id: 'wa-status',    name: 'WA Status',      w: 1080, h: 1920, group: 'whatsapp',   slug: 'whatsapp-status' }
  ];

  var PRESETS = {
    all:       SIZES.map(function(s) { return s.id; }),
    instagram: ['ig-square', 'ig-portrait', 'ig-story'],
    youtube:   ['yt-thumb', 'yt-banner'],
    x:         ['x-post', 'x-header'],
    custom:    []
  };

  /* ── ENGINE STATE ── */
  var ResizeEngine = {
    sourceImage: null,
    sourceFile: null,
    focalPoint: { x: 0.5, y: 0.5 },
    fillMode: 'blur',
    activePreset: 'all',
    activeSizeIds: PRESETS.all.slice(),
    canvases: {},     // id -> canvas
    blobs: {},        // id -> blob

    /* ── INIT ── */
    init: function() {
      var self = this;

      // Restore preferences
      var savedFill = localStorage.getItem('crz-fill-mode');
      if (savedFill) self.fillMode = savedFill;
      var savedPreset = localStorage.getItem('crz-preset');
      if (savedPreset && PRESETS[savedPreset]) {
        self.activePreset = savedPreset;
        self.activeSizeIds = PRESETS[savedPreset].slice();
      }

      self.bindUpload();
      self.bindPresets();
      self.bindFillMode();
      self.bindFocalPoint();
      self.bindDownload();
      self.bindModal();
      self.syncUI();
    },

    /* ── FILE UPLOAD ── */
    bindUpload: function() {
      var self = this;
      var dropZone = document.getElementById('crzDropZone');
      var fileInput = document.getElementById('crzFileInput');
      var newImageBtn = document.getElementById('crzNewImage');

      dropZone.addEventListener('click', function() { fileInput.click(); });

      fileInput.addEventListener('change', function() {
        if (fileInput.files && fileInput.files[0]) self.loadImage(fileInput.files[0]);
      });

      dropZone.addEventListener('dragover', function(e) {
        e.preventDefault(); dropZone.classList.add('dragover');
      });
      dropZone.addEventListener('dragleave', function() {
        dropZone.classList.remove('dragover');
      });
      dropZone.addEventListener('drop', function(e) {
        e.preventDefault(); dropZone.classList.remove('dragover');
        var files = e.dataTransfer.files;
        if (files && files[0] && files[0].type.startsWith('image/')) {
          self.loadImage(files[0]);
        }
      });

      newImageBtn.addEventListener('click', function() {
        self.resetToUpload();
      });
    },

    loadImage: function(file) {
      var self = this;
      if (file.size > 10 * 1024 * 1024) {
        self.toast('Image too large. Max 10MB.', 'error');
        return;
      }

      self.sourceFile = file;
      var reader = new FileReader();
      reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
          self.sourceImage = img;
          self.focalPoint = { x: 0.5, y: 0.5 };

          // Show editor
          document.getElementById('crzUploadState').style.display = 'none';
          document.getElementById('crzEditor').style.display = 'flex';
          document.getElementById('crzBottomBar').style.display = 'flex';
          document.getElementById('crzDownloadAll').disabled = false;

          // Set original image
          document.getElementById('crzOriginalImg').src = e.target.result;

          self.updateFocalMarker();
          self.renderAllSizes();
          self.updateSizeCount();

          // Track usage
          var count = parseInt(localStorage.getItem('crz-upload-count') || '0', 10);
          localStorage.setItem('crz-upload-count', String(count + 1));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    },

    resetToUpload: function() {
      this.sourceImage = null;
      this.sourceFile = null;
      this.canvases = {};
      this.blobs = {};
      this.focalPoint = { x: 0.5, y: 0.5 };
      document.getElementById('crzUploadState').style.display = '';
      document.getElementById('crzEditor').style.display = 'none';
      document.getElementById('crzBottomBar').style.display = 'none';
      document.getElementById('crzDownloadAll').disabled = true;
      document.getElementById('crzFileInput').value = '';
      document.getElementById('crzSizeGrid').innerHTML = '';
    },

    /* ── PRESETS ── */
    bindPresets: function() {
      var self = this;
      var buttons = document.querySelectorAll('.crz-preset-btn');
      buttons.forEach(function(btn) {
        btn.addEventListener('click', function() {
          var preset = btn.dataset.preset;
          buttons.forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          self.activePreset = preset;
          if (preset !== 'custom') {
            self.activeSizeIds = PRESETS[preset].slice();
          }
          localStorage.setItem('crz-preset', preset);
          if (self.sourceImage) {
            self.renderAllSizes();
            self.updateSizeCount();
          }
        });
      });
    },

    /* ── FILL MODE ── */
    bindFillMode: function() {
      var self = this;

      // Header select
      var select = document.getElementById('crzFillSelect');
      select.value = self.fillMode;
      select.addEventListener('change', function() {
        self.setFillMode(select.value);
      });

      // Sidebar buttons
      var fillBtns = document.querySelectorAll('.crz-fill-btn');
      fillBtns.forEach(function(btn) {
        if (btn.dataset.fill === self.fillMode) btn.classList.add('active');
        btn.addEventListener('click', function() {
          fillBtns.forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          self.setFillMode(btn.dataset.fill);
          select.value = btn.dataset.fill;
        });
      });
    },

    setFillMode: function(mode) {
      this.fillMode = mode;
      localStorage.setItem('crz-fill-mode', mode);

      // Sync sidebar buttons
      document.querySelectorAll('.crz-fill-btn').forEach(function(b) {
        b.classList.toggle('active', b.dataset.fill === mode);
      });

      if (this.sourceImage) this.renderAllSizes();
    },

    /* ── FOCAL POINT ── */
    bindFocalPoint: function() {
      var self = this;
      var img = document.getElementById('crzOriginalImg');

      img.addEventListener('click', function(e) {
        var rect = img.getBoundingClientRect();
        self.focalPoint.x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        self.focalPoint.y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        self.updateFocalMarker();
        self.renderAllSizes();
      });

      document.getElementById('crzFocalReset').addEventListener('click', function() {
        self.focalPoint = { x: 0.5, y: 0.5 };
        self.updateFocalMarker();
        self.renderAllSizes();
      });
    },

    updateFocalMarker: function() {
      var marker = document.getElementById('crzFocalMarker');
      marker.style.left = (this.focalPoint.x * 100) + '%';
      marker.style.top = (this.focalPoint.y * 100) + '%';

      var label = document.getElementById('crzFocalLabel');
      var px = Math.round(this.focalPoint.x * 100);
      var py = Math.round(this.focalPoint.y * 100);
      label.textContent = 'Focal point: ' + px + '%, ' + py + '%';
    },

    /* ── RENDERING ── */
    renderAllSizes: function() {
      var self = this;
      var grid = document.getElementById('crzSizeGrid');
      grid.innerHTML = '';
      self.canvases = {};
      self.blobs = {};

      var active = self.activeSizeIds;
      SIZES.forEach(function(size) {
        var isActive = active.indexOf(size.id) !== -1;
        var card = document.createElement('div');
        card.className = 'crz-size-card' + (isActive ? ' active' : ' disabled');
        card.dataset.sizeId = size.id;

        var previewDiv = document.createElement('div');
        previewDiv.className = 'crz-size-preview';

        if (isActive && self.sourceImage) {
          var canvas = self.renderSize(size);
          self.canvases[size.id] = canvas;

          // Create a display canvas (scaled down for preview)
          var displayCanvas = document.createElement('canvas');
          var maxPreview = 260;
          var scale = Math.min(maxPreview / size.w, maxPreview / size.h, 1);
          displayCanvas.width = Math.round(size.w * scale);
          displayCanvas.height = Math.round(size.h * scale);
          var dCtx = displayCanvas.getContext('2d');
          dCtx.drawImage(canvas, 0, 0, displayCanvas.width, displayCanvas.height);
          previewDiv.appendChild(displayCanvas);

          // Generate blob
          canvas.toBlob(function(blob) {
            self.blobs[size.id] = blob;
          }, 'image/png');
        } else {
          var ph = document.createElement('span');
          ph.className = 'crz-placeholder';
          ph.textContent = size.w + '\u00d7' + size.h;
          previewDiv.appendChild(ph);
        }

        var meta = document.createElement('div');
        meta.className = 'crz-size-meta';

        var nameSpan = document.createElement('div');
        nameSpan.innerHTML = '<div class="crz-size-name">' + size.name + '</div>' +
          '<div class="crz-size-dims">' + size.w + '\u00d7' + size.h + '</div>';

        var dlBtn = document.createElement('button');
        dlBtn.className = 'crz-size-dl';
        dlBtn.innerHTML = '&#8595;';
        dlBtn.title = 'Download ' + size.name;
        dlBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          self.downloadSingle(size.id);
        });

        meta.appendChild(nameSpan);
        if (isActive) meta.appendChild(dlBtn);

        card.appendChild(previewDiv);
        card.appendChild(meta);

        // Click to expand
        if (isActive) {
          card.addEventListener('click', function() {
            self.openModal(size.id);
          });
        }

        // Custom preset: toggle on click when disabled
        if (self.activePreset === 'custom' && !isActive) {
          card.className = 'crz-size-card';
          card.style.opacity = '.5';
          card.addEventListener('click', function() {
            self.toggleSize(size.id);
          });
        }

        grid.appendChild(card);
      });
    },

    renderSize: function(sizeConfig) {
      var canvas = document.createElement('canvas');
      canvas.width = sizeConfig.w;
      canvas.height = sizeConfig.h;
      var ctx = canvas.getContext('2d');
      var img = this.sourceImage;
      var fp = this.focalPoint;

      if (this.fillMode === 'crop') {
        this.cropToSize(ctx, img, sizeConfig.w, sizeConfig.h, fp.x, fp.y);
      } else if (this.fillMode === 'blur') {
        // Blurred background
        ctx.save();
        ctx.filter = 'blur(40px)';
        ctx.drawImage(img, -20, -20, sizeConfig.w + 40, sizeConfig.h + 40);
        ctx.restore();
        // Darken slightly
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0, 0, sizeConfig.w, sizeConfig.h);
        // Sharp centered image
        this.drawFocalCentered(ctx, img, sizeConfig.w, sizeConfig.h);
      } else if (this.fillMode === 'solid') {
        // Sample edge color
        var edgeColor = this.getEdgeColor(img);
        ctx.fillStyle = edgeColor;
        ctx.fillRect(0, 0, sizeConfig.w, sizeConfig.h);
        this.drawFocalCentered(ctx, img, sizeConfig.w, sizeConfig.h);
      } else if (this.fillMode === 'gradient') {
        var colors = this.getDominantColors(img);
        var grad = ctx.createLinearGradient(0, 0, sizeConfig.w, sizeConfig.h);
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(1, colors[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, sizeConfig.w, sizeConfig.h);
        this.drawFocalCentered(ctx, img, sizeConfig.w, sizeConfig.h);
      } else if (this.fillMode === 'extend') {
        // Stretch edges then overlay sharp center
        ctx.drawImage(img, 0, 0, sizeConfig.w, sizeConfig.h);
        this.drawFocalCentered(ctx, img, sizeConfig.w, sizeConfig.h);
      }

      return canvas;
    },

    cropToSize: function(ctx, img, targetW, targetH, focalX, focalY) {
      var sourceRatio = img.width / img.height;
      var targetRatio = targetW / targetH;
      var cropW, cropH, cropX, cropY;

      if (sourceRatio > targetRatio) {
        cropH = img.height;
        cropW = cropH * targetRatio;
        cropX = Math.max(0, Math.min(focalX * img.width - cropW / 2, img.width - cropW));
        cropY = 0;
      } else {
        cropW = img.width;
        cropH = cropW / targetRatio;
        cropX = 0;
        cropY = Math.max(0, Math.min(focalY * img.height - cropH / 2, img.height - cropH));
      }

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
    },

    drawFocalCentered: function(ctx, img, targetW, targetH) {
      // Fit image inside target dimensions, maintaining aspect ratio
      var imgRatio = img.width / img.height;
      var targetRatio = targetW / targetH;
      var drawW, drawH;

      if (imgRatio > targetRatio) {
        drawW = targetW;
        drawH = targetW / imgRatio;
      } else {
        drawH = targetH;
        drawW = targetH * imgRatio;
      }

      var x = (targetW - drawW) / 2;
      var y = (targetH - drawH) / 2;
      ctx.drawImage(img, x, y, drawW, drawH);
    },

    getEdgeColor: function(img) {
      var c = document.createElement('canvas');
      c.width = 1; c.height = 1;
      var ctx = c.getContext('2d');
      // Sample top-left corner
      ctx.drawImage(img, 0, 0, 1, 1);
      var d = ctx.getImageData(0, 0, 1, 1).data;
      return 'rgb(' + d[0] + ',' + d[1] + ',' + d[2] + ')';
    },

    getDominantColors: function(img) {
      var c = document.createElement('canvas');
      c.width = 2; c.height = 1;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, 2, 1);
      var d = ctx.getImageData(0, 0, 2, 1).data;
      return [
        'rgb(' + d[0] + ',' + d[1] + ',' + d[2] + ')',
        'rgb(' + d[4] + ',' + d[5] + ',' + d[6] + ')'
      ];
    },

    toggleSize: function(sizeId) {
      var idx = this.activeSizeIds.indexOf(sizeId);
      if (idx === -1) {
        this.activeSizeIds.push(sizeId);
      } else {
        this.activeSizeIds.splice(idx, 1);
      }
      this.renderAllSizes();
      this.updateSizeCount();
    },

    updateSizeCount: function() {
      var count = this.activeSizeIds.length;
      document.getElementById('crzSizeCount').textContent = count + ' size' + (count !== 1 ? 's' : '');
      document.getElementById('crzBottomInfo').textContent = count + ' size' + (count !== 1 ? 's' : '') + ' ready';
    },

    /* ── DOWNLOAD ── */
    bindDownload: function() {
      var self = this;
      document.getElementById('crzDownloadAll').addEventListener('click', function() { self.downloadAll(); });
      document.getElementById('crzDownloadAllBottom').addEventListener('click', function() { self.downloadAll(); });
    },

    downloadSingle: function(sizeId) {
      var self = this;
      var canvas = self.canvases[sizeId];
      if (!canvas) return;

      var size = SIZES.find(function(s) { return s.id === sizeId; });
      if (!size) return;

      canvas.toBlob(function(blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = size.slug + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        self.toast('Downloaded ' + size.name, 'success');
      }, 'image/png');
    },

    downloadAll: function() {
      var self = this;
      if (typeof JSZip === 'undefined') {
        self.toast('ZIP library loading... try again', 'error');
        return;
      }

      var activeCanvases = [];
      self.activeSizeIds.forEach(function(id) {
        var canvas = self.canvases[id];
        var size = SIZES.find(function(s) { return s.id === id; });
        if (canvas && size) activeCanvases.push({ canvas: canvas, size: size });
      });

      if (activeCanvases.length === 0) {
        self.toast('No sizes to download', 'error');
        return;
      }

      self.toast('Generating ZIP...', 'success');

      var zip = new JSZip();
      var folderName = (self.sourceFile ? self.sourceFile.name.replace(/\.[^.]+$/, '') : 'resized');

      var pending = activeCanvases.length;
      activeCanvases.forEach(function(item) {
        item.canvas.toBlob(function(blob) {
          zip.file(folderName + '/' + item.size.slug + '.png', blob);
          pending--;
          if (pending === 0) {
            zip.generateAsync({ type: 'blob' }).then(function(zipBlob) {
              var url = URL.createObjectURL(zipBlob);
              var a = document.createElement('a');
              a.href = url;
              a.download = folderName + '-all-sizes.zip';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              self.toast('Downloaded ' + activeCanvases.length + ' sizes as ZIP', 'success');
            });
          }
        }, 'image/png');
      });
    },

    /* ── MODAL ── */
    bindModal: function() {
      var self = this;
      var backdrop = document.getElementById('crzModal');
      document.getElementById('crzModalClose').addEventListener('click', function() {
        backdrop.classList.remove('open');
      });
      backdrop.addEventListener('click', function(e) {
        if (e.target === backdrop) backdrop.classList.remove('open');
      });
      document.getElementById('crzModalDownload').addEventListener('click', function() {
        if (self._modalSizeId) self.downloadSingle(self._modalSizeId);
      });
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') backdrop.classList.remove('open');
      });
    },

    openModal: function(sizeId) {
      var canvas = this.canvases[sizeId];
      var size = SIZES.find(function(s) { return s.id === sizeId; });
      if (!canvas || !size) return;

      this._modalSizeId = sizeId;

      var modalCanvas = document.getElementById('crzModalCanvas');
      modalCanvas.width = canvas.width;
      modalCanvas.height = canvas.height;
      var ctx = modalCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, 0);

      document.getElementById('crzModalLabel').textContent = size.name;
      document.getElementById('crzModalDims').textContent = size.w + '\u00d7' + size.h + 'px';
      document.getElementById('crzModal').classList.add('open');
    },

    /* ── UI SYNC ── */
    syncUI: function() {
      // Sync preset buttons
      var self = this;
      document.querySelectorAll('.crz-preset-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.preset === self.activePreset);
      });

      // Sync fill mode
      document.querySelectorAll('.crz-fill-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.fill === self.fillMode);
      });
      var select = document.getElementById('crzFillSelect');
      if (select) select.value = self.fillMode;
    },

    /* ── TOAST ── */
    toast: function(msg, type) {
      var el = document.getElementById('crzToast');
      el.textContent = msg;
      el.className = 'crz-toast ' + (type || '') + ' show';
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(function() {
        el.classList.remove('show');
      }, 2500);
    }
  };

  /* ── BOOT ── */
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.creatorResize = ResizeEngine;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { ResizeEngine.init(); });
  } else {
    ResizeEngine.init();
  }
})();
