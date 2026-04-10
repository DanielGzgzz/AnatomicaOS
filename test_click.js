const playwright = require('playwright');
(async () => {
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('http://localhost:3000/fix_window_app.html', {waitUntil: 'networkidle'});
    await page.click('#test-btn');
    await page.waitForTimeout(500);

    await browser.close();
})();
