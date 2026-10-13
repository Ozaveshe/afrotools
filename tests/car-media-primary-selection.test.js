'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Price=require('../assets/js/lib/car-price-intelligence');
const data=require('../data/cars/price-intelligence.json');

const axio=data.vehicles.find(row=>row.id==='toyota-axio-2018');
const specificGallery=Price.resolveMedia(data,axio,'KE','japan');
assert.equal(specificGallery.hero.id,'toyota-axio-2018-hero','A country-specific secondary illustration must not replace the assigned vehicle-primary photo');
assert.ok(specificGallery.gallery.some(row=>row.id==='seed-generic-car-illustration'),'Secondary media remains in the gallery');

let checked=0;
for(const country of Object.values(data.countries)){
  for(const vehicle of data.vehicles){
    for(const sourceMarket of Object.keys(data.sourceMarkets)){
      const media=Price.resolveMedia(data,vehicle,country.code,sourceMarket);
      assert.ok(media.hero.imageUrl.startsWith('/assets/img/cars/'),country.code+' '+vehicle.id+' must use model artwork');
      assert.ok(fs.existsSync(media.hero.imageUrl.slice(1)),media.hero.imageUrl);
      checked++;
    }
  }
}
console.log('PASS: '+checked+' country, vehicle and source-market media selections; no generic hero substitution.');
