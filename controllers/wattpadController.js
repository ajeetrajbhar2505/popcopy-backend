require("dotenv").config();

const axios = require("axios");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");

const cookieJar = new CookieJar();

const client = wrapper(
  axios.create({
    jar: cookieJar,
    withCredentials: true,
    timeout: 30000,
    maxRedirects: 5,
    validateStatus: (status) => status >= 200 && status < 400,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0 Safari/537.36",
      Accept: "*/*",
    },
  })
);


const LOGIN_URL = "https://www.wattpad.com/login?nextUrl=%2Fhome";
const VERIFY_URL = "https://www.wattpad.com/start/genres";

async function loginToWattpad() {
  console.log("🔐 Logging into Wattpad...");

  const response = await client.post(LOGIN_URL, {
    username: process.env.WATTPAD_USERNAME,
    password: process.env.WATTPAD_PASSWORD,
  });

  console.log(`✅ Login Status : ${response.status}`);

  return response;
}

async function verifySession() {
  console.log("✅ Verifying session...");

  const response = await client.get(VERIFY_URL, {
    params: {
      nexturl: "/home",
      platform: "email",
      type: "login",
    },
  });

  console.log(`✅ Verify Status : ${response.status}`);

  return response;
}

async function fetchStory(url) {
  console.log(`📖 Fetching Story : ${url}`);

  const response = await client.get(url);

  console.log(`✅ Story Status : ${response.status}`);

  return response;
}


exports.scrapeStory = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "Story URL is required.",
      });
    }

    if (!process.env.WATTPAD_USERNAME || !process.env.WATTPAD_PASSWORD) {
      return res.status(500).json({
        success: false,
        message: "Wattpad credentials are missing in .env",
      });
    }

    // Login
    const loginResponse = await loginToWattpad();

    // Verify Login
    const verifyResponse = await verifySession();

    // Fetch Story
    const storyResponse = await fetchStory(url);

    // Cookies (for debugging)
    const cookies = await cookieJar.getCookieString(
      "https://www.wattpad.com"
    );

    return res.status(200).json({
      success: true,
      message: "Story fetched successfully.",
      data: {
        loginStatus: loginResponse.status,
        verifyStatus: verifyResponse.status,
        storyStatus: storyResponse.status,
        story: storyResponse.data,
        cookies,
      },
    });
  } catch (error) {
    console.error("❌ scrapeStory Error");

    console.error({
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    return res.status(error.response?.status || 500).json({
      success: false,
      message: "Failed to scrape Wattpad story.",
      error: error.message,
      details: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
          }
        : null,
    });
  }
};