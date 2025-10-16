// Manual test script to verify backend connection
// Run this in the browser console: manualTest()

window.manualTest = async () => {
  console.log('🔄 Manual backend connection test...');
  
  try {
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:5000/health', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('Health response status:', healthResponse.status);
    console.log('Health response headers:', [...healthResponse.headers.entries()]);

    if (!healthResponse.ok) {
      console.error('❌ Health check failed:', healthResponse.status, healthResponse.statusText);
      return;
    }

    const healthData = await healthResponse.json();
    console.log('✅ Health check successful:', healthData);

    // Test a simple API endpoint
    try {
      const apiResponse = await fetch('http://localhost:5000/api/analytics/dashboard', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('API response status:', apiResponse.status);
      
      if (apiResponse.status === 401) {
        console.log('✅ API endpoint reachable (requires authentication)');
      } else if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log('✅ API response:', apiData);
      } else {
        console.log('❌ API error:', apiResponse.status, apiResponse.statusText);
      }

    } catch (apiError) {
      console.log('❌ API request failed:', apiError.message);
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
};

// Auto-run the test
console.log('Manual test function loaded. Run manualTest() in console to test connection.');
