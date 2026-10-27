const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const USER_DATA = path.join(__dirname, '../.chrome-profile-comp');

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

async function inspectUrl(targetUrl, screenshotName) {
  const newPageRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${targetUrl}`, { method: 'PUT' });
  const target = await newPageRes.json();
  const ws = new globalThis.WebSocket(target.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  let msgId = 1;
  const callbacks = new Map();
  const consoleMessages = [];

  ws.addEventListener('message', event => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      callbacks.delete(msg.id);
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      consoleMessages.push({ type: msg.params.type, args: msg.params.args.map(a => a.value) });
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
  await send('Console.enable');

  await send('Page.navigate', { url: targetUrl });
  // wait 5s for full load
  await new Promise(r => setTimeout(r, 5000));

  const screenshotRes = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(`screenshots/${screenshotName}`, Buffer.from(screenshotRes.result.data, 'base64'));

  const evalRes = await send('Runtime.evaluate', {
    expression: `({
      title: document.title,
      heading: document.querySelector('h1')?.innerText,
      sectionsCount: document.querySelectorAll('section').length,
      imagesCount: document.querySelectorAll('img').length,
      bandsCount: document.querySelectorAll('.mmx-band').length,
      duoBgCount: document.querySelectorAll('.mmx-duo-bg').length,
      videoCount: document.querySelectorAll('video').length,
      proofCount: document.querySelectorAll('.mmx-proof').length,
      menuPillCount: document.querySelectorAll('.mmx-we').length,
      scrollY: window.scrollY,
      bodyHeight: document.body.scrollHeight
    })`,
    returnByValue: true
  });

  await send('Page.close');
  ws.close();

  return evalRes.result.result.value;
}

async function run() {
  console.log('Launching Headless Chrome for comparison...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,900'
  ], { detached: false });

  try {
    await getWsUrl();
    fs.mkdirSync('screenshots', { recursive: true });

    console.log('Inspecting Original Site (https://mayamd.ai/)...');
    const origMetrics = await inspectUrl('https://mayamd.ai/', 'original_desktop.png');

    console.log('Inspecting Local Clone (http://127.0.0.1:3000/)...');
    const cloneMetrics = await inspectUrl('http://127.0.0.1:3000/', 'clone_desktop.png');

    console.log('\n================ COMPARISON RESULTS ================');
    console.log('Original Site:', origMetrics);
    console.log('Cloned Site:  ', cloneMetrics);
    console.log('====================================================\n');
  } finally {
    chromeProcess.kill();
    console.log('Chrome closed.');
  }
}

run().catch(console.error);
