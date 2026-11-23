"""Index unchanged transparent generated sprites; preserve all existing atlas entries."""
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ATLAS_PATH = ROOT / "dist/assets/atlas.json"
BASIC_CENTERS = [.5, .5, .5, .5, .48, .43, .48, .5, .46, .43, .4, .43, .46, .5, .48, .5]
SHEETS = [('czr', 'czr-fighter.png', 4, 4, 0), ('shannondull', 'shannondull-fighter.png', 4, 4, 0), ('smokelord', 'smokelord-fighter.png', 4, 4, 0), ('redrolls', 'redrolls-fighter.png', 4, 4, 0), ('czrActions', 'czr-actions.png', 4, 4, 15), ('shannondullActions', 'shannondull-actions.png', 4, 4, 15), ('smokelordActions', 'smokelord-actions.png', 4, 4, 15), ('redrollsActions', 'redrolls-actions.png', 4, 4, 15), ('redrollsSupport', 'redrolls-support.png', 4, 4, 4)]


def index_sheet(key, filename, cols, rows, reference_frame):
    image = Image.open(ROOT / "dist/assets" / filename)
    assert image.mode == "RGBA", f"{filename} must retain true alpha"
    width, height = image.size
    alpha = image.getchannel("A")
    assert alpha.getextrema() == (0, 255), f"{filename} must have transparent pixels"
    frames, solids = [], []
    basic = key in {'shannondull', 'smokelord', 'czr', 'redrolls'}
    for index in range(cols * rows):
        col, row = index % cols, index // cols
        cell_x, cell_y = col * width // cols, row * height // rows
        cell_r, cell_b = (col + 1) * width // cols, (row + 1) * height // rows
        sample_x, sample_r = cell_x, cell_r
        # The KO shoe crosses the nominal boundary, with an empty gutter at917.
        if key == "eynakeast" and index == 14:
            sample_r = round(width * 917 / 1254)
        elif key == "eynakeast" and index == 15:
            sample_x = round(width * 917 / 1254)
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
        if key == 'shannondullActions' and index == 13: center_fraction = .30
        if key == 'smokelordActions' and index in (11,12,13): center_fraction = .32
        center = cell_x + center_fraction * (cell_r - cell_x)
        floor = solid[3]
        if basic and index in (2, 3):
            floor = cell_y + solids[0][3]
        if key == "eynakeastSupport" and index >= 8:
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
    return entry


def main():
    atlas = json.loads(ATLAS_PATH.read_text())
    for sheet in SHEETS:
        atlas[sheet[0]] = index_sheet(*sheet)
    ATLAS_PATH.write_text(json.dumps(atlas, indent=2) + "\n")
    print("Indexed 96 fighter poses, 16 hood/ghost poses, and 8 Travy poses; all PNGs unchanged.")


if __name__ == "__main__":
    main()
