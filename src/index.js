const fastify = require('fastify')({ logger: false })
const cors = require('@fastify/cors')
const port = process.env.PORT || 3000
const authToken = process.env.authToken || null
const reqValidate = require('./module/reqValidate')

const pkg = require('../package.json')

global.browserLength = 0
global.browserLimit = Number(process.env.browserLimit) || 20
global.timeOut = Number(process.env.timeOut || 60000)

// Register CORS
fastify.register(cors)

// Health check endpoint
fastify.get('/', async (request, reply) => {
    return {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        status: global.browser ? 'ready' : 'initializing',
        activeSessions: global.browserLength,
        maxSessions: global.browserLimit,
        uptime: process.uptime()
    }
})

// Health check for Docker
fastify.get('/health', async (request, reply) => {
    if (process.env.SKIP_LAUNCH === 'true' || global.browser) {
        return { status: 'healthy' }
    } else {
        reply.code(503)
        return { status: 'initializing' }
    }
})

if (process.env.SKIP_LAUNCH != 'true') require('./module/createBrowser')

const getSource = require('./endpoints/getSource')
const solveTurnstileMin = require('./endpoints/solveTurnstile.min')
const solveTurnstileMax = require('./endpoints/solveTurnstile.max')
const wafSession = require('./endpoints/wafSession')

fastify.post('/cf-clearance-scraper', async (request, reply) => {
    const data = request.body

    const check = reqValidate(data)

    if (check !== true) {
        reply.code(400)
        return { code: 400, message: 'Bad Request', schema: check }
    }

    if (authToken && data.authToken !== authToken) {
        reply.code(401)
        return { code: 401, message: 'Unauthorized' }
    }

    if (global.browserLength >= global.browserLimit) {
        reply.code(429)
        return { code: 429, message: 'Too Many Requests' }
    }

    if (process.env.SKIP_LAUNCH != 'true' && !global.browser) {
        reply.code(500)
        return { code: 500, message: 'The scanner is not ready yet. Please try again a little later.' }
    }

    var result = { code: 500 }

    global.browserLength++

    switch (data.mode) {
        case "source":
            result = await getSource(data).then(res => { return { source: res, code: 200 } }).catch(err => { return { code: 500, message: err.message } })
            break;
        case "turnstile-min":
            result = await solveTurnstileMin(data).then(res => { return { token: res, code: 200 } }).catch(err => { return { code: 500, message: err.message } })
            break;
        case "turnstile-max":
            result = await solveTurnstileMax(data).then(res => { return { token: res, code: 200 } }).catch(err => { return { code: 500, message: err.message } })
            break;
        case "waf-session":
            result = await wafSession(data).then(res => { return { ...res, code: 200 } }).catch(err => { return { code: 500, message: err.message } })
            break;
    }

    global.browserLength--

    reply.code(result.code ?? 500)
    return result
})

// 404 handler
fastify.setNotFoundHandler(async (request, reply) => {
    reply.code(404)
    return { code: 404, message: 'Not Found' }
})

// Start server
const start = async () => {
    if (process.env.NODE_ENV !== 'development') {
        try {
            await fastify.listen({ port: port, host: '0.0.0.0' })
            console.log(`🕵️ Cloak Clearance Scraper v${pkg.version} running on port ${port}`)
            console.log(`📖 API Documentation: http://localhost:${port}/`)
        } catch (err) {
            fastify.log.error(err)
            process.exit(1)
        }
    }
}

start()

if (process.env.NODE_ENV == 'development') module.exports = fastify
