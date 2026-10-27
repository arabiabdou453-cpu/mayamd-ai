const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../original.html'), 'utf-8');

// Match any <link ...> that has rel="stylesheet"
const linkTags = [...html.matchAll(/<link\s+[^>]*>/gi)].map(m => m[0]);
const stylesheets = [];
for (const tag of linkTags) {
  if (/rel=["']stylesheet["']/i.test(tag)) {
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (hrefMatch) stylesheets.push(hrefMatch[1]);
  }
}

// Match favicon / icons
const icons = [];
for (const tag of linkTags) {
  if (/rel=["'](icon|shortcut icon|apple-touch-icon)["']/i.test(tag)) {
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (hrefMatch) icons.push(hrefMatch[1]);
  }
}

// Match all scripts
const scripts = [...html.matchAll(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);

// Match all images
const imgTags = [...html.matchAll(/<img\s+[^>]*>/gi)].map(m => m[0]);
const images = [];
const srcsets = [];
for (const tag of imgTags) {
  const src = tag.match(/src=["']([^"']+)["']/i);
  if (src) images.push(src[1]);
  const srcset = tag.match(/srcset=["']([^"']+)["']/i);
  if (srcset) {
    const parts = srcset[1].split(',').map(s => s.trim().split(/\s+/)[0]);
    srcsets.push(...parts);
  }
}

// Match all inline styles with url(...)
const cssUrls = [...html.matchAll(/url\((['"]?)(.*?)\1\)/gi)].map(m => m[2]);

console.log('Stylesheets (' + stylesheets.length + '):');
stylesheets.forEach(s => console.log('  -', s));

console.log('\nIcons (' + icons.length + '):');
icons.forEach(i => console.log('  -', i));

console.log('\nScripts (' + scripts.length + '):');
scripts.forEach(s => console.log('  -', s));

console.log('\nImages (' + images.length + '):');
images.forEach(img => console.log('  -', img));

console.log('\nSrcset images (' + srcsets.length + '):');
srcsets.forEach(s => console.log('  -', s));

console.log('\nCSS Urls (' + cssUrls.length + '):');
cssUrls.forEach(u => console.log('  -', u));
