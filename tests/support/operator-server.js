// Local boundary harness: runs the real function with a synthetic credential.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
process.env.ADMIN_KEY='synthetic-operator-test-only';
delete process.env.ADMIN_SECRET;
const root=path.resolve(__dirname,'../..');
const port=Number(process.env.PORT || 4189);
const types={'.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png','.html':'text/html'};
import('../../netlify/functions/operator-dashboard.mjs').then(({default:handler})=>{
  http.createServer(async(req,res)=>{
    const url=new URL(req.url,`http://127.0.0.1:${port}`);
    try {
      if(['/mc-7a2f9x.html','/mc-7a2f9x','/.netlify/functions/operator-dashboard'].includes(url.pathname)||url.pathname.startsWith('/api/operator-dashboard/')){
        const chunks=[];for await(const chunk of req)chunks.push(chunk);
        const request=new Request(url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
        const result=await handler(request,{readOperations:async()=>require('../fixtures/operator-engine.cjs')()});
        res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));return;
      }
      if(!url.pathname.startsWith('/assets/')) {res.writeHead(404);res.end('Not found');return;}
      const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
      if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end('Not found');return;}
      res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
    }catch(_){res.writeHead(500);res.end('Harness failure');}
  }).listen(port,'127.0.0.1',()=>console.log(`Operator test harness listening on ${port}`));
});
