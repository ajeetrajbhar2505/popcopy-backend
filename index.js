const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    storageState: 'state.json'
  });

  const page = await context.newPage();

  await page.goto('https://www.wattpad.com/story/183675558-izuku-likes-you-izuku-x-reader');

  console.log(await page.content());

  await browser.close();
})();