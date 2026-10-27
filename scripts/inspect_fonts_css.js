const fs = require('fs');
const css = fs.readFileSync('assets/css/fonts.css', 'utf-8');
console.log('fonts.css length:', css.length);
console.log('first 500 chars:\n', css.slice(0, 500));
