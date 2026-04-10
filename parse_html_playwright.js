const playwright = require('playwright');
(async () => {
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();

    let errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('CONSOLE ERROR:', msg.text());
            errors.push(msg.text());
        }
    });
    page.on('pageerror', err => {
        console.log('PAGE ERROR:', err.message);
        errors.push(err.message);
    });

    await page.goto('http://localhost:3000', {waitUntil: 'networkidle'});

    // Evaluate if app is available
    const appType = await page.evaluate(() => typeof window.app);
    console.log("App type on load:", appType);

    if (appType !== 'undefined') {
        // Try interacting
        await page.evaluate(() => {
            if (window.app.loadDemoData) window.app.loadDemoData();
            if (window.app.showModule) window.app.showModule('visualizer');
        });
        await page.waitForTimeout(2000);
    }

    console.log("TOTAL ERRORS:", errors.length);
    await browser.close();
})();
