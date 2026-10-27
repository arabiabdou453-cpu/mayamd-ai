const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.includes('gstatic.com')) {
    console.log(`Line ${i+1}: ${l}`);
  }
});
