'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js/pages/livestock-ration-feedback.js'),'utf8'),context);
const feedback = context.window.AfroTools.LivestockRationFeedback;
const example = {symbol:'KSh',numAnimals:3,dailyBudgetPerAnimal:100,
  costs:{dailyPerAnimal:100,dailyTotal:300},req:{cp_g:1000,tdn_g:6000},prov:{cp_g:950,tdn_g:6000},
  alt:{dailyCost:99.99,dailyTotal:299.98,cp_g:1000,tdn_g:5999}};

test('compares both rations with each budget and full nutrient target at the displayed precision', () => {
  const [main,alt] = feedback.describe(example,'en');
  assert.match(main,/KSh 100\.00, at budget/);
  assert.match(main,/KSh 300\.00, at budget/);
  assert.match(main,/950 \/ 1000 g \(50 g below target\)/);
  assert.match(alt,/KSh 0\.01 under budget/);
  assert.match(alt,/KSh 0\.02 under budget/);
  assert.match(alt,/5999 \/ 6000 g \(1 g below target\)/);
});
test('an omitted budget reports availability of costs and nutrient gaps in all three languages', () => {
  for (const [lang,note] of [['en','no budget entered'],['fr','aucun budget saisi'],['sw','bajeti haijawekwa']]) {
    for (const line of feedback.describe({...example,dailyBudgetPerAnimal:null},lang)) {
      assert.ok(line.includes(note));
      assert.ok(line.includes('KSh'));
    }
  }
});
