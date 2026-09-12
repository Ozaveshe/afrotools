const assert=require('node:assert/strict');
module.exports=function solve(q){let correct;switch(q.id){
case 'mathematics-1990-9-2487905b452e':assert(Math.abs((2/5)**2*9/(72/125)-2.5)<1e-12);assert(Math.abs(Math.log10(2.5)-(1-2*Math.log10(2)))<1e-12);correct='D';break;
case 'mathematics-1990-41-d2f2b569bf2f':{const width=Math.hypot(6,8),radius=width/2,area=width*11+0.5*(22/7)*radius**2-0.5*6*8;assert(Math.abs(area-(125+2/7))<1e-10);correct='A';break;}
case 'mathematics-1992-9-6f99b8892157':{const labels=['A','B','C','D'],predicates=[(x,y,z)=>x&&z,(x,y,z)=>!x&&y&&z,(x,y,z)=>x&&!y&&z,(x,y,z)=>x&&y&&!z];const selected=labels.filter((k,i)=>[0,1].every(x=>[0,1].every(y=>[0,1].every(z=>Boolean(predicates[i](x,y,z))===Boolean(x&&z&&!y)))));assert.deepEqual(selected,['C']);correct=selected[0];break;}
case 'mathematics-1992-11-e5dda24212e0':{for(const [p,a,r] of [[5,2,3],[7,3,2],[2,4,5]]){const x=(p-r)/(a*(p+r));assert(Math.abs((1+a*x)/(1-a*x)-p/r)<1e-12);}correct='B';break;}
case 'mathematics-1992-15-f5547f875a04':for(const x of [0,2,3,-3])assert(Math.abs(3/(x*x+x-2)-(1/(x-1)-1/(x+2)))<1e-12);correct='A';break;
default:throw Error(q.id);
}assert.equal(q.answer,correct);};
