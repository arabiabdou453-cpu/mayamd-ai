const fs = require('fs');
let css = fs.readFileSync('assets/css/webflow.css', 'utf-8');
css = css.replace(/https:\/\/cdn\.prod\.website-files\.com\/6975cfff770e2487cd056210\/6975cfff770e2487cd05629d_Frame%20\(8\)\.svg/g, '../images/Frame_8.svg');
fs.writeFileSync('assets/css/webflow.css', css);
console.log('Replaced Frame (8).svg in webflow.css');
