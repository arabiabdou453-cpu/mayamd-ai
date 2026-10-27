const fs = require('fs');
const path = require('path');

const customScripts = [
  'https://cdn.prod.website-files.com/6975cfff770e2487cd056210%2F689e5ba67671442434f3ca35%2F6ad506a27ef106e0cfbe87d3%2Fwhatelse_menu_pill-1.0.0.js',
  'https://cdn.prod.website-files.com/6975cfff770e2487cd056210%2F689e5ba67671442434f3ca35%2F6ad628e3113538f1057dc333%2Ffooter_social_icons-1.0.0.js',
  'https://cdn.prod.website-files.com/6975cfff770e2487cd056210%2F689e5ba67671442434f3ca35%2F6ad62cdb0dcfa315cb615711%2Fheader_social_icons-1.0.0.js',
  'https://cdn.prod.website-files.com/6975cfff770e2487cd056210%2F689e5ba67671442434f3ca35%2F6ad5148c1f418b14c029b6ab%2Fhome_care_loop_video-1.0.2.js',
  'https://cdn.prod.website-files.com/6975cfff770e2487cd056210%2F689e5ba67671442434f3ca35%2F6ad54ec999eab2e729c0821d%2Fhome_repeat_trims-1.0.1.js'
];

async function run() {
  fs.mkdirSync('assets/custom_scripts', { recursive: true });
  for (const url of customScripts) {
    const rawParts = decodeURIComponent(url).split('/');
    const filename = rawParts[rawParts.length - 1];
    console.log('Fetching', filename);
    const res = await fetch(url);
    const text = await res.text();
    fs.writeFileSync(path.join('assets/custom_scripts', filename), text);
    console.log(`Saved ${filename} (${text.length} bytes):`);
    console.log(text.slice(0, 150));
    console.log('---');
  }
}

run().catch(console.error);
