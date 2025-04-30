// Direct GitHub OAuth handler
export default function handler(req, res) {
  console.log('[Auth] GitHub OAuth request');
  
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI || 'https://github-streak-manager.vercel.app/api/auth/github/callback';
  const scope = 'user repo';
  
  // Generate random state for security
  const randomState = `st_${Math.random().toString(36).substring(2, 15)}`;
  
  // Generate authorization URL
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&allow_signup=false&prompt=login&state=${randomState}`;
  
  console.log('Redirecting to GitHub:', githubAuthUrl);
  return res.redirect(302, githubAuthUrl);
} 