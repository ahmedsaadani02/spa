console.log('Starting test...');

try {
  console.log('Loading product-images...');
  const pi = require('./src/utils/product-images');
  console.log('✓ product-images loaded');

  if (typeof pi.normalizeImage === 'function') {
    console.log('✓ normalizeImage is a function');

    const result = pi.normalizeImage('http://127.0.0.1:10000/api/product-images/test.png');
    console.log('✓ Test result:', result);
  } else {
    console.error('✗ normalizeImage is not a function:', typeof pi.normalizeImage);
  }

} catch(e) {
  console.error('✗ ERROR loading product-images:', e.message);
  console.error(e.stack);
}