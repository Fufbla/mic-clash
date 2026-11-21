"""Index generated alpha bounds and anchors without modifying image pixels."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
path = root / 'dist/assets/atlas.json'
atlas = json.loads(path.read_text())
sets = [
    ('cranes', 'cranes-fighter.png', 4, [165,165,165,165,160,155,165,165,155,155,140,155,155,165,150,155]),
    ('cranesActions', 'cranes-actions.png', 4, [165,165,165,165,165,165,165,165,165,165,165,150,150,160,165,165]),
    ('cranesElevator', 'cranes-elevator.png', 2, None),
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
        floor = baseline if key == 'cranes' and i in (2, 3) else solid[3]
        center = centers[i] * w / 1254 if centers else (l + r) / 2
        frames.append(dict(x=x+l, y=y+t, w=r-l, h=b-t, cellX=x, cellY=y,
                           cellW=x1-x, cellH=y1-y, anchorX=center-l, anchorY=floor-t))
    atlas[key] = dict(src='assets/'+name, width=w, height=h, cols=columns, rows=columns,
                      referenceHeight=reference, frames=frames)
path.write_text(json.dumps(atlas, indent=2)+'\n')
print('Indexed 32 Cranes poses and four elevator states.')
