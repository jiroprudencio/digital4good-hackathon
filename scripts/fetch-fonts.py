from urllib.request import Request, urlopen
from urllib.parse import quote
from pathlib import Path
import json
families = {'nunito':'Nunito','dmsans':'DM Sans','spacegrotesk':'Space Grotesk','inter':'Inter','outfit':'Outfit','sourcesans3':'Source Sans 3','pixelifysans':'Pixelify Sans','nunitosans':'Nunito Sans','silkscreen':'Silkscreen','ibmplexsans':'IBM Plex Sans'}
manifest=[]
for slug,name in families.items():
    base='https://api.github.com/repos/google/fonts/contents/ofl/'+slug
    entries=json.load(urlopen(Request(base,headers={'User-Agent':'Scamagotchi-font-preview'})))
    font=next((x for x in entries if x['name'].endswith('.ttf') and '[' in x['name'] and 'Italic' not in x['name']),None) or next(x for x in entries if x['name'].endswith('Regular.ttf'))
    data=urlopen(font['download_url']).read()
    Path('public/fonts/'+slug+'.ttf').write_bytes(data)
    license=next(x for x in entries if x['name']=='OFL.txt')
    Path('public/fonts/'+slug+'-OFL.txt').write_bytes(urlopen(license['download_url']).read())
    manifest.append({'family':name,'file':slug+'.ttf','source':font['html_url'],'license':slug+'-OFL.txt'})
    print(name, len(data), 'bytes')
Path('public/fonts/manifest.json').write_text(json.dumps(manifest,indent=2))
