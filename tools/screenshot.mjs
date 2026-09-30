// Снимок полной страницы через CDP: node tools/screenshot.mjs <url> <out.png> [width]
// Требуется запущенный Chrome с --remote-debugging-port=9222.

const CDP_PORT = process.env.CDP_PORT || 9222;
const url = process.argv[2] || "http://127.0.0.1:8765/index.html";
const output = process.argv[3] || "page.png";
const width = Number(process.argv[4] || 1440);
import { writeFileSync } from "node:fs";

const HEIGHT = Number(process.env.SHOT_HEIGHT || 1000);

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
  await send(socket, ++id, "Emulation.setDeviceMetricsOverride", {
    width,
    height: HEIGHT,
    deviceScaleFactor: 1,
    mobile: width < 700,
  });
  await send(socket, ++id, "Page.navigate", { url });
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Прокручиваем страницу, чтобы подгрузились lazy-картинки, и возвращаемся наверх.
  await send(socket, ++id, "Runtime.evaluate", {
    expression: "window.scrollTo(0, document.documentElement.scrollHeight)",
  });
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await send(socket, ++id, "Runtime.evaluate", { expression: "window.scrollTo(0, 0)" });
  await new Promise((resolve) => setTimeout(resolve, 500));

  const shot = await send(socket, ++id, "Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
  });
  writeFileSync(output, Buffer.from(shot.data, "base64"));
  console.log(`saved ${output} (${width}px wide, full page)`);

  socket.close();
  await fetch(`http://127.0.0.1:${CDP_PORT}/json/close/${target.id}`);
}

main().catch((error) => {
  console.error("screenshot failed:", error.message);
  process.exit(1);
});
