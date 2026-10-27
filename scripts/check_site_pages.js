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
  'whatelse'
];

async function check() {
  for (const p of pages) {
    try {
      const res = await fetch(`https://mayamd.ai/${p}`, { method: 'HEAD' });
      console.log(`/${p} -> Status ${res.status}`);
    } catch (e) {
      console.log(`/${p} -> Failed: ${e.message}`);
    }
  }
}

check();
