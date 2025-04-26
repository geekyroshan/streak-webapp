/**
 * GitHub Authentication Token Handler
 * 
 * This script handles the GitHub authentication token when redirected
 * from the authentication flow. It:
 * 1. Checks for a token in the URL parameters
 * 2. Stores it in localStorage if found
 * 3. Removes it from the URL for security
 * 4. Checks cookies and localStorage for existing tokens
 *
 * Include this script in your main application to automatically
 * handle the authentication process.
 */

(function() {
  // Function to get URL parameters
  function getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }
  
  // Function to get a cookie by name
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }
  
  // Run immediately when the script loads
  function init() {
    // Check for token in URL parameters
    const urlToken = getUrlParam('token');
    
    // Check for token in cookies
    const cookieToken = getCookie('github_token') || getCookie('github_token_alt') || getCookie('github_token_client');
    
    // Check localStorage for existing token
    const localStorageToken = localStorage.getItem('github_token');
    
    // If we have a URL token, store it
    if (urlToken) {
      console.log('GitHub token received from URL parameter');
      localStorage.setItem('github_token', urlToken);
      
      // Remove token from URL for security
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      // Set a flag in session to indicate we just logged in
      sessionStorage.setItem('just_authenticated', 'true');
      
      // Dispatch an event to notify the app of authentication
      const authEvent = new CustomEvent('github-authenticated', { 
        detail: { source: 'url' }
      });
      window.dispatchEvent(authEvent);
    } 
    // If we have a cookie token but not in localStorage, store it
    else if (cookieToken && !localStorageToken) {
      console.log('GitHub token received from cookie');
      localStorage.setItem('github_token', cookieToken);
      
      // Set a flag in session to indicate we just logged in
      sessionStorage.setItem('just_authenticated', 'true');
      
      // Dispatch an event to notify the app of authentication
      const authEvent = new CustomEvent('github-authenticated', { 
        detail: { source: 'cookie' }
      });
      window.dispatchEvent(authEvent);
    }
    // If we already have a token in localStorage
    else if (localStorageToken) {
      console.log('GitHub token already exists in localStorage');
      
      // Dispatch an event to notify the app of existing authentication
      const authEvent = new CustomEvent('github-authenticated', { 
        detail: { source: 'localStorage' }
      });
      window.dispatchEvent(authEvent);
    }
  }
  
  // Run the initialization
  init();
  
  // Add a global function to check if authenticated
  window.isGitHubAuthenticated = function() {
    return !!localStorage.getItem('github_token');
  };
  
  // Add a global function to get the token
  window.getGitHubToken = function() {
    return localStorage.getItem('github_token');
  };
  
  // Add a global function to logout
  window.logoutGitHub = function() {
    localStorage.removeItem('github_token');
    document.cookie = 'github_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    document.cookie = 'github_token_alt=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    document.cookie = 'github_token_client=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    
    // Dispatch logout event
    const logoutEvent = new CustomEvent('github-logged-out');
    window.dispatchEvent(logoutEvent);
  };
})(); 