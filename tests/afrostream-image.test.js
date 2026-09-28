'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const {allowedUrl,publicAddress,imageType,fetchImage}=require('../netlify/functions/afrostream-image').__test;
const jpeg=Buffer.from([255,216,255,224,0,16,74,70,73,70,0,1,1,1,0,0]);
const resolver=async()=>[{address:'142.250.1.1'}];
test('the image endpoint refuses arbitrary, private, credential-bearing and non-HTTPS destinations',()=>{
  ['http://storage.googleapis.com/a.jpg','https://localhost/a.jpg','https://127.0.0.1/a.jpg','https://storage.googleapis.com.evil.example/a.jpg','https://user:pass@storage.googleapis.com/a.jpg','https://storage.googleapis.com:8080/a.jpg','data:image/png;base64,AAA','https://evil.example/a.jpg'].forEach(url=>assert.equal(allowedUrl(url),null));
  assert.ok(allowedUrl('https://storage.googleapis.com/a.jpg'));
  ['127.0.0.1','10.1.2.3','169.254.169.254','172.16.2.1','192.168.0.1','100.64.0.1','0.0.0.0','::1','::ffff:127.0.0.1','fc00::1','fe80::1'].forEach(ip=>assert.equal(publicAddress(ip),false,ip));
  assert.equal(publicAddress('142.250.1.1'),true);
});
test('every redirect is validated before fetching and private DNS results fail closed',async()=>{
  let calls=0;
  await assert.rejects(fetchImage('https://storage.googleapis.com/a.jpg',async()=>{calls++;return new Response(null,{status:302,headers:{location:'http://169.254.169.254/latest/meta-data'}});},resolver),/host not allowed/);
  assert.equal(calls,1);
  await assert.rejects(fetchImage('https://storage.googleapis.com/a.jpg',async()=>{throw new Error('Should not fetch');},async()=>[{address:'127.0.0.1'}]),/not public/);
});
test('only bounded raster bytes can be served as images',async()=>{
  const image=await fetchImage('https://storage.googleapis.com/a.jpg',async()=>new Response(jpeg,{headers:{'content-type':'image/jpeg'}}),resolver);
  assert.equal(image.type,'image/jpeg');assert.deepEqual(image.bytes,jpeg);
  await assert.rejects(fetchImage('https://storage.googleapis.com/a.jpg',async()=>new Response('<svg onload="alert(1)"></svg>',{headers:{'content-type':'image/svg+xml'}}),resolver),/Invalid image response/);
  await assert.rejects(fetchImage('https://storage.googleapis.com/a.jpg',async()=>new Response('not an image',{headers:{'content-type':'image/jpeg'}}),resolver),/Invalid image bytes/);
  await assert.rejects(fetchImage('https://storage.googleapis.com/a.jpg',async()=>new Response(jpeg,{headers:{'content-type':'image/jpeg','content-length':'9999999'}}),resolver),/Invalid image response/);
  assert.equal(imageType(Buffer.alloc(12)), '');
});
