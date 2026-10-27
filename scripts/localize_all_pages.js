const fs = require('fs');
const path = require('path');

const pages = [
  'transitions-of-care',
  'asc-outpatient',
  'remote-care',
  'maya-engine',
  'for-physicians',
  'for-patients',
  'resources-hub',
  'about-us',
  'contact-us',
  'whatelse',
  'privacy-policy',
  'user-agreement'
];

let urlMap = JSON.parse(fs.readFileSync('scripts/url_map.json', 'utf-8'));

async function getNewAssets() {
  const newUrls = new Set();
  for (const p of pages) {
    const raw = fs.readFileSync(path.join('pages_raw', `${p}.html`), 'utf-8');
    const matches = raw.match(/https?:\/\/[^\s"'<>)]+/g) || [];
    for (const u of matches) {
      if (u.includes('website-files.com') && !urlMap[u]) {
        newUrls.add(u);
      }
    }
  }

  console.log(`Found ${newUrls.size} new CDN URLs across all subpages.`);
  for (const url of newUrls) {
    const clean = url.split('?')[0].split('#')[0];
    const ext = path.extname(clean).toLowerCase();
    let folder = 'assets/images';
    if (['.ttf', '.woff', '.woff2'].includes(ext)) folder = 'assets/fonts';
    if (['.js'].includes(ext)) folder = 'assets/js';
    if (['.css'].includes(ext)) folder = 'assets/css';

    let baseName = path.basename(decodeURIComponent(clean)).replace(/[^a-zA-Z0-9._-]/g, '_');
    const localRel = `${folder}/${baseName}`;
    const localAbs = path.resolve(localRel);

    if (!fs.existsSync(localAbs)) {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36' }
        });
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(localAbs, buf);
          console.log(`Downloaded: ${localRel} (${buf.length} bytes)`);
          urlMap[url] = localRel;
        }
      } catch (e) {
        console.warn(`Failed ${url}: ${e.message}`);
      }
    } else {
      urlMap[url] = localRel;
    }
  }

  fs.writeFileSync('scripts/url_map.json', JSON.stringify(urlMap, null, 2));

  // Now transform and save each page to root directory
  for (const p of pages) {
    let html = fs.readFileSync(path.join('pages_raw', `${p}.html`), 'utf-8');

    for (const [origUrl, localRel] of Object.entries(urlMap)) {
      html = html.split(origUrl).join(localRel);
    }

    // Scripts C and P replacement
    html = html.replace(/var C\s*=\s*['"]https:\/\/cdn\.prod\.website-files\.com\/6975cfff770e2487cd056210\/['"]/g, "var C='assets/images/'");
    html = html.replace(/var P\s*=\s*['"]https:\/\/cdn\.prod\.website-files\.com\/631f74f62fd0270a81ecb845\/['"]/g, "var P='assets/images/'");
    html = html.replace(/https:\/\/d3e54v103j8qbb\.cloudfront\.net\/js\/jquery-3\.5\.1\.min\.dc5e7f18c8\.js\?site=6975cfff770e2487cd056210/g, 'assets/js/jquery-3.5.1.min.js');

    // Fonts replacement
    html = html.replace(/<link href="https:\/\/cdn\.prod\.website-files\.com" rel="preconnect" crossorigin="anonymous"\/>\s*/g, '');
    html = html.replace(/<link href="https:\/\/fonts\.googleapis\.com" rel="preconnect"\/>\s*/g, '');
    html = html.replace(/<link href="https:\/\/fonts\.gstatic\.com" rel="preconnect" crossorigin="anonymous"\/>\s*/g, '');
    html = html.replace(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>/g, '');
    html = html.replace(/<script src="assets\/js\/webfont\.js" type="text\/javascript"><\/script>\s*<script type="text\/javascript">WebFont\.load\(\{\s*google:\s*\{\s*families:\s*\["Geist:300,400,500,600,700"\]\s*\}\}\);<\/script>/, '');
    html = html.replace(/<link[^>]+fonts\.googleapis\.com[^>]*>\s*/gi, '');

    // CSS link
    html = html.replace(/href="assets\/css\/avanzars-awesome-site-1bcacdff3b3539bdf\.webflow\.shared\.dfb65a4e9\.css"/g, 'href="assets/css/webflow.css"');
    html = html.replace(/integrity="sha384-37ZaTpjLwXNCn8f2rUXlpn3akK8M5v4iQGAMLEgjOK\+MnSNj1IkoATqnlxrh4Bf2"/g, '');

    if (!html.includes('assets/css/fonts.css')) {
      html = html.replace(
        '<link href="assets/css/webflow.css"',
        '<link href="assets/css/fonts.css" rel="stylesheet" type="text/css"/>\n<link href="assets/css/webflow.css"'
      );
    }

    // Clean tracking scripts
    html = html.replace(/<script src="https:\/\/www\.google\.com\/recaptcha\/api\.js" type="text\/javascript"><\/script>/g, '');
    html = html.replace(/<script>\s*\(function\(ss,ex\)[\s\S]*?<\/script>/, '');
    html = html.replace(/<script src="\/\/js-na2\.hs-scripts\.com\/247579062\.js" type="text\/javascript"><\/script>/g, '');
    html = html.replace(/<script src="assets\/js\/google_analytics_ga4-1\.0\.0\.js" type="text\/javascript"><\/script>/g, '');
    html = html.replace(/<script src="assets\/js\/old_page_redirects-1\.0\.0\.js" type="text\/javascript"><\/script>/g, '');

    fs.writeFileSync(`${p}.html`, html);
    console.log(`Generated ${p}.html (${html.length} bytes)`);
  }
}

getNewAssets().catch(console.error);
