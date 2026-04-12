const https = require('https');

const payload = {
  label: 'Test Product',
  reference: 'TEST-001',
  category: 'accessoire',
  serie: '40',
  unit: 'piece',
  colors: ['blanc', 'noir'],
  lowStockThreshold: 5,
  priceTtc: 100.50,
  description: 'Test product for debugging'
};

const data = JSON.stringify(payload);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/products',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer dummy-token'  // This will fail auth but let's see the error
  }
};

console.log('Sending payload:', JSON.stringify(payload, null, 2));

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, JSON.stringify(res.headers, null, 2));

  let body = '';
  res.on('data', (chunk) => {
    body += chunk.toString();
  });

  res.on('end', () => {
    console.log('Response body:', body);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();