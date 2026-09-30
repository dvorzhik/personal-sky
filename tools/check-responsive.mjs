// Проверка вёрстки через Chrome DevTools Protocol: горизонтальный overflow и размеры.
// Запуск: node tools/check-responsive.mjs [url]
// Требуется запущенный Chrome с --remote-debugging-port=9222.

const CDP_PORT = process.env.CDP_PORT || 9222;
const URL_TO_CHECK = process.argv[2] || "http://127.0.0.1:8765/index.html";
const VIEWPORTS = [
  { name: "mobile-360", width: 360, height: 780 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

async function listTargets() {
  const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
  return res.json();
}

async function createTarget() {
  const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: "PUT" });
  return res.json();
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl);
    socket.onopen = () => resolve(socket);
    socket.onerror = reject;
  });
}

function send(socket, id, method, params = {}) {
  return new Promise((resolve) => {
    const onMessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== id) return;
      socket.removeEventListener("message", onMessage);
      resolve(message.result);
    };
    socket.addEventListener("message", onMessage);
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  const target = await createTarget();
  const socket = await connect(target.webSocketDebuggerUrl);
  let id = 0;

  await send(socket, ++id, "Page.enable");
  await send(socket, ++id, "Runtime.enable");

  for (const viewport of VIEWPORTS) {
    await send(socket, ++id, "Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.width < 700,
    });
    await send(socket, ++id, "Page.navigate", { url: URL_TO_CHECK });
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const expression = `(() => {
      const de = document.documentElement;
      const limit = de.clientWidth;
      // Декоративные слои (звёздное небо) и карусель имеют собственный overflow/скролл,
      // поэтому из отчёта об overflow их исключаем.
      const allowed = (el) => el.closest('.ps-sky, .ps-shots');
      const offenders = [...document.querySelectorAll('html, body, body *')]
        .filter((el) => !allowed(el))
        .filter((el) => el.scrollWidth > limit + 1 || el.getBoundingClientRect().right > limit + 1)
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return el.tagName.toLowerCase() + '.' + String(el.className).slice(0, 32) +
            ' [scroll=' + el.scrollWidth + ' right=' + Math.round(rect.right) + ' w=' + Math.round(rect.width) + ']';
        });
      const shots = document.querySelector('.ps-shots');
      return JSON.stringify({
        viewport: de.clientWidth,
        bodyScroll: document.body.scrollWidth,
        scrollWidth: de.scrollWidth,
        docHeight: de.scrollHeight,
        shotsScrollable: shots ? shots.scrollWidth > shots.clientWidth : null,
        images: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src.split('/').pop()),
        pendingImages: [...document.images].filter((i) => !i.complete).map((i) => i.src.split('/').pop()),
        offenders: [...new Set(offenders)].slice(0, 8),
      });
    })()`;

    const result = await send(socket, ++id, "Runtime.evaluate", { expression, returnByValue: true });
    const data = JSON.parse(result.result.value);
    const ok = data.scrollWidth <= data.viewport + 1 && data.images.length === 0;
    console.log(
      `${ok ? "OK  " : "FAIL"} ${viewport.name.padEnd(13)} viewport=${data.viewport} scrollWidth=${data.scrollWidth} ` +
        `bodyScroll=${data.bodyScroll} height=${data.docHeight} galleryScroll=${data.shotsScrollable} brokenImages=${data.images.length}` +
        (data.pendingImages.length ? `\n      lazy/pending: ${data.pendingImages.join(", ")}` : "") +
        (data.offenders.length ? `\n      overflowing: ${data.offenders.join(", ")}` : "")
    );
  }

  socket.close();
  await fetch(`http://127.0.0.1:${CDP_PORT}/json/close/${target.id}`);
}

main().catch((error) => {
  console.error("check failed:", error.message);
  process.exit(1);
});
