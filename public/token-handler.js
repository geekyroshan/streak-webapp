// GitHub authentication token handler
(function() {
  console.log('Token handler script running');

  // Check for token in URL hash or query params
  function extractToken() {
    // Check URL hash first (traditional OAuth flow)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    let token = hashParams.get('access_token');
    
    // If not in hash, check query parameters (for server-side flow)
    if (!token) {
      const queryParams = new URLSearchParams(window.location.search);
      token = queryParams.get('token');
      console.log('Token from query params:', token ? 'Found' : 'Not found');
    } else {
      console.log('Token from hash params:', 'Found');
    }
    
    return token;
  }

  function handleToken() {
    const token = extractToken();
    
    if (token) {
      console.log('Token found, storing and redirecting');
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Log token presence for debugging
      console.log('Token stored in localStorage:', !!localStorage.getItem('token'));
      
      // Clean URL
      const url = new URL(window.location.href);
      url.hash = '';
      url.search = '';
      
      // Redirect to dashboard if applicable
      if (window.location.pathname === '/' || window.location.pathname === '/login') {
        console.log('Redirecting to dashboard');
        window.location.href = '/dashboard';
      } else {
        // Just clean the URL
        console.log('Cleaning URL and reloading');
        window.history.replaceState({}, document.title, url.toString());
        // Reload to ensure the app picks up the token
        window.location.reload();
      }
    } else {
      console.log('No token found in URL');
    }
  }
  
  // Run when the script loads
  handleToken();
})(); 