"""Index the generated lossless atlas without modifying image pixels."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
image = Image.open(root / 'dist/assets/cant-rap-hd.png')
width, height = image.size
atlas_path = root / 'dist/assets/atlas.json'
atlas = json.loads(atlas_path.read_text())
# Body anchors keep extended hands/feet from moving the entire fighter sideways.
body_centers = [156, 155, 155, 152, 147, 134, 154, 144,
                155, 134, 110, 125, 142, 145, 144, 143]
frames = []
for index in range(16):
    x0, y0 = (index % 4) * width // 4, (index // 4) * height // 4
    x1, y1 = (index % 4 + 1) * width // 4, (index // 4 + 1) * height // 4
    alpha = image.getchannel('A').crop((x0, y0, x1, y1))
    left, top, right, bottom = alpha.point(lambda a: 255 if a > 35 else 0).getbbox()
    # The jump is a compact airborne pose; retain the standing floor anchor.
    baseline = 308 if index == 3 else alpha.point(lambda a: 255 if a > 130 else 0).getbbox()[3]
    frames.append(dict(x=x0+left, y=y0+top, w=right-left, h=bottom-top,
                       cellX=x0, cellY=y0, cellW=x1-x0, cellH=y1-y0,
                       anchorX=body_centers[index]-left, anchorY=baseline-top))
atlas['cantrap'] = dict(src='assets/cant-rap-hd.png', width=width, height=height,
                        cols=4, rows=4, alphaThreshold=35, referenceHeight=299, frames=frames)
atlas_path.write_text(json.dumps(atlas, indent=2) + '\n')
print(f'Indexed {len(frames)} Can’t Rap frames from {width}×{height} lossless atlas')
