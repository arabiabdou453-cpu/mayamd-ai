const fs = require('fs');
const path = require('path');

async function downloadCss() {
  const cssUrl = 'https://cdn.prod.website-files.com/6975cfff770e2487cd056210/css/avanzars-awesome-site-1bcacdff3b3539bdf.webflow.shared.dfb65a4e9.css';
  const res = await fetch(cssUrl);
  const text = await res.text();
  fs.mkdirSync('assets/css', { recursive: true });
  fs.writeFileSync('assets/css/webflow.css', text);
  console.log('Downloaded webflow.css, size:', text.length);

  // find any urls inside css
  const urls = [...text.matchAll(/url\((['"]?)(.*?)\1\)/g)].map(m => m[2]);
  console.log('Unique URLs in CSS:', [...new Set(urls)]);
}

downloadCss().catch(console.error);
