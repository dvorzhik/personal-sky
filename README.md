# Personal Sky — страницы приложения «Личный небосвод»

Статические страницы Android-приложения **Personal Sky** («Личный небосвод») — локального трекера привычек.

## Файлы

- `index.html` — описание приложения: hero-блок, экраны приложения, возможности, приватность, призыв к установке.
- `privacy.html` — политика конфиденциальности (версия 1.1 от 20.09.2026).
- `style.css` — общие стили в тёмной AMOLED-теме, включая анимированное звёздное небо.
- `assets/` — графика лендинга: `app-icon.png`, `hero-sky.png`, `assets/screenshots/*.png`.
- `tools/build-assets.py` — скрипт подготовки графики из репозитория приложения `PersonalSky`.

## Графика

Иконка, feature graphic и скриншоты берутся из репозитория приложения `D:\VibeCoding\PersonalSky`
(`personal_sky_play_icon_512.png`, `personal_sky_feature_graphic_1024x500.png`, `store-screenshots/`)
и уменьшаются до веб-размеров. Если исходники обновились, пересоберите `assets/`:

```bash
python tools/build-assets.py
```

Скриншоты в `assets/screenshots/` имеют ширину 540 px — этого достаточно для карусели
и для retina (карточка показывается шириной около 254 px). Итоговый вес всей графики — менее 1 МБ.

## Инструменты

- `tools/build-assets.py` — подготовка графики (Pillow) из репозитория приложения.
- `tools/check-page.py` — проверка стилей, ссылок (Google Play, поддержка через Tribute) и локальных файлов страниц.
- `tools/check-responsive.mjs` — проверка вёрстки в реальном Chrome (overflow, битые картинки) на ширинах 360/390/768/1440.
- `tools/screenshot.mjs` — снимок полной страницы через CDP (`node tools/screenshot.mjs <url> <out.png> [width]`).

Проверка вёрстки требует запущенного Chrome с отладочным портом и локального сервера:

```bash
python -m http.server 8765 --bind 127.0.0.1
chrome --headless=new --remote-debugging-port=9222 --user-data-dir=%TEMP%\ps-cdp
node tools/check-responsive.mjs http://127.0.0.1:8765/index.html
```

## Локальный просмотр

Просто откройте `index.html` в браузере — страницы самодостаточны и не требуют сборки.

## Публикация

Сайт опубликован через GitHub Pages и доступен по двум адресам (кастомный домен `www.dvorzhik.ru` привязан к GitHub Pages через `CNAME` в репозитории `dvorzhik.github.io`):

- `https://www.dvorzhik.ru/personal-sky/` — описание приложения
- `https://www.dvorzhik.ru/personal-sky/privacy.html` — политика конфиденциальности

Дублирующие адреса на `github.io`:

- `https://dvorzhik.github.io/personal-sky/`
- `https://dvorzhik.github.io/personal-sky/privacy.html`

Настройка Pages: **Settings → Pages → Source: Deploy from a branch → `main` / `root`**.

Ссылку на `privacy.html` можно указывать в карточке приложения в Google Play.

## Важно

Это единственный источник текстов о приложении. Ранее описание и политика дублировались
в секциях `#personalsky` и `#personalsky_privacy` лендинга
[vibecoding](https://github.com/dvorzhik/vibecoding) — они удалены, лендинг ссылается на этот сайт.
Правки текстов вносятся только здесь.

## Контакты

По вопросам работы приложения и конфиденциальности: personal-sky@dvorzhik.ru
