const pages = [
  '',
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

async function testAll() {
  let errors = 0;
  for (const p of pages) {
    const url = `http://127.0.0.1:3000/${p}`;
    const res = await fetch(url);
    if (res.status === 200) {
      console.log(`OK: /${p || 'index'} -> 200`);
    } else {
      console.error(`FAIL: /${p} -> ${res.status}`);
      errors++;
    }
  }
  console.log(`\nTest completed. ${pages.length - errors}/${pages.length} pages returned 200 OK.`);
}

testAll();
