"""Focused saved-artwork placement contracts; no build, HTTP or database access."""
import unittest,json,hashlib,struct
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
EXPECTED=[{'id': 'zana-gharama-za-mafuta-sw', 'route': '/sw/zana/gharama-za-mafuta/', 'sha256': 'bbb77b6fae6f84e7b85c1ef81ad4d6314db62874493e8fce7fec95cf690b8314', 'hero': True}, {'id': 'zana-gharama-ya-kukatika-umeme-sw', 'route': '/sw/zana/gharama-ya-kukatika-umeme/', 'sha256': '39aa0efa93d6b8f47caed1e53cee9e733303e5cdcbf0b59bc32ef03c878c9343', 'hero': False}, {'id': 'zana-mapato-ya-okada-boda-sw', 'route': '/sw/zana/mapato-ya-okada-boda/', 'sha256': '3115fced18e9f7e8af421946a563ba8fed84d5ffbcb8649adeb09be0c529cf07', 'hero': True}, {'id': 'zana-ulinganisho-uhamishaji-pesa-sw', 'route': '/sw/zana/ulinganisho-uhamishaji-pesa/', 'sha256': 'a4e0817a4f44181c921af7d31c4ee99c8ecf31a2cf686d0580e2dd0331d00238', 'hero': False}, {'id': 'zana-kikokotoo-sacco-na-vyama-vya-akiba-sw', 'route': '/sw/zana/kikokotoo-sacco-na-vyama-vya-akiba/', 'sha256': 'bce88e0c965bd52745d11bbff40961c1dbccee704d48750080fdf8493d0a07fc', 'hero': True}, {'id': 'zana-ada-soko-mtandaoni-sw', 'route': '/sw/zana/ada-soko-mtandaoni/', 'sha256': 'a403a64474e69b0adf3604dd6a4898a1b96bae6c27b6228c139e12f8543c539d', 'hero': False}, {'id': 'zana-kikokotoo-burn-rate-sw', 'route': '/sw/zana/kikokotoo-burn-rate/', 'sha256': '76c378064186b803124a84b6330e73956f3626c6b30e8f991deede7095f69e82', 'hero': False}, {'id': 'zana-kikokotoo-churn-rate-sw', 'route': '/sw/zana/kikokotoo-churn-rate/', 'sha256': '6d1acf8c0e14285009120a046021d97cacdd35c8deb2ee1c7bce8b055e91516f', 'hero': False}, {'id': 'zana-orodha-vifaa-sw', 'route': '/sw/zana/orodha-vifaa/', 'sha256': '0dc0d73fb4078246d70c4c77f096db36732196086cd84fdc8a8bc1de66503bdb', 'hero': False}, {'id': 'zana-mapato-ya-mtayarishi-sw-finish', 'route': '/sw/zana/mapato-ya-mtayarishi/', 'sha256': 'f85448ba375d1cffcd419b06d0bf89ed3219b204da3cb6df01554a1654e2da31', 'hero': True}, {'id': 'zana-vichwa-vya-maudhui-sw-finish', 'route': '/sw/zana/vichwa-vya-maudhui/', 'sha256': '254b329b99b38513ef499f6332fe33af6a959090fb520184159abf219f40d922', 'hero': False}]
class Page(HTMLParser):
 def __init__(self,s):
  super().__init__();self.tags=[];self.schema=[];self.active=False;self.feed(s)
 def handle_starttag(self,t,a):
  d=dict(a);self.tags.append((t,d));self.active=t=='script' and d.get('type')=='application/ld+json'
 def handle_data(self,s):
  if self.active:self.schema.append(json.loads(s))
 def handle_endtag(self,t):
  if t=='script':self.active=False
class Artwork(unittest.TestCase):
 def test_exact_eleven_images_and_metadata(self):
  bindings=json.loads((ROOT/'data/image-generation/reviewed-localized-tool-artwork.json').read_text(encoding='utf8'))['bindings']
  for e in EXPECTED:
   with self.subTest(route=e['route']):
    matched=[b for b in bindings if b['route']==e['route']];self.assertEqual(len(matched),1);b=matched[0];self.assertEqual(b['source_id'],e['id']);self.assertEqual(b['sha256'],e['sha256']);self.assertEqual(b['status'],'reviewed_same_tool_binding');self.assertTrue(b['mapping_evidence']);self.assertTrue(b['generation']['original_sha256']);self.assertEqual(b['historical_prompt'],None)
    path='/assets/img/tools/'+e['id']+'.webp';raw=(ROOT/path.lstrip('/')).read_bytes();self.assertEqual(hashlib.sha256(raw).hexdigest(),e['sha256']);self.assertEqual(raw[:4],b'RIFF');self.assertEqual(raw[8:12],b'WEBP')
    p=Page((ROOT/(e['route'].strip('/')+'/index.html')).read_text(encoding='utf8'));meta={d.get('property') or d.get('name'):d.get('content') for t,d in p.tags if t=='meta'}
    for k in ['og:image','twitter:image']:self.assertEqual(meta[k],'https://afrotools.com'+path)
    self.assertEqual((meta['og:image:width'],meta['og:image:height']),('800','533'))
    apps=[s for s in p.schema if isinstance(s,dict) and s.get('@type') in ['WebApplication','SoftwareApplication']];self.assertEqual(len(apps),1);self.assertEqual(apps[0]['image'],'https://afrotools.com'+path)
    imgs=[d for t,d in p.tags if t=='img' and d.get('src')==path];self.assertEqual(len(imgs),int(e['hero']))
    if e['hero']:
     self.assertEqual((imgs[0]['width'],imgs[0]['height']),('800','533'));self.assertEqual(imgs[0]['alt'],b['placement_alt']);self.assertGreater(len(imgs[0]['alt']),25);self.assertTrue(imgs[0]['alt'].startswith('Mchoro wa '))
 def test_exact_four_heroes(self):self.assertEqual(sum(e['hero'] for e in EXPECTED),4)
if __name__=='__main__':unittest.main(verbosity=2)
