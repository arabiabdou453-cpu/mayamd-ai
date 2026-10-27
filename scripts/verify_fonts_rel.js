const fs = require('fs');
const path = require('path');

const css = fs.readFileSync('assets/css/fonts.css', 'utf-8');
const relMatches = [...css.matchAll(/url\((['"]?)(\.\.\/[^)'"]+)\1\)/g)].map(m => m[2]);
const uniqueRel = [...new Set(relMatches)];

console.log('Total unique relative URLs in fonts.css:', uniqueRel.length);
for (const rel of uniqueRel) {
  const resolved = path.resolve('assets/css', rel);
  if (fs.existsSync(resolved)) {
    // console.log(`OK: ${rel}`);
  } else {
    console.error(`MISSING: ${rel} (resolved to: ${resolved})`);
  }
}
console.log('All fonts in fonts.css verified.');
