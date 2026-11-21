"""Index generated transparent sprite cells without changing their pixels."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
path = root / 'dist/assets/atlas.json'
atlas = json.loads(path.read_text())
sets = [
    ('demon', 'demon-fighter.png', [156,156,156,156,150,135,150,156,150,145,125,145,150,156,150,156]),
    ('demonActions', 'demon-actions.png', [156]*8 + [145,125,125,156,156,156,156,156]),
    ('demonCrew', 'demon-crew.png', [156,156,156,156,156,156,156,156,145,135,150,156,135,115,140,156]),
]
for key, name, centers in sets:
    im = Image.open(root / 'dist/assets' / name)
    w, h = im.size
    alpha, frames = im.getchannel('A'), []
    for i in range(16):
        x, y = (i % 4) * w // 4, (i // 4) * h // 4
        x1, y1 = (i % 4 + 1) * w // 4, (i // 4 + 1) * h // 4
        a = alpha.crop((x, y, x1, y1))
        bounds = a.point(lambda v: 255 if v > 35 else 0).getbbox()
        assert bounds, (name, i)
        l, t, r, b = bounds
        solid = a.point(lambda v: 255 if v > 130 else 0).getbbox()
        if i == 0:
            reference, baseline = solid[3] - solid[1], solid[3]
        if key == 'demonCrew' and i == 11:
            reference = solid[3] - solid[1]
        floor = baseline if key == 'demon' and i in (2, 3) else solid[3]
        frames.append(dict(x=x+l, y=y+t, w=r-l, h=b-t, cellX=x, cellY=y,
                           cellW=x1-x, cellH=y1-y, anchorX=centers[i]*w/1254-l, anchorY=floor-t))
    atlas[key] = dict(src='assets/'+name, width=w, height=h, cols=4, rows=4,
                      referenceHeight=reference, frames=frames)
path.write_text(json.dumps(atlas, indent=2)+'\n')
print('Indexed 32 Demon poses and 16 masked crew poses.')
