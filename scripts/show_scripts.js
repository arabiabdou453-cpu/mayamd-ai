const fs = require('fs');
const path = require('path');
const dir = 'assets/custom_scripts';
fs.readdirSync(dir).forEach(file => {
  console.log(`\n=== ${file} ===`);
  console.log(fs.readFileSync(path.join(dir, file), 'utf8'));
});
