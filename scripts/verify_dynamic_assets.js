const fs = require('fs');

const dynamicFiles = [
  'assets/images/6ad4f04aaefc4aa652dff978_mayamd-going-home-neon.jpg',
  'assets/images/6ad4f0498f0e2fd6f1999744_mayamd-companion-phone.jpg',
  'assets/images/6ad4f04ac22476b9d322da50_mayamd-data-wave-mesh.jpg',
  'assets/images/6ad02cf9ce7eced40f659364_red-hero-walk.jpg',
  'assets/images/6ad02d3618d61312cfde2a37_red-home-discharge.jpg',
  'assets/images/6ad05423f59b6887a260db46_red-hospital-hd.jpg',
  'assets/video/6ad5139e0020923d27ef6cbe_mayamd-care-loop.mp4'
];

for (const f of dynamicFiles) {
  if (fs.existsSync(f)) {
    console.log(`OK: ${f} (${(fs.statSync(f).size / 1024).toFixed(1)} KB)`);
  } else {
    console.error(`MISSING: ${f}`);
  }
}
