#!/usr/bin/env python3
"""
Replace toggleSaveTool + updateSaveUI across all 54 PAYE pages with
auth-gated version:
  - Not logged in → opens auth modal
  - Free tier with 10+ saves → shows limit toast
  - Logged in → normal save/unsave
Also updates ng-save-sec banner to adapt for unsigned users.
"""

import re, os, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# The new save JS block — tool_id placeholder gets replaced per-file
NEW_SAVE_JS = '''<script>
(function(){
  var KEY='afro_favs_v2',TOOL_ID='__TOOL_ID__',LIMIT=10;
  function isLoggedIn(){return typeof AfroAuth!=='undefined'&&AfroAuth.isLoggedIn();}
  function isPro(){return typeof AfroAuth!=='undefined'&&AfroAuth.isPro();}
  function getFavs(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[];}}
  function isSaved(){return getFavs().indexOf(TOOL_ID)>-1;}

  window.toggleSaveTool=function(){
    if(!isLoggedIn()){
      if(typeof AfroAuth!=='undefined'&&AfroAuth.openModal){
        AfroAuth.openModal('login',function(){updateSaveUI();});
      }else{window.location.href='/dashboard/';}
      return;
    }
    var favs=getFavs(),idx=favs.indexOf(TOOL_ID);
    if(idx>-1){favs.splice(idx,1);}else{
      if(!isPro()&&favs.length>=LIMIT){
        showSaveToast('Free accounts can save up to '+LIMIT+' tools. Upgrade to Pro for unlimited saves.');
        return;
      }
      favs.push(TOOL_ID);
    }
    localStorage.setItem(KEY,JSON.stringify(favs));
    updateSaveUI();
  };

  function showSaveToast(msg){
    var t=document.createElement('div');
    t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;padding:12px 24px;border-radius:10px;font-size:.85rem;font-family:DM Sans,sans-serif;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,.2);max-width:400px;text-align:center';
    t.textContent=msg;document.body.appendChild(t);
    setTimeout(function(){t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(function(){t.remove()},300)},4000);
  }

  function updateSaveUI(){
    var loggedIn=isLoggedIn(),saved=loggedIn&&isSaved();
    var svgSaved='<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
    var svgUnsaved='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';

    // Inline save button
    var btn=document.getElementById('inlineSaveBtn');
    if(btn){
      if(!loggedIn){btn.innerHTML=svgUnsaved+' Sign in to Save';btn.classList.remove('saved');}
      else if(saved){btn.innerHTML=svgSaved+' Saved';btn.classList.add('saved');}
      else{btn.innerHTML=svgUnsaved+' Save to My Tools';btn.classList.remove('saved');}
    }

    // Sidebar save button
    var sb=document.getElementById('sidebarSaveBtn');
    if(sb){
      var lbl=document.getElementById('sidebarSaveLabel');
      if(!loggedIn){
        if(lbl)lbl.textContent='Sign in to Save';
        sb.classList.remove('saved');
      }else if(saved){
        if(lbl)lbl.textContent='Saved';
        sb.classList.add('saved');
      }else{
        if(lbl)lbl.textContent='Save to My Tools';
        sb.classList.remove('saved');
      }
    }

    // Save CTA banner text
    var title=document.querySelector('.ng-save-title');
    var desc=document.querySelector('.ng-save-desc');
    if(!loggedIn){
      if(title)title.textContent='Sign in to save this calculator';
      if(desc)desc.textContent='Create a free account to bookmark tools, track calculations, and access your dashboard.';
    }
  }
  window.updateSaveUI=updateSaveUI;

  // Run on load + auth changes
  document.addEventListener('DOMContentLoaded',updateSaveUI);
  window.addEventListener('afro-auth-change',updateSaveUI);
})();
</script>'''


def get_tool_id(filepath):
    """Extract tool_id from existing toggleSaveTool in the file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
    # Match id='xx-paye' or id="xx-paye"
    m = re.search(r"var\s+(?:id|TOOL_ID)\s*=\s*['\"]([^'\"]+)['\"]", html)
    if m:
        return m.group(1)
    # Fallback: derive from filename
    fname = os.path.basename(filepath)  # e.g. gh-paye.html
    return fname.replace('.html', '')


def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    changes = []
    tool_id = get_tool_id(filepath)

    # Remove old save JS block
    # Pattern: <script>\nfunction toggleSaveTool(){...}...updateSaveUI);\n</script>
    old_pattern = re.compile(
        r'<script>\s*\n?\s*function toggleSaveTool\(\)\{.*?</script>',
        re.DOTALL
    )
    # Also match the IIFE version if we already replaced once
    old_pattern2 = re.compile(
        r'<script>\s*\n?\s*\(function\(\)\{\s*\n?\s*var KEY=\'afro_favs_v2\'.*?</script>',
        re.DOTALL
    )

    new_js = NEW_SAVE_JS.replace('__TOOL_ID__', tool_id)

    if old_pattern.search(html):
        html = old_pattern.sub(new_js, html)
        changes.append('replaced save JS')
    elif old_pattern2.search(html):
        html = old_pattern2.sub(new_js, html)
        changes.append('replaced save JS (IIFE)')
    else:
        # No existing save JS — insert before </body>
        html = html.replace('</body>', new_js + '\n</body>')
        changes.append('added save JS')

    if changes:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"  FIXED {os.path.basename(filepath)}: {', '.join(changes)} (id={tool_id})")
    else:
        print(f"  OK    {os.path.basename(filepath)}")

    return changes


def main():
    # All 54 PAYE files including Nigeria
    paye_files = sorted(glob.glob(os.path.join(ROOT, '*', '*-paye.html')))
    # Also include ng-salary-tax.html (Nigeria)
    ng = os.path.join(ROOT, 'nigeria', 'ng-salary-tax.html')
    if os.path.exists(ng) and ng not in paye_files:
        paye_files.append(ng)

    paye_files = [f for f in paye_files if
                  'widgets' not in f and
                  os.sep + 'fr' + os.sep not in f]

    print(f"Processing {len(paye_files)} PAYE files...\n")

    total = 0
    for filepath in paye_files:
        changes = process_file(filepath)
        total += len(changes)

    print(f"\nDone. {total} changes across {len(paye_files)} files.")

    # Verify
    print("\n=== VERIFICATION ===")
    issues = 0
    for filepath in paye_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            html = f.read()
        fname = os.path.basename(filepath)

        if 'isLoggedIn' not in html:
            print(f"  MISSING auth gate: {fname}")
            issues += 1

        if 'LIMIT' not in html and 'Upgrade to Pro' not in html:
            print(f"  MISSING save limit: {fname}")
            issues += 1

        if "TOOL_ID='__TOOL_ID__'" in html:
            print(f"  BROKEN tool_id: {fname}")
            issues += 1

    if issues == 0:
        print("  ALL PASS")


if __name__ == '__main__':
    main()
