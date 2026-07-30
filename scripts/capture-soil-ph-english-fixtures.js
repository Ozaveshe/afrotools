#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const{spawn}=require('node:child_process');
const{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'tests/fixtures/soil-ph-english-invariants.json');
const crops=['maize','rice','sorghum','wheat','barley','teff','cassava','yam','groundnut','soybean','common-bean','coffee','tea','cocoa','cotton','tomato'];
const phs=[3.5,4.2,4.7,5.2,5.7,6.2,6.8,7.2,7.8,8.7],textures=['sandy','sandy-loam','loam','clay-loam','clay'],depths=['15','20','30'],qualities=['100','90','95','30'];
async function capture(){
 const port='42950',base=process.env.SOIL_PH_BASE_URL||('http://127.0.0.1:'+port),server=process.env.SOIL_PH_BASE_URL?null:spawn(process.execPath,['tests/support/static-server.js'],{cwd:ROOT,env:{...process.env,PORT:port},stdio:'ignore'});
 for(let attempt=0;attempt<40;attempt+=1){try{const response=await fetch(base+'/agriculture/soil-ph/');if(response.ok)break}catch{}await new Promise(resolve=>setTimeout(resolve,100))}
 const sentinel=await(await fetch(base+'/tests/fixtures/fr-agriculture-worktree-7e83-sentinel.txt')).text();
 assert.match(sentinel,/worktree=7e83/);assert.match(sentinel,/root=C:\\Users\\Oza\\\.codex\\worktrees\\7e83\\afrotools/);
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({locale:'en-US'});
 await page.goto(base+'/agriculture/soil-ph/');
 const scenarios=[];
 const inputs=[];
 phs.forEach((ph,index)=>inputs.push({ph,crop:'',texture:textures[index%5],depth:depths[index%3],quality:qualities[index%4],farmHa:1+index*.25,limePrice:index%2?150:0}));
 crops.forEach((crop,cropIndex)=>[4.2,5.2,6.2,7.8].forEach((ph,phIndex)=>inputs.push({ph,crop,texture:textures[(cropIndex+phIndex)%5],depth:depths[(cropIndex+phIndex)%3],quality:qualities[(cropIndex+phIndex)%4],farmHa:[.5,1,2.75,10][phIndex],limePrice:[0,100,250,1000][phIndex]})));
 for(const input of inputs){
  await page.fill('#ph-input',String(input.ph));await page.selectOption('#crop-select',input.crop);await page.selectOption('#texture-select',input.texture);await page.selectOption('#depth-select',input.depth);await page.selectOption('#lime-type',input.quality);await page.fill('#farm-size',String(input.farmHa));await page.fill('#lime-price',String(input.limePrice));await page.evaluate(()=>window.calcSoilPH());
  const output=await page.evaluate(()=>({badge:document.querySelector('#ph-badge').textContent,badgeClass:document.querySelector('#ph-badge').className,description:document.querySelector('#ph-desc').textContent,suitability:document.querySelector('#suit-text').textContent,target:document.querySelector('#label-target').textContent,limeTitle:document.querySelector('#lime-card-title').textContent,lime:document.querySelector('#lime-result-body').innerText,amendments:document.querySelector('#amend-body').innerText,timing:document.querySelector('#timing-list').innerText,crops:document.querySelector('#crop-chips').innerText}));
  scenarios.push({input,output});
 }
 await browser.close();if(server)server.kill();return{schemaVersion:1,source:'agriculture/soil-ph/index.html#inline-controller',scenarios};
}
(async()=>{const value=JSON.stringify(await capture(),null,2)+'\n';if(process.argv.includes('--check')){assert.equal(fs.readFileSync(OUT,'utf8'),value);console.log('PASS '+JSON.parse(value).scenarios.length+' Soil pH English invariants')}else{fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,value,'utf8');console.log('Wrote '+JSON.parse(value).scenarios.length+' Soil pH English invariants')}})().catch(error=>{console.error(error);process.exitCode=1});
