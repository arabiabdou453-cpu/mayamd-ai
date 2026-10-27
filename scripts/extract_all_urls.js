const fs = require('fs');

const html = fs.readFileSync('original.html', 'utf-8');
const allHttp = [...html.matchAll(/https?:\/\/[^\s"'<>)]+/g)].map(m => m[0]);
const cdnFiles = allHttp.filter(u => u.includes('website-files.com') || u.includes('cloudfront.net') || u.includes('mayamd.ai'));
const unique = [...new Set(cdnFiles)];

console.log('Total unique CDN/site URLs:', unique.length);
fs.writeFileSync('scripts/urls.json', JSON.stringify(unique, null, 2));
console.log('Saved to scripts/urls.json');
