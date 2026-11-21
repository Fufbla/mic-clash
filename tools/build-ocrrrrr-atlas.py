"""Index generated alpha bounds and anchors; preserve the source PNG pixels."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
path = root / 'dist/assets/atlas.json'
atlas = json.loads(path.read_text())
sets = [
    ('ocrrrrr', 'ocrrrrr-fighter.png', 4, [160,160,160,160,155,150,160,160,155,145,135,145,150,160,155,155]),
    ('ocrrrrrActions', 'ocrrrrr-actions.png', 4, [160]*8 + [155,155,145,145,145,145,155,160]),
    ('ocrrrrrNails', 'ocrrrrr-nails.png', 2, None),
]
for key, name, columns, centers in sets:
    im = Image.open(root / 'dist/assets' / name)
    w, h = im.size
    alpha, frames = im.getchannel('A'), []
    for i in range(columns * columns):
        x, y = (i % columns) * w // columns, (i // columns) * h // columns
        x1, y1 = (i % columns + 1) * w // columns, (i // columns + 1) * h // columns
        a = alpha.crop((x, y, x1, y1))
        l, t, r, b = a.point(lambda v: 255 if v > 35 else 0).getbbox()
        solid = a.point(lambda v: 255 if v > 130 else 0).getbbox()
        if i == 0:
            reference, baseline = solid[3] - solid[1], solid[3]
        floor = baseline if key == 'ocrrrrr' and i in (2, 3) else solid[3]
        center = centers[i] if centers else l
        frames.append(dict(x=x+l, y=y+t, w=r-l, h=b-t, cellX=x, cellY=y,
                           cellW=x1-x, cellH=y1-y, anchorX=center-l,
                           anchorY=floor-t if centers else (b-t)/2))
    atlas[key] = dict(src='assets/'+name, width=w, height=h, cols=columns, rows=columns,
                      referenceHeight=reference, frames=frames)
path.write_text(json.dumps(atlas, indent=2)+'\n')
print('Indexed 32 Ocrrrrr! poses and four nail effects.')
print('Thrust frame:', atlas['ocrrrrrActions']['frames'][11])
print('Action height:', atlas['ocrrrrrActions']['referenceHeight'])
