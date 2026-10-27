const fs = require('fs');
const html = fs.readFileSync('original.html', 'utf-8');

const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = regex.exec(html)) !== null) {
  const code = match[1];
  if (code.includes('mmx-band') || code.includes('img') || code.includes('cdn.prod.website-files.com')) {
    console.log(`\n=================== SCRIPT ${count++} ===================`);
    console.log(code.trim());
  }
}
