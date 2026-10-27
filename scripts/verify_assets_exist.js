const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('index.html', 'utf-8');

// Find all src="assets/..." and href="assets/..."
const assetMatches = [...html.matchAll(/(?:src|href)=["'](assets\/[^"']+)["']/g)].map(m => m[1]);

// Also check background image paths or references to assets/
const otherMatches = [...html.matchAll(/assets\/[a-zA-Z0-9_\-\.\/]+/g)].map(m => m[0]);

const allAssets = [...new Set([...assetMatches, ...otherMatches])];

let missing = 0;
let ok = 0;

for (const a of allAssets) {
  // strip query or hash
  const clean = a.split('?')[0].split('#')[0];
  if (fs.existsSync(clean)) {
    const size = fs.statSync(clean).size;
    if (size > 0) {
      ok++;
    } else {
      console.error(`EMPTY FILE (0 bytes): ${clean}`);
      missing++;
    }
  } else {
    console.error(`MISSING FILE: ${clean}`);
    missing++;
  }
}

console.log(`Assets verification complete: ${ok} valid files found, ${missing} missing/empty.`);
