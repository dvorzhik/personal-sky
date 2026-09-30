"""Ad-hoc checks for the landing page: styles, assets, links."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = ["index.html", "privacy.html"]
PLAY = "https://play.google.com/store/apps/details?id=com.personalsky.app"
# Ожидаемое число ссылок на Google Play: index.html (кнопка в hero, кнопка в CTA, ссылка в футере, JSON-LD) + privacy.html (футер).
PLAY_COUNTS = {"index.html": 4, "privacy.html": 1}
TRIBUTE = "https://web.tribute.tg/d/QPI"

css = (ROOT / "style.css").read_text(encoding="utf-8")
html_all = "".join((ROOT / p).read_text(encoding="utf-8") for p in PAGES)

used = set()
for value in re.findall(r'class="([^"]+)"', html_all):
    used.update(value.split())
declared = set(re.findall(r"\.(ps-[A-Za-z0-9_-]+)", css))
print("classes used in HTML :", len(used))
print("unstyled classes     :", sorted(used - declared) or "none")

refs = re.findall(r'(?:src|href)="((?!https?:|#|mailto:)[^"]+)"', html_all)
missing = [r for r in sorted(set(refs)) if not (ROOT / r.split("#")[0]).exists()]
print("local references     :", sorted(set(refs)))
print("missing files        :", missing or "none")

for page in PAGES:
    text = (ROOT / page).read_text(encoding="utf-8")
    play = text.count(PLAY)
    play_ok = "ok" if play == PLAY_COUNTS[page] else f"ОЖИДАЛОСЬ {PLAY_COUNTS[page]}"
    print(f"{page}: play link x{play} ({play_ok})", "| privacy link", "privacy.html" in text)
    support = text.count(TRIBUTE)
    print(f"{page}: tribute link x{support}", "| new tab", 'rel="noopener noreferrer"' in text or support == 0)

privacy_text = (ROOT / "privacy.html").read_text(encoding="utf-8")
print("privacy version      :", re.search(r"<strong>Версия:</strong> ([\d.]+)", privacy_text).group(1))
print("privacy effective    :", re.search(r"<strong>Дата вступления в силу:</strong> ([\d.]+)", privacy_text).group(1))
