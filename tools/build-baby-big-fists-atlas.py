"""Index transparent sprite bounds; preserve the original generated pixels."""
import json
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
path=root/'dist/assets/atlas.json'
atlas=json.loads(path.read_text())
sets=[('babybigfists','baby-big-fists-fighter.png',[165,165,165,165,165,157,165,165,165,155,142,155,165,165,158,155]),
      ('babyBigFistsActions','baby-big-fists-actions.png',[158,158,158,158,158,158,158,158,158,158,148,106,130,106,148,150])]
for key,name,centers in sets:
    im=Image.open(root/'dist/assets'/name);w,h=im.size;alpha=im.getchannel('A');frames=[]
    reference=None
    for i in range(16):
        x,y=(i%4)*w//4,(i//4)*h//4;x1,y1=(i%4+1)*w//4,(i//4+1)*h//4
        a=alpha.crop((x,y,x1,y1));l,t,r,b=a.point(lambda v:255 if v>35 else 0).getbbox()
        solid=a.point(lambda v:255 if v>130 else 0).getbbox()
        if i==0:reference=solid[3]-solid[1];baseline=solid[3]
        floor=baseline if key=='babybigfists' and i in (2,3) else solid[3]
        frames.append(dict(x=x+l,y=y+t,w=r-l,h=b-t,cellX=x,cellY=y,cellW=x1-x,cellH=y1-y,
                           anchorX=centers[i]*(w/1254)-l,anchorY=floor-t))
    atlas[key]=dict(src='assets/'+name,width=w,height=h,cols=4,rows=4,referenceHeight=reference,frames=frames)
path.write_text(json.dumps(atlas,indent=2)+'\n')
print('Indexed 32 Baby Big Fists poses.')
