const fs = require('fs');
const path = require('path');

let css = fs.readFileSync('assets/css/webflow.css', 'utf-8');
const urlMap = JSON.parse(fs.readFileSync('scripts/url_map.json', 'utf-8'));

for (const [origUrl, localRel] of Object.entries(urlMap)) {
  const targetRel = localRel.replace(/^assets\//, '../');
  css = css.split(origUrl).join(targetRel);
}

// Check for any remaining cdn.prod.website-files.com in css
const remaining = [...css.matchAll(/https?:\/\/[^\s"'<>)]+/g)].map(m => m[0]);
console.log('Remaining external URLs in webflow.css:', remaining);

fs.writeFileSync('assets/css/webflow.css', css);
console.log('Updated assets/css/webflow.css with local paths.');
