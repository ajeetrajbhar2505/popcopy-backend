// login.js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false // 👈 allows manual login
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://www.wattpad.com/login');

  console.log('👉 Login manually within 60 seconds...');
  await page.waitForTimeout(60000);

  // ✅ Save session
  await context.storageState({ path: 'state.json' });

  console.log('✅ Session saved to state.json');

  await browser.close();
})();