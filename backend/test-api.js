const http = require('http');

async function testApi() {
  console.log('Testing GET /api/listings...');
  const getRes = await fetch('http://localhost:5000/api/listings');
  const getListings = await getRes.json();
  console.log('GET /api/listings Status:', getRes.status, 'Response:', getListings.length);

  console.log('\nTesting POST /api/listings/analyze...');
  const analyzeRes = await fetch('http://localhost:5000/api/listings/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl: 'https://github.com/expressjs/express' })
  });
  const analyzeData = await analyzeRes.json();
  console.log('Analyze Status:', analyzeRes.status);
  console.log('Analyze Data:', JSON.stringify(analyzeData, null, 2));

  // We can't easily test POST /api/listings without auth cookie/JWT
  console.log('\nCannot fully test authenticated endpoints without a JWT token.');
}

testApi().catch(console.error);
