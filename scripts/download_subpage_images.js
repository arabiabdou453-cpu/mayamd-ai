const fs = require('fs');
const path = require('path');

const missingImages = [
  '6ad4f8fa3cf1cbab6f0cd9b9_mayamd-bedside-tablet.jpg',
  '6ad4f8fbca4b1a858cd7a143_mayamd-particle-teal.jpg',
  '6ad4f8fa6f68dbaad1269d6f_mayamd-older-patient.jpg',
  '6ad4f8fa6f68dbaad1269d59_mayamd-network-arcs.jpg',
  '6ad4f04ac22476b9d322da35_mayamd-data-wave-dots.jpg',
  '6ad4f8faaa4182a53a2b30d8_mayamd-doctor-tablet.jpg',
  '6ad4f8fb5e69618df7c16f76_mayamd-particle-purple.jpg',
  '6ad4f04957886a694ce3a13b_mayamd-clinician-faceshield.jpg'
];

async function downloadMissing() {
  for (const file of missingImages) {
    const urls = [
      `https://cdn.prod.website-files.com/6975cfff770e2487cd056210/${file}`,
      `https://cdn.prod.website-files.com/631f74f62fd0270a81ecb845/${file}`
    ];
    let downloaded = false;
    for (const u of urls) {
      try {
        const res = await fetch(u, {
          headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36' }
        });
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(path.join('assets/images', file), buf);
          console.log(`Downloaded ${file} (${buf.length} bytes) from ${u}`);
          downloaded = true;
          break;
        }
      } catch (e) {}
    }
    if (!downloaded) {
      console.error(`Could not download ${file}`);
    }
  }
}

downloadMissing().catch(console.error);
