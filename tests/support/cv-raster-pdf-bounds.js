const PDFLib=require('../../assets/vendor/pdf-lib/pdf-lib.min.js');
function multiply(m,n){return[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];}
// The CV styled exporter emits raster XObjects. Track graphics-state transforms,
// including separate translate/scale operators, rather than assuming one cm.
async function inspectRasterPdf(bytes){
 const doc=await PDFLib.PDFDocument.load(bytes),placements=[];
 for(const[pageIndex,page]of doc.getPages().entries()){
  const value=page.node.Contents();const streams=value instanceof PDFLib.PDFArray?value.asArray().map(ref=>doc.context.lookup(ref)):[value];
  const content=streams.filter(Boolean).map(stream=>Buffer.from(PDFLib.decodePDFRawStream(stream).decode()).toString('latin1')).join('\n');
  let matrix=[1,0,0,1,0,0],states=[],operands=[],found=0;
  const tokens=content.match(/\/[^\s<>\[\]()]+|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?|[A-Za-z]+/g)||[];
  for(const token of tokens){
   if(token.startsWith('/')||Number.isFinite(Number(token))){operands.push(token);continue;}
   if(token==='q')states.push(matrix.slice());
   else if(token==='Q')matrix=states.pop()||[1,0,0,1,0,0];
   else if(token==='cm'){const next=operands.slice(-6).map(Number);if(next.length!==6||next.some(n=>!Number.isFinite(n)))throw new Error('Invalid image transform');matrix=multiply(matrix,next);}
   else if(token==='Do'){
    const[a,b,c,d,e,f]=matrix,xs=[e,e+a,e+c,e+a+c],ys=[f,f+b,f+d,f+b+d];const box={page:pageIndex+1,xMin:Math.min(...xs),xMax:Math.max(...xs),yMin:Math.min(...ys),yMax:Math.max(...ys),paperWidth:page.getWidth(),paperHeight:page.getHeight()};box.insidePaper=box.xMin>=-.01&&box.yMin>=-.01&&box.xMax<=box.paperWidth+.01&&box.yMax<=box.paperHeight+.01;placements.push(box);found++;
   }
   operands=[];
  }
  if(!found)throw new Error('No raster image placement found on page '+(pageIndex+1));
 }
 return placements;
}
module.exports={inspectRasterPdf};
