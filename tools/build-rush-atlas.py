"""Index unchanged generated PNGs. No image editing or resampling."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
path = root / 'dist/assets/atlas.json'
atlas = json.loads(path.read_text())
centers = [.5,.5,.5,.5,.44,.4,.44,.5,.44,.43,.4,.43,.45,.49,.46,.5]
for fighter in ('quickfast','sassyt','jminors'):
    sheets = [('',4,4),('Actions',4,4)]
    if fighter != 'quickfast': sheets.append(('Support',2 if fighter == 'sassyt' else 4,2))
    for suffix, cols, rows in sheets:
        name = fighter + '-' + {'':'fighter','Actions':'actions','Support':'support'}[suffix] + '.png'
        im = Image.open(root/'dist/assets'/name)
        w,h = im.size
        alpha = im.getchannel('A')
        frames,solids = [],[]
        for i in range(cols*rows):
            x,y = i%cols*w//cols,i//cols*h//rows
            x1,y1 = (i%cols+1)*w//cols,(i//cols+1)*h//rows
            a = alpha.crop((x,y,x1,y1))
            l,t,r,b = a.point(lambda v:255 if v>35 else 0).getbbox()
            solid = a.point(lambda v:255 if v>130 else 0).getbbox()
            solids.append(solid)
            center = (centers[i] if suffix=='' else .5)*(x1-x)
            floor = solids[0][3] if suffix=='' and i in (2,3) else solid[3]
            if fighter=='quickfast' and suffix=='' and i in (10,11): floor += 28
            if fighter=='jminors' and suffix=='Support' and i==5: center=.35*(x1-x)
            frames.append(dict(x=x+l,y=y+t,w=r-l,h=b-t,cellX=x,cellY=y,cellW=x1-x,cellH=y1-y,anchorX=center-l,anchorY=floor-t))
        ref=solids[15 if suffix=='Actions' else 7 if suffix=='Support' and fighter=='jminors' else 0]
        atlas[fighter+suffix]=dict(src='assets/'+name,width=w,height=h,cols=cols,rows=rows,referenceHeight=ref[3]-ref[1],frames=frames)
path.write_text(json.dumps(atlas,indent=2)+'\n')
print('Indexed 96 fighter poses and 12 companion/effect frames.')
