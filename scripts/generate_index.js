const fs = require('fs');

let html = fs.readFileSync('original.html', 'utf-8');
const urlMap = JSON.parse(fs.readFileSync('scripts/url_map.json', 'utf-8'));

console.log('Original HTML size:', html.length);

// 1. Replace all mapped asset URLs
for (const [origUrl, localRel] of Object.entries(urlMap)) {
  html = html.split(origUrl).join(localRel);
}

// 2. Replace CDN base in Script 4:
html = html.replace(/var C\s*=\s*['"]https:\/\/cdn\.prod\.website-files\.com\/6975cfff770e2487cd056210\/['"]/g, "var C='assets/images/'");

// 3. Replace CDN base in Script 5:
html = html.replace(/var P\s*=\s*['"]https:\/\/cdn\.prod\.website-files\.com\/631f74f62fd0270a81ecb845\/['"]/g, "var P='assets/images/'");

// 4. Replace jquery url
html = html.replace(/https:\/\/d3e54v103j8qbb\.cloudfront\.net\/js\/jquery-3\.5\.1\.min\.dc5e7f18c8\.js\?site=6975cfff770e2487cd056210/g, 'assets/js/jquery-3.5.1.min.js');

// 5. Replace WebFont.load and Google fonts with local fonts.css
html = html.replace(/<link href="https:\/\/cdn\.prod\.website-files\.com" rel="preconnect" crossorigin="anonymous"\/>\s*/g, '');
html = html.replace(/<link href="https:\/\/fonts\.googleapis\.com" rel="preconnect"\/>\s*/g, '');
html = html.replace(/<link href="https:\/\/fonts\.gstatic\.com" rel="preconnect" crossorigin="anonymous"\/>\s*/g, '');
html = html.replace(/<script src="assets\/js\/webfont\.js" type="text\/javascript"><\/script>\s*<script type="text\/javascript">WebFont\.load\(\{\s*google:\s*\{\s*families:\s*\["Geist:300,400,500,600,700"\]\s*\}\}\);<\/script>/, '');

// Clean any leftover Google Font links
html = html.replace(/<link[^>]+fonts\.googleapis\.com[^>]*>\s*/gi, '');

// Add local fonts.css right above webflow.css
html = html.replace(/<link href="assets\/css\/webflow\.css"/, '<link href="assets/css/fonts.css" rel="stylesheet" type="text/css"/>\n<link href="assets/css/webflow.css"');

// 6. Disable external tracking / captcha scripts that cause network errors in local/offline environments
html = html.replace(/<script src="https:\/\/www\.google\.com\/recaptcha\/api\.js" type="text\/javascript"><\/script>/g, '');
html = html.replace(/<script>\s*\(function\(ss,ex\)[\s\S]*?<\/script>/, '');
html = html.replace(/<script src="\/\/js-na2\.hs-scripts\.com\/247579062\.js" type="text\/javascript"><\/script>/g, '');
html = html.replace(/<script src="assets\/js\/google_analytics_ga4-1\.0\.0\.js" type="text\/javascript"><\/script>/g, '');
html = html.replace(/<script src="assets\/js\/old_page_redirects-1\.0\.0\.js" type="text\/javascript"><\/script>/g, '');

// 7. Make sure webflow.css is linked cleanly
html = html.replace(/href="assets\/css\/avanzars-awesome-site-1bcacdff3b3539bdf\.webflow\.shared\.dfb65a4e9\.css"/g, 'href="assets/css/webflow.css"');
html = html.replace(/integrity="sha384-37ZaTpjLwXNCn8f2rUXlpn3akK8M5v4iQGAMLEgjOK\+MnSNj1IkoATqnlxrh4Bf2"/g, '');

fs.writeFileSync('index.html', html);
console.log('Successfully regenerated index.html, size:', html.length);
