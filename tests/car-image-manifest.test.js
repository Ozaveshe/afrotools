'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {parseCsv}=require('../scripts/car-catalog-manager');
const {carImageName}=require('../scripts/lib/car-image-name');
const ROOT=path.resolve(__dirname,'..');
const decisions=require('../data/image-generation/placement-decisions.json').images;
for(const image of decisions.filter(x=>x.decision==='reserved-catalogue')){
 const [file,id]=image.owner.split('#'),rows=parseCsv(fs.readFileSync(path.join(ROOT,file),'utf8'));
 const column=rows[0].indexOf('image_name'),record=rows.find(r=>r[0]===id);
 assert.equal(record[column],path.basename(image.path),'Candidate requests existing bytes: '+id);
 const manifest=file.replace('catalog-expansion','image-upload-manifest');
 const uploads=parseCsv(fs.readFileSync(path.join(ROOT,manifest),'utf8'));
 const upload=uploads.find(r=>r[0]===id);assert.equal(upload[uploads[0].indexOf('image_name')],path.basename(image.path),'Upload manifest: '+id);
}
assert.equal(carImageName('nonexistent-vehicle','nonexistent','model',2026),'nonexistent-vehicle-hero.jpg');
assert.equal(carImageName('ford-escape-kuga-2005','ford','escape-kuga',2005),'ford-escape-kuga-2005-hero.webp');
console.log('PASS: all 201 reserved car candidates and upload manifests reuse the existing image filenames.');
