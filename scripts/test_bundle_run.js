import fs from 'fs';

const bundleCode = fs.readFileSync('./dist/assets/index-BuFRneKm.js', 'utf-8');
console.log('Bundle loaded. Size in KB:', (bundleCode.length / 1024).toFixed(1));

// Check for common error patterns
console.log('Has React import:', bundleCode.includes('React'));
console.log('Has Lucide icons:', bundleCode.includes('lucide'));
console.log('Has App root:', bundleCode.includes('EvilTools'));
