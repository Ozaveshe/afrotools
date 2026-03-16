(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.stampDuty = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var bg = theme === 'dark' ? '#1a1a2e' : '#fff';
    var text = theme === 'dark' ? '#e2e8f0' : '#0f1419';
    var muted = theme === 'dark' ? '#94a3b8' : '#64748b';
    var border = theme === 'dark' ? 'rgba(255,255,255,.12)' : '#e2e8f0';
    var inputBg = theme === 'dark' ? 'rgba(255,255,255,.06)' : '#f8fafc';
    var accent = opts.accent || '#7c3aed';
    var uid = 'aw-sd-' + Math.random().toString(36).slice(2,8);

    var COUNTRIES = {
      NG:{name:'Nigeria',sym:'\u20A6',
        docs:[{id:'property',label:'Property Purchase'},{id:'mortgage',label:'Mortgage Deed'},{id:'loan',label:'Loan Agreement'}],
        calc:function(docId,val){
          if(docId==='property') return [{name:'Stamp Duty (0.75%)',amount:val*0.0075},{name:'Registration Fee (est.)',amount:Math.min(val*0.002,50000)}];
          if(docId==='mortgage') return [{name:'Mortgage Stamp Duty (0.375%)',amount:val*0.00375}];
          if(docId==='loan') return [{name:'Loan Agreement Duty (0.15%)',amount:val*0.0015}];
          return [];
        }
      },
      KE:{name:'Kenya',sym:'KSh',
        docs:[{id:'residential',label:'Residential Property'},{id:'commercial',label:'Commercial Property'},{id:'mortgage',label:'Mortgage Deed'},{id:'shares',label:'Share Transfer'}],
        calc:function(docId,val,loc,buyerType){
          if(docId==='residential'){
            var isUrban=loc==='urban';
            if(buyerType==='ftb'&&isUrban&&val<=4000000) return [{name:'First-Time Buyer Exemption',amount:0,note:'KRA exemption under KES 4M'}];
            var rate=isUrban?0.04:0.02;
            return [{name:'Stamp Duty ('+(rate*100)+'%)',amount:val*rate}];
          }
          if(docId==='commercial'){var r=loc==='urban'?0.04:0.03;return [{name:'Commercial Stamp Duty ('+(r*100)+'%)',amount:val*r}];}
          if(docId==='mortgage') return [{name:'Charge Duty (0.1%)',amount:val*0.001}];
          if(docId==='shares') return [{name:'Share Transfer Duty (1%)',amount:val*0.01}];
          return [];
        }
      },
      GH:{name:'Ghana',sym:'GH\u20B5',
        docs:[{id:'property',label:'Property Purchase'},{id:'mortgage',label:'Mortgage Deed'},{id:'shares',label:'Share Transfer'}],
        calc:function(docId,val){
          if(docId==='property') return [{name:'Stamp Duty (0.5%)',amount:val*0.005},{name:'Transfer Levy (3%)',amount:val*0.03,note:'Introduced 2022'}];
          if(docId==='mortgage') return [{name:'Mortgage Deed Duty (0.5%)',amount:val*0.005}];
          if(docId==='shares') return [{name:'Share Transfer Duty (0.5%)',amount:val*0.005}];
          return [];
        }
      },
      ZW:{name:'Zimbabwe',sym:'USD',
        docs:[{id:'property',label:'Property Transfer'},{id:'mortgage',label:'Mortgage Bond'}],
        calc:function(docId,val){
          if(docId==='property'){
            var duty=0,rem=val;
            var bands=[{l:20000,r:0.01},{l:100000,r:0.02},{l:500000,r:0.03},{l:Infinity,r:0.04}];
            var prev=0;
            for(var i=0;i<bands.length;i++){var chunk=Math.min(rem,bands[i].l-prev);if(chunk<=0)break;duty+=chunk*bands[i].r;rem-=chunk;prev=bands[i].l;if(rem<=0)break;}
            return [{name:'Transfer Duty (Progressive)',amount:duty,note:'1-4% based on value'},{name:'ZIMRA Surcharge (10% of duty)',amount:duty*0.1}];
          }
          if(docId==='mortgage') return [{name:'Mortgage Bond Duty (0.5%)',amount:val*0.005}];
          return [];
        }
      },
      TZ:{name:'Tanzania',sym:'TSh',
        docs:[{id:'property',label:'Property Transfer'},{id:'mortgage',label:'Mortgage Deed'}],
        calc:function(docId,val){
          if(docId==='property') return [{name:'Stamp Duty (1%)',amount:val*0.01}];
          if(docId==='mortgage') return [{name:'Mortgage Duty (0.5%)',amount:val*0.005}];
          return [];
        }
      },
      UG:{name:'Uganda',sym:'USh',
        docs:[{id:'property',label:'Property Transfer'},{id:'mortgage',label:'Mortgage Deed'}],
        calc:function(docId,val){
          if(docId==='property') return [{name:'Stamp Duty (1%)',amount:val*0.01},{name:'Registration Fee (est.)',amount:Math.min(val*0.002,2000000)}];
          if(docId==='mortgage') return [{name:'Mortgage Deed Duty (0.5%)',amount:val*0.005}];
          return [];
        }
      },
      ZM:{name:'Zambia',sym:'ZMW',
        docs:[{id:'property',label:'Property Transfer'},{id:'mortgage',label:'Mortgage Bond'}],
        calc:function(docId,val){
          if(docId==='property') return [{name:'Stamp Duty (2%)',amount:val*0.02},{name:'Property Transfer Tax (5%)',amount:val*0.05,note:'Separate ZRA tax'}];
          if(docId==='mortgage') return [{name:'Mortgage Bond Duty (0.5%)',amount:val*0.005}];
          return [];
        }
      },
      ET:{name:'Ethiopia',sym:'ETB',
        docs:[{id:'property',label:'Property Transfer'},{id:'lease',label:'Lease Agreement'}],
        calc:function(docId,val){
          if(docId==='property') return [{name:'Stamp Duty (2%)',amount:val*0.02}];
          if(docId==='lease') return [{name:'Lease Duty (0.5%)',amount:val*0.005}];
          return [];
        }
      },
      CM:{name:'Cameroon',sym:'XAF',
        docs:[{id:'property',label:'Property Transfer'},{id:'mortgage',label:'Mortgage Deed'}],
        calc:function(docId,val){
          if(docId==='property') return [{name:'Registration Duty (5%)',amount:val*0.05},{name:'Notarial Fee (est. 1%)',amount:val*0.01}];
          if(docId==='mortgage') return [{name:'Mortgage Duty (1%)',amount:val*0.01}];
          return [];
        }
      },
      RW:{name:'Rwanda',sym:'RWF',
        docs:[{id:'property',label:'Property Transfer'},{id:'mortgage',label:'Mortgage/Charge'}],
        calc:function(docId,val){
          if(docId==='property') return [{name:'Stamp Duty (0.1%)',amount:val*0.001}];
          if(docId==='mortgage') return [{name:'Mortgage Charge Duty (0.05%)',amount:val*0.0005}];
          return [];
        }
      }
    };

    var fieldStyle = 'width:100%;padding:9px 10px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.9rem;font-weight:600;background:' + inputBg + ';color:' + text + ';outline:none;font-family:inherit;';

    var countryOpts = '';
    for(var k in COUNTRIES) countryOpts += '<option value="' + k + '">' + COUNTRIES[k].name + '</option>';

    container.innerHTML =
      '<div id="' + uid + '" style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;background:' + bg + ';color:' + text + ';border:1px solid ' + border + ';border-radius:12px;overflow:hidden;max-width:480px;">' +
        '<div style="padding:14px 18px;font-size:.85rem;font-weight:800;border-bottom:1px solid ' + border + ';">Stamp Duty Calculator</div>' +
        '<div style="padding:16px 18px;">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Country</label><select id="' + uid + '-country" style="' + fieldStyle + '">' + countryOpts + '</select></div>' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Document Type</label><select id="' + uid + '-doc" style="' + fieldStyle + '"></select></div>' +
          '</div>' +
          '<div id="' + uid + '-keFields" style="display:none;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Location</label><select id="' + uid + '-loc" style="' + fieldStyle + '"><option value="urban">Urban/City</option><option value="rural">Rural</option></select></div>' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Buyer Type</label><select id="' + uid + '-buyer" style="' + fieldStyle + '"><option value="normal">Regular Buyer</option><option value="ftb">First-Time Buyer</option></select></div>' +
          '</div>' +
          '<div style="margin-bottom:12px;"><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Property / Transaction Value</label>' +
            '<input type="number" id="' + uid + '-value" placeholder="e.g. 50000000" style="' + fieldStyle + '"></div>' +
          '<button id="' + uid + '-btn" style="width:100%;padding:11px;background:' + accent + ';color:#fff;border:none;border-radius:8px;font-size:.88rem;font-weight:700;cursor:pointer;">Calculate Stamp Duty</button>' +
          '<div id="' + uid + '-results" style="display:none;margin-top:16px;"></div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="padding:10px 18px;border-top:1px solid ' + border + ';font-size:.72rem;color:' + muted + ';">' + opts.footerHTML + '</div>' : '') +
      '</div>';

    function fmt(n, sym) { return sym + ' ' + (n < 0.01 && n > 0 ? n.toFixed(4) : n.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})); }

    function updateDocs() {
      var c = COUNTRIES[document.getElementById(uid + '-country').value];
      var sel = document.getElementById(uid + '-doc');
      sel.innerHTML = c.docs.map(function(d) { return '<option value="' + d.id + '">' + d.label + '</option>'; }).join('');
      var isKE = document.getElementById(uid + '-country').value === 'KE';
      document.getElementById(uid + '-keFields').style.display = isKE ? 'grid' : 'none';
    }

    function calculate() {
      var countryCode = document.getElementById(uid + '-country').value;
      var c = COUNTRIES[countryCode];
      var docId = document.getElementById(uid + '-doc').value;
      var val = parseFloat(document.getElementById(uid + '-value').value) || 0;
      if (val <= 0) { alert('Enter a value'); return; }

      var loc = document.getElementById(uid + '-loc').value;
      var buyerType = document.getElementById(uid + '-buyer').value;

      var items = c.calc(docId, val, loc, buyerType);
      if (!items || items.length === 0) return;

      var total = 0;
      items.forEach(function(it) { total += it.amount; });
      var effectivePct = (total / val * 100).toFixed(2);

      var html = '<div style="text-align:center;padding:16px;background:' + (theme==='dark'?'rgba(255,255,255,.04)':'linear-gradient(135deg,#0f172a,#1e293b)') + ';border-radius:10px;margin-bottom:12px;">' +
        '<div style="font-size:.65rem;color:rgba(255,255,255,.4);text-transform:uppercase;">Total Stamp Duty</div>' +
        '<div style="font-size:1.8rem;font-weight:800;color:#a78bfa;">' + fmt(total, c.sym) + '</div>' +
        '<div style="font-size:.78rem;color:rgba(255,255,255,.5);">Effective rate: ' + effectivePct + '% of ' + fmt(val, c.sym) + '</div></div>';

      items.forEach(function(it) {
        html += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid ' + border + ';">' +
          '<div><div style="font-size:.78rem;font-weight:600;color:' + text + ';">' + it.name + '</div>' +
          (it.note ? '<div style="font-size:.65rem;color:' + muted + ';">' + it.note + '</div>' : '') + '</div>' +
          '<span style="font-size:.82rem;font-weight:700;color:' + text + ';">' + fmt(it.amount, c.sym) + '</span></div>';
      });

      document.getElementById(uid + '-results').innerHTML = html;
      document.getElementById(uid + '-results').style.display = 'block';
    }

    document.getElementById(uid + '-country').addEventListener('change', updateDocs);
    document.getElementById(uid + '-btn').addEventListener('click', calculate);
    updateDocs();
  };
})();
