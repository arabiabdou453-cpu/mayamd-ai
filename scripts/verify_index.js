const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf-8');
const urls = [...html.matchAll(/https?:\/\/[^\s"'<>)]+/g)].map(m => m[0]);
console.log('Total URLs found in index.html:', urls.length);

const cdnRemaining = urls.filter(u => u.includes('cdn.prod.website-files.com') || u.includes('cloudfront.net'));
console.log('Remaining CDN URLs:', cdnRemaining);

const schemas = urls.filter(u => u.includes('schema.org') || u.includes('w3.org'));
console.log('Schema/XML namespace URLs (expected):', schemas.length);

const otherExternals = urls.filter(u => !u.includes('schema.org') && !u.includes('w3.org') && !u.includes('cdn.prod.website-files.com') && !u.includes('cloudfront.net') && !u.includes('mayamd.ai') && !u.includes('webflow.com'));
console.log('Other external URLs:', otherExternals);
