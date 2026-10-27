const { spawn } = require('child_process');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const USER_DATA = path.join(__dirname, '../.chrome-profile-allpages');

const pages = [
  '',
  'transitions-of-care',
  'asc-outpatient',
  'remote-care',
  'maya-engine',
  'for-physicians',
  'for-patients',
  'resources-hub',
  'about-us',
  'contact-us',
  'whatelse'
];

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

async function testPage(wsUrl, pageName) {
  const url = `http://127.0.0.1:3000/${pageName}`;
  const newPageRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${url}`, { method: 'PUT' });
  const target = await newPageRes.json();
  const ws = new globalThis.WebSocket(target.webSocketDebuggerUrl);

  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let msgId = 1;
  const callbacks = new Map();
  const errors = [];
  const networkFails = [];

  ws.addEventListener('message', e => {
    const msg = JSON.parse(e.data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      callbacks.delete(msg.id);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(msg.params.exceptionDetails.text);
    }
    if (msg.method === 'Network.responseReceived' && msg.params.response.status >= 400) {
      networkFails.push({ url: msg.params.response.url, status: msg.params.response.status });
    }
  });

  function send(m, p = {}) {
    const id = msgId++;
    return new Promise(res => { callbacks.set(id, res); ws.send(JSON.stringify({ id, method: m, params: p })); });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  await send('Page.navigate', { url });
  await new Promise(r => setTimeout(r, 2000));

  await send('Page.close');
  ws.close();

  return { errors, networkFails };
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
    const wsUrl = await getWsUrl();
    let totalErrors = 0;
    let totalFails = 0;

    for (const p of pages) {
      const result = await testPage(wsUrl, p);
      console.log(`Page /${p || 'home'}: JS Exceptions: ${result.errors.length}, 4xx/5xx: ${result.networkFails.length}`);
      if (result.errors.length > 0) {
        console.error('  Exceptions:', result.errors);
        totalErrors += result.errors.length;
      }
      if (result.networkFails.length > 0) {
        console.error('  Fails:', result.networkFails);
        totalFails += result.networkFails.length;
      }
    }

    console.log(`\nAll 11 pages checked! Total JS exceptions: ${totalErrors}, Total network fails: ${totalFails}`);
  } finally {
    chromeProcess.kill();
  }
}

run().catch(console.error);
