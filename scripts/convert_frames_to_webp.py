from pathlib import Path
from PIL import Image

BASE = Path(__file__).resolve().parent.parent
INPUT_DIR = BASE / "public" / "output_frames"
OUTPUT_DIR = BASE / "public" / "output_frames_webp"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

for image_path in sorted(INPUT_DIR.glob("*.png")):
    with Image.open(image_path) as image:
        output_path = OUTPUT_DIR / f"{image_path.stem}.webp"
        image.convert("RGB").save(output_path, format="WEBP", quality=82, method=6)

print(f"Converted {len(list(OUTPUT_DIR.glob('*.webp')))} WebP frames to {OUTPUT_DIR}")
