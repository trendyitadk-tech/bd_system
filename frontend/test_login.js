const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('https://bd-system-vqob.vercel.app/api/auth/login', {
      username: 'admin',
      password: '123456'
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    console.log('ERROR:', err.response ? err.response.status : err.message);
    if (err.response) console.log(err.response.data);
  }
}

testLogin();
