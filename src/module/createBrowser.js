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

        // console.log('Launching the browser...');

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

        // console.log('Browser launched');

        global.browser = browser;

        browser.on('disconnected', async () => {
            if (global.finished == true) return
            console.log('Browser disconnected');
            await new Promise(resolve => setTimeout(resolve, 3000));
            await createBrowser();
        })

    } catch (e) {
        console.log(e.message);
        if (global.finished == true) return
        await new Promise(resolve => setTimeout(resolve, 3000));
        await createBrowser();
    }
}
createBrowser()
