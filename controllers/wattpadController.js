const { chromium } = require('playwright');
const fs = require('fs');

exports.scrapeStory = async (req, res) => {
  let browser;

  try {
    const url = req.query.url;

    if (!url) {
      return res.status(400).json({
        error: 'Story URL is required (?url=...)'
      });
    }

    // ✅ Launch visible browser
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    // ✅ Load session if exists
    const context = fs.existsSync('state.json')
      ? await browser.newContext({ storageState: 'state.json' })
      : await browser.newContext();

    const page = await context.newPage();

    // ===============================
    // 🔐 LOGIN FLOW (ONLY FIRST TIME)
    // ===============================
    if (!fs.existsSync('state.json')) {
      console.log('👉 Opening login page...');

      await page.goto('https://www.wattpad.com/login');

      // 👉 Click Google login button + handle popup
      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        page.click('button.btn-google')
      ]);

      console.log('👉 Complete Google login in popup...');

      await popup.waitForLoadState();

      // Wait until popup closes (user finishes login)
      await page.waitForTimeout(60000); // 60 sec

      console.log('✅ Login completed');

      // Save session
      await context.storageState({ path: 'state.json' });
      console.log('✅ Session saved!');
    }

    // ===============================
    // 📖 SCRAPE STORY
    // ===============================
    console.log('📖 Opening story...');

    await page.goto(url, { waitUntil: 'networkidle' });

    // Optional: ensure logged in
    const isLoggedIn = await page.evaluate(() => {
      return !document.body.innerText.includes('Log in');
    });

    if (!isLoggedIn) {
      throw new Error('Still not logged in. Delete state.json and try again.');
    }

    // Get HTML
    const html = await page.content();

    await browser.close();

    return res.send(html);

  } catch (err) {
    if (browser) await browser.close();

    return res.status(500).json({
      error: err.message
    });
  }
};