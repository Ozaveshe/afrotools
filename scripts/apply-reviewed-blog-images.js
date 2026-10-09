#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const crypto=require('crypto');
const {imageSize}=require('./lib/image-size');
const ROOT=path.resolve(__dirname,'..');
const cohort=require('../data/image-generation/placement-review-cohort.json');
const bindings=require('../data/image-generation/blog-artwork-bindings.json').images;
const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function applyBindings(check=false) {
 let changed=0;
 for(const row of bindings) {
  if(!/^blog\/[a-z0-9/-]+\.html$/.test(row.file)||row.file.includes('..')||!/^\/assets\/img\/(?:blog|tools)\/[a-z0-9-]+\.webp$/.test(row.path)) throw new Error('Invalid reviewed article binding');
  const file=path.join(ROOT,row.file),image=path.join(ROOT,row.path),bytes=fs.readFileSync(image),size=imageSize(image);
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==row.sha256||size.w!==row.width||size.h!==row.height) throw new Error('Reviewed artwork changed '+row.path);
  const before=fs.readFileSync(file,'utf8');let after=before;
  if(row.placement==='article-hero') {
   const marker='<article class="article-layout">';
   if(before.split(marker).length!==2) throw new Error('Reviewed article layout changed '+row.file);
   const figure=`<figure class="article-featured-img" data-reviewed-blog-image="true">\n <div class="article-featured-img-inner"><img width="${row.width}" height="${row.height}" src="${escapeHtml(row.path)}" alt="${escapeHtml(row.alt)}" decoding="async" loading="eager"></div>\n <figcaption>${escapeHtml(row.caption)}</figcaption>\n</figure>`;
   const existing=/<figure class="article-featured-img" data-reviewed-blog-image="true">[\s\S]*?<\/figure>/g;
   const matches=before.match(existing)||[];
   if(matches.length>1) throw new Error('Duplicate reviewed article image '+row.file);
   if(matches.length) after=before.replace(existing,figure);
   else {
    if(/<img\b|class="article-featured-img"/.test(before)) throw new Error('Article already has imagery; review placement '+row.file);
    after=before.replace(marker,figure+'\n'+marker);
   }
  } else if(row.placement==='listing-card') {
   let matches=0;
   after=before.replace(/<article\b[^>]*>[\s\S]*?<\/article>/g,card=>{
    if(!card.includes(`href="${row.route}"`)) return card;
    matches++;
    const tag=card.match(/<img\b[^>]*>/)?.[0];
    if(!tag||!['/assets/img/og-home.png',row.path].some(src=>tag.includes(`src="${src}"`))) throw new Error('Article card imagery changed '+row.route);
    const next=tag.replace(/\s(?:src|alt|width|height)="[^"]*"/g,'').replace('<img',`<img src="${escapeHtml(row.path)}" alt="${escapeHtml(row.alt)}" width="${row.width}" height="${row.height}"`);
    return card.replace(tag,next);
   });
   if(matches!==1) throw new Error('Expected one reviewed article card '+row.route);
  } else throw new Error('Unknown article image placement');
  if(after!==before){changed++;if(!check)fs.writeFileSync(file,after);}
 }
 return changed;
}
function apply(check=false){let changed=0;for(const row of cohort.images.filter(x=>x.family==='blog')){
 const slug=path.basename(row.path,'.webp'),file=path.join(ROOT,'blog',slug,'index.html');
 if(!fs.existsSync(file))throw new Error('Missing reviewed article '+slug);
 const before=fs.readFileSync(file,'utf8'),size=imageSize(path.join(ROOT,row.path));let after=before;
 const old=[...before.matchAll(/<meta\b[^>]*(?:property|name)="(?:og:image|twitter:image)"[^>]*content="([^"]+)"[^>]*>/g)].map(m=>m[1]);
 for(const url of new Set(old)){after=after.split(url).join('https://afrotools.com'+row.path);const local=url.replace('https://afrotools.com','');if(local.startsWith('/assets/'))after=after.split(local).join(row.path);}
 after=after.replace(/<img\b[^>]*>/g,tag=>tag.includes('src="'+row.path+'"')?tag.replace(/\s(?:width|height)="[^"]*"/g,'').replace('<img','<img width="'+size.w+'" height="'+size.h+'"'):tag);
 for(const [key,value]of [['width',size.w],['height',size.h]])after=after.replace(new RegExp('(<meta property="og:image:'+key+'" content=")[^"]*(")','g'),'$1'+value+'$2');
 if(after!==before){changed++;if(!check)fs.writeFileSync(file,after);}
 }changed+=applyBindings(check);if(check&&changed)throw new Error(changed+' reviewed article images need refresh');return changed;}
if(require.main===module)console.log(JSON.stringify({changed:apply(process.argv.includes('--check'))}));
module.exports={apply};
