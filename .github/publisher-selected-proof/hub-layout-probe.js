async page => await page.evaluate(() => {
  const rect = e => { const r=e.getBoundingClientRect(); return {x:r.x,y:r.y,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}; };
  const rgb = s => { const n=s.match(/[\d.]+/g)?.map(Number); return n&&n.length>=3?{r:n[0],g:n[1],b:n[2],a:n[3]??1}:null; };
  const luminance = c => [c.r,c.g,c.b].map(x=>{x/=255;return x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4}).reduce((n,x,i)=>n+x*[0.2126,0.7152,0.0722][i],0);
  const hero=document.querySelector('.swpf-hero'),h1=hero?.querySelector('h1');
  if(!hero||!h1) return {qualified:false,reason:'Expected real hub hero/H1 absent'};
  const hs=getComputedStyle(h1),bs=getComputedStyle(hero),fg=rgb(hs.color),bg=rgb(bs.backgroundColor);
  const L1=fg&&luminance(fg),L2=bg&&luminance(bg),contrast=fg?.a===1&&bg?.a===1?(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05):null;
  const hr=rect(h1),titleVisible=hs.display!=='none'&&hs.visibility==='visible'&&Number(hs.opacity)>0&&hr.width>0&&hr.height>0&&hr.top>=0&&hr.bottom<=innerHeight;
  const blocks=[{kind:'hero',element:hero},...[...document.querySelectorAll('#swpf-tools .swpf-card')].map((e,i)=>({kind:'card-'+(i+1),element:e}))].map(({kind,element})=>{
    const links=[...element.querySelectorAll('a.swpf-button')],p=[...element.querySelectorAll('p')].at(-1),pr=p?rect(p):null,er=rect(element);
    const rs=links.map(e=>({text:e.textContent.trim(),href:e.getAttribute('href'),display:getComputedStyle(e).display,boxSizing:getComputedStyle(e).boxSizing,rect:rect(e)}));
    const separated=!!pr&&rs.length>0&&rs.every(x=>x.rect.top-pr.bottom>=8-0.5);
    return {kind,container:er,lastParagraph:pr,links:rs,separatedByAtLeast8px:separated,ctasFitContainer:rs.every(x=>x.rect.left>=er.left-.5&&x.rect.right<=er.right+.5),minimum44px:rs.every(x=>x.rect.height>=43.5)};
  });
  return {url:location.href,width:innerWidth,height:innerHeight,dpr:devicePixelRatio,scrollWidth:document.documentElement.scrollWidth,h1:{text:h1.textContent.trim(),color:hs.color,heroBackground:bs.backgroundColor,contrast,minimum4_5:contrast!==null&&contrast>=4.5,rect:hr,visibleInViewport:titleVisible},blocks,expectedFiveCards:blocks.length===6,images:[...hero.querySelectorAll('img')].map(i=>({src:i.currentSrc,complete:i.complete,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,rect:rect(i)})),localAnalyticsChoice:localStorage.getItem('afrotools_cookie_consent')};
})
