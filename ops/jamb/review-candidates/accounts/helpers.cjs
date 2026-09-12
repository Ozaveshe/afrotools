const pool=require('../../../jamb/source-pool.json').questions.filter(q=>q.subject==='accounts');
const clean=s=>s.replace(/\[PAGE \d+\]/g,'').replace(/([a-z])-\s+([a-z])/gi,'$1$2').replace(/\s+/g,' ').trim();
const opt=(...v)=>Object.fromEntries(v.map((x,i)=>['ABCD'[i],x]));
function batch(start){const reviews={};return{reviews,r(i,answer,explanation,extra={}){const o=pool[start+i-1],options=extra.options||Object.fromEntries(Object.entries(o.options).map(([k,v])=>[k,clean(v)]));const expected=extra.expected; if(!expected&&!extra.solve)throw Error('Independent expected meaning required');reviews[i]={answer,question:clean(o.question),options,explanation,solve:extra.solve||(()=>{const matches=Object.values(options).filter(x=>expected.test(x));if(matches.length!==1)throw Error('Nonunique semantic solution '+i);return matches[0];}),...extra};}};}
module.exports={batch,opt};
