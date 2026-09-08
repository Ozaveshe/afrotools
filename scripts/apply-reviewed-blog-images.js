#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const {imageSize}=require('./lib/image-size');
const ROOT=path.resolve(__dirname,'..');
const cohort=require('../data/image-generation/placement-review-cohort.json');
function apply(check=false){let changed=0;for(const row of cohort.images.filter(x=>x.family==='blog')){
 const slug=path.basename(row.path,'.webp'),file=path.join(ROOT,'blog',slug,'index.html');
 if(!fs.existsSync(file))throw new Error('Missing reviewed article '+slug);
 const before=fs.readFileSync(file,'utf8'),size=imageSize(path.join(ROOT,row.path));let after=before;
 const old=[...before.matchAll(/<meta\b[^>]*(?:property|name)="(?:og:image|twitter:image)"[^>]*content="([^"]+)"[^>]*>/g)].map(m=>m[1]);
 for(const url of new Set(old)){after=after.split(url).join('https://afrotools.com'+row.path);const local=url.replace('https://afrotools.com','');if(local.startsWith('/assets/'))after=after.split(local).join(row.path);}
 after=after.replace(/<img\b[^>]*>/g,tag=>tag.includes('src="'+row.path+'"')?tag.replace(/\s(?:width|height)="[^"]*"/g,'').replace('<img','<img width="'+size.w+'" height="'+size.h+'"'):tag);
 for(const [key,value]of [['width',size.w],['height',size.h]])after=after.replace(new RegExp('(<meta property="og:image:'+key+'" content=")[^"]*(")','g'),'$1'+value+'$2');
 if(after!==before){changed++;if(!check)fs.writeFileSync(file,after);}
 }if(check&&changed)throw new Error(changed+' reviewed article images need refresh');return changed;}
if(require.main===module)console.log(JSON.stringify({changed:apply(process.argv.includes('--check'))}));
module.exports={apply};
