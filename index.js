require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/v1/auth/google', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send('Missing code');

    // 1️⃣ Exchange code for token
    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI
      }
    );

    const accessToken = tokenRes.data.access_token;

    // 2️⃣ Get Google user info
    const userRes = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const googleUser = userRes.data;

    // 3️⃣ Call YOUR existing login API
    const formData = new URLSearchParams();
    formData.append('login_type', 'social');
    formData.append('provider', 'google');
    formData.append('provider_id', googleUser.id);
    formData.append('email', googleUser.email || '');
    formData.append('name', googleUser.name || '');
    formData.append('profile_image', googleUser.picture || '');
    formData.append('device_type', 'android');

    const loginRes = await axios.post(
      'https://thehinduism.me/api/v1/login',
      formData,
      {
        headers: {
          'Accept': 'application/json',
          'System-Key': 'iis-postman',
          'App-Language': 'hi'
        }
      }
    );

    // 4️⃣ Return response (TEMP: JSON for testing)
    res.json({
      googleUser,
      loginResponse: loginRes.data
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Google login failed' });
  }
});

app.listen(PORT, () => {
  console.log(`OAuth bridge running on http://localhost:${PORT}`);
});
