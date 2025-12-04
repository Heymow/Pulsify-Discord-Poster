const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://discord.com/login');

    console.log('👉 Please log into your Discord account in the browser window.');
    console.log('✅ After logging in, press ENTER here.');

    await new Promise(resolve => process.stdin.once('data', resolve));

    await context.storageState({ path: 'discord-session.json' });

    console.log('🎉 Session saved! You can now post messages automatically.');
    await browser.close();
})();
