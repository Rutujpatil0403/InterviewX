// Test Backend Connection

export const testBackendConnection = async () => {
  try {
    console.log('🔄 Testing backend connection...');
    
    // Test basic health endpoint with better error handling
    const response = await fetch('http://localhost:5000/health', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Expected JSON response but got: ${contentType}. Response: ${text.substring(0, 200)}`);
    }

    const healthData = await response.json();
    console.log('✅ Backend health check:', healthData);
    
    // Note: Skipping dashboard API test to avoid repeated requests when not authenticated
    console.log('✅ Backend connection test completed (API test skipped for unauthenticated users)');
    
    return { success: true, message: 'Backend connection successful' };
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return { success: false, error: error.message };
  }
};

// Call this function to test the connection
if (typeof window !== 'undefined') {
  window.testConnection = testBackendConnection;
}
