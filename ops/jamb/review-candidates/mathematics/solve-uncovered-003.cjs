const assert=require('node:assert/strict');
module.exports=function solve(q){const k=q.id.split('-').slice(1,3).join('-');let correct;
switch(k){
case '1989-28': {const stationary=['b','e','g','j','m'];correct=Object.keys(q.options).find(key=>q.options[key].split(', ').join('')===stationary.join(''));assert.equal(correct,'B');break;}
case '1989-32':assert(Math.abs(1-4/(4+3)-3/7)<1e-12);correct='B';break;
case '1989-40':{const factor=52/Math.hypot(5,12);assert.equal((5+12)*factor+52,120);correct='D';break;}
case '1989-50':{const numbers=[1,3,6],pairs=[];for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)pairs.push(numbers[i]+numbers[j]);assert.equal(pairs.filter(x=>x%2===0).length/pairs.length,1/3);correct='C';break;}
case '1990-1':assert.equal(((4+3/4)-(6+1/4))/((4+1/5)*(1+1/4)),-2/7);correct='B';break;
case '1990-3':{const scaled=1001000-1025;assert.equal(Math.round(scaled/10)/1000,99.998);correct='A';break;}
case '1990-4':assert.equal(Number((62/3).toPrecision(3)),20.7);correct='D';break;
case '1990-6':assert.equal(1000+1000*2/100*4-800,280);correct='C';break;
case '1990-7':assert.equal((3*20+5*15)/8,16+7/8);correct='B';break;
default:throw Error(k);
}assert.equal(q.answer,correct);};
