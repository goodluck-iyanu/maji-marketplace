const { OAuth2Client } = require('google-auth-library');
const readline = require('readline');
const http = require('http');
const url = require('url');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('\n=== Google Drive OAuth Setup ===\n');

rl.question('Enter your Google Client ID: ', (clientId) => {
  rl.question('Enter your Google Client Secret: ', (clientSecret) => {
    
    // We use a local server to receive the callback automatically
    const redirectUri = 'http://localhost:3000/oauth2callback';
    const oAuth2Client = new OAuth2Client(
      clientId.trim(),
      clientSecret.trim(),
      redirectUri
    );

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive'],
      prompt: 'consent' // Forces Google to give us a refresh token
    });

    console.log('\n--------------------------------------------------');
    console.log('1. Click this link to authorize your app:');
    console.log(authUrl);
    console.log('--------------------------------------------------\n');
    console.log('Waiting for you to log in in your browser...');

    // Start a temporary local server to catch the redirect from Google
    const server = http.createServer(async (req, res) => {
      try {
        const reqUrl = url.parse(req.url, true);
        if (reqUrl.pathname === '/oauth2callback') {
          const code = reqUrl.query.code;
          if (code) {
            res.end('Success! You can close this tab and go back to VS Code.');
            server.close();
            
            console.log('\n✅ Received code! Generating tokens...\n');
            const { tokens } = await oAuth2Client.getToken(code);
            
            console.log('✅ SUCCESS! Here are your credentials:\n');
            console.log('GOOGLE_CLIENT_ID=' + clientId.trim());
            console.log('GOOGLE_CLIENT_SECRET=' + clientSecret.trim());
            console.log('GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
            console.log('\nCopy these 3 variables to your Vercel Environment Variables!');
            process.exit(0);
          }
        }
      } catch (err) {
        console.error('Error getting tokens:', err);
        res.end('Error occurred. Check console.');
      }
    }).listen(3000, () => {
      // Server is running and waiting
    });
  });
});
