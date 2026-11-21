import pathlib,json,hashlib,subprocess,os
root=pathlib.Path.cwd();out=pathlib.Path(os.environ['RETURN_DIR']);out.mkdir(parents=True,exist_ok=True)
def git(*args):return subprocess.check_output(['git',*args])
untracked=[p for p in git('ls-files','--others','--exclude-standard','-z').decode().split('\0') if p and not p.startswith('.github/')]
if untracked:subprocess.run(['git','add','-N','--',*untracked],check=True)
names=sorted(p for p in git('diff','--name-only','-z','HEAD').decode().split('\0') if p and not p.startswith('.github/'))
assert len(names)<6000;rows=[]
for p in names:
 f=root/p;assert f.is_file() and not f.is_symlink(),'Unreviewed deletion/link '+p
 before=subprocess.run(['git','show','HEAD:'+p],capture_output=True)
 rows.append({'path':p,'before_sha256':hashlib.sha256(before.stdout).hexdigest() if before.returncode==0 else None,'after_sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'bytes':f.stat().st_size})
patch=git('diff','--binary','--full-index','--no-ext-diff','HEAD','--',*names) if names else b''
assert patch and len(patch)<64*1024*1024
(out/'generated.patch').write_bytes(patch);(out/'manifest.json').write_text(json.dumps({'preparation_commit':git('rev-parse','HEAD').decode().strip(),'preparation_tree':git('rev-parse','HEAD^{tree}').decode().strip(),'patch_sha256':hashlib.sha256(patch).hexdigest(),'patch_bytes':len(patch),'files':rows},indent=2)+'\n');print(json.dumps({'paths':len(rows),'patch_bytes':len(patch)}))
