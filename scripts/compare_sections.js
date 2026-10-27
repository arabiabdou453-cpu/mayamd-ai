const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const USER_DATA = path.join(__dirname, '../.chrome-profile-sec');

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

async function getSections(url) {
  const newPageRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${url}`, { method: 'PUT' });
  const target = await newPageRes.json();
  const ws = new globalThis.WebSocket(target.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  let msgId = 1;
  const callbacks = new Map();

  ws.addEventListener('message', event => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      callbacks.delete(msg.id);
    }
  });

  function send(method, params = {}) {
    const id = msgId++;
    return new Promise(resolve => {
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');

  await send('Page.navigate', { url });
  await new Promise(r => setTimeout(r, 4000));

  const evalRes = await send('Runtime.evaluate', {
    expression: `Array.from(document.querySelectorAll('header, section, footer')).map((el, idx) => ({
      index: idx,
      tag: el.tagName,
      className: el.className,
      height: Math.round(el.getBoundingClientRect().height),
      text: el.querySelector('h1, h2, h3, p')?.innerText?.slice(0, 50) || ''
    }))`,
    returnByValue: true
  });

  await send('Page.close');
  ws.close();
  return evalRes.result.result.value;
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
    const orig = await getSections('https://mayamd.ai/');
    const clone = await getSections('http://127.0.0.1:3000/');

    console.log('Original sections count:', orig.length);
    console.log('Clone sections count:', clone.length);

    for (let i = 0; i < Math.max(orig.length, clone.length); i++) {
      const o = orig[i] || {};
      const c = clone[i] || {};
      console.log(`[${i}] ${o.tag || '-'} | Orig: ${o.height}px ("${o.text}") | Clone: ${c.height}px ("${c.text}")`);
    }
  } finally {
    chromeProcess.kill();
  }
}

run().catch(console.error);
