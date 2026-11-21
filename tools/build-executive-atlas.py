"""Measure generated PNG alpha bounds; never change the source artwork pixels."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
path = root / 'dist/assets/atlas.json'
atlas = json.loads(path.read_text())
basic_centers = [.5,.5,.5,.5,.44,.4,.44,.5,.43,.43,.4,.43,.45,.49,.46,.5]
for fighter in ('president', 'owhinny', 'roboking'):
    for suffix, columns, rows in (('',4,4), ('Actions',4,4), ('Support',2 if fighter == 'owhinny' else 4,2)):
        name = f'{fighter}-' + {'':'fighter', 'Actions':'actions', 'Support':'support'}[suffix] + '.png'
        im = Image.open(root / 'dist/assets' / name)
        w, h = im.size
        alpha, frames, solids = im.getchannel('A'), [], []
        for i in range(columns * rows):
            x, y = i % columns * w // columns, i // columns * h // rows
            x1, y1 = (i % columns + 1) * w // columns, (i // columns + 1) * h // rows
            a = alpha.crop((x,y,x1,y1))
            l,t,r,b = a.point(lambda v: 255 if v > 35 else 0).getbbox()
            solid = a.point(lambda v: 255 if v > 130 else 0).getbbox()
            solids.append(solid)
            center = (basic_centers[i] if suffix == '' else .5) * (x1-x)
            floor = solids[0][3] if suffix == '' and i in (2,3) else solid[3]
            frames.append(dict(x=x+l,y=y+t,w=r-l,h=b-t,cellX=x,cellY=y,cellW=x1-x,cellH=y1-y,
                               anchorX=center-l,anchorY=floor-t))
        ref = solids[15 if suffix == 'Actions' else 0]
        atlas[fighter+suffix] = dict(src='assets/'+name,width=w,height=h,cols=columns,rows=rows,
                                     referenceHeight=ref[3]-ref[1],frames=frames)
path.write_text(json.dumps(atlas,indent=2)+'\n')
print('Indexed 96 fighter poses and 20 companion/effect frames.')
