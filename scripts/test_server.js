import http from 'http';

http.get('http://localhost:5173/', (res) => {
  console.log('HTTP Status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTML Length:', data.length);
    console.log('Contains root element:', data.includes('<div id="root"></div>'));
  });
}).on('error', (err) => {
  console.error('Error fetching:', err);
});
