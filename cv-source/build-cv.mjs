// Regenerates public/cv/Paul-Anthony-Pancho-CV.pdf from cv-source/cv.html using
// headless Chrome. Run from the portfolio-next folder:  node cv-source/build-cv.mjs
// Edit cv.html first; the script warns if the CV no longer fits on one A4 page.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const input = path.join(here, "cv.html");
const output = path.join(here, "..", "public", "cv", "Paul-Anthony-Pancho-CV.pdf");
const chrome = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

const port = 9200 + Math.floor(Math.random() * 500);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cv-chrome-"));
const proc = spawn(chrome, ["--headless=new", "--allow-file-access-from-files", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(200);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === "page"); } catch {}
  }
  if (!target) throw new Error("Could not start Chrome. Set CHROME_PATH to your Chrome executable.");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) pending.get(d.id)(d.result); };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;

  await send("Page.navigate", { url: pathToFileURL(input).href });
  await sleep(3000);
  await evaluate("document.fonts.ready.then(() => true)");
  const heightMm = await evaluate("Math.round(document.querySelector('.page').scrollHeight / 96 * 25.4)");
  if (heightMm > 297) console.warn(`Warning: the CV is ${heightMm}mm tall, more than one A4 page (297mm).`);

  const { data } = await send("Page.printToPDF", { printBackground: true, preferCSSPageSize: true, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0 });
  fs.writeFileSync(output, Buffer.from(data, "base64"));
  console.log(`Wrote ${path.relative(process.cwd(), output)} (${heightMm}mm tall)`);
  ws.close();
} finally {
  proc.kill();
}
