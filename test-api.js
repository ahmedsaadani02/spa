const https = require('https');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/products',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  res.on('data', (chunk) => {
    console.log('Response data:', chunk.toString());
  });

  res.on('end', () => {
    console.log('Request ended');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();