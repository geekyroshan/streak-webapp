// Debug utility functions for API troubleshooting

// Enable/disable debug mode
const DEBUG_MODE = true;

/**
 * Log messages in debug mode
 */
export const debugLog = (...args: any[]) => {
  if (DEBUG_MODE) {
    console.log('[DEBUG]', ...args);
  }
};

/**
 * Log errors in debug mode
 */
export const debugError = (...args: any[]) => {
  if (DEBUG_MODE) {
    console.error('[DEBUG ERROR]', ...args);
  }
};

/**
 * Helper to log API responses
 */
export const logApiResponse = (endpoint: string, data: any) => {
  if (DEBUG_MODE) {
    console.group(`[API Response] ${endpoint}`);
    console.log('Status:', data?.status || 'Unknown');
    console.log('Data:', data?.data || 'No data');
    
    // Check for common issues
    if (!data) {
      console.error('Response is undefined or null');
    } else if (!data.data) {
      console.error('Response does not contain data property');
    } else if (data.data && typeof data.data === 'object' && Object.keys(data.data).length === 0) {
      console.error('Response data is empty object');
    }
    
    console.groupEnd();
  }
};

/**
 * Check if an object is empty
 */
export const isEmpty = (obj: any): boolean => {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

/**
 * Format API errors for display
 */
export const formatApiError = (error: any): string => {
  if (!error) return 'Unknown error';
  
  if (error.response) {
    // Server responded with a status code outside of 2xx range
    const statusCode = error.response.status;
    const message = error.response.data?.message || error.message || 'Server error';
    return `API Error (${statusCode}): ${message}`;
  } else if (error.request) {
    // The request was made but no response was received
    return 'Network error: No response from server';
  } else {
    // Something happened in setting up the request
    return `Error: ${error.message || 'Unknown error'}`;
  }
};

export default {
  debugLog,
  debugError,
  logApiResponse,
  isEmpty,
  formatApiError
}; 