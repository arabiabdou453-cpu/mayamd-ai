const fs = require('fs');
const path = require('path');

const pages = [
  'transitions-of-care',
  'asc-outpatient',
  'remote-care',
  'maya-engine',
  'for-physicians',
  'for-patients',
  'resources-hub',
  'about-us',
  'contact-us',
  'whatelse',
  'privacy-policy',
  'user-agreement'
];

async function downloadAllPages() {
  fs.mkdirSync('pages_raw', { recursive: true });
  for (const p of pages) {
    const url = `https://mayamd.ai/${p}`;
    console.log(`Downloading ${url}...`);
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (res.ok) {
        const text = await res.text();
        fs.writeFileSync(path.join('pages_raw', `${p}.html`), text);
        console.log(`Saved ${p}.html (${text.length} bytes)`);
      } else {
        console.warn(`Failed ${p}: ${res.status}`);
      }
    } catch (e) {
      console.error(`Error ${p}: ${e.message}`);
    }
  }
}

downloadAllPages().catch(console.error);
