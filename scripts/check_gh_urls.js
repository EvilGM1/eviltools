import https from 'https';

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      console.log(`[${res.statusCode}] ${url}`);
      resolve(res.statusCode);
    }).on('error', (err) => {
      console.log(`[ERR] ${url}:`, err.message);
      resolve(0);
    });
  });
}

async function test() {
  await checkUrl('https://evilgm1.github.io/eviltools/');
  await checkUrl('https://evilgm1.github.io/eviltools/assets/index-BuFRneKm.js');
  await checkUrl('https://evilgm1.github.io/assets/index-BuFRneKm.js');
}

test();
