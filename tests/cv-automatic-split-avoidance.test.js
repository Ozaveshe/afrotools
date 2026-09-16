const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const document={readyState:'loading',addEventListener(){}};const window={};vm.runInNewContext(fs.readFileSync('tools/cv-builder/js/cv-export-pdf-quality.js','utf8'),{window,document});const cut=window.CVExportPdfQuality.avoidBlockSplit;
test('fitting block moves intact to next page',()=>assert.equal(cut(0,840,844,[{top:819,bottom:1011}]),819));
test('overlapping columns move the cut until neither fitting block crosses it',()=>assert.equal(cut(0,840,844,[{top:800,bottom:1000},{top:760,bottom:820}]),760));
test('oversized blocks can continue without discarding their pixels',()=>assert.equal(cut(0,840,844,[{top:100,bottom:2000}]),840));
test('blocks already continued from earlier pages cannot cause backward cuts',()=>assert.equal(cut(840,1680,844,[{top:800,bottom:1700}]),1680));
test('disabled avoidance keeps original cut',()=>assert.equal(cut(0,840,844,[]),840));
test('multiple pages cover every source row exactly once',()=>{let start=0,total=3200,rows=0;while(start<total){let end=cut(start,Math.min(total,start+844),844,[{top:819,bottom:1011},{top:1600,bottom:1750},{top:2100,bottom:3100}]);assert.ok(end>start);assert.ok(end-start<=844);rows+=end-start;start=end;}assert.equal(rows,total);});
