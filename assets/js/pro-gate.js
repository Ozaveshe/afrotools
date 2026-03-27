!function(e){"use strict";

// Pro-only tool IDs
const t=["japa-calculator","medical-report","japa-visa-predict","business-planner"];

// Free-forever tool IDs
const r=["afrostudy","waec-calculator","school-fees-comparator","gpa-calculator","scholarship-finder","ielts-calculator","jamb-aggregate","calorie-counter","bmi-calculator","ovulation-tracker","sickle-cell-advisor","blood-pressure-tracker","pregnancy-calculator","waist-hip-ratio","water-intake"];

// Free-forever categories
const o=["education","health"];

// In-memory cache (NOT localStorage — cannot be spoofed via DevTools)
let _proCache = null;
let _proCacheTs = 0;
const PRO_CACHE_TTL = 120000; // 2 minutes

const i={

  /**
   * Check if user has active Pro subscription.
   * Uses in-memory cache (2 min TTL) — NOT localStorage.
   * Always verifies against Supabase subscriptions table.
   */
  async isPro(){
    // Return cached result if fresh (in-memory only, not spoofable)
    if (_proCache !== null && (Date.now() - _proCacheTs) < PRO_CACHE_TTL) {
      return _proCache;
    }

    try {
      const sb = e.AfroAuth && "function" == typeof e.AfroAuth.getSupabase && e.AfroAuth.getSupabase() || null;
      if (!sb || !sb.auth) return this._setCache(false);

      const {data: userData} = await sb.auth.getUser();
      if (!userData || !userData.user) return this._setCache(false);

      const {data: sub, error: subErr} = await sb.from("subscriptions")
        .select("status, expires_at")
        .eq("user_id", userData.user.id)
        .eq("status", "active")
        .single();

      if (subErr || !sub) return this._setCache(false);

      const isActive = new Date(sub.expires_at) > new Date;
      return this._setCache(isActive);
    } catch(err) {
      console.warn("[ProGate] Subscription check failed:", err);
      return this._setCache(false);
    }
  },

  /** Store result in JS memory only (not localStorage) */
  _setCache(val){
    _proCache = val;
    _proCacheTs = Date.now();
    return val;
  },

  /** Clear cache (e.g. on logout) */
  clearCache(){
    _proCache = null;
    _proCacheTs = 0;
    // Also clean up legacy localStorage keys
    try {
      localStorage.removeItem("afro_pro_cache");
    } catch(err){}
  },

  _isFreeForever(toolId){
    const id = toolId || (document.querySelector('meta[name="tool-id"]') || {}).content || "";
    if (r.includes(id)) return true;
    const cat = (document.querySelector('meta[name="tool-category"]') || {}).content || "";
    return !!o.includes(cat);
  },

  isProFeature(toolId){
    return !this._isFreeForever(toolId) && t.includes(toolId);
  },

  showProUpsell(feature, container){
    const defs = {
      pdf:     {title:"Clean PDF Exports",       desc:"Remove watermarks from your PDF exports with AfroTools Pro.",                                                                          icon:"&#128196;"},
      "ai-advisor":{title:"Unlimited AI Advisor", desc:"You've used your free questions today. Go Pro for unlimited.",                                                                         icon:"&#129302;"},
      history: {title:"Unlimited History",         desc:"Free accounts save your last 5 calculations. Go Pro for unlimited cloud history.",                                                     icon:"&#128202;"},
      api:     {title:"API Access",                desc:"Get programmatic access to AfroTools data with 100 API calls/day.",                                                                   icon:"&#128268;"},
      share:   {title:"Branded Share Cards",       desc:"Share your results as custom branded cards instead of basic URLs.",                                                                    icon:"&#127912;"},
      theme:   {title:"Theme Toggle",              desc:"Switch between dark and light themes manually with AfroTools Pro.",                                                                    icon:"&#127769;"},
      "business-plan":{title:"Full Business Plan", desc:"Generate AI-powered executive summaries, market analysis, SWOT, financial projections, and funding strategies with Pro.", icon:"&#128203;"}
    };
    const d = defs[feature] || {title:"AfroTools Pro", desc:"Unlock this feature with AfroTools Pro.", icon:"&#11088;"};
    const el = document.createElement("div");
    el.className = "pro-inline-upsell";
    el.setAttribute("data-feature", feature);
    el.innerHTML = '<div style="display:flex;align-items:flex-start;gap:14px;max-width:480px;margin:16px auto;padding:20px;background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border:1px solid #F59E0B;border-radius:12px;"><div style="font-size:24px;flex-shrink:0;margin-top:2px">'+ d.icon +'</div><div style="flex:1"><div style="font-size:14px;font-weight:700;color:#92400E;margin-bottom:4px">'+ d.title +'</div><div style="font-size:13px;color:#78350F;line-height:1.5;margin-bottom:10px">'+ d.desc +'</div><a href="/pro/" style="display:inline-block;background:#F59E0B;color:#fff;padding:7px 16px;border-radius:6px;font-size:12px;font-weight:700;text-decoration:none;transition:opacity .15s">Upgrade to Pro — $5/mo</a></div></div>';
    if (container) container.appendChild(el);
    return el;
  },

  async gatePdfExport(container){
    if (this._isFreeForever()) return true;
    const pro = await this.isPro();
    if (!pro && container) this.showProUpsell("pdf", container);
    return pro;
  },

  /**
   * AI advisor gate — NO client-side counter.
   * Server (ai-advisor.js) enforces rate limits via Netlify Blobs:
   *   - Anonymous: 3/day (by IP)
   *   - Free logged-in: 10/day
   *   - Pro: unlimited
   * This method only shows the upsell UI; enforcement is server-side.
   * Returns true to allow the call; server returns 429 if over limit.
   */
  async gateAiAdvisor(container){
    if (this._isFreeForever()) return true;
    if (await this.isPro()) return true;
    // Let the call proceed — server enforces the real limit.
    // If server returns 429, the caller should show the upsell.
    return true;
  },

  async gateHistory(items){
    if (this._isFreeForever() || await this.isPro()) return items;
    return items.slice(0, 5);
  },

  injectUpsell(){
    const meta = document.querySelector('meta[name="tool-id"]');
    if (!meta) return;
    const toolId = meta.content;
    if (this._isFreeForever(toolId)) return;
    if (!this.isProFeature(toolId)) return;
    this.isPro().then(function(pro){
      if (pro) return;
      var footer = document.querySelector("afro-footer");
      if (!footer) return;
      var banner = document.createElement("div");
      banner.className = "pro-upsell-banner";
      banner.innerHTML = '<div style="max-width:800px;margin:0 auto;padding:32px 24px;text-align:center;"><span style="display:inline-block;background:linear-gradient(135deg,#F5A623,#e8960e);color:#fff;font-size:.6rem;font-weight:800;padding:3px 10px;border-radius:100px;letter-spacing:.08em;margin-bottom:12px;">PRO</span><h3 style="font-size:1.2rem;font-weight:800;color:#111827;margin-bottom:8px;">Get more with AfroTools Pro</h3><p style="font-size:.85rem;color:#6B7280;line-height:1.6;margin-bottom:16px;">Unlimited AI advisor, clean PDF exports, cloud history, and more — just $5/month.</p><a href="/pro/" style="display:inline-block;background:var(--color-primary);color:#fff;padding:10px 24px;border-radius:8px;font-weight:700;font-size:.85rem;text-decoration:none;">See Plans & Pricing</a></div>';
      banner.style.cssText = "background:#F9FAFB;border-top:1px solid #E5E7EB;border-bottom:1px solid #E5E7EB;margin:24px 0;";
      footer.parentNode.insertBefore(banner, footer);
    }).catch(function(err){
      console.warn("[ProGate] upsell check failed:", err);
    });
  },

  applyGating(){
    var self = this;
    this.isPro().then(function(pro){
      var allowed = pro || self._isFreeForever();
      document.querySelectorAll(".pro-only").forEach(function(el){ el.style.display = allowed ? "" : "none"; });
      document.querySelectorAll(".free-only").forEach(function(el){ el.style.display = allowed ? "none" : ""; });
    }).catch(function(err){
      console.warn("[ProGate] gating check failed:", err);
    });
  }
};

// Clean up legacy localStorage keys from old version
try { localStorage.removeItem("afro_pro_cache"); } catch(err){}

// Init
if ("loading" === document.readyState) {
  document.addEventListener("DOMContentLoaded", function(){ i.injectUpsell(); i.applyGating(); });
} else {
  i.injectUpsell();
  i.applyGating();
}

e.AfroProGate = i;
}(window);
