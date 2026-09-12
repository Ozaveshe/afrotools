// One-time, exact asset amendment. Historical records and SVG bytes are retained privately.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Oza/Documents/afrotools/node_modules/playwright');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const mode=process.argv[2];assert(['maize','paramecium'].includes(mode));
const name=mode==='maize'?'biology-1986-maize-numbered.svg':'biology-1992-paramecium-xy.svg';
const batch=mode==='maize'?'biology-1986-005.json':'biology-1991-010.json';
const oldHash=mode==='maize'?'5d08354ea05bc315e2b6b00dc5ea6fd0aff513706737a3bf6abeffd3fd7cd852':'ecfc6d170f3ad3814a40692a5177d082e0f59ee83eb9b87b5abcb00527c5bb48';
(async()=>{
 const file=path.join(__dirname,'assets',name),bytes=fs.readFileSync(file);assert.equal(sha(bytes),oldHash,'Amendment must start at pinned original asset');
 const b=JSON.parse(fs.readFileSync(path.join(__dirname,batch))),records=b.records.filter(r=>r.diagram_evidence?.asset_sha256===oldHash);assert.equal(records.length,mode==='maize'?3:2);
 const browser=await chromium.launch({headless:true}),page=await browser.newPage();await page.setContent(bytes.toString());
 const primitives=await page.evaluate(mode=>{
  const p=[...document.querySelectorAll('path')].find(p=>(p.getAttribute(mode==='maize'?'fill':'stroke')||'').includes('url('));
  const out=[],f=n=>Number(n.toFixed(2));
  if(mode==='maize'){
   for(let y=0;y<720;y+=18)for(let x=0;x<680;x+=18)for(const [dx,dy,r]of [[4,5,1.8],[13,13,1.5]]){
    const cx=x+dx,cy=y+dy;let inside=true;
    for(let a=0;a<8;a++)if(!p.isPointInFill(new DOMPoint(cx+r*Math.cos(a*Math.PI/4),cy+r*Math.sin(a*Math.PI/4))))inside=false;
    if(inside)out.push(`<circle cx="${cx}" cy="${cy}" r="${r}"/>`);
   }
   return '<g fill="#333" stroke="none">'+out.join('')+'</g>';
  }
  const length=p.getTotalLength();for(let s=0;s<length;s+=10){
   const a=p.getPointAtLength(s),b=p.getPointAtLength((s+0.5)%length),dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy);let nx=-dy/n,ny=dx/n;
   if(p.isPointInFill(new DOMPoint(a.x+nx*3,a.y+ny*3))){nx=-nx;ny=-ny;}
   out.push(`<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(a.x+nx*9)}" y2="${f(a.y+ny*9)}"/>`);
  }
  return '<g stroke="#111" stroke-width="1.5">'+out.join('')+'</g>';
 },mode);await browser.close();
 let svg=bytes.toString().replace(/<defs>[\s\S]*?<\/defs>/,'');
 if(mode==='maize')svg=svg.replace(/(<path[^>]+) fill="url\(#dots\)"\/>/,'$1/>'+primitives);
 else svg=svg.replace(/<path[^>]+stroke="url\(#cilia\)"[^>]*\/>/,primitives);
 svg=svg.replace(/\r\n/g,'\n');assert(!/url\(|<defs|<pattern/.test(svg));
 const newHash=sha(svg),history={schema_version:1,amendment:mode+'-primitive-svg-20260912',batch,reason:'Replace unsupported SVG paint patterns with explicit geometric primitives while preserving numbered identification, source geometry and answers.',old_asset_sha256:oldHash,new_asset_sha256:newHash,original_svg:bytes.toString(),original_records:structuredClone(records)};
 fs.writeFileSync(path.join(__dirname,mode+'-svg-amendment-20260912.json'),JSON.stringify(history,null,2)+'\n');fs.writeFileSync(file,svg);
 for(const r of records){r.candidate.image='/assets/img/jamb/'+newHash+'.svg';r.content_sha256=questionFingerprint(r.candidate);r.diagram_evidence.asset_sha256=newHash;r.diagram_evidence.public_path=r.candidate.image;}
 fs.writeFileSync(path.join(__dirname,batch),JSON.stringify(b,null,2)+'\n');console.log(JSON.stringify({mode,oldHash,newHash,ids:records.map(r=>r.id),bytes:Buffer.byteLength(svg)}));
})().catch(e=>{console.error(e);process.exitCode=1;});
