const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false   // 👈 THIS IS IMPORTANT
  });

  const page = await browser.newPage();

  await page.goto('https://www.wattpad.com/login');

  // wait so you can login manually
  await page.waitForTimeout(60000); // 60 sec

  await page.goto('https://www.wattpad.com/story/183675558-izuku-likes-you-izuku-x-reader');

  console.log(await page.content());

  await browser.close();
})();