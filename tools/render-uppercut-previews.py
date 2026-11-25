from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import json, re, io, base64, math
root=Path('dist')
out=Path('uppercut-gifs')
out.mkdir(exist_ok=True)
atlas=json.loads((root/'assets/atlas.json').read_text())
code=(root/'uppercut.js').read_text()
profiles=json.loads(code.split('const RAW = ',1)[1].split(';\nexport const',1)[0])
game=(root/'game.js').read_text()
names=json.loads(game.split('const FIGHTER_DISPLAY_NAMES = Object.freeze(',1)[1].split(');',1)[0])
names.update({'nickiminaj':'Nicki Minaj','miketyson':'Mike Tyson','damedash':'Dame Dash','diddy':'Diddy','guccimane':'Gucci Mane'})
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',12)
cache={}
def source(path):
    p=root/path.split('?')[0]
    if p not in cache: cache[p]=Image.open(p).convert('RGBA')
    return cache[p]
def sprite(k,i):
    if k=='diddy':
        for name,n in [('idle',7),('walk',7),('punch',7),('jump',7),('hurt',7),('ko',7),('kick',5),('special',4),('block',2)]:
            if i>=n: i-=n;continue
            raw=json.loads((root/'assets/diddy'/f'{name}.json').read_text())[i]
            im=Image.open(io.BytesIO(base64.b64decode(raw.split(',',1)[1]))).convert('RGBA')
            c=Image.new('RGBA',(300,300))
            if name=='special':c.alpha_composite(im.resize((300,300),Image.Resampling.LANCZOS))
            else:c.alpha_composite(im.resize((365,312),Image.Resampling.LANCZOS),(-15,-8))
            return c,150,285,247.5
        raise ValueError(k)
    entry=atlas[k];s=entry['frames'][i]
    im=source(s.get('src',entry.get('src'))).crop((s['x'],s['y'],s['x']+s['w'],s['y']+s['h']))
    threshold=entry.get('alphaThreshold',0)
    if threshold:
        im.putalpha(im.getchannel('A').point(lambda a:0 if a<threshold else a))
    return im,s.get('anchorX',s['w']/2),s.get('anchorY',s['h']),entry.get('referenceHeight',entry['frames'][0]['h'])
bounds=[.12,.27,.40,.55,.74,.89,1.01]
labels=['Guard','Wind-up','Contact','Rising strike','Airborne','Recovery','Ready']
keys=list(profiles)
def panel(k,t):
    style,indices,duration,reach,rise,lift=profiles[k]
    p=min(1,max(0,(t-.25)/duration))
    i=next(i for i,b in enumerate(bounds) if p<b)
    im,ax,ay,ref=sprite(k,indices[i])
    scale=150/ref
    im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.LANCZOS)
    c=Image.new('RGBA',(300,245),'#1b2030');d=ImageDraw.Draw(c)
    d.rectangle((0,204,300,245),fill='#30394a')
    d.ellipse((110,202,190,211),fill='#10131e')
    age=max(0,(p-.29)*duration);y=max(0,rise*age-900*age*age)*.70
    c.alpha_composite(im,(round(150-ax*scale),round(205-ay*scale-y)))
    d=ImageDraw.Draw(c)
    d.text((10,8),names.get(k,k),font=font,fill='#ffffff')
    d.text((10,225),style+' | '+labels[i],font=small,fill='#e8cd89')
    return c.convert('RGB')
def save_gif(path,frames):
    frames[0].save(path,save_all=True,append_images=frames[1:],duration=80,loop=0,optimize=True,disposal=2)
for k in keys:
    save_gif(out/(k+'.gif'),[panel(k,t*.08) for t in range(20)])
for j in range(0,len(keys),7):
    group=keys[j:j+7];frames=[]
    for t in range(20):
        im=Image.new('RGB',(300*4,245*2),'#10131e')
        for i,k in enumerate(group):im.paste(panel(k,t*.08),(300*(i%4),245*(i//4)))
        frames.append(im)
    save_gif(out/f'group-{j//7+1}.gif',frames)
print(f'Generated {len(keys)} individual and {math.ceil(len(keys)/7)} grouped previews')
