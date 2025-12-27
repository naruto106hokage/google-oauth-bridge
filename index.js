require('dotenv').config();

const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

// Google OAuth callback
app.get('/api/v1/auth/google', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send('Missing code');

    // 1️⃣ Exchange authorization code for access token (FORM URLENCODED)
    const tokenParams = new URLSearchParams();
    tokenParams.append('client_id', process.env.GOOGLE_CLIENT_ID);
    tokenParams.append('client_secret', process.env.GOOGLE_CLIENT_SECRET);
    tokenParams.append('code', code);
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('redirect_uri', process.env.GOOGLE_REDIRECT_URI);

    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      tokenParams.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) throw new Error('No access token from Google');

    // 2️⃣ Fetch Google profile
    const userRes = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const googleUser = userRes.data;

    // 3️⃣ Call YOUR existing login API (NO CHANGES REQUIRED)
    const formData = new URLSearchParams();
    formData.append('login_type', 'social');
    formData.append('provider', 'google');
    formData.append('provider_id', googleUser.id);
    formData.append('email', googleUser.email || '');
    formData.append('name', googleUser.name || '');
    formData.append('profile_image', googleUser.picture || '');
    formData.append('device_type', 'android');

    const loginRes = await axios.post(
      'https://mutants.assertinfotech.com/api/v1/login',
      formData.toString(),
      {
        headers: {
          'Accept': 'application/json',
          'System-Key': 'iis-postman',
          'App-Language': 'hi',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // 4️⃣ Return JSON (TESTING)
    const appToken = loginRes.data.token;
    console.log('Redirecting to deep link with token:', appToken);

    res.redirect(
      `mutants://login?token=${encodeURIComponent(appToken)}`
    );
    
    // 🔥 PRODUCTION (ENABLE LATER)
    // const appToken = loginRes.data.token;
    // res.redirect(`mutants://login?token=${appToken}`);

  } catch (err) {
    console.error('Google OAuth Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Google login failed' });
  }
});

app.listen(PORT, () => {
  console.log(`OAuth bridge running on port ${PORT}`);
});
