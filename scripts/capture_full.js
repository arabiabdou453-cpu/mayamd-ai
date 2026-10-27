const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const USER_DATA = path.join(__dirname, '../.chrome-profile-full');

async function getWsUrl() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) {
        const json = await res.json();
        return json.webSocketDebuggerUrl;
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('Chrome did not start debugging endpoint in time');
}

async function captureFullPage(url, outName) {
  const newPageRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${url}`, { method: 'PUT' });
  const target = await newPageRes.json();
  const ws = new globalThis.WebSocket(target.webSocketDebuggerUrl);

  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let msgId = 1;
  const callbacks = new Map();
  ws.addEventListener('message', e => {
    const msg = JSON.parse(e.data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      callbacks.delete(msg.id);
    }
  });

  function send(m, p = {}) {
    const id = msgId++;
    return new Promise(res => { callbacks.set(id, res); ws.send(JSON.stringify({ id, method: m, params: p })); });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url });

  // Scroll through page to trigger all IntersectionObservers and lazy loads
  await new Promise(r => setTimeout(r, 2000));
  await send('Runtime.evaluate', {
    expression: `(async () => {
      const distance = 600;
      while (window.scrollY + window.innerHeight < document.body.scrollHeight) {
        window.scrollBy(0, distance);
        await new Promise(res => setTimeout(res, 100));
      }
      window.scrollTo(0, 0);
    })()`,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 2000));

  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(`screenshots/${outName}`, Buffer.from(shot.result.data, 'base64'));
  console.log(`Saved full page: screenshots/${outName}`);

  await send('Page.close');
  ws.close();
}

async function run() {
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA}`,
    '--no-first-run',
    '--disable-gpu',
    '--window-size=1440,900'
  ]);

  try {
    await getWsUrl();
    await captureFullPage('https://mayamd.ai/', 'full_original.png');
    await captureFullPage('http://127.0.0.1:3000/', 'full_clone.png');
  } finally {
    chromeProcess.kill();
  }
}

run().catch(console.error);
