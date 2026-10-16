"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), os = require("node:os");
const policyApi = require("../scripts/lib/static-owner-policy");
function runFilesystemChecks(policy) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "afro-static-owner-"));
  const root = path.join(temporary, "root"), outside = path.join(temporary, "outside"); fs.mkdirSync(root); fs.mkdirSync(outside);
  let count = 0;
  const owner = policy.staticOwnerDecisions[0];
  function make(file) { const p = path.join(root, file); fs.mkdirSync(path.dirname(p), {recursive:true}); fs.writeFileSync(p,"<!doctype html><title>fixture</title>\n"); return file; }
  function fixture(destination) { return {...policy, staticOwnerDecisions:[{...owner, destination:"/"+destination}]}; }
  function rejects(name, fn) { assert.throws(fn, undefined, name); count++; }
  try {
    const good = make("tools/example/physical.html");
    assert.equal(policyApi.validatePhysicalOwners(fixture(good),root,new Set([good]))[0].target,"/"+good); count++;
    rejects("existing file absent from published inventory",()=>policyApi.validatePhysicalOwners(fixture(good),root,new Set()));
    for(const file of ["tests/private.html","admin/private.html","reports/private.html","artifacts/private.html","tools/afrostream/admin.html"]) {
      make(file); rejects("excluded physical target "+file,()=>policyApi.validatePhysicalOwners(fixture(file),root,new Set([file])));
    }
    const absent="tools/example/missing.html";
    rejects("missing physical file despite forged inventory",()=>policyApi.validatePhysicalOwners(fixture(absent),root,new Set([absent])));
    const directory="tools/directory.html"; fs.mkdirSync(path.join(root,directory));
    rejects("directory is not physical HTML file",()=>policyApi.validatePhysicalOwners(fixture(directory),root,new Set([directory])));
    const outward=path.join(outside,"outside.html");fs.writeFileSync(outward,"outside");
    fs.symlinkSync(outside,path.join(root,"tools","outside-link"),process.platform==="win32"?"junction":"dir");
    rejects("junction/symlink escape outside source",()=>policyApi.validatePhysicalOwners(fixture("tools/outside-link/outside.html"),root,new Set(["tools/outside-link/outside.html"])));
    fs.symlinkSync(path.join(root,"admin"),path.join(root,"tools","excluded-link"),process.platform==="win32"?"junction":"dir");
    rejects("junction/symlink into excluded source",()=>policyApi.validatePhysicalOwners(fixture("tools/excluded-link/private.html"),root,new Set(["tools/excluded-link/private.html"])));
    for(const destination of ["/../outside.html","https://example.com/x.html","/tools/x.html?x=1","/tools/%78.html"]) rejects("unsafe literal "+destination,()=>policyApi.staticOwnerRules({...policy,staticOwnerDecisions:[{...owner,destination}]}));
    rejects("duplicate normalized source",()=>policyApi.staticOwnerRules({...policy,staticOwnerDecisions:[owner,{...owner,source:owner.source+"/"}]}));
    rejects("duplicate owner ID",()=>policyApi.staticOwnerRules({...policy,staticOwnerDecisions:[owner,{...owner,source:"/different"}]}));
    rejects("canonical decision source conflict",()=>policyApi.staticOwnerRules({...policy,canonicalDecisions:[...policy.canonicalDecisions,{source:owner.source+"/"}]}));
    return count;
  } finally {
    const resolved=path.resolve(temporary),parent=path.resolve(os.tmpdir());
    assert(path.dirname(resolved)===parent&&path.basename(resolved).startsWith("afro-static-owner-"));
    fs.rmSync(resolved,{recursive:true,force:true});
  }
}
function runGraphChecks(routeApi, graph, policy, basePolicy) {
  const flat="tools/africa-conflict/conflicts.html",index="tools/africa-conflict/conflicts/index.html";
  const page=graph.routes.find(p=>p.source?.file===index);
  assert(page,"Existing index metadata record retained");
  assert.equal(page.source.file,index);assert(page.source.alternateFiles.includes(flat));
  assert.equal(page.canonicalRoute,"/tools/africa-conflict/conflicts/");
  assert.equal(page.deliveryRewrite.target,"/"+flat);assert.equal(page.deliveryRewrite.physicalOwnerFile,flat);
  assert.equal(page.deliveryRewrite.owner,"data/registry/route-policy.json");
  assert.deepEqual(policy.canonicalDecisions,basePolicy.canonicalDecisions);
  const original=fs.readFileSync(path.join(routeApi.ROOT,"_redirects"),"utf8").replace(/\r\n/g,"\n");
  const emitted=routeApi.managedRedirectContent(graph,policy);
  const ownerLine=policyApi.staticOwnerLines(policy)[0];assert.equal(emitted.split("\n")[3],ownerLine);
  const baseline=routeApi.managedRedirectContent(graph,basePolicy);
  assert.equal(emitted.replace(ownerLine+"\n",""),baseline,"All existing canonical301 emissions retained");
  const rendered=routeApi.renderRedirectContract(graph,policy,original);
  assert.equal(routeApi.renderRedirectContract(graph,policy,rendered),rendered,"Real managed renderer is idempotent");
  assert.equal(rendered.split(ownerLine).length,2,"One owner rule, no slash duplicate");
  assert.match(rendered,/^\/tools\/africa-conflict\/conflicts\.html\s+\/tools\/africa-conflict\/conflicts\s+301!$/m,"Existing external HTML301 retained");
  assert.equal(JSON.stringify(page.source),JSON.stringify(graph.routes.find(p=>p.source?.file===index).source));
  return 12;
}
function main() {
  const routeApi=require("../scripts/lib/route-contract"),policy=routeApi.loadPolicy(),basePolicy={...policy};delete basePolicy.staticOwnerDecisions;
  const filesystem=runFilesystemChecks(policy),graph=routeApi.buildRouteGraph(),graphChecks=runGraphChecks(routeApi,graph,policy,basePolicy);
  console.log(JSON.stringify({pass:true,filesystemChecks:filesystem,graphChecks,graphRoutes:graph.routes.length}));
}
module.exports={runFilesystemChecks,runGraphChecks};
if(require.main===module)main();
