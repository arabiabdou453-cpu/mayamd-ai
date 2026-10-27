const { spawn } = require('child_process');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const USER_DATA = path.join(__dirname, '../.chrome-profile-file');

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
    const filePath = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
    console.log('Testing file URL:', filePath);

    const newPageRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${filePath}`, { method: 'PUT' });
    const target = await newPageRes.json();
    const ws = new globalThis.WebSocket(target.webSocketDebuggerUrl);

    await new Promise(r => ws.addEventListener('open', r, { once: true }));
    let msgId = 1;
    const callbacks = new Map();
    const consoleErrors = [];

    ws.addEventListener('message', e => {
      const msg = JSON.parse(e.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg);
        callbacks.delete(msg.id);
      }
      if (msg.method === 'Console.messageAdded' && msg.params.message.level === 'error') {
        consoleErrors.push(msg.params.message.text);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        consoleErrors.push(msg.params.exceptionDetails.text);
      }
    });

    function send(m, p = {}) {
      const id = msgId++;
      return new Promise(res => { callbacks.set(id, res); ws.send(JSON.stringify({ id, method: m, params: p })); });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Console.enable');
    await send('Page.navigate', { url: filePath });

    await new Promise(r => setTimeout(r, 4000));

    console.log('Errors when opening directly as file:/// :');
    console.log(consoleErrors);

    await send('Page.close');
    ws.close();
  } finally {
    chromeProcess.kill();
  }
}

run().catch(console.error);
