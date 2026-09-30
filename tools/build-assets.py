"""Prepare landing-page graphics from the Personal Sky app repository.

Copies the Google Play artwork and screenshots into ``assets/`` and resizes
them to sizes that make sense on the web. Run from the repository root:

    python tools/build-assets.py
"""

from pathlib import Path

from PIL import Image

SOURCE = Path(r"D:\VibeCoding\PersonalSky")
TARGET = Path(__file__).resolve().parent.parent / "assets"

SCREENSHOTS = [
    ("01-active-sky", "01-active-sky"),
    ("02-history", "02-history"),
    ("03-archive", "03-archive"),
    ("04-support", "04-support"),
    ("05-goal-settings", "05-goal-settings"),
]

SCREENSHOT_WIDTH = 540
ICON_SIZE = 256
HERO_WIDTH = 1024


def save(source: Path, destination: Path, size: tuple, dpi: tuple = None) -> None:
    with Image.open(source) as image:
        image = image.convert("RGBA")
        resized = image.resize(size, Image.LANCZOS)
        destination.parent.mkdir(parents=True, exist_ok=True)
        resized.save(destination, optimize=True, **({"dpi": dpi} if dpi else {}))
    print(f"{destination.relative_to(TARGET.parent)}  {destination.stat().st_size // 1024} KB")


def main() -> None:
    for source_name, target_name in SCREENSHOTS:
        source = SOURCE / "store-screenshots" / f"{source_name}.png"
        with Image.open(source) as image:
            ratio = SCREENSHOT_WIDTH / image.width
            size = (SCREENSHOT_WIDTH, round(image.height * ratio))
        save(source, TARGET / "screenshots" / f"{target_name}.png", size)

    save(
        SOURCE / "personal_sky_play_icon_512.png",
        TARGET / "app-icon.png",
        (ICON_SIZE, ICON_SIZE),
    )
    save(
        SOURCE / "personal_sky_feature_graphic_1024x500.png",
        TARGET / "hero-sky.png",
        (HERO_WIDTH, round(HERO_WIDTH * 500 / 1024)),
    )


if __name__ == "__main__":
    main()
