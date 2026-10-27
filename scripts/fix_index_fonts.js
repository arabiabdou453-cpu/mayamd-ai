const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// Insert fonts.css right before webflow.css
if (!html.includes('assets/css/fonts.css')) {
  html = html.replace(
    '<link href="assets/css/webflow.css"',
    '<link href="assets/css/fonts.css" rel="stylesheet" type="text/css"/>\n<link href="assets/css/webflow.css"'
  );
}

// Remove remaining preconnect to gstatic
html = html.replace('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>', '');

fs.writeFileSync('index.html', html);
console.log('Fixed index.html: added fonts.css link and removed gstatic preconnect.');
