const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const USER_DATA = path.join(__dirname, '../.chrome-profile');

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
  console.log('Launching Headless Chrome...');
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
    const wsUrl = await getWsUrl();
    console.log('Connected to CDP at:', wsUrl);

    // Create a new target / page
    const newPageRes = await fetch(`http://127.0.0.1:${PORT}/json/new?http://127.0.0.1:3000/`, { method: 'PUT' });
    const target = await newPageRes.json();
    console.log('Created tab target:', target.id);

    const ws = new globalThis.WebSocket(target.webSocketDebuggerUrl);

    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
    console.log('Target WebSocket opened!');

    let msgId = 1;
    const callbacks = new Map();
    const consoleMessages = [];
    const failedRequests = [];

    ws.addEventListener('message', event => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg);
        callbacks.delete(msg.id);
      }
      if (msg.method === 'Console.messageAdded') {
        consoleMessages.push(msg.params.message);
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        consoleMessages.push({ type: msg.params.type, args: msg.params.args.map(a => a.value) });
      }
      if (msg.method === 'Network.loadingFailed') {
        failedRequests.push(msg.params);
      }
      if (msg.method === 'Network.responseReceived') {
        if (msg.params.response.status >= 400) {
          failedRequests.push({ url: msg.params.response.url, status: msg.params.response.status });
        }
      }
    });

    function send(method, params = {}) {
      const id = msgId++;
      return new Promise(resolve => {
        callbacks.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    // Enable domains
    await send('Network.enable');
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Console.enable');

    console.log('Navigating to http://127.0.0.1:3000/ ...');
    await send('Page.navigate', { url: 'http://127.0.0.1:3000/' });

    // Wait 5 seconds for scripts, layout, video, animations to initialize
    await new Promise(r => setTimeout(r, 5000));

    // Capture screenshot
    console.log('Capturing clone screenshot...');
    const screenshotRes = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.mkdirSync('screenshots', { recursive: true });
    fs.writeFileSync('screenshots/clone_desktop.png', Buffer.from(screenshotRes.result.data, 'base64'));
    console.log('Saved screenshots/clone_desktop.png');

    // Get page title and document metrics
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
        menuPillCount: document.querySelectorAll('.mmx-we').length
      })`,
      returnByValue: true
    });

    console.log('\nPage Inspection Results:');
    console.log(evalRes.result.result.value);

    console.log('\nConsole messages count:', consoleMessages.length);
    consoleMessages.forEach(m => console.log('  [Console]', JSON.stringify(m)));

    console.log('\nFailed requests count:', failedRequests.length);
    failedRequests.forEach(f => console.log('  [Failed Network]', JSON.stringify(f)));

    // Close page and disconnect
    await send('Page.close');
    ws.close();
  } finally {
    chromeProcess.kill();
    console.log('Chrome closed.');
  }
}

run().catch(console.error);
