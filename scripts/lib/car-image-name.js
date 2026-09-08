'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..');
function carImageName(vehicleId,makeSlug,modelSlug,year,root=ROOT){
 const stem=vehicleId+'-hero';
 const directory=path.join(root,'assets/img/cars',makeSlug,modelSlug,String(year));
 const extension=['webp','jpg','jpeg','png','avif'].find(ext=>fs.existsSync(path.join(directory,stem+'.'+ext)));
 return stem+'.'+(extension||'jpg');
}
module.exports={carImageName};
