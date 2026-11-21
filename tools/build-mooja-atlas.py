"""Index transparent sprite bounds; preserve the original generated pixels."""
import json
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
path=root/'dist/assets/atlas.json'
atlas=json.loads(path.read_text())
sets=[('mooja','mooja-fighter.png',[165,158,158,158,165,150,165,165,160,150,140,155,165,165,155,150]),
      ('mooJaActions','mooja-actions.png',[165,165,165,165,165,165,165,165,170,160,148,148,148,148,148,165]),
      ('mooJaMilk','mooja-milk.png',[156.75]*16)]
for key,name,centers in sets:
    im=Image.open(root/'dist/assets'/name);w,h=im.size;alpha=im.getchannel('A');frames=[]
    reference=None
    for i in range(16):
        x,y=(i%4)*w//4,(i//4)*h//4;x1,y1=(i%4+1)*w//4,(i//4+1)*h//4
        a=alpha.crop((x,y,x1,y1));l,t,r,b=a.point(lambda v:255 if v>35 else 0).getbbox()
        solid=a.point(lambda v:255 if v>130 else 0).getbbox()
        if i==0:reference=solid[3]-solid[1];baseline=solid[3]
        floor=baseline if key=='mooja' and i in (2,3) else solid[3]
        if key=='mooJaMilk':floor=(y1-y)/2
        frames.append(dict(x=x+l,y=y+t,w=r-l,h=b-t,cellX=x,cellY=y,cellW=x1-x,cellH=y1-y,
                           anchorX=centers[i]*(w/1254)-l,anchorY=floor-t))
    atlas[key]=dict(src='assets/'+name,width=w,height=h,cols=4,rows=4,referenceHeight=reference,frames=frames)
    if key=='mooJaMilk':atlas[key]['referenceWidth']=300*(w/1254)
path.write_text(json.dumps(atlas,indent=2)+'\n')
print('Indexed 32 MooJa poses and 16 milk effects.')
