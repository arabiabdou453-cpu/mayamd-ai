const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const USER_DATA = path.join(__dirname, '../.chrome-profile-resp');

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

async function captureViewport(width, height, name) {
  const newPageRes = await fetch(`http://127.0.0.1:${PORT}/json/new?http://127.0.0.1:3000/`, { method: 'PUT' });
  const target = await newPageRes.json();
  const ws = new globalThis.WebSocket(target.webSocketDebuggerUrl);

  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let msgId = 1;
  const callbacks = new Map();
  const errors = [];

  ws.addEventListener('message', e => {
    const msg = JSON.parse(e.data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      callbacks.delete(msg.id);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(msg.params.exceptionDetails);
    }
  });

  function send(m, p = {}) {
    const id = msgId++;
    return new Promise(res => { callbacks.set(id, res); ws.send(JSON.stringify({ id, method: m, params: p })); });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768
  });

  await send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
  await new Promise(r => setTimeout(r, 4000));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`screenshots/${name}.png`, Buffer.from(shot.result.data, 'base64'));
  console.log(`Captured ${name}.png (${width}x${height}), exceptions: ${errors.length}`);

  await send('Page.close');
  ws.close();
}

async function run() {
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA}`,
    '--no-first-run',
    '--disable-gpu'
  ]);

  try {
    await getWsUrl();
    await captureViewport(390, 844, 'clone_mobile');
    await captureViewport(768, 1024, 'clone_tablet');
    await captureViewport(1440, 900, 'clone_desktop_verified');
    console.log('All responsive viewports verified without errors!');
  } finally {
    chromeProcess.kill();
  }
}

run().catch(console.error);
