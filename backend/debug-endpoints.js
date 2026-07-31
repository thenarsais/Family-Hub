/**
 * Debug script to see actual endpoint responses and errors
 */

const API_URL = 'http://localhost:3000';

async function testEndpoint(method, path, body = null) {
  try {
    console.log(`\n📍 ${method} ${path}`);

    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${path}`, options);
    const text = await response.text();

    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${text.substring(0, 300)}${text.length > 300 ? '...' : ''}`);

    try {
      const data = JSON.parse(text);
      if (data.error) {
        console.log(`   ❌ ERROR: ${data.error}`);
        if (data.message) console.log(`   MESSAGE: ${data.message}`);
      }
    } catch (e) {
      // Not JSON
    }
  } catch (error) {
    console.log(`   ❌ FETCH ERROR: ${error.message}`);
  }
}

(async () => {
  console.log('🔍 DEBUGGING API ENDPOINTS\n');
  console.log('='.repeat(60));

  // Test auth endpoints
  await testEndpoint('POST', '/auth/signup', {
    email: 'test@example.com',
    password: 'Test123!',
    name: 'Test',
    role: 'parent'
  });

  await testEndpoint('POST', '/auth/login', {
    email: 'test@example.com',
    password: 'Test123!'
  });

  // Test user endpoint
  await testEndpoint('GET', '/users');

  // Test badges
  await testEndpoint('GET', '/badges');

  // Test points
  await testEndpoint('GET', '/points/leaderboard');

  console.log('\n' + '='.repeat(60));
})();
