import { getDrawingTemplate, listDrawingTemplates } from "../data/drawing-templates.js";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  }[char]));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function colorToCss(color) {
  if (typeof color === "string") return color;
  if (color && typeof color.r === "number") return `rgb(${color.r},${color.g},${color.b})`;
  return "currentColor";
}

function toLayerObject(layers) {
  const layerMap = {};
  for (const layer of layers) {
    const { name, ...rest } = layer;
    layerMap[name] = clone(rest);
  }
  return layerMap;
}

function makePreviewSvg(template) {
  const entities = template.entities.filter((entity) => ["line", "polyline", "circle", "arc"].includes(entity.type));
  const bounds = entities.reduce((acc, entity) => {
    const points = [];
    if (entity.type === "line") points.push(entity.start, entity.end);
    if (entity.type === "polyline") points.push(...(entity.vertices || []));
    if (entity.type === "circle") {
      points.push({ x: entity.center.x - entity.radius, y: entity.center.y - entity.radius });
      points.push({ x: entity.center.x + entity.radius, y: entity.center.y + entity.radius });
    }
    if (entity.type === "arc") {
      points.push({ x: entity.center.x - entity.radius, y: entity.center.y - entity.radius });
      points.push({ x: entity.center.x + entity.radius, y: entity.center.y + entity.radius });
    }
    for (const point of points) {
      acc.minX = Math.min(acc.minX, point.x);
      acc.minY = Math.min(acc.minY, point.y);
      acc.maxX = Math.max(acc.maxX, point.x);
      acc.maxY = Math.max(acc.maxY, point.y);
    }
    return acc;
  }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const viewBox = `${bounds.minX - width * 0.08} ${bounds.minY - height * 0.08} ${width * 1.16} ${height * 1.16}`;
  const paths = entities.slice(0, 42).map((entity) => {
    const stroke = colorToCss(entity.color);
    if (entity.type === "line") {
      return `<line x1="${entity.start.x}" y1="${entity.start.y}" x2="${entity.end.x}" y2="${entity.end.y}" stroke="${stroke}" />`;
    }
    if (entity.type === "polyline") {
      const points = (entity.vertices || []).map((point) => `${point.x},${point.y}`).join(" ");
      return `<polyline points="${points}" ${entity.closed ? "" : ""} stroke="${stroke}" ${entity.closed ? 'fill="none"' : 'fill="none"'} />`;
    }
    if (entity.type === "circle") {
      return `<circle cx="${entity.center.x}" cy="${entity.center.y}" r="${entity.radius}" stroke="${stroke}" fill="none" />`;
    }
    const start = {
      x: entity.center.x + entity.radius * Math.cos(entity.startAngle),
      y: entity.center.y + entity.radius * Math.sin(entity.startAngle)
    };
    const end = {
      x: entity.center.x + entity.radius * Math.cos(entity.endAngle),
      y: entity.center.y + entity.radius * Math.sin(entity.endAngle)
    };
    const large = Math.abs(entity.endAngle - entity.startAngle) > Math.PI ? 1 : 0;
    return `<path d="M ${start.x} ${start.y} A ${entity.radius} ${entity.radius} 0 ${large} 1 ${end.x} ${end.y}" stroke="${stroke}" fill="none" />`;
  }).join("");
  return `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false"><g transform="scale(1,-1) translate(0,${-(bounds.minY + bounds.maxY)})">${paths}</g></svg>`;
}

function syncLayerManagers(app, template) {
  const layers = clone(template.layers);
  app.engine.layers = toLayerObject(layers);
  if (app.layerManager && typeof app.layerManager.deserialize === "function") {
    app.layerManager.deserialize(layers);
    app.layerManager.currentLayer = "A-WALL";
    app.engine.layerManager = app.layerManager;
  }
  app.engine.currentLayer = "A-WALL";
}

function refreshShell(app) {
  app.layerPanel?.render?.();
  app.propertiesPanel?.render?.();
  app._workspaceShell?._syncSummary?.();
  app._workspaceShell?._refreshLayerStatesPanel?.();
  app._workspaceShell?._refreshViewsPanel?.();
  app._workspaceShell?._refreshLayoutPanel?.();
}

function setActiveTemplateTab(app, template) {
  const name = `${template.name}.adraft`;
  const activeIndex = Number.isInteger(app._activeTab) ? app._activeTab : 0;
  if (Array.isArray(app._tabs)) {
    app._tabs[activeIndex] = { ...(app._tabs[activeIndex] || {}), name, modified: true };
    app._renderTabs?.();
  }
  const activeTabName = document.querySelector("#tab-list .tab.active .tab-name");
  if (activeTabName) activeTabName.textContent = name;
}

export function applyDrawingTemplateToApp(app, id) {
  const template = getDrawingTemplate(id);
  if (!template || !app?.engine) return null;

  app.engine.clear();
  syncLayerManagers(app, template);
  app.engine.units = template.units || "mm";
  app.engine.precision = 0;
  app.engine.limitsEnabled = true;
  app.engine.limitsMin = clone(template.limitsMin);
  app.engine.limitsMax = clone(template.limitsMax);
  app.selectionManager?.deselectAll?.();

  for (const item of template.entities) app.engine.addEntity(clone(item));

  app.engine.markModified?.();
  setActiveTemplateTab(app, template);

  const extents = app.engine.getExtents?.();
  if (extents) {
    const padX = Math.max(400, (extents.maxX - extents.minX) * 0.08);
    const padY = Math.max(400, (extents.maxY - extents.minY) * 0.08);
    app.viewport?.zoomExtents?.({
      minX: extents.minX - padX,
      minY: extents.minY - padY,
      maxX: extents.maxX + padX,
      maxY: extents.maxY + padY
    });
  }

  app.renderer?.invalidate?.();
  if (app.renderer) app.renderer.dirty = true;
  app.engine.emit?.("drawing-loaded", { templateId: id });
  setActiveTemplateTab(app, template);
  refreshShell(app);
  setActiveTemplateTab(app, template);
  app._showToast?.(`${template.name} loaded`, "success");
  window.dispatchEvent(new CustomEvent("afrodraft-template-loaded", {
    detail: {
      id,
      name: template.name,
      entityCount: app.engine.entities.size,
      layerCount: Object.keys(app.engine.layers).length
    }
  }));
  setTimeout(() => setActiveTemplateTab(app, template), 0);
  setTimeout(() => setActiveTemplateTab(app, template), 300);
  return template;
}

function showTemplateLauncher(app) {
  const overlay = document.getElementById("modal-overlay");
  if (!overlay) return;
  const cards = listDrawingTemplates().map((meta) => {
    const template = getDrawingTemplate(meta.id);
    return `
      <button class="template-card" data-template-id="${escapeHtml(meta.id)}">
        <span class="template-card__preview">${makePreviewSvg(template)}</span>
        <span class="template-card__body">
          <strong>${escapeHtml(meta.name)}</strong>
          <span>${escapeHtml(meta.summary)}</span>
          <small>${escapeHtml(meta.size)} ${escapeHtml(meta.units)} | ${escapeHtml(meta.scale)}</small>
        </span>
      </button>
    `;
  }).join("");
  overlay.innerHTML = `
    <div class="modal template-modal" role="dialog" aria-modal="true" aria-labelledby="template-modal-title">
      <div class="modal-header">
        <span class="modal-title" id="template-modal-title">Start from a local template</span>
        <button class="modal-close" id="template-modal-close" type="button">&times;</button>
      </div>
      <div class="modal-body">
        <div class="template-modal__grid">${cards}</div>
      </div>
      <div class="modal-footer">
        <button class="modal-btn" id="template-modal-cancel" type="button">Cancel</button>
      </div>
    </div>
  `;
  overlay.classList.remove("hidden");
  const close = () => {
    overlay.classList.add("hidden");
    overlay.innerHTML = "";
  };
  overlay.querySelector("#template-modal-close")?.addEventListener("click", close);
  overlay.querySelector("#template-modal-cancel")?.addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  }, { once: true });
  overlay.querySelectorAll("[data-template-id]").forEach((button) => {
    button.addEventListener("click", () => {
      applyDrawingTemplateToApp(app, button.dataset.templateId);
      close();
    });
  });
}

