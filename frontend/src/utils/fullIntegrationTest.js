// Comprehensive Backend-Frontend Connection Test
async function testFullIntegration() {
  console.log('🚀 Starting Full Backend-Frontend Integration Test\n');
  
  const results = {
    tests: [],
    passed: 0,
    failed: 0
  };
  
  function logTest(name, success, error = null) {
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${name}`);
    if (error) console.log(`   Error: ${error}`);
    
    results.tests.push({ name, success, error });
    if (success) results.passed++;
    else results.failed++;
    console.log('');
  }

  // Test 1: Backend Health Check
  try {
    const healthResponse = await fetch('http://localhost:5000/health');
    const healthData = await healthResponse.json();
    logTest('Backend Health Check', healthResponse.ok && healthData.status === 'OK');
  } catch (error) {
    logTest('Backend Health Check', false, error.message);
  }

  // Test 2: User Registration
  try {
    const registrationData = {
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test User',
      role: 'Candidate',
      phone: '1234567890',
      department: 'Engineering',
      company: 'Test Company'
    };

    const regResponse = await fetch('http://localhost:5000/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(registrationData)
    });

    const regData = await regResponse.json();
    logTest('User Registration', regResponse.status === 201 && regData.success);
    
    // Store user data for subsequent tests
    if (regData.success) {
      window.testUser = {
        email: registrationData.email,
        password: registrationData.password,
        token: regData.data.token,
        user: regData.data.user
      };
    }
  } catch (error) {
    logTest('User Registration', false, error.message);
  }

  // Test 3: User Login
  try {
    if (window.testUser) {
      const loginResponse = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: window.testUser.email,
          password: window.testUser.password
        })
      });

      const loginData = await loginResponse.json();
      logTest('User Login', loginResponse.status === 200 && loginData.success);
      
      if (loginData.success) {
        window.testUser.token = loginData.data.token;
      }
    } else {
      logTest('User Login', false, 'No test user available from registration');
    }
  } catch (error) {
    logTest('User Login', false, error.message);
  }

  // Test 4: Token Verification
  try {
    if (window.testUser?.token) {
      const verifyResponse = await fetch('http://localhost:5000/api/users/verify-token', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${window.testUser.token}`,
          'Accept': 'application/json'
        }
      });

      const verifyData = await verifyResponse.json();
      logTest('Token Verification', verifyResponse.status === 200 && verifyData.success);
    } else {
      logTest('Token Verification', false, 'No token available');
    }
  } catch (error) {
    logTest('Token Verification', false, error.message);
  }

  // Test 5: Protected Route - Profile
  try {
    if (window.testUser?.token) {
      const profileResponse = await fetch('http://localhost:5000/api/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${window.testUser.token}`,
          'Accept': 'application/json'
        }
      });

      const profileData = await profileResponse.json();
      logTest('Get User Profile', profileResponse.status === 200 && profileData.success);
    } else {
      logTest('Get User Profile', false, 'No token available');
    }
  } catch (error) {
    logTest('Get User Profile', false, error.message);
  }

  // Test 6: Analytics Dashboard Data
  try {
    if (window.testUser?.token) {
      const dashboardResponse = await fetch('http://localhost:5000/api/analytics/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${window.testUser.token}`,
          'Accept': 'application/json'
        }
      });

      const dashboardData = await dashboardResponse.json();
      logTest('Analytics Dashboard', dashboardResponse.status === 200 && dashboardData.success);
    } else {
      logTest('Analytics Dashboard', false, 'No token available');
    }
  } catch (error) {
    logTest('Analytics Dashboard', false, error.message);
  }

  // Test 7: Template List
  try {
    if (window.testUser?.token) {
      const templatesResponse = await fetch('http://localhost:5000/api/templates', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${window.testUser.token}`,
          'Accept': 'application/json'
        }
      });

      const templatesData = await templatesResponse.json();
      logTest('Get Templates', templatesResponse.status === 200 && templatesData.success);
    } else {
      logTest('Get Templates', false, 'No token available');
    }
  } catch (error) {
    logTest('Get Templates', false, error.message);
  }

  // Test 8: Frontend Accessibility
  try {
    const frontendResponse = await fetch('http://localhost:5173/');
    logTest('Frontend Accessibility', frontendResponse.ok);
  } catch (error) {
    logTest('Frontend Accessibility', false, error.message);
  }

  // Summary
  console.log('🎯 TEST SUMMARY');
  console.log('================');
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${Math.round((results.passed / results.tests.length) * 100)}%`);
  
  if (results.failed > 0) {
    console.log('\n🔍 FAILED TESTS:');
    results.tests.filter(t => !t.success).forEach(test => {
      console.log(`- ${test.name}: ${test.error || 'Unknown error'}`);
    });
  }

  return results;
}

// Auto-run the test
console.log('Full integration test loaded. Run testFullIntegration() in console to start testing.');
window.testFullIntegration = testFullIntegration;
