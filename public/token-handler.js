// GitHub authentication token handler
(function() {
  // Check for token in URL hash or query params
  function extractToken() {
    // Check URL hash first (traditional OAuth flow)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    let token = hashParams.get('access_token');
    
    // If not in hash, check query parameters (for server-side flow)
    if (!token) {
      const queryParams = new URLSearchParams(window.location.search);
      token = queryParams.get('token');
    }
    
    return token;
  }

  function handleToken() {
    const token = extractToken();
    
    if (token) {
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Clean URL
      const url = new URL(window.location.href);
      url.hash = '';
      url.search = '';
      
      // Redirect to dashboard if applicable
      if (window.location.pathname === '/' || window.location.pathname === '/login') {
        window.location.href = '/dashboard';
      } else {
        // Just clean the URL
        window.history.replaceState({}, document.title, url.toString());
        // Reload to ensure the app picks up the token
        window.location.reload();
      }
    }
  }
  
  // Run when the script loads
  handleToken();
})(); 