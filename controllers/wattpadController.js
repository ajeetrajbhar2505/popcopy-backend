const { chromium } = require('playwright');
const fs = require('fs');

// 🔐 LOGIN CONTROLLER
exports.login = async (req, res) => {
  try {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }); const context = await browser.newContext(); const page = await context.newPage(); await page.goto('https://www.wattpad.com/login');; await page.waitForTimeout(5000); await context.storageState({ path: 'state.json' }); await browser.close(); res.json({ success: true, message: 'Logged in and session saved' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// 📖 SCRAPE CONTROLLER
exports.scrapeStory = async (req, res) => {
  try {
    const url = req.query.url;

    if (!url) {
      return res.status(400).json({
        error: 'Story URL is required (?url=...)'
      });
    }

    if (!fs.existsSync('state.json')) {
      return res.status(400).json({
        error: 'No session found. Run /login first.'
      });
    }

    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const context = await browser.newContext({
      storageState: 'state.json'
    });

    const page = await context.newPage();

    await page.goto(url, {
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(3000);

    const text = await page.evaluate(() => {
      return document.body.innerText
        .replace(/\s+\n/g, '\n')
        .trim();
    });

    await browser.close();

    res.json({
      success: true,
      data: text
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};