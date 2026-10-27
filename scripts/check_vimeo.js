const fs = require('fs');
const html = fs.readFileSync('original.html', 'utf-8');

const vimeoMatches = [...html.matchAll(/(<iframe[^>]*vimeo[^>]*>|<div[^>]*vimeo[\s\S]*?<\/div>)/gi)].map(m => m[0]);
console.log('Vimeo matches count:', vimeoMatches.length);
vimeoMatches.forEach((m, i) => console.log(`--- Match ${i} ---\n`, m.slice(0, 300)));
