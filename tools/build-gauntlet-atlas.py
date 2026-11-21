"""Index unchanged generated Gauntlet PNGs without editing or resampling pixels.

The two hand-tuned sample boundaries lie in transparent gutters. They preserve
the complete DJ KO pose and car, which extend beyond a nominal equal grid cell.
"""
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ATLAS_PATH = ROOT / "dist/assets/atlas.json"
BASIC_CENTERS = [.5, .5, .5, .5, .48, .43, .48, .5, .46, .43, .4, .43, .46, .5, .48, .5]
SHEETS = [
    ("bigmumble", "bigmumble-fighter.png", 4, 4, 0),
    ("bigmumbleActions", "bigmumble-actions.png", 4, 4, 15),
    ("djbeigey", "djbeigey-fighter.png", 4, 4, 0),
    ("djbeigeyActions", "djbeigey-actions.png", 4, 4, 15),
    ("nobuttons", "nobuttons-fighter.png", 4, 4, 0),
    ("nobuttonsActions", "nobuttons-actions.png", 4, 4, 15),
    ("gauntletProps", "gauntlet-props.png", 2, 2, 0),
    ("nobuttonsCrew", "nobuttons-crew.png", 4, 4, 2),
]


def index_sheet(key, filename, cols, rows, reference_frame):
    image = Image.open(ROOT / "dist/assets" / filename)
    assert image.mode == "RGBA", f"{filename} must retain true alpha"
    width, height = image.size
    alpha = image.getchannel("A")
    assert alpha.getextrema() == (0, 255), f"{filename} must have transparent pixels"
    frames, solids = [], []
    basic = key in {"bigmumble", "djbeigey", "nobuttons"}
    for index in range(cols * rows):
        col, row = index % cols, index // cols
        cell_x, cell_y = col * width // cols, row * height // rows
        cell_r, cell_b = (col + 1) * width // cols, (row + 1) * height // rows
        sample_x, sample_r = cell_x, cell_r
        if key == "djbeigey" and index == 14:
            sample_r = round(width * 917 / 1254)
        elif key == "djbeigey" and index == 15:
            sample_x = round(width * 917 / 1254)
        elif key == "gauntletProps" and index == 2:
            sample_r = round(width * 600 / 1254)
        elif key == "gauntletProps" and index == 3:
            sample_x = round(width * 600 / 1254)
        region = alpha.crop((sample_x, cell_y, sample_r, cell_b))
        bounds = region.point(lambda value: 255 if value > 35 else 0).getbbox()
        solid = region.point(lambda value: 255 if value > 130 else 0).getbbox()
        assert bounds and solid, f"{filename} frame {index} is empty"
        left, top, right, bottom = bounds
        # Store world-free pixel coordinates so crop metadata can cross the
        # conceptual cell boundary without introducing clipping or image edits.
        solid = (sample_x + solid[0], cell_y + solid[1], sample_x + solid[2], cell_y + solid[3])
        solids.append(solid)
        center_fraction = BASIC_CENTERS[index] if basic else .5
        if key == "nobuttonsActions" and index == 11:
            center_fraction = .45
        center = cell_x + center_fraction * (cell_r - cell_x)
        floor = solid[3]
        if basic and index in (2, 3):
            floor = cell_y + solids[0][3]
        if key == "gauntletProps":
            center = sample_x + (left + right) / 2
        frames.append({
            "x": sample_x + left,
            "y": cell_y + top,
            "w": right - left,
            "h": bottom - top,
            "cellX": sample_x,
            "cellY": cell_y,
            "cellW": sample_r - sample_x,
            "cellH": cell_b - cell_y,
            "anchorX": center - sample_x - left,
            "anchorY": floor - cell_y - top,
        })
    ref = solids[reference_frame]
    entry = {
        "src": "assets/" + filename,
        "width": width,
        "height": height,
        "cols": cols,
        "rows": rows,
        "referenceHeight": ref[3] - ref[1],
        "frames": frames,
    }
    if key == "nobuttonsCrew":
        entry["rowReferenceHeights"] = [solids[row * cols + 2][3] - solids[row * cols + 2][1] for row in range(rows)]
        entry["rowNames"] = ["Yellow Hoodie", "Rugby", "Polo", "Black Hoodie"]
    return entry


def main():
    atlas = json.loads(ATLAS_PATH.read_text())
    for sheet in SHEETS:
        atlas[sheet[0]] = index_sheet(*sheet)
    ATLAS_PATH.write_text(json.dumps(atlas, indent=2) + "\n")
    print("Indexed 96 fighter poses, 16 crew poses, and 4 props; all PNGs unchanged.")


if __name__ == "__main__":
    main()
