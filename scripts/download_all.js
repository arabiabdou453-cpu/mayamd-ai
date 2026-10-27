const fs = require('fs');
const path = require('path');

const candidates = JSON.parse(fs.readFileSync('scripts/all_candidates.json', 'utf-8'));

fs.mkdirSync('assets/images', { recursive: true });
fs.mkdirSync('assets/fonts', { recursive: true });
fs.mkdirSync('assets/css', { recursive: true });
fs.mkdirSync('assets/js', { recursive: true });
fs.mkdirSync('assets/video', { recursive: true });

const urlMap = {};

function getExt(url) {
  const clean = url.split('?')[0].split('#')[0];
  const ext = path.extname(clean).toLowerCase();
  return ext;
}

function getSubfolder(ext) {
  if (['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg', '.gif', '.ico'].includes(ext)) return 'assets/images';
  if (['.ttf', '.woff', '.woff2', '.eot', '.otf'].includes(ext)) return 'assets/fonts';
  if (['.mp4', '.webm', '.ogg'].includes(ext)) return 'assets/video';
  if (['.css'].includes(ext)) return 'assets/css';
  if (['.js'].includes(ext)) return 'assets/js';
  return null;
}

async function downloadFile(url) {
  // Ignore tracking or generic site urls
  if (url === 'https://mayamd.ai' || url === 'https://mayamd.ai/' || url.startsWith('https://mayamd.ai/#') || url.startsWith('https://mayamd.ai/privacy') || url.startsWith('https://mayamd.ai/user')) {
    return;
  }
  if (url.includes('google-analytics') || url.includes('lfeeder.com') || url.includes('hs-scripts.com') || url.includes('recaptcha')) {
    return;
  }
  if (url === 'https://cdn.prod.website-files.com' || url === 'https://cdn.prod.website-files.com/' || url.endsWith('/')) {
    return;
  }

  const ext = getExt(url);
  const subfolder = getSubfolder(ext);
  if (!subfolder) {
    // Might be Google font CSS or something
    return;
  }

  let baseName = path.basename(decodeURIComponent(url.split('?')[0].split('#')[0]));
  // Sanitize filename
  baseName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const localRelPath = `${subfolder}/${baseName}`;
  const localAbsPath = path.resolve(localRelPath);

  if (fs.existsSync(localAbsPath) && fs.statSync(localAbsPath).size > 0) {
    console.log(`[Already exists] ${baseName}`);
    urlMap[url] = localRelPath;
    return;
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) {
      // If 404, it might have been an inferred candidate that doesn't exist
      return;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0) return;

    fs.writeFileSync(localAbsPath, buffer);
    console.log(`[Downloaded] (${(buffer.length / 1024).toFixed(1)} KB) -> ${localRelPath}`);
    urlMap[url] = localRelPath;
  } catch (err) {
    console.warn(`Failed ${url}: ${err.message}`);
  }
}

async function run() {
  console.log(`Starting download for ${candidates.length} candidates...`);
  for (const url of candidates) {
    await downloadFile(url);
  }
  fs.writeFileSync('scripts/url_map.json', JSON.stringify(urlMap, null, 2));
  console.log(`Finished! Downloaded/mapped ${Object.keys(urlMap).length} assets.`);
}

run().catch(console.error);
