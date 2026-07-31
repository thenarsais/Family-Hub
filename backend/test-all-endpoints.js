/**
 * Comprehensive API Endpoint Testing
 * Tests all major endpoints: auth, users, badges, points
 */

const API_URL = 'http://localhost:3000';

// Test data
let testToken = null;
let testUserId = null;
let testBadgeId = null;

// Helper to make requests
async function makeRequest(method, path, body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, options);
  const data = await response.json();

  return { status: response.status, data };
}

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(name, passed, details = '') {
  if (passed) {
    console.log(`✅ ${name}`);
    results.passed++;
  } else {
    console.log(`❌ ${name}`);
    results.failed++;
    if (details) results.errors.push(`${name}: ${details}`);
  }
}

(async () => {
  try {
    console.log('🧪 COMPREHENSIVE API ENDPOINT TESTING\n');
    console.log('='.repeat(60) + '\n');

    // ===== HEALTH ENDPOINTS =====
    console.log('📍 HEALTH ENDPOINTS\n');

    try {
      const { status, data } = await makeRequest('GET', '/health');
      logTest('GET /health', status === 200 && data.status === 'ok');
    } catch (err) {
      logTest('GET /health', false, err.message);
    }

    try {
      const { status, data } = await makeRequest('GET', '/info');
      logTest('GET /info', status === 200 && data.application, `endpoints: ${data.endpoints?.total}`);
    } catch (err) {
      logTest('GET /info', false, err.message);
    }

    console.log();

    // ===== AUTH ENDPOINTS =====
    console.log('📍 AUTH ENDPOINTS\n');

    try {
      const { status, data } = await makeRequest('POST', '/auth/signup', {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Test User',
        role: 'parent',
        account_type: 'primary'
      });
      logTest('POST /auth/signup', status === 201 && data.user?.id, data.message);
      testUserId = data.user?.id;
    } catch (err) {
      logTest('POST /auth/signup', false, err.message);
    }

    try {
      const { status, data } = await makeRequest('POST', '/auth/login', {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!'
      });
      logTest('POST /auth/login', status === 200 && data.session?.access_token, 'Token received');
      testToken = data.session?.access_token;
    } catch (err) {
      logTest('POST /auth/login', false, err.message);
    }

    // GET /auth/me requires valid token
    if (testToken) {
      try {
        const { status, data } = await makeRequest('GET', '/auth/me', null, testToken);
        logTest('GET /auth/me (authenticated)', status === 200 && data.user?.id);
      } catch (err) {
        logTest('GET /auth/me (authenticated)', false, err.message);
      }
    }

    console.log();

    // ===== USERS ENDPOINTS =====
    console.log('📍 USERS ENDPOINTS\n');

    try {
      const { status, data } = await makeRequest('GET', '/users', null, testToken);
      logTest('GET /users', status === 200 && data.users, `count: ${data.count}`);
    } catch (err) {
      logTest('GET /users', false, err.message);
    }

    if (testUserId) {
      try {
        const { status, data } = await makeRequest('GET', `/users/${testUserId}`, null, testToken);
        logTest('GET /users/:id', status === 200 && data.user?.id === testUserId);
      } catch (err) {
        logTest('GET /users/:id', false, err.message);
      }

      try {
        const { status, data } = await makeRequest('PUT', `/users/${testUserId}`, {
          name: 'Updated User'
        }, testToken);
        logTest('PUT /users/:id', status === 200 && data.user?.name === 'Updated User');
      } catch (err) {
        logTest('PUT /users/:id', false, err.message);
      }
    }

    console.log();

    // ===== BADGES ENDPOINTS =====
    console.log('📍 BADGES ENDPOINTS\n');

    try {
      const { status, data } = await makeRequest('GET', '/badges', null, testToken);
      logTest('GET /badges', status === 200 && Array.isArray(data.badges), `count: ${data.count}`);
      testBadgeId = data.badges?.[0]?.id;
    } catch (err) {
      logTest('GET /badges', false, err.message);
    }

    if (testBadgeId) {
      try {
        const { status, data } = await makeRequest('GET', `/badges/${testBadgeId}`, null, testToken);
        logTest('GET /badges/:id', status === 200 && data.badge?.id === testBadgeId);
      } catch (err) {
        logTest('GET /badges/:id', false, err.message);
      }
    }

    if (testUserId && testBadgeId) {
      try {
        const { status, data } = await makeRequest('POST', `/users/${testUserId}/badges/${testBadgeId}`, {}, testToken);
        logTest('POST /users/:id/badges/:id (award)', status === 201 || status === 200);
      } catch (err) {
        logTest('POST /users/:id/badges/:id (award)', false, err.message);
      }

      try {
        const { status, data } = await makeRequest('GET', `/badges/users/${testUserId}`, null, testToken);
        logTest('GET /badges/users/:id', status === 200 && Array.isArray(data.badges));
      } catch (err) {
        logTest('GET /badges/users/:id', false, err.message);
      }
    }

    console.log();

    // ===== POINTS ENDPOINTS =====
    console.log('📍 POINTS ENDPOINTS\n');

    if (testUserId) {
      try {
        const { status, data } = await makeRequest('POST', `/points/users/${testUserId}`, {
          points: 100,
          activity_type: 'test',
          reason: 'Test points'
        }, testToken);
        logTest('POST /points/users/:id (add points)', status === 201 && data.entry?.points === 100);
      } catch (err) {
        logTest('POST /points/users/:id (add points)', false, err.message);
      }

      try {
        const { status, data } = await makeRequest('GET', `/points/users/${testUserId}`, null, testToken);
        logTest('GET /points/users/:id', status === 200 && data.total_points !== undefined);
      } catch (err) {
        logTest('GET /points/users/:id', false, err.message);
      }

      try {
        const { status, data } = await makeRequest('GET', `/points/users/${testUserId}/today`, null, testToken);
        logTest('GET /points/users/:id/today', status === 200 && data.points !== undefined);
      } catch (err) {
        logTest('GET /points/users/:id/today', false, err.message);
      }

      try {
        const { status, data } = await makeRequest('GET', `/points/users/${testUserId}/history`, null, testToken);
        logTest('GET /points/users/:id/history', status === 200 && Array.isArray(data.history));
      } catch (err) {
        logTest('GET /points/users/:id/history', false, err.message);
      }
    }

    try {
      const { status, data } = await makeRequest('GET', '/points/leaderboard', null, testToken);
      logTest('GET /points/leaderboard', status === 200 && Array.isArray(data.leaderboard));
    } catch (err) {
      logTest('GET /points/leaderboard', false, err.message);
    }

    console.log();

    // ===== SUMMARY =====
    console.log('='.repeat(60));
    console.log(`\n📊 TEST SUMMARY\n`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%\n`);

    if (results.errors.length > 0) {
      console.log('⚠️  ERRORS:\n');
      results.errors.forEach(err => console.log(`  • ${err}`));
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('FATAL ERROR:', error.message);
  }
})();
