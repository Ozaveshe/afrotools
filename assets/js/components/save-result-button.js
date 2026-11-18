!function(){"use strict";if(!document.getElementById("save-result-btn-styles")){var t=document.createElement("style");t.id="save-result-btn-styles",t.textContent=[".srb-wrap { display:flex; padding:0; }",".srb-btn {","  display:inline-flex; align-items:center; justify-content:center; gap:6px;","  min-height:44px; padding:10px 20px;","  border:1.5px solid var(--color-border, #e2e8f0);","  border-radius:var(--radius-md, 10px);","  background:var(--color-bg-card, #fff);","  color:var(--color-text, #0f172a);",'  font-family:var(--font-body, "DM Sans", sans-serif);',"  font-size:var(--text-sm, 0.875rem);","  font-weight:var(--weight-semibold, 600);","  cursor:pointer;","  transition:all var(--transition-fast, 150ms ease);","  -webkit-tap-highlight-color:transparent;","}",".srb-btn:hover:not(:disabled) {","  border-color:var(--color-brand, var(--color-primary, #0062CC));","  color:var(--color-brand, var(--color-primary, #0062CC));","  background:var(--color-brand-pale, var(--color-primary-pale, rgba(0,98,204,0.08)));","}",".srb-btn:disabled { opacity:0.55; cursor:default; }",".srb-btn svg { flex-shrink:0; }","@media (max-width:480px) {","  .srb-btn { width:100%; }","}"].join("\n"),document.head.appendChild(t)}var e='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';function i(t){var e=t&&t.parentElement;if(e&&e.classList&&e.classList.contains("result-actions")){var o=Array.prototype.slice.call(e.children).filter(function(t){return 1===t.nodeType});if(o.length>0&&o.every(function(t){return"SAVE-RESULT-BUTTON"===t.tagName||"SHARE-RESULT-BUTTON"===t.tagName})){if(o.some(function(t){return!t.hidden}))return e.hidden=!1,void(e.dataset.resultActionsDisplay&&"none"!==e.dataset.resultActionsDisplay?e.style.display=e.dataset.resultActionsDisplay:e.style.display="flex");!e.dataset.resultActionsDisplay&&e.style.display&&(e.dataset.resultActionsDisplay=e.style.display),e.hidden=!0,e.style.display="none"}}}function n(){var t=Reflect.construct(HTMLElement,[],n);return t._data=null,t._saving=!1,t}n.prototype=Object.create(HTMLElement.prototype),n.prototype.constructor=n,n.prototype.connectedCallback=function(){this._render(),this.hidden=!0,i(this)};

function isFrench() {
  return /^fr(?:-|$)/i.test(document.documentElement.lang);
}
function label(english, french) {
  return isFrench() ? french : english;
}
function resetButton(button) {
  button.innerHTML = e + " " + label("Save Result", "Enregistrer le résultat");
}
function askForLogin(component) {
  var message = label("Sign in to save your calculations", "Connectez-vous pour enregistrer votre résultat.");
  if (!isFrench() && window.AfroAuthModal && typeof window.AfroAuthModal.open === "function") {
    window.AfroAuthModal.open(message);
    return;
  }
  var notice = component.querySelector(".srb-notice");
  var link = document.createElement("a");
  link.href = (isFrench() ? "/fr/auth/" : "/auth/") + "?mode=login&next=" + encodeURIComponent(location.pathname + location.search);
  link.textContent = label("Sign in", "Se connecter");
  notice.replaceChildren(document.createTextNode(message + " "), link);
}
n.prototype.setData = function(data) {
  this._data = data;
  this.hidden = !(data && data.inputs && data.outputs);
  var button = this.querySelector(".srb-btn");
  if (button) {
    button.disabled = this.hidden;
    resetButton(button);
    this.querySelector(".srb-notice").replaceChildren();
  }
  i(this);
};
n.prototype._render = function() {
  this.innerHTML = '<div class="srb-wrap"><button class="srb-btn" type="button" disabled></button></div><div class="srb-notice" role="status"></div>';
  var button = this.querySelector(".srb-btn");
  resetButton(button);
  button.addEventListener("click", this._handleClick.bind(this));
};
n.prototype._handleClick = async function() {
  if (this._saving) return;
  if (!window.AfroAuth || !window.AfroAuth.isLoggedIn || !window.AfroAuth.isLoggedIn()) {
    askForLogin(this);
    return;
  }
  var notice = this.querySelector(".srb-notice");
  if (!this._data || !this._data.inputs || !this._data.outputs) {
    notice.textContent = label("Run a calculation first", "Effectuez d’abord un calcul.");
    return;
  }
  if (!window.AfroHistory) {
    notice.textContent = label("Save feature unavailable", "L’enregistrement est indisponible.");
    return;
  }
  var button = this.querySelector(".srb-btn");
  this._saving = true;
  button.disabled = true;
  button.innerHTML = e + " " + label("Saving...", "Enregistrement…");
  try {
    var response = await window.AfroHistory.save({
      toolSlug: this.getAttribute("tool-slug") || "",
      toolName: this.getAttribute("tool-name") || "",
      countryCode: this.getAttribute("country-code") || "",
      currency: this.getAttribute("currency") || "",
      inputs: this._data.inputs,
      outputs: this._data.outputs
    });
    if (response && response.saved) {
      button.textContent = label("Saved", "Résultat enregistré");
      var dashboard = document.createElement("a");
      dashboard.href = isFrench() ? "/fr/dashboard/" : "/dashboard/";
      dashboard.textContent = label("View in dashboard", "Voir dans le tableau de bord");
      notice.replaceChildren(dashboard);
      return;
    }
    if (response && response.reason === "not_logged_in") {
      askForLogin(this);
    } else if (response && response.reason === "limit_reached") {
      var upgrade = document.createElement("a");
      upgrade.href = isFrench() ? "/fr/pricing/" : "/pricing/";
      upgrade.textContent = label("Upgrade to Pro", "Passer à Pro");
      notice.replaceChildren(document.createTextNode(label("Monthly limit reached", "Limite mensuelle atteinte") + " (" + response.limit + "). "), upgrade);
    } else {
      throw new Error("save");
    }
  } catch (error) {
    notice.textContent = label("Could not save. Please try again.", "Échec de l’enregistrement. Réessayez.");
  } finally {
    this._saving = false;
    if (!(response && response.saved)) {
      button.disabled = false;
      resetButton(button);
    }
  }
};
customElements.get("save-result-button")||customElements.define("save-result-button",n)}();