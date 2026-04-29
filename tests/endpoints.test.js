process.env.NODE_ENV = 'development'
const server = require('../src/index')

beforeAll(async () => {
    await server.ready()
    while (!global.browser) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}, 30000);


afterAll(async () => {
    global.finished = true
    await global.browser.close()
    await server.close()
})


test('Scraping Page Source from Cloudflare Protection', async () => {
    const response = await server.inject({
        method: 'POST',
        url: '/cf-clearance-scraper',
        payload: {
            url: 'https://nopecha.com/demo/cloudflare',
            mode: "source"
        }
    })
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.payload).code).toEqual(200)
}, 60000)


test('Creating a Turnstile Token With Site Key [min]', async () => {
    const response = await server.inject({
        method: 'POST',
        url: '/cf-clearance-scraper',
        payload: {
            url: 'https://turnstile.zeroclover.io/',
            siteKey: "0x4AAAAAAAEwzhD6pyKkgXC0",
            mode: "turnstile-min"
        }
    })
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.payload).code).toEqual(200)
}, 60000)

test('Creating a Turnstile Token With Site Key [max]', async () => {
    const response = await server.inject({
        method: 'POST',
        url: '/cf-clearance-scraper',
        payload: {
            url: 'https://turnstile.zeroclover.io/',
            mode: "turnstile-max"
        }
    })
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.payload).code).toEqual(200)
}, 60000)

test('Create Cloudflare WAF Session', async () => {
    const response = await server.inject({
        method: 'POST',
        url: '/cf-clearance-scraper',
        payload: {
            url: 'https://nopecha.com/demo/cloudflare',
            mode: "waf-session"
        }
    })
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.payload).code).toEqual(200)
}, 60000)