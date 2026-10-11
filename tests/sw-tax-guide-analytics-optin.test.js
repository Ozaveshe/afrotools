'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/lazy-analytics.js'), 'utf8');
function run(route, initial) {
  let consent = initial;
  const scripts = [], listeners = {};
  const document = {referrer:'',querySelector:()=>null,createElement:()=>({}),head:{appendChild:node=>scripts.push(node.src)}};
  const window = {location:{origin:'https://afrotools.com',pathname:route,search:''},localStorage:{getItem:()=>consent},addEventListener:(name,fn)=>listeners[name]=fn,setTimeout:fn=>fn()};
  vm.runInNewContext(source,{window,document,URL,Date});
  return {window,scripts,listeners,setConsent:value=>{consent=value;}};
}
const google = c => c.scripts.filter(url=>url.startsWith('https://www.googletagmanager.com/'));
let cases=0;
for(const route of ['/sw/zana/mwongozo-wa-etims-kra','/sw/zana/mwongozo-wa-sars-efiling']) {
  for(const suffix of ['', '/', '/index.html', '/index.html/']) {
    for(const state of [null,'declined','rejected','accepted']) {
      const c=run(route+suffix,state);
      assert.strictEqual(c.window.__afroAnalyticsRequiresOptIn,true);
      assert.strictEqual(google(c).length,state==='accepted'?1:0);
      assert.strictEqual(c.window['ga-disable-G-D859CGF391'],state!=='accepted');
      c.setConsent('accepted');c.listeners['afrotools:cookie-consent']({detail:{status:'accepted'}});
      assert.strictEqual(google(c).length,1,'acceptance loads one tag');
      c.setConsent('declined');c.listeners['afrotools:cookie-consent']({detail:{status:'declined'}});
      assert.strictEqual(c.window['ga-disable-G-D859CGF391'],true);
      const count=c.window.dataLayer.length;
      c.window.gtag('event','synthetic_after_withdrawal',{});
      c.window.gtag('config','G-D859CGF391',{});
      assert.strictEqual(c.window.dataLayer.length,count,'withdrawal blocks collection commands');
      c.setConsent('accepted');c.listeners['afrotools:cookie-consent']({detail:{status:'accepted'}});
      c.setConsent(null);c.listeners.storage({key:'afrotools_cookie_consent',newValue:null});
      assert.strictEqual(c.window['ga-disable-G-D859CGF391'],true,'cross-tab removal disables');
      cases++;
    }
  }
}
for(const route of ['/','/tools/salary-calculator/','/sw/zana/mwongozo-wa-etims-kra-extra/','/sw/zana/mwongozo-wa-sars-efiling/child/']) {
  const c=run(route,'declined');assert.strictEqual(c.window.__afroAnalyticsRequiresOptIn,false);assert.strictEqual(google(c).length,1,'unrelated route behavior preserved');cases++;
}
for(const route of ['/tools/currency-converter/','/crypto/remittance/']) {
  const c=run(route,'declined');assert.strictEqual(google(c).length,0,'existing opt-in routes preserved');cases++;
}
console.log(JSON.stringify({cases,passed:true}));
