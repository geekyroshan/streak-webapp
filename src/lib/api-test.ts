import api from './api';
import { debugLog } from './debug';

export async function testApiConnection() {
  debugLog('Testing API connection...');
  
  try {
    // Test basic API connectivity
    const basicTestResponse = await api.get('/test');
    debugLog('Basic API test response:', basicTestResponse.data);
    
    // Test GitHub API access
    try {
      const githubTestResponse = await api.get('/github-test');
      debugLog('GitHub API test response:', githubTestResponse.data);
      return {
        success: true,
        basicTest: basicTestResponse.data,
        githubTest: githubTestResponse.data
      };
    } catch (githubError: any) {
      debugLog('GitHub API test failed:', githubError);
      return {
        success: false,
        basicTest: basicTestResponse.data,
        githubError: {
          message: githubError.message,
          response: githubError.response?.data
        }
      };
    }
  } catch (error: any) {
    debugLog('API test failed:', error);
    return {
      success: false,
      error: {
        message: error.message,
        response: error.response?.data
      }
    };
  }
}

export async function verifyToken() {
  debugLog('Verifying stored token...');
  
  const token = localStorage.getItem('token');
  if (!token) {
    debugLog('No token found in localStorage');
    return { valid: false, reason: 'missing' };
  }
  
  try {
    // Use the GitHub test endpoint to verify the token
    const response = await api.get('/github-test');
    debugLog('Token verification successful:', response.data);
    return { 
      valid: true, 
      username: response.data.user?.login,
      userData: response.data.user
    };
  } catch (error: any) {
    debugLog('Token verification failed:', error);
    if (error.response?.status === 401) {
      return { valid: false, reason: 'unauthorized' };
    }
    return { 
      valid: false, 
      reason: 'error',
      error: error.message,
      details: error.response?.data
    };
  }
} 