const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  try {
    // Read the HTML file
    const filePath = path.join(process.cwd(), 'public', 'github-login.html');
    let html = fs.readFileSync(filePath, 'utf8');
    
    // Replace environment variable placeholder with actual value
    html = html.replace('<%- process.env.GITHUB_CLIENT_ID %>', process.env.GITHUB_CLIENT_ID || '');
    
    // Set proper content type and send the modified HTML
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error serving GitHub login page:', error);
    res.status(500).send('Internal Server Error');
  }
}; 