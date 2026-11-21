"""Index transparent sprite bounds; preserve the original generated pixels."""
import json
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
path=root/'dist/assets/atlas.json'
atlas=json.loads(path.read_text())
sets=[('smackprince','smack-prince-fighter.png',[156,156,156,156,156,140,156,156,156,148,126,140,158,156,156,165]),
      ('smackPrinceActions','smack-prince-actions.png',[160,160,160,160,160,160,160,160,160,165,158,160,125,144,158,160])]
for key,name,centers in sets:
    im=Image.open(root/'dist/assets'/name);w,h=im.size;alpha=im.getchannel('A');frames=[]
    reference=None
    for i in range(16):
        x,y=(i%4)*w//4,(i//4)*h//4;x1,y1=(i%4+1)*w//4,(i//4+1)*h//4
        a=alpha.crop((x,y,x1,y1));l,t,r,b=a.point(lambda v:255 if v>35 else 0).getbbox()
        solid=a.point(lambda v:255 if v>130 else 0).getbbox()
        if i==0:reference=solid[3]-solid[1];baseline=solid[3]
        floor=baseline if key=='smackprince' and i in (2,3) else solid[3]
        frames.append(dict(x=x+l,y=y+t,w=r-l,h=b-t,cellX=x,cellY=y,cellW=x1-x,cellH=y1-y,
                           anchorX=centers[i]*(w/1254)-l,anchorY=floor-t))
    atlas[key]=dict(src='assets/'+name,width=w,height=h,cols=4,rows=4,referenceHeight=reference,frames=frames)
path.write_text(json.dumps(atlas,indent=2)+'\n')
print('Indexed 32 Smack Prince poses.')
