window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.qrGenerator = function(e, t) {
  if (!window.QRCode || !window.AfroTools?.QrPayload) {
    const url = new URL("https://afrotools.com/widgets/iframe/image-design-qr-generator.html");
    if (location.origin === url.origin && location.pathname.replace(/\.html$/, "") === url.pathname.replace(/\.html$/, "")) {
      const link = document.createElement("a");
      const inFrench = new URLSearchParams(location.search).get("lang") === "fr";
      link.href = inFrench ? "/fr/tools/generateur-qr/" : "/tools/qr-generator/";
      link.textContent = inFrench ? "Ouvrir le générateur de codes QR" : "Open QR generator";
      e.replaceChildren(link);
      return;
    }
    if (t && t.theme === "dark") url.searchParams.set("theme", "dark");
    const frame = document.createElement("iframe");
    frame.src = url.href;
    frame.title = "QR code generator";
    frame.style.cssText = "width:100%;height:560px;border:0";
    e.replaceChildren(frame);
    return;
  }
  const fr = e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr";
  const local = (en, native) => fr ? native : en;
  var r = "dark" === ((t = t || {}).theme || "light"), a = r ? "#1a1a2e" : "#fff", i = r ? "#e0e0e0" : "#333", o = r ? "#16213e" : "#f5f7fa", l = r ? "#333" : "#ddd";
  e.innerHTML = '<div class="aw-qr-generator" style="font-family:\'Inter\',sans-serif;background:' + a + ";color:" + i + ";padding:20px;border-radius:10px;border:1px solid " + l + '"><div style="display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start"><div><div class="aw-field" style="margin-bottom:10px"><label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">Type</label><select class="aw-input aw-qr-type" style="width:100%;padding:8px;border:1px solid ' + l + ";border-radius:6px;font-size:13px;background:" + o + ";color:" + i + '"><option value="text">' + local("Text / URL", "Texte ou URL") + '</option><option value="wifi">' + local("WiFi", "Wi-Fi") + '</option><option value="vcard">vCard</option></select></div><div class="aw-qr-text-fields"><div class="aw-field" style="margin-bottom:10px"><label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">' + local("Content", "Contenu") + '</label><textarea class="aw-input aw-qr-input" style="width:100%;min-height:80px;padding:8px;border:1px solid ' + l + ";border-radius:6px;font-family:inherit;font-size:13px;background:" + o + ";color:" + i + ';resize:vertical;box-sizing:border-box" placeholder="' + local("Enter text or URL...", "Saisissez un texte ou une URL") + '"></textarea></div></div><div class="aw-qr-wifi-fields" style="display:none"><div class="aw-field" style="margin-bottom:8px"><label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">SSID</label><input type="text" class="aw-input aw-qr-ssid" style="width:100%;padding:6px 8px;border:1px solid ' + l + ";border-radius:4px;font-size:13px;background:" + o + ";color:" + i + ';box-sizing:border-box" placeholder="' + local("Network name", "Nom du réseau") + '"></div><div class="aw-field" style="margin-bottom:8px"><label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">' + local("Password", "Mot de passe") + '</label><input type="text" class="aw-input aw-qr-pass" style="width:100%;padding:6px 8px;border:1px solid ' + l + ";border-radius:4px;font-size:13px;background:" + o + ";color:" + i + ';box-sizing:border-box" placeholder="WiFi password"></div><div class="aw-field" style="margin-bottom:8px"><label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">Security</label><select class="aw-input aw-qr-security" style="padding:6px;border:1px solid ' + l + ";border-radius:4px;font-size:12px;background:" + o + ";color:" + i + '"><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="">' + local("None", "Aucune") + '</option></select></div></div><div class="aw-qr-vcard-fields" style="display:none"><div class="aw-field" style="margin-bottom:6px"><input type="text" class="aw-input aw-qr-vname" style="width:100%;padding:6px 8px;border:1px solid ' + l + ";border-radius:4px;font-size:12px;background:" + o + ";color:" + i + ';box-sizing:border-box" placeholder="' + local("Full Name", "Nom complet") + '"></div><div class="aw-field" style="margin-bottom:6px"><input type="text" class="aw-input aw-qr-vphone" style="width:100%;padding:6px 8px;border:1px solid ' + l + ";border-radius:4px;font-size:12px;background:" + o + ";color:" + i + ';box-sizing:border-box" placeholder="' + local("Phone", "Téléphone") + '"></div><div class="aw-field" style="margin-bottom:6px"><input type="text" class="aw-input aw-qr-vemail" style="width:100%;padding:6px 8px;border:1px solid ' + l + ";border-radius:4px;font-size:12px;background:" + o + ";color:" + i + ';box-sizing:border-box" placeholder="' + local("Email", "Adresse électronique") + '"></div><div class="aw-field" style="margin-bottom:8px"><input type="text" class="aw-input aw-qr-vorg" style="width:100%;padding:6px 8px;border:1px solid ' + l + ";border-radius:4px;font-size:12px;background:" + o + ";color:" + i + ';box-sizing:border-box" placeholder="' + local("Organization", "Organisation") + '"></div></div><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px"><label style="font-size:12px">' + local("FG:", "Code") + '</label><input type="color" class="aw-qr-fg" value="#000000" style="width:30px;height:24px;border:none;cursor:pointer;padding:0"><label style="font-size:12px">' + local("BG:", "Fond") + '</label><input type="color" class="aw-qr-bg" value="#ffffff" style="width:30px;height:24px;border:none;cursor:pointer;padding:0"><label style="font-size:12px;margin-left:8px">' + local("Size:", "Taille") + '</label><input type="number" class="aw-input aw-qr-size" value="200" min="100" max="500" step="50" style="width:60px;padding:4px;border:1px solid ' + l + ";border-radius:4px;font-size:12px;background:" + o + ";color:" + i + '"></div><button class="aw-btn aw-btn--primary aw-qr-gen" style="padding:8px 16px;background:#0062CC;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">' + local("Generate QR Code", "Générer le code QR") + '</button></div><div style="text-align:center"><div class="aw-qr-canvas" style="display:inline-block;padding:10px;background:#fff;border-radius:8px;border:1px solid ' + l + '"></div><div style="margin-top:8px"><button class="aw-btn aw-qr-download" style="padding:6px 12px;background:' + o + ";color:" + i + ";border:1px solid " + l + ';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;display:none">' + local("Download PNG", "Télécharger le PNG") + "</button></div></div></div>" + (t.footerHTML ? '<div style="margin-top:12px">' + t.footerHTML + "</div>" : "") + "</div>";
  var d = e.querySelector(".aw-qr-type"), n = e.querySelector(".aw-qr-canvas"), s = e.querySelector(".aw-qr-download");
  d.addEventListener("change", function() {
    e.querySelector(".aw-qr-text-fields").style.display = "text" === this.value ? "" : "none",
    e.querySelector(".aw-qr-wifi-fields").style.display = "wifi" === this.value ? "" : "none",
    e.querySelector(".aw-qr-vcard-fields").style.display = "vcard" === this.value ? "" : "none";
  });
  const node = suffix => e.querySelector(".aw-qr-" + suffix);
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  n.before(status);
  const invalidate = () => {
    n.replaceChildren();
    s.style.display = "none";
    status.textContent = "";
  };
  e.addEventListener("input", invalidate);
  e.addEventListener("change", invalidate);
  node("gen").addEventListener("click", () => {
    invalidate();
    const content = window.AfroTools.QrPayload.buildPayload({
      mode: d.value,
      text: node("input").value,
      ssid: node("ssid").value,
      password: node("security").value ? node("pass").value : "",
      security: node("security").value || "nopass",
      name: node("vname").value,
      phone: node("vphone").value,
      email: node("vemail").value,
      org: node("vorg").value
    });
    if (!content.ok) {
      status.textContent = content.error === "wifi_password_length" ? local("Enter 8 to 63 characters for WPA.", "Saisissez de 8 à 63 caractères pour le WPA.") : content.error === "wifi_password_required" ? local("Enter the network password.", "Saisissez le mot de passe du réseau.") : local("Enter text, a network name or a contact name for the selected type.", "Saisissez le contenu, le nom du réseau ou celui du contact selon le type choisi.");
      return;
    }
    const size = Number(node("size").value), dark = node("fg").value, light = node("bg").value;
    if (!Number.isInteger(size) || size < 100 || size > 500 || dark === light) {
      status.textContent = local("Choose distinct colours and a size between 100 and 500 pixels.", "Choisissez deux couleurs distinctes et une taille de 100 à 500 pixels.");
      return;
    }
    try {
      const encoder = new QRCode(document.createElement("div"), {
        text: content.data,
        width: size,
        height: size,
        correctLevel: QRCode.CorrectLevel.M
      });
      const matrix = encoder._oQRCode, count = matrix.getModuleCount(), step = Math.floor(size / (count + 8));
      if (!step) throw new Error("size");
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      canvas.style.cssText = "max-width:100%;height:auto";
      canvas.setAttribute("aria-label", local("Generated QR code", "Code QR généré"));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = dark;
      const offset = Math.floor((size - count * step) / 2);
      for (let y = 0; y < count; y++) for (let x = 0; x < count; x++) if (matrix.isDark(y, x)) ctx.fillRect(offset + x * step, offset + y * step, step, step);
      n.append(canvas);
      s.style.display = "";
      status.textContent = local("QR code ready.", "Code QR prêt.");
    } catch {
      status.textContent = local("Shorten the content or increase the size, then generate again.", "Raccourcissez le contenu ou augmentez la taille, puis réessayez.");
    }
  });
  s.addEventListener("click", () => {
    const canvas = n.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "qr-code.png";
    link.click();
  });
};
