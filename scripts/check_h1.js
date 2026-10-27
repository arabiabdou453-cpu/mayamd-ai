const { spawn } = require('child_process');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const USER_DATA = path.join(__dirname, '../.chrome-profile-h1');

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

async function checkH1(url) {
  const newPageRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${url}`, { method: 'PUT' });
  const target = await newPageRes.json();
  const ws = new globalThis.WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
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
    return new Promise(r => { callbacks.set(id, r); ws.send(JSON.stringify({ id, method: m, params: p })); });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url });
  await new Promise(r => setTimeout(r, 4000));

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const h1 = document.querySelector('h1');
      return {
        h1Text: h1.innerText,
        h1Width: h1.getBoundingClientRect().width,
        containerWidth: h1.parentElement.getBoundingClientRect().width,
        fontReady: document.fonts.status,
        fontsLoaded: Array.from(document.fonts).map(f => ({ family: f.family, weight: f.weight, status: f.status }))
      };
    })()`,
    returnByValue: true
  });

  await send('Page.close');
  ws.close();
  return res.result.result.value;
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
    console.log('Original:');
    console.log(await checkH1('https://mayamd.ai/'));
    console.log('Clone:');
    console.log(await checkH1('http://127.0.0.1:3000/'));
  } finally {
    chromeProcess.kill();
  }
}

run().catch(console.error);
