const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
const lines = html.split('\n');
for (let i = 0; i < 40; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
