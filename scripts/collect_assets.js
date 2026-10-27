const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('original.html', 'utf-8');
const webflowCss = fs.readFileSync('assets/css/webflow.css', 'utf-8');

const assetUrls = new Set();

// 1. All http/https URLs in html
const matches = html.match(/https?:\/\/[^\s"'<>)]+/g) || [];
matches.forEach(u => assetUrls.add(u));

// 2. All relative or specific filenames mentioned in scripts
const scriptFileMatches = html.match(/[0-9a-f]{20,}_[^\s"'<>]+\.(jpg|jpeg|png|webp|avif|svg|mp4|ttf|woff2?)/gi) || [];
scriptFileMatches.forEach(f => {
  assetUrls.add(`https://cdn.prod.website-files.com/6975cfff770e2487cd056210/${f}`);
  assetUrls.add(`https://cdn.prod.website-files.com/631f74f62fd0270a81ecb845/${f}`);
});

// 3. URLs in webflow.css
const cssMatches = webflowCss.match(/https?:\/\/[^\s"'<>)]+/g) || [];
cssMatches.forEach(u => assetUrls.add(u));

// 4. Video URL
assetUrls.add('https://cdn.prod.website-files.com/6975cfff770e2487cd056210/6ad5139e0020923d27ef6cbe_mayamd-care-loop.mp4');

// 5. Google fonts in html
assetUrls.add('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&display=swap');
assetUrls.add('https://fonts.googleapis.com/css2?family=Sofia+Sans+Condensed:wght@500;600;700;800&family=Sofia+Sans+Semi+Condensed:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

console.log('Total candidate URLs to evaluate:', assetUrls.size);
fs.writeFileSync('scripts/all_candidates.json', JSON.stringify([...assetUrls], null, 2));
