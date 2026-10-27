const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');

const linkMatches = [...html.matchAll(/<a\b[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi)];
console.log('Total links:', linkMatches.length);
linkMatches.forEach((m, i) => {
  const href = m[1];
  const text = m[2].replace(/<[^>]+>/g, '').trim();
  console.log(`[${i}] "${text}" -> ${href}`);
});
