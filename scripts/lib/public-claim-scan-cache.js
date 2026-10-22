'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const SCHEMA = 1;
const MAX_BYTES = 512 * 1024;
const MAX_AGE_MS = 75 * 60 * 1000;
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function context(root, env = process.env) {
  if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_JOB !== 'artifact' ||
      String(env.GITHUB_REPOSITORY || '').toLowerCase() !== 'ozaveshe/afrotools' ||
      !/^[0-9]+$/.test(env.GITHUB_RUN_ID || '') || !/^[1-9][0-9]*$/.test(env.GITHUB_RUN_ATTEMPT || '') ||
      !/^[a-f0-9]{40}$/.test(env.GITHUB_SHA || '') || !path.isAbsolute(env.RUNNER_TEMP || '') ||
      path.resolve(env.GITHUB_WORKSPACE || '') !== path.resolve(root)) return null;
  try {
    const git = args => execFileSync('git', ['-c','gc.auto=0',...args], {
      cwd:root,encoding:'utf8',timeout:10000,maxBuffer:1024*1024,stdio:['ignore','pipe','pipe']
    }).trim();
    if (git(['rev-parse','HEAD']) !== env.GITHUB_SHA || git(['status','--porcelain','--untracked-files=no'])) return null;
    const temporary = fs.realpathSync(env.RUNNER_TEMP);
    const identity = {root:path.resolve(root),commit:env.GITHUB_SHA,runId:env.GITHUB_RUN_ID,
      attempt:env.GITHUB_RUN_ATTEMPT,job:env.GITHUB_JOB,node:process.version,unicode:process.versions.unicode,
      executionOptionsSha256:hash(JSON.stringify([process.execArgv,env.NODE_OPTIONS || '']))};
    return {identity,directory:path.join(temporary,'afrotools-public-claim-scans',hash(JSON.stringify(identity)))};
  } catch (_) { return null; }
}
function fingerprint({root,claims,flows,today,files,validation,scannerModule,scannerSource}) {
  if (!Array.isArray(files) || !validation.ok) return null;
  try {
    const rootReal=(fs.realpathSync.native || fs.realpathSync)(root);
    const realPath=fs.realpathSync.native || fs.realpathSync;
    const digest = crypto.createHash('sha256');
    digest.update(JSON.stringify({schema:SCHEMA,root:path.resolve(root),today,
      utcDay:new Date().toISOString().slice(0,10),claims,flows,validation,node:process.version,unicode:process.versions.unicode,
      regexpConstructor:Function.prototype.toString.call(RegExp),regexpExec:Function.prototype.toString.call(RegExp.prototype.exec)}));
    for (const filename of [scannerModule,__filename]) {
      digest.update(JSON.stringify(['code',path.basename(filename)]));digest.update(fs.readFileSync(filename));
    }
    digest.update(JSON.stringify(['scanner',scannerSource]));
    const references = [...new Set([...(claims.claims || []),...(flows.flows || [])]
      .flatMap(record => record.evidenceSources || []))].sort();
    for (const ref of references) {
      digest.update(JSON.stringify(['evidence',ref]));
      if (ref.startsWith('live-read:')) continue;
      const absolute = path.resolve(root,ref),relative=path.relative(root,absolute);
      if (relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative)||!fs.lstatSync(absolute).isFile()) return null;
      const realRelative=path.relative(rootReal,realPath(absolute));
      if(realRelative==='..'||realRelative.startsWith('..'+path.sep)||path.isAbsolute(realRelative))return null;
      digest.update(fs.readFileSync(absolute));
    }
    for (const file of files) {
      if (typeof file.path !== 'string' || typeof file.absolute !== 'string') return null;
      const relative=path.relative(root,file.absolute).split(path.sep).join('/');
      if (relative!==file.path || relative==='..' || relative.startsWith('../') || path.isAbsolute(relative) ||
          !fs.lstatSync(file.absolute).isFile()) return null;
      const resolvedRelative=path.relative(rootReal,realPath(file.absolute));
      if(resolvedRelative==='..'||resolvedRelative.startsWith('..'+path.sep)||path.isAbsolute(resolvedRelative))return null;
      const raw=fs.readFileSync(file.absolute),content=String(file.content || '');
      // Never reuse a projection that differs from the actual source bytes.
      if(raw.toString('utf8')!==content)return null;
      digest.update(JSON.stringify(['file',file.path,content.length,raw.length]));
      digest.update(raw);digest.update(content,'utf16le');digest.update('\0');
    }
    return digest.digest('hex');
  } catch (_) { return null; }
}
function entryPath(scope,key) {
  if (!scope || !/^[a-f0-9]{64}$/.test(key || '')) return null;
  return path.join(scope.directory,key+'.json');
}
function read(scope,key,now=Date.now()) {
  const filename=entryPath(scope,key);if(!filename)return null;
  try {
    const stat=fs.lstatSync(filename);if(!stat.isFile()||stat.size>MAX_BYTES)return null;
    const value=JSON.parse(fs.readFileSync(filename,'utf8'));
    const created=Date.parse(value.createdAt),result=value.result;
    if(value.schema!==SCHEMA||value.key!==key||JSON.stringify(value.identity)!==JSON.stringify(scope.identity)||
      !Number.isFinite(created)||created>now||now-created>MAX_AGE_MS||
      !result||result.ok!==true||!Array.isArray(result.errors)||result.errors.length||
      !Array.isArray(result.warnings)||!Array.isArray(result.hits)||result.hits.length>500||
      !Number.isSafeInteger(result.rawHits)||!Number.isSafeInteger(result.approvedHits)||
      result.rawHits<0||result.approvedHits<0||result.approvedHits>result.rawHits||
      value.resultSha256!==hash(JSON.stringify(result)))return null;
    return result;
  } catch (_) { return null; }
}
function write(scope,key,result,now=Date.now()) {
  const filename=entryPath(scope,key);
  if(!filename||!result||result.ok!==true||!Array.isArray(result.errors)||result.errors.length)return false;
  let temporary;
  try {
    const value={schema:SCHEMA,key,identity:scope.identity,createdAt:new Date(now).toISOString(),
      resultSha256:hash(JSON.stringify(result)),result};
    const text=JSON.stringify(value);if(Buffer.byteLength(text)>MAX_BYTES)return false;
    fs.mkdirSync(scope.directory,{recursive:true});temporary=filename+'.'+process.pid+'.tmp';
    fs.writeFileSync(temporary,text,{flag:'wx'});fs.renameSync(temporary,filename);return true;
  } catch (_) { return false; }
}
module.exports={context,fingerprint,read,write,MAX_AGE_MS};
