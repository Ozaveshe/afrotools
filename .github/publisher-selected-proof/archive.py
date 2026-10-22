import pathlib,sys,zipfile,tarfile,json,os
D=pathlib.Path(__file__).resolve().parent
phase=sys.argv[1];W=pathlib.Path.cwd().resolve()
if phase=='unzip':
 with zipfile.ZipFile(D/'sealed.zip') as z:
  assert sorted(z.namelist())==['manifest.json','payload.tar']
  for name in z.namelist():
   info=z.getinfo(name);assert info.file_size<(25000000 if name=='manifest.json' else 2*1024**3)
   with z.open(name) as src,(D/name).open('xb') as out:
    while True:
     b=src.read(1024*1024)
     if not b:break
     out.write(b)
 print('Authenticated ZIP members extracted into owned runner temp');sys.exit(0)
m=json.loads((D/'manifest.json').read_text());expected={e['path']:e for e in m['dist']};expected[m['marker']['path']]={**m['marker'],'type':'file'}
forbidden=['.git','.github','.codex','.agents','.claude','.netlify','node_modules','netlify','scripts','supabase','tests','docs','reports','audit-results','artifacts','test-results','package.json','package-lock.json','AGENTS.md','CLAUDE.md','.env','data/registry','data/automation','data/image-generation']
seen=set()
with tarfile.open(D/'payload.tar','r:') as t:
 members=t.getmembers()
 for e in members:
  name=e.name.rstrip('/');assert name and not name.startswith('/') and chr(92) not in name and ':' not in name
  assert all(p not in ['','.','..'] for p in name.split('/'));assert all(ord(c)>=32 and ord(c)!=127 for c in name)
  assert name in expected and name not in seen;seen.add(name);row=expected[name]
  assert e.isfile() or e.isdir();assert ('file' if e.isfile() else 'directory')==row['type']
  if e.isfile():assert e.size==row['bytes']
  if 'mode' in row:assert e.mode==row['mode']
  assert name==m['marker']['path'] or name=='dist' or name.startswith('dist/')
  assert not any(name=='dist/'+f or name.startswith('dist/'+f+'/') for f in forbidden)
 assert seen==set(expected)
 assert not (W/'dist').exists(),'Fresh exact candidate checkout must have no local build'
 assert not (W/m['marker']['path']).exists(),'Do not overwrite an unrelated release marker'
 for e in members:
  name=e.name.rstrip('/');target=W/pathlib.PurePosixPath(name);assert target.resolve()==target and target.is_relative_to(W)
  if e.isdir():target.mkdir(parents=True,exist_ok=True)
  else:
   target.parent.mkdir(parents=True,exist_ok=True)
   with t.extractfile(e) as src,target.open('xb') as out:
    while True:
     b=src.read(1024*1024)
     if not b:break
     out.write(b)
   os.chmod(target,e.mode)
  if e.isdir():os.chmod(target,e.mode)
print(json.dumps({'tar_entries':len(seen),'forbidden':[],'full_exact_artifact_restored':True}))
