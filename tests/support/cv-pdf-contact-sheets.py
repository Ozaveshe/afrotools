from pathlib import Path
import subprocess, sys, os, shutil
from PIL import Image,ImageOps,ImageDraw
root=Path(sys.argv[1]).resolve()
pop=os.environ.get('POPPLER_PDFTOPPM') or shutil.which('pdftoppm')
if not pop: raise SystemExit('Set POPPLER_PDFTOPPM to the local pdftoppm executable.')
for pdf in sorted(root.glob('*.pdf')):
 target=pdf.with_suffix('')
 if not Path(str(target)+'-1.png').exists(): subprocess.run([pop,'-scale-to','700','-png',str(pdf),str(target)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
for locale in ['en','fr','sw']:
 imgs=sorted(root.glob(locale+'-*.png'))
 if not imgs: continue
 for batch in range(0,len(imgs),18):
  sheet=Image.new('RGB',(1500,3*0+((min(18,len(imgs)-batch)+5)//6)*390),'#d5d5d5');d=ImageDraw.Draw(sheet)
  for j,p in enumerate(imgs[batch:batch+18]):
   im=Image.open(p).convert('RGB');im.thumbnail((242,350));x=(j%6)*250;y=(j//6)*390;sheet.paste(im,(x+(250-im.width)//2,y+32));d.text((x+3,y+3),p.stem[len(locale)+1:][:30],fill='black')
  sheet.save(root/(locale+'-sheet-'+str(batch//18+1)+'.jpg'))
