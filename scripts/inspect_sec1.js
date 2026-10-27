const { spawn } = require('child_process');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const USER_DATA = path.join(__dirname, '../.chrome-profile-sec1');

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

async function inspectSec1(url) {
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
      const sec = document.querySelectorAll('section')[0];
      const h1 = sec.querySelector('h1');
      const p = sec.querySelector('p');
      const cs = window.getComputedStyle(h1);
      const pcs = p ? window.getComputedStyle(p) : {};
      return {
        secHeight: sec.getBoundingClientRect().height,
        h1Font: cs.fontFamily,
        h1FontSize: cs.fontSize,
        h1LineHeight: cs.lineHeight,
        h1Height: h1.getBoundingClientRect().height,
        pFont: pcs.fontFamily,
        pFontSize: pcs.fontSize,
        pHeight: p?.getBoundingClientRect().height,
        allChildren: Array.from(sec.children).map(c => ({
          tag: c.tagName,
          className: c.className,
          h: Math.round(c.getBoundingClientRect().height)
        }))
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
    console.log('Original Sec 1:');
    console.log(await inspectSec1('https://mayamd.ai/'));
    console.log('Clone Sec 1:');
    console.log(await inspectSec1('http://127.0.0.1:3000/'));
  } finally {
    chromeProcess.kill();
  }
}

run().catch(console.error);