function installRibbonButton(app) {
  if (document.getElementById("btn-template-library")) return;
  const anchor = document.getElementById("btn-new");
  if (!anchor) return;
  const button = document.createElement("button");
  button.className = "ribbon-btn";
  button.id = "btn-template-library";
  button.type = "button";
  button.title = "Template Library";
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <rect x="9" y="2" width="5" height="5" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <rect x="2" y="9" width="5" height="5" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <path d="M10 12h3M11.5 10.5v3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
  `;
  button.addEventListener("click", () => showTemplateLauncher(app));
  anchor.insertAdjacentElement("afterend", button);
}

function installSidebarSection(app) {
  if (document.getElementById("workspace-template-launcher")) return;
  const sidebar = document.querySelector(".workspace-sidebar__panel");
  if (!sidebar) return;
  const quickActions = sidebar.querySelector(".workspace-section");
  const section = document.createElement("section");
  section.className = "workspace-section";
  section.open = true;
  section.id = "workspace-template-launcher";
  section.innerHTML = `
    <summary><span class="workspace-section__title">Templates</span><span class="workspace-section__chevron">v</span></summary>
    <div class="workspace-section__body">
      <button class="workspace-flow-card" data-action="template-library" type="button">
        <span class="workspace-flow-card__eyebrow">Local drawings</span>
        <strong>Room, shop, fence, site, classroom, kiosk</strong>
        <span class="workspace-flow-card__copy">Load editable layered geometry with dimensions.</span>
      </button>
    </div>
  `;
  section.querySelector("[data-action='template-library']")?.addEventListener("click", () => showTemplateLauncher(app));
  quickActions?.insertAdjacentElement("afterend", section);
}

function applyHashTemplate(app) {
  const match = window.location.hash.match(/^#template-([a-z0-9-]+)$/);
  if (!match) return;
  const id = match[1];
  if (!getDrawingTemplate(id)) return;
  setTimeout(() => applyDrawingTemplateToApp(app, id), 150);
}

export function initTemplateLauncher(app) {
  if (!app || app._templateLauncherReady) return;
  app._templateLauncherReady = true;
  installRibbonButton(app);
  const sidebarTimer = setInterval(() => {
    installSidebarSection(app);
    if (document.getElementById("workspace-template-launcher")) clearInterval(sidebarTimer);
  }, 150);
  setTimeout(() => clearInterval(sidebarTimer), 4000);
  window.AfroDraftTemplates = {
    list: listDrawingTemplates,
    get: getDrawingTemplate,
    launch: () => showTemplateLauncher(app),
    apply: (id) => applyDrawingTemplateToApp(app, id)
  };
  applyHashTemplate(app);
}

const ready = () => initTemplateLauncher(window.app);
if (window.app) ready();
window.addEventListener("afrodraft-ready", ready, { once: true });
