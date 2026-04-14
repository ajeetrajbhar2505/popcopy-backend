const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

// Create cookie jar outside function to maintain session across calls
const cookieJar = new CookieJar();
const client = wrapper(axios.create({ 
  jar: cookieJar,
  withCredentials: true,
  maxRedirects: 5,
  validateStatus: function (status) {
    return status >= 200 && status < 400;
  }
}));

exports.scrapeStory = async (req, res) => {
  try {

    
    if (!req.query.url) {
      return res.status(400).json({
        success: false,
        message: "url are required"
      });
    }

    const url=  req.query.url;
    
    console.log("Step 1: Logging in to Wattpad...");
    
    // API Call 1: Login
    const loginResponse = await client.post('https://www.wattpad.com/login?nextUrl=%2Fhome', {
      username: "ajit2504",
      password: "Ajeet@189808"
    });
    
    console.log("Login Status:", loginResponse.status);
    
    // API Call 2: Verify user (genre page)
    console.log("Step 2: Verifying user...");
    const verifyResponse = await client.get('https://www.wattpad.com/start/genres', {
      params: {
        nexturl: '/home',
        platform: 'email',
        type: 'login'
      }
    });
    
    console.log("Verify Status:", verifyResponse.status);
    
    // API Call 3: Access home page to confirm session
    console.log("Step 3: Accessing home page...");
    const homeResponse = await client.get(url);
    
    console.log("Home Status:", homeResponse.status);
    

    // Success response
    return res.status(200).json({
      success: true,
      message: "Successfully logged in and accessed Wattpad",
      data: {
        loginStatus: loginResponse.status,
        verifyStatus: verifyResponse.status,
        homeStatus: homeResponse.status,
        story: homeResponse.data,
        cookies: await cookieJar.getCookieStringSync('https://www.wattpad.com')
      }
    });
    
  } catch (error) {
    console.error("Error in scrapeStory:", error.message);
    
    return res.status(500).json({
      success: false,
      message: "Failed to scrape story",
      error: error.message,
      details: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
  }
};