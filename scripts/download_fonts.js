const fs = require('fs');
const path = require('path');

const fontCssUrls = [
  'https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Sofia+Sans+Condensed:wght@500;600;700;800&family=Sofia+Sans+Semi+Condensed:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap',
  'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap'
];

async function downloadFonts() {
  let combinedCss = '';
  for (let i = 0; i < fontCssUrls.length; i++) {
    const url = fontCssUrls[i];
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    let css = await res.text();

    // Find all font files
    const fontUrls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^\)]+)\)/g)].map(m => m[1]);
    for (const fUrl of fontUrls) {
      const fName = path.basename(fUrl);
      const localPath = path.join('assets/fonts', fName);
      if (!fs.existsSync(localPath)) {
        const fRes = await fetch(fUrl);
        const buf = Buffer.from(await fRes.arrayBuffer());
        fs.writeFileSync(localPath, buf);
        console.log(`Downloaded font: ${fName} (${buf.length} bytes)`);
      }
      css = css.split(fUrl).join(`../fonts/${fName}`);
    }
    combinedCss += `\n/* Font set ${i + 1} */\n` + css;
  }
  fs.writeFileSync('assets/css/fonts.css', combinedCss);
  console.log('Saved combined assets/css/fonts.css');
}

downloadFonts().catch(console.error);
