const { launch } = require("cloak-real-puppeteer-core")

const useHeadless = () => {
    if (process.env.HEADLESS === 'true') return true
    if (process.env.HEADLESS === 'false') return false
    return process.platform === 'linux' && !process.env.DISPLAY
}

async function createBrowser() {
    try {
        if (global.finished == true) return

        global.browser = null
        global.browserError = null

        console.log(`Launching CloakBrowser... headless=${useHeadless()} display=${process.env.DISPLAY || 'none'}`);

        const args = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]

        const browser = await launch({
            headless: useHeadless(),
            humanize: true,
            args,
            launchOptions: {
                defaultViewport: null,
                args
            }
        })

        console.log('CloakBrowser launched');

        global.browser = browser;

        browser.on('disconnected', async () => {
            if (global.finished == true) return
            console.log('Browser disconnected');
            await new Promise(resolve => setTimeout(resolve, 3000));
            await createBrowser();
        })

    } catch (e) {
        global.browserError = e?.stack || e?.message || String(e)
        console.error('Failed to launch CloakBrowser:', global.browserError);
        if (global.finished == true) return
        await new Promise(resolve => setTimeout(resolve, 3000));
        await createBrowser();
    }
}
createBrowser()
